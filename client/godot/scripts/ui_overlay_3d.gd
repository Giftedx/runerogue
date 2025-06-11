extends CanvasLayer
class_name UIOverlay3D

## 3D UI Overlay for RuneRogue
## Manages 2D UI elements overlaid on the 3D game world

# UI Components
@onready var health_bar: ProgressBar = $UIContainer/StatusPanel/HealthBar
@onready var experience_bar: ProgressBar = $UIContainer/StatusPanel/ExperienceBar
@onready var wave_label: Label = $UIContainer/StatusPanel/WaveLabel
@onready var player_list: VBoxContainer = $UIContainer/PlayersPanel/PlayerList
@onready var minimap: Control = $UIContainer/MinimapPanel/Minimap
@onready var inventory_panel: Control = $UIContainer/InventoryPanel
@onready var skills_panel: Control = $UIContainer/SkillsPanel
@onready var menu_panel: Control = $UIContainer/MenuPanel
@onready var wave_notification: Label = $UIContainer/Notifications/WaveNotification
@onready var game_over_panel: Control = $UIContainer/GameOverPanel

# UI State
var ui_visible: bool = true
var menu_open: bool = false
var inventory_open: bool = false
var skills_open: bool = false

# Player data for UI updates
var local_player_data: Dictionary = {}
var connected_players: Dictionary = {}

# Signals
signal inventory_toggle_requested()
signal skills_toggle_requested()
signal menu_action_requested(action: String)

func _ready() -> void:
	print("UIOverlay3D: Initializing 3D UI overlay")
	setup_ui_layout()
	create_ui_elements()
	connect_ui_signals()
	
	# Initially hide some panels
	if inventory_panel:
		inventory_panel.visible = false
	if skills_panel:
		skills_panel.visible = false
	if menu_panel:
		menu_panel.visible = false
	if game_over_panel:
		game_over_panel.visible = false

func setup_ui_layout() -> void:
	"""Setup the basic UI layout structure"""
	# Create main UI container if it doesn't exist
	if not has_node("UIContainer"):
		var ui_container = Control.new()
		ui_container.name = "UIContainer"
		ui_container.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		add_child(ui_container)
		
		# Create UI panels
		create_status_panel(ui_container)
		create_players_panel(ui_container)
		create_minimap_panel(ui_container)
		create_inventory_panel(ui_container)
		create_skills_panel(ui_container)
		create_menu_panel(ui_container)
		create_notifications_panel(ui_container)
		create_game_over_panel(ui_container)

func create_ui_elements() -> void:
	"""Create UI elements that don't exist"""
	# Get or create UI container
	var ui_container = get_node_or_null("UIContainer")
	if not ui_container:
		ui_container = Control.new()
		ui_container.name = "UIContainer"
		ui_container.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		add_child(ui_container)
	
	# Ensure all UI components exist
	if not health_bar:
		health_bar = _create_health_bar(ui_container)
	
	if not experience_bar:
		experience_bar = _create_experience_bar(ui_container)
	
	if not wave_label:
		wave_label = _create_wave_label(ui_container)
	
	if not player_list:
		player_list = _create_player_list(ui_container)
	
	if not minimap:
		minimap = _create_minimap(ui_container)

func create_status_panel(parent: Control) -> void:
	"""Create the status panel with health, XP, and wave info"""
	var status_panel = Panel.new()
	status_panel.name = "StatusPanel"
	status_panel.position = Vector2(20, 20)
	status_panel.size = Vector2(300, 120)
	parent.add_child(status_panel)
	
	var vbox = VBoxContainer.new()
	vbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vbox.add_theme_constant_override("separation", 10)
	status_panel.add_child(vbox)
	
	# Health bar
	var health_container = HBoxContainer.new()
	var health_label = Label.new()
	health_label.text = "Health:"
	health_label.custom_minimum_size.x = 60
	health_container.add_child(health_label)
	
	var health_progress = ProgressBar.new()
	health_progress.name = "HealthBar"
	health_progress.value = 100
	health_progress.show_percentage = false
	health_container.add_child(health_progress)
	vbox.add_child(health_container)
	
	# Experience bar
	var exp_container = HBoxContainer.new()
	var exp_label = Label.new()
	exp_label.text = "XP:"
	exp_label.custom_minimum_size.x = 60
	exp_container.add_child(exp_label)
	
	var exp_progress = ProgressBar.new()
	exp_progress.name = "ExperienceBar"
	exp_progress.value = 0
	exp_progress.show_percentage = false
	exp_container.add_child(exp_progress)
	vbox.add_child(exp_container)
	
	# Wave label
	var wave_info = Label.new()
	wave_info.name = "WaveLabel"
	wave_info.text = "Wave: 1"
	wave_info.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(wave_info)

func create_players_panel(parent: Control) -> void:
	"""Create the players list panel"""
	var players_panel = Panel.new()
	players_panel.name = "PlayersPanel"
	players_panel.position = Vector2(parent.size.x - 220, 20)
	players_panel.size = Vector2(200, 300)
	parent.add_child(players_panel)
	
	var vbox = VBoxContainer.new()
	vbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	players_panel.add_child(vbox)
	
	var title = Label.new()
	title.text = "Players"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)
	
	var separator = HSeparator.new()
	vbox.add_child(separator)
	
	var scroll = ScrollContainer.new()
	scroll.custom_minimum_size.y = 200
	vbox.add_child(scroll)
	
	var player_list_container = VBoxContainer.new()
	player_list_container.name = "PlayerList"
	scroll.add_child(player_list_container)

func create_minimap_panel(parent: Control) -> void:
	"""Create the minimap panel"""
	var minimap_panel = Panel.new()
	minimap_panel.name = "MinimapPanel"
	minimap_panel.position = Vector2(parent.size.x - 220, parent.size.y - 220)
	minimap_panel.size = Vector2(200, 200)
	parent.add_child(minimap_panel)
	
	var minimap_control = Control.new()
	minimap_control.name = "Minimap"
	minimap_control.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	minimap_panel.add_child(minimap_control)
	
	# Add basic minimap background
	var bg = ColorRect.new()
	bg.color = Color(0.1, 0.1, 0.1)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	minimap_control.add_child(bg)

func create_inventory_panel(parent: Control) -> void:
	"""Create the inventory panel"""
	var inv_panel = Panel.new()
	inv_panel.name = "InventoryPanel"
	inv_panel.position = Vector2(parent.size.x / 2 - 200, parent.size.y / 2 - 150)
	inv_panel.size = Vector2(400, 300)
	inv_panel.visible = false
	parent.add_child(inv_panel)
	
	var title = Label.new()
	title.text = "Inventory"
	title.position = Vector2(10, 10)
	inv_panel.add_child(title)
	
	# Create inventory grid
	var grid = GridContainer.new()
	grid.columns = 7  # OSRS inventory is 4 rows x 7 columns = 28 slots
	grid.position = Vector2(10, 40)
	grid.size = Vector2(380, 240)
	inv_panel.add_child(grid)
	
	# Create 28 inventory slots
	for i in range(28):
		var slot = Panel.new()
		slot.custom_minimum_size = Vector2(50, 50)
		slot.tooltip_text = "Inventory Slot " + str(i + 1)
		grid.add_child(slot)

func create_skills_panel(parent: Control) -> void:
	"""Create the skills panel"""
	var skills_panel_node = Panel.new()
	skills_panel_node.name = "SkillsPanel"
	skills_panel_node.position = Vector2(parent.size.x / 2 - 300, parent.size.y / 2 - 200)
	skills_panel_node.size = Vector2(600, 400)
	skills_panel_node.visible = false
	parent.add_child(skills_panel_node)
	
	var title = Label.new()
	title.text = "Skills"
	title.position = Vector2(10, 10)
	skills_panel_node.add_child(title)
	
	# Create skills grid for OSRS skills
	var skills_grid = GridContainer.new()
	skills_grid.columns = 3
	skills_grid.position = Vector2(10, 40)
	skills_grid.size = Vector2(580, 350)
	skills_panel_node.add_child(skills_grid)
	
	# OSRS skills list
	var skills = [
		"Attack", "Strength", "Defence", "Ranged", "Prayer", "Magic",
		"Runecrafting", "Hitpoints", "Crafting", "Mining", "Smithing", "Fishing",
		"Cooking", "Firemaking", "Woodcutting", "Agility", "Herblore", "Thieving",
		"Fletching", "Slayer", "Farming", "Construction", "Hunter"
	]
	
	for skill in skills:
		var skill_container = VBoxContainer.new()
		skill_container.custom_minimum_size = Vector2(180, 40)
		
		var skill_label = Label.new()
		skill_label.text = skill + ": 1"
		skill_container.add_child(skill_label)
		
		var skill_progress = ProgressBar.new()
		skill_progress.value = 0
		skill_progress.show_percentage = false
		skill_container.add_child(skill_progress)
		
		skills_grid.add_child(skill_container)

func create_menu_panel(parent: Control) -> void:
	"""Create the game menu panel"""
	var menu = Panel.new()
	menu.name = "MenuPanel"
	menu.position = Vector2(parent.size.x / 2 - 150, parent.size.y / 2 - 100)
	menu.size = Vector2(300, 200)
	menu.visible = false
	parent.add_child(menu)
	
	var vbox = VBoxContainer.new()
	vbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vbox.add_theme_constant_override("separation", 10)
	menu.add_child(vbox)
	
	var title = Label.new()
	title.text = "Game Menu"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)
	
	var resume_button = Button.new()
	resume_button.text = "Resume Game"
	resume_button.pressed.connect(_on_resume_pressed)
	vbox.add_child(resume_button)
	
	var settings_button = Button.new()
	settings_button.text = "Settings"
	settings_button.pressed.connect(_on_settings_pressed)
	vbox.add_child(settings_button)
	
	var quit_button = Button.new()
	quit_button.text = "Quit to Menu"
	quit_button.pressed.connect(_on_quit_pressed)
	vbox.add_child(quit_button)

func create_notifications_panel(parent: Control) -> void:
	"""Create the notifications panel"""
	var notifications = Control.new()
	notifications.name = "Notifications"
	notifications.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	parent.add_child(notifications)
	
	var wave_notif = Label.new()
	wave_notif.name = "WaveNotification"
	wave_notif.text = ""
	wave_notif.position = Vector2(parent.size.x / 2 - 100, 100)
	wave_notif.size = Vector2(200, 50)
	wave_notif.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wave_notif.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	wave_notif.add_theme_font_size_override("font_size", 24)
	wave_notif.visible = false
	notifications.add_child(wave_notif)

func create_game_over_panel(parent: Control) -> void:
	"""Create the game over panel"""
	var game_over = Panel.new()
	game_over.name = "GameOverPanel"
	game_over.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	game_over.size = Vector2(400, 200)
	game_over.visible = false
	parent.add_child(game_over)
	
	var vbox = VBoxContainer.new()
	vbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vbox.add_theme_constant_override("separation", 20)
	game_over.add_child(vbox)
	
	var title = Label.new()
	title.text = "Game Over"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 32)
	vbox.add_child(title)
	
	var restart_button = Button.new()
	restart_button.text = "Restart"
	restart_button.pressed.connect(_on_restart_pressed)
	vbox.add_child(restart_button)
	
	var menu_button = Button.new()
	menu_button.text = "Main Menu"
	menu_button.pressed.connect(_on_main_menu_pressed)
	vbox.add_child(menu_button)

# ============================================
# Helper Functions for UI Creation
# ============================================

func _create_health_bar(parent: Control) -> ProgressBar:
	"""Create health bar if it doesn't exist"""
	var health_progress = ProgressBar.new()
	health_progress.name = "HealthBar"
	health_progress.value = 100
	health_progress.show_percentage = false
	return health_progress

func _create_experience_bar(parent: Control) -> ProgressBar:
	"""Create experience bar if it doesn't exist"""
	var exp_progress = ProgressBar.new()
	exp_progress.name = "ExperienceBar"
	exp_progress.value = 0
	exp_progress.show_percentage = false
	return exp_progress

func _create_wave_label(parent: Control) -> Label:
	"""Create wave label if it doesn't exist"""
	var wave_info = Label.new()
	wave_info.name = "WaveLabel"
	wave_info.text = "Wave: 1"
	wave_info.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	return wave_info

func _create_player_list(parent: Control) -> VBoxContainer:
	"""Create player list if it doesn't exist"""
	var player_list_container = VBoxContainer.new()
	player_list_container.name = "PlayerList"
	return player_list_container

func _create_minimap(parent: Control) -> Control:
	"""Create minimap if it doesn't exist"""
	var minimap_control = Control.new()
	minimap_control.name = "Minimap"
	return minimap_control

func connect_ui_signals() -> void:
	"""Connect UI signals"""
	# This can be expanded to connect more UI element signals
	pass

func initialize_ui() -> void:
	"""Initialize UI with default values"""
	print("UIOverlay3D: UI initialized")
	
	# Set initial UI state
	if health_bar:
		health_bar.value = 100
	if experience_bar:
		experience_bar.value = 0
	if wave_label:
		wave_label.text = "Wave: 1"

# ============================================
# UI Update Methods
# ============================================

func update_health_bar(current: int, max_health: int) -> void:
	"""Update health bar display"""
	if health_bar:
		health_bar.max_value = max_health
		health_bar.value = current
		
		# Update color based on health percentage
		var percentage = float(current) / float(max_health)
		if percentage > 0.6:
			health_bar.modulate = Color.GREEN
		elif percentage > 0.3:
			health_bar.modulate = Color.YELLOW
		else:
			health_bar.modulate = Color.RED

func update_experience_bar(current_xp: int, next_level_xp: int) -> void:
	"""Update experience bar display"""
	if experience_bar:
		experience_bar.max_value = next_level_xp
		experience_bar.value = current_xp

func update_wave_display(wave_number: int) -> void:
	"""Update wave display"""
	if wave_label:
		wave_label.text = "Wave: " + str(wave_number)

func update_local_player_ui(player_data: Dictionary) -> void:
	"""Update UI with local player data"""
	local_player_data = player_data
	
	# Update health
	if player_data.has("health"):
		var health = player_data.health
		update_health_bar(health.get("current", 100), health.get("max", 100))
	
	# Update skills/experience
	if player_data.has("skills") and experience_bar:
		var skills = player_data.skills
		# Example: use attack XP for main experience bar
		var attack_xp = skills.get("attackXP", 0)
		var next_level_xp = calculate_xp_for_level(get_level_from_xp(attack_xp) + 1)
		update_experience_bar(attack_xp, next_level_xp)

func add_player_to_list(player_id: String, player_name: String) -> void:
	"""Add player to the player list"""
	if not player_list:
		return
	
	# Remove existing entry if any
	remove_player_from_list(player_id)
	
	var player_entry = HBoxContainer.new()
	player_entry.name = "Player_" + player_id
	
	var name_label = Label.new()
	name_label.text = player_name
	name_label.custom_minimum_size.x = 120
	player_entry.add_child(name_label)
	
	var health_display = ProgressBar.new()
	health_display.name = "HealthBar"
	health_display.value = 100
	health_display.custom_minimum_size.x = 60
	health_display.show_percentage = false
	player_entry.add_child(health_display)
	
	player_list.add_child(player_entry)
	connected_players[player_id] = {"name": player_name, "entry": player_entry}

func remove_player_from_list(player_id: String) -> void:
	"""Remove player from the player list"""
	if not player_list:
		return
	
	var entry_name = "Player_" + player_id
	var existing_entry = player_list.get_node_or_null(entry_name)
	if existing_entry:
		existing_entry.queue_free()
	
	connected_players.erase(player_id)

func update_player_health_in_list(player_id: String, current: int, max_health: int) -> void:
	"""Update player health in the player list"""
	if not connected_players.has(player_id):
		return
	
	var player_entry = connected_players[player_id].entry
	var health_bar_node = player_entry.get_node_or_null("HealthBar")
	if health_bar_node:
		health_bar_node.max_value = max_health
		health_bar_node.value = current

# ============================================
# UI Toggle Methods
# ============================================

func toggle_menu() -> void:
	"""Toggle game menu"""
	menu_open = not menu_open
	if menu_panel:
		menu_panel.visible = menu_open
	
	# Pause/unpause game
	get_tree().paused = menu_open

func toggle_inventory() -> void:
	"""Toggle inventory panel"""
	inventory_open = not inventory_open
	if inventory_panel:
		inventory_panel.visible = inventory_open
	inventory_toggle_requested.emit()

func toggle_skills() -> void:
	"""Toggle skills panel"""
	skills_open = not skills_open
	if skills_panel:
		skills_panel.visible = skills_open
	skills_toggle_requested.emit()

func set_ui_visible(visible: bool) -> void:
	"""Set overall UI visibility"""
	ui_visible = visible
	self.visible = visible

# ============================================
# Notification Methods
# ============================================

func show_wave_start(wave_number: int) -> void:
	"""Show wave start notification"""
	if wave_notification:
		wave_notification.text = "Wave " + str(wave_number) + " Starting!"
		wave_notification.visible = true
		
		# Animate notification
		var tween = create_tween()
		tween.tween_property(wave_notification, "modulate:a", 1.0, 0.5)
		tween.tween_delay(2.0)
		tween.tween_property(wave_notification, "modulate:a", 0.0, 0.5)
		tween.tween_callback(func(): wave_notification.visible = false)

func show_game_over() -> void:
	"""Show game over screen"""
	if game_over_panel:
		game_over_panel.visible = true

func show_notification(message: String, duration: float = 3.0) -> void:
	"""Show a general notification message"""
	# Create temporary notification label
	var notification = Label.new()
	notification.text = message
	notification.position = Vector2(get_viewport().size.x / 2 - 100, 200)
	notification.size = Vector2(200, 50)
	notification.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	notification.add_theme_font_size_override("font_size", 18)
	add_child(notification)
	
	# Animate and remove
	var tween = create_tween()
	tween.tween_property(notification, "modulate:a", 1.0, 0.3)
	tween.tween_delay(duration)
	tween.tween_property(notification, "modulate:a", 0.0, 0.3)
	tween.tween_callback(notification.queue_free)

# ============================================
# Input Handling
# ============================================

func _input(event: InputEvent) -> void:
	"""Handle UI input"""
	if event.is_action_pressed("ui_cancel"):
		if inventory_open:
			toggle_inventory()
		elif skills_open:
			toggle_skills()
		elif menu_open:
			toggle_menu()
		else:
			toggle_menu()
	
	# Example key bindings
	if event is InputEventKey and event.pressed:
		match event.keycode:
			KEY_I:
				toggle_inventory()
			KEY_K:
				toggle_skills()
			KEY_M:
				toggle_minimap_visibility()

func toggle_minimap_visibility() -> void:
	"""Toggle minimap visibility"""
	var minimap_panel = get_node_or_null("UIContainer/MinimapPanel")
	if minimap_panel:
		minimap_panel.visible = not minimap_panel.visible

# ============================================
# Button Signal Handlers
# ============================================

func _on_resume_pressed() -> void:
	"""Handle resume button press"""
	toggle_menu()

func _on_settings_pressed() -> void:
	"""Handle settings button press"""
	menu_action_requested.emit("settings")

func _on_quit_pressed() -> void:
	"""Handle quit button press"""
	menu_action_requested.emit("quit")

func _on_restart_pressed() -> void:
	"""Handle restart button press"""
	menu_action_requested.emit("restart")

func _on_main_menu_pressed() -> void:
	"""Handle main menu button press"""
	menu_action_requested.emit("main_menu")

# ============================================
# Utility Methods
# ============================================

func calculate_xp_for_level(level: int) -> int:
	"""Calculate XP required for a given level (OSRS formula)"""
	if level <= 1:
		return 0
	
	var xp = 0
	for i in range(2, level + 1):
		xp += int(i + 300.0 * pow(2.0, i / 7.0)) / 4
	
	return xp

func get_level_from_xp(xp: int) -> int:
	"""Get level from XP amount (OSRS formula)"""
	var level = 1
	while calculate_xp_for_level(level + 1) <= xp:
		level += 1
	return level
