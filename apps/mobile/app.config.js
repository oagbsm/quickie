const fs = require("node:fs");
const path = require("node:path");

function readRootEnv(name) {
  const rootEnvPath = path.resolve(__dirname, "../../.env.local");
  if (!fs.existsSync(rootEnvPath)) return process.env[name]?.trim() || "";
  const source = fs.readFileSync(rootEnvPath, "utf8");
  const line = source.split(/\r?\n/).find((candidate) => candidate.trim().startsWith(`${name}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^(['"])(.*)\1$/, "$2") || process.env[name]?.trim() || "";
}

const supabaseUrl = readRootEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = readRootEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const appUrl = readRootEnv("NEXT_PUBLIC_APP_URL") || process.env.EXPO_PUBLIC_APP_URL || "http://10.0.2.2:3000";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Mobile Supabase configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the Quickola root .env.local.");
}

module.exports = {
  name: "Quickola",
  slug: "quickola",
  scheme: "quickola",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  plugins: [
    "expo-router",
    ["expo-camera", { cameraPermission: "Quickola uses your camera for an end-of-clean walkthrough.", recordAudioAndroid: false }],
    ["expo-image-picker", { photosPermission: "Quickola uses photos as cleaning evidence.", microphonePermission: false }],
    "expo-notifications",
    "expo-secure-store",
    "@react-native-community/datetimepicker",
  ],
  ios: { supportsTablet: true },
  android: { adaptiveIcon: { backgroundColor: "#071a3a" }, package: "com.anonymous.quickola" },
  extra: {
    // Only these two safe public values are forwarded from the root env.
    EXPO_PUBLIC_SUPABASE_URL: supabaseUrl,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
    EXPO_PUBLIC_APP_URL: appUrl,
  },
};
