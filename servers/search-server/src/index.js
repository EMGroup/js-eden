import express from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import config from './config.js';
import db from './database';
import './eden';

require(config.JSEDENPATH + "js/lib/diff_match_patch.js");

import project from './project';
import search from './search';
import comments from './comments';
import social from './social';
import * as passportUsers from './passport-users.js';
import {ensureAuthenticated} from './common';

passportUsers.setupPassport(passport,db);

var flash = require('connect-flash');
var app = express();

function logErrors(err,req,res,next){
	console.error(new Date().toISOString() + ": " + str);
	console.error(err.stack);
	res.status(500);
	res.json({"error": "Error"});
}

// configure Express
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser.urlencoded({limit: '5mb'}));
app.use(express.static("static"));
app.use(logErrors);
app.use(flash());

app.use(function(req, res, next) {
	var allowedOrigins = ["http://localhost:8000","http://127.0.0.1:8000","http://emgroup.github.io","http://jseden.dcs.warwick.ac.uk", "http://construit.co.uk"];
	var corsOrigin = "http://localhost:8000";
	if(typeof(req.headers.origin) != 'undefined' && allowedOrigins.indexOf(req.headers.origin) > -1){
	corsOrigin = req.headers.origin;
	}else if(typeof(req.headers["jseden-origin"]) != 'undefined'){
	corsOrigin = req.headers["jseden-origin"];
	}
	res.header("Access-Control-Allow-Origin", corsOrigin);
	res.header("Access-Control-Allow-Credentials","true");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, JSEDEN-ORIGIN");
next();
});

app.use(session({ secret: config.SESSION_SECRET }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', function(req, res){
	if(req.user !== undefined && req.user.id == null){
		res.render('registration', { user: req.user, baseurl: config.BASEURL});  
	}else if(req.user !== undefined && req.user.status == "localunregistered"){
		res.render('editprofile', { user: req.user, baseurl: config.BASEURL});
	}else{
		res.render('index', { user: req.user, baseurl: config.BASEURL });
	}
});
app.get('/index',function(req,res){
	if(req.user !== undefined && req.user.id == null){
		res.render('registration', { user: req.user, baseurl: config.BASEURL});  
	}else if(req.user !== undefined && req.user.status == "localunregistered"){
		res.render('editprofile', { user: req.user, baseurl: config.BASEURL});
	}else{
		res.render('index', { user: req.user, baseurl: config.BASEURL });
	}
});

app.post("/updateprofile",ensureAuthenticated, function(req,res){
	var displayName = req.body.displayName;
	var stmt = db.prepare("UPDATE oauthusers SET name = ?, status = \"registered\" WHERE oauthstring = ?");
	stmt.run(req.body.displayName, req.user.oauthstring,function(err){
		if(err){
			res.json({error: ERROR_SQL, description: "SQL Error", err:err});
		}else{
			res.redirect(config.BASEURL);
		}
	});
});

app.get('/join',function(req,res){
	res.render('joincommunity', { user: req.user, baseurl: config.BASEURL });
});

app.get('/user/details', function(req, res){
	var u = null;

	if(typeof req.user != "undefined"){
		u = {id: req.user.id, name : req.user.displayName};
	}
	res.json(u);
});

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.email'] }));

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/facebook', passport.authenticate('facebook'));


app.post('/auth/locallogin',passport.authenticate('local-login',
		{failureRedirect: config.BASEURL + '/login'}),
		function(req,res){res.redirect(config.BASEURL + '/');}
);

app.post('/auth/localsignup',passport.authenticate('local-signup',
		{failureRedirect: config.BASEURL + '/login'}),
		function(req,res){
	if(req.flash('signUpMessage') == "form"){
		res.render('joined');
		req.logout();
	}else{
		res.redirect(config.BASEURL + '/');
	}
	}
);

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: config.BASEURL + '/login' }),
  function(req, res) {
    res.redirect(config.BASEURL);
  });

app.get('/auth/twitter/callback', 
		  passport.authenticate('twitter', { failureRedirect: config.BASEURL + '/login' }),
		  function(req, res) {
		    // Successful authentication, redirect home.
		    res.redirect(config.BASEURL);
		  });

app.get('/auth/facebook/callback', 
		  passport.authenticate('facebook', { failureRedirect: config.BASEURL + '/login' }),
		  function(req, res) {
		    // Successful authentication, redirect home.
		    res.redirect(config.BASEURL);
		  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect(config.BASEURL);
});


// Add components
project(app);
comments(app);
social(app);
search(app).then(() => {
	app.listen(config.PORT);
	console.log(`Ready on port ${config.PORT}`.green.bold);
});
