'use client'

import React, { useEffect, useRef, useState } from 'react';
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
}

// Component that manages the full ECG dashboard
const ECGDashboard: React.FC<ECGDashboardProps> = ({
  initialState = 'resting',
  stateConfigs,
  cycleDuration,
  darkMode = false
}) => {
  const [currentState, setCurrentState] = useState<IntensityState>(initialState);
  const [nextState, setNextState] = useState<IntensityState | null>(null);
  const [currentBPM, setCurrentBPM] = useState(stateConfigs[initialState].bpm);
  const [currentStats, setCurrentStats] = useState({
    duration: 0,
    hrv: stateConfigs[initialState].hrv,
    heartRateZone: stateConfigs[initialState].heartRateZone,
    recoveryRate: stateConfigs[initialState].recoveryRate
  });
  
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
  const bpmFlluctuationEnabledRef = useRef<boolean>(true);
  
  // Refs for the pulse rings
  const pulseContainerRef = useRef<HTMLDivElement>(null);
  
  // Add a ref for the progress bar
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Update refs when state changes
  useEffect(() => {
    // Update current BPM ref
    currentBpmRef.current = currentBPM;
    
    // Update BPM text thump animation when BPM changes
    startBpmThump();
  }, [currentBPM]);
  
  // Function to reset and animate progress bar
  const resetAndAnimateProgressBar = (duration: number, color: string) => {
    if (!progressBarRef.current) return;
    
    // FIX 2: Resolve CSS variables if needed
    let resolvedColor = color;
    if (color.startsWith('var(')) {
      resolvedColor = getComputedStyle(document.documentElement)
        .getPropertyValue(color.substring(4, color.length - 1))
        .trim();
    }

    // Kill any existing animations immediately
    gsap.killTweensOf(progressBarRef.current);
    
    gsap.set(progressBarRef.current, {
      width: "0%",
      backgroundColor: resolvedColor,
      opacity: 1 //set the opacity of the progress bar
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
    
    // FIX 5: Use string-based eases instead of importing Bounce and Power3
    gsap.to(bpmTextRef.current, {
      scale: 1.15,
      duration: 0.1,
      yoyo: true,
      repeat: -1,
      ease: isSlow ? "bounce.out" : "power1.inOut",
      repeatDelay: beatDur - 0.1
    });
  };
  
  // Function to start avatar rings animation
  const startAvatarRings = (state: IntensityState) => {
    const cfg = stateConfigs[state];
    const base = cfg.bpm;
    const beatDur = 60 / base;
    
    // FIX 4: Use staggered animation for pulse rings
    // clear & recreate
    const ctr = pulseContainerRef.current!;
    ctr.innerHTML = "";
    
    const [r1, r2] = [document.createElement("div"), document.createElement("div")];
    
    // Use the same class name for both rings to enable staggered animation
    r1.className = r2.className = "ring pulse-ring";
    
    [r1, r2].forEach(r => {
      r.style.color = cfg.color;
      r.style.borderColor = cfg.color;
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
  
  // Function to start beat stats animation
  const startBeatStats = (state: IntensityState) => {
    // Kill old timeline
    beatTimelineRef.current?.kill();
    
    const cfg = stateConfigs[state];
    const baseBPM = cfg.bpm;
    const beatDur = 60 / baseBPM;
    
    // Create a new timeline with repeat
    const tl = gsap.timeline({ repeat: -1 });
    
    // Add a tween to the timeline
    tl.to({}, {
      duration: beatDur,
      onComplete: () => {
        // 1) jitter BPM ±2 around that base
        const flop = Math.random() * 4 - 2;
        const nextBPM = Math.round(
          Math.max(baseBPM - 2, Math.min(baseBPM + 2, baseBPM + flop))
        );
        setCurrentBPM(nextBPM);
        // 2) reset & update stats from base values
        setCurrentStats(s => ({
          duration: s.duration + beatDur,
          hrv: cfg.hrv + (Math.random() * 2 - 1),
          heartRateZone: cfg.heartRateZone + (Math.random() * 0.1 - 0.05),
          recoveryRate: cfg.recoveryRate + (Math.random() * 0.2 - 0.1)
        }));
      }
    });
    
    // Store the timeline
    beatTimelineRef.current = tl;
  };
  
  // Initialize GSAP timeline and set up the cycle - ONLY ONCE
  useEffect(() => {
    const states: IntensityState[] = ['resting', 'start', 'exercise', 'intense'];
    
    // FIX 1: Calculate total duration dynamically from stateConfigs
    const totalDuration = Object.values(stateConfigs).reduce((sum, config) => sum + config.duration, 0);
    
    // Create new timeline
    const tl = gsap.timeline({
      repeat: -1,
      onRepeat: () => {
        setCurrentState('resting');
      }
    });
    
    // Add each state to the timeline
    states.forEach((state, i) => {
      const stateDuration = stateConfigs[state].duration;
      const cfg = stateConfigs[state];
      
      // Add this state to timeline
      tl.to({}, stateDuration, {
        onStart: () => {
          setCurrentState(state);
          
          // Determine next state
          const nextIndex = (i + 1) % states.length;
          setNextState(states[nextIndex]);
          
          // Reset stats to match the current state base values
          setCurrentStats({
            duration: 0,
            hrv: cfg.hrv,
            heartRateZone: cfg.heartRateZone,
            recoveryRate: cfg.recoveryRate
          });
          
          // Start the three repeaters - all at once for instant state change
          startBeatStats(state);
          startBpmThump();
          startAvatarRings(state);
          
          // Reset and animate progress bar
          resetAndAnimateProgressBar(cfg.duration, cfg.color);
        },
        onUpdate: function() {
          const localProgress = (this.progress() || 0);
          
          // If we're approaching the end of this state, start transitioning
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
    
    // Setup initial animations
    const initState = initialState;
    startBeatStats(initState);
    startBpmThump();
    startAvatarRings(initState);
    resetAndAnimateProgressBar(stateConfigs[initState].duration, stateConfigs[initState].color);
    
    // Clean up
    return () => {
      tl.kill();
      if (beatTimelineRef.current) {
        beatTimelineRef.current.kill();
      }
      gsap.killTweensOf(bpmTextRef.current);
      gsap.killTweensOf(".ring");
    };
  }, [stateConfigs, cycleDuration]); // CRITICAL: Don't include currentState or nextState
  
  // Draw the static grid to a separate canvas - only once or when resizing/darkMode changes
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
    ctx.strokeStyle = darkModeRef.current ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let x = 0; x < width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      
      // Fade out at the edges - make very transparent
      const distanceToEdge = Math.min(x, width - x);
      const alpha = Math.min(0.02, 0.02 * (distanceToEdge / 100));
      ctx.strokeStyle = darkModeRef.current ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
      
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      
      // Fade out at the edges - make very transparent
      const distanceToEdge = Math.min(y, height - y);
      const alpha = Math.min(0.02, 0.02 * (distanceToEdge / 100));
      ctx.strokeStyle = darkModeRef.current ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
      
      ctx.stroke();
    }
  };
  
  // Handle canvas resizing with ResizeObserver - FIXED for Safari
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
  
  // Helper function to get ECG color based on BPM
  const getECGColor = (bpm: number): string => {
    // For canvas operations, we need to use a fixed color instead of CSS variables
    const safeBpm = Math.max(30, Math.min(220, bpm));
    
    if (safeBpm <= 58) {
      return '#22c55e'; // Normal - green
    } else if (safeBpm >= 180) {
      return '#ef4444'; // High - red
    } else if (safeBpm <= 120) {
      const percentage = Math.floor(((safeBpm - 58) / (120 - 58)) * 100);
      if (percentage < 33) return '#22c55e'; // Normal - green
      if (percentage < 66) return '#f59e0b'; // Moderate - yellow
      return '#FC4C02'; // Primary - orange
    } else {
      const percentage = Math.floor(((safeBpm - 120) / (180 - 120)) * 100);
      if (percentage < 33) return '#FC4C02'; // Primary - orange
      if (percentage < 66) return '#f59e0b'; // Warning - yellow
      return '#ef4444'; // High - red
    }
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
        // Get the current BPM from ref to avoid re-renders
        const bpm = currentBpmRef.current;
        const computedColor = getECGColor(bpm);
        
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
  
  // Calculate if a stat is increasing or decreasing
  const getChangeType = (current: number, previous: number): 'increase' | 'decrease' | 'neutral' => {
    const diff = current - previous;
    if (Math.abs(diff) < 0.01) return 'neutral';
    return diff > 0 ? 'increase' : 'decrease';
  };
  
  // Classes for dark/light mode using tailwind variables
  const bgColor = darkMode ? 'bg-background' : 'bg-card';
  const textColor = darkMode ? 'text-foreground' : 'text-foreground';
  const textColorSecondary = darkMode ? 'text-mutedText' : 'text-mutedText';
  const cardBg = darkMode ? 'bg-card' : 'bg-card';
  
  return (
    <div className={`p-6 rounded-xl ${bgColor} ${textColor}`}>
      {/* Header with Activity State and Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">{stateConfigs[currentState].label}</h2>
          <div className="text-sm font-medium">
            {nextState && `Next: ${stateConfigs[nextState].label}`}
          </div>
        </div>
        
        {/* Progress bar - FIX 3: Remove inline style binding */}
        <div className="w-full h-2 bg-neutral rounded-full overflow-hidden">
          <div 
            ref={progressBarRef}
            className="h-full rounded-full"
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
              className="w-32 h-32 rounded-full overflow-hidden relative z-10"
              style={{ borderColor: getECGColor(currentBPM), border: '5px solid' }}
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
                  className="text-5xl font-bold tabular-nums"
                  style={{ color: getECGColor(currentBPM) }}
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
      
      {/* Stats Cards - keeping original layout */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        {/* Duration */}
        <div className={`${cardBg} rounded-xl shadow-card p-4`}>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline">
              <span className="text-2xl font-semibold tabular-nums whitespace-nowrap">{currentStats.duration.toFixed(1)}</span>
              <span className={`ml-2 text-sm ${textColorSecondary}`}>min</span>
            </div>
            <div className={`text-sm px-2 py-1 rounded-full whitespace-nowrap ${
              getChangeType(currentStats.duration, currentStats.duration - 0.5) === 'increase' 
                ? 'bg-success-muted text-success' 
                : 'bg-error-muted text-error'
            }`}>
              {getChangeType(currentStats.duration, currentStats.duration - 0.5) === 'increase' ? '+' : ''}
              {(currentStats.duration - (currentStats.duration - 0.5)).toFixed(1)}
            </div>
          </div>
          <div className={`mt-1 text-sm ${textColorSecondary}`}>Duration</div>
        </div>
        
        {/* HRV */}
        <div className={`${cardBg} rounded-xl shadow-card p-4`}>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline">
              <span className="text-2xl font-semibold tabular-nums whitespace-nowrap">{currentStats.hrv.toFixed(1)}</span>
              <span className={`ml-2 text-sm ${textColorSecondary}`}>ms</span>
            </div>
            <div className={`text-sm px-2 py-1 rounded-full whitespace-nowrap ${
              getChangeType(currentStats.hrv, currentStats.hrv - 2) === 'increase' 
                ? 'bg-success-muted text-success' 
                : 'bg-error-muted text-error'
            }`}>
              {getChangeType(currentStats.hrv, currentStats.hrv - 2) === 'increase' ? '+' : ''}
              {(currentStats.hrv - (currentStats.hrv - 2)).toFixed(1)}
            </div>
          </div>
          <div className={`mt-1 text-sm ${textColorSecondary}`}>Heart Rate Variability</div>
        </div>
        
        {/* Heart Rate Zone */}
        <div className={`${cardBg} rounded-xl shadow-card p-4`}>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline">
              <span className="text-2xl font-semibold tabular-nums whitespace-nowrap">{currentStats.heartRateZone.toFixed(1)}</span>
              <span className={`ml-2 text-sm ${textColorSecondary}`}>zone</span>
            </div>
            <div className={`text-sm px-2 py-1 rounded-full whitespace-nowrap ${
              getChangeType(currentStats.heartRateZone, currentStats.heartRateZone - 0.2) === 'increase' 
                ? 'bg-success-muted text-success' 
                : 'bg-error-muted text-error'
            }`}>
              {getChangeType(currentStats.heartRateZone, currentStats.heartRateZone - 0.2) === 'increase' ? '+' : ''}
              {(currentStats.heartRateZone - (currentStats.heartRateZone - 0.2)).toFixed(1)}
            </div>
          </div>
          <div className={`mt-1 text-sm ${textColorSecondary}`}>Heart Rate Zone</div>
        </div>
        
        {/* Recovery Rate */}
        <div className={`${cardBg} rounded-xl shadow-card p-4`}>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline">
              <span className="text-2xl font-semibold tabular-nums whitespace-nowrap">{currentStats.recoveryRate.toFixed(1)}</span>
              <span className={`ml-2 text-sm ${textColorSecondary}`}>%</span>
            </div>
            <div className={`text-sm px-2 py-1 rounded-full whitespace-nowrap ${
              getChangeType(currentStats.recoveryRate, currentStats.recoveryRate - 0.5) === 'increase' 
                ? 'bg-success-muted text-success' 
                : 'bg-error-muted text-error'
            }`}>
              {getChangeType(currentStats.recoveryRate, currentStats.recoveryRate - 0.5) === 'increase' ? '+' : ''}
              {(currentStats.recoveryRate - (currentStats.recoveryRate - 0.5)).toFixed(1)}
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