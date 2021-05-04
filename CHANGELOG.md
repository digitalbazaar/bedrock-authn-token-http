# bedrock-authn-token-http ChangeLog

## 2.0.0 - TBD

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
