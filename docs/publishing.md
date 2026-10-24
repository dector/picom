# Publishing to JSR

Publishing is **manual only**, through `.github/workflows/publish.yml`. Pushing a tag does not publish anything.

## One-time setup

1. Create `@dector/picom` on [JSR](https://jsr.io/new).
2. In the package's JSR settings, link the GitHub repository `dector/picom`. GitHub Actions authenticates with OIDC; no `JSR_TOKEN` secret is needed.
3. Push the workflow to the repository's default branch so **Run workflow** is available.

## Release

1. Create and push a tag separately, pointing at the code you want to publish. The tagged commit must include the publishing configuration and release script.
2. Open **Actions → Publish to JSR → Run workflow**. Keep the workflow branch on the default branch and enter the exact tag in the `tag` field.
3. The workflow checks out that tag, runs tests and typechecking, verifies the package, then publishes it.

Supported tags: `v1.2.3` or `1.2.3`, optionally with a prerelease suffix such as `v1.2.3-rc.1`. Build metadata (`+...`) is not supported. The selected tag is the version source, not `package.json` or `deno.json`: `deno publish --set-version` overrides the configured version for that release without a version-bump commit. No automatic latest-tag lookup is performed.

To check the package locally with Deno 2:

```sh
deno publish --dry-run --allow-dirty --no-lock --node-modules-dir=none
```
