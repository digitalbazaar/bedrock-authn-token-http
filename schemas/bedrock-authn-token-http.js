/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const postToken = {
  title: 'postToken',
  type: 'object',
  additionalProperties: false,
  anyOf: [
    {required: ['email']},
    {required: ['account']}
  ],
  properties: {
    email: {
      type: 'string'
    },
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
      type: 'array'
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

const getTokensQuery = {
  title: 'getTokensQuery',
  type: 'object',
  additionalProperties: false,
  required: ['email'],
  properties: {
    type: {
      type: 'string',
      enum: ['password', 'nonce']
    },
    email: {
      type: 'string'
    }
  }
};

const postAuthenticate = {
  title: 'postAuthenticate',
  type: 'object',
  additionalProperties: false,
  required: ['type'],
  anyOf: [
    {required: ['email']},
    {required: ['account']}
  ],
  properties: {
    type: {
      type: 'string',
      enum: ['password', 'nonce', 'totp', 'multifactor']
    },
    email: {
      type: 'string'
    },
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

const postLogin = {
  title: 'postLogin',
  type: 'object',
  additionalProperties: false,
  anyOf: [
    {required: ['email']},
    {required: ['account']}
  ],
  properties: {
    type: {
      type: 'string',
      enum: ['password', 'nonce', 'totp', 'multifactor']
    },
    email: {
      type: 'string'
    },
    account: {
      type: 'string'
    },
    hash: {
      type: 'string'
    },
    password: {
      type: 'string'
    }
  }
};

const postRequirements = {
  title: 'postRequirements',
  type: 'object',
  additionalProperties: false,
  required: ['account'],
  properties: {
    account: {
      type: 'string'
    },
    requiredAuthenticationMethods: {
      type: 'array'
    }
  }
};

const getAuthenticationRequirements = {
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

const getClientRegistrationQuery = {
  title: 'getClientRegistrationQuery',
  type: 'object',
  additionalProperties: false,
  required: ['email'],
  properties: {
    email: {
      type: 'string'
    }
  }
};

const postRecovery = {
  title: 'postRecovery',
  type: 'object',
  additionalProperties: false,
  required: ['account', 'recoveryEmail'],
  properties: {
    account: {
      type: 'string'
    },
    recoveryEmail: {
      type: 'string'
    }
  }
};

module.exports = {postToken, getTokensQuery, postAuthenticate, postLogin,
  postRequirements, getAuthenticationRequirements, getClientRegistrationQuery,
  postRecovery
};
