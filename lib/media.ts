/** Shared by server and client components — keep it dependency-free. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `/api/media?path=${encodeURIComponent(path)}`;
}

/** Prefers the small file when one exists. */
export function thumbUrl(
  thumbPath: string | null | undefined,
  fullPath: string | null | undefined,
): string | null {
  return mediaUrl(thumbPath || fullPath);
}
