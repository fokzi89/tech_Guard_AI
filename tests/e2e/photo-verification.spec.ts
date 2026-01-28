import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('US1 - Photo Verification Workflow', () => {

  test('should unlock session after valid photo upload', async ({ page }) => {
    // 1. Setup: Reach Lockout State
    await page.goto('/login');
    await page.fill('input[name="email"]', 'tech@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.goto('/troubleshoot/new');
    await page.getByLabel('Machine Model').click();
    await page.getByRole('option', { name: 'Domino M230i' }).click();
    await page.getByRole('button', { name: 'Start Session' }).click();
    await page.fill('textarea[placeholder="Type your message..."]', 'Can I jump Terminal 29 to Terminal 21?');
    await page.click('button[aria-label="Send message"]');

    // 2. Upload Photo
    // We need a dummy image file. 
    // In a real scenario, we'd have a test-assets folder.
    // We will assume 'tests/fixtures/isolation_proof.jpg' exists or fail if not (which is fine for now).

    // For the sake of the test file being complete, we'd normally create the fixture. 
    // But failing on missing file is also a valid "fail" state.
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'isolation_proof.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('this is a mock image')
    });

    // 3. Verify "Analyzing" state
    await expect(page.getByText('Analyzing isolation proof...')).toBeVisible();

    // 4. Verify "Unlock" state (Mocking the AI response would be needed here in a real test environment,
    // or we assume the backend handles it. Since we are testing E2E against a real app, 
    // we might ultimately need to mock the API route for consistent testing).

    // Wait for success message
    await expect(page.getByText('Isolation Verified')).toBeVisible({ timeout: 10000 });

    // 5. Verify Chat is re-enabled
    const chatInput = page.getByPlaceholder('Type your message...');
    await expect(chatInput).not.toBeDisabled();
  });
});
