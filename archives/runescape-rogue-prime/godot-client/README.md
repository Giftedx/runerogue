# Godot Game Client for RuneScape Rogue Prime

This directory will contain the Godot Engine project for the RuneScape Rogue Prime game client.

## Getting Started with Godot

1.  **Download Godot Engine:** If you haven't already, download the Godot Engine (v4.x recommended) from the official website: [https://godotengine.org/download](https://godotengine.org/download)

2.  **Create a New Godot Project:**

    - Open Godot Engine.
    - Click on "New Project".
    - Set the "Project Path" to this directory: `C:\Users\aggis\GitHub\runerogue\runescape-rogue-prime\godot-client`
    - Choose a "Project Name" (e.g., `RuneScapeRoguePrime`).
    - Click "Create & Edit".

3.  \*\*Initial Project Setup (Inside Godot):

    - **Project Settings:** Go to `Project -> Project Settings -> General`.
    - **Window:** Under `Display -> Window`:
      - Set `Viewport Width` and `Viewport Height` to your desired game resolution (e.g., 800x600 or 1024x768 for pixel art).
      - Set `Stretch Mode` to `canvas_items` and `Stretch Aspect` to `keep` for pixel-perfect scaling.
    - **Rendering:** Under `Rendering -> 2D`:
      - Consider `Snap to Pixel` for crisp pixel art rendering.

4.  **HTML5 Export Setup:**

    - Go to `Project -> Export...`.
    - Click "Add..." and select "HTML5".
    - **Export Path:** Set the `Path` to `../meta-ui/public/godot-export` (relative to the Godot project root, so it exports directly into the Next.js `public` directory).
    - **Custom HTML Shell:** You might want to create a custom HTML shell for better integration with the Next.js app. This can be done by enabling `Custom HTML Shell` and providing a path to your custom HTML file.
    - **Export Presets:** Configure other settings as needed (e.g., `Export with Debug`, `Enable Fullscreen Button`).
    - **Export Project:** Click "Export Project" to generate the HTML5 build.

5.  **UI Framework:**
    - **Core Game UI (Player-Facing):** Designed and implemented within Godot's powerful built-in UI system (Control nodes), leveraging its flexibility for custom layouts, animations, and OSRS-style iconography (Player Stats, Equipped, Inventory, Combat Log, Skills, Minimap). This UI _must_ display data fetched from the authoritative game server.
      - **Implementation Guidance:**
        - **Scene Structure:** Create separate Godot scenes for each major UI component (e.g., `PlayerStats.tscn`, `Inventory.tscn`, `Minimap.tscn`).
        - **Control Nodes:** Use `Control` nodes (e.g., `Panel`, `Label`, `TextureRect`, `Button`) to construct the UI layout. Utilize `Anchor` and `Margin` properties for responsive design.
        - **Data Binding:** Implement GDScript or C# scripts to fetch and display data from the game server (once WebSocket communication is established in M3). For now, use mock data.
        - **OSRS Style:** Pay close attention to fonts, colors, borders, and iconography to match the OSRS aesthetic.
        - **Minimap:** For the minimap, consider using a `Viewport` to render a top-down view of the player's immediate surroundings, overlaid with UI elements.
    - **WebSocket Communication (Client-Server):**
      - **Godot's WebSocketClient:** Use Godot's `WebSocketClient` class to establish a connection to the game server.
      - **Connection:** Connect to `ws://localhost:3000` (or the appropriate server address).
      - **Sending Data:** Convert Godot data (e.g., player input, actions) to JSON strings and send them over the WebSocket.
      - **Receiving Data:** Parse incoming JSON messages from the server to update the client-side game state (e.g., player positions, entity updates).
      - \*\*Example (GDScript):

```gdscript
# Example Godot WebSocket Client Script
extends Node

var client = WebSocketClient.new()
var peer = PacketPeerWebSocket.new()

func _ready():
    client.connect_to_url("ws://localhost:3000") # Replace with your server address
    client.connect("connection_closed", self, "_on_connection_closed")
    client.connect("connection_error", self, "_on_connection_error")
    client.connect("connection_established", self, "_on_connection_established")
    client.connect("data_received", self, "_on_data_received")

func _process(delta):
    client.poll()

func _on_connection_established(protocol):
    print("Connected to server!")
    # Example: Send a player move message
    var msg = {"type": "player_move", "x": 10, "y": 20}
    peer.put_packet(JSON.print(msg).to_utf8())

func _on_data_received():
    var data = peer.get_packet().get_string_from_utf8()
    var parsed_data = JSON.parse(data).result
    print("Received from server: ", parsed_data)
    # Process world updates, game state, etc.

func _on_connection_closed(was_clean = false):
    print("Connection closed!")

func _on_connection_error():
    print("Connection error!")

func send_player_action(action_type, target_id = null):
    var msg = {"type": "player_action", "action": action_type}
    if target_id != null:
        msg["targetId"] = target_id
    peer.put_packet(JSON.print(msg).to_utf8())
```

    *   **Out-of-Game UI (Meta-UI):** Implemented using **React (via Next.js) with TypeScript and Tailwind CSS** for login, registration, settings, leaderboards, account management. This UI layer *must* communicate with the backend via a well-defined JavaScript API (for Godot integration) or HTTPS REST calls (for Next.js).
    *   **Asset Management:** Client assets *must* be version-controlled (Git LFS) and optimized.

## Integration with Meta-UI (Next.js)

Once exported, the Godot game will be available in the `meta-ui/public/godot-export` directory. You will then embed this into your Next.js application (e.g., in `meta-ui/app/page.tsx`) using an `iframe` or by directly loading the Godot-generated `index.html`.

Example `iframe` embedding in `meta-ui/app/page.tsx`:

```tsx
// meta-ui/app/page.tsx

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8">RuneScape Rogue Prime</h1>
      <div className="w-full h-[600px] max-w-[800px] border-2 border-gray-700">
        <iframe
          src="/godot-export/index.html"
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
          title="RuneScape Rogue Prime Game"
        ></iframe>
      </div>
      <p className="mt-8 text-lg">Welcome to the adventure!</p>
    </main>
  );
}
```

Remember to adjust the `width` and `height` of the `iframe` to match your Godot project's resolution settings.
