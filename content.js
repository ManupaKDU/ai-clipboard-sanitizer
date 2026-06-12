// Listen for paste events
document.addEventListener('paste', (event) => {
  // 1. Get clipboard data
  const clipboardData = (event.clipboardData || window.clipboardData);
  const pastedText = clipboardData.getData('text');

  if (!pastedText) return;

  // 2. Sanitize
  const sanitizedText = sanitizeText(pastedText);

  // 3. If sensitive data was found & changed, insert the new text manually
  if (pastedText !== sanitizedText) {
    event.preventDefault(); // Stop the original paste

    // 4. Insert sanitized text into the active element
    // This part is tricky because different sites use different input methods (contenteditable vs textarea).
    // The following is a generic attempt:
    const activeElement = document.activeElement;
    
    if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      activeElement.setRangeText(sanitizedText, start, end, 'end');
    } else if (activeElement.isContentEditable) {
      document.execCommand('insertText', false, sanitizedText);
    }
  }
});
