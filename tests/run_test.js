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
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

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

  // Simulate paste event via page.evaluate
  console.log("Simulating paste event...");
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
  console.log("Pasted text:   '" + result + "'");

  if (result.includes('[REDACTED_EMAIL]') && result.includes('[REDACTED_AWS_KEY]')) {
      console.log("TEST PASSED: Sanitization successful.");
  } else {
      console.log("TEST FAILED: Sanitization failed. Content was: '" + result + "'");
      process.exit(1);
  }

  await browser.close();
  server.kill();
})();
