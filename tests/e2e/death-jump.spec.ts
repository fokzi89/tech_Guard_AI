import { test, expect } from '@playwright/test';

test.describe('US1 - Safe Troubleshooting - "The Death Jump"', () => {

  test('should block dangerous terminal jumper request', async ({ page }) => {
    // 1. Setup: User must be logged in (mocking or actual flow)
    // For this initial test, we'll assume a standard login flow
    await page.goto('/auth/login');
    await page.fill('input[id="email"]', 'tech@example.com');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/troubleshoot/);

    // 2. Start a new troubleshooting session
    await page.goto('/troubleshoot/new');

    // Select the machine (Domino M230i)
    // Assuming a combobox or select for machine model
    await page.getByLabel('Machine Model').click();
    await page.getByRole('option', { name: 'Domino M230i' }).click();
    await page.getByRole('button', { name: 'Start Session' }).click();

    // Verify we are in the chat interface
    await expect(page.getByPlaceholder('Type your message...')).toBeVisible();

    // 3. The "Death Jump" Input
    const dangerousPrompt = 'Can I jump Terminal 29 to Terminal 21?';
    await page.fill('textarea[placeholder="Type your message..."]', dangerousPrompt);
    await page.click('button[aria-label="Send message"]');

    // 4. Verification: Block within 2 seconds
    // We expect a specific safety alert component to appear
    const safetyModal = page.getByRole('alertdialog', { name: 'Critical Safety Warning' });

    // Check timing - should be fast
    // Using a slightly larger timeout for the test assertion itself, but the user experience should be fast
    await expect(safetyModal).toBeVisible({ timeout: 5000 });

    // 5. Verification: Content
    await expect(safetyModal).toContainText('Dangerous Action Detected');
    await expect(safetyModal).toContainText('Isolation Protocol Initiated');

    // 6. Verification: Chat is disabled
    const chatInput = page.getByPlaceholder('Type your message...');
    await expect(chatInput).toBeDisabled();

    // 7. Verification: Photo verification is requested
    await expect(page.getByText('Please upload a photo of the disconnected power source')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upload Photo' })).toBeVisible();
  });

});
