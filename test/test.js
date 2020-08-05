/*
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */
const bedrock = require('bedrock');
const sinon = require('sinon');
const brPassport = require('bedrock-passport');
global.passportStub = sinon.stub(brPassport, 'optionallyAuthenticated');
require('bedrock-mongodb');
require('bedrock-express');
require('bedrock-account');
require('bedrock-account-http');
require('bedrock-authn-token');
require('bedrock-permission');
require('bedrock-authn-token-http');
require('bedrock-test');
require('bedrock-https-agent');

bedrock.start();
