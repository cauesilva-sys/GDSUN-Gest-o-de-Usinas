/**
 * Sanitizes contact text and returns a WhatsApp URL if a valid mobile/phone number is detected.
 */
export function getWhatsAppUrl(contact: string): string | null {
  if (!contact) return null;

  // Remove email parts if present or extract phone
  const cleanStr = contact.trim();

  // Ignore 0800 numbers for whatsapp direct (unless user wants wa, but 0800 are usually toll-free voice calls)
  if (cleanStr.startsWith('0800')) {
    return null;
  }

  // Extract all digits
  let digits = cleanStr.replace(/\D/g, '');

  // If empty, no phone number
  if (!digits) return null;

  // If starts with 055 or 55, ensure proper format
  if (digits.length === 12 || digits.length === 13) {
    if (digits.startsWith('55')) {
      return `https://wa.me/${digits}`;
    }
  }

  // Standard Brazilian phone with DDD (10 digits for landline, 11 for mobile)
  if (digits.length === 10 || digits.length === 11) {
    return `https://wa.me/55${digits}`;
  }

  // If DDD is included without country code but has 11 digits (e.g., 9188683164)
  if (digits.length === 11 && digits.startsWith('9')) {
    return `https://wa.me/55${digits}`;
  }

  if (digits.length >= 8) {
    return `https://wa.me/${digits.startsWith('55') ? digits : '55' + digits}`;
  }

  return null;
}

/**
 * Extracts multiple contacts from a string (e.g. "email / 71 9 8352-0973" or "0800 ... / (91) 8868-3164 WhatsApp")
 */
export interface ExtractedContact {
  type: 'whatsapp' | 'phone' | 'email' | 'text';
  label: string;
  value: string;
  url?: string;
}

export function formatPhoneDisplay(rawStr: string): string {
  if (!rawStr) return '';

  const cleanStr = rawStr.trim();
  const digits = cleanStr.replace(/\D/g, '');

  if (!digits) return cleanStr;

  // 0800 toll-free number
  if (cleanStr.includes('0800') || (digits.includes('800') && (cleanStr.includes('800')))) {
    const idx = digits.indexOf('800');
    const part = digits.slice(idx);
    if (part.length >= 10) {
      return `0800 ${part.slice(3, 6)} ${part.slice(6, 10)}`;
    }
  }

  // Strip 55 country code if 12+ digits
  let phoneDigits = digits;
  if (phoneDigits.startsWith('55') && phoneDigits.length >= 12) {
    phoneDigits = phoneDigits.slice(2);
  }

  // 11 digits (DDD + 9 digits mobile) -> +55 (XX) 9XXXX-XXXX
  if (phoneDigits.length === 11) {
    return `+55 (${phoneDigits.slice(0, 2)}) ${phoneDigits.slice(2, 7)}-${phoneDigits.slice(7)}`;
  }

  // 10 digits (DDD + 8 digits landline) -> +55 (XX) XXXX-XXXX
  if (phoneDigits.length === 10) {
    return `+55 (${phoneDigits.slice(0, 2)}) ${phoneDigits.slice(2, 6)}-${phoneDigits.slice(6)}`;
  }

  if (digits.startsWith('55')) {
    return `+${digits}`;
  }

  return cleanStr;
}

export function parseContacts(raw: string): ExtractedContact[] {
  if (!raw) return [];

  const rawTrimmed = raw.trim();
  const rawLower = rawTrimmed.toLowerCase();

  // If the raw value is or contains a direct wa.me link or http URL
  if (rawLower.includes('wa.me') || rawLower.startsWith('http')) {
    const cleanUrl = rawTrimmed.startsWith('http') ? rawTrimmed : `https://${rawTrimmed}`;
    const displayLabel = formatPhoneDisplay(rawTrimmed);

    return [{
      type: 'whatsapp',
      label: displayLabel || rawTrimmed,
      value: rawTrimmed,
      url: cleanUrl
    }];
  }

  // Split multi-contact entries by newline or semicolon
  const parts = rawTrimmed.split(/[\n;]/).map(p => p.trim()).filter(Boolean);

  const results: ExtractedContact[] = [];

  for (const item of parts) {
    // If item contains a slash, only split if it's not a URL and contains multiple distinct numbers
    const subParts = item.includes('://') ? [item] : item.split('/').map(p => p.trim()).filter(Boolean);

    for (const part of subParts) {
      if (part.includes('@')) {
        results.push({
          type: 'email',
          label: part,
          value: part,
          url: `mailto:${part.trim()}`
        });
        continue;
      }

      const waUrl = getWhatsAppUrl(part);
      const displayLabel = formatPhoneDisplay(part);

      if (waUrl) {
        results.push({
          type: 'whatsapp',
          label: displayLabel || part,
          value: part,
          url: waUrl
        });
      } else if (part.replace(/\D/g, '').length >= 8) {
        const cleanDigits = part.replace(/\D/g, '');
        results.push({
          type: 'phone',
          label: displayLabel || part,
          value: part,
          url: `tel:${cleanDigits}`
        });
      } else {
        results.push({
          type: 'text',
          label: part,
          value: part
        });
      }
    }
  }

  return results;
}
