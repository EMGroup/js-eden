import request from 'supertest';
import start from '../lib/app';
import {createIndex} from '../lib/search';
import {QueryTypes} from 'sequelize';

let app;

if (process.env.NODE_ENV !== 'test') process.exit(-1);

beforeAll(async () => {
	app = await start({
		noparse: true,
		user: {id: 1, admin: 1}
	});
});

describe("Search Service", () => {
	describe("index projects", () => {
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
			await app.models.oauthusers.create({
				name: 'TestUser',
				oauthstring: 'empty',
			});
			await app.models.projects.create({
				title: 'Test Project 1',
				minimisedTitle: 'TestProject1',
				owner: 1,
				publicVersion: 1,
			});
		});

		it("can index a valid public project", async () => {
			await app.models.projectversions.create({
				projectID: 1,
				fullsource: 'a is b + c;',
			});
			await createIndex(app.db);

			const sast = Eden.Selectors.parse('a');
			const ast = await sast.filter();
			expect(ast).toHaveLength(1);
			expect(ast[0].getSource()).toBe('a is b + c;');
		});
	});

	describe("code search", () => {
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
			await app.models.oauthusers.create({
				name: 'TestUser',
				oauthstring: 'empty',
			});
			await app.models.projects.create({
				title: 'Test Project 1',
				minimisedTitle: 'TestProject1',
				owner: 1,
				publicVersion: 1,
			});
			await app.models.projectversions.create({
				projectID: 1,
				fullsource: 'a is b + c;',
			});
			await createIndex(app.db);
		});

		it("can find valid selector and data, no outtype", async () => {
			const response = await request(app)
				.get("/code/search")
				.query({
					selector: 'a',
				});

			expect(response.statusCode).toBe(200);
			expect(response.body).toHaveLength(1);
			expect(response.body[0].startsWith('"use cs3;"')).toBe(true);
		});

		it("can find valid selector and data, source outtype", async () => {
			const response = await request(app)
				.get("/code/search")
				.query({
					selector: 'a',
					outtype: 'source'
				});

			expect(response.statusCode).toBe(200);
			expect(response.body).toHaveLength(1);
			expect(response.body[0]).toBe('a is b + c;');
		});

		it("produces NO error for invalid selector", async () => {
			const response = await request(app)
				.get("/code/search")
				.query({
					selector: '...',
				});

			expect(response.statusCode).toBe(200);
		});

		it("produces an error for invalid outtype", async () => {
			const response = await request(app)
				.get("/code/search")
				.query({
					selector: 'a',
					outtype: 'ergergerg',
				});

			expect(response.statusCode).toBe(400);
		});
	});
});