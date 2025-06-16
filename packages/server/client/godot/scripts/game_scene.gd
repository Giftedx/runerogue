extends Node2D

signal return_to_menu

@onready var game_renderer: Node2D = $GameRenderer
@onready var player: CharacterBody2D = $GameRenderer/Entities/Player
@onready var health_bar: ProgressBar = $UI/GameHUD/HealthBar

# Game state
var player_health: int = 100
var max_health: int = 100
var paused: bool = false

func _ready() -> void:
	# Initialize game state
	_setup_game()
	
	# Connect renderer signals
	if game_renderer.has_signal("tile_clicked"):
		game_renderer.tile_clicked.connect(_on_tile_clicked)

func _setup_game() -> void:
	# Set initial player health
	player_health = max_health
	_update_health_display()
	
	# Generate initial world
	game_renderer.generate_world()
	
	# Position player at spawn
	player.position = game_renderer.get_spawn_position()

func _physics_process(delta: float) -> void:
	if paused:
		return
		
	# Handle player movement
	_handle_player_movement()
	
	# Update renderer
	game_renderer.update_visibility(player.position)

func _handle_player_movement() -> void:
	var input_vector = Vector2.ZERO
	
	# Get input
	input_vector.x = Input.get_axis("ui_left", "ui_right")
	input_vector.y = Input.get_axis("ui_up", "ui_down")
	
	# Normalize for diagonal movement
	if input_vector.length() > 0:
		input_vector = input_vector.normalized()
	
	# Apply movement
	player.velocity = input_vector * 200.0  # Movement speed
	player.move_and_slide()
	
	# Update player light position
	var player_light = $GameRenderer/Effects/Lighting/PlayerLight
	if player_light:
		player_light.position = player.position

func _on_tile_clicked(tile_pos: Vector2i) -> void:
	# Handle tile interactions
	print("Clicked tile at: ", tile_pos)
	
	# Example: Move player to clicked position
	var world_pos = game_renderer.tile_to_world(tile_pos)
	# Could implement pathfinding here
	
func handle_pause() -> void:
	paused = !paused
	
	# Show pause menu overlay
	if paused:
		# TODO: Show pause menu
		print("Game paused")
	else:
		print("Game resumed")

func _update_health_display() -> void:
	health_bar.value = (float(player_health) / float(max_health)) * 100.0

func take_damage(amount: int) -> void:
	player_health = max(0, player_health - amount)
	_update_health_display()
	
	# Add damage effect
	_show_damage_effect()
	
	if player_health <= 0:
		_game_over()

func _show_damage_effect() -> void:
	# Flash the player sprite red
	var sprite = player.get_node("Sprite")
	if sprite:
		var tween = create_tween()
		tween.tween_property(sprite, "modulate", Color.RED, 0.1)
		tween.tween_property(sprite, "modulate", Color.WHITE, 0.1)

func _game_over() -> void:
	print("Game Over!")
	# TODO: Show game over screen
	await get_tree().create_timer(2.0).timeout
	return_to_menu.emit()

func _input(event: InputEvent) -> void:
	# Handle game-specific inputs
	if event.is_action_pressed("ui_cancel"):
		handle_pause()
	
	# Debug commands
	if OS.is_debug_build():
		if event.is_action_pressed("ui_page_up"):
			# Regenerate world
			game_renderer.generate_world()
		elif event.is_action_pressed("ui_page_down"):
			# Toggle lighting
			$GameRenderer/Effects/Lighting.visible = !$GameRenderer/Effects/Lighting.visible