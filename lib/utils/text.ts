/**
 * All user content is rendered as plain text (React escapes it), so there is no
 * HTML injection surface. These helpers only shape text for previews.
 */
export function excerpt(text: string, max = 120): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length <= max ? flat : `${flat.slice(0, max)}…`;
}

export function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.length <= 2 ? trimmed : trimmed.slice(-2);
}

/** Strips characters that let a path escape its folder. */
export function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '');
}
