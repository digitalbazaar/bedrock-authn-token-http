/*!
 * Copyright (c) 2018-2022 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {asyncHandler} = require('bedrock-express');
const bedrock = require('bedrock');
const brPassport = require('bedrock-passport');
const brAccount = require('bedrock-account');
const {config} = bedrock;
require('bedrock-express');
const brAuthnToken = require('bedrock-authn-token');
const {createValidateMiddleware} = require('bedrock-validation');
const schemas = require('../schemas/bedrock-authn-token-http.js');
const {
  ensureAuthenticated,
  optionallyAuthenticated
} = brPassport;
const {BedrockError} = bedrock.util;
const {generateId} = require('bnid');

// load config defaults
require('./config');

// configure passport before serving static files
bedrock.events.on('bedrock-express.configure.static', () => {
  const TokenStrategy = require('./TokenStrategy');
  const MultifactorStrategy = require('./MultifactorStrategy');
  brPassport.use({strategy: new TokenStrategy()});
  brPassport.use({strategy: new MultifactorStrategy()});
});

bedrock.events.on('bedrock-express.configure.routes', app => {
  const cfg = config['authn-token-http'];
  const {routes} = cfg;
  const typeRoute = routes.basePath + '/:type';

  // create a token and notify the user
  app.post(
    typeRoute,
    optionallyAuthenticated,
    createValidateMiddleware({bodySchema: schemas.postToken}),
    asyncHandler(async (req, res) => {
      const {type} = req.params;
      const {
        account: accountId, email, hash, serviceId,
        authenticationMethod, requiredAuthenticationMethods, typeOptions
      } = req.body;
      const {name} = cfg.cookies.clientId;
      let clientId = req.cookies[name];
      if(authenticationMethod === 'token-client-registration') {
        // generate a client ID if one has not been set yet; otherwise
        // reuse the existing one, which improves the UX for users on
        // shared devices (each has to authenticate the client ID but
        // once authenticated it is not deleted from the device when
        // another user authenticates)
        if(!clientId) {
          clientId = await generateId({fixedLength: true});
        }
        // save it to the database
        await brAuthnToken.clients.set(
          {email, accountId, clientId, authenticated: false});
        // set a cookie in the response
        const {name, options} = cfg.cookies.clientId;
        res.cookie(name, clientId, options);
      }
      if(type === 'nonce') {
        // note: anyone can request a nonce, no authentication required
        await brAuthnToken.set({
          accountId, email, type, clientId,
          authenticationMethod, requiredAuthenticationMethods, typeOptions
        });
        res.status(204).end();
      } else {
        // all other types require authentication to create...
        if(!(req.isAuthenticated() && req.user.account)) {
          throw new BedrockError(
            'Could not create authentication token; authentication required.',
            'NotAllowedError', {
              public: true,
              httpStatusCode: 403
            });
        }

        // require matching account ID / email
        if((accountId && accountId !== req.user.account.id) ||
          (email && email !== req.user.account.email)) {
          throw new BedrockError(
            'The authenticated account does not match the target account.',
            'NotAllowedError', {
              httpStatusCode: 403,
              public: true
            });
        }

        const result = await brAuthnToken.set({
          accountId, email, type, hash, clientId, serviceId,
          authenticationMethod, requiredAuthenticationMethods
        });

        // return appropriate data for each type, or none
        if(type === 'totp') {
          res.json(result);
        } else {
          res.status(204).end();
        }
      }
    }));

  app.get(
    typeRoute + '/salt',
    // Note: authentication not required for obtaining salt for a user
    createValidateMiddleware({querySchema: schemas.getTokensQuery}),
    asyncHandler(async (req, res) => {
      const {type} = req.params;
      if(!(type === 'password' || type === 'nonce')) {
        throw new BedrockError(
          'Token "type" must be "password" or "nonce".',
          'NotAllowedError', {
            httpStatusCode: 400,
            public: true
          });
      }
      const {account: accountId, email} = req.query;
      // if a token does not exist `brAuthnToken.get` throws a NotFoundError
      const token = await brAuthnToken.get({accountId, email, type});
      const {salt} = token;
      res.json({salt});
    }));

  app.delete(
    typeRoute,
    ensureAuthenticated,
    asyncHandler(async (req, res) => {
      const {account: accountId, tokenId} = req.query;
      _checkAccount({req, accountId});
      const {type} = req.params;
      await brAuthnToken.remove({accountId, type, id: tokenId});
      res.status(204).end();
    }));

  app.post(
    routes.authenticate,
    createValidateMiddleware({bodySchema: schemas.postAuthenticate}),
    asyncHandler(async (req, res) => {
      const {type, account: accountId, email, hash, challenge} = req.body;

      // get previously authenticated methods from session
      let data = _getSessionAuthenticationData({req});
      const authenticatedMethods = data.authenticatedMethods || [];

      // get clientId from cookie
      const {name} = cfg.cookies.clientId;
      const clientId = req.cookies[name];

      // make sure session data includes whether or not token client has
      // registered
      if(!authenticatedMethods
        .includes('token-client-registration') && clientId) {
        const result = await brAuthnToken.clients.isRegistered(
          {email, accountId, clientId});
        if(result.registered) {
          authenticatedMethods.push('token-client-registration');
        }
      }
      const result = await brAuthnToken.verify({
        accountId, email, type, hash, challenge, clientId,
        authenticatedMethods
      });
      if(!result) {
        // authentication failed
        throw new BedrockError(
          'Not authenticated.',
          'NotAllowedError', {public: true, httpStatusCode: 400});
      }

      // update authenticated methods
      const {authenticationMethod} = result.token;
      if(!authenticatedMethods.includes(authenticationMethod)) {
        authenticatedMethods.push(authenticationMethod);
      }

      // if `authenticationMethod` is `token-client-registration` then
      // mark the client as authenticated
      if(authenticationMethod === 'token-client-registration') {
        // mark the client as authenticated in the database
        await brAuthnToken.clients.set(
          {email, accountId, clientId, authenticated: true});
      }

      // update session data
      data = _updateSessionAuthenticationData(
        {req, accountId: result.id, authenticatedMethods});

      // get authentication method requirements from account meta
      const {meta} = await brAccount.get({id: result.id});
      const {requiredAuthenticationMethods = []} = meta['bedrock-authn-token'];

      // send 200 response
      // {account, authenticated: true, requiredAuthenticatedMethods}
      res.json({
        account: {id: result.id, email: result.email},
        authenticated: true,
        authenticatedMethods: data.authenticatedMethods,
        requiredAuthenticationMethods
      });
    }));

  app.post(
    routes.login,
    createValidateMiddleware({bodySchema: schemas.postLogin}),
    asyncHandler(async (req, res, next) => {
      const {type} = req.body;
      const strategy = type === 'multifactor' ?
        'bedrock-authn-token.multifactor' : 'bedrock-authn-token';

      let result;
      let cause;
      try {
        result = await brPassport.authenticate({strategy, req, res});
      } catch(e) {
        cause = e;
      }

      const {user = false} = (result || {});

      if(!user) {
        // user not authenticated
        let err;
        if(type === 'multifactor') {
          err = new BedrockError(
            'Not authenticated.',
            'NotAllowedError', {public: true, httpStatusCode: 400}, cause);
        } else {
          err = new BedrockError(
            'The email address and password or token combination is incorrect.',
            'NotAllowedError', {public: true, httpStatusCode: 400}, cause);
        }
        return next(err);
      }

      req.login(user, err => {
        if(err) {
          return next(err);
        }
        res.json({account: user.account.id});
      });
    }));

  app.post(
    routes.requirements,
    ensureAuthenticated,
    createValidateMiddleware({bodySchema: schemas.postRequirements}),
    asyncHandler(async (req, res) => {
      const {account: accountId, requiredAuthenticationMethods} = req.body;
      _checkAccount({req, accountId});
      await brAuthnToken.setAuthenticationRequirements(
        {accountId, requiredAuthenticationMethods});
      res.status(204).end();
    }));

  app.get(
    routes.requirements,
    ensureAuthenticated,
    createValidateMiddleware({
      querySchema: schemas.getAuthenticationRequirements
    }),
    asyncHandler(async (req, res) => {
      const {account: accountId} = req.query;
      _checkAccount({req, accountId});
      const result = await brAuthnToken.getAuthenticationRequirements(
        {accountId});
      res.json(result);
    }));

  app.get(
    routes.registration,
    // Note: authentication not required for obtaining registration status
    createValidateMiddleware({querySchema: schemas.getClientRegistrationQuery}),
    asyncHandler(async (req, res) => {
      const {email} = req.query;
      const {name} = cfg.cookies.clientId;
      const clientId = req.cookies[name];
      let isRegistered = false;
      if(clientId) {
        const result = await brAuthnToken.clients.isRegistered(
          {email, clientId});
        isRegistered = result.registered;
      }
      res.json({registered: isRegistered});
    }));

  app.post(
    routes.recovery,
    ensureAuthenticated,
    createValidateMiddleware({bodySchema: schemas.postRecovery}),
    asyncHandler(async (req, res) => {
      const {account: accountId, recoveryEmail} = req.body;
      _checkAccount({req, accountId});
      // TODO: support other recovery methods; only email supported presently
      await brAuthnToken.setRecoveryEmail({accountId, recoveryEmail});
      res.status(204).end();
    }));
});

function _checkAccount({req, accountId}) {
  if(!(req.user && req.user.account && req.user.account.id === accountId)) {
    throw new BedrockError(
      'The authenticated account does not match the target account.',
      'NotAllowedError', {
        httpStatusCode: 403,
        public: true
      });
  }
}

function _getSessionAuthenticationData({req}) {
  if(!(req.session && typeof req.session === 'object')) {
    return null;
  }
  return req.session['bedrock-authn-token'] || {};
}

function _updateSessionAuthenticationData(
  {req, accountId, authenticatedMethods}) {
  // always re-fetch data to ensure another request hasn't changed it
  // asynchronously
  const data = _getSessionAuthenticationData({req});
  if(data.accountId && data.accountId !== accountId) {
    throw new BedrockError(
      'Could not update session authentication data; authenticated account ' +
      'has changed.',
      'InvalidStateError', {public: true, httpStatusCode: 400});
  }
  data.accountId = accountId;
  if(authenticatedMethods) {
    if(!data.authenticatedMethods) {
      data.authenticatedMethods = [];
    }
    for(const m of authenticatedMethods) {
      if(!data.authenticatedMethods.includes(m)) {
        data.authenticatedMethods.push(m);
      }
    }
    req.session['bedrock-authn-token'] = data;
  }
  return data;
}
