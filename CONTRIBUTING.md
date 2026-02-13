# Contributing to mission-critical-ts

Thank you for your interest in contributing. This project is a collection of **documents, coding standards, and Claude Code AI skills** — not a runnable application. Contributions typically involve editing markdown files, skill definitions, agent definitions, and templates.

## What You Can Contribute

| Area | Location | Description |
|------|----------|-------------|
| Coding standard | `documents/` | Rules, rationale, and examples for mission-critical TypeScript |
| Claude Code skills | `.claude/skills/` | SKILL.md files that define AI-assisted workflows |
| Review agents | `.claude/agents/` | Subagent definitions used by `/deep-review` |
| Templates | `.claude/skills/*/templates/` | Code templates with `${VARIABLE}` placeholders |
| Reference checklists | `.claude/skills/*/references/` | Checklists used by review and audit skills |
| Project documentation | Root directory | README, LICENSE, this file, etc. |

## Skill Authoring Guidelines

Each skill lives in `.claude/skills/<skill-name>/SKILL.md` with YAML frontmatter:

```yaml
---
name: skill-name
description: One-line description shown in autocomplete
disable-model-invocation: true
arguments:
  - name: arg-name
    description: "What this argument does"
    required: false
---
```

When writing or editing skills:

- **Be specific and unambiguous** — Claude follows instructions literally; vague guidance produces inconsistent results
- **Reference the coding standard by rule number** (e.g., "Rule 6.2", "Rule 7.3") so generated code traces back to a rationale
- **Include concrete code examples** — show the exact patterns you want generated, not just descriptions
- **Use `$ARGUMENTS`** to accept user input; parse as comma-separated list when multiple values are expected
- **Ask the user when choices exist** — skills should be interactive, not assume defaults silently
- **Keep skills general-purpose** — one skill with sub-options is better than many narrow skills
- **Test your skill** by invoking it in a real project and verifying the output matches the coding standard

## Agent Authoring Guidelines

Agent definitions in `.claude/agents/` are markdown files that define specialized reviewers for the `/deep-review` skill. Each agent should:

- Have a clear, focused scope (security, standards compliance, architecture, etc.)
- List specific things to check with rule references
- Define the output format (findings table with severity, file, line, description)
- Be composable — agents run in parallel and their results are consolidated

## Coding Standard Changes

The coding standard at `documents/TypeScript Coding Standard for Mission-Critical Systems.md` is the foundation of the project. Changes to it require:

- **Rationale** — explain *why* the rule exists, citing real-world failure modes or industry standards
- **Compliance level** — classify as shall (mandatory), should (recommended), or may (optional)
- **Rule number** — maintain the existing numbering scheme; append new rules at the end of a section
- **Examples** — provide both compliant and non-compliant code samples
- **Skill impact** — note which skills reference the changed rule and may need updates

## Making Changes

1. Fork the repository and create a branch from `main`
2. Make your changes following the guidelines above
3. Verify that skill instructions are clear and unambiguous
4. If you changed the coding standard, check that affected skills still reference correct rule numbers
5. Submit a PR with a description of what changed and why

## Commit Messages

```
<type>: <short summary>

<optional body explaining why, not what>
```

Types: `add`, `fix`, `update`, `remove`, `docs`, `chore`

## Reporting Issues

Open an issue with:
- What skill, agent, or standard rule is affected
- What the current behavior or content is
- What you expected or propose instead
- If suggesting a new rule: the failure mode it prevents

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
