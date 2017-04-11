var config = require("./config.js");

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
  , TwitterStrategy = require("passport-twitter")
  , FacebookStrategy = require("passport-facebook")
  , LocalStrategy = require("passport-local").Strategy;

var bcrypt = require('bcrypt-nodejs');

var randomstring = require('randomstring');
const nodemailer = require('nodemailer');

var db;


//create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
  host: config.MAILSMTP,
  port: 587
});


var exports = module.exports = {
		
};
var Users = {};

module.exports.Users = Users;

Users.findByEmail = function(email,callback){
	db.get('SELECT localuserID,hashedPassword FROM localusers WHERE emailaddress = ?',email,function(err,row){
		if(!row){
			callback(false);
		}else{
			callback({localuserID: row.localuserID, passwordhash: row.hashedPassword});
		}
	});
};

Users.addUser = function(email,password,callback){
	var passHash = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
	var stmt = db.prepare("INSERT INTO localusers VALUES (NULL,?,?);");
	stmt.run(email,passHash,function(err){
		if(!err){
			callback(this.lastID);
		}else{
			callback(false);
		}
	});
};

module.exports.setupPassport = function(passport,database){
	db = database;
	passport.serializeUser(function(user, done) {
		var oauthcode = user.provider + ":" + user.id;
		db.serialize(function(){
		db.get('SELECT userid FROM oauthusers WHERE oauthstring = ?', oauthcode, function(err,row){
			if(!row){
				return done(null, {id: null, oauthcode: oauthcode, displayName: user.displayName});
			}else{
				return done(null, {id: row.userid});
			}
			});
		});
	});


	passport.deserializeUser(function(obj, done) {
		if(obj.id == null){
			return done(null, obj);
		}else{
			db.get('SELECT userid, oauthstring, name, status, isAdmin FROM oauthusers WHERE userid = ?', obj.id, function(err, row){
				user = {displayName: row.name, id: row.userid, oauthstring: row.oauthstring, status: row.status, admin: row.isAdmin};
				return done(null, user);
			});
		}
	});


	// Use the GoogleStrategy within Passport.
	//   Strategies in Passport require a `verify` function, which accept
	//   credentials (in this case, an accessToken, refreshToken, and Google
	//   profile), and invoke a callback with a user object.
	passport.use(new GoogleStrategy({
	    clientID: config.GOOGLE_CLIENT_ID,
	    clientSecret: config.GOOGLE_CLIENT_SECRET,
	callbackURL: config.BASEURL + "/auth/google/callback"
	  },
	  function(accessToken, refreshToken, profile, done) {
	    process.nextTick(function () {
		  return done(null,profile);
	    });
	  }
	));

	passport.use(new TwitterStrategy({
	    consumerKey: config.TWITTER_CONSUMER_KEY,
	    consumerSecret: config.TWITTER_CONSUMER_SECRET,
	    callbackURL: config.BASEURL + "/auth/twitter/callback"
	  },
	  function(token, tokenSecret, profile, done) {
		  process.nextTick(function () {
//			  console.log(profile);
			  return done(null,profile);
		    });
	  }
	));

	passport.use(new FacebookStrategy({
		clientID: config.FACEBOOK_CLIENTID,
		clientSecret: config.FACEBOOK_CLIENT_SECRET,
		callbackURL: config.BASEURL + "/auth/facebook/callback"
	}, function (token, tokenSecret, profile, done){
		process.nextTick(function () {
			  return done(null,profile);
		    });
	}
	));
	
	passport.use('local-login',new LocalStrategy(
			{passReqToCallback:true},
			  function(req,username, password, done) {
				  	process.nextTick(function () {
				  		Users.findByEmail(username, function(userobject){
				  			if(userobject && bcrypt.compareSync(password,userobject.passwordhash)){
				  				var thisUser = {};
				  				thisUser.email = username;
				  				thisUser.provider = "local";
				  				thisUser.id = userobject.localuserID;
			  					return done(null,thisUser);
				  			}else{
				  				return done(null,false,req.flash('loginMessage','Invalid account details'));
				  			}
				  		});
				  	});
				  }
				));
	
	passport.use('local-signup',new LocalStrategy(
			{passReqToCallback: true},
			  function(req,username, password, done) {
				console.log("Inside localsignup");
				var displayName = req.body.displayname;
				if(req.query.origin == "form"){
					password = randomstring.generate(8);
				}
				  	process.nextTick(function () {
				  		Users.findByEmail(username,function(userobject){
				  			//console.log("Userobject", userobject);
				  			if(userobject == false){
				  				var newUser ={};
				  				newUser.email = username;
				  				newUser.provider = "local";
				  				Users.addUser(username,password,function(userid){
				  					if(userid){
				  						newUser.id = userid;
										var status = "registered";
									  	passport.registerUser(req, "local:" + newUser.id,displayName,status,function(newUserID){
									  		user = {displayName: displayName, id: newUser.id, provider: "local", oauthstring: "local:" + newUser.id};
									  		return done(null, user);
										});
				  					}else{
				  						return done(null,false,req.flash('signUpMessage','Error creating account'));
				  					}
				  				});
				  			}else{
				  				return done(null,false,req.flash('signUpMessage','Email address already taken'));
				  			}
				  		});
					    });
				  }
				));
	
	passport.registerUser = function(req, oauthcode,displayName,status,callback){
		  var stmt = db.prepare("INSERT INTO oauthusers VALUES (NULL, ?, ?,?,0)");
			stmt.run(oauthcode, displayName, status,function(err){
				if(callback){
					callback(this.lastID);
				}
			});  
	  }
};

