/*
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */
const bedrock = require('bedrock');
const sinon = require('sinon');
const brPassport = require('bedrock-passport');
/* passportStub is defined globally here because we need to stub
optionallyAuthenticated before bedrock-express starts since it keeps
a reference to the middleware that is given to it when the api is defined.
This is necessary only if we want to stub the middleware directly.
*/
global.passportStub = sinon.stub(brPassport, 'optionallyAuthenticated');

require('bedrock-mongodb');
require('bedrock-express');
require('bedrock-account');
require('bedrock-account-http');
require('bedrock-authn-token');
require('bedrock-permission');
require('bedrock-authn-token-http');
require('bedrock-https-agent');
require('bedrock-session-mongodb');
require('bedrock-test');

bedrock.start();
