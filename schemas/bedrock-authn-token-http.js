/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
import {schemas} from '@bedrock/validation';

export function postToken() {
  return {
    title: 'postToken',
    type: 'object',
    additionalProperties: false,
    anyOf: [
      {required: ['email']},
      {required: ['account']}
    ],
    properties: {
      email: schemas.email(),
      account: {
        type: 'string'
      },
      hash: {
        type: 'string'
      },
      authenticationMethod: {
        type: 'string'
      },
      requiredAuthenticationMethods: {
        type: 'array',
        items: {
          oneOf: [
            {type: 'string'},
            {type: 'array', items: {type: 'string'}}
          ]
        }
      },
      serviceId: {
        type: 'string'
      },
      typeOptions: {
        type: 'object',
        properties: {
          entryStyle: {
            type: 'string'
          }
        }
      }
    }
  };
}

export function getTokensQuery() {
  return {
    title: 'getTokensQuery',
    type: 'object',
    additionalProperties: false,
    required: ['email'],
    properties: {
      email: schemas.email()
    }
  };
}

export function postAuthenticate() {
  return {
    title: 'postAuthenticate',
    type: 'object',
    additionalProperties: false,
    required: ['type'],
    anyOf: [
      {required: ['email', 'hash']},
      {required: ['account', 'hash']},
      {required: ['email', 'challenge']},
      {required: ['account', 'challenge']}
    ],
    properties: {
      type: {
        type: 'string',
        enum: ['password', 'nonce', 'totp', 'multifactor']
      },
      email: schemas.email(),
      account: {
        type: 'string'
      },
      hash: {
        type: 'string'
      },
      challenge: {
        type: 'string'
      }
    }
  };
}

export function postLogin() {
  return {
    title: 'postLogin',
    type: 'object',
    additionalProperties: false,
    required: ['type'],
    properties: {
      type: {
        type: 'string',
        enum: ['password', 'nonce', 'totp', 'multifactor']
      },
      email: schemas.email(),
      account: {
        type: 'string'
      },
      hash: {
        type: 'string'
      }
    }
  };
}

export function postRequirements() {
  return {
    title: 'postRequirements',
    type: 'object',
    additionalProperties: false,
    required: ['account', 'requiredAuthenticationMethods'],
    properties: {
      account: {
        type: 'string'
      },
      requiredAuthenticationMethods: {
        type: 'array',
        items: {
          oneOf: [
            {type: 'string'},
            {type: 'array', items: {type: 'string'}}
          ]
        }
      }
    }
  };
}

export function getAuthenticationRequirements() {
  return {
    title: 'getAuthenticationRequirements',
    type: 'object',
    additionalProperties: false,
    required: ['account'],
    properties: {
      account: {
        type: 'string'
      }
    }
  };
}

export function getClientRegistrationQuery() {
  return {
    title: 'getClientRegistrationQuery',
    type: 'object',
    additionalProperties: false,
    required: ['email'],
    properties: {
      email: schemas.email()
    }
  };
}

export function postRecovery() {
  return {
    title: 'postRecovery',
    type: 'object',
    additionalProperties: false,
    required: ['account', 'recoveryEmail'],
    properties: {
      account: {
        type: 'string'
      },
      recoveryEmail: schemas.email()
    }
  };
}
