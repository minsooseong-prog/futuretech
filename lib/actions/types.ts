export type ActionState = { ok?: boolean; error?: string; message?: string } | undefined;

export type UploadTarget = {
  path: string;
  token: string;
  thumb: { path: string; token: string } | null;
};

export type UploadUrlsResult = { targets: UploadTarget[] } | { error: string };
