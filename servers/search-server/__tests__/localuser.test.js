import request from 'supertest';
import start from '../lib/app';
import {QueryTypes} from 'sequelize';

let app;

if (process.env.NODE_ENV !== 'test') process.exit(-1);

beforeAll(async () => {
	app = await start({
		noparse: true,
	});
});

describe("User Service", () => {
	describe("local users", () => {
		beforeEach(async () => {
			await app.db.sync({force: true});
			await app.db.query(
				'DROP VIEW IF EXISTS view_listedVersion;',
				{
					raw: true,
					type: QueryTypes.DROP,
				}
			);
			await app.db.query(
				'CREATE VIEW view_listedVersion AS select saveID,date,projects.projectid FROM projectversions,projects where saveID = projects.publicVersion;',
				{
					raw: true,
					type: QueryTypes.CREATE,
				}
			);
		});

		it("can add local user", async () => {
			const response = await request(app)
				.post("/auth/localsignup")
				.type("form")
				.send({
					displayname: 'Test User',
					username: 'testuser@example.com',
					password: 'testpass',
				});

			expect(response.statusCode).toBe(302);

			const user = await app.models.localusers.findOne({
				where: {emailaddress: 'testuser@example.com'},
			});
			expect(user).toBeTruthy();

			const ouser = await app.models.oauthusers.findOne({
				where: {oauthstring: 'local:' + user.localuserID},
			});
			expect(ouser).toBeTruthy();
		});

		it("can login with local user", async () => {
			const agent = request.agent(app);

			await agent
				.post("/auth/localsignup")
				.type("form")
				.send({
					displayname: 'Test User',
					username: 'testuser@example.com',
					password: 'testpass',
				});

			const login = await agent
				.post("/auth/locallogin")
				.type("form")
				.send({
					username: 'testuser@example.com',
					password: 'testpass',
				});

			expect(login.statusCode).toBe(302);

			const response = await agent
				.get("/user/details")
				.query();

			expect(response.statusCode).toBe(200);
			expect(response.body.name).toBe('Test User');
		});
	});
});