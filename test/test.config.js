/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {config, util} from '@bedrock/core';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import '@bedrock/account-http';
import '@bedrock/https-agent';
import '@bedrock/mongodb';

const cc = util.config.main.computer();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

config.mocha.tests.push(path.join(__dirname, 'mocha'));

// MongoDB
config.mongodb.name = 'bedrock_authn_token_http_test';
// drop all collections on initialization
config.mongodb.dropCollections = {};
config.mongodb.dropCollections.onInit = true;
config.mongodb.dropCollections.collections = [];

// allow self-signed certs in test framework
config['https-agent'].rejectUnauthorized = false;

// this needs to be true in order to set auth stuff
config['account-http'].autoLoginNewAccounts = true;

config.express.useSession = true;

// admit the test suite's wallet origin in addition to whatever this test
// server's own computed origin happens to be
cc('authn-token-http.requestOriginAllowList', () => {
  return [config.server.baseUri, 'https://wallet.example'];
});
