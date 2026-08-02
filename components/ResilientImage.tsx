"use client";

import { useState } from "react";

type ResilientImageProps = {
  src: string;
  alt: string;
  fallback: string;
  className?: string;
  loading?: "eager" | "lazy";
};

export function ResilientImage({ src, alt, fallback, className, loading = "lazy" }: ResilientImageProps) {
  const [imageSource, setImageSource] = useState(() => (src?.startsWith("/") ? src : fallback));

  return (
    <img
      alt={alt}
      className={className}
      decoding="async"
      loading={loading}
      onError={() => {
        if (imageSource !== fallback) setImageSource(fallback);
      }}
      src={imageSource}
    />
  );
}
