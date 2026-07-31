precision mediump float;

in vec2 vUv;
out vec4 pc_color;

uniform vec3 u_const;

/** iteration, distance, status, _ */
uniform sampler2D u_data;

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

float getSmoothIter(float v, float iter) {
    float nu = log(log(v) * u_const.y) * u_const.z;
    return iter + 1.0 - nu;
}

void main() {
    vec3 data = texture(u_data, vUv).xyz;

    float status = data.z;
    if(status == PREC_ERR || status == INF_ESC) {
        pc_color = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    float iter = data.x;
    float dist = data.y;
    float t = getSmoothIter(dot(vUv, vUv), iter) / 30.0;
    pc_color = vec4(getPaletteColor(t), 1.0);
}