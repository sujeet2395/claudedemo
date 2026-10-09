// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

// The app is static, so load index.html straight from disk.
// Override with APP_URL if you serve it (e.g. http://localhost:8080).
const APP_URL =
  process.env.APP_URL ||
  pathToFileURL(path.resolve(__dirname, '../../index.html')).href;

// How long (ms) to keep the result visible after each check.
// HOLD_MS=0 disables the pause (use this on CI / headless runs).
const HOLD_MS = Number(process.env.HOLD_MS ?? 3000);

// Matches e.g. "7 + 3", "12 - 5 = ?", "4 * 9", "6 × 2"
const EQUATION_RE = /(-?\d+)\s*([+\-−*×xX])\s*(-?\d+)/;

const CORRECT_RE = /^(?!.*(incorrect|wrong)).*correct/is;
const INCORRECT_RE = /incorrect|wrong/i;

/** Evaluate the equation text without using eval(). */
function solve(questionText) {
  const match = questionText.match(EQUATION_RE);
  if (!match) {
    throw new Error(`Could not parse an equation from: "${questionText}"`);
  }
  const a = parseInt(match[1], 10);
  const b = parseInt(match[3], 10);

  switch (match[2]) {
    case '+':
      return a + b;
    case '-':
    case '−':
      return a - b;
    case '*':
    case '×':
    case 'x':
    case 'X':
      return a * b;
    default:
      throw new Error(`Unsupported operator: ${match[2]}`);
  }
}

/**
 * Run an assertion, then hold the browser on screen so the result can be seen.
 * The pause happens in `finally`, so a FAILED check is also visible before
 * the browser closes.
 */
async function expectAndHold(page, assertion, holdMs = HOLD_MS) {
  try {
    await assertion();
  } finally {
    if (holdMs > 0) {
      await page.locator('#feedback').highlight().catch(() => {});
      await page.waitForTimeout(holdMs);
    }
  }
}

async function submitAnswer(page, value) {
  await page.locator('#answer-input').fill(String(value));
  await page.locator('#answer-form').evaluate((form) => form.requestSubmit());
}

test.describe('AI Math Teacher / Examiner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
  });

  test('generates a question, solves it, and gets correct feedback', async ({ page }) => {
    await page.locator('#generate-btn').click();

    const question = page.locator('#question-display');
    await expect(question).toContainText(/\d/);

    const answer = solve((await question.textContent()) || '');
    await submitAnswer(page, answer);

    await expectAndHold(page, () =>
      expect(page.locator('#feedback')).toHaveText(CORRECT_RE)
    );
  });

  test('gives incorrect feedback for a wrong answer', async ({ page }) => {
    await page.locator('#generate-btn').click();

    const question = page.locator('#question-display');
    await expect(question).toContainText(/\d/);

    const wrongAnswer = solve((await question.textContent()) || '') + 1;
    await submitAnswer(page, wrongAnswer);

    await expectAndHold(page, () =>
      expect(page.locator('#feedback')).toHaveText(INCORRECT_RE)
    );
  });

  test('works across many randomly generated questions', async ({ page }) => {
    const rounds = 20;
    const shortHold = Math.min(HOLD_MS, 500); // keep the loop quick
    test.setTimeout(30_000 + rounds * (shortHold + 1_000));

    const question = page.locator('#question-display');

    for (let i = 0; i < rounds; i++) {
      await page.locator('#generate-btn').click();
      await expect(question).toContainText(/\d/);

      const answer = solve((await question.textContent()) || '');
      await submitAnswer(page, answer);

      await expectAndHold(
        page,
        () => expect(page.locator('#feedback')).toHaveText(CORRECT_RE),
        shortHold
      );
    }
  });
});