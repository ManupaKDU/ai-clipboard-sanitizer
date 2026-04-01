const puppeteer = require('puppeteer');
const path = require('path');

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

  // Manually inject scripts for testing to ensure they are loaded
  await page.addScriptTag({ path: path.resolve(__dirname, '../rules.js') });
  await page.addScriptTag({ path: path.resolve(__dirname, '../content.js') });

  // Focus textarea
  await page.focus('#target');

  // Simulate paste event with empty clipboard data
  console.log("Simulating empty paste event...");
  await page.evaluate(() => {
    const activeElement = document.getElementById('target');
    activeElement.focus();
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text', ''); // Empty clipboard
    const event = new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true
    });
    activeElement.dispatchEvent(event);
  });

  // Give extension time to react
  await new Promise(r => setTimeout(r, 1000));

  const result = await page.$eval('#target', el => el.value);
  console.log("Resulting text: '" + result + "'");

  if (result === '') {
      console.log("TEST PASSED: Empty clipboard handled correctly.");
  } else {
      console.log("TEST FAILED: Target element should be empty, but was: '" + result + "'");
      process.exit(1);
  }

  await browser.close();
})();
