import { test, expect } from '@playwright/test';

test.describe('US3 - CMMS Reports', () => {
    test('Technician can generate a CMMS report from a session', async ({ page }) => {
        // 1. Log in
        await page.goto('/auth/login');
        await page.fill('input[name="email"]', 'tech-org-a@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        // 2. Start a session
        await page.goto('/troubleshoot/new');
        await page.getByLabel('Machine Model').click();
        await page.getByRole('option', { name: 'Generic' }).click();
        await page.fill('input[placeholder="e.g. WO-12345"]', 'WO-TEST-REPORT');
        await page.click('button[type="submit"]');

        // 3. Have a conversation (Machine is broken -> Fix it -> Verify)
        const messages = [
            "The web tension is too high.",
            "Check the dancer arm position.",
            "Dancer arm is stuck. I freed it.",
            "Verify tension is normal now.",
            "Tension is stable. Issue resolved."
        ];

        for (const msg of messages) {
            await page.fill('textarea[data-testid="message-input"]', msg);
            await page.click('button[data-testid="send-message-button"]');
            // Wait for response
            await expect(page.locator('button[data-testid="send-message-button"]')).not.toBeDisabled({ timeout: 10000 });
        }

        // 4. Click Generate Report
        await page.click('button[data-testid="generate-report-button"]');

        // 5. Verify Report Modal appears and content matches
        await expect(page.getByText('Service Report Generated')).toBeVisible();
        await expect(page.getByText('WO-TEST-REPORT')).toBeVisible();

        // Check key phrases in "Work Performed"
        await expect(page.getByText('Dancer arm is stuck')).toBeVisible();
        await expect(page.getByText('freed it')).toBeVisible();

        // Check "As Left"
        await expect(page.getByText('Tension is stable')).toBeVisible();
        await expect(page.getByText('Issue resolved')).toBeVisible();
    });
});
