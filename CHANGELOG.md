# bedrock-authn-token-http ChangeLog

## 8.1.0 - 2023-06-xx

### Added
- Introduce the `fakeTokenOptions.hmacSecret` config option to be used when
  generating fake tokens. Fake tokens are generated in an effort to hide
  whether an email has been registered with a system. This occurs when a
  request from the public internet is made for the token hash parameters
  associated with an account. This config value must be set to a secret in
  deployments to get any benefit from this feature. Existing deployments that
  did not previously have the feature may safely upgrade, even without changing
  the default value or doing so with incremental updates. No significant hiding
  will be in effect on such deployments until the default value is uniformly
  changed to a secret value.
- Introduce the `fakeTokenOptions.jitter` config option to reduce timing
  differences when generating fake tokens to hide email registrations.

### Fixed
- Return uniform errors from `/authn/tokens/<token-type>/hash-parameters`.
- Return fake hash parameters in case of invalid account information.

## 8.0.0 - 2023-01-24

### Changed
- **BREAKING**: Update peer deps:
  - `@bedrock/account@9`
  - `@bedrock/authn-token@11`
  - `@bedrock/passport@11`.
  - This changes include database layout and record format changes that are
    incompatible with previous releases.

## 7.0.2 - 2022-05-26

### Fixed
- Ensure client ID cookie is set to secure.

## 7.0.1 - 2022-05-21

### Fixed
- Use `bnid@3` to reduce dependencies.

## 7.0.0 - 2022-05-21

### Added
- Add `/authn/tokens/<token-type>/hash-parameters` route that reports all hash
  parameters for a `nonce` or `password`. This route replaces
  `/authn/tokens/<token-type>/salt` that only reported the `salt`.

### Changed
- **BREAKING**: Update peer deps:
  - `@bedrock/authn-token@10`.
- **BREAKING**: The new `@bedrock/authn-token` version no longer supports
  generating bcrypt-based nonces, only pbkdf2 is supported because it has
  native client support. Existing bcrypt-based passwords can still be verified
  but should be eventually replaced by pbkdf2 passwords.
- **BREAKING**: Improve email validation.

### Removed
- **BREAKING**: Removed `/authn/tokens/<token-type>/salt` route.
  Use `/authn/tokens/<token-type>/hash-parameters` instead.

## 6.0.0 - 2022-04-29

### Changed
- **BREAKING**: Update peer deps:
  - `@bedrock/core@6`
  - `@bedrock/account@8`
  - `@bedrock/authn-token@9`
  - `@bedrock/express@8`
  - `@bedrock/passport@10`
  - `@bedrock/validation@7`.

## 5.0.0 - 2022-04-06

### Changed
- **BREAKING**: Rename package to `@bedrock/authn-token-http`.
- **BREAKING**: Convert to module (ESM).
- **BREAKING**: Remove default export.
- **BREAKING**: Require node 14.x.

## 4.1.0 - 2022-03-27

### Changed
- Update peer deps:
  - `bedrock@4.5`
  - `bedrock-account@6.3.2`
  - `bedrock-authn-token@7.1.1`
  - `bedrock-express@6.4.1`
  - `bedrock-passport@8.1.0`
  - `bedrock-validation@5.6.3`.
- Update internals to use esm style and use `esm.js` to
  transpile to CommonJS.

## 4.0.1 - 2022-03-12

### Fixed
- Add optional `serviceId` to post token validator.

## 4.0.0 - 2022-03-12

### Added
- **BREAKING**: Add validation to all endpoints using `createValidateMiddleware`
  from `bedrock-validation@5.5`.

## 3.0.0 - 2022-03-08

### Changed
- **BREAKING**: Use `bedrock-account@6` which removes `bedrock-permission`
  including concepts such as `actor`.
- **BREAKING**: Updated peer dependencies, use:
  - `bedrock@4.4`
  - `bedrock-account@6.1`
  - `bedrock-authn-token@7`
  - `bedrock-express@6.2`
  - `bedrock-passport@8`
  - `bedrock-validation@5.5`

## 2.0.0 - 2021-05-04

### Added
- **BREAKING**: Added `clientId` generation and `brAuthnToken.clients.set` to
  `typeRoute` post function.
- **BREAKING**: Added ability to get `clientId` from cookie in the
  `authenticate` post function.

### Changed
- Updated tests to reflect the latest code changes.

## 1.4.2 - 2021-04-21

### Fixed
- Get `typeOptions` param from request body for type nonce.

## 1.4.1 - 2021-01-13

### Changed
- Update peerDependencies and test deps to include bedrock-authn-token@3.0.0.

## 1.4.0 - 2021-01-13

### Added
- Setup a cookie and bake clientID into it.

### Changed
- Update peerDependencies to include bedrock-account@5 and bedrock@4.
- Add tests and update test deps.

## 1.3.0 - 2020-06-30

### Changed
- Update peerDependencies to include bedrock-account@4.
- Update test deps.
- Update CI workflow.

## 1.2.1 - 2020-06-17

### Changed
- Update peer and test dependencies related to MongoDB upgrade.

## 1.2.0 - 2020-03-04

### Added
- Support for TOTP tokens.

## 1.1.0 - 2020-01-06

### Added
- Add option to include `clientId` for `nonce` and `challenge` tokens.

## 1.0.0 - 2019-12-24

### Added
- Added core files.

- See git history for changes.
