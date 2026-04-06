'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import InteractiveSelector from './interactive-selector';

interface Image {
  src: string;
  alt?: string;
  fit?: 'cover' | 'contain';
  position?: string;
}

interface ZoomParallaxProps {
  /** Array of images to be displayed in the parallax effect max 7 images */
  images: Image[];
}

export function ZoomParallax({ images }: ZoomParallaxProps) {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });

  // Desktop scales for zoom effect
  const scale4 = useTransform(scrollYProgress, [0, 1], [1, 4]);
  const scale5 = useTransform(scrollYProgress, [0, 1], [1, 5]);
  const scale6 = useTransform(scrollYProgress, [0, 1], [1, 6]);
  const scale8 = useTransform(scrollYProgress, [0, 1], [1, 8]);
  const scale9 = useTransform(scrollYProgress, [0, 1], [1, 9]);

  const scales = [scale4, scale5, scale6, scale5, scale6, scale8, scale9];
  
  const desktopLayouts = [
    'md:!translate-x-0 md:[&>div]:!top-0 md:[&>div]:!left-0',
    'md:[&>div]:!-top-[30vh] md:[&>div]:!left-[5vw] md:[&>div]:!h-[30vh] md:[&>div]:!w-[35vw]',
    'md:[&>div]:!-top-[10vh] md:[&>div]:!-left-[25vw] md:[&>div]:!h-[45vh] md:[&>div]:!w-[20vw]',
    'md:[&>div]:!left-[27.5vw] md:[&>div]:!h-[25vh] md:[&>div]:!w-[25vw]',
    'md:[&>div]:!top-[27.5vh] md:[&>div]:!left-[5vw] md:[&>div]:!h-[25vh] md:[&>div]:!w-[20vw]',
    'md:[&>div]:!top-[27.5vh] md:[&>div]:!-left-[22.5vw] md:[&>div]:!h-[25vh] md:[&>div]:!w-[30vw]',
    'md:[&>div]:!top-[22.5vh] md:[&>div]:!left-[25vw] md:[&>div]:!h-[15vh] md:[&>div]:!w-[15vw]',
  ];

  return (
    <div className="bg-[#07151c]">
      {/* Desktop parallax intro (hidden on mobile) */}
      <div ref={container} className="hidden md:block relative h-[280vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          {images.map(({ src, alt, fit, position }, index) => {
            const scale = scales[index % scales.length];

            return (
              <motion.div
                key={`parallax-${index}`}
                style={{ scale }}
                className={`absolute top-0 flex h-full w-full items-center justify-center ${desktopLayouts[index] || ''}`}
              >
                <div className="relative h-[25vh] w-[25vw]">
                  <img
                    src={src || '/placeholder.svg'}
                    alt={alt || `Parallax image ${index + 1}`}
                    className="h-full w-full rounded-lg"
                    style={{ objectFit: fit || 'cover', objectPosition: position || 'center' }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mobile interactive selector gallery */}
      <div className="md:hidden">
        <InteractiveSelector images={images} />
      </div>

      {/* Sequential full-screen section (desktop only) */}
      <div className="hidden md:block relative snap-y snap-mandatory">
        {images.map(({ src, alt, fit, position }, index) => (
          <section key={`focus-${index}`} className="h-screen snap-start flex items-center justify-center px-6 md:px-10">
            <motion.div
              initial={{ opacity: 0.35, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, amount: 0.55 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative h-[78vh] w-[86vw] overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
            >
              <img
                src={src || '/placeholder.svg'}
                alt={alt || `Focused image ${index + 1}`}
                className="h-full w-full"
                style={{ objectFit: fit || 'cover', objectPosition: position || 'center' }}
              />
            </motion.div>
          </section>
        ))}
      </div>
    </div>
  );
}
