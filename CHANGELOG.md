# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Logging Standard (`LoggingStandard.md`) — structured logging, correlation, audit trails, inter-system traceability
- Reference Configs (`ReferenceConfigs.md`) — tsconfig, ESLint, Result utilities, Brand type extracted from coding standard
- CloudWatch Logs Insights example (`examples/logging/javascript/cloudwatch/`) — deploy script and 27 saved queries covering errors, lookup, audit, HTTP, health, inter-system tracing, and analysis

### Changed
- Condensed Coding Standard from ~870 lines to ~316 lines — same rules, less noise
- Coding Standard now references LoggingStandard.md and ReferenceConfigs.md instead of inlining configs and utilities

## [0.2.0] - 2026-02-13

### Added
- 13 Claude Code skills for project setup, code generation, reviews, audits, and documentation
- 5 deep-review subagents (security, standards, YAGNI, architecture, goal reviewers)
- Project documentation: README, CONTRIBUTING, LICENSE, .gitignore
- Mission statement: The AI Safety Net for Critical Systems

### Changed
- Consolidated skills from 7 to 6 (rewrote CONTRIBUTING.md)
- Moved coding standard into `.claude/docs/` for portability across projects

## [0.1.0] - 2025-11-20

### Added
- Initial TypeScript Coding Standard for Mission-Critical Systems (v1.0)
- 13 sections covering compiler config, async, memory, error handling, defensive coding, control flow, testing, documentation, performance, deployment, and compliance
- Result pattern (`Result<T, E>`) with `tryCatch`/`tryCatchSync` utilities
- Branded type pattern for domain primitives
- Exhaustive pattern matching with `assertUnreachable`
- Project scaffolding: `tsconfig.json`, `package.json`, `src/index.ts`

[Unreleased]: https://github.com/mhobb/mission-critical-ts/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/mhobb/mission-critical-ts/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/mhobb/mission-critical-ts/releases/tag/v0.1.0
