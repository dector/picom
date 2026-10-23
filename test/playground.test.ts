import { describe, expect, test } from "bun:test";
import * as picom from "../src/index.js";
import { examples } from "../playground/src/examples.js";

describe("playground examples", () => {
  for (const [name, source] of Object.entries(examples)) {
    test(`${name} returns a valid, grounded model`, () => {
      // Use the same plain-JavaScript scope provided by the browser worker.
      const evaluate = new Function(...Object.keys(picom), `"use strict";\n${source}`);
      const description = picom.describe(evaluate(...Object.values(picom)));
      expect(description.name).toBe(name);
      expect(description.triangleCount).toBeGreaterThan(0);
      expect(description.bounds.min[2]).toBeCloseTo(0);
      expect(description.assemblies.length).toBeGreaterThan(0);
    });
  }
});
