'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

/**
 * 브라우저용 클라이언트 (anon 키). 서버가 발급한 서명 업로드 토큰으로
 * 파일을 직접 올리는 용도로만 사용합니다. 버킷은 비공개이므로 이 키로는 읽기·목록 조회가 불가합니다.
 */
export function supabaseBrowser() {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase 공개 환경변수가 설정되지 않았습니다.');
    browserClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return browserClient;
}
