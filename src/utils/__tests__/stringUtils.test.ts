/**
 * Tests for string utility functions
 */

import { capitalizeName } from '../stringUtils';

describe('capitalizeName', () => {
  test('should capitalize simple names correctly', () => {
    expect(capitalizeName('spencer wendt')).toBe('Spencer Wendt');
    expect(capitalizeName('person one')).toBe('Person One');
    expect(capitalizeName('PERSON THREE')).toBe('Person Three');
  });

  test('should handle edge cases', () => {
    expect(capitalizeName('')).toBe('');
    expect(capitalizeName(null)).toBe('');
    expect(capitalizeName(undefined)).toBe('');
    expect(capitalizeName('a')).toBe('A');
    expect(capitalizeName('a b c')).toBe('A B C');
  });

  test('should handle special characters', () => {
    expect(capitalizeName('john-doe')).toBe('John-doe');
    expect(capitalizeName("mc'donald")).toBe("Mc'donald");
    expect(capitalizeName("o'connor")).toBe("O'connor");
  });

  test('should handle multiple spaces', () => {
    expect(capitalizeName('  spencer  wendt  ')).toBe('  Spencer  Wendt  ');
  });
});
