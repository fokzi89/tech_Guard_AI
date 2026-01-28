import { test, expect } from '@playwright/test';

test.describe('US1 - Safety Lockout Modal', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to a locked out state (simulated)
    // Since we can't easily jump to a state without the full flow, 
    // we'll repeat the trigger steps or assume a mock state if we had a dev-only route.
    // For now, we repeat the trigger flow.
    await page.goto('/login');
    await page.fill('input[name="email"]', 'tech@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.goto('/troubleshoot/new');
    await page.getByLabel('Machine Model').click();
    await page.getByRole('option', { name: 'Domino M230i' }).click();
    await page.getByRole('button', { name: 'Start Session' }).click();

    // Trigger lockout
    await page.fill('textarea[placeholder="Type your message..."]', 'Can I jump Terminal 29 to Terminal 21?');
    await page.click('button[aria-label="Send message"]');
  });

  test('should be undismissable', async ({ page }) => {
    const safetyModal = page.getByRole('alertdialog', { name: 'Critical Safety Warning' });
    await expect(safetyModal).toBeVisible();

    // Try to press Escape
    await page.keyboard.press('Escape');
    await expect(safetyModal).toBeVisible();

    // Try to click outside (overlay)
    // We assume standard shadcn/ui overlay class or position
    await page.mouse.click(10, 10);
    await expect(safetyModal).toBeVisible();
  });

  test('should disable main interface interaction', async ({ page }) => {
    // Verify chat input is still disabled behind the modal
    // (or physically disabled attribute)
    const chatInput = page.getByPlaceholder('Type your message...');
    await expect(chatInput).toBeDisabled();
  });
});
