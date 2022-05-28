import request from 'supertest';
import start from '../lib/app';
import {createIndex} from '../lib/search';
import {QueryTypes} from 'sequelize';

let app;

if (process.env.NODE_ENV !== 'test') process.exit(-1);

beforeAll(async () => {
    try {
        app = await start({
            noparse: true,
            user: {id: 1, admin: 1}
        });
    } catch(e) {
        console.error("Start failed", e);
    }
});

describe("Project Service", () => {
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
	});

	describe("adding projects", () => {
		it('can add a project with source', async () => {
			const response = await request(app)
				.post("/project/add")
				.type("form")
				.send({
					title: 'Test Project 1',
					minimisedTitle: 'TestProject1',
					metadata: '{}',
					source: 'a is b + c;',
				});

			expect(response.statusCode).toBe(200);
			expect(typeof response.body.projectID).toBe('number');
			expect(typeof response.body.saveID).toBe('number');

			const project = await app.models.projects.findOne({where:{projectID: response.body.projectID}});
			expect(project.title).toBe('Test Project 1');
			expect(project.minimisedTitle).toBe('TestProject1');
			expect(project.owner).toBe(1);
			expect(project.projectMetaData).toBe('{}');

			const version = await app.models.projectversions.findOne({where: {saveID: response.body.saveID}});
			expect(version.fullsource).toBe('a is b + c;');
		});

		it('fails without title', async () => {
			const response = await request(app)
				.post("/project/add")
				.type("form")
				.send({
					minimisedTitle: 'TestProject1',
					metadata: '{}',
					source: 'a is b + c;',
				});

			expect(response.statusCode).toBe(400);
		});

		it('fails if parent project doesnt exist', async () => {
			const response = await request(app)
				.post("/project/add")
				.type("form")
				.send({
					title: 'Test Project 1',
					minimisedTitle: 'TestProject1',
					metadata: '{}',
					parentProject: 1000,
				});

			expect(response.statusCode).toBe(400);
		});

		it('can add a parented project', async () => {
			const parent = await request(app)
				.post("/project/add")
				.type("form")
				.send({
					title: 'Test Project 1',
					minimisedTitle: 'TestProject1',
					metadata: '{}',
					source: 'a is b + c;',
					listed: true,
				});

			const response = await request(app)
				.post("/project/add")
				.type("form")
				.send({
					title: 'Test Project 2',
					minimisedTitle: 'TestProject2',
					metadata: '{}',
					parentProject: parent.body.projectID,
				});

			expect(response.statusCode).toBe(200);
			expect(typeof response.body.projectID).toBe('number');
			expect(typeof response.body.saveID).toBe('number');

			const project = await app.models.projects.findOne({where:{projectID: response.body.projectID}});
			expect(project.title).toBe('Test Project 2');
			expect(project.parentProject).toBe(parent.body.projectID);

			const version = await app.models.projectversions.findOne({where: {saveID: response.body.saveID}});
			expect(version.from).toBe(parent.saveID);
		});

		it('can save a new version', async () => {
			const first = await request(app)
				.post("/project/add")
				.type("form")
				.send({
					title: 'Test Project 1',
					minimisedTitle: 'TestProject1',
					metadata: '{}',
					source: 'a is b + c;',
					listed: true,
				});

			const response = await request(app)
				.post("/project/add")
				.type("form")
				.send({
					projectID: first.body.projectID,
					from: first.body.saveID,
					sorce: 'a is b + c + d;',
				});

			expect(response.statusCode).toBe(200);
		});

		it('can save a multiple versions', async () => {
			const first = await request(app)
				.post("/project/add")
				.type("form")
				.send({
					title: 'Test Project 1',
					minimisedTitle: 'TestProject1',
					metadata: '{}',
					source: 'a is b + c;',
					listed: true,
				});

			const second = await request(app)
				.post("/project/add")
				.type("form")
				.send({
					projectID: first.body.projectID,
					from: first.body.saveID,
					source: 'a is b + c + d;',
				});

			const response = await request(app)
				.post("/project/add")
				.type("form")
				.send({
					projectID: first.body.projectID,
					from: second.body.saveID,
					source: 'a is b + c + d + 2;',
				});

			expect(response.statusCode).toBe(200);
		});
	});

	describe("getting projects", () => {
		it('can get a project with source', async () => {
			const original = await request(app)
				.post("/project/add")
				.type("form")
				.send({
					title: 'Test Project 1',
					minimisedTitle: 'TestProject1',
					metadata: '{}',
					source: 'a is b + c;',
				});

			const response = await request(app)
				.get("/project/get")
				.query({
					projectID: original.body.projectID,
				});

			expect(response.statusCode).toBe(200);
			expect(response.body.saveID).toBe(original.body.saveID);
			expect(response.body.source).toBe('a is b + c;');
		});
	});

	describe("removing projects", () => {
		it('can remove an existing project', async () => {
			const original = await request(app)
				.post("/project/add")
				.type("form")
				.send({
					title: 'Test Project 1',
					minimisedTitle: 'TestProject1',
					metadata: '{}',
					source: 'a is b + c;',
				});

			const check1 = await app.models.projects.findOne({
				where: {projectID: original.body.projectID}
			});
			expect(check1).toBeTruthy();

			const response = await request(app)
				.post("/project/remove")
				.type('form')
				.send({
					projectID: original.body.projectID,
				});

			expect(response.statusCode).toBe(200);

			const check2 = await app.models.projects.findOne({
				where: {projectID: original.body.projectID}
			});
			expect(check2).toBeFalsy();
		});
	});

	describe("project versions", () => {
		it('can get a list of private versions', async () => {
			const original = await request(app)
				.post("/project/add")
				.type("form")
				.send({
					title: 'Test Project 1',
					minimisedTitle: 'TestProject1',
					metadata: '{}',
					source: 'a is b + c;',
				});

			await request(app)
				.post("/project/add")
				.type("form")
				.send({
					projectID: original.body.projectID,
					source: 'a is b + c + d;',
				});

			const response = await request(app)
				.get("/project/versions")
				.query({
					projectID: original.body.projectID,
				});

			expect(response.statusCode).toBe(200);
			expect(response.body).toHaveLength(2);
		});
	});

	describe("project searching", () => {
		it('can search by name', async () => {
			const original = await request(app)
				.post("/project/add")
				.type("form")
				.send({
					title: 'Test Project 1',
					minimisedTitle: 'TestProject1',
					metadata: '{}',
					source: 'a is b + c;',
				});

			await request(app)
				.post("/project/add")
				.type("form")
				.send({
					projectID: original.body.projectID,
					source: 'a is b + c + d;',
				});

			const response = await request(app)
				.get("/project/search")
				.query({
					query: 'TestProject',
				});

			expect(response.statusCode).toBe(200);
			expect(response.body).toHaveLength(1);
		});

		it('can search by tag', async () => {
			const original = await request(app)
				.post("/project/add")
				.type("form")
				.send({
					title: 'Test Project 1',
					minimisedTitle: 'TestProject1',
					metadata: '{}',
					source: 'a is b + c;',
					tags: ['hello'],
				});

			await request(app)
				.post("/project/add")
				.type("form")
				.send({
					title: 'Test Project 2',
					minimisedTitle: 'hello',
					metadata: '{}',
					source: 'a is b + c + d;',
				});

			const response = await request(app)
				.get("/project/search")
				.query({
					query: '#hello',
				});

			expect(response.statusCode).toBe(200);
			expect(response.body).toHaveLength(1);
			expect(response.body[0].projectID).toBe(original.body.projectID);
		});

		it('can search by id', async () => {
			const original = await request(app)
				.post("/project/add")
				.type("form")
				.send({
					title: 'Test Project 1',
					minimisedTitle: 'TestProject1',
					metadata: '{}',
					source: 'a is b + c;',
					tags: ['hello'],
				});

			const response = await request(app)
				.get("/project/search")
				.query({
					query: `.id(${original.body.projectID})`,
				});

			expect(response.statusCode).toBe(200);
			expect(response.body).toHaveLength(1);
		});

		it('can search by :me', async () => {
			await request(app)
				.post("/project/add")
				.type("form")
				.send({
					title: 'Test Project 1',
					minimisedTitle: 'TestProject1',
					metadata: '{}',
					source: 'a is b + c;',
					tags: ['hello'],
				});

			await app.models.oauthusers.create({
				name: 'TestUser2',
				oauthstring: 'empty',
			});

			app.setUser({id: 2, admin: 1});

			await request(app)
				.post("/project/add")
				.type("form")
				.send({
					title: 'Test Project 1',
					minimisedTitle: 'TestProject1',
					metadata: '{}',
					source: 'a is b + c;',
					tags: ['hello'],
				});

			const response = await request(app)
				.get("/project/search")
				.query({
					query: ':me',
				});

			expect(response.statusCode).toBe(200);
			expect(response.body).toHaveLength(1);
		});
	});
});
