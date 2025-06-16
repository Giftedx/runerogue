extends Node2D

signal tile_clicked(position: Vector2i)

@onready var tilemap: TileMap = $TileMap
@onready var entities_container: Node2D = $Entities
@onready var effects_container: Node2D = $Effects

# Tile types
enum TileType {
	FLOOR,
	WALL,
	DOOR,
	WATER,
	GRASS,
	STONE
}

# World generation parameters
var world_size: Vector2i = Vector2i(100, 100)
var world_data: Array = []
var spawn_position: Vector2 = Vector2(512, 384)

# Rendering parameters
var visible_radius: int = 15
var fog_of_war: Dictionary = {}

# Tile rendering data
var tile_colors: Dictionary = {
	TileType.FLOOR: Color(0.4, 0.3, 0.2),
	TileType.WALL: Color(0.2, 0.2, 0.2),
	TileType.DOOR: Color(0.5, 0.3, 0.1),
	TileType.WATER: Color(0.2, 0.4, 0.8),
	TileType.GRASS: Color(0.2, 0.6, 0.2),
	TileType.STONE: Color(0.5, 0.5, 0.5)
}

func _ready() -> void:
	# Initialize tilemap
	_setup_tilemap()
	
	# Set up input handling
	set_process_unhandled_input(true)

func _setup_tilemap() -> void:
	# Configure tilemap for rendering
	tilemap.tile_set.tile_size = Vector2i(32, 32)
	
	# Create tile sources programmatically
	var atlas_source = TileSetAtlasSource.new()
	tilemap.tile_set.add_source(atlas_source)

func generate_world() -> void:
	# Clear existing world
	tilemap.clear()
	world_data.clear()
	fog_of_war.clear()
	
	# Initialize world array
	world_data.resize(world_size.x)
	for x in range(world_size.x):
		world_data[x] = []
		world_data[x].resize(world_size.y)
	
	# Generate base terrain
	_generate_terrain()
	
	# Add structures
	_generate_structures()
	
	# Render initial visible area
	_render_world()

func _generate_terrain() -> void:
	# Simple terrain generation
	var noise = FastNoiseLite.new()
	noise.seed = randi()
	noise.frequency = 0.05
	
	for x in range(world_size.x):
		for y in range(world_size.y):
			var noise_value = noise.get_noise_2d(x, y)
			
			# Determine tile type based on noise
			if noise_value < -0.3:
				world_data[x][y] = TileType.WATER
			elif noise_value < 0.0:
				world_data[x][y] = TileType.STONE
			elif noise_value < 0.3:
				world_data[x][y] = TileType.GRASS
			else:
				world_data[x][y] = TileType.FLOOR

func _generate_structures() -> void:
	# Generate some random rooms
	var num_rooms = 10
	for i in range(num_rooms):
		var room_pos = Vector2i(
			randi() % (world_size.x - 10) + 5,
			randi() % (world_size.y - 10) + 5
		)
		var room_size = Vector2i(
			randi() % 5 + 5,
			randi() % 5 + 5
		)
		
		_create_room(room_pos, room_size)
	
	# Set spawn in first room
	spawn_position = Vector2(160, 160)  # Center of a 10x10 room at (5,5)

func _create_room(pos: Vector2i, size: Vector2i) -> void:
	# Create walls
	for x in range(size.x):
		for y in range(size.y):
			var world_x = pos.x + x
			var world_y = pos.y + y
			
			if world_x >= world_size.x or world_y >= world_size.y:
				continue
			
			if x == 0 or x == size.x - 1 or y == 0 or y == size.y - 1:
				world_data[world_x][world_y] = TileType.WALL
			else:
				world_data[world_x][world_y] = TileType.FLOOR
	
	# Add door
	var door_side = randi() % 4
	match door_side:
		0: # Top
			world_data[pos.x + size.x / 2][pos.y] = TileType.DOOR
		1: # Right
			world_data[pos.x + size.x - 1][pos.y + size.y / 2] = TileType.DOOR
		2: # Bottom
			world_data[pos.x + size.x / 2][pos.y + size.y - 1] = TileType.DOOR
		3: # Left
			world_data[pos.x][pos.y + size.y / 2] = TileType.DOOR

func _render_world() -> void:
	# Clear and redraw visible tiles
	tilemap.clear()
	
	for x in range(world_size.x):
		for y in range(world_size.y):
			if _is_tile_visible(Vector2i(x, y)):
				_draw_tile(Vector2i(x, y), world_data[x][y])

func _draw_tile(pos: Vector2i, tile_type: TileType) -> void:
	# Create a colored rect for the tile
	var tile_color = tile_colors.get(tile_type, Color.WHITE)
	
	# For now, we'll use a simple colored tile approach
	# In a real implementation, you'd use actual tile textures
	# tilemap.set_cell(0, pos, 0, Vector2i(tile_type, 0))
	
	# Draw debug visualization
	queue_redraw()

func _draw() -> void:
	# Custom drawing for tiles (temporary until proper tiles are set up)
	for x in range(world_size.x):
		for y in range(world_size.y):
			if _is_tile_visible(Vector2i(x, y)):
				var tile_type = world_data[x][y]
				var tile_color = tile_colors.get(tile_type, Color.WHITE)
				var tile_pos = Vector2(x * 32, y * 32)
				
				# Draw tile
				draw_rect(Rect2(tile_pos, Vector2(32, 32)), tile_color)
				
				# Draw grid lines for clarity
				draw_rect(Rect2(tile_pos, Vector2(32, 32)), Color(0, 0, 0, 0.2), false, 1.0)

func update_visibility(player_pos: Vector2) -> void:
	# Update fog of war based on player position
	var tile_pos = world_to_tile(player_pos)
	
	# Mark tiles as discovered
	for x in range(-visible_radius, visible_radius + 1):
		for y in range(-visible_radius, visible_radius + 1):
			var check_pos = tile_pos + Vector2i(x, y)
			if _is_valid_tile(check_pos):
				var distance = Vector2(x, y).length()
				if distance <= visible_radius:
					fog_of_war[check_pos] = true
	
	# Redraw to show newly visible areas
	queue_redraw()

func _is_tile_visible(pos: Vector2i) -> bool:
	return fog_of_war.has(pos) and fog_of_war[pos]

func _is_valid_tile(pos: Vector2i) -> bool:
	return pos.x >= 0 and pos.x < world_size.x and pos.y >= 0 and pos.y < world_size.y

func world_to_tile(world_pos: Vector2) -> Vector2i:
	return Vector2i(int(world_pos.x / 32), int(world_pos.y / 32))

func tile_to_world(tile_pos: Vector2i) -> Vector2:
	return Vector2(tile_pos.x * 32 + 16, tile_pos.y * 32 + 16)

func get_spawn_position() -> Vector2:
	return spawn_position

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			var mouse_pos = get_global_mouse_position()
			var tile_pos = world_to_tile(mouse_pos)
			if _is_valid_tile(tile_pos):
				tile_clicked.emit(tile_pos)

# Particle effects for rendering
func create_particle_effect(pos: Vector2, type: String) -> void:
	var particles = CPUParticles2D.new()
	effects_container.add_child(particles)
	particles.position = pos
	particles.emitting = true
	particles.amount = 20
	particles.lifetime = 0.5
	particles.one_shot = true
	
	match type:
		"damage":
			particles.initial_velocity_min = 50.0
			particles.initial_velocity_max = 100.0
			particles.color = Color.RED
		"magic":
			particles.initial_velocity_min = 30.0
			particles.initial_velocity_max = 60.0
			particles.color = Color.CYAN
	
	# Clean up after emission
	particles.finished.connect(func(): particles.queue_free())