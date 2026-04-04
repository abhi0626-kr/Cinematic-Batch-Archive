import React, { useState, useEffect } from 'react';
import { FaImage, FaCamera, FaLandmark, FaTree, FaStar, FaCompass, FaPalette } from 'react-icons/fa';

interface Option {
  title: string;
  description?: string;
  image: string;
}

interface InteractiveSelectorProps {
  images: { src: string; alt?: string }[];
}

const InteractiveSelector = ({ images }: InteractiveSelectorProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animatedOptions, setAnimatedOptions] = useState<number[]>([]);

  const icons = [FaImage, FaCamera, FaLandmark, FaTree, FaStar, FaCompass, FaPalette];
  
  const options: Option[] = images.map((img, idx) => ({
    title: `Image ${idx + 1}`,
    description: `Gallery item ${idx + 1}`,
    image: img.src,
  }));

  const handleOptionClick = (index: number) => {
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    options.forEach((_, i) => {
      const timer = setTimeout(() => {
        setAnimatedOptions(prev => [...prev, i]);
      }, 180 * i);
      timers.push(timer);
    });
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [options.length]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#07151c] font-sans text-white"> 
      {/* Header Section */}
      <div className="w-full max-w-2xl px-6 mt-8 mb-2 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight drop-shadow-lg animate-fadeInTop delay-300">
          Gallery
        </h1>
        <p className="text-lg md:text-xl text-gray-300 font-medium max-w-xl mx-auto animate-fadeInTop delay-600">
          Explore our collection of moments
        </p>
      </div>

      <div className="h-12"></div>

      {/* Options Container */}
      <div className="options flex flex-col md:flex-row w-full max-w-[420px] md:max-w-[900px] min-w-0 md:min-w-[600px] h-auto md:h-[400px] mx-auto items-stretch gap-3 md:gap-0 overflow-visible md:overflow-hidden relative px-4 md:px-0">
        {options.map((option, index) => {
          const IconComponent = icons[index % icons.length];
          const isActive = activeIndex === index;
          
          return (
            <div
              key={index}
              className={`
                option relative flex flex-col justify-end overflow-hidden transition-all duration-700 ease-in-out
                ${isActive ? 'h-[260px] md:h-auto' : 'h-[72px] md:h-auto'}
                w-full md:w-auto
                ${isActive ? 'md:flex-[7_1_0%]' : 'md:flex-[1_1_0%]'}
                ${isActive ? 'active' : ''}
              `}
              style={{
                backgroundImage: `url('${option.image}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backfaceVisibility: 'hidden',
                opacity: animatedOptions.includes(index) ? 1 : 0,
                transform: animatedOptions.includes(index) ? 'translateY(0)' : 'translateY(18px)',
                margin: 0,
                borderRadius: 12,
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: isActive ? '#fff' : '#292929',
                cursor: 'pointer',
                backgroundColor: '#18181b',
                boxShadow: isActive 
                  ? '0 20px 60px rgba(0,0,0,0.50)' 
                  : '0 10px 30px rgba(0,0,0,0.30)',
                zIndex: isActive ? 10 : 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                position: 'relative',
                overflow: 'hidden',
                willChange: 'height, flex-grow, box-shadow, background-size, background-position'
              }}
              onClick={() => handleOptionClick(index)}
            >
              {/* Shadow effect */}
              <div 
                className="shadow absolute left-0 right-0 pointer-events-none transition-all duration-700 ease-in-out"
                style={{
                  bottom: isActive ? '0' : '-40px',
                  height: '120px',
                  boxShadow: isActive 
                    ? 'inset 0 -120px 120px -120px #000, inset 0 -120px 120px -80px #000' 
                    : 'inset 0 -120px 0px -120px #000, inset 0 -120px 0px -80px #000'
                }}
              ></div>
              
              {/* Label with icon and info */}
              <div className="label absolute left-0 right-0 bottom-5 flex items-center justify-start h-12 z-2 pointer-events-none px-4 gap-3 w-full">
                <div className="icon min-w-[44px] max-w-[44px] h-[44px] flex items-center justify-center rounded-full bg-[rgba(32,32,32,0.85)] backdrop-blur-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.18)] border-2 border-[#444] flex-shrink-0 flex-grow-0 transition-all duration-200">
                  <IconComponent size={24} className="text-white" />
                </div>
                <div className="info text-white whitespace-pre relative">
                  <div 
                    className="main font-bold text-lg transition-all duration-700 ease-in-out"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? 'translateX(0)' : 'translateX(25px)'
                    }}
                  >
                    {option.title}
                  </div>
                  <div 
                    className="sub text-base text-gray-300 transition-all duration-700 ease-in-out"
                    style={{
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? 'translateX(0)' : 'translateX(25px)'
                    }}
                  >
                    {option.description}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Custom animations */}
      <style jsx>{`
        @keyframes slideFadeIn {
          0% {
            opacity: 0;
            transform: translateX(-60px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInFromTop {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInTop {
          opacity: 0;
          transform: translateY(-20px);
          animation: fadeInFromTop 0.8s ease-in-out forwards;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-600 {
          animation-delay: 0.6s;
        }
      `}</style>
    </div>
  );
};

export default InteractiveSelector;
