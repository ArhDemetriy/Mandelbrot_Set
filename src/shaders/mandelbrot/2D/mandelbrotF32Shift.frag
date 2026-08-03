precision highp float;

layout(location = 0) out vec4 pc_result;
layout(location = 1) out vec4 pc_state;

uniform sampler2D u_prev_result;
uniform sampler2D u_prev_state;

/** ...pixelFrameDeltaOffset, width, height */
uniform vec4 u_offset;

#define NEVER 0.0
#define SAFE_ZONE 5

void main() {
    ivec2 pixelCoord = ivec2(gl_FragCoord.xy + u_offset.xy);
    ivec2 textureSize = ivec2(u_offset.zw);

    bool isOutOfTexture = (pixelCoord.x < SAFE_ZONE) || (pixelCoord.y < SAFE_ZONE) || (pixelCoord.x >= textureSize.x - SAFE_ZONE) || (pixelCoord.y >= textureSize.y - SAFE_ZONE);

    if(isOutOfTexture) {
        pc_result = vec4(NEVER);
        pc_state = vec4(NEVER);
    } else {
        pc_result = texelFetch(u_prev_result, pixelCoord, 0);
        pc_state = texelFetch(u_prev_state, pixelCoord, 0);
    }
}