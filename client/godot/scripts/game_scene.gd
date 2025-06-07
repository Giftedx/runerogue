extends Node2D

@onready var player_spawn = $PlayerSpawn

func _ready():
	print("Game scene loaded")
	print("Player spawn position: ", player_spawn.position)

func _input(event):
	if event.is_action_pressed("ui_cancel"):
		# ESC pressed - could go back to menu or show pause menu
		print("ESC pressed in game scene")