const path = require('path');

async function injectScripts(page) {
  // Manually inject scripts for testing to ensure they are loaded
  await page.addScriptTag({ path: path.resolve(__dirname, '../rules.js') });
  await page.addScriptTag({ path: path.resolve(__dirname, '../content.js') });
}

module.exports = {
  injectScripts
};
