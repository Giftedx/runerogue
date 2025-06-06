shader_type canvas_item;

uniform sampler2D visibility_texture;
uniform vec2 player_position;
uniform float vision_radius = 150.0;
uniform vec4 fog_color : source_color = vec4(0.0, 0.0, 0.0, 0.8);

void fragment() {
    vec2 uv = UV;
    vec4 base_color = texture(TEXTURE, uv);
    
    // Calculate distance from player
    vec2 world_pos = (MODEL_MATRIX * vec4(VERTEX, 0.0, 1.0)).xy;
    float distance = length(world_pos - player_position);
    
    // Calculate visibility
    float visibility = 1.0 - smoothstep(vision_radius * 0.8, vision_radius, distance);
    
    // Sample visibility texture for persistent fog of war
    float explored = texture(visibility_texture, uv).r;
    
    // Combine current visibility with explored areas
    float final_visibility = max(visibility, explored * 0.3);
    
    // Apply fog
    COLOR = mix(fog_color, base_color, final_visibility);
}