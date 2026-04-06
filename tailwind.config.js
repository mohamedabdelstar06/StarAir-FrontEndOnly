/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                // Bright, clean Trivago-style colors
                primary: {
                    50: '#f4f9ff',
                    100: '#e0f0ff',
                    200: '#b8dcff',
                    300: '#8ac4ff',
                    400: '#5ca2ff',
                    500: '#3381eb', // Trivago-like pleasant blue
                    600: '#2365c7',
                    700: '#174aa3',
                    800: '#0e3180',
                    900: '#081d5c',
                },
                accent: {
                    trivagoOrange: '#f57c00', // Cheerful secondary color
                    amber: '#f59e0b',
                    red: '#ef4444',
                    green: '#22c55e',
                },
                surface: {
                    light: '#ffffff',
                    dark: '#1e293b',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            // Removed animations to improve performance per user request
            animation: {},
            keyframes: {},
            // Consistent spacing scale (rem-based, so auto-scales with root font-size)
            spacing: {
                '4.5': '1.125rem',
                '13': '3.25rem',
                '15': '3.75rem',
                '18': '4.5rem',
            },
            // Responsive container defaults
            screens: {
                'xs': '475px',
            },
            // Ensure max-width classes work properly
            maxWidth: {
                '8xl': '88rem',
                '9xl': '96rem',
            },
        },
    },
    plugins: [],
}
