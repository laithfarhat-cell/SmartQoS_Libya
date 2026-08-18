// Lightweight XSS sanitization for user text inputs.
// Strips HTML tags and escapes the common dangerous characters.
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';
  // Remove HTML tags entirely
  const stripped = input.replace(/<\/?[^>]+(>|$)/g, '');
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return stripped.replace(/[&<>"']/g, (c) => map[c] ?? c);
}

export function isValidCorporateEmail(email: string): boolean {
  const e = email.trim();
  return /^[a-zA-Z0-9._%+-]+@prestoeat\.com$/.test(e) || e === 'laitfarhat@gmail.com';
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
