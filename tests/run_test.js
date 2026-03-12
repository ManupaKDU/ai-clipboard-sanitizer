const puppeteer = require('puppeteer');
const path = require('path');
const { spawn } = require('child_process');

(async () => {
  // Start a local server
  const server = spawn('python3', ['-m', 'http.server', '8000'], { cwd: __dirname });

  await new Promise(r => setTimeout(r, 2000));

  const extensionPath = path.resolve(__dirname, '../chrome');
  const testUrl = 'http://localhost:8000/test.html';

  console.log('Launching browser with extension...');
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/usr/bin/google-chrome',
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.goto(testUrl);

    // Wait for content script to signal it's loaded
    await new Promise(r => setTimeout(r, 2000));

    // Sensitive string
    const sensitiveText = "Contact me at bob@example.com or use key AKIA1234567890123456";
    console.log("Original text: " + sensitiveText);

    // Simulate paste event
    console.log("Simulating paste...");
    await page.evaluate((text) => {
      const target = document.querySelector('#target');
      target.focus();

      // We need to trigger the paste event on the target
      const event = new Event('paste', { bubbles: true, cancelable: true });
      event.clipboardData = {
        getData: (type) => {
          if (type === 'text/plain' || type === 'text') return text;
          return '';
        }
      };
      target.dispatchEvent(event);

      // If the extension's event listener is not triggered by a synthetic event,
      // we might need to manually call the sanitize logic if we were testing the logic,
      // but here we want to test the integration.
    }, sensitiveText);

    // Give extension time to react
    await new Promise(r => setTimeout(r, 1000));

    await page.screenshot({ path: 'screenshot.png' });

    const result = await page.$eval('#target', el => el.value);
    console.log("Pasted text:   " + result);

    if (result.includes('[REDACTED_EMAIL]') && result.includes('[REDACTED_AWS_KEY]')) {
        console.log("TEST PASSED: Sanitization successful.");
    } else {
        console.log("TEST FAILED: Sanitization failed. Content was: '" + result + "'");
    }
  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    await browser.close();
    server.kill();
    process.exit(0);
  }
})();
