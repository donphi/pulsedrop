"use client";
import PulseDashboard from '@/components/ui/PulseDashboard';
import { usePulseDemo } from '@/lib/usePulseDemo';

export default function AppPreview() {
  // Use the pulse demo hook with custom configuration
  const {
    bpm,
    peakBpm,
    recoveryDrop,
    duration,
    phase,
    athleteName,
    phaseProgress,
    hrv // Include HRV from the hook
  } = usePulseDemo({
    // Configuration options
    phaseDurations: {
      // Customize phase durations (in seconds)
      rest: 8, // Rest phase lasts 8 seconds
      "warm-up": 6, // Warm-up transitions over 6 seconds
      active: 10, // Active phase lasts 10 seconds
      sprint: 8, // Sprint phase lasts 8 seconds
      recovery: 12, // Recovery phase lasts 12 seconds
    },
    transitionSpeed: 0.08, // Speed of BPM transitions (higher = faster)
    athleteName: "Elite Cyclist", // Custom name for the athlete
  });

  // Calculate visual indicators for the current phase
  const getPhaseColor = () => {
    switch(phase) {
      case 'rest': return 'bg-primary-muted';
      case 'warm-up': return 'bg-ecg-normal';
      case 'active': return 'bg-ecg-moderate';
      case 'sprint': return 'bg-ecg-high';
      case 'recovery': return 'bg-primary';
      default: return 'bg-primary-muted';
    }
  };

  // Format the phase name for display
  const formatPhaseName = (name: string) => {
    return name.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="w-full h-full mx-auto flex flex-col space-y-4">
      {/* Phase indicator bar */}
      <div className="flex items-center space-x-2">
        <div className="text-sm text-mutedText">
          {formatPhaseName(phase)}
        </div>
        <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
          <div
            className={`h-full ${getPhaseColor()} transition-all duration-300 ease-out`}
            style={{ width: `${phaseProgress * 100}%` }}
          />
        </div>
      </div>
      {/* Main Pulse Dashboard with phase passed down for avatar selection */}
      <PulseDashboard
        bpm={bpm}
        peakBpm={peakBpm}
        recoveryDrop={recoveryDrop}
        duration={duration}
        cyclistName={athleteName}
        phase={phase} // Pass the current phase to select the right avatar
        hrv={hrv} // Pass HRV to the dashboard component
        className="flex-1" // Allow it to grow to fill available space
      />
    </div>
  );
}