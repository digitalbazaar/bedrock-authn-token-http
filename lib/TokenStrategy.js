/*!
 * Copyright (c) 2018-2022 Digital Bazaar, Inc. All rights reserved.
 */
import * as brAccount from 'bedrock-account';
import * as brAuthnToken from 'bedrock-authn-token';
import {Strategy as LocalStrategy} from 'passport-local';
import {callbackify} from 'util';

export class TokenStrategy extends LocalStrategy {
  /**
   * Creates a new TokenStrategy for use with passport.
   *
   * @param {object} options - The options to pass to the parent LocalStrategy.
   */
  constructor(options = {}) {
    options = {...options};
    if(!('usernameField' in options)) {
      options.usernameField = 'email';
    }
    if(!('passwordField' in options)) {
      options.passwordField = 'hash';
    }
    options.passReqToCallback = true;

    super(options, callbackify(_verify));
    this.name = 'bedrock-authn-token';
  }
}

async function _verify(req, email, hash) {
  const {type} = req.body;
  const result = await brAuthnToken.verify({email, type, hash});
  if(!result) {
    return false;
  }

  // get authentication method requirements from account meta
  const account = {id: result.id, email: result.email};
  const {meta} = await brAccount.get({id: account.id});
  const {requiredAuthenticationMethods} = meta['bedrock-authn-token'];
  if(requiredAuthenticationMethods &&
    requiredAuthenticationMethods.length !== 0) {
    // multifactor login required
    throw new Error('Multifactor authentication required for account.');
  }

  return {account};
}
