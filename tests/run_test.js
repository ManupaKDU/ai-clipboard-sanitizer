const puppeteer = require('puppeteer');
const path = require('path');
const { execSync } = require('child_process');

(async () => {
  const extensionPath = path.resolve(__dirname, '../chrome');
  const testHtmlPath = 'file://' + path.resolve(__dirname, 'test.html');

  console.log('Launching browser with extension...');
  const browser = await puppeteer.launch({
    headless: "new",
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

  // Write to clipboard via xclip
  try {
      execSync(`printf "${sensitiveText}" | xclip -selection clipboard`);
  } catch (e) {
      console.error("xclip failed:", e);
  }

  // Focus textarea
  await page.focus('#target');

  // Paste
  console.log("Pasting...");
  await page.keyboard.down('Control');
  await page.keyboard.press('V');
  await page.keyboard.up('Control');

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
