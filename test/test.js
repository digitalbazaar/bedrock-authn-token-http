/*!
 * Copyright (c) 2019-2023 Digital Bazaar, Inc. All rights reserved.
 */
import {passport} from '@bedrock/passport';
import sinon from 'sinon';
const original = passport.authenticate;
global.passportStub = sinon.stub(passport, 'authenticate');
global.passportStub._original = original;

import * as bedrock from '@bedrock/core';
import '@bedrock/account';
import '@bedrock/account-http';
import '@bedrock/authn-token';
import '@bedrock/authn-token-http';
import '@bedrock/https-agent';
import '@bedrock/express';
import '@bedrock/mongodb';
import '@bedrock/session-mongodb';
import '@bedrock/test';

bedrock.start();
