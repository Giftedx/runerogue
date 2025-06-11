extends Node3D
class_name PlayerController3D

## 3D Player Controller for RuneRogue
## Handles 3D player rendering, animation, and equipment display

# Player components
@onready var player_model: Node3D = $PlayerModel
@onready var equipment_manager: EquipmentRenderer3D = $EquipmentManager
@onready var animation_player: AnimationPlayer = $AnimationPlayer
@onready var health_bar_3d: Node3D = $HealthBar3D

# Player data
var player_id: String = ""
var player_data: Dictionary = {}
var is_local_player: bool = false

# Movement and animation
var current_position: Vector3
var target_position: Vector3
var current_rotation: float
var target_rotation: float
var movement_speed: float = 5.0
var animation_state: String = "idle"

# Health display
var current_health: int = 100
var max_health: int = 100
var health_bar_visible: bool = true

# Equipment visualization
var equipped_items: Dictionary = {}

# Signals
signal health_changed(player_id: String, current: int, max: int)
signal equipment_changed(player_id: String, equipment: Dictionary)
signal animation_changed(player_id: String, animation: String)

func _ready() -> void:
	print("PlayerController3D: Initializing 3D player controller")
	setup_player_model()
	setup_health_bar()

func setup_player_model() -> void:
	"""Setup the basic player model"""
	if not player_model:
		# Create basic player model if not exists
		player_model = Node3D.new()
		player_model.name = "PlayerModel"
		add_child(player_model)
		
		# Create a simple capsule for the player body
		var mesh_instance = MeshInstance3D.new()
		var capsule_mesh = CapsuleMesh.new()
		capsule_mesh.radius = 0.4
		capsule_mesh.height = 1.8
		mesh_instance.mesh = capsule_mesh
		
		# Create a basic material
		var material = StandardMaterial3D.new()
		material.albedo_color = Color(0.3, 0.6, 0.9)  # Blue player color
		mesh_instance.set_surface_override_material(0, material)
		
		player_model.add_child(mesh_instance)
		
		# Add collision shape
		var collision_shape = CollisionShape3D.new()
		var capsule_shape = CapsuleShape3D.new()
		capsule_shape.radius = 0.4
		capsule_shape.height = 1.8
		collision_shape.shape = capsule_shape
		
		var rigid_body = RigidBody3D.new()
		rigid_body.gravity_scale = 0  # We'll handle movement manually
		rigid_body.lock_rotation = true
		rigid_body.add_child(collision_shape)
		add_child(rigid_body)
	
	print("PlayerController3D: Player model setup complete")

func setup_health_bar() -> void:
	"""Setup the 3D health bar above player"""
	if not health_bar_3d:
		health_bar_3d = Node3D.new()
		health_bar_3d.name = "HealthBar3D"
		add_child(health_bar_3d)
		
		# Position health bar above player
		health_bar_3d.position = Vector3(0, 2.2, 0)
		
		# Create health bar background
		var bg_mesh = MeshInstance3D.new()
		var bg_quad = QuadMesh.new()
		bg_quad.size = Vector2(1.2, 0.15)
		bg_mesh.mesh = bg_quad
		
		var bg_material = StandardMaterial3D.new()
		bg_material.albedo_color = Color(0.2, 0.2, 0.2)
		bg_material.flags_unshaded = true
		bg_material.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
		bg_mesh.set_surface_override_material(0, bg_material)
		health_bar_3d.add_child(bg_mesh)
		
		# Create health bar fill
		var fill_mesh = MeshInstance3D.new()
		fill_mesh.name = "HealthFill"
		var fill_quad = QuadMesh.new()
		fill_quad.size = Vector2(1.0, 0.1)
		fill_mesh.mesh = fill_quad
		
		var fill_material = StandardMaterial3D.new()
		fill_material.albedo_color = Color(0.8, 0.2, 0.2)  # Red health
		fill_material.flags_unshaded = true
		fill_material.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
		fill_mesh.set_surface_override_material(0, fill_material)
		fill_mesh.position = Vector3(0, 0, 0.01)  # Slightly in front
		health_bar_3d.add_child(fill_mesh)
	
	update_health_bar_visibility()

func initialize_player(id: String, data: Dictionary, is_local: bool = false) -> void:
	"""Initialize player with data from server"""
	player_id = id
	player_data = data
	is_local_player = is_local
	
	print("PlayerController3D: Initializing player: ", player_id)
	
	# Set initial position
	if data.has("position"):
		var pos = data.position
		current_position = Vector3(pos.get("x", 0), pos.get("z", 0), pos.get("y", 0))
		target_position = current_position
		global_position = current_position
	
	# Set initial rotation
	if data.has("rotation"):
		current_rotation = data.rotation
		target_rotation = current_rotation
		rotation_degrees.y = current_rotation
	
	# Set health
	if data.has("health"):
		current_health = data.health.get("current", 100)
		max_health = data.health.get("max", 100)
		update_health_display()
	
	# Set equipment
	if data.has("equipment"):
		equipped_items = data.equipment
		update_equipment_display()
	
	# Update player name display
	if data.has("name"):
		create_name_display(data.name)
	
	# Set player color for non-local players
	if not is_local_player:
		set_player_color(Color(0.6, 0.3, 0.8))  # Purple for other players

func update_transform_3d(new_position: Vector3, new_rotation: float) -> void:
	"""Update player 3D transform with smooth interpolation"""
	target_position = new_position
	target_rotation = new_rotation
	
	# For local player, snap immediately to avoid prediction conflicts
	if is_local_player:
		current_position = target_position
		current_rotation = target_rotation
		global_position = current_position
		rotation_degrees.y = current_rotation
	
	# Update animation based on movement
	var is_moving = current_position.distance_to(target_position) > 0.1
	var new_animation = "run" if is_moving else "idle"
	
	if new_animation != animation_state:
		set_animation_state(new_animation)

func update_player_state(state_data: Dictionary) -> void:
	"""Update player state from server"""
	var state_changed = false
	
	# Update health
	if state_data.has("health"):
		var new_health = state_data.health.get("current", current_health)
		var new_max_health = state_data.health.get("max", max_health)
		
		if new_health != current_health or new_max_health != max_health:
			current_health = new_health
			max_health = new_max_health
			update_health_display()
			health_changed.emit(player_id, current_health, max_health)
			state_changed = true
	
	# Update equipment
	if state_data.has("equipment"):
		var new_equipment = state_data.equipment
		if new_equipment != equipped_items:
			equipped_items = new_equipment
			update_equipment_display()
			equipment_changed.emit(player_id, equipped_items)
			state_changed = true
	
	# Update animation state
	if state_data.has("animation"):
		var new_animation = state_data.animation
		if new_animation != animation_state:
			set_animation_state(new_animation)
			state_changed = true
	
	if state_changed:
		player_data.merge(state_data)

func _process(delta: float) -> void:
	"""Update player interpolation and animations"""
	# Smooth position interpolation (for non-local players)
	if not is_local_player:
		var distance_to_target = current_position.distance_to(target_position)
		if distance_to_target > 0.01:
			current_position = current_position.lerp(target_position, movement_speed * delta)
			global_position = current_position
		
		# Smooth rotation interpolation
		var rotation_diff = abs(current_rotation - target_rotation)
		if rotation_diff > 1.0:  # Only interpolate if significant difference
			current_rotation = lerp_angle(current_rotation, target_rotation, 5.0 * delta)
			rotation_degrees.y = current_rotation
	
	# Update health bar to always face camera
	if health_bar_3d and health_bar_visible:
		update_health_bar_visibility()

# ============================================
# Health Display
# ============================================

func update_health_display() -> void:
	"""Update the 3D health bar display"""
	if not health_bar_3d:
		return
	
	var health_fill = health_bar_3d.get_node_or_null("HealthFill")
	if health_fill:
		# Update health bar width based on current health percentage
		var health_percentage = float(current_health) / float(max_health) if max_health > 0 else 0.0
		var fill_mesh = health_fill.mesh as QuadMesh
		if fill_mesh:
			fill_mesh.size.x = health_percentage * 1.0  # Max width is 1.0
		
		# Update health bar color based on health percentage
		var material = health_fill.get_surface_override_material(0) as StandardMaterial3D
		if material:
			if health_percentage > 0.6:
				material.albedo_color = Color(0.2, 0.8, 0.2)  # Green
			elif health_percentage > 0.3:
				material.albedo_color = Color(0.8, 0.8, 0.2)  # Yellow
			else:
				material.albedo_color = Color(0.8, 0.2, 0.2)  # Red

func update_health_bar_visibility() -> void:
	"""Update health bar visibility based on distance and health"""
	if not health_bar_3d:
		return
	
	# Hide health bar if at full health and not in combat
	var should_show = current_health < max_health or animation_state == "attack"
	
	# Also consider distance to camera
	var camera = get_viewport().get_camera_3d()
	if camera:
		var distance_to_camera = global_position.distance_to(camera.global_position)
		should_show = should_show and distance_to_camera < 20.0  # Hide if too far
	
	health_bar_3d.visible = should_show and health_bar_visible

func set_health_bar_visible(visible: bool) -> void:
	"""Set health bar visibility"""
	health_bar_visible = visible
	if health_bar_3d:
		health_bar_3d.visible = visible

# ============================================
# Equipment Display
# ============================================

func update_equipment_display() -> void:
	"""Update equipment visual display"""
	if equipment_manager:
		equipment_manager.update_equipment(equipped_items)
	else:
		# Basic equipment update without equipment manager
		_update_basic_equipment()

func _update_basic_equipment() -> void:
	"""Basic equipment update for when equipment manager is not available"""
	# This is a simplified version - in a full implementation,
	# you would load different models/textures based on equipment
	
	# Example: Change player color based on armor
	if equipped_items.has("armor") and equipped_items.armor != 0:
		set_player_color(Color(0.6, 0.6, 0.6))  # Gray for armored
	else:
		set_player_color(Color(0.3, 0.6, 0.9))  # Blue for unarmored

func set_player_color(color: Color) -> void:
	"""Set the player's color"""
	var mesh_instance = player_model.get_child(0) as MeshInstance3D
	if mesh_instance:
		var material = mesh_instance.get_surface_override_material(0) as StandardMaterial3D
		if material:
			material.albedo_color = color

# ============================================
# Animation Control
# ============================================

func set_animation_state(new_state: String) -> void:
	"""Set animation state"""
	if new_state == animation_state:
		return
	
	print("PlayerController3D: Animation state changed: ", animation_state, " -> ", new_state)
	animation_state = new_state
	
	# Play animation if AnimationPlayer exists
	if animation_player and animation_player.has_animation(animation_state):
		animation_player.play(animation_state)
	else:
		# Basic animation simulation
		_simulate_animation(animation_state)
	
	animation_changed.emit(player_id, animation_state)

func _simulate_animation(state: String) -> void:
	"""Simulate animation when AnimationPlayer is not available"""
	match state:
		"idle":
			# Gentle bobbing motion
			create_tween().tween_property(player_model, "position:y", 0.05, 1.0).set_trans(Tween.TRANS_SINE)
		"run":
			# Faster bobbing for running
			var tween = create_tween()
			tween.set_loops()
			tween.tween_property(player_model, "position:y", 0.1, 0.3).set_trans(Tween.TRANS_SINE)
			tween.tween_property(player_model, "position:y", 0.0, 0.3).set_trans(Tween.TRANS_SINE)
		"attack":
			# Quick forward thrust
			var tween = create_tween()
			tween.tween_property(player_model, "position:z", -0.2, 0.1)
			tween.tween_property(player_model, "position:z", 0.0, 0.2)

# ============================================
# Name Display
# ============================================

func create_name_display(player_name: String) -> void:
	"""Create 3D name display above player"""
	# Remove existing name display
	var existing_name = get_node_or_null("NameDisplay3D")
	if existing_name:
		existing_name.queue_free()
	
	# Create new name display
	var name_display = Node3D.new()
	name_display.name = "NameDisplay3D"
	name_display.position = Vector3(0, 2.6, 0)  # Above health bar
	add_child(name_display)
	
	# Create text mesh for name
	var label_3d = Label3D.new()
	label_3d.text = player_name
	label_3d.font_size = 16
	label_3d.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label_3d.modulate = Color.WHITE
	label_3d.outline_size = 2
	label_3d.outline_modulate = Color.BLACK
	name_display.add_child(label_3d)

# ============================================
# Combat Effects
# ============================================

func play_damage_effect(damage: int) -> void:
	"""Play damage effect"""
	# Create floating damage text
	create_damage_text(str(damage), Color.RED)
	
	# Flash red briefly
	var mesh_instance = player_model.get_child(0) as MeshInstance3D
	if mesh_instance:
		var material = mesh_instance.get_surface_override_material(0) as StandardMaterial3D
		if material:
			var original_color = material.albedo_color
			material.albedo_color = Color.RED
			await get_tree().create_timer(0.1).timeout
			material.albedo_color = original_color

func play_heal_effect(heal_amount: int) -> void:
	"""Play healing effect"""
	create_damage_text("+" + str(heal_amount), Color.GREEN)

func create_damage_text(text: String, color: Color) -> void:
	"""Create floating damage/heal text"""
	var damage_label = Label3D.new()
	damage_label.text = text
	damage_label.font_size = 20
	damage_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	damage_label.modulate = color
	damage_label.outline_size = 2
	damage_label.outline_modulate = Color.BLACK
	damage_label.position = Vector3(randf_range(-0.5, 0.5), 2.8, 0)
	add_child(damage_label)
	
	# Animate floating text
	var tween = create_tween()
	tween.parallel().tween_property(damage_label, "position:y", damage_label.position.y + 1.5, 1.5)
	tween.parallel().tween_property(damage_label, "modulate:a", 0.0, 1.5)
	tween.tween_callback(damage_label.queue_free)

# ============================================
# Utility Methods
# ============================================

func get_player_id() -> String:
	"""Get player ID"""
	return player_id

func get_player_position_3d() -> Vector3:
	"""Get current 3D position"""
	return current_position

func get_player_rotation_3d() -> float:
	"""Get current rotation"""
	return current_rotation

func is_local() -> bool:
	"""Check if this is the local player"""
	return is_local_player

func get_health_percentage() -> float:
	"""Get health as percentage"""
	return float(current_health) / float(max_health) if max_health > 0 else 0.0

func cleanup() -> void:
	"""Clean up player controller"""
	print("PlayerController3D: Cleaning up player: ", player_id)
	queue_free()
