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

  // Manually inject scripts since file:// is no longer matched
  const fsPromises = require('fs').promises;
  const [rulesCode, contentCode] = await Promise.all([
    fsPromises.readFile(path.resolve(__dirname, '../rules.js'), 'utf8'),
    fsPromises.readFile(path.resolve(__dirname, '../content.js'), 'utf8')
  ]);
  await page.evaluate((rules, content) => {
    const rulesScript = document.createElement('script');
    rulesScript.textContent = rules;
    document.head.appendChild(rulesScript);

    const contentScript = document.createElement('script');
    contentScript.textContent = content;
    document.head.appendChild(contentScript);
  }, rulesCode, contentCode);

  // Sensitive string
  const sensitiveText = "Contact me at bob@example.com or use key AKIA1234567890123456";
  console.log("Original text: " + sensitiveText);

  // Simulate paste event
  console.log("Pasting via simulated event...");
  await page.evaluate((text) => {
    const target = document.getElementById('target');
    target.focus();

    // Create custom DataTransfer object
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', text);

    // Create and dispatch paste event
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true
    });

    // If event is not canceled (which the extension shouldn't do since it only mutates event or modifies target),
    // and we simulate the actual paste behavior if needed, but the extension intercepts it anyway
    target.dispatchEvent(pasteEvent);

    // Since the extension intercepts paste event and sets target.value directly, this should be enough
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
