import 'server-only';

export const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === 'string' ? v : '';
};

export const strList = (fd: FormData, key: string) =>
  fd.getAll(key).filter((v): v is string => typeof v === 'string' && v.length > 0);

export function dbErrorCode(e: unknown): string | undefined {
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code ?? err?.cause?.code;
}
