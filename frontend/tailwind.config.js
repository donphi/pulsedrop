// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.tsx',
    './components/**/*.tsx',
  ],
  theme: {
    extend: {
      // ──────────────────────────────────────────────────────────────────────
      // COLOR PALETTE
      // ──────────────────────────────────────────────────────────────────────
      colors: {
        // Semantic tokens
        background:        'var(--color-background)',
        card:              'var(--color-card)',
        cardForeground:    'var(--color-card-foreground)',
        foreground:        'var(--color-foreground)',
        mutedText:         'var(--color-mutedText)',
        overlay:           'var(--color-overlay)',

        // Brand
        primary: {
          DEFAULT: 'var(--color-primary)',
          active:  'var(--color-primary-active)',
          hover:   'var(--color-primary-hover)',
          muted:   'var(--color-primary-muted)',
        },

        // ECG visualization colors
        'ecg': {
          normal: 'var(--color-ecg-normal)',
          'normal-glow': 'var(--color-ecg-normal-glow)',
          moderate: 'var(--color-ecg-moderate)',
          'moderate-glow': 'var(--color-ecg-moderate-glow)',
          high: 'var(--color-ecg-high)',
          'high-glow': 'var(--color-ecg-high-glow)',
          max: 'var(--color-ecg-max)',
          'max-glow': 'var(--color-ecg-max-glow)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          active:  'var(--color-secondary-active)',
          hover:   'var(--color-secondary-hover)',
          muted:   'var(--color-secondary-muted)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover:   'var(--color-accent-hover)',
        },
        neutral: {
          DEFAULT: 'var(--color-neutral)',
          hover:   'var(--color-neutral-hover)',
          muted:   'var(--color-neutral-muted)',
        },
        'neutral-muted': 'var(--color-neutral-muted)',
        
        // Status
        error: {
          DEFAULT: 'var(--color-error)',
          muted:   'var(--color-error-muted)',
        },
        info:    'var(--color-info)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',

        // Utility overlays
        transparent: {
          transparent:        'var(--color-transparent)',
          transparentBlack:   'var(--color-black-transparent)',
          transparentPrimary: 'var(--color-primary-transparent)',
          transparentWhite:   'var(--color-white-transparent)',
        },

        // Custom "muted" opacity variants
        'error-muted':   'var(--color-error-muted)',
        'success-muted': 'var(--color-success-muted)',
      },

      // ──────────────────────────────────────────────────────────────────────
      // BORDER RADIUS
      // ──────────────────────────────────────────────────────────────────────
      borderRadius: {
        DEFAULT: 'var(--radius)',
        full:    '9999px',
        lg:      'var(--radius-lg)',
        md:      'var(--radius-md)',
        sm:      'var(--radius-sm)',
        xl:      'var(--radius-xl)',
      },

      // ──────────────────────────────────────────────────────────────────────
      // BOX-SHADOWS
      // ──────────────────────────────────────────────────────────────────────
      boxShadow: {
        card:             'var(--shadow-card)',
        dialog:           'var(--shadow-dialog)',
        button:           'var(--shadow-button)',
        primaryTransparent: 'var(--shadow-primary-transparent)',
      },

      // ──────────────────────────────────────────────────────────────────────
      // DROP-SHADOWS (for filter: drop-shadow())
      // ──────────────────────────────────────────────────────────────────────
      dropShadow: {
        'primary-pulse': 'var(--drop-shadow-primary-pulse)',
        'primary-pulse-opacity': 'var(--drop-shadow-primary-pulse-opacity)',
        'ecg-normal': 'var(--drop-shadow-ecg-normal)',
        'ecg-moderate': 'var(--drop-shadow-ecg-moderate)',
        'ecg-high': 'var(--drop-shadow-ecg-high)',
        'ecg-max': 'var(--drop-shadow-ecg-max)',
      },

      // ──────────────────────────────────────────────────────────────────────
      // RING COLORS
      // ──────────────────────────────────────────────────────────────────────
      ringColor: {
        blackTransparent:   'var(--color-black-transparent)',
        transparentPrimary: 'var(--color-primary-transparent)',
        transparentWhite:   'var(--color-white-transparent)',
      },

      // ──────────────────────────────────────────────────────────────────────
      // SPACING SCALE
      // ──────────────────────────────────────────────────────────────────────
      spacing: {
        128: '32rem',
        144: '36rem',
      },
    },

    // ──────────────────────────────────────────────────────────────────────
    // FONT FAMILIES
    // ──────────────────────────────────────────────────────────────────────
    fontFamily: {
      mono:  ['Menlo', 'Monaco', 'Courier New', 'monospace'],
      sans:  ['Inter', 'system-ui', 'sans-serif'],
      serif: ['Georgia', 'Cambria', 'Times', 'serif'],
    },
  },

  // ──────────────────────────────────────────────────────────────────────
  // PLUGINS
  // ──────────────────────────────────────────────────────────────────────
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}