import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function LightPillar({
  topColor = '#5227FF',
  bottomColor = '#FF9FFC',
  intensity = 1,
  rotationSpeed = 1,
  glowAmount = 0.002,
  pillarWidth = 3,
  pillarHeight = 0.4,
  noiseIntensity = 0.4,
  pillarRotation = 20,
  interactive = false,
  mixBlendMode = 'screen',
  quality = 'high',
  className = '',
}) {
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });

  const dimensions = useMemo(() => {
    const widthRem = clamp(pillarWidth * 1.55, 2.4, 9);
    const heightPercent = clamp(pillarHeight * 240, 70, 120);
    const blurMain = clamp(30 * intensity, 20, 62);
    const blurGlow = clamp(96 * intensity, 56, 150);
    return { widthRem, heightPercent, blurMain, blurGlow };
  }, [pillarWidth, pillarHeight, intensity]);

  const qualityScale = quality === 'high' ? 1 : 0.8;
  const interactX = interactive ? (pointer.x - 0.5) * 18 : 0;
  const interactY = interactive ? (pointer.y - 0.5) * 14 : 0;
  const baseRotation = pillarRotation + interactX;

  const handlePointerMove = (event) => {
    if (!interactive) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    setPointer({ x, y });
  };

  const coreGradient = `linear-gradient(180deg, ${topColor}, ${bottomColor})`;

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className}`}
      onMouseMove={handlePointerMove}
      onPointerMove={handlePointerMove}
      style={{
        background:
          'radial-gradient(circle at 16% 18%, rgba(140,239,244,0.22), transparent 46%), radial-gradient(circle at 82% 12%, rgba(23,169,255,0.22), transparent 42%), linear-gradient(180deg, #061321, #081827)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          opacity: clamp(noiseIntensity * 0.14, 0, 0.18),
          backgroundImage:
            'linear-gradient(transparent 95%, rgba(255,255,255,0.08) 96%), linear-gradient(90deg, transparent 94%, rgba(255,255,255,0.06) 95%)',
          backgroundSize: '100% 6px, 6px 100%',
          mixBlendMode: 'soft-light',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        className="absolute left-1/2 top-[10%] -translate-x-1/2"
        animate={{
          rotate: [baseRotation - rotationSpeed * 8, baseRotation + rotationSpeed * 8, baseRotation - rotationSpeed * 8],
          y: [interactY * 0.4, interactY * -0.4, interactY * 0.4],
        }}
        transition={{ duration: 8 / qualityScale, ease: 'easeInOut', repeat: Infinity }}
        style={{
          width: `${dimensions.widthRem}rem`,
          height: `${dimensions.heightPercent}%`,
          borderRadius: '999px',
          background: coreGradient,
          filter: `blur(${dimensions.blurMain}px) saturate(${1.15 * intensity})`,
          mixBlendMode,
          opacity: clamp(0.88 * intensity, 0.58, 0.98),
        }}
      />

      <motion.div
        className="absolute left-1/2 top-[12%] -translate-x-1/2"
        animate={{
          rotate: [baseRotation - 8, baseRotation + 8, baseRotation - 8],
          scaleY: [1, 1.04, 1],
        }}
        transition={{ duration: 9 / qualityScale, ease: 'easeInOut', repeat: Infinity }}
        style={{
          width: `${dimensions.widthRem * 1.35}rem`,
          height: `${dimensions.heightPercent * 0.94}%`,
          borderRadius: '999px',
          background: 'linear-gradient(180deg, rgba(195,246,255,0.65), rgba(140,239,244,0.32))',
          filter: `blur(${Math.max(dimensions.blurMain * 0.45, 10)}px)`,
          mixBlendMode,
          opacity: clamp(0.6 * intensity, 0.35, 0.72),
        }}
      />

      <motion.div
        className="absolute left-1/2 top-[6%] -translate-x-1/2"
        animate={{
          rotate: [baseRotation + 12, baseRotation - 6, baseRotation + 12],
          scaleY: [1, 1.06, 1],
          y: [interactY * -0.3, interactY * 0.3, interactY * -0.3],
        }}
        transition={{ duration: 10 / qualityScale, ease: 'easeInOut', repeat: Infinity }}
        style={{
          width: `${dimensions.widthRem * 3.1}rem`,
          height: `${dimensions.heightPercent + 18}%`,
          borderRadius: '999px',
          background: coreGradient,
          filter: `blur(${dimensions.blurGlow}px)`,
          mixBlendMode,
          opacity: clamp(glowAmount * 1450 * intensity, 0.44, 0.82),
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(3,11,17,0.14), rgba(3,11,17,0.4))',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
