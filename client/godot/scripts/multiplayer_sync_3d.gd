extends Node
class_name MultiplayerSync3D

## Enhanced 3D Multiplayer Synchronization for RuneRogue
## Handles real-time 3D player movement, state sync, and lag compensation

# Signals for 3D events
signal player_joined(player_id: String, player_data: Dictionary)
signal player_left(player_id: String)
signal player_moved(player_id: String, position: Vector3, rotation: float)
signal player_state_updated(player_id: String, state: Dictionary)
signal enemy_spawned(enemy_id: String, enemy_data: Dictionary)
signal enemy_moved(enemy_id: String, position: Vector3, rotation: float)
signal enemy_destroyed(enemy_id: String)
signal combat_event(event_data: Dictionary)

# Network settings
@export var interpolation_enabled: bool = true
@export var prediction_enabled: bool = true
@export var lag_compensation_enabled: bool = true
@export var max_prediction_time: float = 0.5
@export var interpolation_factor: float = 0.1
@export var position_threshold: float = 0.1  # Minimum distance to trigger movement update

# Connection settings
@export var server_url: String = "ws://localhost:2567"
@export var room_name: String = "game_room"

# Player tracking with 3D data
var players: Dictionary = {}  # player_id -> PlayerSyncData3D
var enemies: Dictionary = {}  # enemy_id -> EnemySyncData3D
var local_player_id: String = ""
var network_manager: Node
var websocket: WebSocketPeer

# Prediction and interpolation buffers
var movement_buffer: Array[Dictionary] = []
var max_buffer_size: int = 60  # Store ~1 second at 60fps
var last_server_time: float = 0.0
var time_offset: float = 0.0

# Rate limiting
var last_movement_send: float = 0.0
var movement_send_rate: float = 0.016  # ~60fps

class PlayerSyncData3D:
	"""Enhanced player data for 3D synchronization"""
	var id: String
	var position_3d: Vector3
	var target_position_3d: Vector3
	var velocity_3d: Vector3
	var rotation_y: float
	var target_rotation_y: float
	var health: int
	var max_health: int
	var skills: Dictionary
	var equipment: Dictionary
	var animation_state: String
	var last_update_time: float
	var interpolation_start_pos: Vector3
	var interpolation_start_rot: float
	var interpolation_start_time: float
	var is_local: bool = false
	
	func _init(player_id: String, is_local_player: bool = false):
		id = player_id
		is_local = is_local_player
		position_3d = Vector3.ZERO
		target_position_3d = Vector3.ZERO
		velocity_3d = Vector3.ZERO
		rotation_y = 0.0
		target_rotation_y = 0.0
		health = 100
		max_health = 100
		skills = {}
		equipment = {}
		animation_state = "idle"
		last_update_time = 0.0
		interpolation_start_pos = Vector3.ZERO
		interpolation_start_rot = 0.0
		interpolation_start_time = 0.0
	
	func update_position_3d(new_pos: Vector3, new_rot: float, server_time: float):
		"""Update position with interpolation setup"""
		if interpolation_start_time == 0.0:
			position_3d = new_pos
			rotation_y = new_rot
		else:
			interpolation_start_pos = position_3d
			interpolation_start_rot = rotation_y
		
		target_position_3d = new_pos
		target_rotation_y = new_rot
		interpolation_start_time = server_time
		last_update_time = server_time
	
	func interpolate_to_target(delta: float, interpolation_speed: float = 10.0):
		"""Smooth interpolation to target position"""
		if interpolation_start_time > 0.0:
			position_3d = position_3d.lerp(target_position_3d, interpolation_speed * delta)
			rotation_y = lerp_angle(rotation_y, target_rotation_y, interpolation_speed * delta)
			
			# Stop interpolating when close enough
			if position_3d.distance_to(target_position_3d) < 0.01:
				position_3d = target_position_3d
				rotation_y = target_rotation_y

class EnemySyncData3D:
	"""Enemy data for 3D synchronization"""
	var id: String
	var position_3d: Vector3
	var target_position_3d: Vector3
	var rotation_y: float
	var target_rotation_y: float
	var health: int
	var max_health: int
	var enemy_type: String
	var animation_state: String
	var last_update_time: float
	
	func _init(enemy_id: String, enemy_type_name: String):
		id = enemy_id
		enemy_type = enemy_type_name
		position_3d = Vector3.ZERO
		target_position_3d = Vector3.ZERO
		rotation_y = 0.0
		target_rotation_y = 0.0
		health = 100
		max_health = 100
		animation_state = "idle"
		last_update_time = 0.0

func _ready() -> void:
	print("MultiplayerSync3D: Initializing 3D multiplayer sync")
	websocket = WebSocketPeer.new()
	set_process(true)

func initialize_3d_sync() -> void:
	"""Initialize 3D synchronization system"""
	print("MultiplayerSync3D: 3D sync system initialized")
	
	# Setup interpolation timer
	var timer = Timer.new()
	timer.wait_time = 0.016  # ~60fps
	timer.timeout.connect(_process_interpolation)
	timer.autostart = true
	add_child(timer)

func set_local_player_id(player_id: String) -> void:
	"""Set the local player ID"""
	local_player_id = player_id
	print("MultiplayerSync3D: Local player ID set to: ", player_id)

# ============================================
# Network Connection
# ============================================

func connect_to_server() -> void:
	"""Connect to the Colyseus server"""
	print("MultiplayerSync3D: Connecting to server: ", server_url)
	
	var error = websocket.connect_to_url(server_url)
	if error != OK:
		print("MultiplayerSync3D: Failed to connect to server: ", error)
		return
	
	websocket.poll()

func disconnect_from_server() -> void:
	"""Disconnect from the server"""
	print("MultiplayerSync3D: Disconnecting from server")
	
	if websocket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		websocket.close()
	
	players.clear()
	enemies.clear()

func _process(_delta: float) -> void:
	"""Process network messages"""
	if websocket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		websocket.poll()
		
		var packet = websocket.get_packet()
		while packet.size() > 0:
			var message_str = packet.get_string_from_utf8()
			_handle_server_message(message_str)
			packet = websocket.get_packet()

func _handle_server_message(message: String) -> void:
	"""Parse and handle messages from server"""
	var json = JSON.new()
	var parse_result = json.parse(message)
	
	if parse_result != OK:
		print("MultiplayerSync3D: Failed to parse message: ", message)
		return
	
	var data = json.data
	var message_type = data.get("type", "")
	
	match message_type:
		"player_joined":
			_handle_player_joined(data)
		"player_left":
			_handle_player_left(data)
		"player_moved_3d":
			_handle_player_moved_3d(data)
		"player_state_update":
			_handle_player_state_update(data)
		"enemy_spawned":
			_handle_enemy_spawned(data)
		"enemy_moved":
			_handle_enemy_moved(data)
		"enemy_destroyed":
			_handle_enemy_destroyed(data)
		"combat_event":
			_handle_combat_event(data)
		_:
			print("MultiplayerSync3D: Unknown message type: ", message_type)

# ============================================
# Message Handlers
# ============================================

func _handle_player_joined(data: Dictionary) -> void:
	"""Handle player joined message"""
	var player_id = data.get("sessionId", "")
	var player_data = data.get("playerData", {})
	
	if player_id.is_empty():
		return
	
	var is_local = (player_id == local_player_id)
	var sync_data = PlayerSyncData3D.new(player_id, is_local)
	
	# Set initial position from server data
	if player_data.has("position"):
		var pos_data = player_data.position
		sync_data.position_3d = Vector3(pos_data.x, pos_data.z, pos_data.y)  # Convert Y-up to Z-up
		sync_data.target_position_3d = sync_data.position_3d
	
	if player_data.has("rotation"):
		sync_data.rotation_y = player_data.rotation
		sync_data.target_rotation_y = sync_data.rotation_y
	
	# Set health and other stats
	if player_data.has("health"):
		sync_data.health = player_data.health.current
		sync_data.max_health = player_data.health.max
	
	if player_data.has("skills"):
		sync_data.skills = player_data.skills
	
	if player_data.has("equipment"):
		sync_data.equipment = player_data.equipment
	
	players[player_id] = sync_data
	player_joined.emit(player_id, player_data)

func _handle_player_left(data: Dictionary) -> void:
	"""Handle player left message"""
	var player_id = data.get("sessionId", "")
	
	if players.has(player_id):
		players.erase(player_id)
		player_left.emit(player_id)

func _handle_player_moved_3d(data: Dictionary) -> void:
	"""Handle 3D player movement message"""
	var player_id = data.get("sessionId", "")
	var position_data = data.get("position", {})
	var rotation = data.get("rotation", 0.0)
	var server_time = data.get("timestamp", Time.get_time_dict_from_system())
	
	if not players.has(player_id):
		return
	
	var player_data = players[player_id]
	var new_position = Vector3(position_data.get("x", 0), position_data.get("z", 0), position_data.get("y", 0))
	
	# Skip update if this is our local player (we predict locally)
	if player_id == local_player_id and prediction_enabled:
		return
	
	player_data.update_position_3d(new_position, rotation, Time.get_time_dict_from_system())
	player_moved.emit(player_id, new_position, rotation)

func _handle_player_state_update(data: Dictionary) -> void:
	"""Handle player state update message"""
	var player_id = data.get("sessionId", "")
	var state_data = data.get("state", {})
	
	if not players.has(player_id):
		return
	
	var player_data = players[player_id]
	
	# Update health
	if state_data.has("health"):
		player_data.health = state_data.health.get("current", player_data.health)
		player_data.max_health = state_data.health.get("max", player_data.max_health)
	
	# Update skills
	if state_data.has("skills"):
		player_data.skills = state_data.skills
	
	# Update equipment
	if state_data.has("equipment"):
		player_data.equipment = state_data.equipment
	
	# Update animation state
	if state_data.has("animation"):
		player_data.animation_state = state_data.animation
	
	player_state_updated.emit(player_id, state_data)

func _handle_enemy_spawned(data: Dictionary) -> void:
	"""Handle enemy spawn message"""
	var enemy_id = data.get("enemyId", "")
	var enemy_data = data.get("enemyData", {})
	
	if enemy_id.is_empty():
		return
	
	var enemy_type = enemy_data.get("type", "unknown")
	var sync_data = EnemySyncData3D.new(enemy_id, enemy_type)
	
	# Set initial position
	if enemy_data.has("position"):
		var pos_data = enemy_data.position
		sync_data.position_3d = Vector3(pos_data.x, pos_data.z, pos_data.y)
		sync_data.target_position_3d = sync_data.position_3d
	
	if enemy_data.has("rotation"):
		sync_data.rotation_y = enemy_data.rotation
		sync_data.target_rotation_y = sync_data.rotation_y
	
	if enemy_data.has("health"):
		sync_data.health = enemy_data.health.current
		sync_data.max_health = enemy_data.health.max
	
	enemies[enemy_id] = sync_data
	enemy_spawned.emit(enemy_id, enemy_data)

func _handle_enemy_moved(data: Dictionary) -> void:
	"""Handle enemy movement message"""
	var enemy_id = data.get("enemyId", "")
	var position_data = data.get("position", {})
	var rotation = data.get("rotation", 0.0)
	
	if not enemies.has(enemy_id):
		return
	
	var enemy_data = enemies[enemy_id]
	var new_position = Vector3(position_data.get("x", 0), position_data.get("z", 0), position_data.get("y", 0))
	
	enemy_data.target_position_3d = new_position
	enemy_data.target_rotation_y = rotation
	
	enemy_moved.emit(enemy_id, new_position, rotation)

func _handle_enemy_destroyed(data: Dictionary) -> void:
	"""Handle enemy destruction message"""
	var enemy_id = data.get("enemyId", "")
	
	if enemies.has(enemy_id):
		enemies.erase(enemy_id)
		enemy_destroyed.emit(enemy_id)

func _handle_combat_event(data: Dictionary) -> void:
	"""Handle combat event message"""
	combat_event.emit(data)

# ============================================
# Client -> Server Communication
# ============================================

func send_movement_3d(movement_input: Vector3) -> void:
	"""Send 3D movement input to server"""
	var current_time = Time.get_time_dict_from_system()
	
	# Rate limiting
	if current_time - last_movement_send < movement_send_rate:
		return
	
	last_movement_send = current_time
	
	# Predict local movement if enabled
	if prediction_enabled and players.has(local_player_id):
		_predict_local_movement(movement_input)
	
	var message = {
		"type": "player_move_3d",
		"input": {
			"x": movement_input.x,
			"y": movement_input.y,
			"z": movement_input.z
		},
		"timestamp": current_time
	}
	
	_send_message(message)

func send_combat_action(action_type: String, target_id: String = "") -> void:
	"""Send combat action to server"""
	var message = {
		"type": "combat_action",
		"action": action_type,
		"target": target_id,
		"timestamp": Time.get_time_dict_from_system()
	}
	
	_send_message(message)

func _send_message(message: Dictionary) -> void:
	"""Send message to server"""
	if websocket.get_ready_state() != WebSocketPeer.STATE_OPEN:
		print("MultiplayerSync3D: Cannot send message, not connected")
		return
	
	var json_string = JSON.stringify(message)
	websocket.send_text(json_string)

# ============================================
# Prediction and Interpolation
# ============================================

func _predict_local_movement(movement_input: Vector3) -> void:
	"""Predict local player movement for responsive controls"""
	if not players.has(local_player_id):
		return
	
	var player_data = players[local_player_id]
	var speed = 5.0  # TODO: Get from player stats
	var delta = get_process_delta_time()
	
	# Simple prediction - move based on input
	var predicted_movement = movement_input * speed * delta
	player_data.position_3d += predicted_movement
	
	# Store prediction for server reconciliation
	movement_buffer.append({
		"position": player_data.position_3d,
		"input": movement_input,
		"timestamp": Time.get_time_dict_from_system()
	})
	
	# Limit buffer size
	if movement_buffer.size() > max_buffer_size:
		movement_buffer.pop_front()

func _process_interpolation() -> void:
	"""Process interpolation for all players and enemies"""
	var delta = 0.016  # Fixed timestep for interpolation
	
	# Interpolate players
	for player_data in players.values():
		if player_data.id != local_player_id or not prediction_enabled:
			player_data.interpolate_to_target(delta, interpolation_factor * 60.0)
	
	# Interpolate enemies
	for enemy_data in enemies.values():
		enemy_data.position_3d = enemy_data.position_3d.lerp(enemy_data.target_position_3d, interpolation_factor * 60.0 * delta)
		enemy_data.rotation_y = lerp_angle(enemy_data.rotation_y, enemy_data.target_rotation_y, interpolation_factor * 60.0 * delta)

# ============================================
# Data Access Methods
# ============================================

func get_player_data_3d(player_id: String) -> PlayerSyncData3D:
	"""Get 3D player data"""
	return players.get(player_id, null)

func get_enemy_data_3d(enemy_id: String) -> EnemySyncData3D:
	"""Get 3D enemy data"""
	return enemies.get(enemy_id, null)

func get_all_players() -> Dictionary:
	"""Get all player data"""
	return players

func get_all_enemies() -> Dictionary:
	"""Get all enemy data"""
	return enemies

func is_connected() -> bool:
	"""Check if connected to server"""
	return websocket.get_ready_state() == WebSocketPeer.STATE_OPEN
