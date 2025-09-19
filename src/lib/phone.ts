export function toE164US(input: string): string | null {
  // Strip all non-digits
  const digits = input.replace(/\D/g, "");
  
  // Handle different input formats
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  
  // Already in E.164 format
  if (digits.length === 11 && digits.startsWith("1") && input.startsWith("+")) {
    return `+${digits}`;
  }
  
  return null;
}

export function isE164US(input: string): boolean {
  return /^\+1\d{10}$/.test(input);
}

export function formatPhoneDisplay(e164: string): string {
  const m = e164.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (!m) return e164;
  return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
}












