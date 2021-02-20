import config from './config.js';
import {ensureAuthenticated} from './common';

let db;

function registerUser(req, oauthcode,displayName,status,callback){
	var stmt = db.prepare("INSERT INTO oauthusers VALUES (NULL, ?, ?, ?,0)");
	  stmt.run(oauthcode, displayName, status,function(err){
		  req.user.id = this.lastID;
		  if(callback){
			  callback();
		  }
	  });  
}

export default function(app) {
	db = app.db;
	
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

	app.get('/logout', function(req, res){
		req.logout();
		res.redirect(config.BASEURL);
	});
	  
	app.post('/registration', function(req,res){
		registerUser(req,req.user.oauthcode, req.body.displayName,"registered",function(){
			res.redirect(config.BASEURL);
		});
	});
	
	app.get('/account', ensureAuthenticated, function(req, res){
		res.render('account', { user: req.user, baseurl: config.BASEURL });
	});
	
	app.get('/login', function(req, res){
		res.render('login', { user: req.user, baseurl: config.BASEURL, message: req.flash('loginMessage') });
	});
}