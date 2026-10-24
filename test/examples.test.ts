import { expect, test } from "bun:test";
import * as picom from "../src/index.js";
import { examples } from "../playground/src/examples.js";

for (const [name, source] of Object.entries(examples)) {
  test(`playground example: ${name}`, () => {
    // Match the playground worker's function injection and validation.
    const evaluate = new Function(...Object.keys(picom), `"use strict";\n${source}`);
    const description = picom.describe(evaluate(...Object.values(picom)));
    expect(description.name).toBe(name);
    expect(description.triangleCount).toBeGreaterThan(0);
    expect(description.assemblies.length).toBeGreaterThan(0);
  });
}
