export const AppColor = {
  // Existing colors for backward compatibility
  primarycolor: "rgba(242, 243, 245, 1)",
  white: "#FFFFFF",
  backgroundcolor: "#F97316", // Updated to match logo orange
  grey: "rgba(141, 140, 140, 1)",
  red: "#FF0000",
  black: "#000000",

  // New Design Colors for Light/Dark Mode
  primaryApp: "#F97316", // Orange from the logo
  secondaryApp: "#FB923C", // Brighter orange

  // Light Mode Colors
  bgLight: "#F9FAFB",
  cardLight: "#FFFFFF",
  textLight: "#111827",
  textLightSub: "#4B5563",
  borderLight: "#E5E7EB",

  // Dark Mode Colors
  bgDark: "#111827",
  cardDark: "#1F2937",
  textDark: "#F9FAFB",
  textDarkSub: "#9CA3AF",
  borderDark: "#374151",

  // Status indicators
  green: "#10B981",
  softGreen: "#D1FAE5",
  textGreen: "#065F46",

  orange: "#F59E0B",
  softOrange: "#FEF3C7",
  textOrange: "#92400E",
} as const;
