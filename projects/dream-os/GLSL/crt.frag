precision highp float;
varying vec2 vTexCoord;
uniform sampler2D tex0;
uniform vec2 u_resolution;
uniform float u_time;

// Custom Variables
uniform float u_curvature;
uniform bool u_fit;
uniform float u_scanline_density;
uniform float u_scanline_opacity;
uniform float u_chromatic_aberration;
uniform float u_vignette_amount;

// Curvature
vec2 curveRemap(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    
    // Apply curvature based on variable
    vec2 offset = abs(uv.yx) / vec2(u_curvature, u_curvature);
    uv = uv + uv * offset * offset;
    
    // Scale the UVs to fit the corners to the canvas
    if (u_fit) {
        float scale = 1.0 + (1.0 / (u_curvature * u_curvature));
        uv /= scale; 
    }
    
    uv = uv * 0.5 + 0.5;
    return uv;
}

void main() {
    // 1. FLIP THE Y-AXIS
    vec2 flippedCoord = vec2(vTexCoord.x, 1.0 - vTexCoord.y);

    // 2. Curvature 
    vec2 uv = curveRemap(flippedCoord);

    // Out of bounds cutoff
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    // Chromatic aberration (RGB shift using uniform)
    float rShift = u_chromatic_aberration;
    float bShift = -u_chromatic_aberration;
    float colR = texture2D(tex0, vec2(uv.x + rShift, uv.y)).r;
    float colG = texture2D(tex0, uv).g;
    float colB = texture2D(tex0, vec2(uv.x + bShift, uv.y)).b;

    // Scanlines
    float scanline = sin(uv.y * u_resolution.y * u_scanline_density) * u_scanline_opacity;
    vec3 color = vec3(colR, colG, colB) - scanline;

    // Vignette (Using uniform to scale darkness)
    vec2 dv = uv - 0.5;
    float vignette = 1.0 - (dot(dv, dv) * u_vignette_amount);
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
}