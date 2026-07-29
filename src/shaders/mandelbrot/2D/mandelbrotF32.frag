precision highp float;

in vec2 vUv;

layout(location = 0) out vec4 pc_color;
layout(location = 1) out vec4 pc_mask;

uniform vec3 u_const;
uniform vec2 u_scale;
uniform vec2 u_offset;
uniform int u_max_iterations;
uniform int u_prev_iterations;
uniform sampler2D u_prev_color;
uniform sampler2D u_prev_mask;
uniform vec3 u_palette_a;
uniform vec3 u_palette_b;
uniform vec3 u_palette_c;
uniform vec3 u_palette_d;

#define NEVER 0.0
#define LIM_ESC -1.0
#define INF_ESC -2.0
#define PREC_ERR -3.0

vec3 getPaletteColor(float t) {
    return u_palette_a + u_palette_b * cos(u_const.x * fract(u_palette_c * t) + u_palette_d);
}

float getSmoothIter(vec2 v0, float iter) {
    float nu = log(log((v0.x + v0.y)) * u_const.y) * u_const.z;
    return iter + 1.0 - nu;
}

void main() {
    vec4 prev_mask = texture(u_prev_mask, vUv);
    if(u_prev_iterations > 0)
        if(prev_mask.z == INF_ESC || prev_mask.z == PREC_ERR || u_prev_iterations >= 5000) {
            pc_color = texture(u_prev_color, vUv);
            pc_mask = prev_mask;
            return;
        }

    vec2 z = u_prev_iterations <= 0 ? vec2(0.0) : prev_mask.xy;
    vec2 c = (vUv - 0.5) * u_scale + u_offset;

    for(int i = 0; i < u_max_iterations; i++) {
        vec2 v0 = z * z;
        if((v0.x + v0.y) > 4.0) {
            float t = getSmoothIter(v0, float(i)) / 30.0;
            pc_color = vec4(getPaletteColor(t), 1.0);
            pc_mask = vec4(NEVER, NEVER, INF_ESC, float(u_prev_iterations + i));
            return;
        }

        vec2 currentZ = vec2((v0.x - v0.y), 2.0 * z.x * z.y) + c;
        if(distance(z, currentZ) == 0.0) {
            pc_color = vec4(0.0, 0.0, 0.0, 1.0);
            pc_mask = vec4(NEVER, NEVER, PREC_ERR, NEVER);
            return;
        }

        z = currentZ;
    }

    pc_color = vec4(0.0, 0.0, 0.0, 1.0);
    pc_mask = vec4(z, LIM_ESC, NEVER);
}