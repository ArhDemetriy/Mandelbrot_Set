precision highp float;

in vec2 vUv;

layout(location = 0) out vec4 pc_Color;
layout(location = 1) out vec4 pc_Mask;

uniform vec3 u_const;
uniform vec2 u_scale;
uniform vec2 u_offset;
uniform int u_max_iterations;
uniform vec3 u_palette_a;
uniform vec3 u_palette_b;
uniform vec3 u_palette_c;
uniform vec3 u_palette_d;

#define NEVER 0.0
#define INF_ESC -1.0
#define PREC_ERR -2.0

vec3 getPaletteColor(float t) {
    return u_palette_a + u_palette_b * cos(u_const.x * fract(u_palette_c * t) + u_palette_d);
}

float getSmoothIter(vec2 v0, float iter) {
    float nu = log(log((v0.x + v0.y)) * u_const.y) * u_const.z;
    return iter + 1.0 - nu;
}

void main() {
    vec2 c = (vUv - 0.5) * u_scale + u_offset;
    vec2 z = vec2(0.0);

    for(int i = 0; i < u_max_iterations; i++) {
        vec2 v0 = z * z;
        if((v0.x + v0.y) > 4.0) {
            float t = getSmoothIter(v0, float(i)) / 30.0;
            pc_Color = vec4(getPaletteColor(t), 1.0);
            pc_Mask = vec4(INF_ESC, float(i), NEVER, NEVER);
            return;
        }

        vec2 currentZ = vec2((v0.x - v0.y), 2.0 * z.x * z.y) + c;
        if(distance(z, currentZ) == 0.0) {
            pc_Color = vec4(0.0, 0.0, 0.0, 1.0);
            pc_Mask = vec4(PREC_ERR, NEVER, NEVER, NEVER);
            return;
        }

        z = currentZ;
    }

    pc_Color = vec4(0.0, 0.0, 0.0, 1.0);
    pc_Mask = vec4(z, 1.0, 1.0);
}