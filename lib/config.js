/*
 * Copyright (c) 2018-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {config} = require('bedrock');
require('bedrock-validation');

config.express.useSession = true;
const cfg = config['authn-token-http'] = {};

cfg.cookies = {};
// client id to be baked into cookies that is used in client registration
cfg.cookies.clientId = {
  name: 'cid',
  options: {
    // 30 days expiration
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true
  }
};

cfg.routes = {
  basePath: '/authn/tokens',
  authenticate: '/authn/token/authenticate',
  login: '/authn/token/login',
  requirements: '/authn/token/requirements',
  registration: '/authn/token/client/registration',
  recovery: '/authn/token/recovery'
};

// common validation schemas
// config.validation.schema.paths.push(
//  path.join(__dirname, '..', 'schemas'));
