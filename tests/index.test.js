(function () {
'use strict';

	const express = require('express');
	const request = require("supertest");
	const bodyparser = require('body-parser');
	const responsehelper = require("../index.js");
	const app = express();
	app.use(bodyparser.text())
	app.use(bodyparser.json());
	app.use(responsehelper);

    app.post('/success/links', function(req, res) {
        console.info("This routes uses res.link multiple times. This is not the same as Express' res.links");
        //res.link('/route1');
        res.link('self', '/route1', 'post');
        res.link('add_new', '/route/2');
        return res.success(req.body);
    });

	app.post('/success', function(req, res) {
		return res.success(req.body);
	});

    app.post('/error/one/parameter', function(req, res) {
        console.log("sends error string");
        return res.gerror(req.body.error);
	});

    app.post('/error/two/parameter', function(req, res) {
        return res.gerror(req.body.first, req.body.second);
    });

    app.post('/error/three/parameter', function(req, res) {
        return res.gerror(req.body.first, req.body.second, req.body.third);
    });

    app.post('/error/object', function(req, res) {
        console.log('sends error object');
        return res.gerror(req.body); 
    });
    app.post('/error/status', function(req, res) {
        console.log('Sets status code');
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
