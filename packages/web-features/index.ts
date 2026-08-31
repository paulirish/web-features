import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { baselineStatus as computeBaselineStatus, setDefaultFeatures } from "compute-baseline";
import { WebFeaturesData } from "./types";

const jsonPath = fileURLToPath(new URL("./data.json", import.meta.url));
const { browsers, features, groups, snapshots } = JSON.parse(
  readFileSync(jsonPath, { encoding: "utf-8" }),
) as WebFeaturesData;

setDefaultFeatures(features);

export function baselineStatus(
  input: Parameters<typeof computeBaselineStatus>[0],
) {
  return computeBaselineStatus(input);
}

export { browsers, features, groups, snapshots };
