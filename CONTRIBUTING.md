# Contributing to mission-critical-ts

Thank you for your interest in contributing. This project maintains high standards for reliability and safety — contributions must follow the coding standard rigorously.

## Coding Standard

All code must comply with the [TypeScript Coding Standard for Mission-Critical Systems](documents/TypeScript%20Coding%20Standard%20for%20Mission-Critical%20Systems.md). Key mandatory rules:

- **No `any`** — use `unknown` + type guards or generics
- **No `enum`** — use `as const` objects or string literal unions
- **No `var`** — use `const` by default, `let` only when needed
- **No recursion** — use iterative algorithms with explicit stacks
- **No `throw` for control flow** — use the `Result<T, E>` pattern for recoverable errors
- **All promises handled** — no floating promises
- **All async operations have timeouts** — `AbortController` + `Promise.race`, max 30s default
- **All loops have upper bounds** — documented rationale required
- **Exhaustive switch handling** — `default: assertUnreachable(x)`
- **Immutability by default** — `readonly`, `ReadonlyArray<T>`, `ReadonlyMap<K,V>`
- **Validate external inputs** — Zod schemas at boundaries
- **Branded types for domain primitives** — no raw `string` for IDs, emails, etc.
- **Functions <= 40 lines, <= 4 parameters** — use options objects for more
- **TSDoc on all public APIs** — `@param`, `@returns`, `@throws`, examples

## Development Setup

```bash
# Clone the repository
git clone https://github.com/MichaelLeeHobbs/mission-critical-ts.git
cd mission-critical-ts

# Install dependencies
npm install

# Build
npm run build
```

## Making Changes

1. **Fork the repository** and create a feature branch from `main`
2. **Follow the coding standard** — all shall-level rules are enforced
3. **Write tests** — minimum 95% branch coverage (Rule 9.1)
4. **Include property-based tests** with `fast-check` for algorithms (Rule 9.1)
5. **Add TSDoc** to all public APIs (Rule 10.1)
6. **Create an ADR** for significant architectural decisions (Rule 10.2)

## Pull Request Process

1. Ensure your branch builds cleanly (`npm run build`)
2. Run the full test suite (`npm test`)
3. Run the linter with zero warnings (`npm run lint`)
4. Update documentation if applicable
5. Submit a PR against `main` with a clear description of the change
6. All PRs require at least one review — critical modules (auth, crypto) require two (Rule 13.1)

## Commit Messages

Use clear, descriptive commit messages:

```
<type>: <short summary>

<optional body explaining why, not what>
```

Types: `add`, `fix`, `update`, `remove`, `refactor`, `docs`, `test`, `chore`

## Reporting Issues

Open an issue with:
- Clear description of the problem or suggestion
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Environment details (Node.js version, OS)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
