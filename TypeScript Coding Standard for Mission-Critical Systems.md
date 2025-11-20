# TypeScript Coding Standard for Mission-Critical Systems

## 1. Introduction
This standard establishes a rigorous framework for developing high-reliability TypeScript applications in mission-critical environments, such as aerospace, finance, healthcare, or infrastructure systems. It emphasizes safety, predictability, maintainability, and verifiability, prioritizing these over developer convenience, performance optimizations, or syntactic brevity. Strict adherence minimizes runtime errors, memory leaks, non-deterministic behaviors, security vulnerabilities, and operational failures inherent in JavaScript ecosystems.

This document is not exhaustive but serves as a baseline. Teams **shall** supplement it with domain-specific rules (e.g., for real-time systems or embedded environments). Compliance is enforced via automated tools (CI/CD pipelines, linters) and periodic code audits. Violations must be documented and justified in a risk register.

## 2. Levels of Compliance
*   **Shall**: Mandatory requirement. Non-compliance requires a formal waiver approved by the technical lead or architecture review board, including a risk assessment and mitigation plan.
*   **Should**: Strong recommendation. Deviation requires inline code comments with rationale, plus a ticket for review in the next sprint.
*   **May**: Permissible option. Use judiciously with documentation.

All rules assume TypeScript 5.0+ and Node.js 18+ (or equivalent runtime). Legacy environments require explicit justification.

---

## 3. Compiler, Environment, and Tooling Compliance

### Rule 3.1: Strict Compiler Configuration
The TypeScript compiler (`tsc`) **shall** be configured with maximum strictness to catch errors early. The `tsconfig.json` must include at minimum:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```
*   Additional recommendations: Enable `"declaration": true` for library builds and `"outDir": "./dist"` for clear separation of source and output.
    **Rationale**: Strict mode enforces sound typing, preventing subtle bugs like null/undefined dereferences or implicit type coercion. `noFallthroughCasesInSwitch` avoids accidental control flow errors, while `skipLibCheck: false` ensures third-party types are validated.

### Rule 3.2: Zero Tolerance for `any` and Discouraged Loose Types
The `any` type **shall not** be used under any circumstances.
*   **Alternatives**: Prefer `unknown` for untyped inputs (e.g., from APIs), followed by type guards or narrowing. Use generics for reusable utilities. Avoid `object` or loose unions; opt for precise discriminated unions.
*   Type assertions (`as Type` or `!` non-null assertion) **shall** be minimized and justified with comments; prefer type guards.
    **Rationale**: `any` bypasses type safety, reintroducing JavaScript's fragility. In mission-critical code, type errors must be compile-time, not runtime, issues.

### Rule 3.3: Automated Static Analysis and Linting
All code **shall** pass ESLint (with `@typescript-eslint` plugin) and other static analyzers (e.g., SonarQube) with zero warnings or errors. The build pipeline **must** fail on any issues, treating warnings as errors via ESLint's `--max-warnings 0`.
*   Enforce rules like `no-floating-promises`, `@typescript-eslint/no-misused-promises`, and `@typescript-eslint/prefer-readonly-parameter-types`.
*   Integrate tools like TypeScript's `tsc --noEmit` in pre-commit hooks.
    **Rationale**: Static analysis catches issues beyond the compiler, such as code smells or security patterns. Zero-tolerance prevents technical debt accumulation, ensuring auditability in regulated environments.

### Rule 3.4: Dependency Management
Dependencies **shall** be pinned to exact semantic versions in `package.json` (e.g., `"lodash": "4.17.21"`). Use tools like `npm audit` or `yarn audit` in CI to scan for vulnerabilities; fail builds on high-severity issues.
*   Minimize third-party dependencies; prefer standard library or audited internals (e.g., Node.js built-ins over external HTTP clients).
*   No dynamic `require` or `import`; all imports **shall** be static.
    **Rationale**: Unpinned dependencies introduce supply-chain risks and non-deterministic behavior. Static imports enable tree-shaking and dead-code elimination for smaller, more predictable bundles.

---

## 4. Asynchronous Execution & Promises

### Rule 4.1: No Floating or Unhandled Promises
All Promises **shall** be explicitly handled: `await`ed, chained (`.then/.catch`), returned to the caller, or explicitly ignored only if fire-and-forget is provably safe (e.g., logging) and documented.
*   Forbid `void` on async functions unless the return value is intentionally discarded.
    **Rationale**: Unhandled rejections lead to silent failures, resource leaks (e.g., open sockets), and inconsistent states. In critical systems, all async paths must be observable.

### Rule 4.2: Mandatory Timeouts and Cancellation
No asynchronous operation (e.g., network I/O, timers, file operations) **shall** run without a timeout. Use `AbortController` for cancellation and `Promise.race` for timeouts; timeouts **shall** be configurable but never exceed 30 seconds by default unless justified.
**Example:**
```typescript
// Bad: No timeout
await fetch('https://api.example.com/data');

// Good: Timeout with AbortController
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000); // Configurable via env or param
try {
  const response = await fetch('https://api.example.com/data', { signal: controller.signal });
  return await response.json();
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('Operation timed out'); // Or handle as Result<...>
  }
  throw error;
} finally {
  clearTimeout(timeoutId);
}
```
**Rationale**: Indefinite operations cause hangs, resource exhaustion, or denial-of-service vulnerabilities. Timeouts ensure liveness and fault tolerance.

### Rule 4.3: Bounded and Predictable Parallelism
Asynchronous operations **should** execute serially by default. Parallelism (e.g., `Promise.all`) **shall** be bounded (e.g., max 5 concurrent via `p-limit` or semaphores) and justified with performance metrics.
*   Forbid unbounded `Promise.all` on user-controlled inputs (e.g., arrays from APIs).
    **Rationale**: Uncontrolled parallelism risks thread pool exhaustion, memory spikes, or cascading failures under load. Serial execution simplifies debugging and error isolation.

### Rule 4.4: Async Iteration Safety
Use `for await...of` only on trusted iterables. Custom async iterators **shall** implement cancellation via `AbortSignal`.
**Rationale**: Async iterators can leak resources if not properly torn down, especially in long-running loops.

---

## 5. Scope, Closures, and Memory Management

### Rule 5.1: Explicit Resource Disposal
Closures, event listeners, timers, or streams that capture resources **shall** implement explicit disposal (e.g., via `Disposable` interface from TypeScript 5.2+ or a custom `dispose()` method).
*   Event emitters: Always pair `on` with `off` or use `once` for one-shots.
*   Timers: Clear with `clearTimeout`/`clearInterval` in a `finally` block or disposal hook.
    **Example:**
```typescript
class ResourceHandler {
  private timer: NodeJS.Timeout | null = null;
  private disposable: Disposable | null = null;

  start() {
    this.timer = setInterval(() => { /* work */ }, 1000);
    this.disposable = someAsyncDisposable();
  }

  dispose() {
    if (this.timer) clearInterval(this.timer);
    if (this.disposable) this.disposable.dispose();
  }
}
```
**Rationale**: JavaScript's garbage collector cannot reclaim cycles in closures or event loops, leading to leaks in long-lived processes. Explicit disposal ensures deterministic memory usage.

### Rule 5.2: Scoped Variables Only
The `var` keyword **shall not** be used. Prefer `const`; use `let` only for reassignable block-scoped variables, and minimize its scope (e.g., inside loops).
*   Forbid global variables; use modules for shared state with lazy initialization.
    **Rationale**: `var`'s hoisting and function scoping introduce temporal dead zones and bugs. Block scoping reduces cognitive load and accidental mutations.

### Rule 5.3: Safe `this` Binding
Avoid `this` in callbacks; use arrow functions to capture lexical `this`.
*   If dynamic `this` is unavoidable (e.g., class methods), declare it explicitly: `function method(this: MyClass) { ... }` and bind via `.bind(this)`.
    **Rationale**: `this` binding is context-dependent and error-prone in callbacks, leading to null references or wrong scopes.

---

## 6. Error Handling (Result and Panic Patterns)

### Rule 6.1: Reserved Use of Exceptions
`throw` **shall** be reserved for unrecoverable panics (e.g., assertion failures, OOM, configuration errors). Never use for control flow (e.g., validation or expected I/O failures).
*   Panics **must** include structured logging with context (e.g., stack trace, inputs).
    **Rationale**: Exceptions disrupt flow and are hard to reason about. In critical systems, predictable error paths enable recovery without crashing.

### Rule 6.2: Result Pattern for Recoverable Errors
Functions that can fail **shall** return a `Result<T, E>` union type, forcing explicit handling.
**Standard Type Definition:**
```typescript
export type Result<T, E = Error> = 
  | { ok: true; value: T } 
  | { ok: false; error: E extends Error ? E : Error };
```
**Utility Wrappers:**
```typescript
// Sync
export function tryCatchSync<T, E = unknown>(
  fn: () => T, 
  mapError?: (error: unknown) => E
): Result<T, E> {
  try {
    return { ok: true, value: fn() };
  } catch (error) {
    return { ok: false, error: mapError ? mapError(error) : (error as E) };
  }
}

// Async (as in original, with added generics for E)
export async function tryCatch<T, E = unknown>(
  promise: Promise<T>, 
  mapError?: (caughtError: unknown) => E
): Promise<Result<T, E>> {
  try {
    return { ok: true, value: await promise };
  } catch (error) {
    return { ok: false, error: mapError ? mapError(error) : (error as E) };
  }
}

// Helper for chaining
export function mapResult<T, U, E>(
  result: Result<T, E>, 
  fn: (value: T) => U
): Result<U, E> {
  return result.ok ? { ok: true, value: fn(result.value) } : result;
}
```
*   Always check `if (!result.ok) { /* handle error */ }` before accessing `value`. Use pattern matching libraries (e.g., `ts-results`) if approved.
    **Rationale**: Results make error paths type-safe and exhaustive, eliminating unchecked exceptions. This promotes resilience (e.g., fallback values) over crashes.

### Rule 6.3: Comprehensive Logging
All errors **shall** be logged using a structured logger (e.g., Winston or Pino) with levels (ERROR, WARN), context (request ID, user), and no sensitive data.
*   Integrate with monitoring (e.g., Sentry) for alerts on panics.
    **Rationale**: Logs enable post-mortem analysis and observability in production.

---

## 7. Defensive Coding & Data Integrity

### Rule 7.1: Immutability by Default
Treat all data as immutable: Use `readonly` for interfaces, `ReadonlyArray<T>`/`ReadonlyMap<K,V>`, and `DeepReadonly<T>` for nested structures (via utility types).
*   Functions **shall** accept `const` parameters where possible; avoid mutations (use `Object.freeze` for enforcement).
    **Rationale**: Mutations create hidden side effects, complicating concurrency and testing. Immutability aids reasoning and enables optimizations like memoization.

### Rule 7.2: Runtime Validation and Sanitization
All external inputs (APIs, files, env vars, user data) **shall** be validated and sanitized at boundaries using schema libraries (Zod preferred for its type inference).
*   Forbid raw type assertions; implement type guards: `function isValidUser(input: unknown): input is User { ... }`.
*   Sanitize outputs to prevent injection (e.g., XSS via DOMPurify).
    **Example (Zod):**
```typescript
import { z } from 'zod';
const UserSchema = z.object({ id: z.number(), name: z.string().min(1) });
type User = z.infer<typeof UserSchema>;

function parseUser(input: unknown): Result<User> {
  const parsed = UserSchema.safeParse(input);
  return parsed.success ? { ok: true, value: parsed.data } : { ok: false, error: new Error(`Invalid user: ${parsed.error.message}`) };
}
```
**Rationale**: Runtime type erasure means compile-time safety is insufficient. Validation catches malformed data early, preventing deep propagation of errors or exploits.

### Rule 7.3: Nominal and Opaque Typing
Avoid raw primitives for domain types (e.g., `string` for emails). Use branded types for nominal distinction and opaque types for abstraction.
**Example:**
```typescript
type UserId = string & { readonly __brand: 'UserId' };
type Email = string & { readonly __brand: 'Email' };

const createUserId = (id: string): UserId => id as UserId; // Factory ensures validation
function sendEmail(to: Email, message: string): Result<void> { ... } // Won't accept plain string
```
*   For units: `type Meters = number & { __brand: 'Meters' };`.
    **Rationale**: Primitives allow accidental mixing (e.g., using user ID as timestamp), violating domain invariants. Branding enforces type safety without runtime overhead.

### Rule 7.4: Security Hardening
*   Inputs: Validate lengths, escape outputs (e.g., no direct SQL concatenation; use prepared statements via libraries like `pg`).
*   Secrets: Never hardcode; use env vars or vaults (e.g., AWS Secrets Manager). Audit logs for access.
*   Crypto: Use audited libraries (e.g., `crypto` module); avoid custom implementations.
    **Rationale**: Mission-critical systems are attack targets; defensive rules mitigate OWASP risks like injection or leakage.

---

## 8. Control Flow & Structure

### Rule 8.1: Bounded and Guarded Loops
All loops **shall** have a compile-time or runtime upper bound (e.g., `for (let i = 0; i < MAX_ITERATIONS; i++)`).
*   Discourage `while(true)`; if used, add a counter with `if (counter > MAX) throw new Error('Loop exceeded bounds');`.
    **Rationale**: Infinite loops cause denial-of-service or hangs. Bounds ensure termination.

### Rule 8.2: Iterative Algorithms Only
Recursion (direct or indirect via mutual calls) **shall not** be used. Rewrite as iterative (e.g., using stacks for tree traversals).
*   Exception: Tail-recursive patterns **may** be allowed if stack depth is bounded (< 100) and profiled, but prefer loops.
    **Rationale**: JS lacks tail-call optimization, risking stack overflows in deep calls—fatal in resource-constrained environments.

### Rule 8.3: Exhaustive Pattern Matching
`switch` statements and union checks **shall** be exhaustive, using a `default: assertUnreachable(x)` case where:
```typescript
function assertUnreachable(x: never): never {
  throw new Error(`Exhaustive check failed: ${JSON.stringify(x)}`);
}

// Usage
switch (state.kind) {
  case 'loading': return <Loading />;
  case 'success': return <Success data={state.data} />;
  case 'error': return <Error msg={state.error} />;
  default: assertUnreachable(state); // TS error if union changes
}
```
*   For non-switch: Use `if` chains with `else throw assertUnreachable`.
    **Rationale**: Non-exhaustive checks allow silent failures on new variants, breaking invariants.

### Rule 8.4: Modular Function Design
*   Functions **should** be ≤ 40 lines (tighter than original for readability).
*   ≤ 3 parameters; use a single options object for more: `function process(options: ProcessOptions)`.
*   Single responsibility: One function, one concern. Extract nested logic into helpers.
*   Early returns for guards; avoid deep nesting (>3 levels).
    **Rationale**: Small functions reduce cognitive complexity, easing reviews, testing, and maintenance. High complexity correlates with bugs.

---

## 9. Testing, Verification, and Observability (New Section)
### Rule 9.1: Comprehensive Test Coverage
All code **shall** have >95% branch coverage via unit/integration tests (Jest or Vitest). Use property-based testing (e.g., fast-check) for algorithms.
*   Mock external dependencies minimally; prefer contract testing.
    **Rationale**: Tests verify correctness under edge cases, essential for reliability.

### Rule 9.2: Fuzzing and Chaos Testing
Critical paths **shall** undergo fuzzing (e.g., via `jest-fuzz`) and chaos engineering (e.g., inject faults with `fault-injection` tools).
**Rationale**: Uncovers rare failures in async or concurrent code.

### Rule 9.3: Observability
Instrument code with metrics (e.g., Prometheus) for latency, error rates, and resource usage. All functions **should** emit traces (e.g., OpenTelemetry).
**Rationale**: Enables proactive detection of degradations in production.

