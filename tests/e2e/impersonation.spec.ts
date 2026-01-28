import { test, expect } from '@playwright/test';

test.describe('US4 - Super Admin Management', () => {

    test('Super Admin can impersonate an Org Admin', async ({ page }) => {
        // 1. Log in as Super Admin
        await page.goto('/login');
        await page.fill('input[name="email"]', 'super@techguard.ai');
        await page.fill('input[name="password"]', 'password123'); // Assuming test seed
        await page.click('button[type="submit"]');

        // Wait for admin dashboard
        await expect(page).toHaveURL(/\/admin\/organizations/);

        // 2. Locate an organization (Org A) and click Impersonate
        // Assuming a table row with "Org A" and an impersonate button
        const orgRow = page.getByRole('row', { name: /Org A/i });
        await expect(orgRow).toBeVisible();

        await orgRow.getByRole('button', { name: 'Impersonate' }).click();

        // 3. Select user to impersonate (Org Admin)
        // Assuming a modal or dropdown appears
        await page.getByRole('option', { name: /Admin User/i }).click();
        // Or if direct action:
        // await orgRow.getByRole('button', { name: 'Impersonate Admin' }).click();

        // 4. Verify redirected to User Dashboard as that user
        await expect(page).toHaveURL(/\/troubleshoot\/new/);

        // 5. Verify visual indicator of impersonation
        await expect(page.getByText('Impersonating: Org A Admin')).toBeVisible();

        // 6. Stop Impersonation
        await page.click('button[aria-label="Stop Impersonation"]');
        await expect(page).toHaveURL(/\/admin\/organizations/);
    });

    test('Super Admin can suspend an organization', async ({ page }) => {
        // 1. Log in as Super Admin
        await page.goto('/login');
        await page.fill('input[name="email"]', 'super@techguard.ai');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        // 2. Find Org B and suspend
        const orgRow = page.getByRole('row', { name: /Org B/i });
        await orgRow.getByRole('button', { name: 'Suspend' }).click();

        // Confirm dialog
        await page.getByRole('button', { name: 'Confirm' }).click();

        // 3. Verify status changed
        await expect(orgRow.getByText('Suspended')).toBeVisible();
    });

});
