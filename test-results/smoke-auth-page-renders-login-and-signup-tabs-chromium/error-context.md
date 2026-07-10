# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> auth page renders login and signup tabs
- Location: tests\smoke.spec.ts:12:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: /sign up/i })
Expected: visible
Error: strict mode violation: getByRole('link', { name: /sign up/i }) resolved to 2 elements:
    1) <a href="/auth/login/signup" class="block rounded-3xl px-5 py-3 text-sm transition text-slate-300 hover:bg-slate-900/70">Sign up</a> aka getByRole('navigation').getByRole('link', { name: 'Sign up' })
    2) <a href="/auth/signup" class="text-violet-300 hover:text-violet-200">Sign up</a> aka getByRole('paragraph').filter({ hasText: 'Don\'t have an account? Sign up' }).getByRole('link')

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('link', { name: /sign up/i })

```

# Page snapshot

```yaml
- generic [ref=e6]:
  - complementary [ref=e7]:
    - generic [ref=e8]:
      - paragraph [ref=e9]: StudyGen AI
      - heading "Sign in to continue learning faster." [level=1] [ref=e10]
    - navigation [ref=e11]:
      - link "Login" [ref=e12] [cursor=pointer]:
        - /url: /auth/login/login
      - link "Sign up" [ref=e13] [cursor=pointer]:
        - /url: /auth/login/signup
  - generic [ref=e15]:
    - generic [ref=e16]:
      - paragraph [ref=e17]: Member access
      - heading "Login to your account" [level=2] [ref=e18]
    - generic [ref=e19]:
      - generic [ref=e20]:
        - text: Email
        - textbox "Email" [ref=e21]
      - generic [ref=e22]:
        - text: Password
        - textbox "Password" [ref=e23]
      - button "Continue" [ref=e24] [cursor=pointer]
    - paragraph [ref=e25]:
      - text: Don't have an account?
      - link "Sign up" [ref=e26] [cursor=pointer]:
        - /url: /auth/signup
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('homepage loads and navigation works', async ({ page }) => {
  4  |   await page.goto('/');
  5  |   await expect(page.getByText(/Study smarter/i)).toBeVisible();
  6  |   await expect(page.getByText(/AI-powered study companion/i)).toBeVisible();
  7  | 
  8  |   await page.getByRole('link', { name: /get started/i }).click();
  9  |   await expect(page).toHaveURL(/\/auth\/signup/);
  10 | });
  11 | 
  12 | test('auth page renders login and signup tabs', async ({ page }) => {
  13 |   await page.goto('/auth/login');
  14 |   await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
> 15 |   await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
     |                                                              ^ Error: expect(locator).toBeVisible() failed
  16 | });
  17 | 
```