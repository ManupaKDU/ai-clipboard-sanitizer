const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

async function runBenchmark() {
  const iterations = 1000;

  // Warmup
  for (let i = 0; i < 100; i++) {
    fs.readFileSync(path.resolve(__dirname, '../rules.js'), 'utf8');
    fs.readFileSync(path.resolve(__dirname, '../content.js'), 'utf8');
  }

  const startSync = performance.now();
  for (let i = 0; i < iterations; i++) {
    const rulesCode = fs.readFileSync(path.resolve(__dirname, '../rules.js'), 'utf8');
    const contentCode = fs.readFileSync(path.resolve(__dirname, '../content.js'), 'utf8');
  }
  const endSync = performance.now();

  const startAsync = performance.now();
  for (let i = 0; i < iterations; i++) {
    const [rulesCode, contentCode] = await Promise.all([
      fsPromises.readFile(path.resolve(__dirname, '../rules.js'), 'utf8'),
      fsPromises.readFile(path.resolve(__dirname, '../content.js'), 'utf8')
    ]);
  }
  const endAsync = performance.now();

  console.log(`Sync reading time: ${(endSync - startSync).toFixed(2)} ms`);
  console.log(`Async Promise.all reading time: ${(endAsync - startAsync).toFixed(2)} ms`);
}

runBenchmark();
