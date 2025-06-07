extends Control

signal menu_requested

@onready var health_label = $TopBar/HBoxContainer/HealthLabel
@onready var score_label = $TopBar/HBoxContainer/ScoreLabel
@onready var menu_button = $TopBar/HBoxContainer/MenuButton

var health: int = 100
var score: int = 0

func _ready():
	print("HUD loaded")
	update_health_display()
	update_score_display()

func update_health_display():
	health_label.text = "Health: " + str(health)

func update_score_display():
	score_label.text = "Score: " + str(score)

func set_health(new_health: int):
	health = new_health
	update_health_display()

func set_score(new_score: int):
	score = new_score
	update_score_display()

func _on_menu_button_pressed():
	print("Menu button pressed from HUD")
	menu_requested.emit()