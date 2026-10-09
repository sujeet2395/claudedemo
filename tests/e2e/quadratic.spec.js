// @ts-check
const { test, expect } = require('@playwright/test');

// Served by server.js via the webServer entry in playwright.config.js.
const APP_URL = process.env.APP_URL || 'http://localhost:3100';

const HOLD_MS = Number(process.env.HOLD_MS ?? 1000);

/** Mock the Haiku-backed endpoint so tests never call the real API. */
async function mockQuadratic(page, body, status = 200) {
  await page.route('**/api/quadratic', (route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
  );
}

async function generate(page) {
  await page.locator('#mode-quadratic').click();
  await page.locator('#quad-generate-btn').click();
  await expect(page.locator('#quad-question-display')).toContainText('Find the roots');
}

async function submitRoots(page, r1, r2) {
  await page.locator('#root1-input').fill(r1);
  await page.locator('#root2-input').fill(r2);
  await page.locator('#quad-form').evaluate((form) => form.requestSubmit());
}

async function expectFeedback(page, matcher) {
  try {
    await expect(page.locator('#quad-feedback')).toHaveText(matcher);
  } finally {
    if (HOLD_MS > 0) await page.waitForTimeout(HOLD_MS);
  }
}

test.describe('Quadratic level', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
  });

  test('toggles between practice and quadratic modes', async ({ page }) => {
    await expect(page.locator('#practice-section')).toBeVisible();
    await expect(page.locator('#quadratic-section')).toBeHidden();
    await page.locator('#mode-quadratic').click();
    await expect(page.locator('#quadratic-section')).toBeVisible();
    await expect(page.locator('#practice-section')).toBeHidden();
  });

  test('accepts real roots in either order', async ({ page }) => {
    await mockQuadratic(page, { a: 1, b: -5, c: 6 });
    await generate(page);
    await expect(page.locator('#quad-question-display')).toContainText('x² - 5x + 6 = 0');

    await submitRoots(page, '3', '2');
    await expectFeedback(page, /^Correct!$/);
  });

  test('accepts complex roots', async ({ page }) => {
    await mockQuadratic(page, { a: 1, b: 2, c: 5 });
    await generate(page);

    await submitRoots(page, '-1 - 2i', '-1+2i');
    await expectFeedback(page, /^Correct!$/);
  });

  test('accepts fractional roots', async ({ page }) => {
    await mockQuadratic(page, { a: 2, b: -5, c: 2 });
    await generate(page);

    await submitRoots(page, '1/2', '2');
    await expectFeedback(page, /^Correct!$/);
  });

  test('rejects a wrong answer and shows the true roots', async ({ page }) => {
    await mockQuadratic(page, { a: 1, b: -5, c: 6 });
    await generate(page);

    await submitRoots(page, '1', '6');
    await expectFeedback(page, /Incorrect.*2 and 3|Incorrect.*3 and 2/s);
  });

  test('rejects real roots given for a complex-root equation', async ({ page }) => {
    await mockQuadratic(page, { a: 1, b: 2, c: 5 });
    await generate(page);

    await submitRoots(page, '-1', '-1');
    await expectFeedback(page, /Incorrect/);
  });

  test('shows an error when the server fails', async ({ page }) => {
    await mockQuadratic(page, { error: 'ANTHROPIC_API_KEY is not set on the server.' }, 500);
    await page.locator('#mode-quadratic').click();
    await page.locator('#quad-generate-btn').click();

    await expect(page.locator('#quad-question-display')).toContainText('Could not generate');
    await expect(page.locator('#quad-feedback')).toContainText('ANTHROPIC_API_KEY');
  });
});
