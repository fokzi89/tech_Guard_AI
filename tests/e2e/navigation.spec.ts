import { test, expect } from '@playwright/test';

test('Dashboard Navigation Verification', async ({ page }) => {
    // 1. Log in as Super Admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'super@techguard.ai');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    // The dashboard might redirect to /dashboard/organization if that was the default, but here it should go to /dashboard
    await page.waitForURL(/\/dashboard/);

    // Verify Dashboard content is loaded (Skeleton gone)
    // Look for "Safety First" or "Ready to Use" cards which are part of the static content
    await expect(page.getByText('Safety First')).toBeVisible();

    // 2. Test Navigation to Organization
    console.log('Testing Organization Link...');
    // We replaced the link with a NavigationButton which is a button
    const orgCard = page.locator('button').filter({ hasText: 'Organization' }).first();
    await expect(orgCard).toBeVisible();
    await orgCard.click();

    await expect(page).toHaveURL(/\/dashboard\/organization$/);
    await expect(page.getByText('Organization Details')).toBeVisible();

    // 3. Test Back Navigation (Caching check - should be fast)
    console.log('Testing Back Navigation...');
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText('Safety First')).toBeVisible();

    // 4. Test Navigation to Manuals
    console.log('Testing Manuals Link...');
    const manualsCard = page.locator('button').filter({ hasText: 'Manuals' }).first();
    await manualsCard.click();

    await expect(page).toHaveURL(/\/dashboard\/organization\/manuals/);

    console.log('Navigation test passed!');
});
