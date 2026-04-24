# Docker Setup

This repository now includes two Docker image templates:

- `docker/Dockerfile.discord`: Discord-focused image with CJK fonts for features such as `.token`.
- `docker/Dockerfile.non-discord`: Telegram/Line/WhatsApp/web image with Chromium support for WhatsApp.

## Included files

- `.dockerignore`
- `docker/Dockerfile.discord`
- `docker/Dockerfile.non-discord`
- `docker/docker-compose.example.yml`
- `docker/.env.discord.example`
- `docker/.env.non-discord.example`

## Quick start

1. Copy the environment templates:

```bash
cp docker/.env.discord.example docker/.env.discord
cp docker/.env.non-discord.example docker/.env.non-discord
```

1. Fill in the secrets in both files.

1. Start the stack from the `docker` directory:

```bash
cd docker
docker compose -f docker-compose.example.yml up --build -d
```

## Notes

- The compose example uses MongoDB service name `mongodb`, so both bot env files should keep `mongoURL` pointing at `mongodb:27017`.
- This repository currently does not track `yarn.lock`, so both Dockerfiles install dependencies from `package.json` with `yarn install --non-interactive`.
- The non-Discord image mounts `/app/.wwebjs_auth` for persistent WhatsApp sessions.
- If you only need one runtime, you can remove the other service from the compose file.
