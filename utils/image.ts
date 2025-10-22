// utils/image.ts
// Helper to provide a safe Image source. If uri is empty/invalid, returns a local placeholder asset.
import { ImageSourcePropType } from "react-native";

// Use an existing app icon as a lightweight placeholder
const PLACEHOLDER: ImageSourcePropType = require("../assets/images/icon.png");

export function getSafeImageSource(uri?: string | null): ImageSourcePropType {
  if (typeof uri === "string" && uri.trim().length > 0) {
    return { uri } as any;
  }
  return PLACEHOLDER;
}

export const PLACEHOLDER_IMAGE = PLACEHOLDER;
