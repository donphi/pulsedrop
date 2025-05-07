'use client'

/**
 * DashboardHero Component
 *
 * NOTE ON STYLING EXCEPTION:
 * This component uses custom transparent color classes that may trigger ESLint warnings.
 * These classes are properly defined in tailwind.config.js and are necessary for the
 * visual design of the dashboard hero section.
 */
import React, { useState, useRef, useCallback } from 'react';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import DashboardWrapper from '@/components/ui/DashboardWrapper';
import Image from 'next/image';

interface HeroProps {
  darkMode?: boolean;
}

const DashboardHero: React.FC<HeroProps> = ({ darkMode = false }) => {
  // State to track the current color for the frame
  const [frameColor, setFrameColor] = useState('#22c55e'); // Default green to match initial state
  
  // Reference to the frame element
  const frameRef = useRef<HTMLDivElement>(null);
  
  // Handler to receive color updates from the DashboardWrapper - use useCallback to stabilize
  const handleColorChange = useCallback((color: string) => {
    setFrameColor(color);
  }, []);
  
  // Define a consistent color transition duration
  const colorTransitionDuration = 2.5; // 2.5 seconds
  
  // Helper function to create a transparent version of the current color
  const getTransparentColor = (color: string, opacity: number) => {
    // Extract RGB components from hex color
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    // Return rgba format with specified opacity
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };
  
  const textColor = darkMode ? 'text-foreground' : 'text-foreground';
  const textColorSecondary = darkMode ? 'text-mutedText' : 'text-mutedText';
  const accentColor = 'text-primary';
  const accentBgLight = 'bg-primary-muted-opacity';
  const accentBgDark = 'bg-primary';
  const bgColor = darkMode ? 'bg-background' : 'bg-background';
  const glowColor = darkMode ? 'shadow-primaryTransparent' : 'shadow-primaryTransparent';
  
  return (
    <div className={bgColor}>
      <div className="relative isolate overflow-hidden bg-hero-gradient">
        <div className="mx-auto max-w-7xl pb-24 pt-10 sm:pb-32 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:py-40">
          <div className="px-6 lg:px-0 lg:pt-4">
            <div className="mx-auto max-w-2xl">
              <div className="max-w-lg">
                <Image
                  className="h-11"
                  src="/images/logo.svg"
                  alt="CycleHealth"
                  width={44}
                  height={44}
                />
                <div className="mt-24 sm:mt-32 lg:mt-16">
                  <a href="#" className="inline-flex space-x-6">
                    <span 
                      className="rounded-full px-3 py-1 text-sm/6 font-semibold ring-1 ring-inset ring-transparent-transparentPrimary"
                      style={{ 
                        color: frameColor,
                        backgroundColor: getTransparentColor(frameColor, 0.1), // Dynamic background with 10% opacity
                        transition: `color ${colorTransitionDuration}s ease-in-out, background-color ${colorTransitionDuration}s ease-in-out`
                      }}
                    >
                      Elite Dashboard
                    </span>
                    <span className={`inline-flex items-center space-x-2 text-sm/6 font-medium ${textColorSecondary}`}>
                      <span>Real-time performance monitoring</span>
                      <ChevronRightIcon className="size-5 text-mutedText" aria-hidden="true" />
                    </span>
                  </a>
                </div>
                <h1 className={`mt-10 text-pretty text-5xl font-semibold tracking-tight ${textColor} sm:text-7xl`}>
                  Performance metrics that feel alive
                </h1>
                <p className={`mt-8 text-pretty text-lg font-medium ${textColorSecondary} sm:text-xl/8`}>
                  Experience our cutting-edge monitoring dashboard that visualizes physiological data with unmatched precision and elegance. See how your athletes perform in real-time.
                </p>
                <div className="mt-10 flex items-center gap-x-6">
                  <a
                    href="#"
                    className="rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-button hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{ 
                      backgroundColor: frameColor,
                      transition: `background-color ${colorTransitionDuration}s ease-in-out`
                    }}
                  >
                    Start monitoring
                  </a>
                  <a href="#" className={`text-sm/6 font-semibold ${textColor}`}>
                    View demo <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-20 sm:mt-24 md:mx-auto md:max-w-2xl lg:mx-0 lg:mt-0 lg:w-screen">
            <div
              className={`absolute inset-y-0 right-1/2 -z-10 -mr-10 w-[200%] skew-x-[-30deg] ${bgColor} shadow-xl ring-1 ring-transparent-transparentPrimary md:-mr-20 lg:-mr-36`}
              style={{ 
                boxShadow: `0 0 15px 5px ${frameColor}25`,
                transition: `box-shadow ${colorTransitionDuration}s ease-in-out`
              }}
              aria-hidden="true"
            />
            <div className="shadow-lg md:rounded-3xl">
              <div 
                ref={frameRef}
                className="[clip-path:inset(0)] md:[clip-path:inset(0_round_theme(borderRadius.3xl))]"
                style={{ 
                  backgroundColor: frameColor,
                  transition: `background-color ${colorTransitionDuration}s ease-in-out`
                }}
              >
                {/* The diagonal overlay - modified to properly blend with changing background */}
                <div
                  className="absolute -inset-y-px left-1/2 -z-10 ml-10 w-[200%] skew-x-[-30deg] opacity-20 ring-1 ring-inset ring-transparent-transparentWhite md:ml-20 lg:ml-36"
                  style={{ 
                    backgroundColor: `white`, /* Always use white for overlay */
                    mixBlendMode: 'overlay', /* Use blend mode for proper effect */
                    transition: `background-color ${colorTransitionDuration}s ease-in-out`
                  }}
                  aria-hidden="true"
                />
                <div className="relative px-6 pt-8 sm:pt-16 md:pl-16 md:pr-0">
                  <div className="mx-auto max-w-2xl md:mx-0 md:max-w-none">
                    <div className="w-screen overflow-hidden rounded-tl-xl bg-card">
                      <div className="flex bg-neutral hover:bg-neutral-hover ring-1 ring-transparent-transparentWhite">
                        <div className="-mb-px flex text-sm/6 font-medium text-mutedText">
                          <div className="border-b border-r border-neutral px-4 py-2 text-foreground">
                            CyclePerformance.tsx
                          </div>
                          <div className="border-r border-neutral px-4 py-2">Dashboard.tsx</div>
                        </div>
                      </div>
                      <div className="px-6 pb-14 pt-6">
                        {/* Dashboard positioned here with color transition duration and callback */}
                        <DashboardWrapper 
                          darkMode={true} 
                          colorTransitionDuration={colorTransitionDuration}
                          onColorChange={handleColorChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-transparent-transparentBlack md:rounded-3xl"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={`absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-background sm:h-32`} />
      </div>
    </div>
  );
};

export default DashboardHero;