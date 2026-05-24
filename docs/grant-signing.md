# Signed Grant Primitive

Round 6 uses HS256, HMAC-SHA256 with a server-side secret, for Tier B signed
grants.

The choice is intentional:

- BOBR is currently a single-server deployment, so asymmetric key distribution
  would add key-management work without a present verifier split.
- HS256 keeps the grant substrate small: one secret, one compact JWT-like token,
  and no browser-exposed signing material.
- The compact form still keeps a `kid` in the header so a later ES256 migration
  can be a narrow key-rotation PR instead of a state migration.

Operational rules:

- Production must provide `BOBR_GRANT_SIGNING_SECRET`.
- The secret must be at least 32 characters.
- Grants default to a 30-day TTL unless the issuing route sets an explicit
  expiration for a grant type.
- Every issued grant is recorded in `discountCodesDb.grant_audit` with its
  grant id, type, subject, audience, TTL, payload, and issuance status.
