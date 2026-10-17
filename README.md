# stark-bot-site

stark-bot.com static site (GitHub Pages from `main` root, `CNAME` = stark-bot.com). Plain HTML, CSS and JS. No build step, no trackers, no external requests.

## Layout
- `index.html` home: hero, $STARKBOT launch, live desks, bot details, proof, roadmap, FAQ, risk.
- `desks/index.html` the full desk board.
- `css/site.css`, `js/site.js`, `fonts/` (self-hosted IBM Plex).
- `js/vendor/starkcoin.js` the 3D hero coin: three.js r186 (MIT, see `LICENSE-three.txt`) bundled with `tools/src/coin.js`. It is lazy-loaded only when WebGL works and reduced motion is off. Otherwise the page shows `brand/hero-coin.webp`, a static HD render of the same coin. `tools/build-coin.sh` rebuilds the bundle; the site itself has no build step.
- `config.js` the only place the contract address is set. Empty shows "Coming at launch" and keeps Copy off.
- `brand/` logo, images, videos and `glass.mp3` (the existing background music).

## data/stats.json
Pages read only this file. A `null` shows a dash. The shipped values are a one-time 30-day sample (2026-09-17 to 2026-10-17); a script refreshes it later.

Top level: `updated_at`, `period {label,start,end}`, `note`, `combined {volume_usd,fills,points,points_label}`, `desks[]`.

Desk fields: `name`, `slug`, `status` (`live` | `paused` | null), `volume_usd`, `fills`, `maker_pct` (e.g. 80.7), `points`, `points_label` (e.g. `owner-stated`), `updated_at`.

Numbers must be JSON numbers. Use `null` when unknown. Slugs: `arcus`, `nado`, `lighter-rh`, `profit-taking`, `youtube`, `mochee-yochee`.

Never add secrets, keys, wallet addresses, balances, equity or PnL, or any cost-per-million figure.

Validate: `python3 -m json.tool data/stats.json >/dev/null`.

## Music
`js/site.js` plays `brand/glass.mp3` only after the first user interaction, with a slow fade to a low volume. The header Sound button mutes it and saves the choice in `localStorage` (`stark-sound`).
