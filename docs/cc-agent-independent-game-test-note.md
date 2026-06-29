# cc_agent Independent Game Test Note

Date: 2026-05-11
Repo: `/home/granny/bobr-website`
Current local URL: `http://localhost:3099`
Dispatch task: `cc_20260511-122318-2640423`

## Request

Ask cc_agent to open and independently test the BOBR top-down beta game routes.

## Routes To Test

- Normal welcome route: `/clue/welcome`
- Welcome beta route: `/clue/welcome?visual=topdown`
- Normal game-room route: `/clue/game-room`
- House / Built Ranch beta route: `/clue/game-room?visual=topdown`

## Viewports

- Desktop: `1440x1000`
- Mobile: `390x844`

## Checks

- Normal routes must keep the existing Tobias/live clue presentation.
- Beta-only UI must appear only on `visual=topdown` routes.
- Hotspot clicks must move the player marker to the selected hotspot.
- Guide/observation/evidence/source-layer panels must update after hotspot clicks.
- `Record Evidence` must increment only the beta Field Journal.
- Beta routes must not create `bobr_game_session`.
- Beta routes must not grant QR discovery, reward codes, redeemable codes, or valuable progression state.
- Capture desktop and mobile screenshots.
- Record console errors, page errors, hydration warnings, and visual overlap issues.

## Useful Existing Artifacts

- `/tmp/bobr-house-browser-results-adjusted.json`
- `/tmp/bobr-house-beta-desktop-adjusted-1440x1000.jpg`
- `/tmp/bobr-house-beta-mobile-adjusted-top-390x844.jpg`
- `/tmp/bobr-house-beta-mobile-adjusted-panel-390x844.jpg`
- `/tmp/bobr-browser-results-clean.json`
- `/tmp/bobr-beta-desktop-clean-1440x1000.jpg`
- `/tmp/bobr-beta-mobile-clean-top-390x844.jpg`
- `/tmp/bobr-beta-mobile-clean-panel-390x844.jpg`

## Verification Already Run

- `npx tsc --noEmit --pretty false` passed.
- Focused `npm run lint` passed with zero errors.
- One pre-existing React warning remains in `src/app/clue/[slug]/page.tsx` for synchronous state updates in the live clue discovery effect.
- Browser smoke passed for the welcome beta and House / Built Ranch beta in this Codex run, but cc_agent should verify independently.

## If Server Is Not Running

From `/home/granny/bobr-website`:

```text
npm run dev -- --webpack --port 3099
```

Then open:

```text
http://localhost:3099/clue/welcome?visual=topdown
http://localhost:3099/clue/game-room?visual=topdown
```
