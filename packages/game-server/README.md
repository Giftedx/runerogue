# @runerogue/game-server

**Status: Legacy Prototype**

This package contains a simplified, alternative implementation of the RuneRogue game server. It was developed as a prototype and does not use the main ECS (Entity-Component-System) architecture, nor does it use canonical schemas and data from `@runerogue/shared` and `@runerogue/osrs-data`.

## Key Differences from a Future Canonical Server

- No ECS: State is managed directly on Colyseus schema objects
- Simplified Schemas: Uses package-local schemas under `src/schemas/`
- Hardcoded Logic: Some OSRS formulas and logic may be out of sync with shared libraries

## Recommendation

This package is retained for historical reference and experiments. There is currently no canonical backend server in this repository. If you need a server to test the client, you may run this package locally, but it is not maintained and may diverge from shared contracts.

## Running locally

From the repository root, start the legacy server in development mode:

```bash
pnpm run server:dev
```

This will boot a Colyseus server on `ws://localhost:2567` (uses HTTPS/WSS if `cert.pem` and `key.pem` are present). The Colyseus monitor is available at `/colyseus`.

Alternatively, you can run within this package directory:

```bash
pnpm install
pnpm run dev
```

## Running integration tests

Integration tests are opt-in and expect a running local server (as above). In one terminal, start the server; in another, run:

```bash
pnpm run test:integration
```

You can also include integration tests when executing the main test command by setting an environment flag:

```bash
RUN_INTEGRATION=1 pnpm run test
```
