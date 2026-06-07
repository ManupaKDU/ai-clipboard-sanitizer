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
    regex: /(AKIA|ASIA)[0-9A-Z]{16}/g,
    replacement: "[REDACTED_AWS_KEY]"
  },
  {
    name: "Generic API Key (Basic)",
    regex: /([A-Za-z0-9]{20,})/g, // Very broad, purely illustrative
    replacement: "[REDACTED_API_KEY]"
  }
];

function sanitizeText(text) {
  if (typeof text !== "string") return text;
  let sanitized = text;
  for (const rule of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(rule.regex, rule.replacement);
  }
  return sanitized;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sanitizeText, SENSITIVE_PATTERNS };
}
