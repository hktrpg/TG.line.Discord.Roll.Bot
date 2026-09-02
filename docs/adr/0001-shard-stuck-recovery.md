# Shard stuck recovery via Health Coordinator

Discord shard gateway failures (especially 503 reconnect loops) can leave a shard dead for hours while the Cluster process stays alive, so hybrid-sharding heartbeat/respawn never fires. We recover on the Health Coordinator (cluster 0): track a Shard Incident from the first unhealthy signal, throttle 503 Storm logs, DM admins under `ALERT`+cooldown only after sustained unhealthiness (when recovery starts), then Recovery Action in order—`shard.destroy()` first, Cluster respawn via IPC only if still unhealthy after settle—so we avoid mass reconnects from `respawn: true` or parallel shard repairs.

## Considered Options

- Auto `respawn: true` on ClusterManager: rejected; causes mass Discord reconnects under transient load.
- Parent (`core-Discord.js`) owns all recovery: deferred; Cluster 0 already has `broadcastEval`, alert DMs, and existing ShardFix hooks. Parent only **forwards** `shardHealthReport` IPC to the coordinator.
- Immediate Cluster respawn on first prolonged error: rejected; progressive destroy→respawn is safer for false positives.

## Consequences

- Only one shard is recovered at a time; multi-shard outages take longer but reconnect storms are less likely.
- While a Cluster has an in-flight Recovery Action, no second `destroy` is started for another shard on that same Cluster.
- Heartbeat-miss on the parent stays log-only (no Admin Alert) in this design; Roll Worker timeouts are out of scope.
- Timing defaults: incident tracked immediately after boot grace, recovery after 3m open, destroy settle 3m, re-open cooldown 10m; resolved requires two consecutive healthy health checks.
- **Boot grace**: Health Coordinator poll / incident ingest / recovery do **not** start until parent broadcasts `startHeartbeat` (after `[Cluster] All clusters are ready…`). Pre-ready Connecting/missing shards will not false-trigger destroy. Manual `.root fixshard` may end grace early on the coordinator.
- Non-coordinator clusters report gateway errors via IPC (`shardHealthReport`); coordinator also polls shard health so silent stuck shards are still caught (only after boot grace).
- `checkShardHealth` / `startShardFix` are thin entry points into the HealthMonitor incident/recovery path (no second competing auto-fix loop). Non-coordinator `autoAlert` is a no-op (Admin Alerts only from coordinator `shardIncident`).
- Health check never treats `assumed_healthy` / missing shard as responsive.
- Escalate-to-respawn logs an explicit upgrade reason (e.g. still unhealthy after destroy settle) and force-emits an Admin Alert past cooldown.
- Admin Alert: **open** at recovery start (not on first error), periodic **update**, escalate, and **resolved** only if Admin was already alerted; transient self-heal before recoveryMs sends no DM.
- Deploy must set `ALERT=true` and valid `ADMIN_SECRET` or DMs stay off (default `ALERT=false`).
- Known limit: if the Health Coordinator cluster itself is down, this path stops until parent respawns that cluster.
