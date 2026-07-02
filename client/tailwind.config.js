export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          darkest: "#021024",
          dark: "#052659",
          mid: "#5483B3",
          light: "#7DA0CA",
          lightest: "#C1E8FF",
        },
        surface: {
          white: "#FFFFFF",
          cream: "#F0F4F8",
          ghost: "#E8EFF6",
        },
        text: {
          primary: "#021024",
          secondary: "#052659",
          muted: "#5483B3",
          light: "#7DA0CA",
          inverse: "#FFFFFF",
        },
        border: {
          light: "rgba(84, 131, 179, 0.15)",
          medium: "rgba(84, 131, 179, 0.25)",
          strong: "rgba(5, 38, 89, 0.3)",
        },
      },
      fontFamily: {
        manrope: ["Manrope", "sans-serif"],
        jakarta: ["Plus Jakarta Sans", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(135deg, #C1E8FF 0%, #7DA0CA 50%, #5483B3 100%)",
        "gradient-dark": "linear-gradient(135deg, #021024 0%, #052659 100%)",
        "gradient-hero":
          "linear-gradient(180deg, #C1E8FF 0%, #FFFFFF 50%, #F0F4F8 100%)",
        "gradient-glass":
          "linear-gradient(135deg, rgba(193, 232, 255, 0.4) 0%, rgba(125, 160, 202, 0.1) 100%)",
        "gradient-card":
          "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(193, 232, 255, 0.3) 100%)",
        "gradient-cta": "linear-gradient(135deg, #052659 0%, #021024 100%)",
        "gradient-accent": "linear-gradient(135deg, #5483B3 0%, #052659 100%)",
        "gradient-subtle": "linear-gradient(180deg, #FFFFFF 0%, #C1E8FF 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(2, 16, 36, 0.08)",
        "glass-lg": "0 16px 64px rgba(2, 16, 36, 0.12)",
        "glass-xl": "0 24px 80px rgba(2, 16, 36, 0.16)",
        card: "0 4px 24px rgba(5, 38, 89, 0.06)",
        "card-hover": "0 12px 48px rgba(5, 38, 89, 0.12)",
        button: "0 4px 16px rgba(5, 38, 89, 0.2)",
        "button-hover": "0 8px 32px rgba(5, 38, 89, 0.3)",
        glow: "0 0 60px rgba(84, 131, 179, 0.3)",
        "glow-lg": "0 0 120px rgba(84, 131, 179, 0.2)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "float-fast": "float 4s ease-in-out infinite",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        "gradient-shift": "gradientShift 8s ease infinite",
        "slide-up": "slideUp 0.6s ease-out",
        "fade-in": "fadeIn 0.8s ease-out",
        "scale-in": "scaleIn 0.5s ease-out",
        "spin-slow": "spin 12s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.7 },
        },
        gradientShift: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        slideUp: {
          "0%": { transform: "translateY(30px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        scaleIn: {
          "0%": { transform: "scale(0.9)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        30: "7.5rem",
      },
      fontSize: {
        display: ["4.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-sm": [
          "3.5rem",
          { lineHeight: "1.15", letterSpacing: "-0.02em" },
        ],
        heading: ["2.5rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        subheading: ["1.5rem", { lineHeight: "1.4", letterSpacing: "-0.01em" }],
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
