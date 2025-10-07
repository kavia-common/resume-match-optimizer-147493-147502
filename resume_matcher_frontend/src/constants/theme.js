//
// Ocean Professional Theme Tokens
//
// PUBLIC_INTERFACE
export const theme = {
  // Color palette derived from style guide
  colors: {
    primary: "#2563EB",    // Blue
    secondary: "#F59E0B",  // Amber
    success: "#F59E0B",
    error: "#EF4444",
    background: "#f9fafb", // Subtle gray
    surface: "#ffffff",    // White
    text: "#111827",       // Slate-900
    textMuted: "#6B7280",  // Slate-500
    border: "#E5E7EB",     // Gray-200
    subtle: "#F3F4F6",     // Gray-100
    overlay: "rgba(17, 24, 39, 0.5)", // #111827 at 50%
  },

  // Spacing scale (px)
  spacing: {
    none: "0",
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    "2xl": "32px",
    "3xl": "48px",
  },

  // Border radii
  radii: {
    sm: "6px",
    md: "10px",
    lg: "14px",
    xl: "20px",
    pill: "9999px",
  },

  // Elevation / shadows
  shadows: {
    sm: "0 1px 2px rgba(0,0,0,0.04)",
    md: "0 4px 10px rgba(0,0,0,0.06)",
    lg: "0 10px 25px rgba(0,0,0,0.08)",
    inset: "inset 0 1px 2px rgba(0,0,0,0.04)",
    focus: "0 0 0 3px rgba(37, 99, 235, 0.35)",
  },

  // Transitions
  transitions: {
    fast: "150ms ease",
    base: "200ms ease",
    slow: "300ms ease",
  },

  // Layout constants
  layout: {
    sidebarWidth: "280px",
    headerHeight: "64px",
    containerMax: "1200px",
  },
};

export default theme;
