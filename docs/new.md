# Third-Party Resources for RuneRogue

This document lists third-party resources, libraries, engines, and inspirational projects relevant to the development of RuneRogue.

## I. RuneScape & RSPS Development

### A. Servers & Emulators

- **[OpenRS2](https://github.com/openrs2/openrs2):** A project aimed at preserving and making accessible various versions of RuneScape. Includes cache and client loaders.
- **[RuneLite](https://github.com/runelite/runelite):** Open-source Old School RuneScape client. (Inspiration for client features, plugin architecture)
- **[OSRS Remake](https://github.com/osrs-remake/osrs-remake):** A remake of Old School RuneScape.
- **[2009scape](https://2009scape.org/):** A 2009 era RuneScape private server.
- **[Apollo](https://github.com/apollo-rsps/apollo):** A popular RuneScape private server framework (Kotlin-based).
- **[Hyperion](https://github.com/HyperionRSPS/Hyperion):** Another widely-used RSPS framework (Java-based).

### B. Clients & Client Development

- **[OSRS Client (Deobfuscated)](https://github.com/zeruth/runescape-client):** Deobfuscated OSRS client source. (Reference for client mechanics)
- **[RSMod](https://github.com/Tomm0017/rsmod):** A game server suite for RuneScape, written in Kotlin.

### C. Cache Tools & Data Libraries

- **[OpenRS2 Cache Tools](https://github.com/openrs2/cache):** Tools for working with RuneScape cache files.
- **[RuneLite Cache Dumper](https://github.com/runelite/cache-dumper):** Tools for dumping and analyzing OSRS cache data.
- **[OSRSBox Project](https://www.osrsbox.com/):** Provides OSRS data APIs and libraries (items, monsters, etc.).

### D. Asset Libraries & Map Editors

- **[RuneLite Model/Texture Exporters](https://github.com/runelite/runelite/tree/master/runelite-client/src/main/java/net/runelite/client/exporter):** For extracting game assets.
- **RSMapEditor:** (Often found in various RSPS communities) - A tool for editing RuneScape maps.

## II. General Game Development (2D TypeScript/JavaScript Focus)

### A. Game Engines & Frameworks

- **[Phaser](https://phaser.io/):** Popular 2D HTML5 game framework. (Good for web-based clients or mini-games)
- **[PixiJS](https://pixijs.com/):** Fast 2D rendering engine. (Can be used with or without a full engine structure)
- **[Excalibur.js](https://excaliburjs.com/):** A simple 2D HTML5 game engine written in TypeScript.
- **[Babylon.js](https://www.babylonjs.com/):** Powerful 3D/2D game engine, good for more complex visuals if needed. (Though focus is 2D, its 2D capabilities are strong)

### B. Entity Component System (ECS) Libraries

- **[Geotic](https://github.com/ddmills/geotic):** An ECS library for JavaScript.
- **[ecsy](https://github.com/MozillaReality/ecsy):** ECS library by Mozilla, performance-focused.
- **[bitecs](https://github.com/NateTheGreatt/bitECS):** High-performance ECS library.

### C. Physics Engines

- **[Matter.js](https://brm.io/matter-js/):** 2D rigid body physics engine for the web.
- **[p2.js](https://github.com/schteppe/p2.js):** Another 2D rigid body physics engine.

### D. Rendering & Graphics

- **[TWGL.js](https://twgljs.org/):** A tiny WebGL helper library.
- **[Regl](http://regl.party/):** Functional WebGL.

### E. Pathfinding & AI

- **[PathFinding.js](https://github.com/qiao/PathFinding.js):** Pathfinding algorithms for JavaScript.
- **[Easystar.js](https://github.com/prettymuchbryce/easystarjs):** Asynchronous A\* pathfinding for JavaScript.

### F. Audio Libraries

- **[Howler.js](https://howlerjs.com/):** Modern Web Audio library.
- **[Tone.js](https://tonejs.github.io/):** Web Audio framework for creating interactive music in the browser.

### G. Mapping & Tiling

- **[Tiled Map Editor](https://www.mapeditor.org/):** General-purpose tile map editor. (Can export to JSON for use in JS engines)
- **[LDtk (Level Designer Toolkit)](https://ldtk.io/):** Modern 2D level editor.

### H. General Utility Libraries

- **[Lodash](https://lodash.com/):** Utility library delivering modularity, performance, & extras.
- **[RxJS](https://rxjs.dev/):** Reactive extensions for JavaScript. (Useful for event handling, async operations)

## III. Multiplayer Networking & Platforms

### A. Frameworks & Libraries

- **[Colyseus](https://colyseus.io/):** Authoritative multiplayer game server framework for Node.js (TypeScript).
  - **[Colyseus Examples](https://github.com/colyseus/colyseus-examples):** Official examples for Colyseus.
- **[Socket.IO](https://socket.io/):** Real-time bidirectional event-based communication.
- **[Nakama](https://heroiclabs.com/nakama/):** Open-source scalable game server.

### B. Hosting Platforms

- **[DigitalOcean](https://www.digitalocean.com/):** Cloud hosting for servers.
- **[AWS (Amazon Web Services)](https://aws.amazon.com/):** Comprehensive cloud services.
- **[Google Cloud Platform (GCP)](https://cloud.google.com/):** Scalable cloud infrastructure.
- **[Fly.io](https://fly.io/):** Platform for deploying full-stack apps and databases close to users.
- **[Railway.app](https://railway.app/):** Infrastructure platform.

## IV. Supporting Development Tools

### A. UI Frameworks (for potential tools or debug interfaces)

- **[React](https://reactjs.org/):** JavaScript library for building user interfaces.
- **[Vue.js](https://vuejs.org/):** Progressive JavaScript framework.
- **[Svelte](https://svelte.dev/):** Cybernetically enhanced web apps.

### B. Serialization

- **[Protocol Buffers (protobuf)](https://developers.google.com/protocol-buffers):** Language-neutral, platform-neutral, extensible mechanism for serializing structured data.
- **[FlatBuffers](https://google.github.io/flatbuffers/):** Efficient cross-platform serialization library.
- **[MessagePack](https://msgpack.org/):** Efficient binary serialization format.

### C. Build Tools & Task Runners

- **[Webpack](https://webpack.js.org/):** Module bundler for JavaScript applications.
- **[Parcel](https://parceljs.org/):** Blazing fast, zero configuration web application bundler.
- **[esbuild](https://esbuild.github.io/):** Extremely fast JavaScript bundler and minifier.
- **[Rollup](https://rollupjs.org/):** A module bundler for JavaScript.
- **[TypeScript](https://www.typescriptlang.org/):** Superset of JavaScript that adds types.
- **[Nodemon](https://nodemon.io/):** Utility that monitors for changes in Node.js application and automatically restarts the server.

## V. Broader Game Development & Inspirational Projects

### A. RPG & Roguelike Examples

- **[Rot.js](https://ondras.github.io/rot.js/hp/):** Roguelike toolkit in JavaScript.
- **[Brogue](https://sites.google.com/site/broguegame/):** Classic, highly-regarded roguelike. (Inspiration for mechanics, depth)
- **[Dungeon Crawl Stone Soup (DCSS)](https://crawl.develz.org/):** Open-source roguelike. (Extensive content, design patterns)
- **[Cataclysm: Dark Days Ahead (CDDA)](https://cataclysmdda.org/):** Open-source post-apocalyptic survival roguelike. (Complex systems)

### B. AI/ML in Games (Conceptual / Advanced)

- **[Unity ML-Agents](https://unity.com/products/machine-learning-agents):** Train intelligent agents using reinforcement learning. (Conceptual, for advanced AI behaviors)
- **[TensorFlow.js](https://www.tensorflow.org/js):** Machine learning in JavaScript.

## VI. Dependencies & Inspirations from Archived/Internal Projects

_(This section is for listing specific libraries, tools, or patterns from previous internal projects that might be relevant or need to be migrated/re-evaluated for RuneRogue)_

### A. Python-based Tools/Libraries (if any were used previously)

- _(Example: Custom data processing scripts, backend services)_

### B. Node.js Libraries (from previous server attempts or tools)

- _(Example: Specific Express middleware, database connectors)_

### C. Infrastructure & DevOps Tools

- _(Example: Docker configurations, CI/CD pipeline scripts)_

### D. Game Engines/Frameworks Used in Prototypes

- **[Godot Engine](https://godotengine.org/):** If prototypes were made here, list relevant learnings or assets.

---

_This list is a living document and should be updated as new resources are discovered or evaluated._
