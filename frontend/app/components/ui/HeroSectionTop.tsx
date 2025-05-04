import { ChevronRightIcon } from '@heroicons/react/20/solid';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <div className="bg-background">
      <div className="relative isolate overflow-hidden bg-hero-gradient">
        <div className="mx-auto max-w-7xl pb-24 pt-10 sm:pb-32 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:py-40">
          <div className="px-6 lg:px-0 lg:pt-4">
            <div className="mx-auto max-w-2xl">
              <div className="max-w-lg">
                <Image
                  className="h-11"
                  src="/images/logo.svg"
                  width={44}
                  height={44}
                  alt="Your Company"
                />
                <div className="mt-24 sm:mt-32 lg:mt-16">
                  <a href="#" className="inline-flex space-x-6">
                    <span className="rounded-full bg-transparent-transparentPrimary px-3 py-1 text-sm font-semibold text-primary ring-1 ring-inset ring-transparent-transparentPrimary">
                      What&apos;s new
                    </span>
                    <span className="inline-flex items-center space-x-2 text-sm font-medium text-mutedText">
                      <span>Just shipped v0.1.0</span>
                      <ChevronRightIcon className="h-5 w-5 text-mutedText" aria-hidden="true" />
                    </span>
                  </a>
                </div>
                <h1 className="mt-10 text-pretty text-5xl font-semibold tracking-tight text-foreground sm:text-7xl">
                  Supercharge your web app
                </h1>
                <p className="mt-8 text-pretty text-lg font-medium text-mutedText sm:text-xl">
                  Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo.
                </p>
                <div className="mt-10 flex items-center gap-x-6">
                  <a
                    href="#"
                    className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-cardForeground shadow-button hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Documentation
                  </a>
                  <a href="#" className="text-sm font-semibold text-foreground">
                    View on GitHub <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20 sm:mt-24 md:mx-auto md:max-w-2xl lg:mx-0 lg:mt-0 lg:w-screen">
            <div
              className="absolute inset-y-0 right-1/2 -z-10 -mr-10 w-[200%] skew-x-[-30deg] bg-card shadow-xl shadow-primaryTransparent ring-1 ring-primary-muted md:-mr-20 lg:-mr-36"
              aria-hidden="true"
            />
            <div className="shadow-lg md:rounded-3xl">
              <div className="bg-primary [clip-path:inset(0)] md:[clip-path:inset(0_round_theme(borderRadius.3xl))]">
                <div
                  className="absolute -inset-y-px left-1/2 -z-10 ml-10 w-[200%] skew-x-[-30deg] bg-primary-muted opacity-20 ring-1 ring-inset bg-transparent-transparentWhite md:ml-20 lg:ml-36"
                  aria-hidden="true"
                />
                <div className="relative px-6 pt-8 sm:pt-16 md:pl-16 md:pr-0">
                  <div className="mx-auto max-w-2xl md:mx-0 md:max-w-none">
                    <div className="w-screen overflow-hidden rounded-tl-xl bg-card">
                      <div className="flex bg-primary-muted-opacity ring-1 bg-transparent-transparentWhite">
                        <div className="-mb-px flex text-sm font-medium text-mutedText">
                          <div className="border-b border-r border-b-whiteTransparent border-r-whiteTransparent bg-transparent-transparentWhite px-4 py-2 text-foreground">
                            NotificationSetting.tsx
                          </div>
                          <div className="border-r border-mutedText border-opacity-10 px-4 py-2">App.tsx</div>
                        </div>
                      </div>
                      <div className="px-6 pb-14 pt-6">{/* Your code example */}</div>
                    </div>
                  </div>
                  <div
                    className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-blackTransparent md:rounded-3xl"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-background sm:h-32" />
      </div>
    </div>
  );
}
