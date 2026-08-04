precision highp float;

/** iteration, dot, status, _ */
layout(location = 0) out vec4 pc_result;
/** z, iz, dz, diz */
layout(location = 1) out vec4 pc_state;

/** ITERATION_ON_FRAME, MAX_ITERATIONS */
uniform vec2 u_const;
/** 1/(zoom*height) */
uniform vec2 u_view;
/** ...offset */
uniform vec2 u_offset;
/** iteration, dot, status, NEVER */
uniform sampler2D u_prev_result;
/** z, iz, dz, diz */
uniform sampler2D u_prev_state;

#define NEVER 0.0
#define LIM_ESC -1.0
#define INF_ESC -2.0
#define PREC_ERR -3.0

void main() {
    ivec2 pixelCoord = ivec2(gl_FragCoord.xy);
    vec4 prevResult = texelFetch(u_prev_result, pixelCoord, 0);
    vec4 prevState = texelFetch(u_prev_state, pixelCoord, 0);

    int prevIterations = int(prevResult.x);

    float status = prevResult.z;
    if(prevIterations > 0) {
        if(status == PREC_ERR || status == INF_ESC) {
            pc_result = prevResult;
            pc_state = prevState;
            return;
        }
    }

    vec2 z = prevIterations <= 0 ? vec2(0.0) : prevState.xy;
    vec2 dz = prevIterations <= 0 ? vec2(0.0) : prevState.zw;

    vec2 c = gl_FragCoord.xy * u_view.x + u_offset.xy;

    vec2 checkZ = z;
    int power = 1;
    int count = 0;

    int iterationOnFrame = int(u_const.x);
    for(int i = 0; i < iterationOnFrame; i++) {
        vec2 v0 = z * z;
        if((v0.x + v0.y) > 4.0) {
            pc_result = vec4(float(prevIterations + i), (v0.x + v0.y), INF_ESC, NEVER);
            pc_state = vec4(z, dz);
            return;
        }

        z = vec2((v0.x - v0.y), 2.0 * z.x * z.y) + c;
        if(z == checkZ) {
            pc_result = vec4(float(prevIterations + i), (v0.x + v0.y), PREC_ERR, NEVER);
            pc_state = vec4(z, dz);
            return;
        }

        count++;
        if(count == power) {
            checkZ = z;
            power <<= 1;
            count = 0;
        }
    }

    pc_result = vec4(float(prevIterations + iterationOnFrame), dot(z, z), LIM_ESC, NEVER);
    pc_state = vec4(z, dz);
}