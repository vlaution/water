// Basic Vertex Shader
// Basic Vertex Shader
export const heatmapVertexShader = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;

uniform vec2 u_resolution;

out vec2 v_texCoord;

void main() {
    // Convert from pixels to 0.0->1.0
    vec2 zeroToOne = a_position / u_resolution;
    
    // Convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;
    
    // Convert from 0->2 to -1->+1 (clip space)
    vec2 clipSpace = zeroToTwo - 1.0;
    
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_texCoord = a_texCoord;
}
`;

// Fragment Shader with Pseudo-Bloom and Probability Contours
export const heatmapFragmentShader = `#version 300 es
precision mediump float;

uniform sampler2D u_dataTexture;
uniform float u_minValue;
uniform float u_maxValue;
uniform int u_contourLines;

// New Uniforms for Probability Overlay
uniform vec2 u_probCenter; // Normalized (0-1) center of distribution
uniform vec2 u_probStdDev; // Normalized standard deviation (sigma)

in vec2 v_texCoord;
out vec4 outColor;

// Viridis-like corporate colormap (Deep Blue -> Teal -> White/Gold)
vec3 colormap(float t) {
    if (t < 0.0) return vec3(0.02, 0.02, 0.05); // Almost Black
    if (t > 1.0) return vec3(1.0, 1.0, 1.0);    // Pure White
    
    // Deep Indigo -> Electric Blue -> Emerald -> White
    vec3 c0 = vec3(0.05, 0.05, 0.2); // Deep Navy
    vec3 c1 = vec3(0.0, 0.4, 0.6);   // Corporate Blue
    vec3 c2 = vec3(0.0, 0.8, 0.5);   // Emerald Green
    vec3 c3 = vec3(0.9, 0.95, 0.8);  // Soft Gold/White

    if (t < 0.33) return mix(c0, c1, t * 3.0);
    if (t < 0.66) return mix(c1, c2, (t - 0.33) * 3.0);
    return mix(c2, c3, (t - 0.66) * 3.0);
}

void main() {
    float value = texture(u_dataTexture, v_texCoord).r;
    
    // Normalize value
    float normalized = (value - u_minValue) / (u_maxValue - u_minValue);
    
    vec3 color = colormap(normalized);
    
    // Value Contour Lines (Subtle Elevation)
    if (u_contourLines > 0) {
        float lines = float(u_contourLines);
        float lineVal = normalized * lines;
        float dist = abs(fract(lineVal + 0.5) - 0.5);
        if (dist < 0.02) { // Thinner lines
            color = mix(color, vec3(1.0), 0.15); // Very subtle white line
        }
    }
    
    // Probability Overlay (Gaussian Ellipse)
    vec2 distVec = (v_texCoord - u_probCenter) / u_probStdDev;
    float distSq = dot(distVec, distVec);
    
    // Professional Confidence Intervals (White/Silver)
    vec3 probColor = vec3(1.0, 1.0, 1.0); 
    
    // 1 Sigma (68%) - Solid but subtle
    if (abs(distSq - 1.0) < 0.08) {
        color = mix(color, probColor, 0.6); 
    }
    // 2 Sigma (95%) - Fainter
    else if (abs(distSq - 4.0) < 0.08) {
        color = mix(color, probColor, 0.3);
    }
    // 3 Sigma (99%) - Very faint
    else if (abs(distSq - 9.0) < 0.08) {
        color = mix(color, probColor, 0.1);
    }
    
    // Scanline / Grid effect for "Tech" feel (Optional, keeping it clean for now)
    
    // Bloom effect on high values
    if (normalized > 0.95) {
        color += vec3(0.1, 0.1, 0.05); // Subtle warm glow
    }
    
    outColor = vec4(color, 1.0);
}
`;
