precision highp float;

uniform vec2 u_scale;
uniform vec2 u_offset;
uniform int u_max_iterations;
uniform vec3 u_palette_a;
uniform vec3 u_palette_b;
uniform vec3 u_palette_c;
uniform vec3 u_palette_d;

uniform vec3 u_const;

varying vec2 vUv;

// Генератор процедурных палитр (Cosine based palette generator)
// color(t) = a + b * cos(2.0 * PI * (c * t + d))
vec3 getPaletteColor(float t) {
    return u_palette_a + u_palette_b * cos(u_const.x * fract(u_palette_c * t) + u_palette_d);
}

float getSmoothIter(vec2 v0, float iter) {
    // nu = log2(log(|z|))
    float nu = log(log((v0.x + v0.y)) * u_const.y) * u_const.z;
    return iter + 1.0 - nu;
}


void main() {
    // Приводим UV к центру и исправляем пропорции сторон
    // Переводим экранные координаты в комплексную плоскость c = x + i*y
    vec2 c = (vUv - 0.5) * u_scale + u_offset;
    vec2 z = vec2(0.0);

    // Основной цикл генерации фрактала z = z^2 + c
    for (int i = 0; i < 5000; i++) {
        if (i >= u_max_iterations) break;

        vec2 v0 = z * z;
        if ((v0.x + v0.y) > 4.0) {
            // Нормализуем значение для получения цикличного градиента
            float t = getSmoothIter(v0, float(i)) / 30.0; // 30.0 регулирует плотность полос градиента
            gl_FragColor = vec4(getPaletteColor(t), 1.0);
            return;
        }

        z = vec2((v0.x - v0.y), 2.0 * z.x * z.y) + c;
    }

    // Если точка принадлежит множеству Мандельброта (не улетела) — красим в черный
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}