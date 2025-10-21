/**
 * String utility functions for consistent formatting across the application
 */

/**
 * Converts a name to proper capitalization (Title Case)
 * Examples:
 * - "spencer wendt" → "Spencer Wendt"
 * - "PERSON THREE" → "Person Three"
 * - "person one" → "Person One"
 * - "john-doe" → "John-doe"
 * - "mc'donald" → "Mc'donald"
 */
export const capitalizeName = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') return '';

  return name
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length === 0) return '';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

/**
 * Formats a member code for display (adds formatting if needed)
 */
export const formatMemberCode = (
  memberCode: string | null | undefined
): string => {
  if (!memberCode) return '';
  return memberCode.toString();
};

/**
 * Truncates text to a specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
