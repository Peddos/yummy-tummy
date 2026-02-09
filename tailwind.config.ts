import type { Config } from "tailwindcss"

const config = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                // Food-themed custom colors
                tomato: {
                    50: '#FFF5F5',
                    100: '#FFE3E3',
                    200: '#FFC9C9',
                    300: '#FFA8A8',
                    400: '#FF8787',
                    500: '#FF6B6B',
                    600: '#FA5252',
                    700: '#F03E3E',
                    800: '#E03131',
                    900: '#C92A2A',
                },
                warmOrange: {
                    50: '#FFF9F5',
                    100: '#FFEDE0',
                    200: '#FFD8BF',
                    300: '#FFC29E',
                    400: '#FFAD7D',
                    500: '#FF8C42',
                    600: '#FF7A1F',
                    700: '#F76707',
                    800: '#E8590C',
                    900: '#D9480F',
                },
                freshGreen: {
                    50: '#F0FFFE',
                    100: '#CCFBF1',
                    200: '#99F6E4',
                    300: '#5EEAD4',
                    400: '#2DD4BF',
                    500: '#4ECDC4',
                    600: '#14B8A6',
                    700: '#0D9488',
                    800: '#0F766E',
                    900: '#115E59',
                },
                goldenYellow: {
                    50: '#FFFEF0',
                    100: '#FFFBCC',
                    200: '#FFF899',
                    300: '#FFF566',
                    400: '#FFE66D',
                    500: '#FFD43B',
                    600: '#FCC419',
                    700: '#FAB005',
                    800: '#F59F00',
                    900: '#F08C00',
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
