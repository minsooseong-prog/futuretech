const OWNED_FOLDER = /^(avatars|album|posts|profile)\//;

/**
 * Every uploaded object is keyed as `{folder}/{userId}/{uuid}.{ext}` by the
 * upload route, so ownership is a pure string check — no database round trip.
 */
export function ownsUploadPath(userId: string, path: string): boolean {
  if (!path || path.includes('..') || !OWNED_FOLDER.test(path)) return false;
  const [folder, owner] = path.split('/');
  return Boolean(folder) && owner === userId;
}
