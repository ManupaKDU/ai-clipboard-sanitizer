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

  let hasError = false;

  try {
    const page = await browser.newPage();
    await page.goto(testUrl);

    // Manually inject scripts for testing to ensure they are loaded
    await page.addScriptTag({ path: path.resolve(__dirname, '../rules.js') });
    await page.addScriptTag({ path: path.resolve(__dirname, '../content.js') });

    // Focus textarea, set initial value, selection, and simulate paste
    console.log("Testing TEXTAREA insertion...");
    const textareaResult = await page.evaluate(() => {
      const activeElement = document.getElementById('target');
      activeElement.value = "Hello World!";
      activeElement.focus();
      // Select "World"
      activeElement.selectionStart = 6;
      activeElement.selectionEnd = 11;

      let inputEventFired = false;
      activeElement.addEventListener('input', () => {
        inputEventFired = true;
      });

      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text', 'bob@example.com');
      const event = new ClipboardEvent('paste', {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true
      });
      activeElement.dispatchEvent(event);

      return {
        value: activeElement.value,
        selectionStart: activeElement.selectionStart,
        selectionEnd: activeElement.selectionEnd,
        inputEventFired: inputEventFired
      };
    });

    const expectedTextareaValue = "Hello [REDACTED_EMAIL]!";
    // length of "[REDACTED_EMAIL]" is 16
    // start is 6 + 16 = 22
    const expectedSelection = 22;

    if (textareaResult.value === expectedTextareaValue &&
        textareaResult.selectionStart === expectedSelection &&
        textareaResult.selectionEnd === expectedSelection &&
        textareaResult.inputEventFired) {
        console.log("TEXTAREA TEST PASSED");
    } else {
        console.log("TEXTAREA TEST FAILED:", textareaResult);
        hasError = true;
    }

    // Now let's test an INPUT element
    console.log("Testing INPUT insertion...");
    const inputResult = await page.evaluate(() => {
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'inputTarget';
      document.body.appendChild(input);

      input.value = "Start  End";
      input.focus();
      // cursor in the middle
      input.selectionStart = 6;
      input.selectionEnd = 6;

      let inputEventFired = false;
      input.addEventListener('input', () => {
        inputEventFired = true;
      });

      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text', 'bob@example.com');
      const event = new ClipboardEvent('paste', {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true
      });
      input.dispatchEvent(event);

      return {
        value: input.value,
        selectionStart: input.selectionStart,
        selectionEnd: input.selectionEnd,
        inputEventFired: inputEventFired
      };
    });

    const expectedInputValue = "Start [REDACTED_EMAIL] End";
    const expectedInputSelection = 6 + 16; // 22

    if (inputResult.value === expectedInputValue &&
        inputResult.selectionStart === expectedInputSelection &&
        inputResult.selectionEnd === expectedInputSelection &&
        inputResult.inputEventFired) {
        console.log("INPUT TEST PASSED");
    } else {
        console.log("INPUT TEST FAILED:", inputResult);
        hasError = true;
    }

  } finally {
    await browser.close();
  }

  if (hasError) {
      process.exit(1);
  } else {
      process.exit(0);
  }
})();
