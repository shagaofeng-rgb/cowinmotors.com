"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ResilientImageProps = {
  src: string;
  alt: string;
  fallback: string;
  className?: string;
  loading?: "eager" | "lazy";
  creditUrl?: string;
};

export function ResilientImage({ src, alt, fallback, className, loading = "lazy", creditUrl }: ResilientImageProps) {
  const [imageSource, setImageSource] = useState(() => /^(?:\/(?!\/)|https:\/\/)/i.test(src) ? src : fallback);
  const [unavailable, setUnavailable] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const fail = useCallback(() => {
    if (imageSource !== fallback) setImageSource(fallback);
    else setUnavailable(true);
  }, [imageSource, fallback]);
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) fail();
  }, [fail]);

  return (
    <>
      {!unavailable && <img
        ref={ref}
        alt={imageSource === src ? alt : ""}
        className={className}
        decoding="async"
        loading={loading}
        onError={fail}
        src={imageSource}
      />}
      {creditUrl && /^https?:\/\//i.test(creditUrl) && imageSource === src && !unavailable && <figcaption><a href={creditUrl} target="_blank" rel="noreferrer">Image source</a></figcaption>}
    </>
  );
}
