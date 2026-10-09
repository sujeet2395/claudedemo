# AI Math Teacher

A small math game with two levels. A "Teacher" generates a problem, an "Examiner" checks your answer.

## Levels

Use the **Practice / Quadratic** toggle at the top of the page.

### Level 1 – Practice (random arithmetic)
Click **Generate Question** to get a random `a + b`, `a - b` or `a * b` (numbers 1–20), type the answer and submit. This level is plain client-side JavaScript and needs no server or API key.

### Level 2 – Quadratic equations
1. Click **Generate Quadratic**. Claude Haiku (`claude-haiku-5-5`) creates a quadratic `ax² + bx + c = 0` with small integer coefficients (real, repeated or complex roots).
2. Enter both roots, in any order:
   - real: `3`, `-1.5`, `1/2`
   - complex / imaginary: `2+3i`, `2 - 3i`, `-4i`, `i`
3. Submit. The app solves the equation itself with the quadratic formula and compares your roots (tolerance 1e-6). The model only supplies `a`, `b`, `c`, never the answer. When you are wrong, the true roots and the discriminant are shown.

If the model returns invalid output twice, the server falls back to random coefficients so the game keeps working.

## Running

Level 1 only: open `index.html` in a browser.

Level 2 (needs the Node server so the API key stays off the browser):

```
set ANTHROPIC_API_KEY=your-key        # PowerShell: $env:ANTHROPIC_API_KEY="your-key"
npm start
```

Then open http://localhost:3000 (change with `PORT`). Requires Node 18+ (uses built-in `fetch`); no npm dependencies for the app itself.

## Tests

Playwright end-to-end tests run in Google Chrome:

```
npm install
npx playwright test --project=chrome
```

The quadratic tests mock `/api/quadratic`, so they need no API key. Set `HOLD_MS=0` to skip the pauses that keep results visible.

## Files

- `index.html` – page, styles, both levels
- `script.js` – game logic, quadratic solver, complex-number parser
- `server.js` – static server and Haiku proxy (`POST /api/quadratic`)
- `tests/e2e/` – Playwright specs
