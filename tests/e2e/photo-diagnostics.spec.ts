import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Photo Diagnostics', () => {
    test.slow(); // Increase timeout (3x) for cold-start complications
    // Use a unique session ID for isolation if possible, but the app generates it.
    // We'll require login first.

    test.beforeEach(async ({ page }) => {
        test.setTimeout(60000);

        // Debug logging
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
        page.on('pageerror', err => console.log(`BROWSER ERROR: ${err.message}`));
        page.on('requestfailed', request =>
            console.log(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`)
        );

        // Login as technician
        console.log('Navigating to login...');
        await page.goto('/auth/login');

        // Wait for hydration
        console.log('Waiting for hydration...');
        await page.waitForTimeout(3000);

        console.log('Filling email...');
        await page.fill('input[id="email"]', 'tech@example.com');
        console.log('Filling password...');
        await page.fill('input[id="password"]', 'password123');
        console.log('Clicking submit...');
        await page.click('button[type="submit"]');

        // Wait for loading state to verify click
        await expect(page.getByText('Signing In...')).toBeVisible({ timeout: 5000 });

        // Wait for redirect to dashboard
        try {
            await page.waitForURL('**/dashboard', { timeout: 15000 });
        } catch (e) {
            console.log(`Login timed out. Current URL: ${page.url()}`);
            if (page.url().includes('/auth/login')) {
                // Try force navigation
                await page.goto('/dashboard');
            }
        }
    });

    test('should allow uploading a photo in chat', async ({ page }) => {
        // 1. Start a new session
        // Direct navigation is more reliable than clicking dashboard links which might not exist or be visible
        await page.goto('/troubleshoot/new');

        await page.fill('input[name="machineModel"]', 'Test Machine X100');
        await page.click('button[type="submit"]'); // "Start Session"

        // Wait for chat page
        await page.waitForURL(/\/troubleshoot\/[a-f0-9-]+/);

        // 2. Locate photo upload trigger
        const uploadButton = page.locator('[data-testid="photo-upload-trigger"]');
        await expect(uploadButton).toBeVisible();

        // 3. Upload a file
        // Create a mock file
        const fileChooserPromise = page.waitForEvent('filechooser');
        await uploadButton.click();
        const fileChooser = await fileChooserPromise;

        // We can use a real file or a generated buffer?
        // Playwright needs a path. We'll use a dummy file from the repo or generate one.
        // Let's assume there's a readme or we create a temp file.
        // For now, let's try to upload a text file as image (validation might fail) OR 
        // we should have a test assets folder.
        // I'll create a dummy image file.

        await fileChooser.setFiles({
            name: 'test-image.png',
            mimeType: 'image/png',
            buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
        });

        // 4. Verify preview appears
        await expect(page.locator('img[alt="Preview"]')).toBeVisible();

        // 5. Send message
        await page.fill('[data-testid="message-input"]', 'What is this component?');

        // Intercept the chat request to verify payload
        // useChat sends POST to /api/chat
        const requestPromise = page.waitForRequest(request =>
            request.url().includes('/api/chat') && request.method() === 'POST'
        );

        await page.click('[data-testid="send-message-button"]');

        const request = await requestPromise;
        const postData = request.postDataJSON();

        // Verify the message payload includes the attachment
        const lastMessage = postData.messages[postData.messages.length - 1];
        expect(lastMessage.content).toContain('What is this component?');

        // Vercel AI SDK sends attachments in 'experimental_attachments' field of the message
        // OR as top level data depending on version. 
        // Based on my implementation: generic append({ experimental_attachments: ... }) 
        // usually puts it in the message object in the 'messages' array.

        expect(lastMessage.experimental_attachments).toBeDefined();
        expect(lastMessage.experimental_attachments.length).toBeGreaterThan(0);
        expect(lastMessage.experimental_attachments[0].url).toContain('safety-photos');

    });
});
