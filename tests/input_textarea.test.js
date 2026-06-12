const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Create DOM with TEXTAREA and INPUT
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <body>
          <textarea id="my-textarea">Start End</textarea>
          <input type="text" id="my-input" value="Prefix Suffix" />
      </body>
      </html>
    `);

    // Manually inject scripts for testing to ensure they are loaded
    await page.addScriptTag({ path: path.resolve(__dirname, '../rules.js') });
    await page.addScriptTag({ path: path.resolve(__dirname, '../content.js') });

    const sensitiveText = "bob@example.com";

    console.log("Testing TEXTAREA insertion...");
    // Focus textarea and set selection to be between "Start " and "End" (index 6)
    await page.evaluate(() => {
      const ta = document.getElementById('my-textarea');
      ta.focus();
      ta.setSelectionRange(6, 6);
    });

    await page.evaluate((text) => {
      const activeElement = document.activeElement;
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text', text);
      const event = new ClipboardEvent('paste', {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true
      });
      activeElement.dispatchEvent(event);
    }, sensitiveText);

    // Give some time for the event listener to process
    await new Promise(r => setTimeout(r, 500));

    const textareaResult = await page.$eval('#my-textarea', el => el.value);
    console.log("TEXTAREA Result: '" + textareaResult + "'");
    if (textareaResult !== "Start [REDACTED_EMAIL]End") {
      console.error("TEXTAREA insertion test failed!");
      throw new Error('Test failed!');
    }

    const textareaSelection = await page.evaluate(() => {
      const ta = document.getElementById('my-textarea');
      return { start: ta.selectionStart, end: ta.selectionEnd };
    });
    // Expected selection: 6 (Start ) + 16 ([REDACTED_EMAIL]) = 22
    if (textareaSelection.start !== 22 || textareaSelection.end !== 22) {
      console.error("TEXTAREA selection test failed!", textareaSelection);
      throw new Error('Test failed!');
    }

    console.log("Testing INPUT insertion...");
    // Focus input and set selection to be between "Prefix " and "Suffix" (index 7)
    await page.evaluate(() => {
      const input = document.getElementById('my-input');
      input.focus();
      input.setSelectionRange(7, 7);
    });

    await page.evaluate((text) => {
      const activeElement = document.activeElement;
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text', text);
      const event = new ClipboardEvent('paste', {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true
      });
      activeElement.dispatchEvent(event);
    }, sensitiveText);

    await new Promise(r => setTimeout(r, 500));

    const inputResult = await page.$eval('#my-input', el => el.value);
    console.log("INPUT Result: '" + inputResult + "'");
    if (inputResult !== "Prefix [REDACTED_EMAIL]Suffix") {
      console.error("INPUT insertion test failed!");
      throw new Error('Test failed!');
    }

    const inputSelection = await page.evaluate(() => {
      const input = document.getElementById('my-input');
      return { start: input.selectionStart, end: input.selectionEnd };
    });
    // Expected selection: 7 (Prefix ) + 16 ([REDACTED_EMAIL]) = 23
    if (inputSelection.start !== 23 || inputSelection.end !== 23) {
      console.error("INPUT selection test failed!", inputSelection);
      throw new Error('Test failed!');
    }

    console.log("Testing INPUT selection replacement...");
    // Replace "Suffix" with redacted email
    await page.evaluate(() => {
      const input = document.getElementById('my-input');
      input.focus();
      input.setSelectionRange(7, input.value.length);
    });

    await page.evaluate((text) => {
      const activeElement = document.activeElement;
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text', text);
      const event = new ClipboardEvent('paste', {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true
      });
      activeElement.dispatchEvent(event);
    }, sensitiveText);

    await new Promise(r => setTimeout(r, 500));

    const inputReplaceResult = await page.$eval('#my-input', el => el.value);
    console.log("INPUT Replace Result: '" + inputReplaceResult + "'");
    if (inputReplaceResult !== "Prefix [REDACTED_EMAIL]") {
      console.error("INPUT replace test failed!");
      throw new Error('Test failed!');
    }

    const inputReplaceSelection = await page.evaluate(() => {
      const input = document.getElementById('my-input');
      return { start: input.selectionStart, end: input.selectionEnd };
    });
    // Expected selection: 7 (Prefix ) + 16 ([REDACTED_EMAIL]) = 23
    if (inputReplaceSelection.start !== 23 || inputReplaceSelection.end !== 23) {
      console.error("INPUT replace selection test failed!", inputReplaceSelection);
      throw new Error('Test failed!');
    }

    console.log("ALL TESTS PASSED!");
  } catch (err) {
    console.error("Error during test:", err);
    throw new Error('Test failed!');
  } finally {
    await browser.close();
  }
})();
