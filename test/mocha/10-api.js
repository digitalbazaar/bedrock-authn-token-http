/*!
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const bedrock = require('bedrock');
const {config} = bedrock;
const https = require('https');
const helpers = require('./helpers');
const mockData = require('./mock.data');
const {httpClient} = require('@digitalbazaar/http-client');

let accounts;
let actors;

passportStub.callsFake((req, res, next) => next());
function stubPassportStub(email) {
  passportStub.callsFake((req, res, next) => {
    req.user = {
      actor: actors[email],
      account: accounts[email].account
    };
    next();
  });
}

const baseURL =
 `https://${config.server.host}${config['authn-token-http'].routes.basePath}`;

// use agent to avoid self-signed certificate errors
const agent = new https.Agent({rejectUnauthorized: false});

describe('api', () => {
  before(async function setup() {
    await helpers.prepareDatabase(mockData);
    actors = await helpers.getActors(mockData);
    accounts = mockData.accounts;
  });
  after(async function() {
    passportStub.restore();
    await helpers.removeCollections();
  });
  describe('post /', () => {
    it('', async function() {
      const type = 'nonce';
      stubPassportStub('alpha@example.com');
      const result = await httpClient.post(`${baseURL}/${type}`, {
        agent, json: {
          email: 'alpha@example.com'
        }
      });
      console.log({result});
    });
  });

});
