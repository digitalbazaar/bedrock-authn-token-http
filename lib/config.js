/*!
 * Copyright (c) 2018-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {config} from '@bedrock/core';

const cfg = config['authn-token-http'] = {};

cfg.cookies = {};
// client id to be baked into cookies that is used in client registration
cfg.cookies.clientId = {
  name: 'cid',
  options: {
    // 30 days expiration
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true
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

cfg.fakeTokenOptions = {
  jitter: 0, // randomized delay value in ms
  hmacKey: 'exampleKey'
};
