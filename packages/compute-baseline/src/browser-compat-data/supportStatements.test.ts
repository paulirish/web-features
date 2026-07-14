import assert from "node:assert/strict";

import { browser } from "./browser.js";
import { SupportStatement } from "./supportStatements.js";

describe("statements", function () {
  describe("SupportStatement", function () {
    describe("#flags", function () {
      const s = {
        version_added: "1",
        version_removed: "2",
      };

      it("return empty array for no flags", function () {
        const st = new SupportStatement(s);
        assert.ok(st.flags.length === 0);
      });

      it("return array with flags", function () {
        const flag = {
          type: "preference" as const,
          name: "dom.streams.enabled",
          value_to_set: "true",
        };
        const st = new SupportStatement({ flags: [flag], ...s });
        assert.ok(st.flags.length === 1);
      });
    });

    describe("#partial_implementation", function () {
      it("returns value", function () {
        const s = new SupportStatement({
          version_added: "1",
          version_removed: "2",
          partial_implementation: true,
        });
        assert.equal(s.partial_implementation, true);
      });

      it("returns false for undefined", function () {
        const s = new SupportStatement({
          version_added: "1",
          version_removed: "2",
        });
        assert.equal(s.partial_implementation, false);
      });
    });

    describe("#version_added", function () {
      it("returns version", function () {
        const s = new SupportStatement({
          version_added: "1",
          version_removed: "2",
        });
        assert.equal(s.version_added, "1");
      });
    });

    describe("#version_removed", function () {
      it("returns version", function () {
        const s = new SupportStatement({
          version_added: "1",
          version_removed: "2",
        });
        assert.equal(s.version_removed, "2");
      });

      it("returns undefined", function () {
        const s = new SupportStatement({ version_added: "1" });
        assert.equal(s.version_removed, undefined);
      });
    });

    describe("#supportedBy", function () {
      it("returns an array of releases represented by the statement", function () {
        const st = new SupportStatement(
          { version_added: "1" },
          browser("chrome"),
        );
        const rels = st.supportedBy();
        assert.equal(rels.length, browser("chrome").releases.length);
      });

      // TODO: This test could be more specific. Really, handling ≤ gracefully
      // is context dependent: do you care about the releases before the start
      // of that range? If so, you should be able to opt-in to warnings or
      // errors about it.
      it("handles ≤ gracefully", function () {
        const st = new SupportStatement(
          { version_added: "≤11" },
          browser("chrome"),
        );
        const rels = st.supportedBy();
        assert.equal(rels.length, browser("chrome").releases.length - 10);
      });
    });

    describe("supportedIn()", function () {
      it("throws when browser is undefined", function () {
        const cr = browser("chrome");
        const statement = new SupportStatement({ version_added: "1" });
        assert.throws(() => statement.supportedInDetails(cr.current()), Error);
      });

      it("throws when release does not correspond to the statement's browser", function () {
        const statement = new SupportStatement(
          { version_added: "1" },
          browser("chrome"),
        );
        assert.throws(
          () => statement.supportedInDetails(browser("firefox").current()),
          Error,
        );
      });

      it("returns supported when release is on after version_added", function () {
        const cr = browser("chrome");
        const unranged = new SupportStatement({ version_added: "100" }, cr);
        const ranged = new SupportStatement({ version_added: "≤100" }, cr);

        assert.equal(
          unranged.supportedInDetails(cr.version("100")).supported,
          true,
        );
        assert.equal(
          unranged.supportedInDetails(cr.version("101")).supported,
          true,
        );
        assert.equal(unranged.supportedInDetails(cr.current()).supported, true);
        assert.equal(
          unranged.supportedInDetails(cr.releases.at(-1) as any).supported,
          true,
        );

        assert.equal(
          ranged.supportedInDetails(cr.version("99")).supported,
          null,
        );
        assert.equal(
          ranged.supportedInDetails(cr.version("100")).supported,
          true,
        );
        assert.equal(
          ranged.supportedInDetails(cr.version("101")).supported,
          true,
        );
        assert.equal(ranged.supportedInDetails(cr.current()).supported, true);
        assert.equal(
          ranged.supportedInDetails(cr.releases.at(-1) as any).supported,
          true,
        );
      });

      it("returns supported when release is on after version_added and before version_removed", function () {
        const cr = browser("chrome");
        const unranged = new SupportStatement(
          { version_added: "100", version_removed: "125" },
          cr,
        );
        const ranged = new SupportStatement(
          { version_added: "≤100", version_removed: "125" },
          cr,
        );

        assert.equal(
          unranged.supportedInDetails(cr.version("99")).supported,
          false,
        );
        assert.equal(
          unranged.supportedInDetails(cr.version("100")).supported,
          true,
        );
        assert.equal(
          unranged.supportedInDetails(cr.version("101")).supported,
          true,
        );
        assert.equal(
          unranged.supportedInDetails(cr.version("124")).supported,
          true,
        );
        assert.equal(
          unranged.supportedInDetails(cr.version("125")).supported,
          false,
        );

        assert.equal(
          ranged.supportedInDetails(cr.version("99")).supported,
          null,
        );
        assert.equal(
          ranged.supportedInDetails(cr.version("100")).supported,
          true,
        );
        assert.equal(
          ranged.supportedInDetails(cr.version("101")).supported,
          true,
        );
        assert.equal(
          ranged.supportedInDetails(cr.version("124")).supported,
          true,
        );
        assert.equal(
          unranged.supportedInDetails(cr.version("125")).supported,
          false,
        );
      });

      it("returns unknown support when release is before ranged version_added", function () {
        const cr = browser("chrome");
        const rangedOpen = new SupportStatement({ version_added: "≤100" }, cr);
        const rangedClosed = new SupportStatement(
          { version_added: "≤100", version_removed: "125" },
          cr,
        );

        assert.equal(
          rangedOpen.supportedInDetails(cr.version("99")).supported,
          null,
        );
        assert.equal(
          rangedClosed.supportedInDetails(cr.version("99")).supported,
          null,
        );
      });

      it("returns unknown support when release is after version_added and before ranged version_removed", function () {
        const cr = browser("chrome");
        const rangedEnd = new SupportStatement(
          { version_added: "100", version_removed: "≤125" },
          cr,
        );

        assert.equal(
          rangedEnd.supportedInDetails(cr.version("100")).supported,
          true,
        );
        assert.equal(
          rangedEnd.supportedInDetails(cr.version("101")).supported,
          null,
        );
        assert.equal(
          rangedEnd.supportedInDetails(cr.version("124")).supported,
          null,
        );
        assert.equal(
          rangedEnd.supportedInDetails(cr.version("125")).supported,
          false,
        );
      });

      it("returns unsupported when statement is version_added false", function () {
        const cr = browser("chrome");
        const statement = new SupportStatement({ version_added: false }, cr);

        for (const release of cr.releases) {
          assert.equal(statement.supportedInDetails(release).supported, false);
        }
      });

      it("returns unsupported when release is before fixed version_added", function () {
        const cr = browser("chrome");
        const unranged = new SupportStatement({ version_added: "100" }, cr);
        assert.equal(
          unranged.supportedInDetails(cr.version("99")).supported,
          false,
        );
      });

      it("returns unsupported when release is on or after version_removed", function () {
        const cr = browser("chrome");

        const unranged = new SupportStatement(
          { version_added: "1", version_removed: "10" },
          cr,
        );
        assert.equal(
          unranged.supportedInDetails(cr.version("10")).supported,
          false,
        );
        assert.equal(
          unranged.supportedInDetails(cr.version("11")).supported,
          false,
        );
        assert.equal(
          unranged.supportedInDetails(cr.current()).supported,
          false,
        );
        assert.equal(
          unranged.supportedInDetails(cr.releases.at(-1) as any).supported,
          false,
        );

        const ranged = new SupportStatement(
          { version_added: "≤5", version_removed: "10" },
          cr,
        );
        assert.equal(
          ranged.supportedInDetails(cr.version("10")).supported,
          false,
        );
        assert.equal(
          ranged.supportedInDetails(cr.version("11")).supported,
          false,
        );
        assert.equal(ranged.supportedInDetails(cr.current()).supported, false);
        assert.equal(
          ranged.supportedInDetails(cr.releases.at(-1) as any).supported,
          false,
        );
      });
    });

    describe("edge cases with boolean, null, and ranged values", function () {
      it("handles version_added true and null gracefully in supportedInDetails and supportedBy", function () {
        const cr = browser("chrome");
        const addedTrue = new SupportStatement({ version_added: true as any }, cr);
        const addedNull = new SupportStatement({ version_added: null as any }, cr);

        // supportedInDetails returns { supported: null }
        assert.equal(addedTrue.supportedInDetails(cr.current()).supported, null);
        assert.equal(addedNull.supportedInDetails(cr.current()).supported, null);

        // supportedBy returns []
        assert.deepEqual(addedTrue.supportedBy(), []);
        assert.deepEqual(addedNull.supportedBy(), []);
      });

      it("handles version_removed true gracefully in supportedInDetails and supportedBy", function () {
        const cr = browser("chrome");
        const removedTrue = new SupportStatement({ version_added: "100", version_removed: true as any }, cr);

        // supportedInDetails returns { supported: null } for releases >= version_added
        assert.equal(removedTrue.supportedInDetails(cr.version("100")).supported, null);
        assert.equal(removedTrue.supportedInDetails(cr.version("99")).supported, false);

        // supportedBy returns []
        assert.deepEqual(removedTrue.supportedBy(), []);
      });

      it("handles ranged version_removed strings gracefully in supportedBy", function () {
        const cr = browser("chrome");
        const rangedRemoved = new SupportStatement({ version_added: "100", version_removed: "≤125" }, cr);

        // supportedBy should not crash and should return the expected releases from start to end (exclusive)
        const rels = rangedRemoved.supportedBy();
        assert.ok(rels.length > 0);
        // Verify that the end version (125) is not included
        assert.ok(!rels.some(r => r.release.version === "125"));
      });
    });
  });
});
