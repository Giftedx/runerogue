extends Node
class_name CombatEventHandler

## Enhanced Combat Event Handler for RuneRogue
## Handles real-time combat events, damage numbers, XP drops, and visual feedback

signal damage_dealt(attacker_id: String, target_id: String, damage: int, is_critical: bool)
signal player_died(player_id: String, killer_id: String)
signal npc_died(npc_id: String, killer_id: String)
signal xp_gained(player_id: String, skill: String, xp: int)
signal wave_started(wave_number: int, enemy_count: int, is_boss_wave: bool)
signal wave_completed(wave_number: int, duration: float, rewards: Array)

# Damage number scene for displaying floating damage
@export var damage_number_scene: PackedScene
@export var xp_drop_scene: PackedScene

# References to UI elements
var damage_number_container: Node2D
var world_canvas: CanvasLayer

# Combat feedback settings
@export var damage_number_duration: float = 2.0
@export var xp_drop_duration: float = 3.0
@export var critical_hit_scale: float = 1.5
@export var max_damage_numbers: int = 50

# Active damage numbers for cleanup
var active_damage_numbers: Array[Node] = []
var active_xp_drops: Array[Node] = []

func _ready():
	setup_ui_references()
	connect_network_events()

func setup_ui_references():
	"""Setup references to UI containers for damage numbers and XP drops"""
	# Find or create world canvas for overlays
	world_canvas = get_node_or_null("/root/Main/WorldCanvas")
	if not world_canvas:
		world_canvas = CanvasLayer.new()
		world_canvas.name = "WorldCanvas"
		world_canvas.layer = 10
		get_tree().current_scene.add_child(world_canvas)
	
	# Create damage number container
	damage_number_container = Node2D.new()
	damage_number_container.name = "DamageNumbers"
	world_canvas.add_child(damage_number_container)

func connect_network_events():
	"""Connect to network events from the game server"""
	var network_manager = get_node_or_null("/root/NetworkManager")
	if network_manager:
		# Connect to combat events
		if network_manager.has_signal("damage_received"):
			network_manager.damage_received.connect(_on_damage_received)
		if network_manager.has_signal("death_event"):
			network_manager.death_event.connect(_on_death_event)
		if network_manager.has_signal("xp_gained"):
			network_manager.xp_gained.connect(_on_xp_gained)
		if network_manager.has_signal("wave_start"):
			network_manager.wave_start.connect(_on_wave_start)
		if network_manager.has_signal("wave_complete"):
			network_manager.wave_complete.connect(_on_wave_complete)

func _on_damage_received(data: Dictionary):
	"""Handle incoming damage event"""
	var attacker_id = data.get("attackerId", "")
	var target_id = data.get("targetId", "")
	var damage = data.get("damage", 0)
	var is_critical = data.get("criticalHit", false)
	var target_position = data.get("position", Vector2.ZERO)
	
	# Emit signal for other systems
	damage_dealt.emit(attacker_id, target_id, damage, is_critical)
	
	# Show damage number
	show_damage_number(damage, target_position, is_critical)
	
	# Play sound effect
	play_damage_sound(damage, is_critical)
	
	# Screen shake for critical hits
	if is_critical:
		trigger_screen_shake()

func _on_death_event(data: Dictionary):
	"""Handle death events"""
	var victim_id = data.get("victimId", "")
	var killer_id = data.get("killedBy", "")
	var is_player = data.get("isPlayer", false)
	
	if is_player:
		player_died.emit(victim_id, killer_id)
		show_death_message(victim_id, killer_id)
	else:
		npc_died.emit(victim_id, killer_id)
		show_enemy_death_effect(victim_id)

func _on_xp_gained(data: Dictionary):
	"""Handle XP gain events"""
	var player_id = data.get("playerId", "")
	var skill = data.get("skill", "")
	var xp = data.get("xp", 0)
	var position = data.get("position", Vector2.ZERO)
	
	# Emit signal
	xp_gained.emit(player_id, skill, xp)
	
	# Show XP drop
	show_xp_drop(skill, xp, position)
	
	# Play XP sound
	play_xp_sound(skill)

func _on_wave_start(data: Dictionary):
	"""Handle wave start events"""
	var wave_number = data.get("wave", 1)
	var enemy_count = data.get("enemyCount", 0)
	var is_boss_wave = data.get("isBossWave", false)
	
	# Emit signal
	wave_started.emit(wave_number, enemy_count, is_boss_wave)
	
	# Show wave announcement
	show_wave_announcement(wave_number, enemy_count, is_boss_wave)

func _on_wave_complete(data: Dictionary):
	"""Handle wave completion events"""
	var wave_number = data.get("wave", 1)
	var duration = data.get("duration", 0.0)
	var rewards = data.get("rewards", [])
	
	# Emit signal
	wave_completed.emit(wave_number, duration, rewards)
	
	# Show completion message
	show_wave_completion(wave_number, duration, rewards)

func show_damage_number(damage: int, position: Vector2, is_critical: bool = false):
	"""Display floating damage number at position"""
	if not damage_number_scene:
		return
	
	# Limit active damage numbers for performance
	cleanup_old_damage_numbers()
	
	var damage_number = damage_number_scene.instantiate()
	damage_number_container.add_child(damage_number)
	
	# Set position
	damage_number.global_position = position
	
	# Configure damage number
	if damage_number.has_method("setup"):
		damage_number.setup(damage, is_critical)
	
	# Scale for critical hits
	if is_critical and damage_number.has_method("set_scale"):
		damage_number.scale *= critical_hit_scale
	
	# Add to tracking
	active_damage_numbers.append(damage_number)
	
	# Auto-cleanup after duration
	get_tree().create_timer(damage_number_duration).timeout.connect(
		func(): cleanup_damage_number(damage_number)
	)

func show_xp_drop(skill: String, xp: int, position: Vector2):
	"""Display XP drop at position"""
	if not xp_drop_scene:
		return
	
	cleanup_old_xp_drops()
	
	var xp_drop = xp_drop_scene.instantiate()
	damage_number_container.add_child(xp_drop)
	
	# Set position with slight offset from damage numbers
	xp_drop.global_position = position + Vector2(30, -20)
	
	# Configure XP drop
	if xp_drop.has_method("setup"):
		xp_drop.setup(skill, xp)
	
	# Add to tracking
	active_xp_drops.append(xp_drop)
	
	# Auto-cleanup
	get_tree().create_timer(xp_drop_duration).timeout.connect(
		func(): cleanup_xp_drop(xp_drop)
	)

func show_wave_announcement(wave_number: int, enemy_count: int, is_boss_wave: bool):
	"""Show wave start announcement"""
	var message = "Wave %d" % wave_number
	if is_boss_wave:
		message += " - BOSS WAVE!"
	else:
		message += " - %d enemies" % enemy_count
	
	# Show UI notification (implement based on your UI system)
	show_notification(message, 3.0, Color.YELLOW if is_boss_wave else Color.WHITE)

func show_wave_completion(wave_number: int, duration: float, rewards: Array):
	"""Show wave completion message"""
	var message = "Wave %d Complete! (%.1fs)" % [wave_number, duration]
	show_notification(message, 2.0, Color.GREEN)
	
	# Show rewards if any
	for reward in rewards:
		show_reward_notification(reward)

func show_death_message(victim_id: String, killer_id: String):
	"""Show player death message"""
	var message = "%s was killed by %s" % [victim_id, killer_id]
	show_notification(message, 4.0, Color.RED)

func show_enemy_death_effect(enemy_id: String):
	"""Show visual effect for enemy death"""
	# Implement death particle effects, screen flash, etc.
	pass

func play_damage_sound(damage: int, is_critical: bool):
	"""Play appropriate damage sound"""
	var audio_manager = get_node_or_null("/root/AudioManager")
	if audio_manager and audio_manager.has_method("play_damage_sound"):
		audio_manager.play_damage_sound(damage, is_critical)

func play_xp_sound(skill: String):
	"""Play XP gain sound"""
	var audio_manager = get_node_or_null("/root/AudioManager")
	if audio_manager and audio_manager.has_method("play_xp_sound"):
		audio_manager.play_xp_sound(skill)

func trigger_screen_shake():
	"""Trigger screen shake for critical hits"""
	var camera = get_viewport().get_camera_2d()
	if camera and camera.has_method("shake"):
		camera.shake(0.1, 5.0) # duration, intensity

func show_notification(text: String, duration: float, color: Color = Color.WHITE):
	"""Show a UI notification"""
	var hud = get_node_or_null("/root/Main/HUD")
	if hud and hud.has_method("show_notification"):
		hud.show_notification(text, duration, color)

func show_reward_notification(reward: Dictionary):
	"""Show reward notification"""
	var reward_type = reward.get("type", "")
	var value = reward.get("value", "")
	var quantity = reward.get("quantity", 1)
	
	var message = ""
	match reward_type:
		"xp":
			message = "+%d %s XP" % [quantity, value]
		"item":
			message = "+%d %s" % [quantity, value]
		"gold":
			message = "+%d gold" % quantity
		_:
			message = "Reward: %s" % str(value)
	
	show_notification(message, 2.0, Color.YELLOW)

func cleanup_old_damage_numbers():
	"""Remove old damage numbers for performance"""
	while active_damage_numbers.size() > max_damage_numbers:
		var old_number = active_damage_numbers.pop_front()
		cleanup_damage_number(old_number)

func cleanup_old_xp_drops():
	"""Remove old XP drops for performance"""
	while active_xp_drops.size() > max_damage_numbers / 2:
		var old_drop = active_xp_drops.pop_front()
		cleanup_xp_drop(old_drop)

func cleanup_damage_number(damage_number: Node):
	"""Clean up a specific damage number"""
	if damage_number and is_instance_valid(damage_number):
		active_damage_numbers.erase(damage_number)
		damage_number.queue_free()

func cleanup_xp_drop(xp_drop: Node):
	"""Clean up a specific XP drop"""
	if xp_drop and is_instance_valid(xp_drop):
		active_xp_drops.erase(xp_drop)
		xp_drop.queue_free()

func _exit_tree():
	"""Cleanup when exiting"""
	for damage_number in active_damage_numbers:
		if is_instance_valid(damage_number):
			damage_number.queue_free()
	
	for xp_drop in active_xp_drops:
		if is_instance_valid(xp_drop):
			xp_drop.queue_free()
	
	active_damage_numbers.clear()
	active_xp_drops.clear()
