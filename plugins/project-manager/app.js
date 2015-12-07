var express = require('express')
  , passport = require('passport')
  , util = require('util')
  , GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
  , TwitterStrategy = require("passport-twitter")
 , cookieParser = require("cookie-parser")
 , bodyParser = require("body-parser")
 , methodOverride = require("method-override")
, session = require("express-session");
var sqlite3 = require("sqlite3").verbose();
var config = require("./config.js");
var db = new sqlite3.Database('database.sqlite3');

var insertAgentStmt;
// API Access link for creating client ID and secret:
// https://code.google.com/apis/console/


passport.serializeUser(function(user, done) {
	var oauthcode = user.provider + ":" + user.id;
	db.serialize(function(){
	db.get('SELECT id FROM oauthusers WHERE oauthstring = ?', oauthcode, function(err,row){
		if(!row){
			var stmt = db.prepare("INSERT INTO oauthusers VALUES (NULL, ?, ?)");
			stmt.run(oauthcode, user.displayName, function(){
				return done(null, this.lastID);
			});
			
			}else{
			return done(null, row.id);
		}
		});
	});
});


passport.deserializeUser(function(obj, done) {
	db.get('SELECT id, oauthstring, name FROM oauthusers WHERE id = ?', obj, function(err, row){
		user = {displayName: row.name, id: row.id, oauthstring: row.oauthstring}
		return done(null, user);
	});
});


// Use the GoogleStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Google
//   profile), and invoke a callback with a user object.
passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://"+config.HOSTNAME + ":" + config.PORT + "/auth/google/callback"
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
    callbackURL: "http://"+config.HOSTNAME + ":" + config.PORT + "/auth/twitter/callback"
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





var app = express();

// configure Express
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(cookieParser());
  app.use(bodyParser());
  app.use(express.static("static"));
  
  app.use(function(req, res, next) {
	  res.header("Access-Control-Allow-Origin", "http://localhost:8000");
	  res.header("Access-Control-Allow-Credentials","true");
	  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	  next();
	});
  
  app.use(session({ secret: config.SESSION_SECRET }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(__dirname + '/public'));


app.get('/', function(req, res){
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

function insertPath(pathParts,depth, finalTitle, finalCallback){
	//Recursively insert paths to make sure there is an entry for each level
	//so that each level can be found by the /agent/search method 
	if(depth == pathParts.length + 1)
		return finalCallback();	
	var tmpPath = pathParts[0];
	for(var i = 1; i < depth; i++){
		tmpPath = tmpPath + "/" + pathParts[i]; 
	}
	var tmpTitle = tmpPath;
	if(depth == pathParts.length)
		tmpTitle = finalTitle;
	insertAgentStmt.run(tmpTitle, tmpPath, function(){
		insertPath(pathParts, depth+1, finalTitle, finalCallback);		
	});
}

app.post('/agent/add', ensureAuthenticated, function(req, res){
	//Requires POST variables of title, path, source, tag, parent
	insertAgentStmt = db.prepare("INSERT OR IGNORE INTO agents VALUES (NULL, ?,?)");
	if(typeof req.user == "undefined")
		return res.json({error: "1", description: "Unauthenticated"});

	db.serialize(function(){
		var pathParts = req.body.path.split("/");

		insertPath(pathParts,0,req.body.title, function(){
			var sstmt = db.prepare("SELECT id FROM agents WHERE path = ?");

			sstmt.get(req.body.path, function(err,row){
				if(typeof row != "undefined"){
					var vstmt = db.prepare("INSERT INTO versions VALUES (NULL, ?,?,?,?,current_timestamp,?,?,?,?)");
					var group = null;
					var permission = 0;
					if(req.body.permission == "public")
						permission = 1;
					var agentID = row["id"];
					if(req.body.tag == "OFFICIAL"){
						var checkOwner = db.prepare("SELECT owner FROM versions WHERE agentID = ? ORDER BY date ASC LIMIT 1");
						checkOwner.all(agentID, function(err,rows){
							if(rows[0]["owner"] == req.user.id){
								console.log(res);
								doInsert(vstmt, agentID, req.body.source, req.body.tag, req.body.parent, req.user.id, permission, req.body.title, group, res);
							}else{
								return res.json({error: "2", description: "Not Official Owner"});
							}
						});						
					}else{
						doInsert(vstmt, agentID, req.body.source, req.body.tag, req.body.parent, req.user.id, permission, req.body.title, group, res);
					}

				}
			});			
		});
	});
});

function doInsert(vstmt, agentID, source, tag, parent, id, permission, title, group, res){
	vstmt.run(agentID, source, tag, parent, id, permission, title, group,function(a){
		var saveID = this.lastID;
		res.json({agent: agentID, saveID: saveID});
	});
}
	
app.get('/agent/list', function(req, res){
	var stmt = db.prepare("SELECT versions.agentID, agents.title, agents.path, versions.saveID " +
			"FROM agents, versions WHERE agents.agentID = versions.agentID AND versions.owner = ?");
	stmt.all(req.user.id, function(err,rows){
		res.json(rows);
	});
});

app.get('/agent/get', function(req, res){
	var argArray = [];
	
	var query = "SELECT path, saveID, source, tag, parentSaveID, date, name, versions.title FROM versions, agents, oauthusers WHERE ";
	var validQuery = false;
	var tag = "OFFICIAL";
	if(typeof(req.query.tag) != "undefined"){
		tag = req.query.tag;
	}else if(typeof(req.query.version != "undefined")){
		tag = null;
	}
	
	if(typeof(req.query.path) != "undefined"){
		query = query + "path = ?";
		argArray.push(req.query.path)	;
		validQuery = true;
	}
	if(typeof(req.query.version) != "undefined"){
		if(validQuery)
			query = query + " AND";
		query = query + " saveID = ?";
		argArray.push(req.query.version);
		validQuery = true;
	}
	if(tag){
		query = query + " AND tag = ?";
		argArray.push(req.query.tag);
	}
	if(!validQuery)
		return res.json({error: "3", description: "Request requires either a path or a version" });
	
	query = query + " AND owner = oauthusers.id AND agents.id = agentID AND (owner = ? OR permission = 1) ORDER BY date desc LIMIT 1";
	var stmt = db.prepare(query);

	var tmpUser = -1;
	if(typeof req.user != "undefined")
		tmpUser = req.user.id;

	argArray.push(tmpUser);
	
	stmt.get(argArray, function(err,row){
		res.json(row);
	});
});
// /agent/get - returns source (only), has optional version parameter, my version/ public version? Version tag

//Need new table, version, with path, versionid with complete source, current version



app.get('/agent/search', function(req, res){
	var depth = 1;
	var expected = 0;
	var counted = 0;

	if(typeof(req.query.depth) != "undefined"){
		depth = req.query.depth;
	}
	var match = req.query.path + "/%";
	if(typeof(req.query.path) == "undefined" || req.query.path == ""){
		match = "%";
	}
	var notmatch = match;
	for(var i = 0; i < depth; i++){
		var notmatch = notmatch + "/%";
	}

	var stmt = db.prepare("SELECT id, path FROM agents where path LIKE ? AND path NOT LIKE ?");
	var agents = [];
	var tmpUser = -1;
	if(typeof req.user != "undefined")
		tmpUser = req.user.id;
	
	db.serialize(function(){
		stmt.each(match, notmatch, function(err,row){
			var p = row["path"];
			var a = row["id"];
			var vstmt = db.prepare("SELECT path, saveID, tag, parentSaveID, date, name, title FROM versions, oauthusers where " +
			"owner = oauthusers.id AND versions.agentID = ? AND owner = ? ORDER BY date desc limit 1");

			var myVersion;

			vstmt.all(a, tmpUser, function(err,rows){
				myVersion = rows;

				var vstmt2 = db.prepare("SELECT path, saveID, tag, parentSaveID, date, name, title FROM versions, oauthusers where " +
				"owner = oauthusers.id AND versions.agentID = ? AND permission = 1 ORDER BY date desc limit 1");

				var publicVersion;

				vstmt2.all(a, function(err,rows){
					publicVersion = rows;

					var vstmt3 = db.prepare("SELECT path, saveID, tag, parentSaveID, date, name, title FROM versions, oauthusers where " +
					"owner = oauthusers.id AND versions.agentID = ? AND tag = 'OFFICIAL' AND permission = 1 ORDER BY date desc limit 1");
					var officialVersion;
					vstmt3.all(a, function(err,rows){
						officialVersion = rows;

						versions = {"Official": officialVersion, "PublicLatest": publicVersion, "UserLatest": myVersion};

						var agent = {path: p, versions: versions};

						counted++;

						agents.push(agent);
						if (counted == expected) {
							res.json(agents);
						}
					});
				});
			});
		},function(err,num){
			expected = num;
			if(num == 0)
				res.json(null);
		});
	});
});

app.get('/agent/versions', function(req, res){
	var vstmt = db.prepare("SELECT path, saveID, tag, parentSaveID, date, name, owner, versions.title, permission FROM versions, oauthusers, agents where " +
	"path = ? AND agents.id = versions.agentID AND owner = oauthusers.id AND (oauthusers.id = ? OR permission = 1) ORDER BY date desc LIMIT 100 OFFSET ?");
	var tmpUser = -1;
	if(typeof req.user != "undefined")
		tmpUser = req.user.id;
	
	var offset = 0;
	if(typeof req.query.offset != "undefined")
		offset = req.query.offset;
	
	vstmt.all(req.query.path, tmpUser, offset, function(err,rows){
		for(var i = 0; i < rows.length; i++){
			if(rows[i]["permission"] == 1)
				rows[i]["public"] = true;
			else
				rows[i]["public"] = false;
				
			delete rows[i]["permission"];
			
			if(rows[i]["owner"] == tmpUser)
				rows[i]["mine"] = true;
			else
				rows[i]["mine"] = false;

			delete rows[i]["owner"];
		}
		res.json(rows);
	});
});

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.email'] }));


app.get('/auth/twitter', passport.authenticate('twitter'));

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/auth/twitter/callback', 
		  passport.authenticate('twitter', { failureRedirect: '/login' }),
		  function(req, res) {
		    // Successful authentication, redirect home.
		    res.redirect('/');
		  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(config.PORT);


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
	if(req.user) {return next();}
  res.status(403).send('logout');
}
