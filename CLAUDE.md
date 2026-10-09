# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A small AI Math Teacher/Examiner web app with two levels: random arithmetic practice (static, client-only) and LLM-generated quadratic equations (needs `server.js`). The app has no npm runtime dependencies; Playwright is a dev dependency for e2e tests.

## Running

- Level 1 (Practice): open `index.html` directly in a browser.
- Level 2 (Quadratic): set `ANTHROPIC_API_KEY`, run `npm start`, open http://localhost:3000.
- Tests: `npx playwright test --project=chrome` (quadratic tests mock the API, no key needed).

## Architecture

- `index.html` — page structure/styles. A mode toggle (`#mode-practice`, `#mode-quadratic`) switches between `#practice-section` (Teacher `#generate-btn`/`#question-display`, Examiner `#answer-form`/`#answer-input`/`#feedback`) and `#quadratic-section` (`#quad-generate-btn`, `#quad-form` with `#root1-input`/`#root2-input`, `#quad-feedback`).
- `script.js` — all client logic. Practice: `generateQuestion()` picks two random integers and an operator and stores `currentQuestion`. Quadratic: `generateQuadratic()` POSTs to `/api/quadratic` for coefficients, `solveQuadratic()` computes the true (possibly complex) roots, `parseComplex()` reads the student's input, and the form handler compares roots as an unordered pair.
- `server.js` — dependency-free Node server: serves the static files and `POST /api/quadratic`, which asks Claude Haiku (`claude-haiku-5-5`) for `{a,b,c}`, validates it, retries once, then falls back to random coefficients. The model never supplies the answer; correctness is always computed locally. The API key stays server-side.
- `tests/e2e/` — Playwright specs (`math-app.spec.js` for practice, `quadratic.spec.js` for the quadratic level).

State is kept purely in memory (`currentQuestion`, `currentQuadratic`); no history is persisted.
