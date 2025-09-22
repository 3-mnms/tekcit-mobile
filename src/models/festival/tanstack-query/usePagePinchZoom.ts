// src/shared/hooks/usePagePinchZoom.ts
import { useEffect } from 'react';

export default function usePagePinchZoom(enabled: boolean) {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) return;

    const prev = meta.getAttribute('content') || '';

    if (enabled) {
      // 이 페이지에서만 확대 허용 (iOS/Android 대응)
      meta.setAttribute(
        'content',
        'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover'
      );
    }

    return () => {
      // 페이지 떠날 때 원복
      meta.setAttribute('content', prev);
    };
  }, [enabled]);
}
