/**
 * Number encoding utilities
 * Compatible with BlueMarble/SkirkMarble encoding system
 */

/**
 * Encoding base characters (91 characters total)
 * Used for encoding user IDs, template IDs, etc.
 */
export const ENCODING_BASE = '!#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~';

/**
 * Convert number to encoded string using custom base
 * @param {number} number - Number to encode
 * @param {string} encoding - Encoding base characters
 * @returns {string} Encoded string
 */
export function numberToEncoded(number, encoding = ENCODING_BASE) {
  if (number === 0) return encoding[0]; // Quick return for 0

  let result = '';
  const base = encoding.length;

  // Base conversion algorithm
  while (number > 0) {
    result = encoding[number % base] + result;
    number = Math.floor(number / base);
  }

  return result;
}

/**
 * Convert encoded string back to number
 * @param {string} encoded - Encoded string
 * @param {string} encoding - Encoding base characters
 * @returns {number} Decoded number
 */
export function encodedToNumber(encoded, encoding = ENCODING_BASE) {
  let result = 0;
  const base = encoding.length;

  for (let i = 0; i < encoded.length; i++) {
    const char = encoded[i];
    const value = encoding.indexOf(char);
    if (value === -1) {
      throw new Error(`Invalid character in encoded string: ${char}`);
    }
    result = result * base + value;
  }

  return result;
}
