"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// Athlete profile
const ATHLETE = {
  name: "Elite Cyclist",
  restingBpm: 58,
  peakBpm: 175,
  recoveryRate: 15, // BPM per minute recovery rate
};

// Workout phases with durations
const WORKOUT_PHASES = [
  { name: "rest", durationSeconds: 10, targetBpmPercentage: 0 }, // % of max BPM range
  { name: "warm-up", durationSeconds: 10, targetBpmPercentage: 0.5 },
  { name: "active", durationSeconds: 15, targetBpmPercentage: 0.75 },
  { name: "sprint", durationSeconds: 10, targetBpmPercentage: 1.0 },
  { name: "recovery", durationSeconds: 15, targetBpmPercentage: 0.3 },
];

export interface PulseDemoConfig {
  // Customize workout parameters
  phaseDurations?: Record<string, number>; // Override durations for specific phases
  transitionSpeed?: number; // 0-1, how quickly to transition between phases (1 = instant)
  athleteName?: string; // Optional custom name for the athlete
}

export function usePulseDemo(config?: PulseDemoConfig) {
  // Configuration with defaults
  const phaseDurations = useMemo(() => config?.phaseDurations || {}, [config?.phaseDurations]);
  const transitionSpeed = useMemo(() => config?.transitionSpeed || 0.05, [config?.transitionSpeed]);
  const athleteName = useMemo(() => config?.athleteName || ATHLETE.name, [config?.athleteName]);
  
  // State
  const [bpm, setBpm] = useState(ATHLETE.restingBpm);
  const [peakBpm, setPeakBpm] = useState(ATHLETE.restingBpm);
  const [recoveryDrop, setRecoveryDrop] = useState(0);
  const [duration, setDuration] = useState(0);
  const [phase, setPhase] = useState<string>(WORKOUT_PHASES[0].name);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0); // 0-1 progress through current phase
  const [hrv, setHrv] = useState(45); // Added HRV state for tracking heart rate variability
  
  // Refs for animation timing
  const startTimeRef = useRef<number | null>(null);
  const phaseStartTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Get current phase data with custom duration if provided
  const getCurrentPhase = useCallback(() => {
    const basePhase = WORKOUT_PHASES[phaseIndex];
    return {
      ...basePhase,
      durationSeconds: phaseDurations[basePhase.name] || basePhase.durationSeconds
    };
  }, [phaseIndex, phaseDurations]);
  
  // Calculate target BPM for current phase
  const getTargetBpm = useCallback(() => {
    const currentPhase = getCurrentPhase();
    const bpmRange = ATHLETE.peakBpm - ATHLETE.restingBpm;
    return Math.round(ATHLETE.restingBpm + (bpmRange * currentPhase.targetBpmPercentage));
  }, [getCurrentPhase]);
  
  // Smooth transition to target BPM
  const updateBpm = useCallback((targetBpm: number, progress: number) => {
    setBpm(prevBpm => {
      // Apply easing to make the transition natural
      const easedProgress = Math.min(1, progress / transitionSpeed);
      const newBpm = prevBpm + (targetBpm - prevBpm) * easedProgress;
      
      // Calculate HRV based on BPM (simplified model)
      // HRV tends to be higher at lower heart rates and lower at higher heart rates
      const bpmRatio = (newBpm - ATHLETE.restingBpm) / (ATHLETE.peakBpm - ATHLETE.restingBpm);
      const newHrv = Math.round(70 - (bpmRatio * 40)); // HRV range from ~30ms (high intensity) to ~70ms (rest)
      setHrv(newHrv);
      
      return Math.round(newBpm);
    });
  }, [transitionSpeed]);
  
  // Animation loop
  useEffect(() => {
    // Initialize start time if not set
    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now();
      phaseStartTimeRef.current = performance.now();
    }
    
    const animate = (timestamp: number) => {
      const currentPhase = getCurrentPhase();
      const targetBpm = getTargetBpm();
      
      // Calculate overall duration
      const elapsedTotalMs = startTimeRef.current ? timestamp - startTimeRef.current : 0;
      setDuration(elapsedTotalMs / 1000);
      
      // Calculate phase duration and progress
      const elapsedPhaseMs = phaseStartTimeRef.current ? timestamp - phaseStartTimeRef.current : 0;
      const phaseProgressRatio = Math.min(1, elapsedPhaseMs / (currentPhase.durationSeconds * 1000));
      setPhaseProgress(phaseProgressRatio);
      
      // Update BPM toward target with smooth transition
      updateBpm(targetBpm, phaseProgressRatio);
      
      // Track peak BPM
      setPeakBpm(prev => Math.max(prev, bpm));
      
      // Update recovery drop during recovery phase
      if (currentPhase.name === "recovery") {
        setRecoveryDrop(Math.round(peakBpm - bpm));
      }
      
      // Phase transition
      if (phaseProgressRatio >= 1) {
        // Move to next phase
        const nextPhaseIndex = (phaseIndex + 1) % WORKOUT_PHASES.length;
        
        // Reset peak BPM at the start of a new cycle
        if (nextPhaseIndex === 0) {
          setPeakBpm(ATHLETE.restingBpm);
        }
        
        // Update phase
        setPhaseIndex(nextPhaseIndex);
        setPhase(WORKOUT_PHASES[nextPhaseIndex].name);
        phaseStartTimeRef.current = timestamp;
      }
      
      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [bpm, peakBpm, phaseIndex, getCurrentPhase, getTargetBpm, updateBpm]);
  
  return {
    bpm,
    peakBpm,
    recoveryDrop,
    duration,
    phase,
    phaseProgress,
    athleteName,
    hrv, // Added HRV to the return value
    currentPhase: getCurrentPhase(),
  };
}