# Aurelia Academy

A dark-academia school and nightlife club management simulation that runs directly in the browser and plugs into [Perchance](https://perchance.org) for dynamic image generation (`text-to-image-plugin`) and optional narrative generation (`ai-text-plugin`).

## How it's put together

- `loader.js`: injects `css/style.css` and page markup, fetches `data/*.json` into `window.AA_DATA`, and loads `js/` scripts in order.
- `data/`: editable JSON tables driving balance, facilities, procedural generation, services, scenes, and AI prompts.
  | File | Contents |
  |---|---|
  | `balance.json` | Debt, interest, upkeep, fatigue/arousal rates, rank & tier curves, and all 7 Director protocol modifiers |
  | `academy.json` | 7 facilities, 6+1 study focuses, 5 majors, 7 club roles, 3 Director origins, 5 Director roles, 7 protocols |
  | `people.json` | Name pools, physical appearance options, outfits & lingerie, 22 traits with mechanical effects, student backstories |
  | `services.json` | 5 VIP intimate services (`massage`, `manual`, `oral`, `vaginal`, `anal`) with customer/student prose + support role & incident narratives |
  | `scenes.json` | Scene compositions, settings, and clothing rules for programmatic image prompts |
  | `snippets.json` | Scene atmosphere, clothing states, and expression wording |
  | `ai-prompts.json` | Opt-in Perchance AI text prompt templates (`night_visit`, `service`, `protocol`, `backstory`) |
- `js/`: classic vanilla JS scripts (no bundler, no build step).
- `perchance/panel.html`: small shim for Perchance's HTML panel.

## Perchance setup

1. Lists panel:
   ```
   t2i = {import:text-to-image-plugin}
   ai = {import:ai-text-plugin}
   ```
2. HTML panel: paste `perchance/panel.html`.
3. Enable GitHub Pages (Source: **GitHub Actions** or `main` branch root).

## Development

- Serve locally over HTTP (`python3 -m http.server`) and open `http://localhost:8000` (fetching `data/*.json` requires HTTP, not `file://`).
- `node tools/check-data.mjs` verifies script files and JSON data sets.
- `node tools/smoke.mjs 14` runs a full 14-day headless Playwright simulation and prompt safety/brace audit.
