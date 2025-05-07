'use client'

import React from 'react'
import ECGDashboard, { IntensityState } from '@/components/ui/ECGDashboard'

interface DashboardWrapperProps {
  darkMode?: boolean
}

const DashboardWrapper: React.FC<DashboardWrapperProps> = ({ darkMode = false }) => {
  const stateConfigs: Record<IntensityState, any> = {
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
      avatar: '/avatars/exercise-cyclist.jpg',
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
  }

  // derive total cycleDuration so it always matches sum of durations
  const cycleDuration = Object.values(stateConfigs)
    .reduce((acc, cfg) => acc + cfg.duration, 0)

  return (
    <div className={`relative overflow-hidden rounded-2xl shadow-xl ${darkMode ? 'bg-background' : 'bg-card'}`}>
      <ECGDashboard
        initialState="resting"          // can be overridden if needed
        stateConfigs={stateConfigs}
        cycleDuration={cycleDuration}
        darkMode={darkMode}
      />
    </div>
  )
}

export default DashboardWrapper