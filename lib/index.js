/*
 * Copyright (c) 2018-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const asyncHandler = require('express-async-handler');
const bedrock = require('bedrock');
const {config} = bedrock;
require('bedrock-express');
const brAuthnToken = require('bedrock-authn-token');
const brPassport = require('bedrock-passport');
const {
  ensureAuthenticated,
  optionallyAuthenticated
} = brPassport;
const {BedrockError} = bedrock.util;

// load config defaults
require('./config');

// module API
const api = {};
module.exports = api;

//const logger = bedrock.loggers.get('app').child('bedrock-authn-token-http');

// configure passport before serving static files
bedrock.events.on('bedrock-express.configure.static', () => {
  const TokenStrategy = require('./TokenStrategy');
  const MultifactorStrategy = require('./MultifactorStrategy');
  brPassport.use({
    strategy: new TokenStrategy()
  });
  brPassport.use({
    strategy: new MultifactorStrategy()
  });
});

bedrock.events.on('bedrock-express.configure.routes', app => {
  const cfg = config['authn-token-http'];
  const {routes} = cfg;
  const typeRoute = routes.basePath + '/:type';

  // create a token and notify the user
  app.post(
    typeRoute,
    optionallyAuthenticated,
    // TODO: validate({query: 'services.authn.token.postToken.query'})
    // TODO: validate('services.authn.token.postToken')
    asyncHandler(async (req, res) => {
      const {type} = req.params;
      const {account, email, hash, clientId} = req.body;

      if(type === 'nonce') {
        // permitted without authentication
        const {actor = null} = (req.user || {});
        await brAuthnToken.set({actor, account, email, type, clientId});
        res.status(204).end();
      } else {
        // all other types require authentication to create
        if(!req.isAuthenticated()) {
          throw new BedrockError(
            'Could not create authentication token; authentication required.',
            'NotAllowedError', {
              public: true,
              httpStatusCode: 400
            });
        }

        const {actor} = req.user;
        await brAuthnToken.set({actor, account, email, type, hash});
        res.status(204).end();
      }
    }));

  app.get(
    typeRoute + '/salt',
    // Note: authentication not required for obtaining salt for a user
    // FIXME: implement validation
    //validate({query: 'services.authn.token.getTokensQuery'}),
    asyncHandler(async (req, res) => {
      const {type} = req.params;
      const {account = undefined, email = undefined} = req.query;
      const token = await brAuthnToken.get({actor: null, account, email, type});
      if(!token) {
        return res.status(404).end();
      }
      const {salt} = token;
      res.json({salt});
    }));

  app.delete(
    typeRoute,
    ensureAuthenticated,
    asyncHandler(async (req, res) => {
      const {actor} = req.user;
      const {account} = req.query;
      const {type} = req.params;
      await brAuthnToken.remove({actor, account, type});
      res.status(204).end();
    }));

  app.post(
    routes.authenticate,
    //validate('services.authn.token.postAuthenticate'),
    async (req, res) => {
      const {type, account, email, hash, challenge} = req.body;

      // get previously authenticated methods from session
      const data = _getSessionAuthenticationData({req});
      const authenticatedMethods = data.authenticatedMethods || [];

      // make sure session data includes whether or not token client has
      // registered
      if(!authenticatedMethods.includes('token-client-registration')) {
        // FIXME: get client ID from cookie
        const clientId = 'FIXME';
        const result = await brAuthnToken.clients.isRegistered(
          {actor: null, email, account, clientId});
        if(result.registered) {
          authenticatedMethods.push('token-client-registration');
        }
      }

      const result = await brAuthnToken.verify({
        actor: null, account, email, type, hash, challenge,
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
      authenticatedMethods.push(authenticationMethod);

      // if `authenticationMethod` is `token-client-registration` then
      // register token client for it
      if(authenticationMethod === 'token-client-registration') {
        // FIXME: get client ID from cookie
        const clientId = 'FIXME';
        await brAuthnToken.clients.set(
          {actor: null, email, account, clientId, authenticated: true});
      }

      // update session data
      _updateSessionAuthenticationData(
        {req, account: result.id, authenticatedMethods});

      // send 200 response {account, authenticated: true}
      res.send({
        account: {id: result.id, email: result.email},
        authenticated: true
      });
    });

  app.post(
    routes.login,
    // FIXME: implement validation
    //validate('services.authn.token.postLogin'),
    async (req, res, next) => {
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
    });

  app.post(
    routes.requirements,
    ensureAuthenticated,
    // FIXME: implement validation
    //validate('services.authn.token.postRequirements'),
    async (req, res) => {
      const {actor} = req.user;
      const {account, requiredAuthenticationMethods} = req.body;
      await brAuthnToken.setAuthenticationRequirements(
        {actor, account, requiredAuthenticationMethods});
      res.status(204).end();
    });
});

function _getSessionAuthenticationData({req}) {
  if(!(req.session && typeof req.session === 'object')) {
    return null;
  }
  return req.session['bedrock-authn-token'] || {};
}

function _updateSessionAuthenticationData(
  {req, account, authenticatedMethods}) {
  // always re-fetch data to ensure another request hasn't changed it
  // asynchronously
  const data = _getSessionAuthenticationData({req});
  if(data.account && data.acount !== account) {
    throw new BedrockError(
      'Could not update session authentication data; authenticated account ' +
      'has changed.',
      'InvalidStateError', {public: true, httpStatusCode: 400});
  }
  data.account = account;
  if(authenticatedMethods) {
    if(!data.authenticatedMethods) {
      data.authenticatedMethods = authenticatedMethods.slice();
    } else {
      for(const m of authenticatedMethods) {
        if(!data.authenticatedMethods.includes(m)) {
          data.authenticatedMethods.push(m);
        }
      }
    }
    req.session['bedrock-authn-token'] = data;
  }
}
