# Publishing `agentation-svelte`

> ⚠️ **Read the licensing note first — this is a derivative work.**

## 0. Licensing / legal (READ THIS)

This package is a **port of [benjitaylor/agentation](https://github.com/benjitaylor/agentation)**,
which is licensed under **PolyForm Shield 1.0.0**, © Benji Taylor.

PolyForm Shield lets you *use* the software but **prohibits using it (or a
derivative) to compete with the licensor's product**. Publishing a public port
to npm is redistribution of a derivative work and **may not be permitted** under
that license without the original author's consent.

**Before publishing publicly, do one of:**
- Get explicit permission / a license grant from Benji Taylor, OR
- Confirm your use is allowed (e.g. internal/private use, a private npm package,
  or a private GitHub repo), OR
- Reach out via the contact on https://github.com/benjitaylor/agentation.

Keep the attribution in `README.md` and `LICENSE` intact either way. If unsure,
keep the GitHub repo/package **private**.

---

## 1. One-time prep

### a. Pick a package name (check availability)
```bash
npm view agentation-svelte   # 404 = available; otherwise pick a scoped name like @panth977/agentation-svelte
```
If you use a scope (`@panth977/...`), scoped packages are private by default —
you must publish with `--access public` (see step 4).

### b. Complete `package.json` metadata
Add/verify these fields (edit `package.json`):
```jsonc
{
  "name": "agentation-svelte",            // or "@panth977/agentation-svelte"
  "version": "0.1.0",
  "license": "PolyForm-Shield-1.0.0",     // keep upstream license
  "author": "Panth977 (port) — original: Benji Taylor",
  "homepage": "https://github.com/Panth977/agentation",
  "repository": { "type": "git", "url": "git+https://github.com/Panth977/agentation.git" },
  "bugs": { "url": "https://github.com/Panth977/agentation/issues" },
  "keywords": ["svelte", "svelte5", "agentation", "ai", "annotations", "feedback"],
  "publishConfig": { "access": "public" }   // needed for scoped names
}
```
Also copy a `LICENSE` file (PolyForm Shield 1.0.0) into the package root so it
ships with the package.

### c. Confirm what gets published
`package.json` already has `"files": ["dist", ...]` and `"exports"`/`"svelte"`/
`"types"` pointing at `dist/`. The published tarball contains only `dist/` +
`package.json` + `README.md` (+ `LICENSE`).

## 2. Pre-publish checks (must be clean)
```bash
pnpm check          # svelte-check: 0 errors
pnpm build          # vite build + svelte-package -> dist/  + publint "All good!"
```

## 3. Inspect the tarball (no upload)
```bash
npm pack --dry-run          # lists exactly what will be published
# or create the .tgz to inspect:
npm pack
tar -tzf agentation-svelte-0.1.0.tgz | head -40
```
Verify `dist/index.js`, `dist/index.d.ts`, and the component `.svelte` files are
present and there's no stray source/node_modules.

## 4. Publish
```bash
npm login                                   # ! npm login   (run interactively)
npm publish                                 # unscoped public package
# scoped package:
npm publish --access public
```
> Tip: `npm publish --dry-run` first to simulate without uploading.

## 5. Version bumps (subsequent releases)
Follow semver:
```bash
npm version patch   # 0.1.0 -> 0.1.1 (bugfix)
npm version minor   # -> 0.2.0 (backward-compatible feature)
npm version major   # -> 1.0.0 (breaking change)
git push --follow-tags
npm publish
```
`prepublishOnly` runs `npm run package` automatically, so `dist/` is always
rebuilt before publish.

## 6. (Optional) GitHub release
After pushing the version tag, create a release on
https://github.com/Panth977/agentation/releases describing the changes and
crediting the upstream project.
