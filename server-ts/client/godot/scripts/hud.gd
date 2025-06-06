extends Control

@onready var health_bar: ProgressBar = $TopBar/HealthContainer/HealthBar
@onready var health_text: Label = $TopBar/HealthContainer/HealthText
@onready var level_label: Label = $TopBar/Stats/LevelLabel
@onready var exp_label: Label = $TopBar/Stats/ExpLabel
@onready var chat_text: RichTextLabel = $ChatBox/ChatScroll/ChatText
@onready var action_bar: HBoxContainer = $BottomBar/ActionBar

# Player stats
var current_health: int = 75
var max_health: int = 100
var player_level: int = 1
var current_exp: int = 0
var exp_to_next_level: int = 100

# Chat history
var chat_messages: Array = []
var max_chat_messages: int = 50

func _ready() -> void:
	# Initialize UI
	update_health(current_health, max_health)
	update_level(player_level)
	update_exp(current_exp, exp_to_next_level)
	
	# Set up action bar
	_setup_action_bar()

func _setup_action_bar() -> void:
	# Add tooltips to action slots
	for i in range(action_bar.get_child_count()):
		var slot = action_bar.get_child(i)
		if slot is Panel:
			slot.tooltip_text = "Action Slot %d\nPress %d to activate" % [i + 1, i + 1]

func update_health(current: int, maximum: int) -> void:
	current_health = current
	max_health = maximum
	
	# Update health bar
	health_bar.value = (float(current) / float(maximum)) * 100.0
	
	# Update health text
	health_text.text = "%d/%d" % [current, maximum]
	
	# Change bar color based on health percentage
	var health_percent = float(current) / float(maximum)
	if health_percent > 0.6:
		health_bar.modulate = Color.GREEN
	elif health_percent > 0.3:
		health_bar.modulate = Color.YELLOW
	else:
		health_bar.modulate = Color.RED
		# Add pulsing effect for low health
		_pulse_health_bar()

func _pulse_health_bar() -> void:
	var tween = create_tween()
	tween.set_loops()
	tween.tween_property(health_bar, "modulate:a", 0.5, 0.5)
	tween.tween_property(health_bar, "modulate:a", 1.0, 0.5)

func update_level(level: int) -> void:
	player_level = level
	level_label.text = "Level: %d" % level

func update_exp(current: int, needed: int) -> void:
	current_exp = current
	exp_to_next_level = needed
	exp_label.text = "XP: %d/%d" % [current, needed]

func add_chat_message(message: String, color: Color = Color.WHITE) -> void:
	# Add timestamp
	var time = Time.get_time_dict_from_system()
	var timestamp = "[%02d:%02d] " % [time.hour, time.minute]
	
	# Format message with color
	var formatted_message = "[color=#%s]%s%s[/color]" % [color.to_html(false), timestamp, message]
	
	# Add to chat
	chat_messages.append(formatted_message)
	
	# Limit chat history
	if chat_messages.size() > max_chat_messages:
		chat_messages.pop_front()
	
	# Update display
	_update_chat_display()

func _update_chat_display() -> void:
	chat_text.clear()
	for msg in chat_messages:
		chat_text.append_text(msg + "\n")
	
	# Scroll to bottom
	await get_tree().process_frame
	var scroll_container = chat_text.get_parent()
	if scroll_container is ScrollContainer:
		scroll_container.scroll_vertical = int(scroll_container.get_v_scroll_bar().max_value)

func show_damage_number(damage: int, position: Vector2) -> void:
	# Create floating damage number
	var damage_label = Label.new()
	damage_label.text = "-%d" % damage
	damage_label.add_theme_font_size_override("font_size", 24)
	damage_label.modulate = Color.RED
	damage_label.position = position
	add_child(damage_label)
	
	# Animate floating up and fading
	var tween = create_tween()
	tween.parallel().tween_property(damage_label, "position:y", position.y - 50, 1.0)
	tween.parallel().tween_property(damage_label, "modulate:a", 0.0, 1.0)
	tween.tween_callback(damage_label.queue_free)

func show_exp_gain(exp: int, position: Vector2) -> void:
	# Create floating exp number
	var exp_label = Label.new()
	exp_label.text = "+%d XP" % exp
	exp_label.add_theme_font_size_override("font_size", 20)
	exp_label.modulate = Color.YELLOW
	exp_label.position = position
	add_child(exp_label)
	
	# Animate floating up and fading
	var tween = create_tween()
	tween.parallel().tween_property(exp_label, "position:y", position.y - 30, 0.8)
	tween.parallel().tween_property(exp_label, "modulate:a", 0.0, 0.8)
	tween.tween_callback(exp_label.queue_free)

func _input(event: InputEvent) -> void:
	# Handle action bar shortcuts
	for i in range(min(9, action_bar.get_child_count())):
		if event.is_action_pressed("ui_select") and Input.is_key_pressed(KEY_1 + i):
			_activate_action_slot(i)

func _activate_action_slot(slot_index: int) -> void:
	var slot = action_bar.get_child(slot_index)
	if slot is Panel:
		# Visual feedback
		var tween = create_tween()
		tween.tween_property(slot, "modulate", Color(2, 2, 2), 0.1)
		tween.tween_property(slot, "modulate", Color.WHITE, 0.1)
		
		# Trigger action
		print("Activated action slot %d" % (slot_index + 1))
		add_chat_message("Used ability in slot %d" % (slot_index + 1), Color.CYAN)