const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const rulesPath = path.resolve(__dirname, '../rules.js');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Inject the rules directly into the page to test the logic
    await page.evaluate(rulesContent);

    // Sensitive string
    const sensitiveText = "Contact me at bob@example.com or use key AKIA1234567890123456";
    console.log("Original text: " + sensitiveText);

    const result = await page.evaluate((text) => {
      return sanitizeText(text);
    }, sensitiveText);

    console.log("Sanitized text: " + result);

    // Note: The Generic API Key rule might catch AKIA... if it's evaluated before AWS Access Key rule
    // but the rules are: Email, IPv4, Generic API Key, AWS Access Key.
    // "AKIA1234567890123456" is 20 characters, so it matches Generic API Key (Basic) which is [A-Za-z0-9]{20,}

    const emailRedacted = result.includes('[REDACTED_EMAIL]');
    const keyRedacted = result.includes('[REDACTED_AWS_KEY]') || result.includes('[REDACTED_API_KEY]');

    if (emailRedacted && keyRedacted) {
        console.log("LOGIC TEST PASSED: Sanitization logic is correct.");
    } else {
        console.log("LOGIC TEST FAILED: Sanitization logic failed.");
        process.exit(1);
    }
  } catch (err) {
    console.error("Error during test:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
