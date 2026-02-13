# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Mission

AI accelerates development, but speed without discipline is a liability. **mission-critical-ts** provides the discipline layer: a coding standard that defines what correct looks like, skills that generate compliant code by default, and multi-agent reviews that catch what humans miss. Move fast without breaking critical things.

## Project Overview

A collection of documents, coding standards, and AI skills for developing Node.js/TypeScript applications and libraries in mission-critical environments (aerospace, finance, healthcare, infrastructure). Safety, predictability, and verifiability take priority over convenience or brevity.

The full coding standard is at `.claude/docs/TypeScript Coding Standard for Mission-Critical Systems.md`. It lives inside `.claude/` so it travels with the skills when copied into other projects.

## Build

```bash
npm run build    # runs tsc
```

No test runner or linter is configured yet in `package.json`. The coding standard mandates Jest/Vitest for testing and ESLint with `@typescript-eslint` (see Appendix A of the standard for the recommended `.eslintrc.json`).

## TypeScript Configuration

Target: ES2016, module: CommonJS, strict mode enabled. Output to `dist/`. The coding standard requires additional compiler flags beyond what's currently in `tsconfig.json`:

- `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noFallthroughCasesInSwitch`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`, `allowUnusedLabels: false`, `allowUnreachableCode: false`, `skipLibCheck: false`

## Critical Coding Rules

These rules are **mandatory** (shall-level) per the project standard:

- **No `any`** — use `unknown` + type guards or generics instead
- **No traditional `enum`** — use `as const` objects or string literal union types
- **No `var`** — use `const` by default, `let` only when reassignment is needed
- **No recursion** — JS lacks tail-call optimization; rewrite as iterative with explicit stacks
- **No `throw` for control flow** — reserve exceptions for unrecoverable panics only
- **Result pattern for recoverable errors** — functions that can fail return `Result<T, E>`:
  ```typescript
  type Result<T, E = Error> =
    | { ok: true; value: T }
    | { ok: false; error: E extends Error ? E : Error };
  ```
  Utility wrappers `tryCatch` (async) and `tryCatchSync` are defined in the standard.
- **All promises must be handled** — no floating promises; use `await`, `.then/.catch`, or return
- **All async operations need timeouts** — use `AbortController` + `Promise.race`; default max 30s
- **Bounded parallelism** — `Promise.all` must be bounded (e.g., via `p-limit`); no unbounded on user-controlled inputs
- **All loops must have upper bounds** — document the rationale for the bound
- **Exhaustive switch/union handling** — always include `default: assertUnreachable(x)`:
  ```typescript
  function assertUnreachable(x: never): never {
    throw new Error(`Exhaustive check failed: ${JSON.stringify(x)}`);
  }
  ```
- **Immutability by default** — use `readonly`, `ReadonlyArray<T>`, `ReadonlyMap<K,V>`, `DeepReadonly<T>`
- **Validate all external inputs at boundaries** — Zod preferred for schema validation
- **Branded types for domain primitives** — no raw `string` for emails, IDs, etc.
- **Functions ≤ 40 lines, ≤ 4 parameters** — use options objects for more params; single responsibility; max 3 levels of nesting
- **Dependencies pinned to exact versions** — no `^` or `~`; static ESM imports only
- **TSDoc on all public APIs** — include `@param`, `@returns`, `@throws`, and examples

## Testing Requirements

- ≥95% branch coverage
- Property-based testing (fast-check) for algorithms
- Fuzzing on critical paths (auth, payments, persistence)
- Type-level tests via `tsd` or `expect-type` for complex generics

## Skills

Reusable Claude Code skills live in `.claude/skills/`. Invoke with `/<skill-name>`.

| Skill | Description | Creates Files? |
|-------|-------------|----------------|
### Project Setup & Code Generation

| Skill | Description | Creates Files? |
|-------|-------------|----------------|
| `/adr <title>` | Create an Architecture Decision Record in `docs/adr/` | Yes |
| `/project-docs [list]` | Scaffold project documentation (README, LICENSE, CONTRIBUTING, etc.) | Yes |
| `/project-init` | Initialize or upgrade a TypeScript project to match the coding standard | Yes |
| `/scaffold-module <name>` | Generate a new module with types, schemas, tests, and barrel export | Yes |
| `/scaffold-ci [components]` | CI pipeline, quality gates, release automation, observability setup | Yes |
| `/scaffold-tests [types]` | Advanced testing: mutation (Stryker), contract (Pact), load (k6), chaos | Yes |
| `/scaffold-docker [components]` | Dockerfile, health check module, Docker Compose | Yes |

### Reviews & Audits

| Skill | Description | Creates Files? |
|-------|-------------|----------------|
| `/dependency-audit` | Audit dependencies for pinning, security, licensing (read-only report) | No |
| `/pr-review [pr-number]` | Review a PR diff against shall-level coding standard rules | No |
| `/deep-review [scope]` | Comprehensive 5-agent review (security, standards, YAGNI, architecture, goals) | Yes |
| `/security-audit [scope]` | OWASP Top 10, threat model, supply chain, secrets, CI security, ASVS, hardening | No |
| `/audit [type]` | Code quality and compliance: dead code, PII handling, SOC 2 readiness | No |

### Documentation

| Skill | Description | Creates Files? |
|-------|-------------|----------------|
| `/ops-docs [type]` | Operational docs: runbooks, incident playbooks, architecture diagrams, API docs, license reports | Yes |

### Deep Review Agents

The `/deep-review` skill uses 5 specialized subagents defined in `.claude/agents/`:

- **security-reviewer** — OWASP Top 10, input validation, secrets, injection
- **standards-reviewer** — All shall-level rules from the coding standard
- **yagni-reviewer** — Over-engineering, dead code, unnecessary abstractions
- **architecture-reviewer** — Modularity, dependency direction, SOLID, circular deps
- **goal-reviewer** — Correctness, completeness, edge cases, intent alignment
