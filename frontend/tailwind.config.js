/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'glass-bg': 'rgba(255, 255, 255, 0.65)',
                'glass-border': 'rgba(255, 255, 255, 0.3)',
                'glass-highlight': 'rgba(255, 255, 255, 0.5)',
                'system-blue': '#007AFF',
                'system-gray': '#8E8E93',
                'system-green': '#34C759',
                'system-red': '#FF3B30',
                'system-orange': '#FF9500',
                'system-indigo': '#5856D6',
                'system-teal': '#5AC8FA',
                'apple-gray': '#F5F5F7',
            },
            backdropBlur: {
                'xs': '2px',
                'md': '12px',
                'lg': '20px',
                'xl': '40px',
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.1)',
            }
        },
    },
    plugins: [],
}
