extends Node

@onready var scene_container = $CanvasLayer/SceneContainer
@onready var main_menu = $CanvasLayer/SceneContainer/MainMenu
@onready var hud = $CanvasLayer/HUD

var game_scene_2d_packed = preload("res://scenes/game_scene.tscn")
var game_scene_3d_packed = preload("res://scenes/game_scene_3d.tscn")
var current_scene = null
var use_3d_mode: bool = true  # Default to 3D mode

func _ready():
	print("RuneRogue client started")
	show_main_menu()

func show_main_menu():
	# Clear current scene
	if current_scene:
		current_scene.queue_free()
		current_scene = null
	
	# Show main menu
	main_menu.visible = true
	hud.visible = false
	
	# Connect main menu signals if not already connected
	if not main_menu.start_game.is_connected(_on_start_game):
		main_menu.start_game.connect(_on_start_game)

func start_game():
	# Hide main menu
	main_menu.visible = false
	
	# Instantiate and add game scene (3D or 2D based on mode)
	if use_3d_mode:
		print("Starting game in 3D mode")
		current_scene = game_scene_3d_packed.instantiate()
		scene_container.add_child(current_scene)
		
		# For 3D mode, the UI is handled by the 3D scene itself
		hud.visible = false
		
		# Start the 3D game with mock player data
		var player_data = {
			"id": "local_player_" + str(randi()),
			"name": "Player",
			"position": {"x": 0, "y": 0, "z": 0},
			"rotation": 0,
			"health": {"current": 100, "max": 100},
			"skills": {},
			"equipment": {}
		}
		current_scene.start_game(player_data)
	else:
		print("Starting game in 2D mode")
		current_scene = game_scene_2d_packed.instantiate()
		scene_container.add_child(current_scene)
		
		# Show 2D HUD
		hud.visible = true
		
		# Connect HUD signals if not already connected
		if not hud.menu_requested.is_connected(_on_menu_requested):
			hud.menu_requested.connect(_on_menu_requested)

func toggle_3d_mode():
	"""Toggle between 2D and 3D mode"""
	use_3d_mode = not use_3d_mode
	print("3D mode toggled: ", use_3d_mode)

func _on_start_game():
	start_game()

func _on_menu_requested():
	show_main_menu()