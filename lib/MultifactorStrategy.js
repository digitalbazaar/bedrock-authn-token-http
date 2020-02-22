/*
 * Copyright (c) 2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const brAccount = require('bedrock-account');
const brAuthnToken = require('bedrock-authn-token');
const {Strategy} = require('passport-strategy');
const util = require('util');

/**
 * Creates a new MultifactorStrategy for use with passport.
 *
 * @param [options={}] the options to pass to the parent LocalStrategy.
 */
function MultifactorStrategy({} = {}) {
  Strategy.call(this);
  this.name = 'bedrock-authn-token.multifactor';
}
util.inherits(MultifactorStrategy, Strategy);

// authenticate based on session information
MultifactorStrategy.prototype.authenticate = function(req) {
  // validate session information
  const data = (req.session || {})['bedrock-authn-token'];
  if(!(data && typeof data === 'object' && data.account &&
    typeof data.account === 'string')) {
    return this.fail(400);
  }

  authenticate(req).then(
    user => user ? this.success(user) : this.fail(400),
    err => this.error(err));
};

async function authenticate(req) {
  // get authn token data from current session
  const data = req.session['bedrock-authn-token'];

  // get authentication method requirements from account meta
  const {account, meta} = await brAccount.get({actor: null, id: data.account});
  const {requiredAuthenticationMethods} = meta['bedrock-authn-token'];

  // check `data.authenticatedMethods` against `requiredAuthenticatedMethods`
  const {authenticatedMethods = []} = data;
  const met = await brAuthnToken.checkAuthenticationRequirements({
    requiredAuthenticationMethods,
    authenticatedMethods
  });
  if(!met) {
    // required authentication methods not met
    return false;
  }

  const actor = await brAccount.getCapabilities({id: account.id});
  return {account, actor};
}

module.exports = MultifactorStrategy;
