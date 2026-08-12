import { Platform } from "react-native";

export const colors = {
  navy: "#5b3cc4",
  ink: "#1f1b2d",
  blue: "#6847d7",
  green: "#087f46",
  background: "#f7f6fa",
  muted: "#747083",
  border: "#e8e5ef",
  white: "#ffffff",
  danger: "#b42318",
  softBlue: "#f0ecff",
  softGreen: "#eaf7ef",
  softRed: "#fff1ef",
};

export const spacing = { xs: 8, sm: 12, md: 16, lg: 24, xl: 32 } as const;
export const radii = { card: 16, button: 12, sheet: 26 } as const;
export const typography = {
  title: { color: colors.ink, fontSize: 28, lineHeight: 34, fontWeight: "800" as const, letterSpacing: -0.6 },
  section: { color: colors.ink, fontSize: 18, lineHeight: 23, fontWeight: "800" as const },
  card: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "800" as const },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  meta: { color: colors.muted, fontSize: 13, lineHeight: 18, fontWeight: "600" as const },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 16, fontWeight: "700" as const },
};

export const shadow = Platform.select({
  ios: { shadowColor: colors.ink, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  android: { elevation: 2 },
  default: {},
});

export const styles = {
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.white, borderRadius: radii.card, padding: spacing.md, ...shadow },
  eyebrow: { color: colors.blue, fontSize: 11, fontWeight: "800" as const, letterSpacing: 1.1, textTransform: "uppercase" as const },
  title: typography.title,
  heading: typography.section,
  body: typography.body,
};
