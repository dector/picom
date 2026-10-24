import { expect, test } from "bun:test";
import { releaseVersion } from "../scripts/release-version.ts";

test("release version comes from the selected tag", () => {
  for (const version of ["0.1.0", "1.20.300", "1.0.0-rc.1", "2.0.0-0", "1.0.0-01a"]) {
    expect(releaseVersion(version)).toBe(version);
    expect(releaseVersion(`v${version}`)).toBe(version);
  }
});

test("rejects non-release refs and malformed versions", () => {
  for (const tag of [
    "", "main", "refs/tags/v1.2.3", "latest", "v1.2", "v01.2.3", "v1.02.3",
    "v1.2.03", "v1.2.3-01", "v1.2.3-rc.01", "v1.2.3-", "v1.2.3+build.1",
    " v1.2.3", "v1.2.3\n", "v1.2.3; echo unsafe", "v1.2.3/other",
  ]) {
    expect(() => releaseVersion(tag)).toThrow("Invalid release tag");
  }
});
