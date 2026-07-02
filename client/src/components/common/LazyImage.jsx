import { useState, useRef, useEffect, memo } from "react";
import { cn } from "@/utils/cn";

const LazyImage = memo(function LazyImage({
  src,
  alt,
  className,
  placeholder,
  width,
  height,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const element = imgRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(element);
        }
      },
      { rootMargin: "50px" },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden bg-primary-lightest/30",
        className,
      )}
      style={{ width, height }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-lightest/20 via-primary-lightest/40 to-primary-lightest/20 animate-pulse" />
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-500",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
          width={width}
          height={height}
          {...props}
        />
      )}
    </div>
  );
});

export default LazyImage;
