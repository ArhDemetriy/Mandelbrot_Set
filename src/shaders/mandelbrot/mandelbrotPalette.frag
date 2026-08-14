precision mediump float;

out vec4 pc_color;

uniform vec3 u_const;

/** iteration, dot, status, _ */
uniform sampler2D u_compute_result;

/** width/2, height/2, 1 / (width * zoom_scale), 1 / (height * zoom_scale) */
uniform vec4 u_resolution;
uniform int u_pass_type;

uniform vec3 u_palette_a;
uniform vec3 u_palette_b;
uniform vec3 u_palette_c;
uniform vec3 u_palette_d;

// status
#define NEVER 0.0
#define INF_ESC -2.0
#define PREC_ERR -3.0
#define LIM_FRAME -4.0
#define LIM_MAX -4.0

// pass type
#define REGULAR -1
#define ZOOM -2
#define AFTER_ZOOM -3

vec3 getPaletteColor(float t) {
    return u_palette_a + u_palette_b * cos(u_const.x * fract(u_palette_c * t) + u_palette_d);
}

float getSmoothIter(float v, float iter) {
    float nu = log(log(v) * u_const.y) * u_const.z;
    return iter + 1.0 - nu;
}

void main() {
    if(u_pass_type == ZOOM) {
        vec2 oldUV = vec2(0.5) + (gl_FragCoord.xy - u_resolution.xy) * u_resolution.zw;

        if(oldUV.x < 0.0 || oldUV.x > 1.0 || oldUV.y < 0.0 || oldUV.y > 1.0) {
            pc_color = vec4(0.0, 0.0, 0.0, 1.0);
        } else {
            vec2 oldData = texture(u_compute_result, oldUV).xy;
            float t = getSmoothIter(oldData.y, oldData.x) / 30.0;
            pc_color = vec4(getPaletteColor(t), 1.0);
        }
        return;
    }

    ivec2 pixelCoord = ivec2(gl_FragCoord.xy);
    vec3 data = texelFetch(u_compute_result, pixelCoord, 0).xyz;

    float status = data.z;

    if(status == INF_ESC) {
        float t = getSmoothIter(data.y, data.x) / 30.0;
        pc_color = vec4(getPaletteColor(t), 1.0);
        return;
    }

    if(status == PREC_ERR || status == LIM_MAX) {
        pc_color = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    if(status == LIM_FRAME || status == NEVER) {
        int passType = u_pass_type;
        if(passType == REGULAR) {
            pc_color = vec4(0.0, 0.0, 0.0, 1.0);
            return;
        } else if(passType == AFTER_ZOOM) {
            // Фолбек сохраняем прежний пиксель
            discard;
        }
    }

    // undefined status
    pc_color = vec4(0.0, 0.0, 0.0, 1.0);
}