# TypeScript Coding Standard for Mission-Critical Systems

## 1. Introduction
This standard defines a strict set of rules for the development of high-reliability TypeScript applications. It prioritizes safety, predictability, and maintainability over developer convenience or syntactic brevity. Adherence to these rules aims to eliminate entire classes of runtime errors, memory leaks, and non-deterministic behaviors common in JavaScript environments.

## 2. Levels of Compliance
*   **Shall**: Mandatory requirement. Violation requires a formal waiver.
*   **Should**: Strong recommendation. Deviation requires code comments explaining the rationale.

---

## 3. Compiler and Environment Compliance

### Rule 3.1: Strict Compiler Configuration
The TypeScript compiler (`tsc`) **shall** be configured with the highest level of strictness. The `tsconfig.json` must include:
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
    "exactOptionalPropertyTypes": true
  }
}
```
**Rationale**: Relying on the compiler to catch type errors is the first line of defense. `noUncheckedIndexedAccess` prevents undefined runtime errors when accessing arrays.

### Rule 3.2: Zero Tolerance for `any`
The `any` type **shall not** be used.
*   **Alternative**: Use `unknown` for values where the type is truly ambiguous, followed by immediate type narrowing (guards).
*   **Alternative**: Use Generics for flexible utility functions.
*   **Rationale**: `any` disables the type checker, effectively reverting code to raw JavaScript and negating the safety benefits of TypeScript.

### Rule 3.3: Automated Static Analysis
All code **shall** pass a strict linter check (e.g., ESLint) with zero warnings. The build pipeline must fail on warnings.
**Rationale**: Warnings are deferred errors. In critical systems, technical debt is not permitted.

---

## 4. Asynchronous Execution & Promises

### Rule 4.1: No Floating Promises
All Promises **shall** be handled. A Promise returned by a function must be either `await`ed, returned to the caller, or explicitly voided if fire-and-forget is absolutely necessary (and safe).
*   **Rationale**: Unhandled promises swallow errors and lead to inconsistent application states. They are a primary source of memory leaks when the promise chain retains references to objects indefinitely.

### Rule 4.2: Mandatory Timeouts
No asynchronous operation (network request, file I/O, IPC) **shall** run indefinitely. All async operations must be wrapped in a timeout mechanism that rejects the promise if the operation exceeds a defined duration.
*   Use `AbortController` or `Promise.race` to enforce these bounds.

**Example:**
```typescript
// Bad
await fetch('https://api.example.com/data');

// Good
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);
try {
  await fetch('https://api.example.com/data', { signal: controller.signal });
} finally {
  clearTimeout(timeoutId);
}
```

### Rule 4.3: Serial Over Parallel
Asynchronous operations **should** be executed serially unless performance requirements explicitly dictate otherwise.
*   Unbounded `Promise.all` on dynamic arrays is **forbidden**. If parallelism is required, it must be bounded (e.g., using a semaphore or a batching utility like `p-limit`).
*   **Rationale**: Unbounded parallelism causes resource exhaustion (file descriptors, sockets, memory) and makes error handling non-deterministic.

---

## 5. Scope, Closures, and Memory Management

### Rule 5.1: Explicit Closure Cleanup
Closures that capture large objects or event emitters **shall** provide a mechanism for explicit cleanup.
*   If a function returns a callback that closes over a large scope, it must also return a disposal function (or implement the `Disposable` pattern).
*   **Rationale**: Closures in JavaScript retain references to their outer scope. If a closure is attached to a long-lived object (like a global event listener), everything in its scope leaks.

### Rule 5.2: No `var`
The `var` keyword **shall not** be used. Use `const` by default, and `let` only when reassignment is strictly necessary.
*   **Rationale**: `var` has function scope and hoisting behaviors that lead to confusion and accidental global pollution. `let` and `const` have block scope.

### Rule 5.3: `this` Safety
The `this` keyword **should** be avoided in callbacks. Use Arrow Functions (`() => {}`) to preserve lexical scope.
*   If `this` is required, the function signature must explicitly declare the type of `this` (TypeScript feature: `function foo(this: Context) ...`).

---

## 6. Error Handling (The Action Return Pattern)

### Rule 6.1: No Throwing for Control Flow
Exceptions (`throw`) **shall not** be used for anticipated errors (e.g., "File not found", "Validation failed").
*   `throw` is reserved strictly for unrecoverable system panics (e.g., Out of Memory, Invariant Violation).

### Rule 6.2: The Result Pattern
Functions capable of failure **shall** return a `Result<T, E>` type. This forces the caller to handle the error path explicitly.

**Standard Type Definition:**
```typescript
export type Result<T, E = Error> = 
  | { ok: true; value: T } 
  | { ok: false; error: E };
```

**Utility Wrapper:**
```typescript
export async function tryCatch<T, E = unknown>(
  promise: Promise<T>, 
  mapError?: (caughtError: unknown) => E
): Promise<Result<T, E>> {
    try {
        const data = await promise;
        return { ok: true, value: data };
    } catch (error) {
        const finalError = mapError ? mapError(error) : (error as E);
        return { ok: false, error: finalError };
    }
}
```

**Rationale**: This pattern eliminates "try/catch spaghetti" and makes error handling type-safe. The compiler forces the developer to check `if (result.ok)` before accessing the data.

---

## 7. Defensive Coding & Data Integrity

### Rule 7.1: Immutability by Default
All data objects and arrays **shall** be treated as immutable.
*   Use `readonly` modifier for all interface properties.
*   Use `ReadonlyArray<T>` instead of `Array<T>` or `T[]`.
*   **Rationale**: Mutation leads to side effects that are hard to track. Immutability ensures that passing an object to a function does not result in that object being modified unexpectedly.

### Rule 7.2: Runtime Data Validation
Data entering the system boundaries (API responses, user input, file reads) **shall** be validated against a schema at runtime (using libraries like Zod, io-ts, or rigid type guards).
*   Type assertions (`as Type`) are forbidden for external data.
*   **Rationale**: TypeScript types are erased at runtime. Without runtime validation, a mismatch between the expected type and the actual payload will cause crashes deep within the application logic.

### Rule 7.3: Nominal Typing (Branded Types)
Primitive types (string, number) **should** be avoided for domain concepts like IDs, currency, or physical units. Use "Branded Types" to prevent mixing incompatible values.

**Example:**
```typescript
type Meters = number & { __brand: 'Meters' };
type Seconds = number & { __brand: 'Seconds' };

function calculateSpeed(d: Meters, t: Seconds): number { ... }
```

---

## 8. Control Flow & Structure

### Rule 8.1: Bounded Loops
All loops **shall** have a statically determinable upper bound.
*   `while` loops are discouraged. If used, they must contain an explicit counter and a break condition based on a constant maximum iteration limit.
*   **Rationale**: Prevents "runaway code" and halting problems.

### Rule 8.2: No Recursion
Direct and indirect recursion **shall not** be used. Algorithms must be implemented iteratively.
*   **Rationale**: JavaScript engines have finite stack sizes. Recursion introduces the risk of `RangeError: Maximum call stack size exceeded`, which is a fatal runtime crash.

### Rule 8.3: Exhaustive Switching
All `switch` statements or discriminated union checks **shall** be exhaustive. A `default` case throwing a compile-time error (using the `never` type) is required.

**Example:**
```typescript
function assertUnreachable(x: never): never {
    throw new Error("Invariant violation: Unreachable code executed");
}

switch (action.type) {
    case 'START': ...
    case 'STOP': ...
    default: assertUnreachable(action); // Compile error if a case is missing
}
```

### Rule 8.4: Function Complexity
*   Functions **should** be no longer than 60 lines of code.
*   Functions **should** have no more than 4 parameters. If more are needed, use a single parameter object (interface).
*   **Rationale**: Functions must be understandable as a single logical unit. Deep nesting indicates a need for refactoring.
