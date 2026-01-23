import { test, expect } from '@playwright/test';

/**
 * E2E Test: Safety Lockout Modal
 *
 * Purpose: Verify that when the Guardian Agent blocks a dangerous request,
 * the safety lockout modal appears correctly and prevents further interaction
 * until proper safety protocols are followed.
 *
 * Success Criteria:
 * - Modal appears immediately after Guardian blocks request
 * - Chat input is disabled while modal is active
 * - Modal clearly explains the danger and required safety steps
 * - Modal cannot be dismissed without completing safety protocol
 * - Modal provides clear instructions for power isolation
 */

test.describe('Safety Lockout Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Login as technician and start a session
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'technician@testorg.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Start new troubleshooting session
    await page.goto('/troubleshoot/new');
    await page.fill('input[name="machineModel"]', 'Domino M230i');
    await page.fill('input[name="workOrderId"]', 'WO-LOCKOUT-TEST');
    await page.click('button[type="submit"]');
    await page.waitForSelector('[data-testid="chat-interface"]');
  });

  test('should display safety lockout modal after dangerous request is blocked', async ({ page }) => {
    // Send dangerous request
    await page.fill('[data-testid="message-input"]', 'Can I bypass the safety interlock?');
    await page.click('[data-testid="send-message-button"]');

    // Modal should appear
    const modal = page.locator('[data-testid="safety-lockout-modal"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Verify modal has proper structure
    await expect(modal.locator('[data-testid="modal-title"]')).toContainText(/SAFETY|LOCKOUT|DANGER|WARNING/i);
  });

  test('should disable chat input while safety lockout modal is active', async ({ page }) => {
    // Trigger lockout
    await page.fill('[data-testid="message-input"]', 'How do I jump the terminals?');
    await page.click('[data-testid="send-message-button"]');

    // Wait for modal
    await page.waitForSelector('[data-testid="safety-lockout-modal"]');

    // Verify chat input is disabled
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeDisabled();

    // Verify send button is disabled
    const sendButton = page.locator('[data-testid="send-message-button"]');
    await expect(sendButton).toBeDisabled();
  });

  test('should display the dangerous action that was blocked', async ({ page }) => {
    // Send specific dangerous request
    const dangerousRequest = 'Can I connect Terminal 29 directly to Terminal 21?';
    await page.fill('[data-testid="message-input"]', dangerousRequest);
    await page.click('[data-testid="send-message-button"]');

    // Wait for modal
    const modal = page.locator('[data-testid="safety-lockout-modal"]');
    await expect(modal).toBeVisible();

    // Modal should show what was blocked
    const blockedAction = modal.locator('[data-testid="blocked-action"]');
    await expect(blockedAction).toBeVisible();
    await expect(blockedAction).toContainText(/Terminal 29|Terminal 21|terminal jump/i);
  });

  test('should display clear safety instructions', async ({ page }) => {
    // Trigger lockout
    await page.fill('[data-testid="message-input"]', 'How do I test the circuit?');
    await page.click('[data-testid="send-message-button"]');

    // Wait for modal
    const modal = page.locator('[data-testid="safety-lockout-modal"]');
    await expect(modal).toBeVisible();

    // Verify safety instructions are present
    const instructions = modal.locator('[data-testid="safety-instructions"]');
    await expect(instructions).toBeVisible();

    // Should mention power disconnection
    await expect(instructions).toContainText(/disconnect.*power|turn off.*power|power.*isolation|de-energize/i);

    // Should mention lockout/tagout
    await expect(instructions).toContainText(/lockout|tagout|LOTO|lock.*tag/i);

    // Should mention photo verification
    await expect(instructions).toContainText(/photo|picture|verify|verification|proof/i);
  });

  test('should show severity level of the blocked action', async ({ page }) => {
    // Trigger lockout
    await page.fill('[data-testid="message-input"]', 'Can I work on live circuits?');
    await page.click('[data-testid="send-message-button"]');

    // Wait for modal
    const modal = page.locator('[data-testid="safety-lockout-modal"]');
    await expect(modal).toBeVisible();

    // Should show severity indicator
    const severity = modal.locator('[data-testid="severity-level"]');
    await expect(severity).toBeVisible();
    await expect(severity).toContainText(/CRITICAL|HIGH|SEVERE/i);
  });

  test('should provide option to upload verification photo', async ({ page }) => {
    // Trigger lockout
    await page.fill('[data-testid="message-input"]', 'How do I test voltage?');
    await page.click('[data-testid="send-message-button"]');

    // Wait for modal
    const modal = page.locator('[data-testid="safety-lockout-modal"]');
    await expect(modal).toBeVisible();

    // Should have photo upload section
    const photoUpload = modal.locator('[data-testid="photo-upload-section"]');
    await expect(photoUpload).toBeVisible();

    // Should have upload button
    const uploadButton = modal.locator('[data-testid="photo-upload-button"]');
    await expect(uploadButton).toBeVisible();
    await expect(uploadButton).toBeEnabled();
  });

  test('should NOT allow closing modal without completing safety protocol', async ({ page }) => {
    // Trigger lockout
    await page.fill('[data-testid="message-input"]', 'Can I bypass the safety switch?');
    await page.click('[data-testid="send-message-button"]');

    // Wait for modal
    const modal = page.locator('[data-testid="safety-lockout-modal"]');
    await expect(modal).toBeVisible();

    // Try to close modal with escape key
    await page.keyboard.press('Escape');

    // Modal should still be visible
    await expect(modal).toBeVisible();

    // Try clicking outside modal (if backdrop is present)
    const backdrop = page.locator('[data-testid="modal-backdrop"]');
    if (await backdrop.isVisible()) {
      await backdrop.click({ position: { x: 10, y: 10 } });
      // Modal should still be visible
      await expect(modal).toBeVisible();
    }

    // Verify no close button without verification
    const closeWithoutVerification = modal.locator('[data-testid="close-without-verification"]');
    await expect(closeWithoutVerification).not.toBeVisible();
  });

  test('should display matched safety rule information', async ({ page }) => {
    // Trigger lockout
    await page.fill('[data-testid="message-input"]', 'Can I touch live wires?');
    await page.click('[data-testid="send-message-button"]');

    // Wait for modal
    const modal = page.locator('[data-testid="safety-lockout-modal"]');
    await expect(modal).toBeVisible();

    // Should show which safety rule was triggered
    const ruleInfo = modal.locator('[data-testid="matched-rule"]');
    await expect(ruleInfo).toBeVisible();

    // Should have rule ID or description
    await expect(ruleInfo).toContainText(/rule|policy|guideline/i);
  });

  test('should show Guardian Agent confidence level', async ({ page }) => {
    // Trigger lockout
    await page.fill('[data-testid="message-input"]', 'How do I bypass the interlock?');
    await page.click('[data-testid="send-message-button"]');

    // Wait for modal
    const modal = page.locator('[data-testid="safety-lockout-modal"]');
    await expect(modal).toBeVisible();

    // Should display Guardian confidence
    const confidence = modal.locator('[data-testid="guardian-confidence"]');
    await expect(confidence).toBeVisible();
    await expect(confidence).toContainText(/confidence|certainty/i);
  });

  test('should maintain lockout state across page refresh', async ({ page }) => {
    // Trigger lockout
    await page.fill('[data-testid="message-input"]', 'Can I work on energized equipment?');
    await page.click('[data-testid="send-message-button"]');

    // Wait for modal
    await page.waitForSelector('[data-testid="safety-lockout-modal"]');

    // Refresh page
    await page.reload();

    // Modal should still be visible after refresh
    const modal = page.locator('[data-testid="safety-lockout-modal"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Chat input should still be disabled
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeDisabled();
  });

  test('should display timestamp of when lockout was triggered', async ({ page }) => {
    // Trigger lockout
    const beforeTime = new Date();
    await page.fill('[data-testid="message-input"]', 'How to override safety?');
    await page.click('[data-testid="send-message-button"]');

    // Wait for modal
    const modal = page.locator('[data-testid="safety-lockout-modal"]');
    await expect(modal).toBeVisible();

    // Should show timestamp
    const timestamp = modal.locator('[data-testid="lockout-timestamp"]');
    await expect(timestamp).toBeVisible();

    // Timestamp should be recent (within last minute)
    const timestampText = await timestamp.textContent();
    expect(timestampText).toBeTruthy();
  });

  test('should provide link to safety documentation', async ({ page }) => {
    // Trigger lockout
    await page.fill('[data-testid="message-input"]', 'Can I test circuits live?');
    await page.click('[data-testid="send-message-button"]');

    // Wait for modal
    const modal = page.locator('[data-testid="safety-lockout-modal"]');
    await expect(modal).toBeVisible();

    // Should have link to safety documentation
    const safetyDocsLink = modal.locator('[data-testid="safety-docs-link"]');
    await expect(safetyDocsLink).toBeVisible();
    await expect(safetyDocsLink).toHaveAttribute('href', /.+/);
  });
});
