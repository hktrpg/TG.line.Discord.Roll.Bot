# CRYPTO_SECRET authenticated encryption rollout

New readers accept legacy AES-256-CTR (`iv:ciphertext`) and `gcm1:nonce:tag:ciphertext` AES-256-GCM. GCM derives a 32-byte key using HKDF-SHA-256 from the UTF-8 `CRYPTO_SECRET`, empty salt, and the fixed info/AAD `hktrpg:crypto-secret:aes-256-gcm:v1`. The secret must already be high entropy; HKDF does not strengthen a weak password. Never log or share the secret or plaintext.

`CRYPTO_SECRET_WRITE_FORMAT` defaults to `ctr`; `gcm-v1` enables GCM writes. Any other non-empty value fails encryption. Deploy dual-format readers to every process that may read or write Patreon/admin ciphertext and verify versions, runtime secrets and backup restoration before switching any writer. Secrets must match across readers; never print them during verification. Do not copy local test secrets into production.

The switch applies to new writes only. Legacy records and prior exports are not automatically rewritten. GCM rejects malformed or modified records; legacy CTR cannot authenticate them. No batch migration is included. After any GCM write, rollback must retain a dual-format reader: disable GCM writes if necessary, but do not roll back to a CTR-only binary while GCM records exist. Preserve a validated backup and the existing secret.

GCM authenticates each ciphertext and the format label, but is not bound to a member or field identifier; it does not prevent substitution of another valid ciphertext encrypted with the same key. Patreon key regeneration still updates VIP entries and the member in separate database operations. An encryption failure is checked before either operation, but database failures between them can still require reconciliation.

Production deployment, config changes and restart must follow oracle-a's current runbook and be separately approved. Check Discord export/decryption, existing Patreon reads, controlled new writes and both gateway roll commands after deployment. Do not claim that localhost tests verify production or post-quantum transport.

## Transport inventory and verification limits

The repository's Docker examples use HTTP for gateway-to-worker connections; bearer authentication alone does not encrypt those requests. The web server supports HTTP or HTTPS depending on configuration. Discord and Telegram platform traffic and Cloudflare termination are separate transport boundaries. SSH/Tunnel, negotiated TLS algorithms and post-quantum support depend on the live endpoints and provider settings and have not been established by this code change. Inventory those endpoints and their negotiated/configured algorithms without exposing tokens before planning any migration; do not claim an HTTPS endpoint is post-quantum merely because TLS is enabled. Consult NIST's ML-KEM/ML-DSA standards and each provider's current documentation.

References: [NIST post-quantum cryptography](https://csrc.nist.gov/Projects/Post-Quantum-Cryptography), [Telegram Bot API transport](https://core.telegram.org/bots), and [Discord's text and voice encryption distinction](https://discord.com/blog/every-voice-and-video-call-on-discord-is-now-end-to-end-encrypted).
