/**
 * Site-wide name handling utilities
 * Ensures consistent name storage and retrieval across the application
 */

/**
 * Converts a name to proper case (Title Case)
 * Examples:
 *   "john doe" -> "John Doe"
 *   "MARY SMITH" -> "Mary Smith"
 *   "spencer wendt" -> "Spencer Wendt"
 */
export function toProperCase(name: string): string {
  if (!name) return '';
  
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length === 0) return '';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Normalizes a name for database storage
 * Returns both display name (proper case) and search name (lowercase)
 */
export function normalizeName(name: string): { name: string; nameLower: string } {
  const properName = toProperCase(name);
  return {
    name: properName,
    nameLower: properName.toLowerCase()
  };
}

/**
 * Validates a full name (first + last)
 * Returns error message if invalid, null if valid
 */
export function validateFullName(name: string): string | null {
  const trimmed = name.trim();
  
  if (!trimmed) {
    return 'Name is required';
  }
  
  const parts = trimmed.split(' ').filter(p => p.length > 0);
  
  if (parts.length < 2) {
    return 'Please enter both first and last name';
  }
  
  if (parts.some(p => p.length < 2)) {
    return 'Each name must be at least 2 characters';
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes';
  }
  
  return null;
}

/**
 * Splits a full name into first and last name
 */
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(' ').filter(p => p.length > 0);
  
  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }
  
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  
  // First word is firstName, rest is lastName
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  
  return { firstName, lastName };
}

















