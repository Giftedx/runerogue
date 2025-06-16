extends Control

# Signals for menu actions
signal start_game
signal quit_game

# Animation variables
var time_passed: float = 0.0
@onready var title_label: Label = $VBoxContainer/Title
@onready var buttons_container: VBoxContainer = $VBoxContainer

func _ready() -> void:
	# Set initial states for animations
	title_label.modulate.a = 0.0
	
	# Animate menu entrance
	_animate_menu_entrance()
	
	# Focus the play button by default
	$VBoxContainer/PlayButton.grab_focus()

func _animate_menu_entrance() -> void:
	# Fade in title
	var tween = create_tween()
	tween.tween_property(title_label, "modulate:a", 1.0, 0.5)
	
	# Animate buttons sliding in
	for i in range(buttons_container.get_child_count()):
		var child = buttons_container.get_child(i)
		if child is Button:
			child.modulate.a = 0.0
			child.position.x = -50
			tween.parallel().tween_property(child, "modulate:a", 1.0, 0.3).set_delay(0.1 * i)
			tween.parallel().tween_property(child, "position:x", 0, 0.3).set_delay(0.1 * i)

func _process(delta: float) -> void:
	time_passed += delta
	
	# Subtle animation on title
	title_label.position.y = sin(time_passed * 2.0) * 2.0

func _on_play_button_pressed() -> void:
	# Add button press effect
	_animate_button_press($VBoxContainer/PlayButton)
	
	# Emit signal to start game
	await get_tree().create_timer(0.2).timeout
	start_game.emit()

func _on_options_button_pressed() -> void:
	# Add button press effect
	_animate_button_press($VBoxContainer/OptionsButton)
	
	# TODO: Show options menu
	print("Options not implemented yet")

func _on_quit_button_pressed() -> void:
	# Add button press effect
	_animate_button_press($VBoxContainer/QuitButton)
	
	# Quit after animation
	await get_tree().create_timer(0.2).timeout
	quit_game.emit()

func _animate_button_press(button: Button) -> void:
	var tween = create_tween()
	tween.tween_property(button, "scale", Vector2(0.95, 0.95), 0.1)
	tween.tween_property(button, "scale", Vector2(1.0, 1.0), 0.1)

# Handle navigation with keyboard/gamepad
func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_up") or event.is_action_pressed("ui_down"):
		# Play navigation sound (when audio is implemented)
		pass