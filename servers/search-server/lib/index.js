"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _express = _interopRequireDefault(require("express"));

var _passport = _interopRequireDefault(require("passport"));

var _cookieParser = _interopRequireDefault(require("cookie-parser"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _expressSession = _interopRequireDefault(require("express-session"));

var _config = _interopRequireDefault(require("./config.js"));

var _database = _interopRequireDefault(require("./database"));

require("./eden");

var _project = _interopRequireDefault(require("./project"));

var _search = _interopRequireDefault(require("./search"));

var _comments = _interopRequireDefault(require("./comments"));

var _social = _interopRequireDefault(require("./social"));

var passportUsers = _interopRequireWildcard(require("./passport-users.js"));

var _common = require("./common");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

require(_config["default"].JSEDENPATH + "js/lib/diff_match_patch.js");

passportUsers.setupPassport(_passport["default"], _database["default"]);

var flash = require('connect-flash');

var app = (0, _express["default"])();

function logErrors(err, req, res, next) {
  console.error(new Date().toISOString() + ": " + str);
  console.error(err.stack);
  res.status(500);
  res.json({
    "error": "Error"
  });
} // configure Express


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use((0, _cookieParser["default"])());
app.use(_bodyParser["default"].urlencoded({
  limit: '5mb'
}));
app.use(_express["default"]["static"]("static"));
app.use(logErrors);
app.use(flash());
app.use(function (req, res, next) {
  var allowedOrigins = ["http://localhost:8000", "http://127.0.0.1:8000", "http://emgroup.github.io", "http://jseden.dcs.warwick.ac.uk", "http://construit.co.uk"];
  var corsOrigin = "http://localhost:8000";

  if (typeof req.headers.origin != 'undefined' && allowedOrigins.indexOf(req.headers.origin) > -1) {
    corsOrigin = req.headers.origin;
  } else if (typeof req.headers["jseden-origin"] != 'undefined') {
    corsOrigin = req.headers["jseden-origin"];
  }

  res.header("Access-Control-Allow-Origin", corsOrigin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, JSEDEN-ORIGIN");
  next();
});
app.use((0, _expressSession["default"])({
  secret: _config["default"].SESSION_SECRET
}));
app.use(_passport["default"].initialize());
app.use(_passport["default"].session());
app.get('/', function (req, res) {
  if (req.user !== undefined && req.user.id == null) {
    res.render('registration', {
      user: req.user,
      baseurl: _config["default"].BASEURL
    });
  } else if (req.user !== undefined && req.user.status == "localunregistered") {
    res.render('editprofile', {
      user: req.user,
      baseurl: _config["default"].BASEURL
    });
  } else {
    res.render('index', {
      user: req.user,
      baseurl: _config["default"].BASEURL
    });
  }
});
app.get('/index', function (req, res) {
  if (req.user !== undefined && req.user.id == null) {
    res.render('registration', {
      user: req.user,
      baseurl: _config["default"].BASEURL
    });
  } else if (req.user !== undefined && req.user.status == "localunregistered") {
    res.render('editprofile', {
      user: req.user,
      baseurl: _config["default"].BASEURL
    });
  } else {
    res.render('index', {
      user: req.user,
      baseurl: _config["default"].BASEURL
    });
  }
});
app.post("/updateprofile", _common.ensureAuthenticated, function (req, res) {
  var displayName = req.body.displayName;

  var stmt = _database["default"].prepare("UPDATE oauthusers SET name = ?, status = \"registered\" WHERE oauthstring = ?");

  stmt.run(req.body.displayName, req.user.oauthstring, function (err) {
    if (err) {
      res.json({
        error: ERROR_SQL,
        description: "SQL Error",
        err: err
      });
    } else {
      res.redirect(_config["default"].BASEURL);
    }
  });
});
app.get('/join', function (req, res) {
  res.render('joincommunity', {
    user: req.user,
    baseurl: _config["default"].BASEURL
  });
});
app.get('/user/details', function (req, res) {
  var u = null;

  if (typeof req.user != "undefined") {
    u = {
      id: req.user.id,
      name: req.user.displayName
    };
  }

  res.json(u);
}); // GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback

app.get('/auth/google', _passport["default"].authenticate('google', {
  scope: ['https://www.googleapis.com/auth/userinfo.email']
}));
app.get('/auth/twitter', _passport["default"].authenticate('twitter'));
app.get('/auth/facebook', _passport["default"].authenticate('facebook'));
app.post('/auth/locallogin', _passport["default"].authenticate('local-login', {
  failureRedirect: _config["default"].BASEURL + '/login'
}), function (req, res) {
  res.redirect(_config["default"].BASEURL + '/');
});
app.post('/auth/localsignup', _passport["default"].authenticate('local-signup', {
  failureRedirect: _config["default"].BASEURL + '/login'
}), function (req, res) {
  if (req.flash('signUpMessage') == "form") {
    res.render('joined');
    req.logout();
  } else {
    res.redirect(_config["default"].BASEURL + '/');
  }
}); // GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.

app.get('/auth/google/callback', _passport["default"].authenticate('google', {
  failureRedirect: _config["default"].BASEURL + '/login'
}), function (req, res) {
  res.redirect(_config["default"].BASEURL);
});
app.get('/auth/twitter/callback', _passport["default"].authenticate('twitter', {
  failureRedirect: _config["default"].BASEURL + '/login'
}), function (req, res) {
  // Successful authentication, redirect home.
  res.redirect(_config["default"].BASEURL);
});
app.get('/auth/facebook/callback', _passport["default"].authenticate('facebook', {
  failureRedirect: _config["default"].BASEURL + '/login'
}), function (req, res) {
  // Successful authentication, redirect home.
  res.redirect(_config["default"].BASEURL);
});
app.get('/logout', function (req, res) {
  req.logout();
  res.redirect(_config["default"].BASEURL);
}); // Add components

(0, _project["default"])(app);
(0, _comments["default"])(app);
(0, _social["default"])(app);
(0, _search["default"])(app).then(function () {
  app.listen(_config["default"].PORT);
  console.log("Ready on port ".concat(_config["default"].PORT).green.bold);
});