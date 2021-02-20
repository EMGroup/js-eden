import 'core-js/stable';
import 'regenerator-runtime/runtime';
import express from 'express';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import config from './config.js';
import fs from 'fs';

if (config.SENTRY) {
	Sentry.init({
		dsn: config.SENTRY,
		tracesSampleRate: 1.0,
	});
}

import passport from 'passport';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import session from 'express-session';
import './eden';
import { Sequelize } from 'sequelize';
const sqlite3 = require("sqlite3");

require(config.JSEDENPATH + "js/lib/diff_match_patch.js");

import users from './users';
import auth from './auth';
import project from './project';
import search from './search';
import comments from './comments';
import social from './social';
import * as passportUsers from './passport-users.js';

var flash = require('connect-flash');
const app = express();

function logErrors(err,req,res,next){
	console.error(new Date().toISOString().cyan + ": " + 'Internal server error'.red);
	console.error(err.stack);
	res.status(500);
	res.json({"error": "Error"});
}

// configure Express
if (config.SENTRY) {
	app.use(Sentry.Handlers.requestHandler());
	app.use(Sentry.Handlers.errorHandler());
}
app.set('views', __dirname + '/../views');
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

const dataconfig = {
	test: {
		filename: ':memory:',
	},
	development: {
		filename: config.DBPATH,
	},
	production: {
		filename: config.DBPATH,
	},
};

import * as models from './models';

function createModels(db) {
	for (const name in models) {
		if (name === 'default') continue;
		console.log(`Creating model '${name}'`);
		db.define(name.toLowerCase(), models[name], {
			freezeTableName: true,
			timestamps: false,
		});
	}
	models.default(db);
	return db.sync();
}

async function start(options = {}) {
	console.log('Starting...'.green);
	
	const env = process.env.NODE_ENV || "development";
	const db = new Sequelize({
		dialect: 'sqlite',
		storage: dataconfig[env].filename,
		logging: msg => {}
	});
	app.db = db;
	await createModels(db);
	app.models = db.models;

	const rawdb = new sqlite3.Database(dataconfig[env].filename);
	app.rawdb = rawdb;

	if (options.user) {
		app.use((req, res, next) => {
			req.user = options.user;
			next();
		});
	}

	app.eden = global.eden;
	passportUsers.setupPassport(passport,app.rawdb);

	// Add components
	users(app);
	auth(app);
	project(app);
	comments(app);
	social(app);
	await search(app, options);
	return app;
}

export default start;
