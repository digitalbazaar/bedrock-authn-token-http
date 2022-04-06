# bedrock-authn-token-http ChangeLog

## 5.0.0 - 2022-04-xx

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
