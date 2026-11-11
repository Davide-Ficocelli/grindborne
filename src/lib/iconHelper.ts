/**
 * Converts the `icon` field from the database into a valid `data:` URL.
 *
 * WHY WE NEED THIS:
 * The backend stores base64 strings in a `bytea` column. When node-postgres
 * reads this back, it wraps the bytes in a Buffer. If we sent base64 from the
 * frontend, the Buffer contains ASCII bytes of the base64 string
 * (e.g. "iVBORw0KGgo..."). However, if the backend or some migration script
 * stored raw binary data directly, the Buffer would contain actual image bytes.
 * This helper detects the format and returns the correct data URL.
 *
 * BROWSER-ONLY:
 * This file runs in the browser bundle. It must NOT import or reference
 * `Buffer` (that's a Node.js global). The two helpers below reimplement
 * the minimal byte<->string conversions we need using only Web APIs
 * (`TextDecoder`, `btoa`).
 */

/**
 * Converts a byte array to its ASCII/Latin1 string representation.
 *
 * Use case: a buffer whose bytes are ASCII characters of a base64 string
 * (e.g. "iVBORw0KGgo...") gets decoded back into that string, so it can be
 * embedded in a data URL.
 *
 * `TextDecoder("ascii")` handles this without a manual loop. Since base64
 * only uses the 64 characters `A-Z a-z 0-9 + / =` plus optional whitespace,
 * every relevant code point is < 128 and maps 1:1 to the original byte.
 */
function bytesToAsciiString(bytes: Uint8Array): string {
  return new TextDecoder("ascii").decode(bytes);
}

/**
 * Converts a byte array to a base64 string.
 *
 * Use case: a buffer whose bytes are ACTUAL IMAGE DATA (e.g. the PNG magic
 * bytes `0x89 0x50 0x4E 0x47 ...`). We must produce the base64 encoding of
 * those exact bytes.
 *
 * Why the manual loop: `btoa` only accepts a "binary string" (each char
 * must be ≤ 0xFF). `String.fromCharCode(...bytes)` would be equivalent for
 * small inputs, but it blows the call stack on large arrays because spread
 * passes every element as a function argument. A `for` loop building the
 * string incrementally is O(n) and safe for any realistic icon size.
 *
 * Note: if you ever need to handle megabyte-scale payloads, switch to
 * `FileReader.readAsDataURL` (async) which streams without building the
 * intermediate binary string in memory. Not needed here — icons are small.
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binaryString = "";
  for (let i = 0; i < bytes.length; i++) {
    // `bytes[i]` is guaranteed in [0, 255] for a Uint8Array. fromCharCode
    // maps it to the corresponding Latin1 code point, which is what btoa
    // expects.
    binaryString += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binaryString);
}

export function getIconUrl(icon: unknown): string | null {
  if (!icon) return null;

  // 1. Plain string case: the backend already gave us a base64 string.
  //    This is the "normal" path if the API serializes bytea as text.
  if (typeof icon === "string") {
    return `data:image/png;base64,${icon}`;
  }

  // 2. Buffer/Uint8Array case: the API sent the bytea as an object.
  //    Two shapes are possible depending on how the JSON was produced:
  //    - `{ type: "Buffer", data: number[] }` (Node's JSON.stringify of Buffer)
  //    - a plain `number[]` (some ORMs / manual mappers)
  //    - a real `Uint8Array` (rare after JSON round-trip, but possible if the
  //      data is passed directly between TS layers without serialization)
  let buffer: Uint8Array;

  if (
    typeof icon === "object" &&
    icon !== null &&
    "type" in icon &&
    (icon as { type: unknown }).type === "Buffer" &&
    "data" in icon &&
    Array.isArray((icon as { data: unknown }).data)
  ) {
    buffer = new Uint8Array((icon as { data: number[] }).data);
  } else if (Array.isArray(icon)) {
    buffer = new Uint8Array(icon as number[]);
  } else if (icon instanceof Uint8Array) {
    buffer = icon;
  } else {
    // Unknown format. Fail visibly rather than silently rendering garbage.
    // Returning null makes the caller skip the <img>, which is safer.
    return null;
  }

  // 3. Heuristic: are the first bytes ASCII characters of a base64 string
  //    that starts with the PNG header "iVBOR"?
  //
  //    A real PNG binary starts with the magic bytes 0x89 0x50 0x4E 0x47 0x0D
  //    (non-printable, 'P', 'N', 'G', CR). Base64 of those bytes is exactly
  //    "iVBORw0KGgo...". So if we read back the first 5 bytes as ASCII and
  //    they spell "iVBOR", we know the column holds a base64 string (not the
  //    raw PNG), and we can decode it as text.
  //
  //    Why 5 bytes: that's the shortest prefix that distinguishes "iVBOR"
  //    (base64 of a PNG) from any conceivable ASCII that is NOT a PNG.
  //    A base64 of JPEG ("/9j/4AAQ") wouldn't match — that's fine, we
  //    explicitly support only PNG here.
  const prefixBuffer = buffer.slice(0, 5);
  const prefixAsString = bytesToAsciiString(prefixBuffer);

  if (prefixAsString.startsWith("iVBOR")) {
    // The buffer is ASCII base64 text. Decode it as text and embed directly.
    return `data:image/png;base64,${bytesToAsciiString(buffer)}`;
  }

  // 4. Otherwise, treat the buffer as raw image bytes and re-encode it.
  return `data:image/png;base64,${bytesToBase64(buffer)}`;
}
