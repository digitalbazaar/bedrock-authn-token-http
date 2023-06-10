/*!
 * Copyright (c) 2019-2023 Digital Bazaar, Inc. All rights reserved.
 */
import * as brAccount from '@bedrock/account';
import * as database from '@bedrock/mongodb';
import {config} from '@bedrock/core';
import crypto from 'node:crypto';

export async function createFakeToken({accountId, email} = {}) {
  const {'authn-token-http': cfg} = config;
  const salt = crypto.createHmac('sha256', cfg.fakeTokenOptions.hmacSecret)
    .update(accountId ?? email).digest()
    .toString('base64', 0, 16).split('=', 1)[0];
  const fakeToken = {
    hashParameters: {
      id: 'pbkdf2-sha512',
      params: {i: 100000},
      salt
    }
  };
  return fakeToken;
}

export async function prepareDatabase(mockData) {
  await removeCollections();
  await _insertTestData(mockData);
}

export async function removeCollections(
  collectionNames = ['account', 'account-email']) {
  await database.openCollections(collectionNames);
  for(const collectionName of collectionNames) {
    await database.collections[collectionName].deleteMany({});
  }
}

export async function removeCollection(collectionName) {
  return removeCollections([collectionName]);
}

async function _insertTestData(mockData) {
  const records = Object.values(mockData.accounts);
  for(const record of records) {
    try {
      await brAccount.insert(
        {account: record.account, meta: record.meta || {}});
    } catch(e) {
      if(e.name === 'DuplicateError') {
        // duplicate error means test data is already loaded
        continue;
      }
      throw e;
    }
  }
}
