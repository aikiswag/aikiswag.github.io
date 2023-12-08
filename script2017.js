const debounce = (callback, duration) => {
  var timer;
  return function (event) {
    clearTimeout(timer);
    timer = setTimeout(function () {
      callback(event);
    }, duration);
  };
};

const MathEx = {
  degrees: function (radian) {
    return radian / Math.PI * 180;
  },
  radians: function (degree) {
    return degree * Math.PI / 180;
  },
  clamp: function (value, min, max) {
    return Math.min(Math.max(value, min), max);
  },
  mix: function (x1, x2, a) {
    return x1 * (1 - a) + x2 * a;
  },
  polar: function (radian1, radian2, radius) {
    return [
    Math.cos(radian1) * Math.cos(radian2) * radius,
    Math.sin(radian1) * radius,
    Math.cos(radian1) * Math.sin(radian2) * radius];

  } };


const force3 = {
  updateVelocity: (velocity, acceleration, mass) => {
    vec3.scale(acceleration, acceleration, 1 / mass);
    vec3.add(velocity, velocity, acceleration);
  },
  applyFriction: (acceleration, mu, n) => {
    const friction = [0, 0, 0];
    vec3.scale(friction, acceleration, -1);
    const normal = n ? n : 1;
    vec3.normalize(friction, friction);
    vec3.scale(friction, friction, mu);
    vec3.add(acceleration, acceleration, friction);
  },
  applyDrag: (acceleration, value) => {
    const drag = [0, 0, 0];
    vec3.scale(drag, acceleration, -1);
    vec3.normalize(drag, drag);
    vec3.scale(drag, drag, vec3.length(acceleration) * value);
    vec3.add(acceleration, acceleration, drag);
  },
  applyHook: (velocity, acceleration, anchor, rest_length, k) => {
    const hook = [0, 0, 0];
    vec3.sub(hook, velocity, anchor);
    const distance = vec3.length(hook) - rest_length;
    vec3.normalize(hook, hook);
    vec3.scale(hook, hook, -1 * k * distance);
    vec3.add(acceleration, acceleration, hook);
  } };


const normalizeVector2 = vector => {
  vector.x = vector.x / window.innerWidth * 2 - 1;
  vector.y = -(vector.y / window.innerHeight) * 2 + 1;
};

class ForcePerspectiveCamera extends THREE.PerspectiveCamera {
  constructor(fov, aspect, near, far) {
    super(fov, aspect, near, far);
    this.k = 0.02;
    this.d = 0.2;
    this.velocity = [0, 0, 0];
    this.acceleration = [0, 0, 0];
    this.anchor = [0, 0, 0];
    this.lookK = 0.02;
    this.lookD = 0.2;
    this.lookVelocity = [0, 0, 0];
    this.lookAcceleration = [0, 0, 0];
    this.lookAnchor = [0, 0, 0];
  }
  updatePosition() {
    force3.applyHook(this.velocity, this.acceleration, this.anchor, 0, this.k);
    force3.applyDrag(this.acceleration, this.d);
    force3.updateVelocity(this.velocity, this.acceleration, 1);
  }
  updateLook() {
    force3.applyHook(this.lookVelocity, this.lookAcceleration, this.lookAnchor, 0, this.lookK);
    force3.applyDrag(this.lookAcceleration, this.lookD);
    force3.updateVelocity(this.lookVelocity, this.lookAcceleration, 1);
  }
  render() {
    this.updatePosition();
    this.updateLook();
    this.position.set(
    this.velocity[0],
    this.velocity[1],
    this.velocity[2]);

    this.lookAt({
      x: this.lookVelocity[0],
      y: this.lookVelocity[1],
      z: this.lookVelocity[2] });

  }}


class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.radian1 = 0;
    this.radian1Base = 0;
    this.radian2 = 0;
    this.radian2Base = 0;
    this.radius = 2500;
    this.isZoom = false;
  }
  rotate(x, y) {
    if (this.isZoom === true) this.isZoom = false;
    this.radian1 = MathEx.clamp(this.radian1Base + y, MathEx.radians(-75), MathEx.radians(75));
    this.radian2 = this.radian2Base - x * 2;
  }
  zoom(delta) {
    if (!delta) return;
    if (this.isZoom === false) this.isZoom = true;
    const prevRadius = this.radius;
    this.radius -= delta / Math.abs(delta) * 200;
    this.radius = MathEx.clamp(this.radius, 700, 8000);
    const diff = prevRadius - this.radius;
  }
  touchEnd() {
    this.radian1Base = this.radian1;
    this.radian2Base = this.radian2;
  }
  render() {
    this.camera.anchor = MathEx.polar(this.radian1, this.radian2, this.radius);
    this.camera.render();
  }
  computeZoomLength() {
    if (this.isZoom) {
      return vec3.length(this.camera.acceleration) * 0.05;
    } else {
      return 0;
    }
  }
  computeAcceleration() {
    return vec3.length(this.camera.acceleration) * 0.05;
  }}
;

class Debris {
  constructor() {
    this.uniforms = {
      time: {
        type: 'f',
        value: 0 },

      cubeTex: {
        type: 't',
        value: null } };


    this.instances = 1000;
    this.obj = null;
  }
  init(texture) {
    this.uniforms.cubeTex.value = texture;
    this.obj = this.createObj();
  }
  createObj() {
    const geometry = new THREE.InstancedBufferGeometry();
    const baseGeometry = new THREE.BoxBufferGeometry(10, 10, 10);
    geometry.addAttribute('position', baseGeometry.attributes.position);
    geometry.addAttribute('normal', baseGeometry.attributes.normal);
    geometry.setIndex(baseGeometry.index);
    const translate = new THREE.InstancedBufferAttribute(new Float32Array(this.instances * 3), 3, 1);
    const offsets = new THREE.InstancedBufferAttribute(new Float32Array(this.instances), 1, 1);
    const rotates = new THREE.InstancedBufferAttribute(new Float32Array(this.instances * 3), 3, 1);
    for (var i = 0, ul = offsets.count; i < ul; i++) {
      const polar = MathEx.polar(Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, Math.random() * 3000 + 100);
      translate.setXYZ(i, polar[0], polar[1], polar[2]);
      offsets.setXYZ(i, Math.random() * 100);
      rotates.setXYZ(i, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    }
    geometry.addAttribute('translate', translate);
    geometry.addAttribute('offset', offsets);
    geometry.addAttribute('rotate', rotates);
    return new THREE.Mesh(
    geometry,
    new THREE.RawShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `attribute vec3 position;
        attribute vec3 normal;
        attribute vec3 translate;
        attribute float offset;
        attribute vec3 rotate;

        uniform mat4 projectionMatrix;
        uniform mat4 modelViewMatrix;
        uniform mat4 modelMatrix;
        uniform float time;

        varying vec3 vPosition;
        varying vec3 vNormal;

        mat4 computeTranslateMat(vec3 v) {
          return mat4(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            v.x, v.y, v.z, 1.0
          );
        }
        mat4 computeRotateMatX(float radian) {
          return mat4(
            1.0, 0.0, 0.0, 0.0,
            0.0, cos(radian), -sin(radian), 0.0,
            0.0, sin(radian), cos(radian), 0.0,
            0.0, 0.0, 0.0, 1.0
          );
        }
        mat4 computeRotateMatY(float radian) {
          return mat4(
            cos(radian), 0.0, sin(radian), 0.0,
            0.0, 1.0, 0.0, 0.0,
            -sin(radian), 0.0, cos(radian), 0.0,
            0.0, 0.0, 0.0, 1.0
          );
        }
        mat4 computeRotateMatZ(float radian) {
          return mat4(
            cos(radian), -sin(radian), 0.0, 0.0,
            sin(radian), cos(radian), 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
          );
        }
        mat4 computeRotateMat(float radX, float radY, float radZ) {
          return computeRotateMatX(radX) * computeRotateMatY(radY) * computeRotateMatZ(radZ);
        }

        void main(void) {
          float radian = radians(time);
          mat4 rotateWorld = computeRotateMat(radian * 5.0 + rotate.x, radian * 20.0 + rotate.y, radian + rotate.z);
          mat4 rotateSelf = computeRotateMat(radian * rotate.x * 100.0, radian * rotate.y * 100.0, radian * rotate.z * 100.0);
          vec4 updatePosition =
            rotateWorld
            * computeTranslateMat(translate)
            * rotateSelf
            * vec4(position + normalize(position) * offset, 1.0);
          vPosition = (modelMatrix * updatePosition).xyz;
          vNormal = (modelMatrix * rotateWorld * rotateSelf * vec4(normal, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * updatePosition;
        }`,
      fragmentShader: `precision highp float;

        uniform vec3 cameraPosition;
        uniform float time;
        uniform samplerCube cubeTex;

        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          vec3 ref = reflect(vPosition - cameraPosition, vNormal);
          vec4 envColor = textureCube(cubeTex, ref);
          gl_FragColor = envColor * vec4(0.8, 1.0, 0.95, 0.7);
        }`,
      transparent: true,
      side: THREE.DoubleSide }));


  }
  render(time) {
    this.uniforms.time.value += time;
  }}
;

class SkyBox {
  constructor() {
    this.uniforms = {
      time: {
        type: 'f',
        value: 0 },

      cubeTex: {
        type: 't',
        value: null } };


    this.obj = null;
  }
  init(texture) {
    this.uniforms.cubeTex.value = texture;
    this.obj = this.createObj();
  }
  createObj() {
    return new THREE.Mesh(
    new THREE.BoxBufferGeometry(30000, 30000, 30000, 1, 1, 1),
    new THREE.RawShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `attribute vec3 position;
        attribute vec3 normal;
        attribute vec2 uv;

        uniform mat4 projectionMatrix;
        uniform mat4 modelViewMatrix;
        uniform float time;

        varying vec3 vPosition;

        void main(void) {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `precision highp float;

        uniform samplerCube cubeTex;

        varying vec3 vPosition;

        void main() {
          vec3 normal = normalize(vPosition);
          vec4 color = textureCube(cubeTex, normal);
          gl_FragColor = color;
        }`,
      side: THREE.BackSide }));


  }
  render(time) {
    this.uniforms.time.value += time;
  }}


class PostEffect {
  constructor(texture) {
    this.uniforms = {
      time: {
        type: 'f',
        value: 0 },

      resolution: {
        type: 'v2',
        value: new THREE.Vector2(window.innerWidth, window.innerHeight) },

      texture: {
        type: 't',
        value: texture },

      strengthZoom: {
        type: 'f',
        value: 0 },

      strengthGlitch: {
        type: 'f',
        value: 0 } };


    this.obj = this.createObj();
  }
  createObj() {
    return new THREE.Mesh(
    new THREE.PlaneBufferGeometry(2, 2),
    new THREE.RawShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `attribute vec3 position;
        attribute vec2 uv;

        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }`,
      fragmentShader: `precision highp float;

        uniform float time;
        uniform vec2 resolution;
        uniform sampler2D texture;
        uniform float strengthZoom;
        uniform float strengthGlitch;

        varying vec2 vUv;

        float random(vec2 c){
          return fract(sin(dot(c.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        //
        // GLSL textureless classic 3D noise "cnoise",
        // with an RSL-style periodic variant "pnoise".
        // Author:  Stefan Gustavson (stefan.gustavson@liu.se)
        // Version: 2011-10-11
        //
        // Many thanks to Ian McEwan of Ashima Arts for the
        // ideas for permutation and gradient selection.
        //
        // Copyright (c) 2011 Stefan Gustavson. All rights reserved.
        // Distributed under the MIT license. See LICENSE file.
        // https://github.com/ashima/webgl-noise
        //

        vec3 mod289(vec3 x)
        {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 mod289(vec4 x)
        {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 permute(vec4 x)
        {
          return mod289(((x*34.0)+1.0)*x);
        }

        vec4 taylorInvSqrt(vec4 r)
        {
          return 1.79284291400159 - 0.85373472095314 * r;
        }

        vec3 fade(vec3 t) {
          return t*t*t*(t*(t*6.0-15.0)+10.0);
        }

        // Classic Perlin noise
        float cnoise(vec3 P)
        {
          vec3 Pi0 = floor(P); // Integer part for indexing
          vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
          Pi0 = mod289(Pi0);
          Pi1 = mod289(Pi1);
          vec3 Pf0 = fract(P); // Fractional part for interpolation
          vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
          vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
          vec4 iy = vec4(Pi0.yy, Pi1.yy);
          vec4 iz0 = Pi0.zzzz;
          vec4 iz1 = Pi1.zzzz;

          vec4 ixy = permute(permute(ix) + iy);
          vec4 ixy0 = permute(ixy + iz0);
          vec4 ixy1 = permute(ixy + iz1);

          vec4 gx0 = ixy0 * (1.0 / 7.0);
          vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
          gx0 = fract(gx0);
          vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
          vec4 sz0 = step(gz0, vec4(0.0));
          gx0 -= sz0 * (step(0.0, gx0) - 0.5);
          gy0 -= sz0 * (step(0.0, gy0) - 0.5);

          vec4 gx1 = ixy1 * (1.0 / 7.0);
          vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
          gx1 = fract(gx1);
          vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
          vec4 sz1 = step(gz1, vec4(0.0));
          gx1 -= sz1 * (step(0.0, gx1) - 0.5);
          gy1 -= sz1 * (step(0.0, gy1) - 0.5);

          vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
          vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
          vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
          vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
          vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
          vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
          vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
          vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

          vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
          g000 *= norm0.x;
          g010 *= norm0.y;
          g100 *= norm0.z;
          g110 *= norm0.w;
          vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
          g001 *= norm1.x;
          g011 *= norm1.y;
          g101 *= norm1.z;
          g111 *= norm1.w;

          float n000 = dot(g000, Pf0);
          float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
          float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
          float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
          float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
          float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
          float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
          float n111 = dot(g111, Pf1);

          vec3 fade_xyz = fade(Pf0);
          vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
          vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
          float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
          return 2.2 * n_xyz;
        }

        void main(void){
          // zoom blur
          vec2 tFrag = 1.0 / resolution;
          float nFrag = 1.0 / 30.0;
          vec2 centerOffset = resolution / 2.0;
          vec3 destColor = vec3(0.0);
          vec2 fcc = gl_FragCoord.xy - centerOffset;
          float totalWeight = 0.0;

          for(float i = 0.0; i <= 30.0; i++){
            float percent = (i + random(gl_FragCoord.xy)) * nFrag;
            float weight = percent - percent * percent;
            vec2  t = gl_FragCoord.xy - fcc * percent * strengthZoom * nFrag;
            destColor += texture2D(texture, t * tFrag).rgb * weight;
            totalWeight += weight;
          }
          vec4 zoomColor = vec4(destColor / totalWeight, 1.0);

          // glitch
          float strengthWhiteNoise = min(strengthGlitch * 0.05, 0.1);
          float whiteNoise = (random(gl_FragCoord.xy + time) * 2.0 - 1.0) * (0.05 + strengthWhiteNoise);

          float strengthBlockNoise = min(strengthGlitch * 0.15, 1.2);
          float noiseX = step((cnoise(vec3(0.0, gl_FragCoord.x / resolution.x * 1.0, time * 600.0)) + 1.0) / 2.0, strengthBlockNoise * 0.6);
          float noiseY = step((cnoise(vec3(0.0, gl_FragCoord.y / resolution.y * 3.0, time * 200.0)) + 1.0) / 2.0, strengthBlockNoise * 0.3);
          float blockNoiseMask = noiseX * noiseY;
          vec4 blockNoise = texture2D(texture, 1.0 - vUv) * blockNoiseMask;

          gl_FragColor = zoomColor + whiteNoise + blockNoise;
        }` }));


  }
  render(time) {
    this.uniforms.time.value += time;
  }
  resize() {
    this.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
  }}


class ConsoleSignature {
  constructor() {
    this.message = `created by yoichi kobayashi`;
    this.url = `http://www.tplh.net`;
    this.show();
  }
  show() {
    if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
      const args = [
      `\n%c ${this.message} %c%c ${this.url} \n\n`,
      'color: #fff; background: #222; padding:3px 0;',
      'padding:3px 1px;',
      'color: #fff; background: #47c; padding:3px 0;'];

      console.log.apply(console, args);
    } else if (window.console) {
      console.log(`${this.message} ${this.url}`);
    }
  }}


const canvas = document.getElementById('canvas-webgl');
const renderer = new THREE.WebGLRenderer({
  antialias: false,
  canvas: canvas,
  alpha: true });

const renderBack = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
const scene = new THREE.Scene();
const sceneBack = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const cameraBack = new ForcePerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100000);
const cameraController = new CameraController(cameraBack);
const clock = new THREE.Clock();

const vectorTouchStart = new THREE.Vector2();
const vectorTouchMove = new THREE.Vector2();
const vectorTouchEnd = new THREE.Vector2();

let isDrag = false;

//
// process for this sketch.
//

const cubeTexLoader = new THREE.CubeTextureLoader();
cubeTexLoader.setCrossOrigin('anonymous');
const debris = new Debris();
const skybox = new SkyBox();
const postEffect = new PostEffect(renderBack.texture);

//
// common process
//gul
const resizeWindow = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  cameraBack.aspect = window.innerWidth / window.innerHeight;
  cameraBack.updateProjectionMatrix();
  postEffect.resize();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderBack.setSize(window.innerWidth, window.innerHeight);
};
const render = () => {
  const now = clock.getDelta();
  cameraController.render();
  debris.render(now);
  skybox.render(now);
  postEffect.render(now);
  postEffect.uniforms.strengthZoom.value = cameraController.computeZoomLength();
  postEffect.uniforms.strengthGlitch.value = cameraController.computeAcceleration();
  renderer.render(sceneBack, cameraBack, renderBack);
  renderer.render(scene, camera);
};
const renderLoop = () => {
  render();
  requestAnimationFrame(renderLoop);
};
const touchStart = isTouched => {
  isDrag = true;
};
const touchMove = isTouched => {
  if (isDrag) {
    cameraController.rotate(
    vectorTouchStart.x - vectorTouchMove.x,
    vectorTouchStart.y - vectorTouchMove.y);

  }
};
const touchEnd = isTouched => {
  isDrag = false;
  cameraController.touchEnd();
};
const mouseOut = () => {
  isDrag = false;
};
const wheel = event => {
  cameraController.zoom(event.deltaY);
};
const on = () => {
  window.addEventListener('resize', debounce(() => {
    resizeWindow();
  }), 1000);
  canvas.addEventListener('mousedown', function (event) {
    event.preventDefault();
    vectorTouchStart.set(event.clientX, event.clientY);
    normalizeVector2(vectorTouchStart);
    touchStart(false);
  });
  canvas.addEventListener('mousemove', function (event) {
    event.preventDefault();
    vectorTouchMove.set(event.clientX, event.clientY);
    normalizeVector2(vectorTouchMove);
    touchMove(false);
  });
  canvas.addEventListener('mouseup', function (event) {
    event.preventDefault();
    vectorTouchEnd.set(event.clientX, event.clientY);
    normalizeVector2(vectorTouchEnd);
    touchEnd(false);
  });
  canvas.addEventListener('mouseout', function (event) {
    event.preventDefault();
    vectorTouchEnd.set(event.clientX, event.clientY);
    normalizeVector2(vectorTouchEnd);
    touchEnd(false);
  });
  canvas.addEventListener('wheel', function (event) {
    event.preventDefault();
    wheel(event);
  });
  canvas.addEventListener('touchstart', function (event) {
    event.preventDefault();
    vectorTouchStart.set(event.touches[0].clientX, event.touches[0].clientY);
    normalizeVector2(vectorTouchStart);
    touchStart(event.touches[0].clientX, event.touches[0].clientY, true);
  });
  canvas.addEventListener('touchmove', function (event) {
    event.preventDefault();
    vectorTouchMove.set(event.touches[0].clientX, event.touches[0].clientY);
    normalizeVector2(vectorTouchMove);
    touchMove(true);
  });
  canvas.addEventListener('touchend', function (event) {
    event.preventDefault();
    vectorTouchEnd.set(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    normalizeVector2(vectorTouchEnd);
    touchEnd(true);
  });
};

const consoleSignature = new ConsoleSignature();

const init = () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xeeeeee, 1.0);

  cubeTexLoader.setPath('http://www.tplh.net/file/skybox/').load(
  ["cubemap_px.png", "cubemap_nx.png", "cubemap_py.png", "cubemap_ny.png", "cubemap_pz.png", "cubemap_nz.png"],
  tex => {
    debris.init(tex);
    skybox.init(tex);
    scene.add(postEffect.obj);
    sceneBack.add(debris.obj);
    sceneBack.add(skybox.obj);
  });


  on();
  resizeWindow();
  renderLoop();
};
init();
