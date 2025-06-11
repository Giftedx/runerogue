extends Node
class_name MultiplayerSync

## Enhanced Multiplayer Synchronization for RuneRogue
## Handles real-time player movement, state sync, and lag compensation

signal player_joined(player_id: String, player_data: Dictionary)
signal player_left(player_id: String)
signal player_moved(player_id: String, position: Vector2, direction: String)
signal player_state_updated(player_id: String, state: Dictionary)

# Network settings
@export var interpolation_enabled: bool = true
@export var prediction_enabled: bool = true
@export var lag_compensation_enabled: bool = true
@export var max_prediction_time: float = 0.5

# Player tracking
var players: Dictionary = {} # player_id -> PlayerSyncData
var local_player_id: String = ""
var network_manager: Node

# Prediction and interpolation
var movement_buffer: Array[Dictionary] = []
var max_buffer_size: int = 60 # Store ~1 second of movement at 60fps

class PlayerSyncData:
	var id: String
	var position: Vector2
	var target_position: Vector2
	var velocity: Vector2
	var direction: String
	var health: int
	var max_health: int
	var skills: Dictionary
	var last_update_time: float
	var interpolation_start_pos: Vector2
	var interpolation_start_time: float
	var is_local: bool = false
	
	func _init(player_id: String, is_local_player: bool = false):
		id = player_id
		is_local = is_local_player
		position = Vector2.ZERO
		target_position = Vector2.ZERO
		velocity = Vector2.ZERO
		direction = "idle"
		health = 100
		max_health = 100
		skills = {}
		last_update_time = Time.get_time()

func _ready():
	setup_network_connections()
	start_sync_loop()

func setup_network_connections():
	"""Connect to network manager for multiplayer events"""
	network_manager = get_node_or_null("/root/NetworkManager")
	if network_manager:
		# Connect to network events
		if network_manager.has_signal("player_joined"):
			network_manager.player_joined.connect(_on_player_joined)
		if network_manager.has_signal("player_left"):
			network_manager.player_left.connect(_on_player_left)
		if network_manager.has_signal("player_moved"):
			network_manager.player_moved.connect(_on_player_moved)
		if network_manager.has_signal("player_state_updated"):
			network_manager.player_state_updated.connect(_on_player_state_updated)
		if network_manager.has_signal("local_player_id_set"):
			network_manager.local_player_id_set.connect(_on_local_player_id_set)

func start_sync_loop():
	"""Start the main synchronization update loop"""
	# Update at 60fps for smooth interpolation
	var timer = Timer.new()
	timer.wait_time = 1.0 / 60.0
	timer.timeout.connect(_on_sync_update)
	timer.autostart = true
	add_child(timer)

func _on_local_player_id_set(player_id: String):
	"""Set the local player ID"""
	local_player_id = player_id
	if player_id in players:
		players[player_id].is_local = true

func _on_player_joined(player_data: Dictionary):
	"""Handle new player joining"""
	var player_id = player_data.get("id", "")
	if player_id.is_empty():
		return
	
	var sync_data = PlayerSyncData.new(player_id, player_id == local_player_id)
	sync_data.position = Vector2(player_data.get("x", 0), player_data.get("y", 0))
	sync_data.target_position = sync_data.position
	sync_data.health = player_data.get("health", 100)
	sync_data.max_health = player_data.get("maxHealth", 100)
	sync_data.skills = player_data.get("skills", {})
	
	players[player_id] = sync_data
	player_joined.emit(player_id, player_data)

func _on_player_left(player_id: String):
	"""Handle player leaving"""
	if player_id in players:
		players.erase(player_id)
		player_left.emit(player_id)

func _on_player_moved(data: Dictionary):
	"""Handle player movement update"""
	var player_id = data.get("playerId", "")
	var new_position = Vector2(data.get("x", 0), data.get("y", 0))
	var direction = data.get("direction", "idle")
	var timestamp = data.get("timestamp", Time.get_time())
	
	if player_id.is_empty() or player_id not in players:
		return
	
	var player = players[player_id]
	
	# For non-local players, set up interpolation
	if not player.is_local and interpolation_enabled:
		player.interpolation_start_pos = player.position
		player.interpolation_start_time = Time.get_time()
		player.target_position = new_position
	else:
		player.position = new_position
		player.target_position = new_position
	
	player.direction = direction
	player.last_update_time = timestamp
	
	# Store in movement buffer for lag compensation
	if lag_compensation_enabled:
		store_movement_in_buffer(player_id, new_position, direction, timestamp)
	
	player_moved.emit(player_id, new_position, direction)

func _on_player_state_updated(data: Dictionary):
	"""Handle player state update (health, skills, etc.)"""
	var player_id = data.get("playerId", "")
	if player_id.is_empty() or player_id not in players:
		return
	
	var player = players[player_id]
	
	# Update health
	if "health" in data:
		player.health = data.health
	if "maxHealth" in data:
		player.max_health = data.maxHealth
	
	# Update skills
	if "skills" in data:
		player.skills = data.skills
	
	player_state_updated.emit(player_id, data)

func _on_sync_update():
	"""Main synchronization update loop"""
	var current_time = Time.get_time()
	
	for player_id in players:
		var player = players[player_id]
		
		# Skip local player position interpolation (handled by input)
		if player.is_local:
			continue
		
		# Interpolate position for smooth movement
		if interpolation_enabled:
			interpolate_player_position(player, current_time)
		
		# Predict movement for responsiveness
		if prediction_enabled:
			predict_player_movement(player, current_time)

func interpolate_player_position(player: PlayerSyncData, current_time: float):
	"""Smooth interpolation between positions"""
	if player.interpolation_start_time <= 0:
		return
	
	var interpolation_duration = 1.0 / 60.0 # Assume 60fps updates
	var time_elapsed = current_time - player.interpolation_start_time
	var progress = clamp(time_elapsed / interpolation_duration, 0.0, 1.0)
	
	# Use easing for smoother movement
	var eased_progress = ease_out_cubic(progress)
	
	player.position = player.interpolation_start_pos.lerp(player.target_position, eased_progress)

func predict_player_movement(player: PlayerSyncData, current_time: float):
	"""Predict player movement based on velocity"""
	var time_since_update = current_time - player.last_update_time
	
	# Only predict for a short time to avoid drift
	if time_since_update > max_prediction_time:
		return
	
	# Simple prediction based on direction and assumed speed
	var predicted_velocity = get_velocity_from_direction(player.direction)
	var prediction_offset = predicted_velocity * time_since_update
	
	player.position = player.target_position + prediction_offset

func get_velocity_from_direction(direction: String) -> Vector2:
	"""Convert direction string to velocity vector"""
	var speed = 100.0 # Base movement speed
	
	match direction:
		"up":
			return Vector2(0, -speed)
		"down":
			return Vector2(0, speed)
		"left":
			return Vector2(-speed, 0)
		"right":
			return Vector2(speed, 0)
		"up-left":
			return Vector2(-speed, -speed).normalized() * speed
		"up-right":
			return Vector2(speed, -speed).normalized() * speed
		"down-left":
			return Vector2(-speed, speed).normalized() * speed
		"down-right":
			return Vector2(speed, speed).normalized() * speed
		_:
			return Vector2.ZERO

func ease_out_cubic(t: float) -> float:
	"""Cubic easing out function for smooth interpolation"""
	return 1.0 - pow(1.0 - t, 3.0)

func store_movement_in_buffer(player_id: String, position: Vector2, direction: String, timestamp: float):
	"""Store movement data for lag compensation"""
	var movement_data = {
		"player_id": player_id,
		"position": position,
		"direction": direction,
		"timestamp": timestamp
	}
	
	movement_buffer.append(movement_data)
	
	# Keep buffer size manageable
	while movement_buffer.size() > max_buffer_size:
		movement_buffer.pop_front()

func send_local_movement(position: Vector2, direction: String):
	"""Send local player movement to server"""
	if network_manager and network_manager.has_method("send_movement"):
		var movement_data = {
			"x": position.x,
			"y": position.y,
			"direction": direction,
			"timestamp": Time.get_time()
		}
		network_manager.send_movement(movement_data)

func send_local_action(action_type: String, target_id: String = "", data: Dictionary = {}):
	"""Send local player action to server"""
	if network_manager and network_manager.has_method("send_action"):
		var action_data = {
			"type": action_type,
			"targetId": target_id,
			"timestamp": Time.get_time()
		}
		action_data.merge(data)
		network_manager.send_action(action_data)

func get_player_position(player_id: String) -> Vector2:
	"""Get current position of a player"""
	if player_id in players:
		return players[player_id].position
	return Vector2.ZERO

func get_player_health(player_id: String) -> Dictionary:
	"""Get current health of a player"""
	if player_id in players:
		var player = players[player_id]
		return {"current": player.health, "max": player.max_health}
	return {"current": 0, "max": 0}

func get_player_skills(player_id: String) -> Dictionary:
	"""Get current skills of a player"""
	if player_id in players:
		return players[player_id].skills
	return {}

func get_all_players() -> Dictionary:
	"""Get all player data"""
	return players

func is_local_player(player_id: String) -> bool:
	"""Check if player is the local player"""
	return player_id == local_player_id

func get_local_player_id() -> String:
	"""Get local player ID"""
	return local_player_id

func reconcile_movement(server_position: Vector2, server_timestamp: float):
	"""Reconcile local prediction with server state"""
	if not prediction_enabled or local_player_id.is_empty():
		return
	
	var local_player = players.get(local_player_id)
	if not local_player:
		return
	
	# Find corresponding local movement in buffer
	for i in range(movement_buffer.size() - 1, -1, -1):
		var movement = movement_buffer[i]
		if movement.timestamp <= server_timestamp:
			# Check if prediction was significantly off
			var prediction_error = local_player.position.distance_to(server_position)
			if prediction_error > 50.0: # 50 pixel threshold
				# Correct position and replay inputs
				local_player.position = server_position
				replay_inputs_from_timestamp(server_timestamp)
			break

func replay_inputs_from_timestamp(timestamp: float):
	"""Replay local inputs after server correction"""
	# This would replay all inputs after the given timestamp
	# For now, just snap to server position
	pass

func _exit_tree():
	"""Cleanup when exiting"""
	players.clear()
	movement_buffer.clear()
