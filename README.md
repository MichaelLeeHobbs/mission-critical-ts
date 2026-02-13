# mission-critical-ts - _The AI Safety Net for Critical Systems_

AI accelerates development, but speed without discipline is a liability. **mission-critical-ts** provides the discipline layer: a coding standard that defines what correct looks like, skills that generate compliant code by default, and multi-agent reviews that catch what humans miss. Move fast without breaking critical things.

A collection of documents, coding standards, and AI skills for developing Node.js/TypeScript applications and libraries in mission-critical environments (aerospace, finance, healthcare, infrastructure). Safety, predictability, and verifiability take priority over convenience or brevity.

## Features

- **Comprehensive coding standard** — Shall/should/may rules covering type safety, error handling, async discipline, memory management, testing, and deployment
- **Result pattern** — No-throw error handling with `Result<T, E>` types and utility wrappers
- **Branded types** — Nominal typing utilities to prevent domain primitive mix-ups
- **7 Claude Code skills** — Portable AI-assisted workflows for project setup, code generation, auditing, and review
- **5 review agents** — Specialized subagents for security, standards, YAGNI, architecture, and goal alignment analysis

## Documents

Standards and reference materials live in [`documents/`](documents/):

- [TypeScript Coding Standard for Mission-Critical Systems](documents/TypeScript%20Coding%20Standard%20for%20Mission-Critical%20Systems.md) — Rigorous framework for high-reliability TypeScript

## Claude Code Skills

Reusable skills in `.claude/skills/` that can be copied into any TypeScript project:

| Skill | Description |
|-------|-------------|
| `/adr <title>` | Create an Architecture Decision Record |
| `/project-docs [list]` | Scaffold project documentation |
| `/dependency-audit` | Audit dependencies for pinning, security, licensing |
| `/project-init` | Initialize/upgrade a project to match the coding standard |
| `/scaffold-module <name>` | Generate a module with types, schemas, and tests |
| `/pr-review [pr]` | Review a PR diff against the coding standard |
| `/deep-review [scope]` | Comprehensive 5-agent code review |

## Getting Started

### Use the coding standard

Copy `documents/TypeScript Coding Standard for Mission-Critical Systems.md` into your project's documentation, or reference it directly.

### Use the Claude Code skills

Copy the `.claude/skills/` and `.claude/agents/` directories into your project. The skills will appear in Claude Code's `/` autocomplete menu.

### Initialize a new project from scratch

```bash
# After copying .claude/ into your project:
/project-init
```

This sets up strict `tsconfig.json`, ESLint, Result/branded type utilities, Husky hooks, and testing infrastructure.

## Project Structure

```
documents/              # Standards and reference materials
.claude/
  skills/               # 7 portable Claude Code skills
    adr/                # Architecture Decision Records
    project-docs/       # Documentation scaffolding
    dependency-audit/   # Dependency auditing
    project-init/       # Project initialization
    scaffold-module/    # Module code generation
    pr-review/          # PR diff review
    deep-review/        # Multi-agent comprehensive review
  agents/               # 5 subagent definitions for /deep-review
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and contribution workflow.

## License

[MIT](LICENSE)
