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

  // create a token of type `nonce` or `password and notify the user
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
        // type must be `password`, authentication required to create
        if(!req.isAuthenticated()) {
          throw new BedrockError(
            'Could not create password; authentication required.',
            'PermissionDenied', {
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
      // get previously authenticated methods from session
      const data = req.session['bedrock-authn-token'] || {};
      const authenticatedMethods = data.authenticatedMethods || [];

      // TODO: determine what to verify based on `req`
      // const account = await brAuthnToken.verify(
      //   {actor, account, email, type, hash, authenticatedMethods});

      if(!account) {
        // TODO: authentication failed
      }

      data.account = account.id;
      // TODO: update authenticated methods
      //data.authenticatedMethods =

      // TODO: send 200 response {account, authenticated: true}
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
});
