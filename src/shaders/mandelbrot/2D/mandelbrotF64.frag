precision highp float;

/** iteration, dot, status, _ */
layout(location = 0) out vec4 pc_result;
/** z_hi, iz_hi, dz_hi, diz_hi */
layout(location = 1) out vec4 pc_state1;
/** z_lo, iz_lo, dz_lo, diz_lo */
layout(location = 2) out vec4 pc_state2;

/** ITERATION_ON_FRAME, MAX_ITERATIONS */
uniform vec2 u_const;
/** 1/(zoom*height) hi, 1/(zoom*height) lo, width/2, height/2  */
uniform vec4 u_view;
/** offset_hi, offset_lo */
uniform vec4 u_offset;
/** iteration, dot, status, NEVER */
uniform sampler2D u_prev_result;
/** z_hi, iz_hi, dz_hi, diz_hi */
uniform sampler2D u_prev_state1;
/** z_lo, iz_lo, dz_lo, diz_lo */
uniform sampler2D u_prev_state2;

#define NEVER 0.0
#define INF_ESC -2.0
#define PREC_ERR -3.0
#define LIM_FRAME -4.0
#define LIM_MAX -5.0

// Полноценный Knuth TwoSum (работает для любых magnitudes a и b)
vec2 ds_add(vec2 a, vec2 b) {
    float hi = a.x + b.x;
    float v = hi - a.x;
    float lo = (a.x - (hi - v)) + (b.x - v) + a.y + b.y;
    float hi_final = hi + lo;
    float lo_final = lo - (hi_final - hi);
    return vec2(hi_final, lo_final);
}

vec2 ds_sub(vec2 a, vec2 b) {
    return ds_add(a, vec2(-b.x, -b.y));
}

// Функция расщепления float на 12-битные старшую и младшую части
vec2 split(float a) {
    float c = 4097.0 * a; // (1 << 12) + 1
    float a_hi = c - (c - a);
    float a_lo = a - a_hi;
    return vec2(a_hi, a_lo);
}

// Умножение DS чисел
vec2 ds_mul(vec2 a, vec2 b) {
    vec2 a_sp = split(a.x);
    vec2 b_sp = split(b.x);

    float c11 = a.x * b.x;
    float c21 = ((a_sp.x * b_sp.x - c11) + a_sp.x * b_sp.y + a_sp.y * b_sp.x) + a_sp.y * b_sp.y;
    float c2 = a.x * b.y + a.y * b.x;

    float t1 = c11 + c2;
    float e = t1 - c11;
    float t2 = c21 + ((c2 - e) + (c11 - (t1 - e))) + a.y * b.y;

    float hi = t1 + t2;
    float lo = t2 - (hi - t1);
    return vec2(hi, lo);
}

void main() {
    ivec2 pixelCoord = ivec2(gl_FragCoord.xy);
    vec4 prevResult = texelFetch(u_prev_result, pixelCoord, 0);

    // Считывание HI и LO байтов из соответствующих текстур
    vec4 prevState1 = texelFetch(u_prev_state1, pixelCoord, 0); // z_hi, iz_hi, dz_hi, diz_hi
    vec4 prevState2 = texelFetch(u_prev_state2, pixelCoord, 0); // z_lo, iz_lo, dz_lo, diz_lo

    int prevIterations = int(prevResult.x);
    float status = prevResult.z;

    if(prevIterations > 0) {
        if(status == PREC_ERR || status == INF_ESC) {
            pc_result = prevResult;
            pc_state1 = prevState1;
            pc_state2 = prevState2;
            return;
        }
    }

    // Собираем DS переменные: vec2(hi, lo)
    vec2 z_x = prevIterations <= 0 ? vec2(0.0) : vec2(prevState1.x, prevState2.x);
    vec2 z_y = prevIterations <= 0 ? vec2(0.0) : vec2(prevState1.y, prevState2.y);
    vec2 dz_x = prevIterations <= 0 ? vec2(0.0) : vec2(prevState1.z, prevState2.z);
    vec2 dz_y = prevIterations <= 0 ? vec2(0.0) : vec2(prevState1.w, prevState2.w);

    // Экранные координаты и u_offset в DS формат
    vec2 coord = gl_FragCoord.xy - u_view.zw;
    vec2 screenCoord_x = ds_mul(vec2(coord.x, 0.0), u_view.xy);
    vec2 screenCoord_y = ds_mul(vec2(coord.y, 0.0), u_view.xy);
    vec2 c_x = ds_add(screenCoord_x, vec2(u_offset.x, u_offset.z));
    vec2 c_y = ds_add(screenCoord_y, vec2(u_offset.y, u_offset.w));

    vec2 checkZ_x = z_x;
    vec2 checkZ_y = z_y;
    int power = 1;
    int count = 0;

    int iterationOnFrame = int(u_const.x);
    for(int i = 0; i < iterationOnFrame; i++) {
        vec2 z2x = ds_mul(z_x, z_x);
        vec2 z2y = ds_mul(z_y, z_y);

        if(z2x.x + z2y.x > 4.0) {
            float dotZ_hi = ds_add(z2x, z2y).x;
            pc_result = vec4(float(prevIterations + i), dotZ_hi, INF_ESC, NEVER);
            pc_state1 = vec4(z_x.x, z_y.x, dz_x.x, dz_y.x); // hi
            pc_state2 = vec4(z_x.y, z_y.y, dz_x.y, dz_y.y); // lo
            return;
        }

        // ВАЖНО: Сначала высчитываем zxy со старым z_x
        vec2 zxy = ds_mul(z_x, z_y);
        vec2 zxy2 = ds_add(zxy, zxy);

        // Затем обновляем Z
        z_x = ds_add(ds_sub(z2x, z2y), c_x);
        z_y = ds_add(zxy2, c_y);

        if(z_x == checkZ_x && z_y == checkZ_y) {
            float dotZ_hi = ds_add(z2x, z2y).x;
            pc_result = vec4(float(prevIterations + i), dotZ_hi, PREC_ERR, NEVER);
            pc_state1 = vec4(z_x.x, z_y.x, dz_x.x, dz_y.x); // hi
            pc_state2 = vec4(z_x.y, z_y.y, dz_x.y, dz_y.y); // lo
            return;
        }

        count++;
        if(count >= power) {
            checkZ_x = z_x;
            checkZ_y = z_y;
            power <<= 1;
            count = 0;
        }
    }

    float currentIteration = float(prevIterations + iterationOnFrame);
    bool outOfMaxIterations = currentIteration >= u_const.y;
    float dotZ_hi = ds_add(ds_mul(z_x, z_x), ds_mul(z_y, z_y)).x;

    pc_result = vec4(currentIteration, dotZ_hi, outOfMaxIterations ? LIM_MAX : LIM_FRAME, NEVER);
    pc_state1 = vec4(z_x.x, z_y.x, dz_x.x, dz_y.x); // hi
    pc_state2 = vec4(z_x.y, z_y.y, dz_x.y, dz_y.y); // lo
}