/*!
 * Copyright (c) 2018-2023 Digital Bazaar, Inc. All rights reserved.
 */
import {config, util} from '@bedrock/core';

const cc = util.config.main.computer();

const cfg = config['authn-token-http'] = {};

// defaults to this server's own origin so single-origin apps work unconfigured
cc('authn-token-http.authenticationOriginAllowList', () => {
  return [config.server.baseUri];
});

// set to `true` to accept a request with no `Origin` header, treating it as a
// non-browser client; a browser always sends `Origin` on a request that is not
// a `GET` or `HEAD`, so an absent header cannot come from one. An `Origin` of
// `null` is an opaque browser origin, not a non-browser client, and is still
// rejected by the allow list
cfg.allowMissingOrigin = false;

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
  // randomized delay value in ms; can be configured to help hide differences
  // in the amount of time it takes to find an existing account vs. fail to
  // find an account
  jitter: 0,
  // a secret that will be SHA-256 hashed to produce an HMAC key; the HMAC key
  // is used to generate the same fake token for the same user -- it can be
  // rotated from time to time to give the appearance of a change in hash
  // parameters
  hmacSecret: 'an example long secret phrase bear torpedo zihuatanejo'
};
