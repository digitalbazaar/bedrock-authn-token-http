/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {util: {uuid}} = require('bedrock');

const accounts = exports.accounts = {};

const email = 'alpha@example.com';
accounts[email] = {};
accounts[email].account = _createAccount(email);
accounts[email].meta = {};

function _createAccount(email) {
  const newAccount = {
    id: 'urn:uuid:' + uuid(),
    email
  };
  return newAccount;
}
