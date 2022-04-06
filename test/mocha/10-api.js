/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
import * as brAuthnToken from '@bedrock/authn-token';
import * as helpers from './helpers.js';
import {authenticator} from 'otplib';
import {agent} from '@bedrock/https-agent';
import bcrypt from 'bcrypt';
import {config} from '@bedrock/core';
import {createRequire} from 'module';
import {mockData} from './mock.data.js';
import {passport, _deserializeUser} from '@bedrock/passport';
import setCookie from 'set-cookie-parser';
const require = createRequire(import.meta.url);
const {generateId} = require('bnid');
const {httpClient} = require('@digitalbazaar/http-client');

let accounts;

const passportStubSettings = {email: null};
function stubPassportStub(email) {
  passportStubSettings.email = email;
}

passportStub.callsFake((strategyName, options, callback) => {
  // if no email given, call original `passport.authenticate`
  const {email} = passportStubSettings;
  if(!email) {
    return passportStub._original.call(
      passport, strategyName, options, callback);
  }

  // eslint-disable-next-line no-unused-vars
  return async function(req, res, next) {
    req._sessionManager = passport._sm;
    req.isAuthenticated = req.isAuthenticated || (() => !!req.user);
    req.login = (user, callback) => {
      req._sessionManager.logIn(req, user, function(err) {
        if(err) {
          req.user = null;
          return callback(err);
        }
        callback();
      });
    };
    let user = false;
    try {
      const {account} = accounts[email] || {account: {id: 'does-not-exist'}};
      user = await _deserializeUser({
        accountId: account.id
      });
    } catch(e) {
      return callback(e);
    }
    callback(null, user);
  };
});

const baseURL = `https://${config.server.host}` +
  `${config['authn-token-http'].routes.basePath}`;
const authenticateURL = `https://${config.server.host}` +
  `${config['authn-token-http'].routes.authenticate}`;
const registrationURL = `https://${config.server.host}` +
`${config['authn-token-http'].routes.registration}`;
const loginURL = `https://${config.server.host}` +
`${config['authn-token-http'].routes.login}`;

describe('api', () => {
  describe('post /', () => {
    before(async function setup() {
      await helpers.prepareDatabase(mockData);
      accounts = mockData.accounts;
    });
    afterEach(async function() {
      stubPassportStub(null);
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
            account: accountId,
            requiredAuthenticationMethods: ['login-email-challenge'],
            authenticationMethod: 'login-email-challenge'
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
    it('should create a `totp` token', async function() {
      const type = 'totp';
      let err;
      let res;
      const accountId = accounts['alpha@example.com'].account.id;
      stubPassportStub('alpha@example.com');
      try {
        res = await httpClient.post(`${baseURL}/${type}`, {
          agent, json: {
            account: accountId,
            requiredAuthenticationMethods: ['totp-challenge'],
            authenticationMethod: 'totp-challenge'
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
              email: 'alpha@example.com',
              requiredAuthenticationMethods: ['totp-challenge'],
              authenticationMethod: 'totp-challenge'
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
    it('should create `nonce` without authentication',
      async function() {
        const type = 'nonce';
        let err;
        let res;
        // posting a body without an accountId
        try {
          res = await httpClient.post(`${baseURL}/${type}`, {
            agent, json: {
              email: 'alpha@example.com',
              requiredAuthenticationMethods: ['login-email-challenge'],
              authenticationMethod: 'login-email-challenge'
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
    it('should create "password"', async function() {
      const type = 'password';
      const accountId = accounts['alpha@example.com'].account.id;
      const password = 'some-password';
      const saltRounds = 10;
      const hash = await bcrypt.hash(password, saltRounds);
      stubPassportStub('alpha@example.com');
      let err;
      let res;
      try {
        res = await httpClient.post(`${baseURL}/${type}`, {
          agent, json: {
            account: accountId,
            hash,
            requiredAuthenticationMethods: ['login-email-challenge'],
            authenticationMethod: 'login-email-challenge'
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
      accounts = mockData.accounts;
    });
    afterEach(async function() {
      stubPassportStub(null);
    });
    it('should be able to get salt for a token', async function() {
      const type = 'nonce';
      let err;
      let res;
      stubPassportStub('alpha@example.com');
      // set a nonce for the account
      await httpClient.post(`${baseURL}/${type}`, {
        agent, json: {
          email: 'alpha@example.com',
          requiredAuthenticationMethods: ['login-email-challenge'],
          authenticationMethod: 'login-email-challenge'
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
      accounts = mockData.accounts;
    });
    afterEach(async function() {
      stubPassportStub(null);
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
            account: accountId,
            requiredAuthenticationMethods: ['login-email-challenge'],
            authenticationMethod: 'login-email-challenge'
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
      try {
        result = await brAuthnToken.getAll({
          accountId,
          type: 'nonce',
        });
      } catch(e) {
        err2 = e;
      }
      assertNoError(err2);
      should.exist(result);
      result.should.be.an('object');
      result.tokens.length.should.equal(1);
      result.tokens[0].should.be.an('object');
      result.tokens[0].should.have.keys([
        'authenticationMethod', 'requiredAuthenticationMethods', 'id', 'salt',
        'sha256', 'expires'
      ]);
      // delete the nonce for the account
      let res2;
      let err3;
      try {
        res2 = await httpClient.delete(
          `${baseURL}/${type}?account=${accountId}&tokenId=${result
            .tokens[0].id}`, {
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
          accountId,
          type: 'nonce',
          id: 'zW34DhUd4scRCfNNnsgk6t5'
        });
      } catch(e) {
        err4 = e;
      }
      assertNoError(err4);
      should.exist(result2);
      result2.should.be.an('object');
      result2.tokens.should.eql([]);
    });
  });
  describe('post /routes.authenticate', () => {
    before(async function setup() {
      await helpers.prepareDatabase(mockData);
      accounts = mockData.accounts;
    });
    afterEach(async function() {
      stubPassportStub(null);
    });
    it('should authenticate with a token successfully', async function() {
      const type = 'totp';
      let err;
      stubPassportStub('alpha@example.com');
      const accountId = accounts['alpha@example.com'].account.id;
      const clientId = await generateId({fixedLength: true});
      // set a totp for the account with authenticationMethod set to
      // 'token-client-registration'
      const {secret} = await brAuthnToken.set({
        accountId,
        type,
        authenticationMethod: 'token-client-registration',
        clientId
      });
      const challenge = authenticator.generate(secret);

      // attempt to authenticate
      let res;
      try {
        res = await httpClient.post(`${authenticateURL}`, {
          agent,
          headers: {
            Cookie: `cid=${clientId}`
          },
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
        accountId,
        type,
      });
      const {secret: secret2} = await brAuthnToken.set({
        accountId,
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
    it('should authenticate with a password', async function() {
      const type = 'password';
      const accountId = accounts['alpha@example.com'].account.id;
      const password = 'test-password';
      const saltRounds = 10;
      const hash = await bcrypt.hash(password, saltRounds);
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

      // authenticate with the password
      let res2;
      let err2;
      try {
        res2 = await httpClient.post(`${authenticateURL}`, {
          agent,
          json: {
            email: 'alpha@example.com',
            type,
            hash
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
    it('should throw error when authenticating with a bad token',
      async function() {
        const type = 'totp';
        let err;
        stubPassportStub('alpha@example.com');
        const accountId = accounts['alpha@example.com'].account.id;

        // attempt to authenticate with an incorrect challenge
        let res;
        try {
          res = await httpClient.post(`${authenticateURL}`, {
            agent,
            json: {
              account: accountId,
              type,
              challenge: 'incorrect-challenge',
            }
          });
        } catch(e) {
          err = e;
        }
        should.exist(err);
        should.not.exist(res);
        err.name.should.equal('HTTPError');
        err.message.should.equal('Not authenticated.');
      });
  });
  describe('get /routes.registration', () => {
    before(async function setup() {
      await helpers.prepareDatabase(mockData);
      accounts = mockData.accounts;
    });
    afterEach(async function() {
      stubPassportStub(null);
    });
    it('should return `true` if client is registered.',
      async function() {
        const type = 'totp';
        let err;
        stubPassportStub('alpha@example.com');
        const accountId = accounts['alpha@example.com'].account.id;
        const clientId = await generateId({fixedLength: true});
        // set a totp for the account with authenticationMethod set to
        // 'token-client-registration'
        const {secret} = await brAuthnToken.set({
          accountId,
          type,
          authenticationMethod: 'token-client-registration',
          clientId
        });
        const challenge = authenticator.generate(secret);

        // authenticate with the token
        let res;
        try {
          res = await httpClient.post(`${authenticateURL}`, {
            agent,
            headers: {
              Cookie: `cid=${clientId}`
            },
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
        // check if token client  is registered.
        let res2;
        let err2;
        try {
          res2 = await httpClient.get(
            `${registrationURL}?email=alpha@example.com`, {
              agent, headers: {
                Cookie: `cid=${clientId}`
              }
            });
        } catch(e) {
          err = e;
        }
        assertNoError(err2);
        should.exist(res2);
        res2.data.registered.should.equal(true);
      });
    it('should return `false` if client is not registered.',
      async function() {
        // call the endpoint with an unregistered token client.
        let res;
        let err;
        try {
          res = await httpClient.get(
            `${registrationURL}?email=beta@example.com`, {
              agent
            });
        } catch(e) {
          err = e;
        }
        assertNoError(err);
        should.exist(res);
        res.data.registered.should.equal(false);
      });
  });
  describe('get /routes.login', () => {
    beforeEach(async function setup() {
      await helpers.prepareDatabase(mockData);
      accounts = mockData.accounts;
    });
    afterEach(async function() {
      stubPassportStub(null);
    });
    it('should fail login if email and password combination is incorrect',
      async function() {
        const accountId = accounts['alpha@example.com'].account.id;
        let res;
        let err;
        try {
          res = await httpClient.post(
            `${loginURL}`, {
              agent, json: {
                account: accountId,
                email: 'alpha@example.com',
                type: 'password',
                hash: 'incorrect-password'
              }
            });
        } catch(e) {
          err = e;
        }
        should.exist(err);
        should.not.exist(res);
        err.name.should.equal('HTTPError');
        err.status.should.equal(400);
        err.message.should.equal(
          'The email address and password or token combination is incorrect.'
        );
      });
    it('should successfully login if email and password are correct',
      async function() {
        const accountId = accounts['alpha@example.com'].account.id;
        const email = 'alpha@example.com';
        const type = 'password';
        const password = 'some-password';
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);

        // disable authentication to allow password to be set
        stubPassportStub(email);

        let err;
        let res;
        // set password for the account
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

        // now clear passport stub to ensure authentication is checked
        stubPassportStub(null);

        // login
        let res3;
        let err3;
        try {
          res3 = await httpClient.post(
            `${loginURL}`, {
              agent, json: {
                account: accountId,
                email,
                hash,
                type
              }
            });
        } catch(e) {
          err3 = e;
        }
        assertNoError(err3);
        should.exist(res3);
        res3.status.should.equal(200);
        should.exist(res3.data);
        res3.data.should.be.an('object');
      });
    it('should successfully login with multifactor authentication',
      async function() {
        const type = 'totp';
        const accountId = accounts['alpha@example.com'].account.id;
        const clientId = await generateId({fixedLength: true});

        await brAuthnToken.setAuthenticationRequirements({
          accountId,
          requiredAuthenticationMethods: ['token-client-registration'],
        });
        // set a totp for the account with authenticationMethod set to
        // 'token-client-registration'
        const {secret} = await brAuthnToken.set({
          accountId,
          type,
          authenticationMethod: 'token-client-registration',
          clientId
        });
        const challenge = authenticator.generate(secret);
        // authenticate with the token
        let res;
        let err;
        try {
          res = await httpClient.post(`${authenticateURL}`, {
            agent,
            headers: {
              Cookie: `cid=${clientId}`
            },
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

        const splitCookieHeaders =
          setCookie.splitCookiesString(res.headers.get('set-cookie'));
        const cookies = setCookie.parse(splitCookieHeaders);
        const sidCookie = cookies.find(x => x.name === 'bedrock.sid');
        // login after authentication
        let res2;
        let err2;
        try {
          res2 = await httpClient.post(
            `${loginURL}`, {
              agent, json: {
                account: accountId,
                type: 'multifactor'
              }, headers: {
                Cookie: `cid=${clientId};` +
                  `${sidCookie.name}=${sidCookie.value}`
              }
            });
        } catch(e) {
          err2 = e;
        }
        assertNoError(err2);
        should.exist(res2);
        res2.data.account.should.equal(accountId);
        res2.status.should.equal(200);
      });
    it('should fail multifactor login if account is not authenticated',
      async function() {
        const accountId = accounts['alpha@example.com'].account.id;
        let res;
        let err;
        try {
          res = await httpClient.post(
            `${loginURL}`, {
              agent, json: {
                account: accountId,
                type: 'multifactor'
              }
            });
        } catch(e) {
          err = e;
        }
        should.exist(err);
        should.not.exist(res);
        err.name.should.equal('HTTPError');
        err.status.should.equal(400);
        err.message.should.equal('Not authenticated.');
      });
  });
});
