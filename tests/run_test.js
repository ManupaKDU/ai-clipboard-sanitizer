
const path = require('path');
const { spawn } = require('child_process');
const { launchBrowser } = require('./test_utils');

(async () => {
  // Start a local server
  const server = spawn('python3', ['-m', 'http.server', '8000'], { cwd: __dirname });

  // Add cleanup to kill server on exit
  const cleanup = () => {
    if (server) server.kill();
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  await new Promise(r => setTimeout(r, 2000));

  const testUrl = 'http://localhost:8000/test.html';

  console.log('Launching browser with extension...');
  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.goto(testUrl);

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Manually inject scripts for testing if extension loading fails in headless mode
    await page.addScriptTag({ path: path.resolve(__dirname, '../rules.js') });
    await page.addScriptTag({ path: path.resolve(__dirname, '../content.js') });

    // Sensitive string
    const sensitiveText = "Contact me at bob@example.com or use key AKIA1234567890123456";
    console.log("Original text: " + sensitiveText);

    // Focus textarea
    await page.focus('#target');

    const isSanitizeTextDefined = await page.evaluate(() => typeof sanitizeText !== 'undefined');
    console.log("Is sanitizeText defined in page? " + isSanitizeTextDefined);

    // Simulate paste event on textarea
    console.log("Simulating paste event on textarea...");
    await page.evaluate((text) => {
      const activeElement = document.getElementById('target');
      activeElement.focus();
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text', text);
      const event = new ClipboardEvent('paste', {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true
      });
      activeElement.dispatchEvent(event);
    }, sensitiveText);

    // Give extension time to react
    await new Promise(r => setTimeout(r, 2000));

    const result = await page.$eval('#target', el => el.value);
    console.log("Pasted text in textarea:   '" + result + "'");

    if (result.includes('[REDACTED_EMAIL]') && result.includes('[REDACTED_AWS_KEY]')) {
        console.log("TEXTAREA TEST PASSED: Sanitization successful.");
    } else {
        console.log("TEXTAREA TEST FAILED: Sanitization failed. Content was: '" + result + "'");
        process.exit(1);
    }

    // Focus contenteditable div
    await page.focus('#editable-target');

    // Simulate paste event on contenteditable
    console.log("Simulating paste event on contenteditable...");
    await page.evaluate((text) => {
      const activeElement = document.getElementById('editable-target');
      activeElement.focus();
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text', text);
      const event = new ClipboardEvent('paste', {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true
      });
      activeElement.dispatchEvent(event);
    }, sensitiveText);

    // Give extension time to react
    await new Promise(r => setTimeout(r, 2000));

    const contenteditableResult = await page.$eval('#editable-target', el => el.textContent);
    console.log("Pasted text in contenteditable:   '" + contenteditableResult + "'");

    if (contenteditableResult.includes('[REDACTED_EMAIL]') && contenteditableResult.includes('[REDACTED_AWS_KEY]')) {
        console.log("CONTENTEDITABLE TEST PASSED: Sanitization successful.");
    } else {
        console.log("CONTENTEDITABLE TEST FAILED: Sanitization failed. Content was: '" + contenteditableResult + "'");
        process.exit(1);
    }
  } finally {
    await browser.close();
    server.kill();
  }
})();
