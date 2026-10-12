# stark-bot-site

stark-bot.com website

## Live desk stats

The [Live desks](desks/) page reads figures only from [`data/stats.json`](data/stats.json). The page does not store numbers of its own. A `null` field renders as an em dash (—). While any published field is still `null`, the page shows **Updates soon.**

A script can refresh the tape by rewriting that file and committing it. Do not edit `desks/index.html` or `desks/desks.js` to paste figures.

### File shape

Top level:

- `updated_at` — ISO-8601 timestamp for the whole file, or `null` if it has not been written yet. Use UTC with a `Z` suffix: `YYYY-MM-DDTHH:MM:SSZ`.
- `desks` — array of desk objects, in the order the page should show them.

Each desk object:

| Field | Type | Meaning |
| --- | --- | --- |
| `name` | string | Desk name. Ship these spellings: `Arcus`, `Nado`, `Lighter RH`, `Profit Taking`, `Youtube`, `Mochee`, `Yochee`. |
| `status` | `"live"`, `"paused"`, or `null` | Anything else is shown as a blank. |
| `volume_usd_7d` | number or `null` | USD notional over the last 7 days. |
| `volume_usd_total` | number or `null` | USD notional since the desk started reporting. |
| `pnl_usd_7d` | number or `null` | USD profit and loss over the last 7 days. Negative is a loss. |
| `trades_7d` | number or `null` | Trade count over the last 7 days. |
| `updated_at` | string or `null` | ISO-8601 timestamp for that desk. |

`Youtube`, `Mochee`, and `Yochee` are the three media desks. `Arcus` is the perp volume farm. `Profit Taking` is the multi-chain 2× take-profit desk.

### Rules for the script

- Write JSON numbers, not strings. A quoted number is ignored and stays a dash.
- Use `null` for a field you do not have yet. Do not write `0` unless the real value is zero.
- Do not add currency symbols, commas, or thousands separators. The page formats numbers.
- `status` must be the exact lowercase `live` or `paused`.
- Prefer UTC timestamps with a `Z` suffix.
- Keep the file valid JSON. Check it with `python3 -m json.tool data/stats.json >/dev/null`.
- The page lists whatever is in `desks`, in that order. Append an object to add a desk. Remove an object to drop one.
- Role lines (perp volume farm, media, and so on) are labels in the page, not stats. They are not read from the file.

The shipped file leaves every figure `null` on purpose.

### Commit

```bash
# after the script writes data/stats.json
git add data/stats.json
git commit -m "Update live desk stats"
git push
```

The page fetches `data/stats.json` with cache bypass on each visit. Apache also sends `Cache-Control: no-cache` for `stats.json` (see `.htaccess`). GitHub Pages ignores `.htaccess`; the fetch bypass still applies.
