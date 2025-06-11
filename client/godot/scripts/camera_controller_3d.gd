extends Node3D
class_name CameraController3D

## 3D Camera Controller for RuneRogue
## Provides smooth camera following, rotation, and zoom controls optimized for OSRS-style gameplay

# Camera settings
@export var follow_target: Node3D
@export var camera_distance: float = 12.0
@export var camera_height: float = 8.0
@export var camera_angle: float = -30.0
@export var rotation_speed: float = 2.0
@export var zoom_speed: float = 0.2
@export var smooth_speed: float = 5.0
@export var mouse_sensitivity: float = 0.003

# Camera constraints
@export var min_distance: float = 5.0
@export var max_distance: float = 25.0
@export var min_angle: float = -60.0
@export var max_angle: float = -10.0

# Camera nodes
var camera: Camera3D
var camera_pivot: Node3D
var camera_arm: Node3D

# Input tracking
var mouse_captured: bool = false
var last_mouse_position: Vector2
var camera_rotation_input: Vector2

# Target tracking
var target_position: Vector3
var current_velocity: Vector3

# Camera modes
enum CameraMode {
	FOLLOW_PLAYER,
	FREE_LOOK,
	FIXED_POSITION
}

var current_mode: CameraMode = CameraMode.FOLLOW_PLAYER

# Signals
signal camera_mode_changed(new_mode: CameraMode)
signal zoom_changed(new_distance: float)

func _ready() -> void:
	print("CameraController3D: Initializing 3D camera controller")
	setup_camera_hierarchy()
	initialize_camera()

func setup_camera_hierarchy() -> void:
	"""Setup the 3D camera rig hierarchy"""
	# Create camera pivot (for Y rotation)
	camera_pivot = Node3D.new()
	camera_pivot.name = "CameraPivot"
	add_child(camera_pivot)
	
	# Create camera arm (for X rotation and distance)
	camera_arm = Node3D.new()
	camera_arm.name = "CameraArm"
	camera_pivot.add_child(camera_arm)
	
	# Create and setup camera
	camera = Camera3D.new()
	camera.name = "Camera3D"
	camera_arm.add_child(camera)
	
	print("CameraController3D: Camera hierarchy created")

func initialize_camera() -> void:
	"""Initialize camera settings and position"""
	if not camera:
		print("CameraController3D: Error - Camera not found!")
		return
	
	# Set camera properties
	camera.fov = 75.0
	camera.near = 0.1
	camera.far = 100.0
	
	# Position camera arm and camera
	update_camera_transform()
	
	# Make this camera current
	camera.current = true
	
	print("CameraController3D: Camera initialized")

func update_camera_transform() -> void:
	"""Update camera transform based on current settings"""
	if not camera_arm or not camera:
		return
	
	# Set arm rotation (pitch)
	camera_arm.rotation_degrees.x = camera_angle
	
	# Position camera at distance
	camera.position = Vector3(0, 0, camera_distance)

func _process(delta: float) -> void:
	"""Update camera each frame"""
	match current_mode:
		CameraMode.FOLLOW_PLAYER:
			_update_follow_camera(delta)
		CameraMode.FREE_LOOK:
			_update_free_camera(delta)
		CameraMode.FIXED_POSITION:
			_update_fixed_camera(delta)

func _update_follow_camera(delta: float) -> void:
	"""Update camera in follow player mode"""
	if not follow_target:
		return
	
	# Smooth follow target
	target_position = follow_target.global_position
	var distance_to_target = global_position.distance_to(target_position)
	
	# Use spring-damper system for smooth following
	var spring_force = (target_position - global_position) * smooth_speed
	var damping_force = current_velocity * -2.0  # Damping factor
	
	current_velocity += (spring_force + damping_force) * delta
	global_position += current_velocity * delta
	
	# Apply camera rotation input
	if camera_rotation_input.length() > 0:
		camera_pivot.rotation_degrees.y += camera_rotation_input.x * rotation_speed
		camera_angle = clamp(camera_angle + camera_rotation_input.y * rotation_speed, min_angle, max_angle)
		update_camera_transform()
		camera_rotation_input = Vector2.ZERO

func _update_free_camera(delta: float) -> void:
	"""Update camera in free look mode"""
	# Handle free camera movement
	var movement = Vector3.ZERO
	var speed = 10.0
	
	if Input.is_action_pressed("move_forward"):
		movement -= camera.global_transform.basis.z
	if Input.is_action_pressed("move_backward"):
		movement += camera.global_transform.basis.z
	if Input.is_action_pressed("move_left"):
		movement -= camera.global_transform.basis.x
	if Input.is_action_pressed("move_right"):
		movement += camera.global_transform.basis.x
	
	global_position += movement.normalized() * speed * delta

func _update_fixed_camera(_delta: float) -> void:
	"""Update camera in fixed position mode"""
	# Camera stays in fixed position, only rotation allowed
	pass

# ============================================
# Input Handling
# ============================================

func handle_input(event: InputEvent) -> void:
	"""Handle camera input events"""
	if event is InputEventMouseButton:
		_handle_mouse_button(event)
	elif event is InputEventMouseMotion:
		_handle_mouse_motion(event)
	elif event.is_action_pressed("camera_zoom_in"):
		zoom_in()
	elif event.is_action_pressed("camera_zoom_out"):
		zoom_out()

func _handle_mouse_button(event: InputEventMouseButton) -> void:
	"""Handle mouse button events for camera control"""
	if event.button_index == MOUSE_BUTTON_RIGHT:
		if event.pressed:
			start_camera_rotation()
		else:
			stop_camera_rotation()
	elif event.button_index == MOUSE_BUTTON_MIDDLE:
		if event.pressed:
			toggle_camera_mode()

func _handle_mouse_motion(event: InputEventMouseMotion) -> void:
	"""Handle mouse motion for camera rotation"""
	if mouse_captured:
		camera_rotation_input += event.relative * mouse_sensitivity * rotation_speed

func start_camera_rotation() -> void:
	"""Start camera rotation mode"""
	mouse_captured = true
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	print("CameraController3D: Camera rotation started")

func stop_camera_rotation() -> void:
	"""Stop camera rotation mode"""
	mouse_captured = false
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	camera_rotation_input = Vector2.ZERO
	print("CameraController3D: Camera rotation stopped")

# ============================================
# Camera Controls
# ============================================

func set_follow_target(target: Node3D) -> void:
	"""Set the target for the camera to follow"""
	follow_target = target
	current_mode = CameraMode.FOLLOW_PLAYER
	
	if target:
		global_position = target.global_position
		print("CameraController3D: Follow target set to: ", target.name)

func zoom_in() -> void:
	"""Zoom camera in"""
	camera_distance = clamp(camera_distance - zoom_speed * camera_distance, min_distance, max_distance)
	update_camera_transform()
	zoom_changed.emit(camera_distance)

func zoom_out() -> void:
	"""Zoom camera out"""
	camera_distance = clamp(camera_distance + zoom_speed * camera_distance, min_distance, max_distance)
	update_camera_transform()
	zoom_changed.emit(camera_distance)

func set_zoom_distance(distance: float) -> void:
	"""Set camera zoom distance directly"""
	camera_distance = clamp(distance, min_distance, max_distance)
	update_camera_transform()
	zoom_changed.emit(camera_distance)

func toggle_camera_mode() -> void:
	"""Toggle between camera modes"""
	match current_mode:
		CameraMode.FOLLOW_PLAYER:
			current_mode = CameraMode.FREE_LOOK
		CameraMode.FREE_LOOK:
			current_mode = CameraMode.FOLLOW_PLAYER
		CameraMode.FIXED_POSITION:
			current_mode = CameraMode.FOLLOW_PLAYER
	
	camera_mode_changed.emit(current_mode)
	print("CameraController3D: Camera mode changed to: ", CameraMode.keys()[current_mode])

func set_camera_mode(mode: CameraMode) -> void:
	"""Set camera mode directly"""
	current_mode = mode
	camera_mode_changed.emit(current_mode)
	print("CameraController3D: Camera mode set to: ", CameraMode.keys()[current_mode])

# ============================================
# Camera Positioning
# ============================================

func look_at_position(position: Vector3, smooth: bool = true) -> void:
	"""Make camera look at a specific position"""
	if smooth:
		# Smooth transition to look at position
		var target_transform = global_transform.looking_at(position, Vector3.UP)
		# TODO: Implement smooth rotation transition
	else:
		look_at(position, Vector3.UP)

func set_camera_angle(angle: float, smooth: bool = true) -> void:
	"""Set camera pitch angle"""
	var target_angle = clamp(angle, min_angle, max_angle)
	
	if smooth:
		# Smooth angle transition
		create_tween().tween_method(
			func(value): camera_angle = value; update_camera_transform(),
			camera_angle,
			target_angle,
			0.5
		)
	else:
		camera_angle = target_angle
		update_camera_transform()

func reset_camera() -> void:
	"""Reset camera to default position and settings"""
	camera_distance = 12.0
	camera_angle = -30.0
	camera_pivot.rotation_degrees.y = 0.0
	current_velocity = Vector3.ZERO
	update_camera_transform()
	print("CameraController3D: Camera reset to defaults")

# ============================================
# Camera Shake and Effects
# ============================================

func shake_camera(intensity: float, duration: float) -> void:
	"""Shake the camera for impact effects"""
	var original_position = camera.position
	var shake_tween = create_tween()
	
	var shake_count = int(duration * 30)  # 30 shakes per second
	for i in shake_count:
		var shake_offset = Vector3(
			randf_range(-intensity, intensity),
			randf_range(-intensity, intensity),
			randf_range(-intensity, intensity)
		)
		shake_tween.tween_to(camera, "position", original_position + shake_offset, duration / shake_count)
	
	shake_tween.tween_to(camera, "position", original_position, 0.1)

func smooth_transition_to_position(target_pos: Vector3, duration: float = 1.0) -> void:
	"""Smoothly transition camera to a specific position"""
	create_tween().tween_property(self, "global_position", target_pos, duration)

# ============================================
# Utility Methods
# ============================================

func get_camera() -> Camera3D:
	"""Get the camera node"""
	return camera

func get_camera_forward() -> Vector3:
	"""Get camera forward direction"""
	if camera:
		return -camera.global_transform.basis.z
	return Vector3.FORWARD

func get_camera_right() -> Vector3:
	"""Get camera right direction"""
	if camera:
		return camera.global_transform.basis.x
	return Vector3.RIGHT

func screen_to_world(screen_pos: Vector2) -> Vector3:
	"""Convert screen position to world position"""
	if camera:
		var from = camera.project_ray_origin(screen_pos)
		var to = from + camera.project_ray_normal(screen_pos) * 1000
		
		# Raycast to find world position
		var space_state = get_world_3d().direct_space_state
		var query = PhysicsRayQueryParameters3D.create(from, to)
		var result = space_state.intersect_ray(query)
		
		if result:
			return result.position
		else:
			# Return position on Y=0 plane
			var plane = Plane(Vector3.UP, 0)
			return plane.intersects_ray(from, camera.project_ray_normal(screen_pos))
	
	return Vector3.ZERO

func world_to_screen(world_pos: Vector3) -> Vector2:
	"""Convert world position to screen position"""
	if camera:
		return camera.unproject_position(world_pos)
	return Vector2.ZERO

func is_position_visible(world_pos: Vector3) -> bool:
	"""Check if a world position is visible on screen"""
	if not camera:
		return false
	
	var screen_pos = camera.unproject_position(world_pos)
	var viewport_size = get_viewport().size
	
	return screen_pos.x >= 0 and screen_pos.x <= viewport_size.x and \
		   screen_pos.y >= 0 and screen_pos.y <= viewport_size.y

func _on_tree_exiting() -> void:
	"""Cleanup when node is removed"""
	if mouse_captured:
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
