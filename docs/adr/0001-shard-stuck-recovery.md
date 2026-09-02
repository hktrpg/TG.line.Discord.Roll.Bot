# Shard stuck recovery via Health Coordinator

Discord shard gateway failures (especially 503 reconnect loops) can leave a shard dead for hours while the Cluster process stays alive, so hybrid-sharding heartbeat/respawn never fires. We recover on the Health Coordinator (cluster 0): open a Shard Incident after sustained unhealthiness, throttle 503 Storm logs, DM admins under `ALERT`+cooldown, then Recovery Action in order—`shard.destroy()` first, Cluster respawn via IPC only if still unhealthy after settle—so we avoid mass reconnects from `respawn: true` or parallel shard repairs.

## Considered Options

- Auto `respawn: true` on ClusterManager: rejected; causes mass Discord reconnects under transient load.
- Parent (`core-Discord.js`) owns all recovery: deferred; Cluster 0 already has `broadcastEval`, alert DMs, and existing ShardFix hooks. Parent only **forwards** `shardHealthReport` IPC to the coordinator.
- Immediate Cluster respawn on first prolonged error: rejected; progressive destroy→respawn is safer for false positives.

## Consequences

- Only one shard is recovered at a time; multi-shard outages take longer but reconnect storms are less likely.
- While a Cluster has an in-flight Recovery Action, no second `destroy` is started for another shard on that same Cluster.
- Heartbeat-miss on the parent stays log-only (no Admin Alert) in this design; Roll Worker timeouts are out of scope.
- Timing defaults: incident open 3m, destroy settle 3m, re-open cooldown 10m; resolved requires two consecutive healthy health checks.
- Non-coordinator clusters report gateway errors via IPC (`shardHealthReport`); coordinator also polls shard health so silent stuck shards are still caught.
- `checkShardHealth` / `startShardFix` are thin entry points into the HealthMonitor incident/recovery path (no second competing auto-fix loop).
- Health check never treats `assumed_healthy` / missing shard as responsive.
- Escalate-to-respawn logs an explicit upgrade reason (e.g. still unhealthy after destroy settle).
- Admin Alert sends open, periodic updates, and a final **resolved** DM.
- Deploy must set `ALERT=true` and valid `ADMIN_SECRET` or DMs stay off (default `ALERT=false`).
- Known limit: if the Health Coordinator cluster itself is down, this path stops until parent respawns that cluster.
