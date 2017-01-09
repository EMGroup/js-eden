var config = require("./config.js");

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
  , TwitterStrategy = require("passport-twitter")
  , FacebookStrategy = require("passport-facebook");

var db;

var exports = module.exports = {
		
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
			db.get('SELECT userid, oauthstring, name FROM oauthusers WHERE userid = ?', obj.id, function(err, row){
				user = {displayName: row.name, id: row.userid, oauthstring: row.oauthstring};
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
	    // asynchronous verification, for effect...
	    process.nextTick(function () {
	      
	      // To keep the example simple, the user's Google profile is returned to
	      // represent the logged-in user.  In a typical application, you would want
	      // to associate the Google account with a user record in your database,
	      // and return that user instead.
	      return done(null, profile);
	    });
	  }
	));

	passport.use(new TwitterStrategy({
	    consumerKey: config.TWITTER_CONSUMER_KEY,
	    consumerSecret: config.TWITTER_CONSUMER_SECRET,
	    callbackURL: config.BASEURL + "/auth/twitter/callback"
	  },
	  function(token, tokenSecret, profile, done) {
		// asynchronous verification, for effect...
		    process.nextTick(function () {
		      
		      // To keep the example simple, the user's Google profile is returned to
		      // represent the logged-in user.  In a typical application, you would want
		      // to associate the Google account with a user record in your database,
		      // and return that user instead.
		      return done(null, profile);
		    });
	  }
	));

	passport.use(new FacebookStrategy({
		clientID: config.FACEBOOK_CLIENTID,
		clientSecret: config.FACEBOOK_CLIENT_SECRET,
		callbackURL: config.BASEURL + "/auth/facebook/callback"
	}, function (token, tokenSecret, profile, done){
		process.nextTick(function(){
			return done(null, profile);
		});
	}
	));
};

