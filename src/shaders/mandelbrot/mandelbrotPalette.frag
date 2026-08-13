precision mediump float;

out vec4 pc_color;

uniform vec3 u_const;

/** iteration, dot, status, _ */
uniform sampler2D u_compute_result;
uniform sampler2D u_prev_color;

// --- Юниформы фолбека (Зум относительно центра) ---
uniform float u_zoom_scale;        // Коэффициент масштаба (>1.0 — приближение, <1.0 — отдаление)
uniform vec2 u_resolution;        // Разрешение экрана (ширина, высота)

uniform vec3 u_palette_a;
uniform vec3 u_palette_b;
uniform vec3 u_palette_c;
uniform vec3 u_palette_d;

#define NEVER 0.0
#define INF_ESC -2.0
#define PREC_ERR -3.0
#define LIM_FRAME -4.0
#define LIM_MAX -4.0

vec3 getPaletteColor(float t) {
    return u_palette_a + u_palette_b * cos(u_const.x * fract(u_palette_c * t) + u_palette_d);
}

float getSmoothIter(float v, float iter) {
    float nu = log(log(v) * u_const.y) * u_const.z;
    return iter + 1.0 - nu;
}

void main() {
    ivec2 pixelCoord = ivec2(gl_FragCoord.xy);
    vec3 data = texelFetch(u_compute_result, pixelCoord, 0).xyz;

    float status = data.z;

    if(status == NEVER || status == PREC_ERR || status == LIM_MAX) {
        pc_color = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    if(status == LIM_FRAME) {
        // Фолбек
        // TODO Выводим итем из кадра-подложки
        pc_color = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    // // Фолбек: если точка еще не вычислена (LIM_FRAME)
    // if(status == LIM_FRAME) {
    //     // Нормализованные UV текущего пикселя (от 0.0 до 1.0)
    //     vec2 uv = gl_FragCoord.xy / u_resolution;

    //     // Вычисляем UV предыдущего кадра относительно центра (0.5, 0.5)
    //     vec2 oldUV = vec2(0.5) + (uv - vec2(0.5)) / u_zoom_scale;

    //     // Защита от вылета за границы текстуры (краим черным)
    //     if(oldUV.x < 0.0 || oldUV.x > 1.0 || oldUV.y < 0.0 || oldUV.y > 1.0) {
    //         pc_color = vec4(0.0, 0.0, 0.0, 1.0);
    //     } else {
    //         // Билинейная сэмпляция из прошлой цветной текстуры
    //         pc_color = texture(u_prev_color, oldUV);
    //     }
    //     return;
    // }

    float t = getSmoothIter(data.y, data.x) / 30.0;
    pc_color = vec4(getPaletteColor(t), 1.0);
}