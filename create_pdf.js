const { chromium } = require('@playwright/test');

(async () => {
    try {
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.setContent('<h1>Test Manual</h1><p>This is a test manual for upload functionality.</p><p>WARNING: High Voltage.</p>');
        await page.pdf({ path: 'test_manual.pdf' });
        await browser.close();
        console.log('PDF created successfully');
    } catch (error) {
        console.error('Error creating PDF:', error);
        process.exit(1);
    }
})();
