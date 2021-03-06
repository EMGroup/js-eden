import start from './app';
import config from './config.js';

start().then(app => {
	app.listen(config.PORT);
	console.log(`Ready on port ${config.PORT}`.green.bold);
});
