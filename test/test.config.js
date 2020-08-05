/*
 * Copyright (c) 2019-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {config} = require('bedrock');
const path = require('path');
const {permissions, roles} = config.permission;

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

roles['account.registered'] = {
  id: 'account.registered',
  label: 'Account Test Role',
  comment: 'Role for Test User',
  sysPermission: [
    permissions.ACCOUNT_ACCESS.id,
    permissions.ACCOUNT_UPDATE.id,
    permissions.ACCOUNT_INSERT.id
  ]
};
