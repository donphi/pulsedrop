'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import ECGDashboard, { IntensityState } from '@/components/ui/ECGDashboard'

interface DashboardWrapperProps {
  darkMode?: boolean;
  // Prop to control color transition duration
  colorTransitionDuration?: number;
  // Callback to notify parent of color changes
  onColorChange?: (color: string) => void;
}

const DashboardWrapper: React.FC<DashboardWrapperProps> = ({ 
  darkMode = false,
  colorTransitionDuration = 2.5, // Default smooth transition of 2.5 seconds
  onColorChange
}) => {
  // Capture the current color for parent container styling
  const [currentColor, setCurrentColor] = useState<string>('#22c55e'); // Default to green
  
  // Ref for the container element to apply color transitions
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Define a callback function to receive color updates from ECGDashboard
  const handleColorChange = (newColor: string) => {
    setCurrentColor(newColor);
    
    // Apply the color to the container with smooth transition
    if (containerRef.current) {
      // Apply border color with the same transition as internal elements
      containerRef.current.style.borderColor = newColor;
    }
    
    // Forward the color change to the parent component if callback exists
    if (onColorChange) {
      onColorChange(newColor);
    }
  };

  // Memoize the state configs to prevent recreation on every render
  const stateConfigs = useMemo<Record<IntensityState, any>>(() => ({
    resting: {
      label: 'Resting',
      bpm: 58,
      color: 'var(--color-ecg-normal)',
      avatar: '/avatars/resting-cyclist.jpg',
      duration: 10,
      hrv: 65.0,
      heartRateZone: 1.0,
      recoveryRate: 95.0,
    },
    start: {
      label: 'Starting Effort',
      bpm: 90,
      color: 'var(--color-ecg-moderate)',
      avatar: '/avatars/start-cyclist.jpg',
      duration: 10,
      hrv: 45.0,
      heartRateZone: 2.0,
      recoveryRate: 82.0,
    },
    exercise: {
      label: 'Steady Exercise',
      bpm: 120,
      color: 'var(--color-primary)',
      avatar: '/avatars/exersize-cyclist.jpg',
      duration: 10,
      hrv: 25.0,
      heartRateZone: 3.5,
      recoveryRate: 68.0,
    },
    intense: {
      label: 'Intense Effort',
      bpm: 170,
      color: 'var(--color-ecg-high)',
      avatar: '/avatars/intense-cyclist.jpg',
      duration: 10,
      hrv: 12.0,
      heartRateZone: 4.8,
      recoveryRate: 45.0,
    },
  }), []); // Empty dependency array means this only runs once

  // Memoize the cycle duration calculation to prevent recreation on every render
  const cycleDuration = useMemo(() => 
    Object.values(stateConfigs).reduce((acc, cfg) => acc + cfg.duration, 0),
    [stateConfigs]
  );

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl shadow-xl ${darkMode ? 'bg-background' : 'bg-card'}`}
    >
      <ECGDashboard
        initialState="resting"
        stateConfigs={stateConfigs}
        cycleDuration={cycleDuration}
        darkMode={darkMode}
        colorTransitionDuration={colorTransitionDuration}
        onColorChange={handleColorChange}
      />
    </div>
  )
}

export default DashboardWrapper