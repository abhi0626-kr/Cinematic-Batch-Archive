'use client';

import React, { useEffect, useRef, useState } from 'react';

type ImageHoverProps = {
  imageSrc?: string;
  imageAlt?: string;
  className?: string;
  imageClassName?: string;
  overlayClassName?: string;
  children?: React.ReactNode;
};

const getResponsiveValues = () => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024;

  let baseRadius;

  if (width < 768) {
    baseRadius = 70 + (width / 768) * 30;
  } else if (width < 1440) {
    baseRadius = 80 + ((width - 768) / (1440 - 768)) * 20;
  } else {
    baseRadius = 110 + ((Math.min(width, 2560) - 1440) / (2560 - 1440)) * 30;
  }

  const multiplier = baseRadius / 100;

  return {
    MAX_RADIUS: Math.round(baseRadius),
    MIN_RADIUS: 0,
    SOFT_EDGE: Math.round(60 * multiplier),
    LERP_SPEED: 0.18,
    RADIUS_LERP_SPEED: 0.13,
  };
};

export const ImageHover = ({
  imageSrc = 'https://images.unsplash.com/photo-1638551145269-f7925c37e672?q=80&w=2070&auto=format&fit=crop',
  imageAlt = 'Hero image',
  className = 'relative h-full w-full overflow-hidden',
  imageClassName = 'absolute inset-0 h-full w-full object-cover',
  overlayClassName = 'absolute inset-0 h-full w-full bg-black/80 backdrop-blur-[6px] transition-all duration-300 pointer-events-none',
  children,
}: ImageHoverProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [lerpedPos, setLerpedPos] = useState<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  const [radius, setRadius] = useState(0);
  const [targetRadius, setTargetRadius] = useState(0);
  const [values, setValues] = useState(getResponsiveValues());
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setValues(getResponsiveValues());
    };

    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!hovered || !mousePos || isTouchDevice) {
      setLerpedPos(null);
      return;
    }

    let frame: number;
    const animate = () => {
      setLerpedPos((prev) => {
        if (!prev) return mousePos;
        const dx = mousePos.x - prev.x;
        const dy = mousePos.y - prev.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.5) return mousePos;

        return {
          x: prev.x + dx * values.LERP_SPEED,
          y: prev.y + dy * values.LERP_SPEED,
        };
      });
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [mousePos, hovered, isTouchDevice, values.LERP_SPEED]);

  useEffect(() => {
    setTargetRadius(hovered ? values.MAX_RADIUS : values.MIN_RADIUS);
  }, [hovered, values.MAX_RADIUS, values.MIN_RADIUS]);

  useEffect(() => {
    let frame: number;
    const animateRadius = () => {
      setRadius((prev) => {
        if (Math.abs(prev - targetRadius) < 1) return targetRadius;
        return prev + (targetRadius - prev) * values.RADIUS_LERP_SPEED;
      });
      frame = requestAnimationFrame(animateRadius);
    };

    frame = requestAnimationFrame(animateRadius);
    return () => cancelAnimationFrame(frame);
  }, [targetRadius, values.RADIUS_LERP_SPEED]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (isTouchDevice) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect && e.touches[0]) {
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      setMousePos({ x, y });
      setLerpedPos({ x, y });
      setHovered(true);
    }
  };

  const handleMouseEnter = () => {
    if (!isTouchDevice) setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setMousePos(null);
    setLerpedPos(null);
  };

  const maskStyle =
    lerpedPos && radius > 0
      ? {
          WebkitMaskImage: `radial-gradient(circle ${radius}px at ${lerpedPos.x}px ${lerpedPos.y}px,
            transparent 0 ${radius - values.SOFT_EDGE - 20}px,
            rgba(0,0,0,0.10) ${radius - values.SOFT_EDGE}px,
            rgba(0,0,0,0.25) ${radius - values.SOFT_EDGE / 1.5}px,
            rgba(0,0,0,0.45) ${radius - values.SOFT_EDGE / 2}px,
            rgba(0,0,0,0.75) ${radius}px,
            black 100%)`,
          maskImage: `radial-gradient(circle ${radius}px at ${lerpedPos.x}px ${lerpedPos.y}px,
            transparent 0 ${radius - values.SOFT_EDGE - 20}px,
            rgba(0,0,0,0.10) ${radius - values.SOFT_EDGE}px,
            rgba(0,0,0,0.25) ${radius - values.SOFT_EDGE / 1.5}px,
            rgba(0,0,0,0.45) ${radius - values.SOFT_EDGE / 2}px,
            rgba(0,0,0,0.75) ${radius}px,
            black 100%)`,
          transition: 'WebkitMaskImage 0.3s, maskImage 0.3s, opacity 0.3s',
          opacity: 1,
        }
      : {
          WebkitMaskImage: 'none',
          maskImage: 'none',
          opacity: 1,
          transition: 'WebkitMaskImage 0.3s, maskImage 0.3s, opacity 0.3s',
        };

  const overlayOpacity = hovered && lerpedPos && radius > 0 ? 'opacity-90' : 'opacity-100';

  return (
    <div
      ref={containerRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchMove}
      onTouchEnd={handleMouseLeave}
    >
      <img src={imageSrc} alt={imageAlt} className={imageClassName} />

      {children}

      <div className={`${overlayClassName} ${overlayOpacity}`} style={maskStyle} />

      {lerpedPos && radius > 0 && (
        <div
          className='pointer-events-none absolute inset-0'
          style={{
            background: `radial-gradient(circle ${radius + 28}px at ${lerpedPos.x}px ${lerpedPos.y}px, rgba(255,255,255,0.24) 0, rgba(255,255,255,0.14) 45%, rgba(255,255,255,0.07) 72%, transparent 100%)`,
            mixBlendMode: 'screen',
            transition: 'background 0.3s',
          }}
        />
      )}
    </div>
  );
};
