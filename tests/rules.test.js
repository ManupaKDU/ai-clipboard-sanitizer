const assert = require('assert');
const { sanitizeText } = require('../src/rules');

function testSanitizeText() {
  console.log('Running unit tests for sanitizeText...');

  // 1. Email Redaction
  assert.strictEqual(
    sanitizeText('Contact me at bob@example.com'),
    'Contact me at [REDACTED_EMAIL]',
    'Should redact email addresses'
  );

  // 2. IPv4 Address Redaction
  assert.strictEqual(
    sanitizeText('My IP is 192.168.1.1'),
    'My IP is [REDACTED_IP]',
    'Should redact IPv4 addresses'
  );

  // 3. AWS Access Key Redaction
  assert.strictEqual(
    sanitizeText('Key: AKIA1234567890123456'),
    'Key: [REDACTED_AWS_KEY]',
    'Should redact AWS Access Keys'
  );

  // 4. Generic API Key Redaction
  assert.strictEqual(
    sanitizeText('API Key: abcdefghijklmnopqrstuvwxyz123'),
    'API Key: [REDACTED_API_KEY]',
    'Should redact generic API keys (20+ chars)'
  );

  // 5. Mixed sensitive data
  assert.strictEqual(
    sanitizeText('Email: alice@work.com, IP: 10.0.0.1, Key: ASIA9876543210987654'),
    'Email: [REDACTED_EMAIL], IP: [REDACTED_IP], Key: [REDACTED_AWS_KEY]',
    'Should redact multiple types of sensitive data in one string'
  );

  // 6. Multiple occurrences
  assert.strictEqual(
    sanitizeText('bob@example.com and alice@example.com'),
    '[REDACTED_EMAIL] and [REDACTED_EMAIL]',
    'Should redact multiple occurrences of the same pattern'
  );

  // 7. No sensitive data
  assert.strictEqual(
    sanitizeText('Hello world!'),
    'Hello world!',
    'Should return original text if no sensitive data is found'
  );

  // 8. Empty string
  assert.strictEqual(
    sanitizeText(''),
    '',
    'Should handle empty strings'
  );

  console.log('All unit tests passed!');
}

try {
  testSanitizeText();
} catch (error) {
  console.error('Unit tests failed:');
  console.error(error.message);
  process.exit(1);
}
