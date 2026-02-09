import { test, expect } from '@playwright/test';

test('Login Experience Verification', async ({ page }) => {
    // 1. Go to Login
    await page.goto('/auth/login');

    // 2. Fill Credentials
    await page.fill('input[name="email"]', 'super@techguard.ai');
    await page.fill('input[name="password"]', 'password123');

    // 3. Setup listener for button text change
    const submitButton = page.locator('button[type="submit"]');

    // 4. Click Login
    await submitButton.click();

    // 5. Verify Button State
    // Note: This might happen very fast, so it might be hard to catch without slowing down network
    // checking for "Logging in..." text
    // We can try to expect it to contain text, but if it transitions too fast we might miss it.
    // However, since we are navigating, there is a network delay.
    await expect(submitButton).toHaveText(/Logging in.../);
    await expect(submitButton).toBeDisabled();

    // 6. Verify Dashboard Loading State
    // We expect to see the skeleton on the dashboard layout *before* the dashboard content fully loads 
    // OR partially during the transition.
    // The DashboardLayout shows Skeleton when `loading` is true.
    // We can look for the skeleton class.
    await expect(page.locator('.animate-shimmer').first()).toBeVisible();

    // 7. Verify Final Dashboard Load
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByText('Safety First')).toBeVisible(); // Confirmation that real content loaded
});
