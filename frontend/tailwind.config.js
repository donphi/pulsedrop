module.exports = {
    darkMode: 'class',
    content: ['./app/**/*.tsx', './components/**/*.tsx'],
    theme: {
      extend: {
        colors: {
          background: 'var(--color-background)',
          foreground: 'var(--color-foreground)',
          card: 'var(--color-card)',
          cardForeground: 'var(--color-card-foreground)',
  
          primary: {
            DEFAULT: 'var(--color-primary)',
            hover: 'var(--color-primary-hover)',
            active: 'var(--color-primary-active)',
            muted: 'var(--color-primary-muted)',
          },
          secondary: {
            DEFAULT: 'var(--color-secondary)',
            hover: 'var(--color-secondary-hover)',
            active: 'var(--color-secondary-active)',
            muted: 'var(--color-secondary-muted)',
          },
          accent: {
            DEFAULT: 'var(--color-accent)',
            hover: 'var(--color-accent-hover)',
          },
          neutral: {
            DEFAULT: 'var(--color-neutral)',
            hover: 'var(--color-neutral-hover)',
            muted: 'var(--color-neutral-muted)',
          },
          transparent: {
            transparent: 'var(--color-transparent)',
            transparentWhite: 'var(--color-white-transparent)',
            transparentBlack: 'var(--color-black-transparent)',
            transparentPrimary: 'var(--color-primary-transparent)',
          },
          error: {
            DEFAULT: 'var(--color-error)',
            muted: 'var(--color-error-muted)',
          },
          mutedText: 'var(--color-mutedText)',
          info: 'var(--color-info)',
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          overlay: 'var(--color-overlay)',
        },
        borderRadius: {
          DEFAULT: 'var(--radius)',
          sm: 'var(--radius-sm)',
          md: 'var(--radius-md)',
          lg: 'var(--radius-lg)',
          xl: 'var(--radius-xl)',
          full: '9999px',
        },
        boxShadow: {
          card: 'var(--shadow-card)',
          button: 'var(--shadow-button)',
          dialog: 'var(--shadow-dialog)',
          primaryTransparent: '0 0 10px var(--color-primary-transparent)',
        },
        ringColor: {
            blackTransparent:   'var(--color-black-transparent)',
            transparentWhite:   'var(--color-white-transparent)',
            transparentPrimary: 'var(--color-primary-transparent)',
        },
        spacing: {
          '128': '32rem',
          '144': '36rem',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times', 'serif'],
        mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
    },
    plugins: [
      require('@tailwindcss/forms'),
      require('@tailwindcss/typography'),
      require('@tailwindcss/aspect-ratio'),
    ],
  };