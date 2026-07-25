precision highp float;

uniform vec2 u_scale;
uniform vec2 u_offset;
uniform int u_max_iterations;
uniform int u_palette;

varying vec2 vUv;

// Генератор процедурных палитр (Cosine based palette generator)
// color(t) = a + b * cos(2.0 * PI * (c * t + d))
vec3 getPaletteColor(float t, int palette) {
    // const float PI = 3.14159265359;
    const float PI = acos(-1.0);

    vec3 a, b, c, d;

    if (palette == 0) { // Classic
        a = vec3(0.5, 0.5, 0.5);
        b = vec3(0.5, 0.5, 0.5);
        c = vec3(1.0, 1.0, 1.0);
        d = vec3(0.0, 0.33, 0.67);
    } else if (palette == 1) { // Fire
        a = vec3(0.5, 0.5, 0.5);
        b = vec3(0.5, 0.5, 0.5);
        c = vec3(2.0, 1.0, 0.0);
        d = vec3(0.5, 0.20, 0.25);
    } else if (palette == 2) { // Electric (По умолчанию)
        a = vec3(0.8, 0.5, 0.4);
        b = vec3(0.2, 0.4, 0.2);
        c = vec3(2.0, 1.0, 1.0);
        d = vec3(0.0, 0.25, 0.25);
    } else if (palette == 3) { // Psychedelic
        a = vec3(0.5, 0.5, 0.5);
        b = vec3(0.5, 0.5, 0.5);
        c = vec3(2.0, 2.0, 1.0);
        d = vec3(0.0, 0.1, 0.2);
    } else { // Monochrome
        a = vec3(0.5);
        b = vec3(0.5);
        c = vec3(1.0);
        d = vec3(0.0);
    }

    return a + b * cos(2.0 * PI * (c * t + d));
}

void main() {
    // Приводим UV к центру и исправляем пропорции сторон
    // Переводим экранные координаты в комплексную плоскость c = x + i*y
    vec2 c = (vUv - 0.5) * u_scale + u_offset;

    vec2 z = vec2(0.0);

    int iter = 0;
    bool escaped = false;

    // Основной цикл генерации фрактала z = z^2 + c
    for (int i = 0; i < 5000; i++) {
        if (i >= u_max_iterations) break;

        vec2 v0 = z * z;
        if (dot(v0, vec2(1.0)) > 4.0) {
            escaped = true;
            iter = i;
            break;
        }
        z = vec2(dot(v0, vec2(1.0,-1.0)), 2.0 * z.x * z.y) + c;
    }

    // Если точка принадлежит множеству Мандельброта (не улетела) — красим в черный
    if (!escaped) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    // Smooth Coloring (Убираем эффекты ступенчатости)
    // nu = log2(log(|z|))
    float log_zn = log(dot(z, z)) / 2.0;
    float nu = log(log_zn / log(2.0)) / log(2.0);
    float smoothIter = float(iter) + 1.0 - nu;

    // Нормализуем значение для получения цикличного градиента
    float t = smoothIter / 30.0; // 30.0 регулирует плотность полос градиента

    vec3 color = getPaletteColor(t, u_palette);
    gl_FragColor = vec4(color, 1.0);
}