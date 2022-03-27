/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */
import * as brAccount from 'bedrock-account';
import * as brAuthnToken from 'bedrock-authn-token';
import {Strategy} from 'passport-strategy';

export class MultifactorStrategy extends Strategy {
  /**
   * Creates a new MultifactorStrategy for use with passport.
   *
   * @param {object} [options={}] - The options to pass to the parent strategy.
   */
  constructor({} = {}) {
    super();
    this.name = 'bedrock-authn-token.multifactor';
  }

  // authenticate based on session information
  authenticate(req) {
    // validate session information
    const data = (req.session || {})['bedrock-authn-token'];
    if(!(data && typeof data === 'object' && data.accountId &&
      typeof data.accountId === 'string')) {
      return this.fail(400);
    }

    _authenticate(req).then(
      user => user ? this.success(user) : this.fail(400),
      err => this.error(err));
  }
}

async function _authenticate(req) {
  // get authn token data from current session
  const data = req.session['bedrock-authn-token'];

  // get authentication method requirements from account meta
  const {account, meta} = await brAccount.get({id: data.accountId});
  const {requiredAuthenticationMethods} = meta['bedrock-authn-token'];
  if(!requiredAuthenticationMethods ||
    requiredAuthenticationMethods.length === 0) {
    // multifactor login not permitted
    throw new Error('Multifactor authentication not permitted for account.');
  }

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

  return {account};
}
