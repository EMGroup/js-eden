import config from './config.js';
import passport from 'passport';

export default function(app) {
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
	app.get(
		'/auth/google/callback', 
		passport.authenticate('google', { failureRedirect: config.BASEURL + '/login' }),
		(req, res) => res.redirect(config.BASEURL)
	);

	app.get(
		'/auth/twitter/callback', 
		passport.authenticate('twitter', { failureRedirect: config.BASEURL + '/login' }),
		(req, res) => res.redirect(config.BASEURL)
	);

	app.get(
		'/auth/facebook/callback', 
		passport.authenticate('facebook', { failureRedirect: config.BASEURL + '/login' }),
		(req, res) => res.redirect(config.BASEURL)
	);
}