// Lightweight sanitizer for user-submitted SVG icon markup.
// Strips <script> tags, on* event handler attributes, and javascript: URIs.
// For stronger guarantees, consider swapping this for `isomorphic-dompurify`.

function extractSvg(input: string): string | null {
  const match = input.match(/<svg[\s\S]*?<\/svg>/i);
  return match ? match[0] : null;
}

export function isSvgIcon(icon: string): boolean {
  return extractSvg(icon) !== null;
}

export function sanitizeSvg(input: string): string {
  const svg = extractSvg(input);
  let clean = (svg ?? input).trim();

  // Remove <script>...</script> blocks entirely
  clean = clean.replace(/<script[\s\S]*?<\/script>/gi, "");

  // Remove on* event handler attributes (onclick=, onerror=, onload=, etc.)
  clean = clean.replace(/\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "");

  // Remove javascript: URIs in href/src/xlink:href
  clean = clean.replace(/(href|src|xlink:href)\s*=\s*("|')\s*javascript:[^"']*("|')/gi, "");

  // Remove <foreignObject> which can embed arbitrary HTML inside SVG
  clean = clean.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "");

  return clean;
}