extends Node3D
class_name GameScene3D

## Enhanced 3D Game Scene for RuneRogue
## Handles 3D rendering, multiplayer sync, and game logic

# Scene references
@onready var environment_manager: EnvironmentManager3D = $EnvironmentManager
@onready var camera_controller: CameraController3D = $CameraController
@onready var player_manager: PlayerManager3D = $PlayerManager
@onready var enemy_manager: EnemyManager3D = $EnemyManager
@onready var ui_overlay: UIOverlay3D = $UIOverlay
@onready var multiplayer_sync: MultiplayerSync3D = $MultiplayerSync

# Game state
var local_player_id: String = ""
var game_started: bool = false
var current_wave: int = 0

# Signals
signal player_spawned(player_id: String)
signal enemy_spawned(enemy_id: String, enemy_type: String)
signal wave_started(wave_number: int)
signal game_over()

func _ready() -> void:
	print("GameScene3D: Initializing 3D game scene")
	setup_3d_scene()
	connect_signals()
	initialize_managers()

func setup_3d_scene() -> void:
	"""Setup basic 3D scene environment"""
	# Ensure proper 3D rendering setup
	get_viewport().render_priority = 0
	
	# Setup lighting if not already present
	if not has_node("DirectionalLight3D"):
		var light = DirectionalLight3D.new()
		light.name = "DirectionalLight3D"
		light.position = Vector3(0, 10, 10)
		light.rotation_degrees = Vector3(-45, 0, 0)
		light.light_energy = 1.0
		light.shadow_enabled = true
		add_child(light)
	
	print("GameScene3D: 3D scene setup complete")

func connect_signals() -> void:
	"""Connect all manager signals"""
	if multiplayer_sync:
		multiplayer_sync.player_joined.connect(_on_player_joined)
		multiplayer_sync.player_left.connect(_on_player_left)
		multiplayer_sync.player_moved.connect(_on_player_moved_3d)
		multiplayer_sync.player_state_updated.connect(_on_player_state_updated)
	
	if enemy_manager:
		enemy_manager.enemy_spawned.connect(_on_enemy_spawned)
		enemy_manager.enemy_destroyed.connect(_on_enemy_destroyed)
	
	if player_manager:
		player_manager.local_player_ready.connect(_on_local_player_ready)
		player_manager.player_health_changed.connect(_on_player_health_changed)

func initialize_managers() -> void:
	"""Initialize all 3D managers"""
	if environment_manager:
		environment_manager.setup_dungeon_environment()
	
	if camera_controller:
		camera_controller.initialize_camera()
	
	if ui_overlay:
		ui_overlay.initialize_ui()
	
	if multiplayer_sync:
		multiplayer_sync.initialize_3d_sync()

# ============================================
# Multiplayer Event Handlers
# ============================================

func _on_player_joined(player_id: String, player_data: Dictionary) -> void:
	"""Handle new player joining the game"""
	print("GameScene3D: Player joined: ", player_id)
	
	if player_manager:
		player_manager.spawn_player_3d(player_id, player_data)
	
	if ui_overlay:
		ui_overlay.add_player_to_list(player_id, player_data.get("name", "Unknown"))
	
	player_spawned.emit(player_id)

func _on_player_left(player_id: String) -> void:
	"""Handle player leaving the game"""
	print("GameScene3D: Player left: ", player_id)
	
	if player_manager:
		player_manager.remove_player_3d(player_id)
	
	if ui_overlay:
		ui_overlay.remove_player_from_list(player_id)

func _on_player_moved_3d(player_id: String, position: Vector3, rotation: float) -> void:
	"""Handle 3D player movement updates"""
	if player_manager:
		player_manager.update_player_transform_3d(player_id, position, rotation)

func _on_player_state_updated(player_id: String, state: Dictionary) -> void:
	"""Handle player state changes (health, skills, etc.)"""
	if player_manager:
		player_manager.update_player_state_3d(player_id, state)
	
	if ui_overlay and player_id == local_player_id:
		ui_overlay.update_local_player_ui(state)

# ============================================
# Enemy Event Handlers
# ============================================

func _on_enemy_spawned(enemy_id: String, enemy_data: Dictionary) -> void:
	"""Handle enemy spawn from server"""
	print("GameScene3D: Enemy spawned: ", enemy_id)
	
	if enemy_manager:
		enemy_manager.spawn_enemy_3d(enemy_id, enemy_data)
	
	enemy_spawned.emit(enemy_id, enemy_data.get("type", "unknown"))

func _on_enemy_destroyed(enemy_id: String) -> void:
	"""Handle enemy destruction"""
	print("GameScene3D: Enemy destroyed: ", enemy_id)
	
	if enemy_manager:
		enemy_manager.remove_enemy_3d(enemy_id)

# ============================================
# Player Event Handlers
# ============================================

func _on_local_player_ready(player_id: String) -> void:
	"""Handle local player being ready"""
	local_player_id = player_id
	print("GameScene3D: Local player ready: ", player_id)
	
	# Setup camera to follow local player
	if camera_controller and player_manager:
		var player_node = player_manager.get_player_node_3d(player_id)
		if player_node:
			camera_controller.set_follow_target(player_node)

func _on_player_health_changed(player_id: String, current_health: int, max_health: int) -> void:
	"""Handle player health changes"""
	if ui_overlay and player_id == local_player_id:
		ui_overlay.update_health_bar(current_health, max_health)

# ============================================
# Game Flow Methods
# ============================================

func start_game(player_data: Dictionary) -> void:
	"""Start the game with initial player data"""
	print("GameScene3D: Starting game with player data: ", player_data)
	game_started = true
	
	# Initialize local player
	local_player_id = player_data.get("id", "")
	
	if multiplayer_sync:
		multiplayer_sync.set_local_player_id(local_player_id)
		multiplayer_sync.connect_to_server()

func start_wave(wave_number: int) -> void:
	"""Start a new wave"""
	current_wave = wave_number
	print("GameScene3D: Starting wave ", wave_number)
	
	if ui_overlay:
		ui_overlay.show_wave_start(wave_number)
	
	wave_started.emit(wave_number)

func end_game() -> void:
	"""Handle game over"""
	print("GameScene3D: Game over")
	game_started = false
	
	if ui_overlay:
		ui_overlay.show_game_over()
	
	game_over.emit()

# ============================================
# Input Handling
# ============================================

func _input(event: InputEvent) -> void:
	"""Handle 3D game input"""
	if not game_started:
		return
	
	# Handle movement input
	if event.is_action_pressed("move_forward") or event.is_action_pressed("move_backward") or \
	   event.is_action_pressed("move_left") or event.is_action_pressed("move_right"):
		handle_movement_input()
	
	# Handle camera input
	if camera_controller:
		camera_controller.handle_input(event)
	
	# Handle UI toggle
	if event.is_action_pressed("ui_cancel"):
		if ui_overlay:
			ui_overlay.toggle_menu()

func handle_movement_input() -> void:
	"""Process movement input and send to server"""
	if not multiplayer_sync or local_player_id.is_empty():
		return
	
	var movement_input = Vector3.ZERO
	
	if Input.is_action_pressed("move_forward"):
		movement_input.z -= 1
	if Input.is_action_pressed("move_backward"):
		movement_input.z += 1
	if Input.is_action_pressed("move_left"):
		movement_input.x -= 1
	if Input.is_action_pressed("move_right"):
		movement_input.x += 1
	
	if movement_input != Vector3.ZERO:
		movement_input = movement_input.normalized()
		multiplayer_sync.send_movement_3d(movement_input)

# ============================================
# Debug and Utility Methods
# ============================================

func get_player_count() -> int:
	"""Get current player count"""
	if player_manager:
		return player_manager.get_player_count()
	return 0

func get_enemy_count() -> int:
	"""Get current enemy count"""
	if enemy_manager:
		return enemy_manager.get_enemy_count()
	return 0

func _on_tree_exiting() -> void:
	"""Cleanup when scene is exiting"""
	print("GameScene3D: Scene exiting, cleaning up")
	
	if multiplayer_sync:
		multiplayer_sync.disconnect_from_server()
