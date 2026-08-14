precision highp float;

out vec4 pc_color;

/** iteration, dot, status, _ */
uniform sampler2D u_compute_result;

/** height/2, width/2, 1 / (height * zoom_scale), 1 / (width * zoom_scale) */
uniform vec4 u_resolution;

void main() {
    vec2 oldUV = vec2(0.5) + (gl_FragCoord.xy - u_resolution.xy) * u_resolution.zw;

    if(oldUV.x < 0.0 || oldUV.x > 1.0 || oldUV.y < 0.0 || oldUV.y > 1.0) {
        pc_color = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        pc_color = texture(u_compute_result, oldUV);
    }

}