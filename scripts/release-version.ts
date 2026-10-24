// Accept release tags such as v1.2.3, 1.2.3, or v1.2.3-rc.1.
// Build metadata is intentionally unsupported for registry releases.
export function releaseVersion(tag: string): string {
  const number = "(?:0|[1-9][0-9]*)";
  const identifier = "(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)";
  const semver = new RegExp(
    `^v?(${number}\\.${number}\\.${number}(?:-${identifier}(?:\\.${identifier})*)?)$`,
  );
  const match = semver.exec(tag);
  if (!match || match[0] !== tag) {
    throw new Error(`Invalid release tag: ${JSON.stringify(tag)}. Expected v1.2.3 or v1.2.3-rc.1 (v is optional).`);
  }
  return match[1];
}

if (import.meta.main) {
  console.log(releaseVersion(Bun.argv[2] ?? ""));
}
