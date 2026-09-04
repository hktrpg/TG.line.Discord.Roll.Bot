# HKTRPG Discord Runtime Health

Glossary for Discord shard / cluster health monitoring and recovery. Implementation details live in code and ADRs, not here.

## Language

**Cluster**:
A `discord-hybrid-sharding` child process that typically owns multiple Discord Gateway shards.
_Avoid_: Worker (that means Roll Worker), Discord process (ambiguous)

**Shard**:
One Discord Gateway WebSocket connection handled by a Cluster.
_Avoid_: Server, guild partition (implementation detail of Discord’s model)

**Health Coordinator**:
The single Cluster elected to run health checks, recovery decisions, and admin alerts (default: cluster 0). It stays inactive during **boot grace** until the parent broadcasts `startHeartbeat` (logged as `[Cluster] All clusters are ready. Broadcasting startHeartbeat message.`).
_Avoid_: Manager, parent process (unless recovery is explicitly delegated there)

**Shard Incident**:
A tracked unhealthy condition for one Shard (from the first gateway error / disconnect / non-ready check). Recovery Action and the first Admin Alert wait until past a sustained threshold (`recoveryMs`).
_Avoid_: Alert (an alert is a notification about an incident), Error (a single event)

**Recovery Action**:
An automatic remediation for a Shard Incident: first local `shard.destroy()`, then Cluster respawn via IPC if still unhealthy.
_Avoid_: Restart (ambiguous between shard, cluster, and whole bot), Fix (admin command name only)

**503 Storm**:
High-frequency repeated `shardError` logs (often Discord gateway 502/503/504) for the same Shard while reconnect keeps failing.
_Avoid_: Outage (broader), Rate limit (different Discord concept)

**Admin Alert**:
A DM to IDs in `ADMIN_SECRET`, gated by `ALERT=true`, with cooldown so the same incident is not spammed. First DM is **open** only after sustained unhealthiness (when recovery starts); then periodic **update** / escalate, and **resolved** only if Admin was already alerted. Transient blips that heal before recovery do not DM.
_Avoid_: Log, Notification (too generic)

**Shard Health Report**:
An IPC payload from a non-coordinator Cluster to the parent, forwarded to the Health Coordinator, describing a local shard gateway error or disconnect.
_Avoid_: Heartbeat (cluster IPC heartbeat is a different mechanism)
