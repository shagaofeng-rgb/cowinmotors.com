"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PartIcon } from "@/components/PartIcon";

export function ProductPhoto({ src, alt, category, eager = false, onUnavailable }: { src?: string; alt: string; category: string; eager?: boolean; onUnavailable?: () => void }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const fail = useCallback(() => { setFailed(true); onUnavailable?.(); }, [onUnavailable]);
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) fail();
  }, [src, fail]);
  if (!src || failed) return (
    <span className="cm-photo-missing">
      <PartIcon category={category} size={46} />
      <span>Photo on request</span>
    </span>
  );
  return <img ref={ref} src={src} alt={alt} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} decoding="async" onError={fail} />;
}
