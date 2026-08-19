# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.2] - 2026-08-18

### Added

- File uploads can replace existing same-name File children with the `replace` option

## [1.4.1] - 2026-08-16

### Fixed

- File downloads now return data matching the documented contract
- File upload failures now provide clearer error details

## [1.4.0] - 2026-08-12

### Added

- Workspace creation and type discovery, definition, creation, and update operations
- View creation, listing, retrieval, update, and deletion operations
- Semantic share creation, listing, retrieval, and revocation operations
- Team group discovery
- Workflow listing, retrieval, execution history, artifact catalogs, creation, and update operations
- Public TypeScript contracts and examples for the new integration endpoints

### Changed

- TypeScript configuration now supports both browser and Node.js environments

## [1.0.0] - 2026-01-21

### Added

- Initial release of AnyDB SDK
- Record operations: get, list, create, update, search
- Team and database discovery
- File upload and download support
- TypeScript support with full type definitions
- Debug logging mode
- Comprehensive error handling
- Convenience method for complete file upload workflow
