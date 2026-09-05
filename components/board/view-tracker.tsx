'use client';

import { useEffect, useRef } from 'react';
import { registerView } from '@/actions/board';

/** Counts a view once per mount rather than on every server render. */
export function ViewTracker({ postId }: { postId: string }) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void registerView(postId);
  }, [postId]);

  return null;
}
