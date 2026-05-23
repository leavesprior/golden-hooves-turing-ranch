# Grant API

The Round 6 grant substrate issues and verifies Tier B signed grants. Grants are
compact HS256 tokens signed with `BOBR_GRANT_SIGNING_SECRET`, cached by the
client, and audited in `discountCodesDb.grant_audit`.

## `POST /api/grant`

Issues a signed grant.

Request body:

```json
{
  "type": "milestone",
  "payload": {
    "milestoneId": "booking_verified",
    "sessionId": "session_123"
  },
  "ttl": 2592000
}
```

- `type` must be allowlisted. Round 6 starts with `milestone`.
- `payload` must be a JSON object.
- `ttl` is optional seconds. It defaults to 30 days and cannot exceed 30 days.
- Auth is intentionally narrow for this substrate pass: the route refuses
  unknown grant types. Milestone grants additionally reject milestone ids that
  are not in the server-side `MilestoneId` allowlist.

Successful response:

```json
{
  "ok": true,
  "token": "header.payload.signature",
  "payload": {
    "type": "milestone",
    "payload": {
      "milestoneId": "booking_verified",
      "sessionId": "session_123"
    },
    "iat": 1778914449,
    "exp": 1781506449,
    "jti": "uuid",
    "aud": "bobr-grant:milestone"
  },
  "expiresAt": "2026-06-15T00:00:00.000Z",
  "ttlSeconds": 2592000
}
```

Rejected issue attempts are also written to `grant_audit` with status
`issue_rejected`.

## `GET /api/grant/verify`

Verifies a grant token server-side.

Query string:

```text
/api/grant/verify?token=header.payload.signature
```

Successful response:

```json
{
  "ok": true,
  "payload": {
    "type": "milestone",
    "payload": {
      "milestoneId": "booking_verified",
      "sessionId": "session_123"
    },
    "iat": 1778914449,
    "exp": 1781506449,
    "jti": "uuid",
    "aud": "bobr-grant:milestone"
  },
  "remainingTtlSeconds": 2591990
}
```

Invalid or expired tokens return `ok: false` with `invalid_token`.
Verification successes and failures are recorded in `grant_audit` so the
post-merge soak can track failure rates and retry storms.

## Milestone Migration Notes

Milestone grants are stored by the client under
`bobr_grant_milestone_${milestoneId}`. Legacy `bobr_cross_game_progression`
milestones that predate signed grants receive a 7-day amnesty marker on first
read. After that window, unlock checks stop counting the raw milestone unless a
signed grant token exists.
