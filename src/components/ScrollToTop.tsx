import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();
  const hasTrackedPageView = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Track TikTok Pixel PageView only once on initial site load
  useEffect(() => {
    if (!hasTrackedPageView.current && typeof window !== 'undefined' && window.ttq && typeof window.ttq.track === 'function') {
      try {
        hasTrackedPageView.current = true;
        window.ttq.track('PageView');
        console.log('TikTok Pixel: Initial PageView tracked');
      } catch (error) {
        console.error('TikTok Pixel error:', error);
      }
    }
  }, []);

  return null;
}
