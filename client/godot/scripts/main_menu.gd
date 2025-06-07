extends Control

signal start_game

@onready var start_button = $VBoxContainer/StartButton
@onready var options_button = $VBoxContainer/OptionsButton
@onready var quit_button = $VBoxContainer/QuitButton

func _ready():
	print("Main menu loaded")

func _on_start_button_pressed():
	print("Start button pressed")
	start_game.emit()

func _on_options_button_pressed():
	print("Options button pressed")
	# TODO: Implement options menu

func _on_quit_button_pressed():
	print("Quit button pressed")
	# In browser, we can't really quit, so hide the window or go back to main menu
	if OS.get_name() == "Web":
		print("Running in browser - cannot quit")
	else:
		get_tree().quit()