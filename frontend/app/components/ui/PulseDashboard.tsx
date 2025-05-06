"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { motion } from "framer-motion";

// Import all avatar images
// You'll need to create these images and place them in your public/images directory
const avatarImages = {
  rest: "/images/cyclist-rest.jpg",
  warmUp: "/images/cyclist-warm-up.jpg",
  active: "/images/cyclist-active.jpg",
  sprint: "/images/cyclist-sprint.jpg",
  recovery: "/images/cyclist-recovery.jpg",
};

interface PulseDashboardProps {
  bpm?: number; // Current BPM
  peakBpm?: number; // Optional, will calculate from data if not provided
  recoveryDrop?: number; // Optional, will calculate from data if not provided
  duration?: number; // Duration in seconds
  className?: string;
  cyclistName?: string; // Name of the current cyclist
  phase?: string; // Current workout phase (rest, warm-up, active, sprint, recovery)
  hrv?: number; // Heart rate variability in ms
}

export default function PulseDashboard({
  bpm: providedBpm,
  peakBpm: providedPeakBpm,
  recoveryDrop: providedRecoveryDrop,
  duration: providedDuration = 5,
  className = "",
  cyclistName = "Elite Cyclist",
  phase = "rest",
  hrv: providedHrv,
}: PulseDashboardProps) {
  // Constants for heart rate simulation
  const MIN_BPM = 58;
  const MAX_BPM = 180;
  
  // Use refs for animation frames to prevent unnecessary re-renders
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataPointsRef = useRef<Array<{ x: number; y: number }>>([]);
  
  // State for animation and display
  const [displayBpm, setDisplayBpm] = useState(providedBpm || MIN_BPM);
  const [displayBpmVariation, setDisplayBpmVariation] = useState(0); // Small variation for realism
  const [currentPeakBpm, setCurrentPeakBpm] = useState(providedPeakBpm || providedBpm || MIN_BPM);
  const [elapsed, setElapsed] = useState(1);
  const [instantHrv, setInstantHrv] = useState(providedHrv || 45); // Instantaneous HRV calculation
  
  // Current BPM and derived values
  const bpm = providedBpm || displayBpm;
  const rrInterval = 60 / bpm; // Time between heartbeats in seconds
  
  // Determine which avatar image to use based on phase or BPM
  const getAvatarImage = () => {
    // First priority: use the provided phase if available
    if (phase) {
      switch(phase) {
        case 'rest': return avatarImages.rest;
        case 'warm-up': return avatarImages.warmUp;
        case 'active': return avatarImages.active;
        case 'sprint': return avatarImages.sprint;
        case 'recovery': return avatarImages.recovery;
        default: return avatarImages.rest; // Fallback
      }
    }
    
    // Otherwise determine based on BPM
    if (bpm < 70) return avatarImages.rest;
    if (bpm < 110) return avatarImages.warmUp;
    if (bpm < 140) return avatarImages.active;
    if (bpm < 160) return avatarImages.recovery;
    return avatarImages.sprint; // Highest intensity
  };
  
  // Get current avatar image
  const currentAvatarImage = getAvatarImage();
  
  // Calculate HRV (heart rate variability)
    const hrvMs = useMemo(() => {
        // Use provided HRV if available, otherwise calculate
        if (providedHrv !== undefined) return providedHrv;
        
        // Simplified HRV calculation - would be more accurate with real data
        const baseHrv = 45;
        const bpmFactor = Math.max(0, (80 - bpm) / 80); // HRV tends to decrease as heart rate increases
        return Math.round(baseHrv + (bpmFactor * 20));
    }, [bpm, providedHrv]);
  
  // Format time as mm:ss
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Add CSS variables needed for ECG colors
  useEffect(() => {
    // Add CSS variable for primary RGB values (needed for shadow effects)
    const rootStyle = document.documentElement.style;
    
    // Parse primary color and extract RGB values
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    
    // Default fallback values in case we can't parse
    let r = 252, g = 76, b = 2;
    
    // Try to parse the color
    if (primaryColor.startsWith('#')) {
      // Handle hex format
      const hex = primaryColor.substring(1);
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else if (primaryColor.startsWith('rgb')) {
      // Handle rgb format
      const rgbMatch = primaryColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        [, r, g, b] = rgbMatch.map(Number);
      }
    }
    
    // Set the CSS variable
    rootStyle.setProperty('--color-primary-rgb', `${r}, ${g}, ${b}`);
    
    // Add variables for different intensity heart rates
    rootStyle.setProperty('--color-ecg-normal', 'var(--color-primary)');
    rootStyle.setProperty('--color-ecg-moderate', 'var(--color-warning)');
    rootStyle.setProperty('--color-ecg-high', 'var(--color-error)');
  }, []);
  
  // Realistic BPM variation for natural look
  useEffect(() => {
    const updateBpmVariation = () => {
      // Add small random fluctuations to the BPM display
      setDisplayBpmVariation(Math.floor(Math.random() * 3) - 1); // -1, 0, or 1 variation
    };
    
    const intervalId = setInterval(updateBpmVariation, 800); // Update every 800ms
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Draw the ECG waveform on canvas using the stationary pen approach
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions and scaling for crisp rendering
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      // Reset data points when size changes
      dataPointsRef.current = [];
    };
    
    // Set up resize observer for responsive canvas
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    resizeObserver.observe(canvas);
    updateCanvasSize();
    
    // Constants for ECG drawing
    const GRID_COLOR = 'rgba(var(--color-primary-rgb), 0.05)';
    const BASELINE = canvas.height / 2;
    const VISIBLE_POINTS = 300; // Number of points to keep in the history
    const PEN_POSITION_X = canvas.width * 0.1; // Fixed pen position at 10% from left
    
    // Calculate amplitude and color based on BPM
    const getBpmAmplitude = (bpm: number) => {
      // Amplitude increases with BPM
      const baseAmplitude = canvas.height / 3;
      const intensityFactor = 1 + ((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 0.5;
      return baseAmplitude * intensityFactor;
    };
    
    // Get ECG color based on BPM (increases redness with higher BPM)
    const getEcgColor = (bpm: number) => {
      if (bpm < 70) {
        return 'var(--color-primary)'; // Normal color for resting heart rate
      } else if (bpm < 120) {
        // Transition to warning color
        const t = (bpm - 70) / 50; // Normalized value between 0-1
        return `rgb(252, ${Math.round(140 - 70 * t)}, ${Math.round(56 - 30 * t)})`; // Transition toward orange-red
      } else {
        // High heart rate - error color with intensity based on BPM
        const intensity = Math.min(1, (bpm - 120) / 60); // Normalized value for intensity
        return `rgb(${Math.round(239 + (255 - 239) * intensity)}, ${Math.round(68 - 68 * intensity)}, ${Math.round(68 - 68 * intensity)})`; // Transition to bright red
      }
    };
    
    // Get glow intensity based on BPM
    const getGlowIntensity = (bpm: number) => {
      // Increase glow/blur with higher BPM
      const baseBlur = 4;
      const maxBlur = 12;
      return baseBlur + ((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * (maxBlur - baseBlur);
    };
    
    // Draw grid lines
    const drawGrid = () => {
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      
      // Vertical grid lines
      const vGridCount = 12;
      const vGridSpacing = canvas.width / vGridCount;
      for (let i = 0; i <= vGridCount; i++) {
        const x = i * vGridSpacing;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      // Horizontal grid lines
      const hGridCount = 6;
      const hGridSpacing = canvas.height / hGridCount;
      for (let i = 0; i <= hGridCount; i++) {
        const y = i * hGridSpacing;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };
    
    // Generate ECG waveform point at a specific phase
    const getEcgPoint = (phase: number, baseline: number, amplitude: number, bpm: number) => {
      let value = 0;
      
      // Increase intensity of all waves with higher BPM
      const intensityFactor = 1 + ((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)) * 0.8;
      
      // P-wave (atrial depolarization)
      if (phase < 0.2) {
        const pHeight = 0.15 * intensityFactor; // Increase P-wave with higher BPM
        value += pHeight * Math.exp(-0.5 * Math.pow((phase - 0.1) / 0.025, 2));
      }
      
      // Q-wave (small negative deflection)
      if (phase >= 0.2 && phase < 0.24) {
        const qDepth = -0.05 * intensityFactor; // Deeper Q-wave with higher BPM
        value += qDepth * Math.exp(-0.5 * Math.pow((phase - 0.235) / 0.016, 2));
      }
      
      // R-wave (sharp upward spike)
      if (phase >= 0.24 && phase < 0.26) {
        const rHeight = 1.0 * intensityFactor; // Taller R-wave with higher BPM
        value += rHeight * Math.exp(-0.5 * Math.pow((phase - 0.25) / (0.01 - 0.001 * intensityFactor), 2)); // Also narrower with higher BPM
      }
      
      // S-wave (downward deflection)
      if (phase >= 0.26 && phase < 0.3) {
        const sDepth = -0.15 * intensityFactor; // Deeper S-wave with higher BPM
        value += sDepth * Math.exp(-0.5 * Math.pow((phase - 0.28) / 0.012, 2));
      }
      
      // T-wave (repolarization)
      if (phase >= 0.3 && phase < 0.7) {
        // T-wave gets shorter but wider with higher BPM
        const tHeight = 0.35 * Math.max(0.6, 1 - (intensityFactor - 1) * 0.3);
        const tWidth = 0.04 * (1 + (intensityFactor - 1) * 0.2);
        value += tHeight * Math.exp(-0.5 * Math.pow((phase - 0.45) / tWidth, 2));
      }
      
      // Add subtle baseline wander for realism - more pronounced at higher BPM
      const wanderMagnitude = 0.02 * intensityFactor;
      value += wanderMagnitude * Math.sin(2 * Math.PI * phase * 3);
      
      // Add very small random noise for realism - more at higher BPM
      const noiseMagnitude = 0.01 * intensityFactor;
      value += (Math.random() - 0.5) * noiseMagnitude;
      
      // Convert normalized value to canvas coordinates
      return baseline - (value * amplitude);
    };
    
    // Animation variables
    let prevTime = 0;
    let progress = 0;
    
    // Clear canvas
    const clearCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid();
    };
    
    // Draw frame by frame (stationary pen method)
    const drawFrame = (timestamp: number) => {
      if (!ctx) return;
      
      // Calculate delta time for smooth animation regardless of frame rate
      const deltaTime = prevTime ? (timestamp - prevTime) / 1000 : 0.016;
      prevTime = timestamp;
      
      // Get amplitude and color based on current BPM
      const amplitude = getBpmAmplitude(bpm);
      const ecgColor = getEcgColor(bpm);
      const glowIntensity = getGlowIntensity(bpm);
      
      // Clear canvas and redraw grid
      clearCanvas();
      
      // Update progress (phase within the heartbeat cycle)
      progress += deltaTime / rrInterval;
      progress = progress % 1;
      
      // Calculate new Y position for the current phase
      const newY = getEcgPoint(progress, BASELINE, amplitude, bpm);
      
      // Add new point to the data array
      dataPointsRef.current.push({ x: PEN_POSITION_X, y: newY });
      
      // Keep only the last VISIBLE_POINTS points
      if (dataPointsRef.current.length > VISIBLE_POINTS) {
        dataPointsRef.current.shift();
      }
      
      // Shift all existing points to the right (pan effect)
      const shiftAmount = (canvas.width - PEN_POSITION_X) / (VISIBLE_POINTS - 1);
      for (let i = 0; i < dataPointsRef.current.length - 1; i++) {
        dataPointsRef.current[i].x += shiftAmount * deltaTime * 60; // Smooth panning
      }
      
      // Remove points that have moved off-screen
      dataPointsRef.current = dataPointsRef.current.filter(point => point.x <= canvas.width);
      
      // Draw the ECG line
      if (dataPointsRef.current.length > 1) {
        ctx.beginPath();
        ctx.moveTo(dataPointsRef.current[0].x, dataPointsRef.current[0].y);
        
        for (let i = 1; i < dataPointsRef.current.length; i++) {
          ctx.lineTo(dataPointsRef.current[i].x, dataPointsRef.current[i].y);
        }
        
        // Style the ECG line
        ctx.strokeStyle = ecgColor;
        ctx.lineWidth = 3.0; // Thicker line
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        // Apply shadow for glow effect
        ctx.shadowColor = ecgColor.replace('rgb', 'rgba').replace(')', ', 0.5)');
        ctx.shadowBlur = glowIntensity;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.stroke();
      }
      
      // Calculate instantaneous HRV based on variation in ECG points
      if (dataPointsRef.current.length > 10) {
        const lastPoints = dataPointsRef.current.slice(-10);
        const yValues = lastPoints.map(p => p.y);
        const variance = calculateVariance(yValues);
        const newHrv = Math.round(45 + variance * 10);
        setInstantHrv(prevHrv => Math.round(prevHrv * 0.9 + newHrv * 0.1)); // Smooth transitions
      }
      
      // Sync BPM display with ECG
      setDisplayBpm(prev => {
        const target = providedBpm || MIN_BPM;
        // Smooth transition to target BPM
        return Math.round(prev + (target - prev) * 0.1);
      });
      
      // Update peak BPM if needed
      if (displayBpm > currentPeakBpm) {
        setCurrentPeakBpm(displayBpm);
      }
      
      // Update elapsed time
      setElapsed(prev => prev + deltaTime);
      
      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(drawFrame);
    };
    
    // Helper function to calculate variance for HRV
    const calculateVariance = (values: number[]): number => {
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
      return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    };
    
    // Start animation
    animationFrameRef.current = requestAnimationFrame(drawFrame);
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [bpm, rrInterval, providedBpm, displayBpm, currentPeakBpm, MIN_BPM, MAX_BPM]);
  
  // Recovery drop calculation with increased sensitivity
  const recoveryDrop = providedRecoveryDrop || Math.max(0, Math.round(currentPeakBpm - displayBpm));
  
  // Display duration
  const displayDuration = providedDuration !== undefined ? providedDuration : elapsed;
  
  // Use the calculated hrvMs value instead of instantHrv when providedHrv is not available
  const displayHrv = providedHrv !== undefined 
  ? providedHrv 
  : Math.round((hrvMs * 0.3) + (instantHrv * 0.7)); // Weighted average, favoring the animated value
  
  // Stats for display grid
  const stats = [
    {
      name: "Peak BPM",
      stat: Math.round(providedPeakBpm || currentPeakBpm),
      previousStat: 0,
      change: `${Math.round(((providedPeakBpm || currentPeakBpm) - MIN_BPM) / MIN_BPM * 100)}%`,
      changeType: "increase" as const,
    },
    {
      name: "Recovery Drop",
      stat: recoveryDrop,
      previousStat: 0,
      change: recoveryDrop > 0 ? `${Math.round((recoveryDrop / (providedPeakBpm || currentPeakBpm)) * 100)}%` : "Stable",
      changeType: "decrease" as const,
    },
    {
      name: "Duration",
      stat: typeof providedDuration === 'number' ? `${providedDuration} s` : formatDuration(Math.floor(displayDuration)),
      previousStat: "",
      change: "",
      changeType: "increase" as const,
    },
    {
        name: "HRV",
        stat: `${displayHrv} ms`,
        previousStat: "",
        change: displayHrv > 50 ? "Excellent" : displayHrv > 30 ? "Good" : "Low",
        changeType: "increase" as const,
      },
  ];

  return (
    <div className={`bg-card p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-card space-y-4 sm:space-y-6 w-full h-full flex flex-col ${className}`}>
      {/* Avatar & BPM */}
      <div className="flex items-center justify-between">
        <div className="relative flex items-center">
          <div className="relative">
            {/* Pulsing effect around avatar using primary colors */}
            <motion.div 
              animate={{ 
                scale: [1, 1.15, 1], 
                opacity: [0.5, 0.3, 0.5] 
              }}
              transition={{ 
                duration: rrInterval,
                repeat: Infinity,
                ease: [0.17, 0.67, 0.83, 0.67]
              }}
              className="absolute inset-0 rounded-full bg-primary opacity-30"
            />
            <Image
              src={currentAvatarImage}
              alt="Athlete avatar"
              width={48}
              height={48}
              className="rounded-full ring-2 ring-primary relative z-10 object-cover"
            />
          </div>
          <div className="ml-3 sm:ml-4">
            <div className="text-sm font-medium text-mutedText">{cyclistName}</div>
            <div className="flex items-baseline space-x-1">
              <div className="relative">
                <motion.span 
                  className={`font-bold ${bpm < 70 ? "text-3xl sm:text-4xl text-primary" : bpm < 120 ? "text-3xl sm:text-4xl text-warning" : "text-3xl sm:text-4xl text-error"}`}
                  animate={{ 
                    scale: [1, 1.15, 1.05, 1.02, 1], 
                    opacity: [0.9, 1, 0.95, 0.98, 0.9], 
                  }}
                  transition={{ 
                    duration: rrInterval,
                    repeat: Infinity,
                    ease: [0.04, 0.62, 0.23, 0.98],
                    times: [0, 0.1, 0.2, 0.5, 1]
                  }}
                  key={`bpm-${bpm}`}
                  style={{ 
                    display: 'inline-block',
                    transformOrigin: 'center center',
                  }}
                >
                  {/* Add small realistic variation */}
                  {displayBpm + displayBpmVariation}
                </motion.span>
              </div>
              <span className="text-base sm:text-lg text-mutedText">BPM</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* ECG Line Chart with real-time drawing animation - using Canvas for better performance */}
      <div className="h-28 sm:h-36 flex-grow bg-background rounded-lg overflow-hidden relative">
        {/* Canvas for drawing ECG */}
        <canvas 
          ref={canvasRef} 
          className="w-full h-full filter drop-shadow-primary-pulse-opacity"
          style={{
            filter: 'drop-shadow(0 0 4px var(--color-primary-pulse-opacity))'
          }}
        />
      </div>
      
      {/* Stats Grid - Responsive layout */}
      <dl className="grid grid-cols-2 gap-3 sm:gap-4 mt-auto">
        {stats.map((item) => (
          <div key={item.name} className="space-y-1 bg-background p-2 sm:p-3 rounded-lg">
            <dt className="text-sm sm:text-base font-medium text-mutedText">{item.name}</dt>
            <dd className="flex flex-col">
              <span className="text-base sm:text-xl font-semibold text-foreground">
                {item.stat}
              </span>
              
              {item.change && (
                <div
                  className={clsx(
                    item.changeType === "increase"
                      ? "bg-success-muted text-success"
                      : "bg-error-muted text-error",
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1 self-start"
                  )}
                >
                  {item.changeType === "increase" ? (
                    <ArrowUpIcon className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-3 w-3 mr-1" />
                  )}
                  <span className="sr-only">
                    {item.changeType === "increase" ? "Increased" : "Decreased"} by
                  </span>
                  {item.change}
                </div>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}