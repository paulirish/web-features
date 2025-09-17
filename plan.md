# Plan to add `baselinen` field

The goal is to add a `baselinen` field to the `web-features` package that represents the Baseline status of a feature including Node.js support.

## 1. Parameterize the browser set in `compute-baseline`

The `computeBaseline` function in `packages/compute-baseline/src/baseline/index.ts` currently uses a hardcoded set of browsers for its calculations. This needs to be parameterized.

- **Modify `calculate()` function:**
  In `packages/compute-baseline/src/baseline/index.ts`, the `calculate` function will be updated to accept an array of `Browser` objects.

  ```typescript
  // from
  function calculate(compatKey: string, compat: Compat) {
    const f = feature(compatKey);

    return {
      discouraged: f.deprecated ?? false,
      support: support(f, browsers(compat)),
    };
  }

  // to
  function calculate(compatKey: string, compat: Compat, browserSet: Browser[]) {
    const f = feature(compatKey);

    return {
      discouraged: f.deprecated ?? false,
      support: support(f, browserSet),
    };
  }
  ```

- **Modify `computeBaseline()` function:**
  The `computeBaseline` function will be updated to accept an optional `browserSet` argument. If not provided, it will default to the current core browser set.
  - I will also export `browsers` from `core-browser-set.ts` so I can use it as a default.
  - The call to `calculate` inside `computeBaseline` will be updated to pass the `browserSet`.

  ```typescript
  // in packages/compute-baseline/src/baseline/core-browser-set.ts
  export function browsers(compat: Compat) {
    // This will be renamed to getCoreBrowserSet
    return identifiers.map((b) => compat.browser(b));
  }

  // in packages/compute-baseline/src/baseline/index.ts
  import { browsers as getCoreBrowserSet } from "./core-browser-set.js";

  export function computeBaseline(
    featureSelector: {
      compatKeys: [string, ...string[]];
      checkAncestors?: boolean;
    },
    compat: Compat = defaultCompat,
    browserSet: Browser[] = getCoreBrowserSet(compat), // new parameter
  ): SupportDetails {
    // ...
    const statuses = keys.map((key) => calculate(key, compat, browserSet)); // pass browserSet
    // ...
  }
  ```

## 2. Update `dist` script to compute and add `baselinen`

The `scripts/dist.ts` script will be modified to calculate both `baseline` and `baselinen` statuses and add them to the `.yml.dist` files.

- **In `toDist()` function in `scripts/dist.ts`:**
  1.  Define the `baselinen` browser set, which includes the core browsers plus Node.js.
      ```typescript
      import { coreBrowserSet } from "compute-baseline";
      const baselinenBrowserSet = [...coreBrowserSet, "nodejs"].map((b) =>
        compat.browser(b),
      );
      ```
  2.  Call `computeBaseline` twice: once for the standard `baseline` and once for `baselinen` with the extended browser set.

      ```typescript
      let computedStatus = computeBaseline({
        compatKeys: computeFrom,
        checkAncestors: true,
      });

      let computedBaselinenStatus = computeBaseline(
        {
          compatKeys: computeFrom,
          checkAncestors: true,
        },
        compat,
        baselinenBrowserSet,
      );
      ```

  3.  The `status` object in the `.yml.dist` file will be updated to include the `baselinen` data.
      ```yaml
      status:
        baseline: high
        # ...
        baselinen:
          baseline: low
          # ...
      ```
      To achieve this, I'll create a new `status` object and populate it with both `baseline` and `baselinen` data, then set it on the `dist` document.

## 3. Update types and schema

The project's type definitions and JSON schema must be updated to reflect the addition of the `baselinen` field.

- **Update `types.ts`:**
  The `FeatureData` interface in `types.ts` will be updated to include an optional `baselinen` property within the `status` object.
- **Regenerate JSON Schema:**
  After updating `types.ts`, the JSON schema will be regenerated using the `npm run schema:write` command.

## 4. Verification

After implementing the changes, I will run `npm run dist` to regenerate the `.yml.dist` files and verify that the `baselinen` field is correctly added. I will also run the test suite to ensure that no existing functionality is broken.
