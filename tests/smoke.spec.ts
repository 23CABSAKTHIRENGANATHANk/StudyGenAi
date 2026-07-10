import { test, expect } from '@playwright/test';

test('homepage loads and navigation works', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Study smarter/i)).toBeVisible();
  await expect(page.getByText(/AI-powered study companion/i)).toBeVisible();

  await page.getByRole('link', { name: /get started/i }).click();
  await expect(page).toHaveURL(/\/auth\/signup/);
});

test('auth page renders login and signup tabs', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
});
