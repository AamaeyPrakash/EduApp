// A short hash of some text (32-bit FNV-1a in base 36): question ids are built from
// it, and prepared maths sizes are looked up by it.
export function hashText(text) {
  /* eslint-disable no-bitwise -- a hash is bit arithmetic */
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  /* eslint-enable no-bitwise */
  return hash.toString(36);
}
