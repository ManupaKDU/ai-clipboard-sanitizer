const puppeteer = require('puppeteer');
const path = require('path');
const { spawn } = require('child_process');

(async () => {
  // Start a local server
  const server = spawn('python3', ['-m', 'http.server', '8000'], { cwd: __dirname });

  await new Promise(r => setTimeout(r, 2000));

  const extensionPath = path.resolve(__dirname, '../chrome');
  const testHtmlPath = 'http://localhost:8000/test.html';

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

  // Manually inject scripts for testing if extension loading fails in headless mode
  await page.addScriptTag({ path: path.resolve(__dirname, '../rules.js') });
  await page.addScriptTag({ path: path.resolve(__dirname, '../content.js') });

  console.log("Measuring performance...");

  const N = 1000;

  const totalTime = await page.evaluate((N) => {
    const activeElement = document.getElementById('target');
    activeElement.value = "A".repeat(1000000); // 1 million chars
    const start = 500000;
    const end = 500000;
    const sanitizedText = "[REDACTED]";

    let startTime = performance.now();
    for (let i = 0; i < N; i++) {
        activeElement.selectionStart = start;
        activeElement.selectionEnd = end;

        // Emulate the paste logic manually to isolate performance
        const startPos = activeElement.selectionStart;
        const endPos = activeElement.selectionEnd;
        activeElement.setRangeText(sanitizedText, startPos, endPos, 'end');
    }
    let endTime = performance.now();
    return endTime - startTime;
  }, N);

  console.log(`Baseline performance: ${totalTime.toFixed(2)} ms for ${N} replacements in a 1MB string.`);

  await browser.close();
  server.kill();
})();