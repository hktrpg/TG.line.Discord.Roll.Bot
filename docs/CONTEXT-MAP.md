# Context Map

## Contexts

- [Discord runtime health](./CONTEXT.md): shard/cluster health monitoring and recovery
- [Character card](./character-card/CONTEXT.md): web and bot character sheets (`characterCard`)

## Relationships

- **Character card** uses the same Mongo user id as web accounts (`accountPW.id`) but is independent of Discord shard health terminology.
- **Character card v2 dual-write**: [`docs/adr/0002-character-card-v2-dual-write.md`](./adr/0002-character-card-v2-dual-write.md).
