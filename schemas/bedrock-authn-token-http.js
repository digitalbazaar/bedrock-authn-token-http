/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const postTokenQuery = {
  title: 'postTokenQuery',
  type: 'object',
  additionalProperties: false,
  properties: {
    email: {
      type: 'string'
    },
    account: {
      type: 'string'
    },
    hash: {
      type: 'string'
    }
  }
};

const postToken = {
  title: 'postToken',
  type: 'object',
  additionalProperties: false,
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
  properties: {
    account: {
      type: 'string'
    },
    recoveryEmail: {
      type: 'string'
    }
  }
};

module.exports = {postTokenQuery, postToken, getTokensQuery, postAuthenticate,
  postLogin, postRequirements, getAuthenticationRequirements,
  getClientRegistrationQuery, postRecovery
};
