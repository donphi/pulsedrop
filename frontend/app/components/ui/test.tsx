'use client'

import React, { useLayoutEffect, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Image from 'next/image';

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
  const durationValueRef      = useRef<HTMLSpanElement>(null);
  const hrvValueRef           = useRef<HTMLSpanElement>(null);
  const heartRateZoneValueRef = useRef<HTMLSpanElement>(null);
  const recoveryRateValueRef  = useRef<HTMLSpanElement>(null);
  
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
  // Removed unused ref
  const wrapperRef = useRef<HTMLDivElement>(null);
  
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
  const durationTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const hrvTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const heartRateZoneTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const recoveryRateTimelineRef = useRef<gsap.core.Timeline | null>(null);
  
  // Ref for color transition timeline
  
  // NEW: Add a ref for color transition timeline
  const colorTransitionTimelineRef = useRef<gsap.core.Timeline | null>(null);
  
  // Drive wrapper/avatar border color off currentState for logical transitions
  useEffect(() => {
    const cfg = stateConfigs[currentState];
    const target = getECGColorImmediate(cfg.bpm);
    // Update the React-side "paint" so wrapper can read it
    setDisplayColor(target);
    // Trigger the GSAP tween
    transitionColors(target, Math.min(colorTransitionDuration, cfg.duration * 0.5));
  }, [currentState, colorTransitionDuration, stateConfigs, transitionColors]);
  
  // Use useLayoutEffect for initial styling to avoid flash
  useLayoutEffect(() => {
    if (avatarBorderRef.current)  avatarBorderRef.current.style.borderColor = displayColor;
    if (bpmColorRef.current)      bpmColorRef.current.style.color = displayColor;
    if (progressBarRef.current)   progressBarRef.current.style.backgroundColor = displayColor;
    if (wrapperRef.current)       wrapperRef.current.style.borderColor = displayColor;
  }, [displayColor]);  // repaint if initial color changes
  
  // Configuration for update frequencies (in seconds)
  const metricUpdateConfig = {
    duration: 0.01,    // Update duration every 0.01 seconds
    hrv: 0.5,         // Update HRV every 0.5 seconds
    heartRateZone: 0.5, // Update heart rate zone every 0.5 seconds
    recoveryRate: 1.0  // Update recovery rate every 1 second
  };
  
  // Simplified BPM update effect - just keep the ref in sync but don't trigger color changes
  useEffect(() => {
    currentBpmRef.current = currentBPM;
    startBpmThump();
  }, [currentBPM, startBpmThump]);
  
  // Function to transition colors smoothly - REFACTORED to use the duration parameter
  const transitionColors = (targetColor: string, duration: number) => {
    // Only start new transition if target color is different from current target
    if (targetColorRef.current !== targetColor) {
      targetColorRef.current = targetColor;
      
      // Update DOM refs directly instead of waiting for React state to trigger repaint
      if (avatarBorderRef.current) avatarBorderRef.current.style.borderColor = targetColor;
      if (bpmColorRef.current) bpmColorRef.current.style.color = targetColor;
      if (progressBarRef.current) progressBarRef.current.style.backgroundColor = targetColor;
      if (wrapperRef.current) wrapperRef.current.style.borderColor = targetColor;
      
      // Fire callback once per color transition
      onColorChange?.(targetColor);
      
      // Create a new timeline for color transitions
      const colorTl = gsap.timeline();
      
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
      
      // Store the timeline reference
      colorTransitionTimelineRef.current = colorTl;
      
      // Update React state ONCE per transition - not during tween
      setDisplayColor(targetColor);
    }
  };
  
  // Function to reset and animate progress bar
  const resetAndAnimateProgressBar = (duration: number, bpm: number) => {
    if (!progressBarRef.current) return;
    
    // Kill any existing animations immediately
    gsap.killTweensOf(progressBarRef.current);
    
    // Get color from BPM (handled by displayColor)
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
  }, [darkMode]);
  
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
    hrvTimelineRef.current?.kill();
    heartRateZoneTimelineRef.current?.kill();
    recoveryRateTimelineRef.current?.kill();
    
    const cfg = stateConfigs[state];
    const baseBPM = cfg.bpm;
    const beatDur = 60 / baseBPM;
    
    // Create local refs to track current values without using React state
    const metricValues = {
      duration: 0,
      hrv: cfg.hrv,
      heartRateZone: cfg.heartRateZone,
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
      }
    });
    beatTimelineRef.current = bpmTl;
    
    // Instead of using requestAnimationFrame for duration, use a GSAP timeline
    const durationTl = gsap.timeline({ repeat: -1 });
    durationTl.to(metricValues, {
      duration: 0.033,  // Update every ~33ms
      onUpdate: () => {
        metricValues.duration += 0.033;  // Increment by frame time
        if (durationValueRef.current) {
          durationValueRef.current.textContent = metricValues.duration.toFixed(1);
        }
      }
    });
    // 🔥 NEW: keep a ref so we can kill it on teardown
    durationTimelineRef.current = durationTl;
    
    // Create independent timeline for HRV updates
    const hrvTl = gsap.timeline({ repeat: -1 });
    hrvTl.to({}, {
      duration: metricUpdateConfig.hrv,
      onComplete: () => {
        metricValues.hrv = cfg.hrv + (Math.random() * 2 - 1);
        if (hrvValueRef.current) {
          hrvValueRef.current.textContent = metricValues.hrv.toFixed(1);
        }
      }
    });
    hrvTimelineRef.current = hrvTl;
    
    // Create independent timeline for Heart Rate Zone updates
    const heartRateZoneTl = gsap.timeline({ repeat: -1 });
    heartRateZoneTl.to({}, {
      duration: metricUpdateConfig.heartRateZone,
      onComplete: () => {
        metricValues.heartRateZone = cfg.heartRateZone + (Math.random() * 0.1 - 0.05);
        if (heartRateZoneValueRef.current) {
          heartRateZoneValueRef.current.textContent = metricValues.heartRateZone.toFixed(1);
        }
      }
    });
    heartRateZoneTimelineRef.current = heartRateZoneTl;
    
    // Create independent timeline for Recovery Rate updates
    const recoveryRateTl = gsap.timeline({ repeat: -1 });
    recoveryRateTl.to({}, {
      duration: metricUpdateConfig.recoveryRate,
      onComplete: () => {
        metricValues.recoveryRate = cfg.recoveryRate + (Math.random() * 0.2 - 0.1);
        if (recoveryRateValueRef.current) {
          recoveryRateValueRef.current.textContent = metricValues.recoveryRate.toFixed(1);
        }
      }
    });
    recoveryRateTimelineRef.current = recoveryRateTl;
  };
  
  // Initialize GSAP timeline and set up the cycle - ONLY ONCE
  useEffect(() => {
    const states: IntensityState[] = ['resting', 'start', 'exercise', 'intense'];
    
    // Calculate total duration dynamically from stateConfigs
    const totalDuration = Object.values(stateConfigs).reduce((sum, config) => sum + config.duration, 0);
    
    // IMPORTANT: Initialize color refs first before any animations
    const initState = initialState;
    currentColorRef.current = getECGColorImmediate(stateConfigs[initState].bpm);
    targetColorRef.current = currentColorRef.current;
    
    // Ensure the current BPM is set to the initial state's BPM
    setCurrentBPM(stateConfigs[initState].bpm);
    
    // Create new timeline
    const tl = gsap.timeline({
      repeat: -1,
      onRepeat: () => {
        setCurrentState('resting');
      }
    });
    
    // Create refs for stats elements that will be updated directly through DOM
    const durationRef = { current: 0 };
    const hrvRef = { current: stateConfigs[initialState].hrv };
    const heartRateZoneRef = { current: stateConfigs[initialState].heartRateZone };
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
          
          // Initial values for stats - just for the first render
          // After this, GSAP will directly update the DOM
          if (durationValueRef.current) durationValueRef.current.textContent = "0.0";
          if (hrvValueRef.current) hrvValueRef.current.textContent = cfg.hrv.toFixed(1);
          if (heartRateZoneValueRef.current) heartRateZoneValueRef.current.textContent = cfg.heartRateZone.toFixed(1);
          if (recoveryRateValueRef.current) recoveryRateValueRef.current.textContent = cfg.recoveryRate.toFixed(1);
          
          // Reset stats refs
          durationRef.current = 0;
          hrvRef.current = cfg.hrv;
          heartRateZoneRef.current = cfg.heartRateZone;
          recoveryRateRef.current = cfg.recoveryRate;
          
          // Start the three repeaters - all at once for instant state change
          startMetricUpdates(state);
          startBpmThump();
          startAvatarRings(state);
          
          // Reset and animate progress bar - use current color
          resetAndAnimateProgressBar(cfg.duration, cfg.bpm);
        },
        onUpdate: function() {
          const localProgress = (this.progress() || 0);
          
          // If we're approaching the end of this state, start transitioning BPM
          if (localProgress > 0.8 && nextState) {
            const t = (localProgress - 0.8) * 5; // 0 to 1 during the last 20% of the state
            
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
    
    // 🔥 single, consolidated cleanup - kill ALL timelines in one go
    return () => {
      [
        timelineRef.current,
        beatTimelineRef.current,
        durationTimelineRef.current,
        hrvTimelineRef.current,
        heartRateZoneTimelineRef.current,
        recoveryRateTimelineRef.current,
        colorTransitionTimelineRef.current
      ].forEach(tl => tl?.kill());
      
      // Store ref value to avoid cleanup issues
      const bpmTextElement = bpmTextRef.current;
      gsap.killTweensOf(bpmTextElement);
      gsap.killTweensOf(".ring");
    };
  }, [
    stateConfigs,
    cycleDuration,
    colorTransitionDuration,
    initialState,
    nextState,
    resetAndAnimateProgressBar,
    startAvatarRings,
    startBpmThump,
    startMetricUpdates,
    transitionColors
  ]);
  
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
  }, []);
  
  // Update grid when darkMode changes
  useEffect(() => {
    drawGrid();
  }, [darkMode]);
  
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
      
      const drawHeight = height * 0.8;
      const verticalCenter = height / 2;
      
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
        ctx.moveTo(ecgPointsRef.current[0].x, verticalCenter - (ecgPointsRef.current[0].y * drawHeight));
        
        for (let i = 1; i < ecgPointsRef.current.length; i++) {
          const point = ecgPointsRef.current[i];
          ctx.lineTo(point.x, verticalCenter - (point.y * drawHeight));
        }
        
        ctx.stroke();
        
        // Draw the leading circle at the drawing point (now at the beginning/left)
        const firstPoint = ecgPointsRef.current[0];
        ctx.beginPath();
        ctx.arc(firstPoint.x, verticalCenter - (firstPoint.y * drawHeight), 4, 0, Math.PI * 2);
        
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
    <div 
      ref={wrapperRef}
      className={`p-6 rounded-xl ${bgColor} ${textColor}`}
      style={{ borderColor: displayColor, borderWidth: '1px', borderStyle: 'solid' }}
    >
      {/* Header with Activity State and Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">{stateConfigs[currentState].label}</h2>
          <div className="text-sm font-medium">
            {nextState && `Next: ${stateConfigs[nextState].label}`}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-2 bg-neutral rounded-full overflow-hidden">
          <div 
            ref={progressBarRef}
            className="h-full rounded-full"
            style={{ backgroundColor: displayColor }} // Initial style
          />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6 items-start">
        {/* Avatar + BPM Display */}
        <div className={`col-span-1 ${cardBg} rounded-xl shadow-card p-4 flex flex-col items-center`}>
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
              className="w-32 h-32 rounded-full overflow-hidden relative z-10"
              style={{ 
                borderColor: displayColor, // Initial style
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
                  className="text-5xl font-bold tabular-nums"
                  style={{ color: displayColor }} // Initial style
                >
                  {currentBPM}
                </span>
                <span className={`ml-1 text-xl ${textColorSecondary} mb-1`}>bpm</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* ECG Display - with separate layers for grid and ECG line */}
        <div className={`col-span-2 ${cardBg} rounded-xl shadow-card overflow-hidden`}>
          <div className="p-4 h-64 relative">
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
      
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        {/* Duration - Simplified to static indicator */}
        <div className={`${cardBg} rounded-xl shadow-card p-4`}>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline">
              <span ref={durationValueRef} className="text-2xl font-semibold tabular-nums whitespace-nowrap">0.0</span>
              <span className={`ml-2 text-sm ${textColorSecondary}`}>sec</span>
            </div>
            {/* Static indicator */}
            <div className="text-sm px-2 py-1 rounded-full whitespace-nowrap bg-success-muted text-success">
              +0.5
            </div>
          </div>
          <div className={`mt-1 text-sm ${textColorSecondary}`}>Duration</div>
        </div>
        
        {/* HRV - Simplified to static indicator */}
        <div className={`${cardBg} rounded-xl shadow-card p-4`}>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline">
              <span ref={hrvValueRef} className="text-2xl font-semibold tabular-nums whitespace-nowrap">{stateConfigs[initialState].hrv.toFixed(1)}</span>
              <span className={`ml-2 text-sm ${textColorSecondary}`}>ms</span>
            </div>
            {/* Static indicator */}
            <div className="text-sm px-2 py-1 rounded-full whitespace-nowrap bg-success-muted text-success">
              +2.0
            </div>
          </div>
          <div className={`mt-1 text-sm ${textColorSecondary}`}>Heart Rate Variability</div>
        </div>
        
        {/* Heart Rate Zone - Simplified to static indicator */}
        <div className={`${cardBg} rounded-xl shadow-card p-4`}>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline">
              <span ref={heartRateZoneValueRef} className="text-2xl font-semibold tabular-nums whitespace-nowrap">{stateConfigs[initialState].heartRateZone.toFixed(1)}</span>
              <span className={`ml-2 text-sm ${textColorSecondary}`}>zone</span>
            </div>
            {/* Static indicator */}
            <div className="text-sm px-2 py-1 rounded-full whitespace-nowrap bg-success-muted text-success">
              +0.2
            </div>
          </div>
          <div className={`mt-1 text-sm ${textColorSecondary}`}>Heart Rate Zone</div>
        </div>
        
        {/* Recovery Rate - Simplified to static indicator */}
        <div className={`${cardBg} rounded-xl shadow-card p-4`}>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline">
              <span ref={recoveryRateValueRef} className="text-2xl font-semibold tabular-nums whitespace-nowrap">{stateConfigs[initialState].recoveryRate.toFixed(1)}</span>
              <span className={`ml-2 text-sm ${textColorSecondary}`}>%</span>
            </div>
            {/* Static indicator */}
            <div className="text-sm px-2 py-1 rounded-full whitespace-nowrap bg-success-muted text-success">
              +0.5
            </div>
          </div>
          <div className={`mt-1 text-sm ${textColorSecondary}`}>Recovery Rate</div>
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
      `}</style>
    </div>
  );
};

export default ECGDashboard;