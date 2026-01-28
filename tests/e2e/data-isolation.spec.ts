import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client for setting up test data (if needed) or assume seed data
// In a real E2E, we would likely use a global setup or API to seed data.
// For now, we assume Organization A and Organization B exist with specific users.

test.describe('US2 - Data Isolation', () => {

    test('Org A user cannot access Org B manuals', async ({ page }) => {
        // 1. Log in as Org A User
        await page.goto('/login');
        await page.fill('input[name="email"]', 'tech-org-a@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Wait for redirect
        await expect(page).toHaveURL(/\/troubleshoot/);

        // 2. Attempt to search for Org B's private manual
        // Assuming UI has a manual search or we verify via chat context
        // Let's use the Chat RAG feature to verify.
        // If Org B has "Secret Org B Manual", searching for it should return nothing for Org A.

        await page.goto('/troubleshoot/new');
        await page.getByLabel('Machine Model').click();
        // Assuming a generic model used by both but having different manuals
        await page.getByRole('option', { name: 'Generic' }).click(); // 'Generic' model
        await page.getByRole('button', { name: 'Start Session' }).click();

        // Ask about something specific to Org B's manual
        await page.fill('textarea[placeholder="Type your message..."]', 'How do I calibration the Flux Capacitor?');
        await page.click('button[aria-label="Send message"]');

        // 3. Verify Response does NOT contain info from Org B
        // We expect a generic "I don't know" or "Check manual" response, NOT the specific instruction from Org B's manual.
        // Or we explicitly check that the source citation is NOT from Org B.

        await expect(page.getByText('Flux Capacitor')).not.toBeVisible();
        // Or better, check that no manual with title "Org B Secret Manual" is cited.
        const citation = page.locator('[data-testid="message-assistant"]').getByText('Org B Secret Manual');
        await expect(citation).not.toBeVisible();
    });

    test('Org A user cannot view Org B sessions', async ({ page, request }) => {
        // 1. Log in as Org A User
        await page.goto('/login');
        await page.fill('input[name="email"]', 'tech-org-a@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        // 2. Go to history
        await page.goto('/troubleshoot/history');

        // 3. Verify only Org A sessions are visible
        // We assume the page loads data.
        // We can also try to directly access an Org B session ID if we knew it.

        // Let's try to access a known Org B session ID (mocked ID)
        const knownOrgBSessionId = '00000000-0000-0000-0000-00000000000b'; // Mock UUID
        await page.goto(`/troubleshoot/${knownOrgBSessionId}`);

        // Should be 404 or redirected or "Session not found"
        // Our page component redirects to /troubleshoot/new on error
        await expect(page).toHaveURL(/\/troubleshoot\/new/);

        // Or we expect a "Not Found" message
        // await expect(page.getByText('Session not found')).toBeVisible(); 
    });

});
