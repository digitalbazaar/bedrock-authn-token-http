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
const brAccount = require('bedrock-account');
const brAuthnToken = require('bedrock-authn-token');
const {authenticator} = require('otplib');

let accounts;
let actors;

function stubPassportStub(email) {
  passportStub.callsFake((req, res, next) => {
    req.user = {
      actor: actors[email],
      account: accounts[email].account
    };
    next();
  });
}

const baseURL = `https://${config.server.host}` +
  `${config['authn-token-http'].routes.basePath}`;
const authenticateURL = `https://${config.server.host}` +
  `${config['authn-token-http'].routes.authenticate}`;
const registrationURL = `https://${config.server.host}` +
`${config['authn-token-http'].routes.registration}`;

// use agent to avoid self-signed certificate errors
const agent = new https.Agent({rejectUnauthorized: false});

describe('api', () => {
  describe('post /', () => {
    before(async function setup() {
      await helpers.prepareDatabase(mockData);
      actors = await helpers.getActors(mockData);
      accounts = mockData.accounts;
    });
    afterEach(async function() {
      // replace stub with an empty stub.
      passportStub.callsFake((req, res, next) => next());
    });
    it('should throw error if type is not given', async function() {
      const type = '';
      const accountId = accounts['alpha@example.com'].account.id;
      let err;
      let res;
      stubPassportStub('alpha@example.com');
      try {
        res = await httpClient.post(`${baseURL}/${type}`, {
          agent, json: {
            account: accountId
          }
        });
      } catch(e) {
        err = e;
      }
      should.exist(err);
      should.not.exist(res);
      err.name.should.equal('HTTPError');
      err.message.should.equal('Not Found');
      err.status.should.equal(404);
    });
    it('should create a `nonce` successfully', async function() {
      const type = 'nonce';
      let err;
      let res;
      const accountId = accounts['alpha@example.com'].account.id;
      stubPassportStub('alpha@example.com');
      try {
        res = await httpClient.post(`${baseURL}/${type}`, {
          agent, json: {
            account: accountId
          }
        });
      } catch(e) {
        err = e;
      }
      assertNoError(err);
      should.exist(res);
      res.status.should.equal(204);
      should.not.exist(res.data);
    });
    it('should create a `totp` successfully', async function() {
      const type = 'totp';
      let err;
      let res;
      const accountId = accounts['alpha@example.com'].account.id;
      stubPassportStub('alpha@example.com');
      try {
        res = await httpClient.post(`${baseURL}/${type}`, {
          agent, json: {
            account: accountId
          }
        });
      } catch(e) {
        err = e;
      }
      assertNoError(err);
      should.exist(res);
      should.exist(res.data);
      res.data.should.be.an('object');
      res.data.should.have.keys([
        'algorithm', 'digits', 'id', 'step', 'type', 'secret', 'label',
        'otpAuthUrl'
      ]);
      res.data.type.should.equal('totp');
    });
    it('should throw error when creating `totp` without authentication',
      async function() {
        const type = 'totp';
        let err;
        let res;
        // posting a body without an accountId
        try {
          res = await httpClient.post(`${baseURL}/${type}`, {
            agent, json: {
              email: 'alpha@example.com'
            }
          });
        } catch(e) {
          err = e;
        }
        should.exist(err);
        should.not.exist(res);
        err.name.should.equal('HTTPError');
        err.message.should.equal('Could not create authentication token;' +
          ' authentication required.');
      });
    it('should create `nonce` successfully without authentication',
      async function() {
        const type = 'nonce';
        let err;
        let res;
        // posting a body without an accountId
        try {
          res = await httpClient.post(`${baseURL}/${type}`, {
            agent, json: {
              email: 'alpha@example.com'
            }
          });
        } catch(e) {
          err = e;
        }
        assertNoError(err);
        should.exist(res);
        res.status.should.equal(204);
        should.not.exist(res.data);
      });
    it('should create "password" successfully', async function() {
      const type = 'password';
      const accountId = accounts['alpha@example.com'].account.id;
      const hash =
      '$2y$12$LR16D./bm4rN7a5PHhRypeNs5SW4KNWz.XjSvw7JG6KYd1yKjcGqm';

      stubPassportStub('alpha@example.com');
      let err;
      let res;
      try {
        res = await httpClient.post(`${baseURL}/${type}`, {
          agent, json: {
            account: accountId,
            hash
          }
        });
      } catch(e) {
        err = e;
      }
      assertNoError(err);
      should.exist(res);
      res.status.should.equal(204);
      should.not.exist(res.data);
    });
  });
  describe('get /salt', () => {
    before(async function setup() {
      await helpers.prepareDatabase(mockData);
      actors = await helpers.getActors(mockData);
      accounts = mockData.accounts;
    });
    afterEach(async function() {
      // replace stub with an empty stub.
      passportStub.callsFake((req, res, next) => next());
    });
    it('should be able to get salt for a token', async function() {
      const type = 'nonce';
      let err;
      let res;
      stubPassportStub('alpha@example.com');
      // set a nonce for the account
      await httpClient.post(`${baseURL}/${type}`, {
        agent, json: {
          email: 'alpha@example.com'
        }
      });
      // get the salt for the nonce token
      try {
        res = await httpClient.get(
          `${baseURL}/${type}/salt?email=alpha@example.com`, {
            agent
          });
      } catch(e) {
        err = e;
      }
      assertNoError(err);
      should.exist(res);
      res.status.should.equal(200);
      should.exist(res.data);
      res.data.should.be.an('object');
      res.data.should.have.keys(['salt']);
    });
    it('should throw error if there is no token for the account or email',
      async function() {
        const type = 'nonce';
        let err;
        let res;
        stubPassportStub('beta@example.com');
        // attempt to get salt for an account that has no tokens.
        try {
          res = await httpClient.get(
            `${baseURL}/${type}/salt?email=beta@example.com`, {
              agent
            });
        } catch(e) {
          err = e;
        }
        should.exist(err);
        should.not.exist(res);
        err.message.should.equal('Authentication token not found.');
        err.status.should.equal(404);
      });
  });
  describe('delete /', () => {
    before(async function setup() {
      await helpers.prepareDatabase(mockData);
      actors = await helpers.getActors(mockData);
      accounts = mockData.accounts;
    });
    afterEach(async function() {
      // replace stub with an empty stub.
      passportStub.callsFake((req, res, next) => next());
    });
    it('should delete a token', async function() {
      const type = 'nonce';
      let err;
      let res;
      stubPassportStub('alpha@example.com');
      const accountId = accounts['alpha@example.com'].account.id;
      // set a nonce for the account
      try {
        res = await httpClient.post(`${baseURL}/${type}`, {
          agent, json: {
            account: accountId
          }
        });
      } catch(e) {
        err = e;
      }
      assertNoError(err);
      should.exist(res);
      res.status.should.equal(204);
      should.not.exist(res.data);
      // get all tokens for the account, we should get exactly one nonce
      // that is created above.
      let err2;
      let result;
      const actor = await brAccount.getCapabilities({id: accountId});
      try {
        result = await brAuthnToken.getAll({
          account: accountId,
          actor,
          type: 'nonce',
        });
      } catch(e) {
        err2 = e;
      }
      assertNoError(err2);
      should.exist(result);
      result.length.should.equal(1);
      result[0].should.be.an('object');
      result[0].should.have.keys([
        'authenticationMethod', 'requiredAuthenticationMethods', 'id', 'salt',
        'sha256', 'expires'
      ]);
      // delete the nonce for the account
      let res2;
      let err3;
      try {
        res2 = await httpClient.delete(
          `${baseURL}/${type}?account=${accountId}&tokenId=${result[0].id}`, {
            agent
          });
      } catch(e) {
        err3 = e;
      }
      assertNoError(err3);
      should.exist(res2);
      res.status.should.equal(204);
      should.not.exist(res.data);
      // attempt to get all tokens for the account again, this time we should
      // get empty array as there is no token and earlier token created
      // has been deleted.
      let err4;
      let result2;
      try {
        result2 = await brAuthnToken.getAll({
          account: accountId,
          actor,
          type: 'nonce',
          id: 'zW34DhUd4scRCfNNnsgk6t5'
        });
      } catch(e) {
        err4 = e;
      }
      assertNoError(err4);
      should.exist(result2);
      result2.should.eql([]);
    });
  });
  describe('post /routes.authenticate', () => {
    before(async function setup() {
      await helpers.prepareDatabase(mockData);
      actors = await helpers.getActors(mockData);
      accounts = mockData.accounts;
    });
    afterEach(async function() {
      // replace stub with an empty stub.
      passportStub.callsFake((req, res, next) => next());
    });
    it('should authenticate with a token successfully', async function() {
      const type = 'totp';
      let err;
      stubPassportStub('alpha@example.com');
      const accountId = accounts['alpha@example.com'].account.id;
      const actor = await brAccount.getCapabilities({id: accountId});
      // set a totp for the account with authenticationMethod set to
      // 'token-client-registration'
      const {secret} = await brAuthnToken.set({
        account: accountId,
        actor,
        type,
        authenticationMethod: 'token-client-registration',
      });
      const challenge = authenticator.generate(secret);

      // attempt to authenticate
      let res;
      try {
        res = await httpClient.post(`${authenticateURL}`, {
          agent,
          json: {
            account: accountId,
            type,
            challenge,
          }
        });
      } catch(e) {
        err = e;
      }
      assertNoError(err);
      should.exist(res);
      should.exist(res.data);
      res.data.should.be.an('object');
      res.data.authenticated.should.equal(true);
      res.data.authenticatedMethods.should.be.an('array');
      res.data.authenticatedMethods[0].should.equal(
        'token-client-registration'
      );
      res.status.should.equal(200);
      should.exist(res.headers.get('set-cookie'));
      // remove the token and set a new `totp` token without an
      // authenticationMethod.
      await brAuthnToken.remove({
        account: accountId,
        actor,
        type,
      });
      const {secret: secret2} = await brAuthnToken.set({
        account: accountId,
        actor,
        type
      });
      const challenge2 = authenticator.generate(secret2);

      // then try to authenticate the new token for the same clientId that
      // is stored in the cookie
      let res2;
      let err2;
      try {
        res2 = await httpClient.post(`${authenticateURL}`, {
          agent,
          json: {
            account: accountId,
            type,
            challenge: challenge2
          }, headers: {
            Cookie: res.headers.get('set-cookie')
          }
        });
      } catch(e) {
        err2 = e;
      }
      assertNoError(err2);
      should.exist(res2);
      should.exist(res2.data);
      res2.data.should.be.an('object');
      res2.data.authenticated.should.equal(true);
      res2.status.should.equal(200);
    });
  });
  describe('get /routes.registration', () => {
    before(async function setup() {
      await helpers.prepareDatabase(mockData);
      actors = await helpers.getActors(mockData);
      accounts = mockData.accounts;
    });
    afterEach(async function() {
      // replace stub with an empty stub.
      passportStub.callsFake((req, res, next) => next());
    });
    it('should return `true` if token client is registered.',
      async function() {
        const type = 'totp';
        let err;
        stubPassportStub('alpha@example.com');
        const accountId = accounts['alpha@example.com'].account.id;
        const actor = await brAccount.getCapabilities({id: accountId});
        // set a totp for the account with authenticationMethod set to
        // 'token-client-registration'
        const {secret} = await brAuthnToken.set({
          account: accountId,
          actor,
          type,
          authenticationMethod: 'token-client-registration',
        });
        const challenge = authenticator.generate(secret);

        // authenticate with the token
        let res;
        try {
          res = await httpClient.post(`${authenticateURL}`, {
            agent,
            json: {
              account: accountId,
              type,
              challenge,
            }
          });
        } catch(e) {
          err = e;
        }
        assertNoError(err);
        should.exist(res);
        should.exist(res.data);
        res.data.should.be.an('object');
        res.data.authenticated.should.equal(true);
        res.data.authenticatedMethods.should.be.an('array');
        res.data.authenticatedMethods[0].should.equal(
          'token-client-registration'
        );
        res.status.should.equal(200);
        should.exist(res.headers.get('set-cookie'));
        // check if token client  is registered.
        let res2;
        let err2;
        try {
          res2 = await httpClient.get(
            `${registrationURL}?email=alpha@example.com`, {
              agent, headers: {
                Cookie: res.headers.get('set-cookie')
              }
            });
        } catch(e) {
          err = e;
        }
        assertNoError(err2);
        should.exist(res2);
        res2.data.registered.should.equal(true);
      });
    it('should return `false` if token client is not registered.',
      async function() {
        // call the endpoint with an unregistered token client.
        let res3;
        let err;
        try {
          res3 = await httpClient.get(
            `${registrationURL}?email=beta@example.com`, {
              agent
            });
        } catch(e) {
          err = e;
        }
        assertNoError(err);
        should.exist(res3);
        res3.data.registered.should.equal(false);
      });
  });
});
