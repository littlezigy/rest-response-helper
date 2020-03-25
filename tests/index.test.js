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

	describe("Success", function() {
		test("With Object payload", async function() {
			let foo = await request(app).post("/success")
						.send({fee: "fee", fi: "fi!", foh: 'foh!', fum: 'I smell the blood of an Englishman!'});
            console.log('FOO', foo.body);
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
            console.log('FOO STATUS', foo.status, foo.text);
            console.log('FOO BODY LINKS', foo.body);
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
}());
