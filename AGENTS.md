# AGENTS.md

Use this repository as the Codex-native edition of Marketing Skills.

## Purpose

- Keep reusable marketing workflows in `skills/`.
- Make those skills discoverable inside a cloned repository through `.agents/skills`.
- Package the same skills for installation through `.codex-plugin/plugin.json`.
- Keep project-scoped marketing agents in `.codex/agents/`.
- Preserve the original MIT license and Corey Haines attribution.

## Source of Truth

`skills/` is the only editable source for skill content.

- Do not copy skill content into `.agents/skills`.
- `.agents/skills` must remain a symlink to `../skills`.
- Each `skills/<name>/SKILL.md` must contain a matching `name` and a clear trigger description.
- Each skill must include `agents/openai.yaml` for Codex display metadata.
- Detailed material belongs in `references/`, reusable output files in `assets/`, and deterministic helpers in `scripts/`.

## Product Context

Before doing substantial marketing work:

1. Read `.agents/product-marketing.md` when it exists.
2. If it does not exist and the task depends on audience, offer, positioning, or brand voice, use the `product-marketing` skill.
3. Ask only for information that is missing and materially changes the result.
4. Never invent customer quotes, testimonials, results, prices, or performance claims.

## Selecting Skills

Choose the smallest set of skills that covers the request.

- Strategy and prioritization: `marketing-plan`, `marketing-ideas`, `marketing-psychology`
- Positioning and offers: `product-marketing`, `offers`, `pricing`
- Copy and content: `copywriting`, `copy-editing`, `emails`, `social`, `video`, `image`
- Acquisition: `seo-audit`, `ai-seo`, `ads`, `ad-creative`, `prospecting`, `public-relations`
- Conversion: `cro`, `signup`, `onboarding`, `paywalls`, `popups`
- Retention and systems: `churn-prevention`, `referrals`, `revops`, `marketing-loops`
- Evidence gathering: `customer-research`, `competitor-profiling`, `analytics`

Use related skills only when their scope is actually needed. Do not load the full library by default.

## Project Agents

Codex discovers the project agents under `.codex/agents/`:

- `marketing_researcher`: collect and organize evidence without changing files
- `marketing_strategist`: turn context and evidence into a focused plan
- `marketing_operator`: create the approved deliverables
- `marketing_reviewer`: challenge claims, clarity, fit, and measurement

Use subagents only when the user explicitly requests delegation or parallel agent work. Keep each delegated task independent and bounded. The primary agent owns the final recommendation.

## Validation

After changing a skill or Codex configuration, run:

```bash
node scripts/generate-codex-metadata.mjs
node scripts/generate-codex-metadata.mjs --check
node scripts/validate-codex.mjs
```

For a single skill, verify the frontmatter manually:

- `name` matches the folder
- `description` is specific and no longer than 1,024 characters
- the skill body stays under 500 lines

## Tool Integrations

When a skill needs an external marketing tool, read `tools/REGISTRY.md` first and then load only the matching guide under `tools/integrations/`. Prefer an available Codex app or MCP connection over inventing API access.

## Versioning

- Preserve each skill's existing `metadata.version` and bump it when that skill changes.
- Keep `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and `.codex-plugin/plugin.json` on the same repository version.
- Run the sync and validation scripts before publishing a release.

## Editing Rules

- Write instructions in imperative language.
- Keep `SKILL.md` focused. Move long examples and reference material out of the main file.
- Prefer plain language and explicit outputs.
- Keep links and relative paths valid.
- Keep Codex-only UI metadata in `agents/openai.yaml`, not in `SKILL.md`.
- Do not add credentials, private customer data, or unverified claims.
- Do not change `.claude-plugin/` or `CLAUDE.md` unless cross-agent compatibility is part of the request.

## Definition of Done

A change is complete when:

1. The relevant skill or agent does the requested job.
2. Generated Codex metadata is current.
3. The repository and plugin validation pass.
4. No unrelated files changed.
5. The final summary names the files changed and the checks run.
