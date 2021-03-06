import request from 'supertest';
import start from '../lib/app';

let app;

if (process.env.NODE_ENV !== 'test') process.exit(-1);

beforeAll(async () => {
	app = await start({
		noparse: true,
		user: {id: 1, admin: 1}
	});
});

describe("Comment Service", () => {
	describe("post new", () => {
		beforeEach(async () => {
			await app.db.sync({force: true});
			await app.models.oauthusers.create({
				name: 'TestUser',
				oauthstring: 'empty',
			});
			await app.models.projects.create({
				title: 'Test Project 1',
				minimisedTitle: 'TestProject1',
				owner: 1,
			});
		});

		it("accepts a valid new post", async () => {
			const response = await request(app)
				.post("/comment/post")
				.type("form")
				.send({
					comment: 'test comment',
					versionID: 1,
					projectID: 1,
					publiclyVisible: 1,
				});

			expect(response.statusCode).toBe(200);
			expect(response.body.commentID).toBe(1);
		});

		it("rejects when missing comment value", async () => {
			const response = await request(app)
				.post("/comment/post")
				.type("form")
				.send({
					versionID: 1,
					projectID: 1,
					publiclyVisible: 1,
				});

			expect(response.statusCode).toBe(400);
		});
	});

	describe("post delete", () => {
		beforeEach(async () => {
			await app.db.sync({force: true});
			await app.models.oauthusers.create({
				name: 'TestUser',
				oauthstring: 'empty',
			});
			await app.models.projects.create({
				title: 'Test Project 1',
				minimisedTitle: 'TestProject1',
				owner: 1,
			});
			await app.models.projects.create({
				title: 'Test Project 2',
				minimisedTitle: 'TestProject2',
				owner: 1,
			});
			await app.models.comments.create({
				comment: 'test comment',
				versionID: 2,
				projectID: 2,
				public: 1,
				author: 1,
			});
		});

		it("can delete a comment", async () => {
			const response = await request(app)
				.post("/comment/delete")
				.type("form")
				.send({
					commentID: 1,
				});

			expect(response.statusCode).toBe(200);
			expect(response.body.changes).toBe(1);
		});

		it("fails to delete an invalid comment", async () => {
			const response = await request(app)
				.post("/comment/delete")
				.type("form")
				.send({
					commentID: 100,
				});

			expect(response.statusCode).toBe(400);
		});
	});

	describe("get search", () => {
		beforeEach(async () => {
			await app.db.sync({force: true});
			await app.models.oauthusers.create({
				name: 'TestUser',
				oauthstring: 'empty',
			});
			await app.models.oauthusers.create({
				name: 'TestUser2',
				oauthstring: 'empty',
			});
			await app.models.projects.create({
				title: 'Test Project 1',
				minimisedTitle: 'TestProject1',
				owner: 1,
			});
			await app.models.projects.create({
				title: 'Test Project 2',
				minimisedTitle: 'TestProject2',
				owner: 1,
			});
			await app.models.comments.create({
				comment: 'test comment',
				versionID: 2,
				projectID: 2,
				public: 1,
				author: 1,
			});
			await app.models.comments.create({
				comment: 'test comment 2',
				versionID: 2,
				projectID: 2,
				public: 0,
				author: 1,
			});
			await app.models.comments.create({
				comment: 'test comment 3',
				versionID: 2,
				projectID: 2,
				public: 0,
				author: 2,
			});
		});

		it("can find all project comments", async () => {
			const response = await request(app)
				.get("/comment/search")
				.query({
					projectID: 2,
				});

			expect(response.statusCode).toBe(200);
			expect(response.body).toHaveLength(2);
			expect(response.body[0].name).toBe('TestUser');
		});

		it("can limit the results", async () => {
			const response = await request(app)
				.get("/comment/search")
				.query({
					projectID: 2,
					limit: 1,
				});

			expect(response.statusCode).toBe(200);
			expect(response.body).toHaveLength(1);
		});

		it("can offset the results", async () => {
			const response = await request(app)
				.get("/comment/search")
				.query({
					projectID: 2,
					limit: 1,
					offset: 1,
				});

			expect(response.statusCode).toBe(200);
			expect(response.body).toHaveLength(1);
			expect(response.body[0].commentID).toBe(2);
		});
	});

	describe("get activity", () => {
		beforeEach(async () => {
			await app.db.sync({force: true});
			await app.models.oauthusers.create({
				name: 'TestUser',
				oauthstring: 'empty',
			});
			await app.models.projects.create({
				title: 'Test Project 1',
				minimisedTitle: 'TestProject1',
				owner: 1,
			});
			await app.models.comments.create({
				comment: 'test comment',
				versionID: 2,
				projectID: 1,
				public: 1,
				author: 1,
			});
			await app.models.comments.create({
				comment: 'test comment 2',
				versionID: 2,
				projectID: 1,
				public: 0,
				author: 1,
			});
		});

		it("can list project comments", async () => {
			const response = await request(app)
				.get("/comment/activity");

			expect(response.statusCode).toBe(200);
			expect(response.body).toHaveLength(1);
			expect(response.body[0].name).toBe('TestUser');
			expect(response.body[0].title).toBe('Test Project 1');
		});
	});
});
