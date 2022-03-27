/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
const bedrock = require('bedrock');
const sinon = require('sinon');
const {passport} = require('bedrock-passport');
const original = passport.authenticate;
global.passportStub = sinon.stub(passport, 'authenticate');
global.passportStub._original = original;

require('bedrock-mongodb');
require('bedrock-express');
require('bedrock-account');
require('bedrock-account-http');
require('bedrock-authn-token');
require('bedrock-authn-token-http');
require('bedrock-https-agent');
require('bedrock-session-mongodb');
require('bedrock-test');

bedrock.start();
