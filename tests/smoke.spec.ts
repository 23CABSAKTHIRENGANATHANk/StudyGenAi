import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/refresh', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
  );
});

test('homepage loads and navigation works', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Study smarter/i)).toBeVisible();
  await expect(page.getByText(/AI-powered study companion/i)).toBeVisible();

  await page.getByRole('link', { name: /get started/i }).click();
  await expect(page).toHaveURL(/\/auth\/signup/);
});

test('auth page renders login and signup tabs', async ({ page }) => {
  await page.goto('/auth/login');
  const navigation = page.getByRole('navigation');
  await expect(navigation.getByRole('link', { name: 'Login', exact: true })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Sign up', exact: true })).toBeVisible();
});
