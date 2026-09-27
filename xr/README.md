# Out of Time (XR, Slice A)

A standalone WebXR mixed-reality app built with the Meta Immersive Web SDK
(`@iwsdk/core` 1.0.0-rc.2, scaffolded with `npm create @iwsdk@latest -- --target ar --language js`).
It is independent of the Next.js app at the repository root: its own
`package.json`, lockfile and `node_modules`.

One life-size plate (2.4 m x 1.35 m) of the building at 16154 Main St, Volcano,
California, in two states: Today and about 1885. Pinch (hand ray), poke
(fingertip), controller trigger or mouse-click the round button to cross-fade
between them. The caption text is copied from the game's out-of-time data
(`src/lib/localPlaces.ts`).

Placement in an `immersive-ar` session: on the nearest detected wall plane
facing you (plane detection via IWSDK scene understanding). If no wall appears
within 3 s it stands 1.5 m ahead: lower edge 30 cm above a detected floor, or
at eye height when no floor is detected either.

## Run

Node 22.12+ (or 20.19+).

```sh
cd xr
npm install
npm run dev      # IWSDK managed dev server (HTTPS, port 8081) with the IWER emulator
npm run build    # static build into xr/dist
npm run preview  # serve xr/dist
```

Delete `xr/dist` before running the root lint / pre-push gate (the root
ESLint config would lint the minified bundle and fail), or add `xr/**` to
`globalIgnores` in the root `eslint.config.mjs`.

- **Emulator:** `npm run dev` opens the page with the Immersive Web Emulator
  (IWER, Quest 3 profile, living-room environment). Press Enter AR / the offer
  button. Controls: https://iwsdk.dev/guides/02-testing-experience.html
- **Quest 3 / 3S:** with the headset on the same network, open the HTTPS dev
  URL that `npm run dev` (or `npm run dev:status`) prints in the Quest Browser,
  accept the self-signed certificate, then press Enter AR. Or host `dist/`
  on any HTTPS static host and open that URL.

## Assets

`public/plates/today.jpg` and `public/plates/1885.jpg` are 1600x900 painted
derivatives copied from the game's `public/images/out-of-time/`. See that
folder's `manifest.json` for provenance and release status before publishing.
