extends Node3D
class_name PlayerManager3D

## 3D Player Manager for RuneRogue
## Manages multiple 3D players in the game world

# Player prefab and tracking
@export var player_prefab: PackedScene
var players: Dictionary = {}  # player_id -> PlayerController3D
var local_player_id: String = ""

# Spawn settings
@export var spawn_positions: Array[Vector3] = [
	Vector3(0, 0, 0),
	Vector3(5, 0, 0),
	Vector3(0, 0, 5),
	Vector3(-5, 0, 0)
]
@export var spawn_rotation: float = 0.0

# Signals
signal local_player_ready(player_id: String)
signal player_health_changed(player_id: String, current: int, max: int)
signal player_equipment_changed(player_id: String, equipment: Dictionary)

func _ready() -> void:
	print("PlayerManager3D: Initializing 3D player manager")
	
	# Load default player prefab if not set
	if not player_prefab:
		create_default_player_prefab()

func create_default_player_prefab() -> void:
	"""Create a default player prefab if none is provided"""
	var scene = PackedScene.new()
	var player_controller = PlayerController3D.new()
	player_controller.name = "PlayerController3D"
	
	# Pack the scene
	scene.pack(player_controller)
	player_prefab = scene
	
	print("PlayerManager3D: Created default player prefab")

func spawn_player_3d(player_id: String, player_data: Dictionary) -> PlayerController3D:
	"""Spawn a new 3D player"""
	print("PlayerManager3D: Spawning player: ", player_id)
	
	# Remove existing player if any
	if players.has(player_id):
		remove_player_3d(player_id)
	
	# Create new player instance
	var player_instance: PlayerController3D
	
	if player_prefab:
		var player_node = player_prefab.instantiate()
		if player_node is PlayerController3D:
			player_instance = player_node
		else:
			# Fallback: create PlayerController3D directly
			player_instance = PlayerController3D.new()
	else:
		player_instance = PlayerController3D.new()
	
	# Set player name
	player_instance.name = "Player_" + player_id
	
	# Determine if this is the local player
	var is_local = (player_id == local_player_id)
	
	# Get spawn position
	var spawn_pos = get_spawn_position(players.size())
	if player_data.has("position"):
		var pos_data = player_data.position
		spawn_pos = Vector3(pos_data.get("x", spawn_pos.x), pos_data.get("z", spawn_pos.y), pos_data.get("y", spawn_pos.z))
	
	# Add to scene
	add_child(player_instance)
	
	# Initialize player
	player_instance.initialize_player(player_id, player_data, is_local)
	player_instance.global_position = spawn_pos
	
	# Connect signals
	player_instance.health_changed.connect(_on_player_health_changed)
	player_instance.equipment_changed.connect(_on_player_equipment_changed)
	
	# Store reference
	players[player_id] = player_instance
	
	# Emit signal if this is the local player
	if is_local:
		local_player_ready.emit(player_id)
	
	print("PlayerManager3D: Player spawned successfully: ", player_id)
	return player_instance

func remove_player_3d(player_id: String) -> void:
	"""Remove a 3D player"""
	print("PlayerManager3D: Removing player: ", player_id)
	
	if not players.has(player_id):
		print("PlayerManager3D: Player not found for removal: ", player_id)
		return
	
	var player_instance = players[player_id]
	
	# Clean up player
	player_instance.cleanup()
	
	# Remove from tracking
	players.erase(player_id)
	
	print("PlayerManager3D: Player removed successfully: ", player_id)

func update_player_transform_3d(player_id: String, position: Vector3, rotation: float) -> void:
	"""Update player 3D transform"""
	if not players.has(player_id):
		print("PlayerManager3D: Player not found for transform update: ", player_id)
		return
	
	var player_instance = players[player_id]
	player_instance.update_transform_3d(position, rotation)

func update_player_state_3d(player_id: String, state_data: Dictionary) -> void:
	"""Update player state"""
	if not players.has(player_id):
		print("PlayerManager3D: Player not found for state update: ", player_id)
		return
	
	var player_instance = players[player_id]
	player_instance.update_player_state(state_data)

func get_player_node_3d(player_id: String) -> PlayerController3D:
	"""Get player node by ID"""
	return players.get(player_id, null)

func get_local_player_node() -> PlayerController3D:
	"""Get the local player node"""
	if local_player_id.is_empty():
		return null
	return get_player_node_3d(local_player_id)

func set_local_player_id(player_id: String) -> void:
	"""Set the local player ID"""
	local_player_id = player_id
	print("PlayerManager3D: Local player ID set to: ", player_id)
	
	# Update existing player if already spawned
	if players.has(player_id):
		var player_instance = players[player_id]
		player_instance.is_local_player = true

func get_spawn_position(player_index: int) -> Vector3:
	"""Get spawn position for player by index"""
	if spawn_positions.size() > 0:
		var index = player_index % spawn_positions.size()
		return spawn_positions[index]
	else:
		# Default circular spawn pattern
		var angle = (player_index * PI * 2) / 4  # 4 players max in circle
		var radius = 3.0
		return Vector3(cos(angle) * radius, 0, sin(angle) * radius)

func get_player_count() -> int:
	"""Get current player count"""
	return players.size()

func get_all_players() -> Dictionary:
	"""Get all player instances"""
	return players

func get_players_in_radius(center: Vector3, radius: float) -> Array[PlayerController3D]:
	"""Get all players within a radius of a position"""
	var nearby_players: Array[PlayerController3D] = []
	
	for player in players.values():
		var distance = center.distance_to(player.global_position)
		if distance <= radius:
			nearby_players.append(player)
	
	return nearby_players

func get_closest_player_to_position(position: Vector3, exclude_player_id: String = "") -> PlayerController3D:
	"""Get the closest player to a position"""
	var closest_player: PlayerController3D = null
	var closest_distance: float = INF
	
	for player_id in players:
		if player_id == exclude_player_id:
			continue
		
		var player = players[player_id]
		var distance = position.distance_to(player.global_position)
		
		if distance < closest_distance:
			closest_distance = distance
			closest_player = player
	
	return closest_player

# ============================================
# Player Interaction
# ============================================

func get_player_at_position(position: Vector3, tolerance: float = 1.0) -> PlayerController3D:
	"""Get player at specific position within tolerance"""
	for player in players.values():
		var distance = position.distance_to(player.global_position)
		if distance <= tolerance:
			return player
	return null

func move_all_players_to_safe_positions() -> void:
	"""Move all players to safe spawn positions (for emergencies)"""
	print("PlayerManager3D: Moving all players to safe positions")
	
	var index = 0
	for player_id in players:
		var player = players[player_id]
		var safe_position = get_spawn_position(index)
		player.global_position = safe_position
		index += 1

func set_all_players_health_bar_visibility(visible: bool) -> void:
	"""Set health bar visibility for all players"""
	for player in players.values():
		player.set_health_bar_visible(visible)

# ============================================
# Combat Support
# ============================================

func apply_damage_to_player(player_id: String, damage: int) -> bool:
	"""Apply damage effect to player (visual only, server handles actual damage)"""
	if not players.has(player_id):
		return false
	
	var player = players[player_id]
	player.play_damage_effect(damage)
	return true

func apply_heal_to_player(player_id: String, heal_amount: int) -> bool:
	"""Apply heal effect to player (visual only)"""
	if not players.has(player_id):
		return false
	
	var player = players[player_id]
	player.play_heal_effect(heal_amount)
	return true

func set_player_animation(player_id: String, animation: String) -> bool:
	"""Set player animation state"""
	if not players.has(player_id):
		return false
	
	var player = players[player_id]
	player.set_animation_state(animation)
	return true

# ============================================
# Signal Handlers
# ============================================

func _on_player_health_changed(player_id: String, current: int, max: int) -> void:
	"""Handle player health change"""
	player_health_changed.emit(player_id, current, max)

func _on_player_equipment_changed(player_id: String, equipment: Dictionary) -> void:
	"""Handle player equipment change"""
	player_equipment_changed.emit(player_id, equipment)

# ============================================
# Debug and Utility
# ============================================

func print_player_status() -> void:
	"""Print status of all players (for debugging)"""
	print("PlayerManager3D: Player Status Report")
	print("Total players: ", players.size())
	print("Local player ID: ", local_player_id)
	
	for player_id in players:
		var player = players[player_id]
		print("Player ", player_id, ": ", 
			  "Pos=", player.global_position, 
			  " Health=", player.current_health, "/", player.max_health,
			  " Local=", player.is_local_player)

func cleanup_all_players() -> void:
	"""Clean up all players"""
	print("PlayerManager3D: Cleaning up all players")
	
	for player_id in players.keys():
		remove_player_3d(player_id)
	
	players.clear()
	local_player_id = ""

func validate_player_positions() -> void:
	"""Validate all player positions are reasonable"""
	for player_id in players:
		var player = players[player_id]
		var pos = player.global_position
		
		# Check if player fell through world
		if pos.y < -10:
			print("PlayerManager3D: Player ", player_id, " fell through world, respawning")
			var safe_pos = get_spawn_position(0)
			safe_pos.y = 1.0  # Ensure above ground
			player.global_position = safe_pos

func _on_tree_exiting() -> void:
	"""Cleanup when manager is removed"""
	cleanup_all_players()
