/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',           // blue-900 deep institutional
          foreground: 'var(--color-primary-foreground)', // white
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',          // green-800 forest
          foreground: 'var(--color-secondary-foreground)', // white
        },
        accent: {
          DEFAULT: 'var(--color-accent)',             // red-400 warm coral
          foreground: 'var(--color-accent-foreground)', // white
        },
        background: 'var(--color-background)',        // gray-50 soft off-white
        foreground: 'var(--color-foreground)',        // gray-900 rich charcoal
        card: {
          DEFAULT: 'var(--color-card)',               // white
          foreground: 'var(--color-card-foreground)', // gray-900
        },
        popover: {
          DEFAULT: 'var(--color-popover)',            // white
          foreground: 'var(--color-popover-foreground)', // gray-900
        },
        muted: {
          DEFAULT: 'var(--color-muted)',              // gray-100
          foreground: 'var(--color-muted-foreground)', // gray-600
        },
        success: {
          DEFAULT: 'var(--color-success)',            // green-500
          foreground: 'var(--color-success-foreground)', // white
        },
        warning: {
          DEFAULT: 'var(--color-warning)',            // amber-400
          foreground: 'var(--color-warning-foreground)', // gray-900
        },
        error: {
          DEFAULT: 'var(--color-error)',              // red-600
          foreground: 'var(--color-error-foreground)', // white
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)',        // red-600
          foreground: 'var(--color-destructive-foreground)', // white
        },
        border: 'var(--color-border)',                // primary-tinted border
        input: 'var(--color-input)',                  // primary-tinted input bg
        ring: 'var(--color-ring)',                    // primary blue focus ring
      },
      fontFamily: {
        heading: ['Crimson Text', 'Georgia', 'serif'],
        body: ['Source Sans 3', 'system-ui', 'sans-serif'],
        caption: ['Nunito Sans', 'system-ui', 'sans-serif'],
        data: ['JetBrains Mono', 'Courier New', 'monospace'],
        sans: ['Source Sans 3', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
        serif: ['Crimson Text', 'Georgia', 'serif'],
      },
      fontSize: {
        'h1': ['2.25rem', { lineHeight: '1.2' }],
        'h2': ['1.875rem', { lineHeight: '1.25' }],
        'h3': ['1.5rem', { lineHeight: '1.3' }],
        'h4': ['1.25rem', { lineHeight: '1.4' }],
        'h5': ['1.125rem', { lineHeight: '1.5' }],
        'caption': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0.025em' }],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(30, 58, 95, 0.08)',
        DEFAULT: '0 2px 6px rgba(30, 58, 95, 0.10)',
        md: '0 2px 6px rgba(30, 58, 95, 0.10)',
        lg: '0 6px 12px rgba(30, 58, 95, 0.12)',
        xl: '0 20px 40px -8px rgba(30, 58, 95, 0.16)',
      },
      transitionTimingFunction: {
        'ease-academic': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'ease-bounce-academic': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      transitionDuration: {
        DEFAULT: '250ms',
        '250': '250ms',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      zIndex: {
        'nav': '100',
        'dropdown': '50',
        'sticky': '75',
        'modal': '200',
        'toast': '300',
        'debug': '400',
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      },
      scrollPadding: {
        'nav': '80px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
};