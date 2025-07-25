const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 8080;

// Disable X-Powered-By header for security
app.disable('x-powered-by');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/search", (req, res) => {
  const searchTerm = req.body.searchTerm;

  // Validate input for XSS attacks
  if (!isValidSearchTerm(searchTerm)) {
    // If XSS attack detected, redirect back to home page
    return res.redirect("/");
  }

  // If valid, show welcome page with sanitized search term
  const sanitizedSearchTerm = htmlEscape(searchTerm);
  res.send(`
    <html lang="en">
    <head>
      <title>Search Results</title>
    </head>
    <body>
      <h1>Welcome!</h1>
      <p>Your search term is: <strong>${sanitizedSearchTerm}</strong></p>
      <form action="/" method="get">
        <button type="submit">Return to Home</button>
      </form>
    </body>
    </html>
  `);
});

/**
 * Validates search term against XSS attacks based on OWASP guidelines
 * Implements OWASP Top 10 Proactive Control C5: Validate All Inputs
 * @param {string} input - The search term to validate
 * @returns {boolean} - True if input is safe, false if potentially malicious
 */
function isValidSearchTerm(input) {
  if (!input || typeof input !== 'string') {
    return false;
  }

  // Check for common XSS patterns
  const xssPatterns = [
    // Script tags
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    // Event handlers
    /on\w+\s*=/gi,
    // JavaScript protocol
    /javascript:/gi,
    // Data protocol with script
    /data:.*script/gi,
    // HTML entities that could be malicious
    /&#x?[0-9a-f]+;/gi,
    // Style expressions
    /expression\s*\(/gi,
    // Import statements
    /@import/gi,
    // Eval function
    /eval\s*\(/gi,
    // Document.cookie
    /document\.cookie/gi,
    // Window object manipulation
    /window\./gi,
    // Alert, confirm, prompt functions
    /(alert|confirm|prompt)\s*\(/gi,
    // HTML tags that could be dangerous
    /<(iframe|object|embed|form|img|svg|math|details|template)\b/gi,
    // CSS expressions
    /expression\s*\(/gi,
    // Vbscript protocol
    /vbscript:/gi,
    // Data URLs with HTML
    /data:text\/html/gi
  ];

  // Check against XSS patterns
  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      console.log(`XSS attack detected: ${input}`);
      return false;
    }
  }

  // Additional character validation
  // Reject input with dangerous control characters and HTML brackets
  const suspiciousChars = /<|>|[\x00-\x08]|\x0b|\x0c|[\x0e-\x1f]|[\x7f-\x9f]/;
  if (suspiciousChars.test(input)) {
    console.log(`Suspicious characters detected: ${input}`);
    return false;
  }

  // Length validation (prevent DoS)
  if (input.length > 1000) {
    console.log(`Input too long: ${input.length} characters`);
    return false;
  }

  // Whitelist approach - only allow alphanumeric, spaces, and safe punctuation
  const allowedPattern = /^[a-zA-Z0-9\s\-_.,:;!?()[\]{}]+$/;
  if (!allowedPattern.test(input)) {
    console.log(`Invalid characters in input: ${input}`);
    return false;
  }

  return true;
}

/**
 * HTML escapes a string to prevent XSS
 * Additional layer of protection even after validation
 * @param {string} str - String to escape
 * @returns {string} - HTML escaped string
 */
function htmlEscape(str) {
  if (!str) return '';
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`App running on http://localhost:${PORT}`);
});
