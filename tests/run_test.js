const puppeteer = require('puppeteer');
const path = require('path');
const { execSync } = require('child_process');

(async () => {
  const extensionPath = path.resolve(__dirname, '../chrome');
  const testHtmlPath = 'file://' + path.resolve(__dirname, 'test.html');

  console.log('Launching browser with extension...');
  let browser;
  let success = false;
  try {
    browser = await puppeteer.launch({
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
    const fs = require('fs');
    const rulesCode = fs.readFileSync(path.resolve(__dirname, '../rules.js'), 'utf8');
    const contentCode = fs.readFileSync(path.resolve(__dirname, '../content.js'), 'utf8');
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

    // Test 1: textarea
    console.log("--- Testing textarea ---");
    console.log("Pasting via simulated event into textarea...");
    await page.evaluate((text) => {
      const target = document.getElementById('target');
      target.focus();

      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', text);

      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true
      });

      target.dispatchEvent(pasteEvent);
    }, sensitiveText);

    await new Promise(r => setTimeout(r, 1000));
    const resultTextarea = await page.$eval('#target', el => el.value);
    console.log("Pasted text (textarea):   " + resultTextarea);

    if (!resultTextarea.includes('[REDACTED_EMAIL]') || !resultTextarea.includes('[REDACTED_AWS_KEY]')) {
        throw new Error("TEST FAILED (textarea): Sanitization failed. Content was: " + resultTextarea);
    }
    console.log("TEST PASSED (textarea): Sanitization successful.");

    // Test 2: contenteditable div
    console.log("--- Testing contenteditable div ---");
    console.log("Pasting via simulated event into contenteditable div...");
    await page.evaluate((text) => {
      const target = document.getElementById('editable-target');
      target.focus();

      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', text);

      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true
      });

      target.dispatchEvent(pasteEvent);
    }, sensitiveText);

    await new Promise(r => setTimeout(r, 1000));
    const resultEditable = await page.$eval('#editable-target', el => el.innerText);
    console.log("Pasted text (contenteditable):   " + resultEditable);

    if (!resultEditable.includes('[REDACTED_EMAIL]') || !resultEditable.includes('[REDACTED_AWS_KEY]')) {
        throw new Error("TEST FAILED (contenteditable): Sanitization failed. Content was: " + resultEditable);
    }
    console.log("TEST PASSED (contenteditable): Sanitization successful.");

    success = true;
  } catch (error) {
    console.error(error);
  } finally {
    if (browser) {
      await browser.close();
    }
    if (!success) {
      process.exit(1);
    }
  }
})();
