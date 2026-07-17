// Regex patterns for sensitive data
const SENSITIVE_PATTERNS = [
  {
    name: "Email Address",
    regex: /\b[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9.-]{1,253}\.[a-zA-Z]{2,24}\b/g,
    replacement: "[REDACTED_EMAIL]"
  },
  {
    name: "IPv4 Address",
    regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    replacement: "[REDACTED_IP]"
  },
  {
    name: "AWS Access Key",
    regex: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g,
    replacement: "[REDACTED_AWS_KEY]"
  },
  {
    name: "Generic API Key (Basic)",
    regex: /([A-Za-z0-9]{20,})/g, // Very broad, purely illustrative
    replacement: "[REDACTED_API_KEY]"
  }
];

// Fast-path combined check to avoid loop overhead on completely clean strings
// Construct with 'i' flag if any underlying pattern uses it, to ensure we don't skip valid matches.
const _combinedFlags = SENSITIVE_PATTERNS.some(rule => rule.regex.flags.includes('i')) ? 'i' : '';
const COMBINED_TEST_REGEX = new RegExp(
  SENSITIVE_PATTERNS.map(rule => rule.regex.source).join('|'),
  _combinedFlags
);

function sanitizeText(text) {
  if (typeof text !== 'string') return text;
  if (!COMBINED_TEST_REGEX.test(text)) return text;

  let sanitized = text;
  for (let i = 0; i < SENSITIVE_PATTERNS.length; i++) {
    sanitized = sanitized.replace(SENSITIVE_PATTERNS[i].regex, SENSITIVE_PATTERNS[i].replacement);
  }
  return sanitized;
}

if (typeof module !== 'undefined' && typeof module.exports === 'object' && !module.nodeType) {
  module.exports = { sanitizeText, SENSITIVE_PATTERNS };
}
