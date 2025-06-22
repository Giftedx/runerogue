# Enemy System Test Instructions

## 🎯 Goal

Test the newly implemented enemy spawning, movement, and combat system in the SimpleTestRoom.

## 🚀 Quick Start (5 minutes)

### Step 1: Start the Server

```bash
cd packages/game-server
pnpm dev
```

**Expected output:** Server starts on port 2567 with "SimpleTestRoom registered" message.

### Step 2: Test with Node.js Client

```bash
# In project root
node test-enemy-system.js
```

**Expected behavior:**

- ✅ Connects to test room
- ✅ Shows initial statistics (Players: 1, Enemies: 0)
- ✅ Enemies spawn every 5 seconds
- ✅ Enemies move toward player
- ✅ Player automatically attacks enemies
- ✅ Combat damage appears in console
- ✅ Enemies die and respawn

### Step 3: Test with Web Client

```bash
cd packages/phaser-client
pnpm dev
```

**Then:**

1. Open browser to `http://localhost:3002`
2. Look for "🎮 RuneRogue Enemy Test" panel in top-left
3. Watch real-time statistics update
4. Click "Attack" and "Move" buttons to test manually

## 📊 Success Metrics

### ✅ Server-side (Node.js test client)

- [ ] **Connection**: Client connects without errors
- [ ] **Enemy Spawning**: Enemies spawn every 5 seconds
- [ ] **Enemy AI**: Enemies move toward player
- [ ] **Combat System**: Player and enemy attacks work
- [ ] **Death/Respawn**: Enemies die and new ones spawn
- [ ] **Statistics**: Kill count increases correctly

### ✅ Client-side (Web browser)

- [ ] **Connection Panel**: Shows connected status
- [ ] **Live Statistics**: Enemy/player counts update
- [ ] **Combat Events**: Attack counts increase
- [ ] **Manual Controls**: Attack/Move buttons work
- [ ] **Event Log**: Recent events show in panel

### ✅ Performance

- [ ] **Server Stability**: No crashes or memory leaks
- [ ] **Client Responsiveness**: UI updates smoothly
- [ ] **Network Sync**: Both clients see same enemy count

## 🐛 Troubleshooting

### Server won't start

```bash
# Check if port is in use
netstat -an | findstr :2567

# Kill existing process (Windows)
taskkill /F /PID <process_id>

# Restart server
cd packages/game-server && pnpm dev
```

### Client connection fails

1. Verify server is running on `ws://localhost:2567`
2. Check console for detailed error messages
3. Try refreshing the browser page

### No enemies spawning

- Wait 5 seconds after connection
- Check server console for "Spawned goblin/spider" messages
- Verify SimpleTestRoom has enemy spawning enabled

### Web client not updating

- Check browser developer console for errors
- Verify WebSocket connection in Network tab
- Try hard refresh (Ctrl+F5)

## 🔍 Advanced Testing

### Multiple Clients

Run multiple instances to test multiplayer:

```bash
# Terminal 1
node test-enemy-system.js

# Terminal 2
node test-enemy-system.js

# Browser
Open multiple tabs to localhost:3002
```

### Performance Testing

Monitor server performance with multiple clients:

```bash
# Monitor memory usage
# Windows: Task Manager > Game Server process
# Mac/Linux: htop or top
```

### Load Testing

For stress testing, modify `test-enemy-system.js`:

```javascript
// Change these values for stress testing
const MAX_ENEMIES = 20; // Instead of 3-5
const SPAWN_INTERVAL = 1000; // Instead of 5000 (1 second)
```

## 📈 Next Steps After Success

Once all tests pass:

1. **Integrate with GameScene**: Update the main Phaser game scene to render enemies
2. **Add OSRS Combat**: Replace simple damage with authentic OSRS formulas
3. **Visual Polish**: Add sprites, animations, and effects
4. **Wave Progression**: Implement wave-based difficulty scaling
5. **Performance Optimization**: Optimize for 60fps with 20+ enemies

## 🏆 Phase 1 Completion Criteria

- [x] **Enemy Schema**: SimpleEnemy schema implemented
- [x] **Enemy Spawning**: Server spawns enemies every 5 seconds
- [x] **Enemy AI**: Enemies move toward players
- [x] **Combat System**: Click/attack commands work
- [x] **Death/Respawn**: Enemy lifecycle complete
- [x] **Multiplayer Sync**: Multiple clients see same enemies
- [ ] **Client Rendering**: Phaser scene renders enemies (next step)
- [ ] **60fps Performance**: Maintains target framerate (next step)

## 📝 Test Results Template

Copy this template to track your test results:

```
## Enemy System Test Results - [Date]

### Server Test (Node.js client)
- [ ] Connection successful
- [ ] Enemies spawn every 5 seconds
- [ ] Enemy AI movement works
- [ ] Combat damage calculation works
- [ ] Enemy death/respawn cycle works
- [ ] Statistics tracking accurate

### Web Client Test
- [ ] Connection panel shows status
- [ ] Statistics update in real-time
- [ ] Manual attack button works
- [ ] Manual move button works
- [ ] Event log shows combat events

### Performance
- Server CPU usage: __%
- Client memory usage: __MB
- Network latency: __ms
- Enemy count sustained: __

### Issues Found
1.
2.
3.

### Overall Status: ✅ PASS / ❌ FAIL
```

---

**🎮 Ready to test! Start with Step 1 above.**
