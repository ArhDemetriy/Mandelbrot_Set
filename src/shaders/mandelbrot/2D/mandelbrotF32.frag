precision highp float;

/** iteration, dot, status, _ */
layout(location = 0) out vec4 pc_result;
/** z, iz, dz, diz */
layout(location = 1) out vec4 pc_state;

/** ITERATION_ON_FRAME, NEVER */
uniform vec2 u_const;
/** 1/(zoom*height), width, height */
uniform vec3 u_view;
/** ...offset, ...pixelFrameDeltaOffset */
uniform vec4 u_offset;
/** iteration, dot, status, NEVER */
uniform sampler2D u_prev_result;
/** z, iz, dz, diz */
uniform sampler2D u_prev_state;

#define SAFE_ZONE 10
#define EPSILON_DOT 1.4901161e-8

#define NEVER 0.0
#define LIM_ESC -1.0
#define INF_ESC -2.0
#define PREC_ERR -3.0

ivec3 getNeedInitStateAndSafetyPixelCoord() {
    vec2 pixelFrameDeltaOffset = u_offset.zw;
    if(pixelFrameDeltaOffset.x + pixelFrameDeltaOffset.y < 0.5)
        return ivec3(0, gl_FragCoord.xy);

    ivec2 textureSize = ivec2(u_view.yz);
    ivec2 pixelCoord = ivec2(gl_FragCoord.xy + pixelFrameDeltaOffset);
    bool isOutOfTexture = (pixelCoord.x < SAFE_ZONE) || (pixelCoord.y < SAFE_ZONE) || (pixelCoord.x >= textureSize.x - SAFE_ZONE) || (pixelCoord.y >= textureSize.y - SAFE_ZONE);
    return ivec3(int(isOutOfTexture), pixelCoord);
}

void main() {
    // ivec3 needInitStateAndSafetyPixelCoord = getNeedInitStateAndSafetyPixelCoord();
    // vec4 prevResult;
    // vec4 prevState;
    // if(bool(needInitStateAndSafetyPixelCoord.x)) {
    //     prevResult = vec4(NEVER);
    //     prevState = vec4(NEVER);
    // } else {
    //     ivec2 safetyPixelCoord = needInitStateAndSafetyPixelCoord.yz;
    //     prevResult = texelFetch(u_prev_result, safetyPixelCoord, 0);
    //     prevState = texelFetch(u_prev_state, safetyPixelCoord, 0);
    // }

    ivec2 textureSize = ivec2(u_view.yz);
    ivec2 pixelCoord = ivec2(gl_FragCoord.xy + u_offset.zw);
    bool isOutOfTexture = any(bvec4(lessThan(pixelCoord, ivec2(10)), greaterThanEqual(pixelCoord, textureSize - 10)));

    vec4 prevResult = isOutOfTexture ? vec4(NEVER) : texelFetch(u_prev_result, pixelCoord, 0);
    vec4 prevState = isOutOfTexture ? vec4(NEVER) : texelFetch(u_prev_state, pixelCoord, 0);

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

    int iterationOnFrame = int(u_const.x);
    for(int i = 0; i < iterationOnFrame; i++) {
        vec2 v0 = z * z;
        if((v0.x + v0.y) > 4.0) {
            pc_result = vec4(float(prevIterations + i), (v0.x + v0.y), INF_ESC, NEVER);
            pc_state = vec4(z, dz);
            return;
        }

        vec2 currentZ = vec2((v0.x - v0.y), 2.0 * z.x * z.y) + c;
        if(dot(z, currentZ) <= EPSILON_DOT) {
            pc_result = vec4(float(prevIterations + i), (v0.x + v0.y), PREC_ERR, NEVER);
            pc_state = vec4(z, dz);
            return;
        }

        z = currentZ;
    }

    pc_result = vec4(float(prevIterations + iterationOnFrame), dot(z, z), LIM_ESC, NEVER);
    pc_state = vec4(z, dz);
}