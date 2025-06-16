extends Node2D

# Scene references
@export var main_menu_scene: PackedScene = preload("res://scenes/main_menu.tscn")
@export var game_scene: PackedScene = preload("res://scenes/game_scene.tscn")

# Current scene management
var current_scene: Node = null
@onready var scene_container: Node2D = $SceneContainer
@onready var camera: Camera2D = $Camera2D
@onready var hud: Control = $CanvasLayer/HUD

# Rendering settings
var render_scale: float = 1.0
var target_fps: int = 60

func _ready() -> void:
	# Configure rendering settings
	Engine.max_fps = target_fps
	
	# Set up the initial viewport
	_configure_viewport()
	
	# Connect to window resize events
	get_viewport().size_changed.connect(_on_viewport_size_changed)
	
	# Initialize with main menu
	if scene_container.get_child_count() > 0:
		current_scene = scene_container.get_child(0)
		_connect_scene_signals(current_scene)

func _configure_viewport() -> void:
	# Configure viewport for pixel-perfect rendering
	var viewport = get_viewport()
	viewport.snap_2d_transforms_to_pixel = true
	viewport.snap_2d_vertices_to_pixel = true
	
	# Set up camera for proper scaling
	_update_camera_zoom()

func _update_camera_zoom() -> void:
	var viewport_size = get_viewport().size
	var base_size = Vector2(1024, 768)
	
	# Calculate zoom to maintain aspect ratio
	var scale_x = viewport_size.x / base_size.x
	var scale_y = viewport_size.y / base_size.y
	var scale = min(scale_x, scale_y)
	
	camera.zoom = Vector2(scale, scale)
	camera.position = base_size / 2

func _on_viewport_size_changed() -> void:
	_update_camera_zoom()

func change_scene(scene_path: String) -> void:
	# Load the new scene
	var new_scene_resource = load(scene_path)
	if new_scene_resource == null:
		push_error("Failed to load scene: " + scene_path)
		return
	
	# Fade out current scene (can add transition effects here)
	if current_scene:
		current_scene.queue_free()
	
	# Instance and add new scene
	var new_scene = new_scene_resource.instantiate()
	scene_container.add_child(new_scene)
	current_scene = new_scene
	
	# Connect signals from the new scene
	_connect_scene_signals(new_scene)

func _connect_scene_signals(scene: Node) -> void:
	# Connect common signals from scenes
	if scene.has_signal("start_game"):
		scene.start_game.connect(_on_start_game)
	if scene.has_signal("return_to_menu"):
		scene.return_to_menu.connect(_on_return_to_menu)
	if scene.has_signal("quit_game"):
		scene.quit_game.connect(_on_quit_game)

func _on_start_game() -> void:
	change_scene("res://scenes/game_scene.tscn")
	# Show HUD when game starts
	hud.visible = true

func _on_return_to_menu() -> void:
	change_scene("res://scenes/main_menu.tscn")
	# Hide HUD in menu
	hud.visible = false

func _on_quit_game() -> void:
	get_tree().quit()

# Handle input for global actions
func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		# Handle escape key - pause or return to menu
		if current_scene and current_scene.has_method("handle_pause"):
			current_scene.handle_pause()
		elif current_scene.name != "MainMenu":
			_on_return_to_menu()

# Rendering debug info (F3 to toggle)
var show_debug: bool = false

func _process(_delta: float) -> void:
	if Input.is_action_just_pressed("ui_page_down"):  # F3 key
		show_debug = !show_debug
		queue_redraw()

func _draw() -> void:
	if show_debug:
		var fps = Engine.get_frames_per_second()
		var viewport_size = get_viewport().size
		var debug_text = "FPS: %d\nViewport: %dx%d\nZoom: %.2f" % [fps, viewport_size.x, viewport_size.y, camera.zoom.x]
		draw_string(ThemeDB.fallback_font, Vector2(10, 20), debug_text, HORIZONTAL_ALIGNMENT_LEFT, -1, 16)