import config from './config.js';
import {ensureAuthenticated} from './common';

let db;

async function registerUser(req, oauthstring,displayName,status){
	const user = await db.models.oauthusers.create({
		name: displayName,
		status,
		oauthstring,
	});
	req.user.id = user.userid; 
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
	
	app.post("/updateprofile",ensureAuthenticated, async (req,res) => {
		const {displayName} = req.body;

		try {
			await app.models.oauthusers.update(
				{name: displayName},
				{where: {oauthstring: req.user.oauthstring}}
			);
			res.redirect(config.BASEURL);
		} catch(err) {
			res.status(400).json({error: ERROR_SQL, description: "SQL Error", err});
		}
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
	  
	app.post('/registration', async (req,res) => {
		if (!req.user) {
			res.status(403).json({error: "Not logged in"});
			return;
		}
		await registerUser(req,req.user.oauthcode, req.body.displayName,"registered");
		res.redirect(config.BASEURL);
	});
	
	app.get('/account', ensureAuthenticated, function(req, res){
		res.render('account', { user: req.user, baseurl: config.BASEURL });
	});
	
	app.get('/login', function(req, res){
		res.render('login', { user: req.user, baseurl: config.BASEURL, message: req.flash('loginMessage') });
	});
}