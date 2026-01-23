import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * E2E Test: Photo Verification Workflow (Isolation Protocol)
 *
 * Purpose: Verify that the Isolation Protocol works correctly, requiring
 * technicians to upload a photo showing disconnected power before revealing
 * dangerous procedures.
 *
 * Success Criteria:
 * - Photo upload interface is accessible after Guardian blocks dangerous request
 * - System analyzes uploaded photo using vision model
 * - Photo must show clear evidence of power disconnection
 * - Chat unlocks only after valid photo verification
 * - Invalid photos are rejected with clear feedback
 * - Verification state persists across page refreshes
 */

test.describe('Photo Verification Workflow', () => {
  // Test image paths (these should be created as fixtures)
  const VALID_DISCONNECTION_PHOTO = path.join(__dirname, '../fixtures/power-disconnected.jpg');
  const INVALID_PHOTO_STILL_CONNECTED = path.join(__dirname, '../fixtures/power-connected.jpg');
  const INVALID_PHOTO_BLURRY = path.join(__dirname, '../fixtures/blurry-image.jpg');
  const INVALID_PHOTO_WRONG_EQUIPMENT = path.join(__dirname, '../fixtures/wrong-equipment.jpg');

  test.beforeEach(async ({ page }) => {
    // Login and start session
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'technician@testorg.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Start troubleshooting session
    await page.goto('/troubleshoot/new');
    await page.fill('input[name="machineModel"]', 'Domino M230i');
    await page.fill('input[name="workOrderId"]', 'WO-PHOTO-VERIFY');
    await page.click('button[type="submit"]');
    await page.waitForSelector('[data-testid="chat-interface"]');

    // Trigger safety lockout
    await page.fill('[data-testid="message-input"]', 'Can I jump Terminal 29 to Terminal 21?');
    await page.click('[data-testid="send-message-button"]');
    await page.waitForSelector('[data-testid="safety-lockout-modal"]');
  });

  test('should display photo upload interface in safety lockout modal', async ({ page }) => {
    const modal = page.locator('[data-testid="safety-lockout-modal"]');

    // Photo upload section should be visible
    const photoUpload = modal.locator('[data-testid="photo-upload-section"]');
    await expect(photoUpload).toBeVisible();

    // Upload button should be present and enabled
    const uploadButton = modal.locator('[data-testid="photo-upload-button"]');
    await expect(uploadButton).toBeVisible();
    await expect(uploadButton).toBeEnabled();

    // Should have instructions for what photo to take
    const instructions = modal.locator('[data-testid="photo-instructions"]');
    await expect(instructions).toBeVisible();
    await expect(instructions).toContainText(/disconnected|isolated|power off|lockout/i);
  });

  test('should accept file upload via file input', async ({ page }) => {
    const modal = page.locator('[data-testid="safety-lockout-modal"]');

    // Set up file chooser handler
    const fileChooserPromise = page.waitForEvent('filechooser');

    // Click upload button
    await page.click('[data-testid="photo-upload-button"]');

    // Select file
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(VALID_DISCONNECTION_PHOTO);

    // Should show upload progress or confirmation
    const uploadStatus = modal.locator('[data-testid="upload-status"]');
    await expect(uploadStatus).toBeVisible({ timeout: 5000 });
  });

  test('should verify valid disconnection photo and unlock chat', async ({ page }) => {
    // Upload valid photo showing power disconnection
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="photo-upload-button"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(VALID_DISCONNECTION_PHOTO);

    // Wait for verification to complete
    await page.waitForSelector('[data-testid="verification-success"]', {
      timeout: 10000, // Vision model analysis may take a few seconds
    });

    // Verification success message should appear
    const successMessage = page.locator('[data-testid="verification-success"]');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText(/verified|approved|confirmed|safe to proceed/i);

    // Modal should close automatically
    await expect(page.locator('[data-testid="safety-lockout-modal"]')).not.toBeVisible({
      timeout: 3000,
    });

    // Chat input should be re-enabled
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeEnabled();

    // Send button should be enabled
    const sendButton = page.locator('[data-testid="send-message-button"]');
    await expect(sendButton).toBeEnabled();
  });

  test('should reject photo that shows power still connected', async ({ page }) => {
    // Upload invalid photo (power still connected)
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="photo-upload-button"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(INVALID_PHOTO_STILL_CONNECTED);

    // Wait for verification to complete
    await page.waitForSelector('[data-testid="verification-failed"]', {
      timeout: 10000,
    });

    // Rejection message should appear
    const errorMessage = page.locator('[data-testid="verification-failed"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/power.*connected|not.*disconnected|still.*energized/i);

    // Modal should remain visible
    await expect(page.locator('[data-testid="safety-lockout-modal"]')).toBeVisible();

    // Chat input should remain disabled
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeDisabled();
  });

  test('should reject blurry or unclear photos', async ({ page }) => {
    // Upload blurry photo
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="photo-upload-button"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(INVALID_PHOTO_BLURRY);

    // Wait for verification
    await page.waitForSelector('[data-testid="verification-failed"]', {
      timeout: 10000,
    });

    // Should provide specific feedback
    const errorMessage = page.locator('[data-testid="verification-failed"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/blurry|unclear|quality|retake|clearer/i);

    // Should allow retry
    const retryButton = page.locator('[data-testid="photo-upload-button"]');
    await expect(retryButton).toBeEnabled();
  });

  test('should reject photos of wrong equipment', async ({ page }) => {
    // Upload photo of different equipment
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="photo-upload-button"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(INVALID_PHOTO_WRONG_EQUIPMENT);

    // Wait for verification
    await page.waitForSelector('[data-testid="verification-failed"]', {
      timeout: 10000,
    });

    // Should detect wrong equipment
    const errorMessage = page.locator('[data-testid="verification-failed"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/wrong.*equipment|different.*machine|Domino M230i/i);
  });

  test('should show verification progress during photo analysis', async ({ page }) => {
    // Upload photo
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="photo-upload-button"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(VALID_DISCONNECTION_PHOTO);

    // Should show analyzing state
    const analyzingIndicator = page.locator('[data-testid="photo-analyzing"]');
    await expect(analyzingIndicator).toBeVisible();
    await expect(analyzingIndicator).toContainText(/analyzing|verifying|checking|processing/i);

    // Should have loading spinner or progress indicator
    const spinner = page.locator('[data-testid="verification-spinner"]');
    await expect(spinner).toBeVisible();
  });

  test('should display vision model analysis results', async ({ page }) => {
    // Upload valid photo
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="photo-upload-button"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(VALID_DISCONNECTION_PHOTO);

    // Wait for results
    await page.waitForSelector('[data-testid="verification-results"]', {
      timeout: 10000,
    });

    // Should show what the vision model detected
    const results = page.locator('[data-testid="verification-results"]');
    await expect(results).toBeVisible();

    // Should mention disconnected state
    await expect(results).toContainText(/disconnected|isolated|de-energized/i);

    // Should have confidence score
    await expect(results).toContainText(/confidence/i);
  });

  test('should allow retrying photo upload after failure', async ({ page }) => {
    // First attempt - invalid photo
    let fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="photo-upload-button"]');
    let fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(INVALID_PHOTO_BLURRY);

    // Wait for failure
    await page.waitForSelector('[data-testid="verification-failed"]');

    // Retry with valid photo
    fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="photo-upload-button"]');
    fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(VALID_DISCONNECTION_PHOTO);

    // Should succeed
    await page.waitForSelector('[data-testid="verification-success"]', {
      timeout: 10000,
    });

    // Chat should unlock
    await expect(page.locator('[data-testid="message-input"]')).toBeEnabled();
  });

  test('should persist verification state across page refresh', async ({ page }) => {
    // Upload valid photo
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="photo-upload-button"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(VALID_DISCONNECTION_PHOTO);

    // Wait for verification success
    await page.waitForSelector('[data-testid="verification-success"]');

    // Wait for modal to close and chat to unlock
    await page.waitForSelector('[data-testid="message-input"]:not([disabled])');

    // Refresh page
    await page.reload();

    // Chat should remain unlocked
    const messageInput = page.locator('[data-testid="message-input"]');
    await expect(messageInput).toBeEnabled({ timeout: 5000 });

    // Safety lockout modal should not reappear
    await expect(page.locator('[data-testid="safety-lockout-modal"]')).not.toBeVisible();
  });

  test('should log photo verification in incident history', async ({ page }) => {
    // Upload valid photo
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="photo-upload-button"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(VALID_DISCONNECTION_PHOTO);

    // Wait for verification
    await page.waitForSelector('[data-testid="verification-success"]');

    // Navigate to incident history
    await page.goto('/troubleshoot/history');

    // Find current session
    await page.click(`text=/WO-PHOTO-VERIFY/`);

    // Verify photo verification event is logged
    const verificationLog = page.locator('[data-testid="verification-event"]');
    await expect(verificationLog).toBeVisible();
    await expect(verificationLog).toContainText(/photo.*verified|isolation.*confirmed/i);

    // Should show timestamp
    await expect(verificationLog).toContainText(/\d{1,2}:\d{2}/); // Time format
  });

  test('should validate file type (images only)', async ({ page }) => {
    // Try uploading non-image file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="photo-upload-button"]');
    const fileChooser = await fileChooserPromise;

    // Attempt to upload a text file
    const textFilePath = path.join(__dirname, '../fixtures/test-document.txt');
    await fileChooser.setFiles(textFilePath);

    // Should show error
    const errorMessage = page.locator('[data-testid="file-type-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/image.*only|jpg|jpeg|png|invalid.*file/i);
  });

  test('should validate file size limit', async ({ page }) => {
    // This test assumes there's a large file in fixtures
    // const largeFilePath = path.join(__dirname, '../fixtures/large-image.jpg');

    // For now, just verify the file size limit message exists
    const modal = page.locator('[data-testid="safety-lockout-modal"]');
    const sizeLimit = modal.locator('[data-testid="file-size-limit"]');
    await expect(sizeLimit).toBeVisible();
    await expect(sizeLimit).toContainText(/MB|size limit/i);
  });
});
