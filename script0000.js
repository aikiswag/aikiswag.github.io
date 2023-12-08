const canvas = document.createElement("canvas")
const gl = canvas.getContext("webgl2")

document.title = "aikidesign0000"
document.body.innerHTML = ""
document.body.appendChild(canvas)
document.body.style = "margin:0;touch-action:none;overflow:hidden;"
canvas.style.width = "100%"
canvas.style.height = "auto"
canvas.style.userSelect = "none"

const dpr = Math.max(1, .5*window.devicePixelRatio)

function resize() {
    const {
      innerWidth: width,
      innerHeight: height
    } = window
    
    canvas.width = width * dpr
    canvas.height = height * dpr
    
    gl.viewport(0, 0, width * dpr, height * dpr)
}
window.onresize = resize

const vertexSource = `#version 300 es
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    
    in vec4 position;
    
    void main(void) {
        gl_Position = position;
    }
`

const fragmentSource = `#version 300 es
    /*********
    * made by Matthias Hurrle (@atzedent) 
    */
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    
    out vec4 fragColor;
    
    uniform vec2 resolution;
    uniform float time;
    uniform int pointerCount;
    uniform vec2 touch;
    
    #define P pointerCount
    #define mouse (touch/resolution)
    
    #define S smoothstep
    #define LIGHTS vec3(0,0,1)
    
    #define T mod(55.+time, 5000.)
    #define TICK step(.5, curve(12. + T * 5e-1, 4.))
    #define TIME (T * mix(1. , -1.5, TICK))
    
    mat2 rot(float a) {
      float s = sin(a),
      c = cos(a);
    
      return mat2(c, -s, s, c);
    }
    
    float rnd(float a) {
      return fract(sin(a * 12.599) * 78.233);
    }
    
    float curve(float t, float e) {
      t /= e;
    
      return mix(
        rnd(floor(t)),
        rnd(floor(t) + 1.),
        pow(S(.0, 1., fract(t)), 10.)
      );
    }
    
    float map(vec3 p) {
      float d = 5e5, tt = TIME,
      t = 10.*floor(1.+10.*pow(S(.0,1.,fract(tt*.005)),.5)),
      f = 1.;
    
      for (float i = .0; i < 10.; i++) {
        p.xz *= rot(t/f);
        p = abs(p)-.8625*f;
        d = min(d, max(p.x, max(p.y, p.z)));
        f *= .58258;
      }
    
      return -d;
    }
    
    float shadow(vec3 p, vec3 rd, float maxd, int steps, float limit) {
      float shad=1., dd=.0;
    
      for(int i=0; i<steps; i++) {
        float d=map(p);
    
        if(d < limit) {
          shad = .0;
          break;
        }
    
        if(dd > maxd) {
        	d = maxd;
          break;
        }
    
        p += rd*d;
        dd+= d;
      }
    
      return shad;
    }
    
    float vol(vec3 p, vec3 rd, vec3 ro, float maxd) {
      const float s = .2;
      float distort = fract(sin(dot(p.xy, p.yx+vec2(234, 543)))*345678.),
      d = s * distort,
      at = .0;
    
      vec3 vr = rd*s,
      vp = ro + vr * distort;
    
      for (float i = .0; i < 10.; i++) {
        if (d > maxd) break;
    
        float ldst = max(length(vp-LIGHTS), 1e-3),
        attn = 1./(1.+ldst*.1+ldst*ldst*.05),
    		shd = shadow(vp, LIGHTS, d, 2, 1e-3)*attn;
        
        at += .1*(.2/ldst)*shd;
        vp += vr;
        d += s;
      }
    
      return pow(at*4.2, 4.);
    }
    
    void cam(inout vec3 p) {
      if (P > 0) {
        p.yz *= rot(-mouse.y*3.1415+1.5707);
        p.xz *= rot(3.1415-mouse.x*6.2832);
      } else {
        float t = TIME, s = sin(t * .05)*.75;
        p.yz *= rot(sin(t * .025) * .2);
        p.xy *= rot(s * .25);
        p.xz *= rot(s * 2.);
        p.y  += s * .25;
      }
    }
    
    void main(void) {
      vec2 uv = (
        gl_FragCoord.xy -.5 * resolution.xy
      ) / min(resolution.x, resolution.y);
    
      vec3 col = vec3(0),
      ro = vec3(0, 0, 0),
      rd = normalize(vec3(uv, 1));
    
      cam(ro);
      cam(rd);
    
      vec3 p = ro;
    
      const float steps = 30., maxd = 6.;
      float dd = .0;
    
      for (float i = .0; i < steps; i++) {
        float d = map(p);
    
        if (d < 1e-3) {
          break;
        }
    
        if (dd > maxd) {
          dd = maxd;
          break;
        }
    
        p += rd * d;
        dd += d;
      }
    
      col += vol(p, rd, ro, dd);
    
      col = pow(col, vec3(.4545));
      col = S(.0, 1., col);
      col *= exp(-125e-5*dd*dd*dd);
    
      fragColor = vec4(col, 1);
    }
`

function compile(shader, source) {
    gl.shaderSource(shader, source)
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader))
    }
}

let program

function setup() {
    const vs = gl.createShader(gl.VERTEX_SHADER)
    const fs = gl.createShader(gl.FRAGMENT_SHADER)
    
    compile(vs, vertexSource)
    compile(fs, fragmentSource)
    
    program = gl.createProgram()
    
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program))
    }
}

let vertices, buffer

function init() {
    vertices = [
            -1., -1., 1.,
            -1., -1., 1.,
            -1., 1., 1.,
            -1., 1., 1.,
    ]

    buffer = gl.createBuffer()
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
    
    const position = gl.getAttribLocation(program, "position")
    
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    
    program.resolution = gl.getUniformLocation(program, "resolution")
    program.time = gl.getUniformLocation(program, "time")
    program.touch = gl.getUniformLocation(program, "touch")
    program.pointerCount = gl.getUniformLocation(program, "pointerCount")
}

const mouse = {
    x: 0,
    y: 0,
    touches: new Set(),
    update: function(x, y, pointerId) {
      this.x = x * dpr;
      this.y = (innerHeight - y) * dpr;
      this.touches.add(pointerId)
    },
    remove: function(pointerId) { this.touches.delete(pointerId) }
}

function loop(now) {
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.uniform2f(program.resolution, canvas.width, canvas.height)
    gl.uniform1f(program.time, now * 1e-3)
    gl.uniform2f(program.touch, mouse.x, mouse.y)
    gl.uniform1i(program.pointerCount, mouse.touches.size)
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length * .5)
    requestAnimationFrame(loop)
}

setup()
init()
resize()
loop(0)

window.addEventListener("pointerdown", e => mouse.update(e.clientX, e.clientY, e.pointerId))
window.addEventListener("pointerup", e => mouse.remove(e.pointerId))
window.addEventListener("pointermove", e => {
if (mouse.touches.has(e.pointerId))
    mouse.update(e.clientX, e.clientY, e.pointerId)
})