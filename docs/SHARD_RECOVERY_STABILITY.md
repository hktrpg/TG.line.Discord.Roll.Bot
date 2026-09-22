# Shard recovery stability

The parent owns one recovery queue. Each cluster's respawn method is wrapped at
creation, so death handlers, IPC requests and the existing respawnAll scheduler
share the same limit. Calls for the same cluster share a promise. Only the
restart itself runs one cluster at a time. Cooldown, retry backoff, failure-budget
waits and the multi-cluster outage pause happen outside that lock, so a cluster
that is not allowed to start does not delay one that is.

Each request has at most three attempts with 5/10 second retry delays. Subsequent
requests for that cluster wait at least 60 seconds after the previous request
finishes. Shutdown cancels waiting work; it does not interrupt a respawn already
executing (normal shutdown handles child cleanup).

Failed attempts, including retries, share a rolling 10-minute budget: 12 globally
and 3 per cluster. A restart that reaches Ready does not consume the budget, so a
full respawnAll cannot exhaust failure recovery. New requests do not reset the
failure window. Exhausted budgets wait until the oldest counted failure expires.
Failures on three different clusters without an intervening successful recovery
pause attempts for five minutes. The next attempt is a probe; success clears this
outage state, failure extends the pause. This is conservative load protection,
not a diagnosis of a network outage or a replacement for Discord session-start
quota accounting.

The parent accepts CLUSTER_RECOVERY_WINDOW_MS, CLUSTER_RECOVERY_GLOBAL_LIMIT,
CLUSTER_RECOVERY_CLUSTER_LIMIT and CLUSTER_RECOVERY_OUTAGE_PAUSE_MS overrides.
These are application defaults, not upstream recommendations. A cluster waiting
on its own cooldown or failure budget no longer holds the shared execution lock.
The installed HeartbeatManager does not observe respawn rejection; the adapter
logs it while preserving rejection for awaiting callers. Missing/nonpositive or
infinite Ready timeouts are replaced with 120 seconds. Options are snapshotted at
enqueue time to prevent library mutation of shared spawnOptions affecting work.

The existing caller's Ready timeout still applies. Serial recovery deliberately
takes longer during a fleet-wide outage, to avoid concurrent boot and DB load.

Shard recovery rechecks ownership and current status. A shard that is already
Ready resolves the incident. An unhealthy shard whose installed discord.js API
lacks destroy enters observe-only waiting_settle for HEALTH_SHARD_DESTROY_SETTLE_MS
(180 seconds by default), after the initial 180-second incident threshold. No
socket is destroyed. Two healthy checks resolve it naturally. Escalation requires
a numeric unhealthy status sampled at/after the observation deadline, no newer
healthy sample, and a sample no older than one health-check interval. Missing,
unknown and failed probes during observation are not evidence for escalation.
The initial missing-shard recovery path still requests a parent-managed cluster
respawn; this change specifically replaces the unsupported-API shortcut.
Observation emits only a diagnostic event, not periodic health logs.
Observation has a hard maximum of HEALTH_SHARD_OBSERVATION_MAX_MS (default 360
seconds from observation start, clamped to at least the settle duration). At that
deadline, two healthy checks resolve first. Otherwise, fresh qualifying unhealthy
evidence escalates through the same predicate used before the deadline, unless
gateway outage suppression is active. Only an inconclusive or suppressed attempt
releases both the global recovery slot and the incident's busy phase,
records observation_inconclusive, and uses the existing retry cooldown. It does
not mark the shard healthy or force a restart without evidence. Expiry also runs
during gateway-outage suppression. Another incident can proceed in the same tick.
Every recovery attempt/escalation has a generation ID. Broadcast results and
asynchronous failures must match both that ID and the current action before they
can change state. Only an accepted destroy-to-observe transition emits the start
diagnostic; stale results emit recovery_result_ignored. These event logs remain
behind DEBUG_LOG=true, with no periodic health logging.
Any other result keeps the existing retry backoff. IPC delivery is not
treated as Ready: health probes continue and the incident uses the existing retry
backoff. No internal discord.js websocket fields are manipulated.

## Validation

Run the cluster-recovery, shard-recovery-contract, shard-native-recovery, health-monitor-shard,
shard-client-shape, shard-connection and shard-topology Jest suites. The contract
test uses the installed discord.js WebSocketShard, not a destroy-capable mock.

## Deployment

Production Discord mounts /data/bots/discord-bot onto /app. Its node_modules is a
separate named volume. Rebuilding an image does not update either mounted source
or that dependency volume. This change does not modify dependencies.

Before deployment, record the current checkout and preserve untracked deployment
files. Review all changes from production f1b18462 to the chosen release, not only
this patch. Update the mounted checkout to that reviewed release, restart Discord
in a maintenance window, and compare container source hashes to the release.
Verify all clusters reach Ready, and watch ClusterRecovery attempt logs, memory,
event-loop lag and database errors. Do not fault-inject against production.

Rollback uses the recorded prior source revision and a Discord restart, preserving
untracked Dockerfiles, environment backups, database and artifact volumes. No
git clean, hard reset or volume deletion is needed.

This patch addresses recovery defects, not a proven cause of the Oracle VM hang.
MongoDB/Agenda resource budgets and Telegram load attribution require separate
measurement. No production service was changed by these local edits.
