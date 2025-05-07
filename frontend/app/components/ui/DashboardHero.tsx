/**
 * DashboardHero Component
 *
 * NOTE ON STYLING EXCEPTION:
 * This component uses custom transparent color classes that may trigger ESLint warnings.
 * These classes are properly defined in tailwind.config.js and are necessary for the
 * visual design of the dashboard hero section.
 */
import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import DashboardWrapper from '@/components/ui/DashboardWrapper';
import Image from 'next/image';

interface HeroProps {
  darkMode?: boolean;
}

const DashboardHero: React.FC<HeroProps> = ({ darkMode = false }) => {
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
                    <span className={`rounded-full ${accentBgLight} px-3 py-1 text-sm/6 font-semibold ${accentColor} ring-1 ring-inset ring-transparent-transparentPrimary`}>
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
                    className={`rounded-md ${darkMode ? accentBgDark : 'bg-primary'} px-3.5 py-2.5 text-sm font-semibold text-foreground shadow-button hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
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
              className={`absolute inset-y-0 right-1/2 -z-10 -mr-10 w-[200%] skew-x-[-30deg] ${bgColor} shadow-xl ${glowColor} ring-1 ring-transparent-transparentPrimary md:-mr-20 lg:-mr-36`}
              aria-hidden="true"
            />
            <div className="shadow-lg md:rounded-3xl">
              <div className={`${darkMode ? 'bg-primary' : 'bg-primary'} [clip-path:inset(0)] md:[clip-path:inset(0_round_theme(borderRadius.3xl))]`}>
                <div
                  className="absolute -inset-y-px left-1/2 -z-10 ml-10 w-[200%] skew-x-[-30deg] bg-primary-muted opacity-20 ring-1 ring-inset ring-transparent-transparentWhite md:ml-20 lg:ml-36"
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
                        {/* Dashboard positioned here */}
                        <DashboardWrapper darkMode={true} />
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