import { test, expect } from '@playwright/test';

test('homepage renders and auth page is accessible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /StudyGen AI/i })).toBeVisible();
  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { name: /Sign in to continue learning faster/i })).toBeVisible();
});

test('dashboard route redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/app');
  await expect(page).toHaveURL(/\/auth\/login/);
});
