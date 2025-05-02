// tailwind.config.js
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
          },
          info: 'var(--color-info)',
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          error: 'var(--color-error)',
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