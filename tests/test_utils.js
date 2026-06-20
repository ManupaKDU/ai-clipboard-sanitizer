const puppeteer = require('puppeteer');
const path = require('path');

/**
 * Launches a Puppeteer browser instance with standardized configuration.
 *
 * @param {Object} options - Configuration options.
 * @param {boolean} [options.loadExtension=true] - Whether to load the Chrome extension.
 * @returns {Promise<puppeteer.Browser>} The launched browser instance.
 */
async function launchBrowser({ loadExtension = true } = {}) {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ];

  if (loadExtension) {
    const extensionPath = path.resolve(__dirname, '../chrome');
    args.unshift(
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    );
  }

  return await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
    args: args
  });
}

module.exports = { launchBrowser };
