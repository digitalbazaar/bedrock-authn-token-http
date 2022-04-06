/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
import sinon from 'sinon';
import {passport} from '@bedrock/passport';
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
