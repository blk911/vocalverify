import { test, expect } from '@playwright/test';

const DASH_URL = '/member-dashboard?memberCode=demo';

test.describe('Member Dashboard (demo)', () => {
  test('smoke: renders, loads profile, shows key panels', async ({ page }) => {
    await page.goto(DASH_URL);
    await expect(page).toHaveTitle(/AM I HUMAN/i);

    // identity block visible - use specific heading selector
    await expect(page.getByRole('heading', { name: /Welcome, Member/i })).toBeVisible();

    // trust bonds / artifacts present (adjust text to your UI)
    await expect(page.getByText(/Trust Bonds/i)).toBeVisible();
    await expect(page.getByText(/Artifacts/i)).toBeVisible();
  });

  test('creates artifact: fills prompt, posts to API, confirms saved', async ({ page }) => {
    await page.goto(DASH_URL);

    // open prompt session - use exact text match
    await page.getByRole('button', { name: 'Start' }).click();

    // answer seed prompt
    const ta = page.getByRole('textbox');
    await ta.fill('Cooking: Mother taught by example; first copied biscuits.');

    // intercept API call
    const [req] = await Promise.all([
      page.waitForRequest(r => /\/api\/profile\/extract$/.test(r.url()) && r.method() === 'POST'),
      page.getByRole('button', { name: /preview/i }).click(),
    ]);

    // Assert request body shape
    const posted = JSON.parse(req.postData() || '{}');
    expect(posted).toMatchObject({ domain: expect.any(String), answer: expect.any(String) });

    // preview visible
    await expect(page.getByText(/biscuits/i)).toBeVisible();

    // save (and assert save POST)
    const [saveReq] = await Promise.all([
      page.waitForRequest(r => /\/api\/profile\/artifacts$/.test(r.url()) && r.method() === 'POST'),
      page.getByRole('button', { name: /^save$/i }).click(),
    ]);

    const saved = JSON.parse(saveReq.postData() || '{}');
    expect(saved).toHaveProperty('preview.summary');

    // toast or list update (adjust selector to your UI)
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 5000 });
  });

  test('trust bond selection persists', async ({ page }) => {
    await page.goto(DASH_URL);

    // pick a TB (radio) - use exact label match
    const rb = page.getByRole('radio', { name: 'Spencer ↔ Ash' });
    await rb.check();

    // reload and confirm persisted (if you persist to DB/localStorage)
    await page.reload();
    await expect(rb).toBeChecked();
  });
});

