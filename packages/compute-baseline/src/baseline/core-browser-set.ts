import { Compat } from "../browser-compat-data/compat.js";

export const identifiers = [
  "chrome",
  "chrome_android",
  "edge",
  "firefox",
  "firefox_android",
  "safari",
  "safari_ios",
];

export type Runtime = "nodejs" | "deno" | "bun";

export interface RuntimeOptions {
  runtimes?: readonly Runtime[];
}

export function browsers(compat: Compat, options?: RuntimeOptions) {
  const runtimeSet = new Set(options?.runtimes ?? []);
  const ids = [...identifiers, ...runtimeSet];
  return ids.map((b) => compat.browser(b));
}
