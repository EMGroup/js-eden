"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setupPassport = setupPassport;
exports.Users = void 0;

var _config = _interopRequireDefault(require("./config.js"));

var _passportGoogleOauth = _interopRequireDefault(require("passport-google-oauth"));

var _passportTwitter = _interopRequireDefault(require("passport-twitter"));

var _passportFacebook = _interopRequireDefault(require("passport-facebook"));

var _passportLocal = _interopRequireDefault(require("passport-local"));

var _bcryptNodejs = _interopRequireDefault(require("bcrypt-nodejs"));

var _randomstring = _interopRequireDefault(require("randomstring"));

var _nodemailer = _interopRequireDefault(require("nodemailer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var LocalStrategy = _passportLocal["default"].Strategy;
var GoogleStrategy = _passportGoogleOauth["default"].OAuth2Strategy;
var db; //create reusable transporter object using the default SMTP transport

var transporter = _nodemailer["default"].createTransport({
  host: _config["default"].MAILSMTP,
  port: 587
});

var Users = {};
exports.Users = Users;

Users.findByEmail = function (email, callback) {
  db.get('SELECT localuserID,hashedPassword FROM localusers WHERE emailaddress = ?', email, function (err, row) {
    if (!row) {
      callback(false);
    } else {
      callback({
        localuserID: row.localuserID,
        passwordhash: row.hashedPassword
      });
    }
  });
};

Users.addUser = function (email, password, callback) {
  var passHash = _bcryptNodejs["default"].hashSync(password, _bcryptNodejs["default"].genSaltSync(8), null);

  var stmt = db.prepare("INSERT INTO localusers VALUES (NULL,?,?);");
  stmt.run(email, passHash, function (err) {
    if (!err) {
      callback(this.lastID);
    } else {
      callback(false);
    }
  });
};

function setupPassport(passport, database) {
  db = database;
  passport.serializeUser(function (user, done) {
    var oauthcode = user.provider + ":" + user.id;
    db.serialize(function () {
      db.get('SELECT userid FROM oauthusers WHERE oauthstring = ?', oauthcode, function (err, row) {
        if (!row) {
          return done(null, {
            id: null,
            oauthcode: oauthcode,
            displayName: user.displayName
          });
        } else {
          return done(null, {
            id: row.userid
          });
        }
      });
    });
  });
  passport.deserializeUser(function (obj, done) {
    if (obj.id == null) {
      return done(null, obj);
    } else {
      db.get('SELECT userid, oauthstring, name, status, isAdmin FROM oauthusers WHERE userid = ?', obj.id, function (err, row) {
        var user = {
          displayName: row.name,
          id: row.userid,
          oauthstring: row.oauthstring,
          status: row.status,
          admin: row.isAdmin
        };
        return done(null, user);
      });
    }
  }); // Use the GoogleStrategy within Passport.
  //   Strategies in Passport require a `verify` function, which accept
  //   credentials (in this case, an accessToken, refreshToken, and Google
  //   profile), and invoke a callback with a user object.

  passport.use(new GoogleStrategy({
    clientID: _config["default"].GOOGLE_CLIENT_ID,
    clientSecret: _config["default"].GOOGLE_CLIENT_SECRET,
    callbackURL: _config["default"].BASEURL + "/auth/google/callback"
  }, function (accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }));
  passport.use(new _passportTwitter["default"]({
    consumerKey: _config["default"].TWITTER_CONSUMER_KEY,
    consumerSecret: _config["default"].TWITTER_CONSUMER_SECRET,
    callbackURL: _config["default"].BASEURL + "/auth/twitter/callback"
  }, function (token, tokenSecret, profile, done) {
    process.nextTick(function () {
      //			  console.log(profile);
      return done(null, profile);
    });
  }));
  passport.use(new _passportFacebook["default"]({
    clientID: _config["default"].FACEBOOK_CLIENTID,
    clientSecret: _config["default"].FACEBOOK_CLIENT_SECRET,
    callbackURL: _config["default"].BASEURL + "/auth/facebook/callback"
  }, function (token, tokenSecret, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }));
  passport.use('local-login', new LocalStrategy({
    passReqToCallback: true
  }, function (req, username, password, done) {
    process.nextTick(function () {
      Users.findByEmail(username, function (userobject) {
        if (userobject && _bcryptNodejs["default"].compareSync(password, userobject.passwordhash)) {
          var thisUser = {};
          thisUser.email = username;
          thisUser.provider = "local";
          thisUser.id = userobject.localuserID;
          return done(null, thisUser);
        } else {
          return done(null, false, req.flash('loginMessage', 'Invalid account details'));
        }
      });
    });
  }));
  passport.use('local-signup', new LocalStrategy({
    passReqToCallback: true
  }, function (req, username, password, done) {
    console.log("Inside localsignup");
    var displayName = req.body.displayname;

    if (req.query.origin == "form") {
      password = _randomstring["default"].generate(8);
    }

    process.nextTick(function () {
      Users.findByEmail(username, function (userobject) {
        //console.log("Userobject", userobject);
        if (userobject == false) {
          var newUser = {};
          newUser.email = username;
          newUser.provider = "local";
          Users.addUser(username, password, function (userid) {
            if (userid) {
              newUser.id = userid;
              var status = "registered";
              passport.registerUser(req, "local:" + newUser.id, displayName, status, function (newUserID) {
                user = {
                  displayName: displayName,
                  id: newUser.id,
                  provider: "local",
                  oauthstring: "local:" + newUser.id
                };
                return done(null, user);
              });
            } else {
              return done(null, false, req.flash('signUpMessage', 'Error creating account'));
            }
          });
        } else {
          return done(null, false, req.flash('signUpMessage', 'Email address already taken'));
        }
      });
    });
  }));

  passport.registerUser = function (req, oauthcode, displayName, status, callback) {
    var stmt = db.prepare("INSERT INTO oauthusers VALUES (NULL, ?, ?,?,0)");
    stmt.run(oauthcode, displayName, status, function (err) {
      if (callback) {
        callback(this.lastID);
      }
    });
  };
}

;