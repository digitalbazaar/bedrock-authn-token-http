/*
 * Copyright (c) 2018-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {config} = require('bedrock');
require('bedrock-validation');

const cfg = config['authn-token-http'] = {};

cfg.routes = {
  basePath: '/authn/tokens',
  authenticate: '/authn/token/authenticate',
  login: '/authn/token/login',
  requirements: '/authn/token/requirements'
};

// common validation schemas
//config.validation.schema.paths.push(
//  path.join(__dirname, '..', 'schemas'));
