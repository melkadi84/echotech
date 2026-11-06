# AI skills and agents

Claude Code reads `.claude/settings.json` in this repo. When you open the project and trust the folder, it offers to install these three plugins. `.claude/agents/` holds one agent that is committed directly.

| Name | Source | Type | License | What it adds |
|---|---|---|---|---|
| `impeccable` | github.com/pbakaus/impeccable | plugin (skill + hooks + subagents) | Apache-2.0 | One skill with 24 design commands: `/impeccable critique`, `audit`, `polish`, `typeset`, `animate`, `harden`, `adapt`, `distill`, `live`, and more. Rule-based detector of generic AI design. |
| `ui-ux-pro-max` | github.com/nextlevelbuilder/ui-ux-pro-max-skill | plugin (skill) | MIT | Searchable local catalogue of styles, palettes, font pairings, UX guidelines, chart types and stack rules. Needs Python 3 (standard library only). |
| `taste-skill` | github.com/Leonxlnx/taste-skill | plugin (skill `design-taste-frontend`) | MIT | Art-direction skill for company sites, with a checker that tests the page in a real browser. Needs Node 22+ and Chrome, Edge or Chromium. |
| `code-simplifier` | anthropics/claude-plugins-official, `plugins/code-simplifier/agents/code-simplifier.md` | agent file in `.claude/agents/` | Apache-2.0 | Simplifies recently changed code without changing behaviour. |

The three plugins are installed from their own repos rather than copied here. One of them (`taste-skill`) is about 40 MB and 1,600 files, and plugins update through `/plugin update`.

## Manual install (if the automatic prompt does not appear)

```text
/plugin marketplace add pbakaus/impeccable
/plugin install impeccable@impeccable
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
/plugin marketplace add Leonxlnx/taste-skill
/plugin install taste-skill@taste-skill
```

Other tools: `npx impeccable install`, `npx ui-ux-pro-max-cli init --ai claude` (or another `--ai` target), or the cross-agent `npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"`.

## How to use them on this site

Project rules in `AGENTS.md` and `docs/BRAND.md` always win over a skill's defaults. The logo, the Cobalt and Sky palette, Readex Pro and the echo concept are fixed.

1. **Direction and options:** `ui-ux-pro-max` for palette, type and UX checks; `taste-skill` when building a new page or section.
2. **Review:** `/impeccable critique` and `/impeccable audit` on a changed section, in both `/` and `/ar/`.
3. **Finish:** `/impeccable polish`, `typeset`, `harden` (empty and error states, long Arabic text), `adapt` (mobile).
4. **Clean up code:** run the `code-simplifier` agent after a batch of changes.
5. Run `npm run build` and re-check light/dark and RTL/LTR after any skill makes edits.

## Things to know

- **Hooks.** The `impeccable` plugin registers hooks that run its detector after edits to UI files. It runs a local binary that is downloaded on first use. Review the plugin before enabling it on a machine with sensitive projects.
- **Telemetry.** `impeccable` can fetch visual directions from its catalogue site and has telemetry. Turn it off with `npx impeccable telemetry off` or the environment variable `DO_NOT_TRACK=1`.
- **Live mode** (`/impeccable live`) opens a dev-server overlay. Use it only on a local dev server.
- **Overlap.** `frontend-design`, `impeccable` and `taste-skill` cover similar ground. Use one per task to avoid conflicting direction, and tell it the brand is fixed.
- **Code simplifier standards.** The agent follows the coding standards in `AGENTS.md` (Code standards section). Its original text mentions React and TypeScript examples; they do not apply here.
- **Attribution.** `code-simplifier.md` is copied unchanged from the Apache-2.0 `anthropics/claude-plugins-official` repository.
