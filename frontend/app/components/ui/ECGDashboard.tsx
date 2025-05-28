'use client'

import React, { useLayoutEffect, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Image from 'next/image';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid';

// Types for our different intensity states
export type IntensityState = 'resting' | 'start' | 'exercise' | 'intense';

interface ECGPoint {
  x: number;
  y: number;
}

interface IntensityConfig {
  label: string;
  bpm: number;
  color: string;
  avatar: string;
  duration: number; // Duration of this state in seconds
  hrv: number;
  heartRateZone: number;
  recoveryRate: number;
}

// Props for the main dashboard
interface ECGDashboardProps {
  initialState?: IntensityState;
  stateConfigs: Record<IntensityState, IntensityConfig>;
  cycleDuration?: number; // Total duration of a full cycle in seconds
  darkMode?: boolean;
  // New prop for controlling color transition duration independently
  colorTransitionDuration?: number;
  // New callback prop to notify parent of color changes
  onColorChange?: (color: string) => void;
}

// Hardcoded color values for faster transitions - moved to the top before any usage
const COLORS = {
  GREEN: '#22c55e',
  YELLOW: '#f59e0b',
  ORANGE: '#FC4C02',
  RED: '#ef4444'
};

// Helper function to get ECG color based on BPM - moved before any usage
const getECGColorImmediate = (bpm: number): string => {
  const safeBpm = Math.max(30, Math.min(220, bpm));
  
  if (safeBpm <= 58) {
    return COLORS.GREEN; // Normal - green
  } else if (safeBpm >= 180) {
    return COLORS.RED; // High - red
  } else if (safeBpm <= 120) {
    const percentage = Math.floor(((safeBpm - 58) / (120 - 58)) * 100);
    if (percentage < 33) return COLORS.GREEN; // Normal - green
    if (percentage < 66) return COLORS.YELLOW; // Moderate - yellow
    return COLORS.ORANGE; // Primary - orange
  } else {
    const percentage = Math.floor(((safeBpm - 120) / (180 - 120)) * 100);
    if (percentage < 33) return COLORS.ORANGE; // Primary - orange
    if (percentage < 66) return COLORS.YELLOW; // Warning - yellow
    return COLORS.RED; // High - red
  }
};

// Simple RER simulation based on heart rate intensity
const calculateSimulatedRER = (currentBPM: number, restingBPM: number, maxBPM: number): number => {
  // Normalize heart rate from 0-1 scale
  const hrIntensity = (currentBPM - restingBPM) / (maxBPM - restingBPM);
  
  // RER ranges from ~0.7 at rest to ~1.1+ at high intensity
  const baseRER = 0.7;
  const maxRER = 1.15;
  
  // Add a small random factor for natural fluctuation
  const randomFactor = (Math.random() * 0.04) - 0.02; // ±0.02 variation
  
  // Calculate RER with some non-linearity (RER rises faster at higher intensities)
  const calculatedRER = baseRER + (Math.pow(hrIntensity, 1.3) * (maxRER - baseRER)) + randomFactor;
  
  // Ensure value stays in realistic range
  return Math.max(0.7, Math.min(1.2, parseFloat(calculatedRER.toFixed(2))));
};

// Helper function to determine change classes
const getChangeClasses = (changeType: 'increase' | 'decrease' | null, color: string) => {
  if (!changeType) return '';
  
  // Use our COLORS mapping for consistency
  const bgColor = changeType === 'increase' 
    ? `rgba(${parseInt(COLORS.GREEN.slice(1, 3), 16)}, ${parseInt(COLORS.GREEN.slice(3, 5), 16)}, ${parseInt(COLORS.GREEN.slice(5, 7), 16)}, 0.1)`
    : `rgba(${parseInt(COLORS.RED.slice(1, 3), 16)}, ${parseInt(COLORS.RED.slice(3, 5), 16)}, ${parseInt(COLORS.RED.slice(5, 7), 16)}, 0.1)`;
  
  const textColor = changeType === 'increase' ? COLORS.GREEN : COLORS.RED;
  
  return `inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium`;
};

// Component that manages the full ECG dashboard
const ECGDashboard: React.FC<ECGDashboardProps> = ({
  initialState = 'resting',
  stateConfigs,
  cycleDuration,
  darkMode = false,
  colorTransitionDuration = 2, // Default 2 seconds for color transitions
  onColorChange
}) => {
  const [currentState, setCurrentState] = useState<IntensityState>(initialState);
  const [nextState, setNextState] = useState<IntensityState | null>(null);
  const [currentBPM, setCurrentBPM] = useState(stateConfigs[initialState].bpm);
  
  // 🔥 NEW: "displayColor" for initial paint & sync
  const [displayColor, setDisplayColor] = useState(
    getECGColorImmediate(stateConfigs[initialState].bpm)
  );

  // 🔥 NEW: refs for direct DOM metric updates
  const rerValueRef           = useRef<HTMLSpanElement>(null);
  const hrvValueRef           = useRef<HTMLSpanElement>(null);
  const recoveryRateValueRef  = useRef<HTMLSpanElement>(null);
  
  // Add refs for metric changes and values
  const rerChangeRef = useRef<'increase' | 'decrease' | null>('increase');
  const hrvChangeRef = useRef<'increase' | 'decrease' | null>('increase');
  const recoveryRateChangeRef = useRef<'increase' | 'decrease' | null>('increase');
  
  const rerChangeValueRef = useRef<HTMLSpanElement>(null);
  const hrvChangeValueRef = useRef<HTMLSpanElement>(null);
  const recoveryRateChangeValueRef = useRef<HTMLSpanElement>(null);
  
  // Track previous values to calculate changes
  const prevRerRef = useRef<number>(0.7); // Initial resting RER
  const prevHrvRef = useRef<number>(stateConfigs[initialState].hrv);
  const prevRecoveryRateRef = useRef<number>(stateConfigs[initialState].recoveryRate);
  
  // Use refs for values that the animation loop needs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const beatTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const ecgPointsRef = useRef<ECGPoint[]>([]);
  const lastDrawTimeRef = useRef<number>(0);
  const currentBpmRef = useRef<number>(currentBPM);
  const darkModeRef = useRef<boolean>(darkMode);
  const bpmTextRef = useRef<HTMLDivElement>(null);

  // Refs for color transitions - using simple initialization
  const currentColorRef = useRef<string>(COLORS.GREEN);
  const targetColorRef = useRef<string>(COLORS.GREEN);
  
  // Refs for the pulse rings
  const pulseContainerRef = useRef<HTMLDivElement>(null);
  const avatarBorderRef = useRef<HTMLDivElement>(null);
  const bpmColorRef = useRef<HTMLSpanElement>(null);
  
  // Add a ref for the progress bar
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Add refs for independent metric timelines
  const rerTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const hrvTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const recoveryRateTimelineRef = useRef<gsap.core.Timeline | null>(null);
  
  // NEW: Add a ref for color transition timeline
  const colorTransitionTimelineRef = useRef<gsap.core.Timeline | null>(null);
  
  // Helper function to determine change type and value
  const calculateChange = (currentValue: number, previousValue: number): { 
    changeType: 'increase' | 'decrease' | null,
    changeValue: string
  } => {
    // Handle NaN cases with fallbacks
    const safeCurrentValue = isNaN(currentValue) ? 0 : currentValue;
    const safePreviousValue = isNaN(previousValue) ? 0 : previousValue;
    
    // If values are the same or previous value is 0, handle specially
    if (safeCurrentValue === safePreviousValue) return { changeType: null, changeValue: '0.0' };
    if (safePreviousValue === 0) return { changeType: 'increase', changeValue: '0.0' }; // Avoid division by zero
    
    // Calculate the percentage change: (current - previous) / previous * 100
    const percentageChange = ((safeCurrentValue - safePreviousValue) / Math.abs(safePreviousValue)) * 100;
    const changeType = percentageChange > 0 ? 'increase' : 'decrease';
    
    // Limit to a reasonable range for display (max ±100%)
    const cappedPercentage = Math.max(-100, Math.min(100, percentageChange));
    
    // Format to one decimal place
    const changeValue = Math.abs(cappedPercentage).toFixed(1);
    
    return { changeType, changeValue };
  };
  
  // Use useLayoutEffect for initial styling to avoid flash
  useLayoutEffect(() => {
    if (avatarBorderRef.current)  avatarBorderRef.current.style.borderColor = displayColor;
    if (bpmColorRef.current)      bpmColorRef.current.style.color       = displayColor;
    if (progressBarRef.current)   progressBarRef.current.style.backgroundColor = displayColor;
  }, [displayColor]);  // repaint if initial color changes
  
  // Configuration for update frequencies (in seconds)
  const metricUpdateConfig = {
    rer: 0.5,          // Update RER every 0.5 seconds
    hrv: 0.5,          // Update HRV every 0.5 seconds
    recoveryRate: 1.0  // Update recovery rate every 1 second
  };
  
  // Simplified BPM update effect - just keep the ref in sync but don't trigger color changes
  useEffect(() => {
    currentBpmRef.current = currentBPM;
  }, [currentBPM]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Function to transition colors smoothly - REFACTORED to use the duration parameter
  const transitionColors = (targetColor: string, duration: number) => {
    // Only start new transition if target color is different from current target
    if (targetColorRef.current !== targetColor) {
      targetColorRef.current = targetColor;
      
      // Create a new timeline for color transitions
      const colorTl = gsap.timeline();
      
      // Update our local paint color and notify parent ONCE
      setDisplayColor(targetColor);
      onColorChange?.(targetColor);
      
      // Transition the ECG line color
      colorTl.to(currentColorRef, {
        current: targetColor,
        duration: duration,
        ease: "power2.out",
        onUpdate: () => {
          // Force redraw of ECG line with the interpolated color
          drawECGLine();
        }
      });
      
      // Transition the avatar border color
      if (avatarBorderRef.current) {
        colorTl.to(avatarBorderRef.current, {
          borderColor: targetColor,
          duration: duration,
          ease: "power2.out"
        }, 0); // Start at the same time as the ECG line transition
      }
      
      // Transition the BPM text color
      if (bpmColorRef.current) {
        colorTl.to(bpmColorRef.current, {
          color: targetColor,
          duration: duration,
          ease: "power2.out"
        }, 0); // Start at the same time
      }
      
      // Update the pulse rings color
      if (pulseContainerRef.current) {
        const rings = pulseContainerRef.current.querySelectorAll('.ring');
        rings.forEach(ring => {
          colorTl.to(ring, {
            color: targetColor,
            duration: duration,
            ease: "power2.out"
          }, 0); // Start at the same time
        });
      }
      
      // Update progress bar color if it exists
      if (progressBarRef.current) {
        colorTl.to(progressBarRef.current, {
          backgroundColor: targetColor,
          duration: duration,
          ease: "power2.out"
        }, 0); // Start at the same time
      }
      
      // Store the timeline reference
      colorTransitionTimelineRef.current = colorTl;
    }
  };
  
  // Function to reset and animate progress bar
  const resetAndAnimateProgressBar = (duration: number, bpm: number) => {
    if (!progressBarRef.current) return;
    
    // Kill any existing animations immediately
    gsap.killTweensOf(progressBarRef.current);
    
    // Get color directly from our hardcoded values
    getECGColorImmediate(bpm);

    gsap.set(progressBarRef.current, {
      width: "0%",
      backgroundColor: displayColor, // Use current display color instead of immediate
      opacity: 1
    });
    
    gsap.to(progressBarRef.current, {
      width: "100%",
      duration: duration,
      ease: "none",
      immediateRender: true
    });
  };
  
  useEffect(() => {
    darkModeRef.current = darkMode;
  }, [darkMode]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Function to start BPM text thump animation
  const startBpmThump = () => {
    gsap.killTweensOf(bpmTextRef.current);
    const beatDur = 60 / currentBPM;
    const isSlow = currentBPM < 120;
    
    gsap.to(bpmTextRef.current, {
      scale: 1.15,
      duration: 0.1,
      yoyo: true,
      repeat: -1,
      ease: isSlow ? "bounce.out" : "power1.inOut",
      repeatDelay: beatDur - 0.1
    });
  };
  
  // Function to start avatar rings animation - MODIFIED to use displayColor
  const startAvatarRings = (state: IntensityState) => {
    const cfg = stateConfigs[state];
    const base = cfg.bpm;
    const beatDur = 60 / base;
    
    // Clear & recreate
    const ctr = pulseContainerRef.current!;
    if (!ctr) return;
    
    ctr.innerHTML = "";
    
    const [r1, r2] = [document.createElement("div"), document.createElement("div")];
    
    // Use the same class name for both rings to enable staggered animation
    r1.className = r2.className = "ring pulse-ring";
    
    // Use the current display color instead of calculating from BPM
    // This ensures all rings use the same color that's currently transitioning
    [r1, r2].forEach(r => {
      r.style.color = displayColor;
      ctr.appendChild(r);
    });
    
    gsap.killTweensOf(".ring");
    
    // Use staggered animation
    gsap.to(".ring", {
      scale: 1.5,
      opacity: 0,
      duration: beatDur * 2,
      stagger: { each: beatDur / 2, repeat: -1 },
      ease: "power1.out"
    });
  };
  
  // Function to start metric updates with GSAP timelines
  const startMetricUpdates = (state: IntensityState) => {
    // Kill old timelines
    beatTimelineRef.current?.kill();
    rerTimelineRef.current?.kill();
    hrvTimelineRef.current?.kill();
    recoveryRateTimelineRef.current?.kill();
    
    const cfg = stateConfigs[state];
    const baseBPM = cfg.bpm;
    const beatDur = 60 / baseBPM;
    
    // Get min and max heart rates for RER calculation
    const restingBPM = stateConfigs['resting'].bpm;
    const maxBPM = stateConfigs['intense'].bpm;
    
    // Initialize RER value for this state
    const initialRER = calculateSimulatedRER(baseBPM, restingBPM, maxBPM);
    
    // Create local refs to track current values without using React state
    const metricValues = {
      rer: initialRER,
      hrv: cfg.hrv,
      recoveryRate: cfg.recoveryRate
    };
    
    // Create new BPM timeline
    const bpmTl = gsap.timeline({ repeat: -1 });
    bpmTl.to({}, {
      duration: beatDur,
      onComplete: () => {
        // jitter BPM ±2 around that base
        const flop = Math.random() * 4 - 2;
        const nextBPM = Math.round(
          Math.max(baseBPM - 2, Math.min(baseBPM + 2, baseBPM + flop))
        );
        setCurrentBPM(nextBPM);
        
        // Update RER based on new BPM
        const newRER = calculateSimulatedRER(nextBPM, restingBPM, maxBPM);
        metricValues.rer = newRER;
        
        if (rerValueRef.current) {
          rerValueRef.current.textContent = newRER.toFixed(2);
        }
        
        // Calculate change for RER
        const { changeType, changeValue } = calculateChange(newRER, prevRerRef.current);
        rerChangeRef.current = changeType;
        prevRerRef.current = newRER;
        
        if (rerChangeValueRef.current) {
          rerChangeValueRef.current.textContent = changeValue;
          
          // Update indicator styles based on change direction
          const parentElement = rerChangeValueRef.current.parentElement;
          if (parentElement) {
            parentElement.style.backgroundColor = changeType === 'increase' ? 
              'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            parentElement.style.color = changeType === 'increase' ? 
              COLORS.GREEN : COLORS.RED;
          }
        }
      }
    });
    beatTimelineRef.current = bpmTl;
    
    // Create independent timeline for RER updates
    const rerTl = gsap.timeline({ repeat: -1 });
    rerTl.to({}, {
      duration: metricUpdateConfig.rer,
      onComplete: () => {
        // Small fluctuations in RER independent of heart rate
        const fluctuation = (Math.random() * 0.04) - 0.02;
        metricValues.rer = Math.max(0.7, Math.min(1.2, metricValues.rer + fluctuation));
        
        if (rerValueRef.current) {
          const value = isNaN(metricValues.rer) ? 0 : metricValues.rer;
          rerValueRef.current.textContent = value.toFixed(2);
        }
        
        // Calculate change for RER
        const { changeType, changeValue } = calculateChange(metricValues.rer, prevRerRef.current);
        rerChangeRef.current = changeType;
        prevRerRef.current = metricValues.rer;
        
        if (rerChangeValueRef.current) {
          rerChangeValueRef.current.textContent = changeValue;
          
          // Update indicator styles based on change direction
          const parentElement = rerChangeValueRef.current.parentElement;
          if (parentElement) {
            parentElement.style.backgroundColor = changeType === 'increase' ? 
              'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            parentElement.style.color = changeType === 'increase' ? 
              COLORS.GREEN : COLORS.RED;
          }
        }
      }
    });
    rerTimelineRef.current = rerTl;
    
    // Create independent timeline for HRV updates
    const hrvTl = gsap.timeline({ repeat: -1 });
    hrvTl.to({}, {
      duration: metricUpdateConfig.hrv,
      onComplete: () => {
        const prevHrv = metricValues.hrv;
        metricValues.hrv = cfg.hrv + (Math.random() * 2 - 1);
        
        if (hrvValueRef.current) {
          hrvValueRef.current.textContent = metricValues.hrv.toFixed(1);
        }
        
        const { changeType, changeValue } = calculateChange(metricValues.hrv, prevHrvRef.current);
        hrvChangeRef.current = changeType;
        prevHrvRef.current = metricValues.hrv;
        
        if (hrvChangeValueRef.current) {
          hrvChangeValueRef.current.textContent = changeValue;
          
          // Update indicator styles based on change direction
          const parentElement = hrvChangeValueRef.current.parentElement;
          if (parentElement) {
            parentElement.style.backgroundColor = changeType === 'increase' ? 
              'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            parentElement.style.color = changeType === 'increase' ? 
              COLORS.GREEN : COLORS.RED;
          }
        }
      }
    });
    hrvTimelineRef.current = hrvTl;
    
    // Create independent timeline for Recovery Rate updates
    const recoveryRateTl = gsap.timeline({ repeat: -1 });
    recoveryRateTl.to({}, {
      duration: metricUpdateConfig.recoveryRate,
      onComplete: () => {
        const prevRecoveryRate = metricValues.recoveryRate;
        metricValues.recoveryRate = cfg.recoveryRate + (Math.random() * 0.2 - 0.1);
        
        if (recoveryRateValueRef.current) {
          recoveryRateValueRef.current.textContent = metricValues.recoveryRate.toFixed(1);
        }
        
        const { changeType, changeValue } = calculateChange(metricValues.recoveryRate, prevRecoveryRateRef.current);
        recoveryRateChangeRef.current = changeType;
        prevRecoveryRateRef.current = metricValues.recoveryRate;
        
        if (recoveryRateChangeValueRef.current) {
          recoveryRateChangeValueRef.current.textContent = changeValue;
          
          // Update indicator styles based on change direction
          const parentElement = recoveryRateChangeValueRef.current.parentElement;
          if (parentElement) {
            parentElement.style.backgroundColor = changeType === 'increase' ? 
              'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            parentElement.style.color = changeType === 'increase' ? 
              COLORS.GREEN : COLORS.RED;
          }
        }
      }
    });
    recoveryRateTimelineRef.current = recoveryRateTl;
  };
  
  // Initialize GSAP timeline and set up the cycle - ONLY ONCE
  useEffect(() => {
    const states: IntensityState[] = ['resting', 'start', 'exercise', 'intense'];
    
    // Capture ref values to avoid stale closure warnings
    const bpmTextElement = bpmTextRef.current;
    
    // Calculate total duration dynamically from stateConfigs
    const totalDuration = Object.values(stateConfigs).reduce((sum, config) => sum + config.duration, 0);
    
    // IMPORTANT: Initialize color refs first before any animations
    const initState = initialState;
    currentColorRef.current = getECGColorImmediate(stateConfigs[initState].bpm);
    targetColorRef.current = currentColorRef.current;
    
    // Ensure the current BPM is set to the initial state's BPM
    setCurrentBPM(stateConfigs[initState].bpm);
    
    // Get min and max heart rates for RER calculation
    const restingBPM = stateConfigs['resting'].bpm;
    const maxBPM = stateConfigs['intense'].bpm;
    
    // Initialize RER value
    const initialRER = calculateSimulatedRER(stateConfigs[initState].bpm, restingBPM, maxBPM);
    
    // Initialize change refs for metrics
    rerChangeRef.current = 'increase';
    hrvChangeRef.current = 'increase';
    recoveryRateChangeRef.current = 'increase';
    
    prevRerRef.current = initialRER;
    prevHrvRef.current = stateConfigs[initialState].hrv;
    prevRecoveryRateRef.current = stateConfigs[initialState].recoveryRate;
    
    // Create new timeline
    const tl = gsap.timeline({
      repeat: -1,
      onRepeat: () => {
        setCurrentState('resting');
      }
    });
    
    // Create refs for stats elements that will be updated directly through DOM
    const rerRef = { current: initialRER };
    const hrvRef = { current: stateConfigs[initialState].hrv };
    const recoveryRateRef = { current: stateConfigs[initialState].recoveryRate };
    
    // Add each state to the timeline
    states.forEach((state, i) => {
      const stateDuration = stateConfigs[state].duration;
      const cfg = stateConfigs[state];
      
      // Add this state to timeline
      tl.to({}, stateDuration, {
        onStart: () => {
          // Update the current state
          setCurrentState(state);
          
          // Determine next state
          const nextIndex = (i + 1) % states.length;
          setNextState(states[nextIndex]);
          
          // Set the current BPM to this state's BPM
          setCurrentBPM(cfg.bpm);
          
          // Calculate initial RER for this state
          const newRER = calculateSimulatedRER(cfg.bpm, restingBPM, maxBPM);
          
          // Initialize change values for each state
          if (rerChangeValueRef.current) rerChangeValueRef.current.textContent = "0.02";
          if (hrvChangeValueRef.current) hrvChangeValueRef.current.textContent = "0.5";
          if (recoveryRateChangeValueRef.current) recoveryRateChangeValueRef.current.textContent = "0.5";
          
          // Reset metric indicators to "increase" for new phase
          rerChangeRef.current = 'increase';
          hrvChangeRef.current = 'increase';
          recoveryRateChangeRef.current = 'increase';
          
          // Initial values for stats - just for the first render
          // After this, GSAP will directly update the DOM
          if (rerValueRef.current) rerValueRef.current.textContent = newRER.toFixed(2);
          if (hrvValueRef.current) hrvValueRef.current.textContent = cfg.hrv.toFixed(1);
          if (recoveryRateValueRef.current) recoveryRateValueRef.current.textContent = cfg.recoveryRate.toFixed(1);
          
          // Reset stats refs
          rerRef.current = newRER;
          hrvRef.current = cfg.hrv;
          recoveryRateRef.current = cfg.recoveryRate;
          
          // Start the three repeaters - all at once for instant state change
          startMetricUpdates(state);
          startBpmThump();
          startAvatarRings(state);
          
          // Reset and animate progress bar - use current color
          resetAndAnimateProgressBar(cfg.duration, cfg.bpm);
          
          // IMPORTANT: Only trigger color transition on state change, not on every BPM tick
          const newColor = getECGColorImmediate(cfg.bpm);
          
          // Calculate a smooth transition duration
          // This ensures colors finish transitioning within the state duration
          const transitionTime = Math.min(colorTransitionDuration, stateDuration * 0.5);
          
          // Call the updated transitionColors function with the target color
          transitionColors(newColor, transitionTime);
        },
        onUpdate: function() {
          const localProgress = (this.progress() || 0);
          
          // If we're approaching the end of this state, start transitioning BPM
          if (localProgress > 0.7 && nextState) {
            const t = (localProgress - 0.7) * 3.33; // 0 to 1 during the last 20% of the state
            
            // Transition BPM
            const currentBPM = stateConfigs[state].bpm;
            const nextBPM = stateConfigs[states[(i + 1) % states.length]].bpm;
            setCurrentBPM(Math.round(currentBPM + t * (nextBPM - currentBPM)));
          }
        }
      });
    });
    
    // Scale the timeline to match the desired cycleDuration
    const calculatedCycleDuration = cycleDuration || totalDuration;
    const scaleFactor = calculatedCycleDuration / totalDuration;
    tl.timeScale(1 / scaleFactor);
    
    // Store the timeline
    timelineRef.current = tl;
    
    // Now start animations *after* initializing colors
    startMetricUpdates(initialState);
    startBpmThump();
    startAvatarRings(initialState);
    resetAndAnimateProgressBar(stateConfigs[initialState].duration, stateConfigs[initialState].bpm);
    
    // Initial color transition for the starting state
    const initialColor = getECGColorImmediate(stateConfigs[initialState].bpm);
    transitionColors(initialColor, 0.1); // Fast initial transition
    
    // 🔥 single, consolidated cleanup
    return () => {
      tl.kill();
      // also kill our updaters
      rerTimelineRef.current?.kill();
      beatTimelineRef.current?.kill();
      hrvTimelineRef.current?.kill();
      recoveryRateTimelineRef.current?.kill();
      gsap.killTweensOf(bpmTextElement);
      gsap.killTweensOf(".ring");
    };
  }, [stateConfigs, cycleDuration, colorTransitionDuration, initialState]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Draw the static grid to a separate canvas — improved fade math
  const drawGrid = () => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    if (width <= 0 || height <= 0) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = darkModeRef.current 
      ? `rgba(255, 255, 255, 0.1)` 
      : `rgba(0, 0, 0, 0.1)`;
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let pos = 0; pos < width; pos += 20) {
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, height);
      const dist = Math.min(pos, width - pos);
      const alpha = Math.min(0.02, dist / 5000);
      ctx.strokeStyle = darkModeRef.current
        ? `rgba(255,255,255,${alpha})`
        : `rgba(0,0,0,${alpha})`;
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let pos = 0; pos < height; pos += 20) {
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(width, pos);
      const dist = Math.min(pos, height - pos);
      const alpha = Math.min(0.02, dist / 5000);
      ctx.strokeStyle = darkModeRef.current
        ? `rgba(255,255,255,${alpha})`
        : `rgba(0,0,0,${alpha})`;
      ctx.stroke();
    }
  };
  
  // Handle canvas resizing with ResizeObserver
  useEffect(() => {
    const mainCanvas = canvasRef.current;
    const gridCanvas = gridCanvasRef.current;
    if (!mainCanvas || !gridCanvas) return;
    
    const updateCanvasSize = (width: number, height: number) => {
      // Ensure integer dimensions for Safari compatibility
      const w = Math.max(1, Math.floor(width));
      const h = Math.max(1, Math.floor(height));
      
      // Update both canvases
      mainCanvas.width = w;
      mainCanvas.height = h;
      gridCanvas.width = w;
      gridCanvas.height = h;
      
      // Create new points array with proper x-coordinates - using integer w
      ecgPointsRef.current = Array(w).fill(0).map((_, i) => ({
        x: i,
        y: 0
      }));
      
      // Redraw the grid
      drawGrid();
    };
    
    // Create ResizeObserver to handle canvas size changes
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.target === mainCanvas) {
          const rect = entry.contentRect;
          if (!rect || rect.width <= 0 || rect.height <= 0) continue;
          
          // Pass exact integers, not floating points
          updateCanvasSize(rect.width, rect.height);
        }
      }
    });
    
    // Initial sizing - FIXED for Safari
    const rect = mainCanvas.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) {
      // Ensure we're using integers for Array constructor
      updateCanvasSize(rect.width, rect.height);
    }
    
    resizeObserver.observe(mainCanvas);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Update grid when darkMode changes
  useEffect(() => {
    drawGrid();
  }, [darkMode]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Calculate ECG point for a specific phase and intensity
  const calculateECGPoint = (phase: number, intensityFactor: number): number => {
    let value = 0;
    
    // Baseline with small noise
    value += (Math.random() * 0.005) - 0.0025;
    
    // P-wave (atrial depolarization)
    if (phase < 0.2) {
      const pHeight = 0.15 * intensityFactor; 
      value += pHeight * Math.exp(-0.5 * Math.pow((phase - 0.1) / 0.025, 2));
    }
    
    // Q-wave (small negative deflection)
    if (phase >= 0.2 && phase < 0.24) {
      const qDepth = -0.05 * intensityFactor;
      value += qDepth * Math.exp(-0.5 * Math.pow((phase - 0.235) / 0.016, 2));
    }
    
    // R-wave (sharp upward spike)
    if (phase >= 0.24 && phase < 0.26) {
      const rHeight = 1.0 * intensityFactor;
      // Avoid division by or near zero
      const denominator = Math.max(0.005, 0.01 - 0.001 * intensityFactor);
      value += rHeight * Math.exp(-0.5 * Math.pow((phase - 0.25) / denominator, 2));
    }
    
    // S-wave (downward deflection)
    if (phase >= 0.26 && phase < 0.3) {
      const sDepth = -0.15 * intensityFactor;
      value += sDepth * Math.exp(-0.5 * Math.pow((phase - 0.28) / 0.012, 2));
    }
    
    // T-wave (repolarization)
    if (phase >= 0.3 && phase < 0.7) {
      // T-wave gets shorter but wider with higher BPM
      const tHeight = 0.35 * Math.max(0.6, 1 - (intensityFactor - 1) * 0.3);
      const tWidth = 0.04 * (1 + (intensityFactor - 1) * 0.2);
      value += tHeight * Math.exp(-0.5 * Math.pow((phase - 0.45) / tWidth, 2));
    }
    
    return value;
  };
  
  // Function to draw just the ECG line (not the grid)
  const drawECGLine = () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Canvas dimensions
      const width = canvas.width;
      const height = canvas.height;
      
      if (width <= 0 || height <= 0) return;
      
      const drawHeight = height * 0.4;
      const verticalCenter = Math.floor(height * (2/3));
      
      // Clear the canvas - don't draw grid since that's handled by the background canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw ECG - add additional safety checks
      if (ecgPointsRef.current.length > 1 && width > 0 && height > 0) {
        // Use current color from ref - make sure it's a valid color
        const computedColor = currentColorRef.current || COLORS.GREEN;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, computedColor);
        gradient.addColorStop(1, computedColor);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(ecgPointsRef.current[25].x, verticalCenter - (ecgPointsRef.current[25].y * drawHeight));
        
        for (let i = 26; i < ecgPointsRef.current.length; i++) {
          const point = ecgPointsRef.current[i];
          ctx.lineTo(point.x, verticalCenter - (point.y * drawHeight));
        }
        
        ctx.stroke();
        
        // Draw the leading circle at the drawing point (now at the beginning/left)
        const point25 = ecgPointsRef.current[25];
        ctx.beginPath();
        ctx.arc(point25.x, verticalCenter - (point25.y * drawHeight), 4, 0, Math.PI * 2);
        
        // Use the same color for the fill
        ctx.fillStyle = computedColor;
        ctx.fill();
      }
    } catch (error) {
      // Silently handle any errors that might occur during drawing
      console.error("Error drawing ECG:", error);
    }
  };
  
  // Animate ECG - loop that stays active for the component lifetime
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const updateECG = (timestamp: number) => {
      // Control animation speed based on current BPM - use the ref
      const frameInterval = 1000 / 60; // Target 60fps
      
      if (timestamp - lastDrawTimeRef.current >= frameInterval) {
        lastDrawTimeRef.current = timestamp;
        
        // SAFETY: Use clamped BPM values to prevent errors
        const safeBPM = Math.max(30, Math.min(220, currentBpmRef.current));
        
        // Calculate current intensity factor based on BPM
        const minBPM = 58;
        const maxBPM = 180;
        const normalizedBPM = Math.max(minBPM, Math.min(maxBPM, safeBPM));
        const intensityFactor = 1 + ((normalizedBPM - minBPM) / (maxBPM - minBPM)) * 1.5;
        
        // Calculate seconds per heartbeat safely
        const secondsPerHeartbeat = 60 / safeBPM;
        
        // Shift all points to the right (so we draw from left to right)
        if (ecgPointsRef.current.length > 1) {
          for (let i = ecgPointsRef.current.length - 1; i > 0; i--) {
            ecgPointsRef.current[i].y = ecgPointsRef.current[i - 1].y;
          }
          
          // Calculate the phase based on time and current BPM
          const phase = (timestamp / 1000) % secondsPerHeartbeat / secondsPerHeartbeat;
          
          try {
            // Generate new point with proper ECG waveform at the beginning (left side)
            ecgPointsRef.current[0].y = calculateECGPoint(phase, intensityFactor);
          } catch (error) {
            // Handle errors during calculation
            console.error("Error calculating ECG point:", error);
            ecgPointsRef.current[0].y = 0; // Use safe fallback
          }
        }
        
        // Draw just the ECG line - grid is drawn separately
        drawECGLine();
      }
      
      animationFrameId = requestAnimationFrame(updateECG);
    };
    
    animationFrameId = requestAnimationFrame(updateECG);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // No dependencies - the animation loop runs once for the component lifetime
  
  // Classes for dark/light mode using tailwind variables
  const bgColor = darkMode ? 'bg-background' : 'bg-card';
  const textColor = darkMode ? 'text-foreground' : 'text-foreground';
  const textColorSecondary = darkMode ? 'text-mutedText' : 'text-mutedText';
  const cardBg = darkMode ? 'bg-card' : 'bg-card';
  
  return (
    <div className={`p-6 rounded-xl ${darkMode ? 'bg-background' : 'bg-white'} ${textColor}`}>
      {/* Header with Activity State and Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-foreground">
          {stateConfigs[currentState].label}
        </h2>
        <div className="text-sm font-medium text-mutedText">
          {nextState && `Next: ${stateConfigs[nextState].label}`}
        </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-2 bg-neutral-muted rounded-full overflow-hidden">
        <div 
          ref={progressBarRef}
          className="h-full rounded-full"
          style={{ backgroundColor: displayColor }}
        />
      </div>
      </div>
      {/* Main Content */}
      <div className="flex gap-6">
        {/* Avatar + BPM Display - fixed width column with max-width constraint */}
        <div className={`box-border basis-1/3 max-w-[250px] min-w-0 ${cardBg} rounded-xl shadow-card p-6 flex flex-col items-center`}>
          {/* Avatar with pulse rings */}
          <div className="relative mb-4">
            {/* Container for pulse rings */}
            <div 
              ref={pulseContainerRef}
              className="absolute inset-0"
            ></div>
            
            {/* Avatar image */}
            <div
              ref={avatarBorderRef}
              className="box-border relative w-full aspect-square rounded-full overflow-hidden border-4 border-current z-10"
              style={{ 
                borderColor: displayColor,
                border: '5px solid' 
              }}
            >
              <Image
                src={stateConfigs[currentState].avatar}
                alt="Athlete Avatar"
                className="w-full h-full object-cover"
                width={128}
                height={128}
              />
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-end justify-center">
              {/* BPM with pulsing animation */}
              <div ref={bpmTextRef} style={{ transformOrigin: "50% 50%" }}>
                <span
                  ref={bpmColorRef}
                  className="text-3xl xxs:text-4xl sm:text-5xl font-bold tabular-nums"
                  style={{ color: displayColor }}
                >
                  {currentBPM}
                </span>
                <span className={`ml-1 text-sm xxs:text-base sm:text-lg ${textColorSecondary} mb-1`}>bpm</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* ECG Display - maintains height with flex-grow */}
        <div className={`flex-grow ${cardBg} rounded-xl shadow-card overflow-hidden`}>
          <div className="relative h-full">
            {/* Grid background canvas */}
            <canvas 
              ref={gridCanvasRef}
              className="absolute inset-0 w-full h-full"
            />
            {/* ECG line canvas */}
            <canvas 
              ref={canvasRef} 
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
      </div>
      {/* Stats card Section */}
      <div className="flex gap-6 mt-6">
        {/* Left card - matches avatar width */}
        <div className={`box-border basis-1/3 max-w-[250px] min-w-0 ${cardBg} rounded-xl shadow-card p-6`}>
          <div className={`mb-2 text-sm font-semibold ${textColorSecondary}`}>
            <span className="hidden sm:inline">Respiratory Exchange</span>
            <span className="inline sm:hidden">ReR</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between">
            <div className="flex items-baseline">
              <span ref={rerValueRef} className="text-2xl font-semibold tabular-nums whitespace-nowrap">0.70</span>
              <span className={`ml-2 text-sm ${textColorSecondary}`}>ratio</span>
            </div>
            {/* Dynamic indicator */}
            <div 
              className="mt-2 inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium self-start"
              style={{ 
                backgroundColor: rerChangeRef.current === 'increase' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: rerChangeRef.current === 'increase' ? COLORS.GREEN : COLORS.RED
              }}
            >
              {rerChangeRef.current === 'increase' ? (
                <ArrowUpIcon className="-ml-1 mr-0.5 w-5 h-5 shrink-0 self-center" aria-hidden="true" />
              ) : (
                <ArrowDownIcon className="-ml-1 mr-0.5 w-5 h-5 shrink-0 self-center" aria-hidden="true" />
              )}
              <span className="sr-only">
                {rerChangeRef.current === 'increase' ? 'Increased' : 'Decreased'} by
              </span>
              <span ref={rerChangeValueRef}>0</span><span>%</span>
            </div>
          </div>
        </div>
        
        {/* HRV - exactly 1/3 width */}
        <div className={`box-border w-1/3 ${cardBg} rounded-xl shadow-card p-6`}>
          <div className="flex flex-col h-full justify-between">
            <div className={`text-sm font-semibold ${textColorSecondary}`}>HRV</div>
            <div className="flex flex-col md:flex-row md:items-baseline md:justify-between">
              <div className="flex items-baseline">
                <span ref={hrvValueRef} className="text-2xl font-semibold tabular-nums whitespace-nowrap">{stateConfigs[initialState].hrv.toFixed(1)}</span>
                <span className={`ml-2 text-sm ${textColorSecondary}`}>ms</span>
              </div>
            {/* Dynamic indicator */}
            <div
              className="mt-2 inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium self-start"
              style={{ 
                backgroundColor: hrvChangeRef.current === 'increase' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: hrvChangeRef.current === 'increase' ? COLORS.GREEN : COLORS.RED
              }}
            >
              {hrvChangeRef.current === 'increase' ? (
                <ArrowUpIcon className="-ml-1 mr-0.5 w-5 h-5 shrink-0 self-center" aria-hidden="true" />
              ) : (
                <ArrowDownIcon className="-ml-1 mr-0.5 w-5 h-5 shrink-0 self-center" aria-hidden="true" />
              )}
              <span className="sr-only">
                {hrvChangeRef.current === 'increase' ? 'Increased' : 'Decreased'} by
              </span>
              <span ref={hrvChangeValueRef}>0.0</span><span>%</span>
            </div>
          </div>
        </div>
        </div>
        {/* Recovery Rate - exactly 1/3 width */}
        <div className={`box-border w-1/3 ${cardBg} rounded-xl shadow-card p-6`}>
        <div className="flex flex-col h-full justify-between">
          <div className={`text-sm font-semibold ${textColorSecondary}`}>
            <span className="hidden sm:inline">Recovery Rate</span>
            <span className="inline sm:hidden">RR</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between">
            <div className="flex mt-auto items-baseline">
              <span ref={recoveryRateValueRef} className="text-2xl font-semibold tabular-nums whitespace-nowrap">{stateConfigs[initialState].recoveryRate.toFixed(1)}</span>
              <span className={`ml-2 text-sm ${textColorSecondary}`}>%</span>
            </div>
            {/* Dynamic indicator */}
            <div
              className="mt-2 inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium self-start"
              style={{ 
                backgroundColor: recoveryRateChangeRef.current === 'increase' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: recoveryRateChangeRef.current === 'increase' ? COLORS.GREEN : COLORS.RED
              }}
            >
              {recoveryRateChangeRef.current === 'increase' ? (
                <ArrowUpIcon className="-ml-1 mr-0.5 w-5 h-5 shrink-0 self-center" aria-hidden="true" />
              ) : (
                <ArrowDownIcon className="-ml-1 mr-0.5 w-5 h-5 shrink-0 self-center" aria-hidden="true" />
              )}
              <span className="sr-only">
                {recoveryRateChangeRef.current === 'increase' ? 'Increased' : 'Decreased'} by
              </span>
              <span ref={recoveryRateChangeValueRef}>0.0</span><span>%</span>
            </div>
          </div>
        </div>
      </div>
      </div>
      {/* Add CSS for pulse rings */}
      <style jsx global>{`
        .pulse-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background-color: currentColor; /* Change from border to background-color */
          border: none; /* Remove the border */
          opacity: 0.8; /* Start with higher opacity */
          transform: scale(1);
        }
        
        /* Extra small screens breakpoint */
        @media (max-width: 360px) {
          .xxs\\:w-28 {
            width: 7rem;
          }
          .xxs\\:h-28 {
            height: 7rem;
          }
          .xxs\\:text-4xl {
            font-size: 2.25rem;
          }
          .xxs\\:text-base {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ECGDashboard;