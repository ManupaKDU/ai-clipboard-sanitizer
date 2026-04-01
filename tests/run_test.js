const puppeteer = require('puppeteer');
const path = require('path');
const { execSync } = require('child_process');

(async () => {
  const extensionPath = path.resolve(__dirname, '../chrome');
  const testHtmlPath = 'file://' + path.resolve(__dirname, 'test.html');

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
  await page.goto(testHtmlPath);

  // Sensitive string
  const sensitiveText = "Contact me at bob@example.com or use key AKIA1234567890123456";
  console.log("Original text: " + sensitiveText);

  // Focus textarea
  await page.focus('#target');

  // Paste simulation using ClipboardEvent
  console.log("Simulating paste via ClipboardEvent...");
  await page.evaluate((text) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', text);
    const event = new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true
    });
    document.querySelector('#target').dispatchEvent(event);
  }, sensitiveText);

  // Give extension time to react
  await new Promise(r => setTimeout(r, 1000));

  const result = await page.$eval('#target', el => el.value);
  console.log("Pasted text:   " + result);

  if (result.includes('[REDACTED_EMAIL]') && result.includes('[REDACTED_AWS_KEY]')) {
      console.log("TEST PASSED: Sanitization successful.");
  } else {
      console.log("TEST FAILED: Sanitization failed. Content was: " + result);
  }

  await browser.close();
})();
