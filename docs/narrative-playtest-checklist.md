# Narrative Playtest Checklist for Signed Grants

This checklist is a merge gate for signed-grant migration PRs. Passing type
checks is not enough: the migration must preserve the feeling that the player is
moving through the deep ranch world, not waiting on infrastructure.

## Before Merge

- [ ] Run the migrated flow on a slow-3G profile in Chrome DevTools throttling.
  Capture round-trip latency for grant issuance.
- [ ] If latency is greater than 300ms for any user-facing action, the latency
  must be hidden behind optimistic UI.
- [ ] Walk the flow as a player with no awareness of the technical change. Does
  anything feel off? Does any state transition feel less meaningful than before?
- [ ] Specifically: does the deep ranch world feeling survive the migration?

## During Migration

- [ ] Pair playtest with a non-engineer: Leif, a family member, or a friend.
  Their reaction to friction is the canonical signal.
- [ ] If they say "huh, that felt different", investigate before merge.

## After Merge

- [ ] Run a 7-day soak and monitor `discountCodesDb.grant_audit` for unexpected
  failure rates, network errors, and retry storms.
- [ ] If error rate is greater than 0.5%, roll back via feature flag.

## Evidence To Attach

- Slow-3G latency capture, including route, timestamp, and measured round-trip
  time for each grant issuance.
- Notes from the player walkthrough, including exact wording for any friction.
- Non-engineer playtest notes, with the tester name and the moment they noticed
  or did not notice the migration.
- Soak-period query or dashboard link showing `grant_audit` issue, verify, and
  failure counts.
