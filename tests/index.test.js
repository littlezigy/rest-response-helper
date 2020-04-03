(function () {
'use strict';

	const express = require('express');
	const request = require("supertest");
	const bodyparser = require('body-parser');
	const responsehelper = require("../index.js");
	const app = express();
	app.use(bodyparser.text())
	app.use(bodyparser.json());
	app.use(responsehelper.functions);

    app.post('/success/links', function(req, res) {
        res.link('self', '/route1', 'post');
        res.link('add_new', '/route/2');
        return res.success(req.body);
    });
    app.post('/success/links/inner', function(req, res) {
        for(let post in req.body) {
            res.innerLink(req.body[post], 'linky', '/example/worked');
            res.innerLink(req.body[post], 'previous', '/example/worked');
            res.innerLink(req.body[post], 'next', '/example/worked');
            res.innerLink(req.body[post], 'self', '/example/self');
            //else res.innerLink({post: req.body[post]});
        }
        return res.success(req.body);
    });

    responsehelper.config('http://localhost:3000');
    app.post('/config', function(req, res) {
        res.link('view_more', '/route1');
        res.link('self', '/route1', 'post');
        res.link('add_new', '/route/2');
        return res.success(req.body);
    });

	app.post('/success', function(req, res) {
        if(req.body.schema) res.schema(req.body.schema);
		return res.success(req.body);
	});

    app.post('/error/one/parameter', function(req, res) {
        return res.gerror(req.body.error);
	});

    app.post('/error/two/parameter', function(req, res) {
        return res.gerror(req.body.first, req.body.second);
    });

    app.post('/error/three/parameter', function(req, res) {
        return res.gerror(req.body.first, req.body.second, req.body.third);
    });

    app.post('/error/object', function(req, res) {
        return res.gerror(req.body); 
    });
    app.post('/error/status', function(req, res) {//Sets custom status code
        res.status(req.body.status);
        return res.gerror({code: 'test_error', title: 'Blah Blah'}); 
    });

	describe("Success", function() {
		test("With Object payload", async function() {
			let foo = await request(app).post("/success")
						.send({fee: "fee", fi: "fi!", foh: 'foh!', fum: 'I smell the blood of an Englishman!'});

			expect(foo.body).toHaveProperty('success');
			expect(typeof foo.body.success).toEqual('string');
			expect(foo.body).toHaveProperty('data');
		});

		test('res.success(string)', async function() {
			let payload = 'sample string';
			let foo = await request(app)
					.post('/success').set('Content-type', 'text/plain')
					.send(payload);

			expect(foo.body).toHaveProperty('success', payload);
		});

        test('Using res.links multiple times', async function() {
			let foo = await request(app).post("/success/links").send({fee: "fee", fi: "fi!", foh: 'foh!', fum: 'I smell the blood of an Englishman!'});
            expect(foo.body).toHaveProperty('_links');
        });
        test('Inner linking with Object', async function() {
            let foo = await request(app).post('/success/links/inner').send({fee:  {bwong: 'fee'}, fi: {bwong: 'fi!'}, foh: {bwong: 'foh!'}, fum: {bwong:'I smell the blood of an Inner _link'}});
            console.log('FOO', foo.body.data.fee._links);
            expect(foo.body.data.fee).toHaveProperty('_links');
            expect(foo.body.data.fee._links).toHaveProperty('previous');
            expect(foo.body.data.fee._links.previous).toHaveProperty('href');
            expect(foo.body.data.fee._links).toHaveProperty('self');

            expect(foo.body.data.fi).toHaveProperty('_links');
            expect(foo.body.data.fi._links.previous).toHaveProperty('href');
            expect(foo.body.data.fi._links).toHaveProperty('self');

            expect(foo.body.data.fum).toHaveProperty('_links');
            expect(foo.body.data.foh).toHaveProperty('_links');
        });
        test('res.innerlink with Array', async function() {
            let foo = await request(app).post('/success/links/inner').send({fee: [{bwang:'fee', fi: 'fi!', foh: 'foh!', fum: 'I smell the blood of an Inner _link'}]});
            expect(foo.body.data.fee[0]).toHaveProperty('_links');
            expect(foo.body.data.fee[0]._links).toHaveProperty('self');
            expect(foo.body.data.fee[0]._links).toHaveProperty('next');
        });

		test.skip('String and Object payload', async function() {
			let payload = 'sample string';
            let objectpayload = {fee: "fee", fi: "fi!", foh: 'foh!', fum: 'I smell the blood of an Englishman!'};

			let foo = await request(app)
					.post('/success').set('Content-type', 'application/json')
					.send(payload);

			expect(foo.body).toHaveProperty('success', payload);
		});
    });
    
    describe('Error', function() {
        test('Sending error title', async function() {
            let foo = await request(app).post('/error/one/parameter').send({error: 'Fancy Error'});
            expect(foo.status).toBeGreaterThan(399);
            expect(foo.body.error).toHaveProperty('title', 'Fancy Error');
            expect(foo.body.error).not.toHaveProperty('code');
        });

        test('Sending error code', async function() {
            let foo = await request(app).post('/error/one/parameter').send({error: 'error_code'});
            expect(foo.status).toBeGreaterThan(399);
            expect(foo.body.error).toHaveProperty('code', 'error_code');
        });

        test('Sending error code first and error title', async function() {
            let foo = await request(app).post('/error/two/parameter').send({first: 'error_code', second: 'Fancy Error'});
            expect(foo.status).toBeGreaterThan(399);
            expect(foo.body.error).toHaveProperty('code', 'error_code');
            expect(foo.body.error).toHaveProperty('title', 'Fancy Error');
            expect(foo.body.error).not.toHaveProperty('detail');
        });

        test('Sending error code first and error title', async function() {
            let foo = await request(app).post('/error/two/parameter').send({first: 'Fancy Error', second: 'error_code'});
            expect(foo.status).toBeGreaterThan(399);
            expect(foo.body.error).toHaveProperty('code', 'error_code');
            expect(foo.body.error).toHaveProperty('title', 'Fancy Error');
            expect(foo.body.error).not.toHaveProperty('detail');
        });

        test('Sending error code, error title, and error detail', async function() {
            let foo = await request(app).post('/error/three/parameter').send({first: 'Fancy Error', second: 'error_code', third: 'Yummy details'});
            expect(foo.status).toBeGreaterThan(399);
            expect(foo.body.error).toHaveProperty('code', 'error_code');
            expect(foo.body.error).toHaveProperty('title', 'Fancy Error');
            expect(foo.body.error).toHaveProperty('detail', 'Yummy details');
        });

        test('Error: Status code 413', async function() {
            let foo = await request(app).post('/error/status').send({status: 413});
            expect(foo.status).toEqual(413);
        });

        test('Config string', async function() {
            let configObj = 'http://localhost:3000';
            let foo = await request(app).post('/config').send({config: configObj});
            expect(foo.body._links.view_more).toHaveProperty('href', expect.stringContaining(configObj));
            expect(foo.body._links.add_new).toHaveProperty('href',expect.stringContaining(configObj));
            expect(foo.body._links.self).toHaveProperty('href', expect.stringContaining(configObj));
        });

		test('Schema', async function() {
			let payload = {schema: {properties: {name: 'Poo'} } };
			let foo = await request(app)
					.post('/success').send(payload);

            expect(foo.body).toHaveProperty('schema', payload.schema);
		});

        test('Error Object with code and title', async function() {
            let foo = await request(app).post('/error/object').send({code: 'blah_blah', title: 'Professional Blah'});
            expect(foo.body.error).toHaveProperty('code', 'blah_blah');
            expect(foo.body.error).toHaveProperty('title', 'Professional Blah');
            expect(foo.body.error).not.toHaveProperty('detail');
        });
        
        test('Error Object with code and title and detail', async function() {
            let foo = await request(app).post('/error/object').send({code: 'blah_blah', title: 'Professional Blah', detail: 'Yummy details coming'});
            expect(foo.body.error).toHaveProperty('code', 'blah_blah');
            expect(foo.body.error).toHaveProperty('title', 'Professional Blah');
            expect(foo.body.error).toHaveProperty('detail', 'Yummy details coming');
        });
    });
}());
