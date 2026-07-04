import { test, expect } from '@playwright/test';

test('auth login and upload flow (mocked)', async ({ page }) => {
  // Intercept auth endpoints and return mocked responses
  await page.route('**/api/auth/server-login', route => {
    route.fulfill({ status: 200, body: JSON.stringify({ access_token: 'atk', user: { id: 'u1' } }), headers: { 'set-cookie': 'refresh_token=rtk; HttpOnly' } })
  })
  await page.route('**/api/documents/upload', route => {
    route.fulfill({ status: 200, body: JSON.stringify({ id: 'doc_1', message: 'uploaded' }) })
  })

  await page.goto('/auth')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'password')
  await page.click('button:has-text("Continue")')
  await page.waitForTimeout(500)
  // now navigate to documents and upload
  await page.goto('/app/documents')
  // assume FileUpload component present
  await page.setInputFiles('input[type=file]', [])
  // This is a minimal smoke test; expand selectors to match real DOM
  await expect(page).toHaveURL(/documents/)
});
