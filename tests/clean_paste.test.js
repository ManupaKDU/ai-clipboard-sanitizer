const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const extensionPath = path.resolve(__dirname, '../chrome');
  const testUrl = 'file://' + path.resolve(__dirname, 'test.html');

  console.log('Launching browser with extension...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.goto(testUrl);

    // Manually inject scripts for testing to ensure they are loaded
    await page.addScriptTag({ path: path.resolve(__dirname, '../rules.js') });
    await page.addScriptTag({ path: path.resolve(__dirname, '../content.js') });

    // Focus textarea
    await page.focus('#target');

    // Simulate paste event with clean clipboard data
    console.log("Simulating clean paste event...");
    const result = await page.evaluate(() => {
      const activeElement = document.getElementById('target');
      activeElement.focus();
      const dataTransfer = new DataTransfer();
      const text = 'Just some completely normal text.';
      dataTransfer.setData('text', text);
      const event = new ClipboardEvent('paste', {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true
      });

      // dispatchEvent returns false if preventDefault was called
      const dispatchResult = activeElement.dispatchEvent(event);

      return {
        defaultPrevented: event.defaultPrevented,
        dispatchResult: dispatchResult
      };
    });

    console.log("Result:", result);

    if (result.defaultPrevented === false && result.dispatchResult === true) {
        console.log("TEST PASSED: Clean paste handled correctly (preventDefault NOT called).");
    } else {
        console.log("TEST FAILED: preventDefault was called.");
        process.exit(1);
    }
  } finally {
    await browser.close();
  }
})();
