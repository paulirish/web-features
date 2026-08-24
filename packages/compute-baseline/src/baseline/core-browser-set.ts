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

export interface BrowserOptions {
  includeNode?: boolean;
  runtimes?: Runtime[];
}

export function browsers(compat: Compat, options?: BrowserOptions) {
  const runtimeSet = new Set<string>();
  if (options?.includeNode) {
    runtimeSet.add("nodejs");
  }
  if (options?.runtimes) {
    for (const r of options.runtimes) {
      runtimeSet.add(r);
    }
  }
  const ids = [...identifiers, ...runtimeSet];
  return ids.map((b) => compat.browser(b));
}
