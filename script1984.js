async function e() {
  function e(e) {
    let t = null;
    h.setValue(0, 0, 0);
    let n = e.attributes.position.array;
    t = new Ammo.btConvexHullShape();
    for (let e = 0, i = n.length; e < i; e += 3) {
      h.setValue(n[e], n[e + 1], n[e + 2]);
      const o = e >= i - 3;
      t.addPoint(h, o);
    }
    return t && t.setMargin(0), t;
  }
  function n(e, t, n, o = null) {
    (u = e.position),
      (w = e.quaternion),
      d.setIdentity(),
      h.setValue(u.x, u.y, u.z),
      d.setOrigin(h),
      d.setRotation(new i.btQuaternion(w.x, w.y, w.z, w.w));
    const a = e.scale;
    h.setValue(a.x, a.y, a.z), n.setLocalScaling(h), h.setValue(0, 0, 0);
    const s = new i.btDefaultMotionState(d),
      r = h;
    t > 0 && n.calculateLocalInertia(t, r);
    const c = new i.btRigidBodyConstructionInfo(t, s, n, r),
      E = new i.btRigidBody(c);
    "pointLight" == e.name
      ? (E.setFriction(0.1), E.setRestitution(0.5))
      : "floor" == e.name
      ? (E.setFriction(1), E.setRestitution(1), E.setDamping(0, 0))
      : (E.setFriction(0.5), E.setRestitution(0.3), E.setDamping(0, 0)),
      "shootingBall" == e.name &&
        o &&
        (h.setValue(o.x, o.y, o.z), E.setLinearVelocity(h)),
      (E.name = e.name),
      l.addRigidBody(E),
      t > 0 && (m.push(e), p.set(e, E));
  }
  if ("Ammo" in window == !1) return;
  const i = await Ammo(),
    o = new i.btDefaultCollisionConfiguration(),
    a = new i.btCollisionDispatcher(o),
    s = new i.btDbvtBroadphase(),
    r = new i.btSequentialImpulseConstraintSolver(),
    l = new i.btDiscreteDynamicsWorld(a, s, r, o);
  l.setGravity(new i.btVector3(0, -10, 0));
  let d = new i.btTransform();
  const c = new i.btTransform();
  let u,
    h = new i.btVector3(0, 0, 0),
    w = new i.btQuaternion(0, 0, 0, 0),
    m = [],
    p = new WeakMap(),
    E = null,
    g = "",
    f = 0;
  return (
    setInterval(function () {
      const e = performance.now();
      if (f > 0) {
        const t = (e - f) / 1e3;
        l.stepSimulation(t, 10);
      }
      f = e;
      for (let e = 0, n = m.length; e < n; e++) {
        if (!m[e]) continue;
        let n = m[e];
        if (n.isInstancedMesh) {
          let e = n.instanceMatrix.array;
          if (!p.has(n)) continue;
          let i = p.get(n);
          for (let n = 0; n < i.length; n++)
            i[n] &&
              (i[n].getMotionState().getWorldTransform(c),
              (u = c.getOrigin()),
              (w = c.getRotation()),
              t(u, w, e, 16 * n));
          p.set(n, i), (n.instanceMatrix.needsUpdate = !0);
        } else if (n.isMesh) {
          if (!p.has(n)) continue;
          p.get(n).getMotionState().getWorldTransform(c),
            (u = c.getOrigin()),
            (w = c.getRotation()),
            n.position.set(u.x(), u.y(), u.z()),
            n.quaternion.set(w.x(), w.y(), w.z(), w.w());
        }
      }
    }, 1e3 / 60),
    {
      addMesh: function (t, i = 0) {
        const o = e(t.geometry);
        if (!o) return !1;
        n(t, i, o);
      },
      addCompoundMesh: function (t, o = 0, a = []) {
        let s = new i.btCompoundShape();
        for (let t = 0; t < a.length; t++) {
          let n = e(a[t]);
          if (!n) return !1;
          h.setValue(0, 0, 0),
            d.setIdentity(),
            d.setOrigin(h),
            s.addChildShape(d, n);
        }
        n(t, o, s);
      },
      addParticleMesh: function (t, o = 0) {
        if (
          ((!t.name || (t.name && t.name != g)) &&
            ((E = e(t.geometry)), (g = t.name)),
          !E)
        )
          return !1;
        t.isInstancedMesh
          ? (function (e, t, n) {
              let o,
                a = e.instanceMatrix.array,
                s = [];
              h.setValue(0, 0, 0);
              for (let r = 0; r < e.count; r++) {
                let c = 16 * r;
                d.setFromOpenGLMatrix(a.slice(c, c + 16));
                let u = new i.btDefaultMotionState(d),
                  w = h;
                n.calculateLocalInertia(t, w);
                let m = new i.btRigidBodyConstructionInfo(t, u, n, w);
                (o = new i.btRigidBody(m)).setFriction(0.5),
                  o.setRestitution(0.3),
                  o.setDamping(0, 0),
                  (o.name = e.name),
                  l.addRigidBody(o),
                  s.push(o);
              }
              t > 0 && (m.push(e), p.set(e, s));
            })(t, o, E)
          : t.isMesh && n(t, o, E);
      },
      addShootingMesh: function (t, i = 0, o = null) {
        return (
          !!o &&
          ((!t.name || (t.name && t.name != g)) &&
            ((E = e(t.geometry)), (g = t.name)),
          !!E && void n(t, i, E, o))
        );
      }
    }
  );
}

function t(e, t, n, i) {
  const o = t.x(),
    a = t.y(),
    s = t.z(),
    r = t.w(),
    l = o + o,
    d = a + a,
    c = s + s,
    u = o * l,
    h = o * d,
    w = o * c,
    m = a * d,
    p = a * c,
    E = s * c,
    g = r * l,
    f = r * d,
    R = r * c;
  (n[i + 0] = 1 - (m + E)),
    (n[i + 1] = h + R),
    (n[i + 2] = w - f),
    (n[i + 3] = 0),
    (n[i + 4] = h - R),
    (n[i + 5] = 1 - (u + E)),
    (n[i + 6] = p + g),
    (n[i + 7] = 0),
    (n[i + 8] = w + f),
    (n[i + 9] = p - g),
    (n[i + 10] = 1 - (u + m)),
    (n[i + 11] = 0),
    (n[i + 12] = e.x()),
    (n[i + 13] = e.y()),
    (n[i + 14] = e.z()),
    (n[i + 15] = 1);
}

import * as THREE from "three";

import { OrbitControls as n } from "three/addons/controls/OrbitControls.js";

import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

!(function () {
  "use strict";
  async function t() {
    a = await e();
    const t = document.createElement("div");
    document.body.appendChild(t),
      ((r = new THREE.Scene()).background = 0),
      (l = new THREE.WebGLRenderer({
        antialias: !0
      })).setPixelRatio(window.devicePixelRatio),
      l.setSize(window.innerWidth, window.innerHeight),
      (l.outputEncoding = THREE.sRGBEncoding),
      (l.shadowMap.enabled = !0),
      t.appendChild(l.domElement),
      (s = new THREE.PerspectiveCamera(
        35,
        window.innerWidth / window.innerHeight,
        0.01,
        500
      )).position.set(0, 3, 18),
      s.lookAt(0, 0, 0),
      ((d = new n(s, l.domElement)).autoRotate = !1),
      (d.autoRotateSpeed = 2),
      (d.enableDamping = !0),
      (d.enablePan = !1),
      (d.minDistance = 3),
      (d.maxDistance = 20),
      (d.minPolarAngle = 0),
      (d.maxPolarAngle = Math.PI / 2),
      d.target.set(0, 0, 0),
      (d.coupleCenters = !0),
      d.update();
    const w = new THREE.AmbientLight(16777215, 0.2);
    r.add(w),
      (m = 2),
      (R = "white"),
      ((p = new THREE.PointLight(R, 2, 10)).castShadow = !0),
      (p.shadow.bias = -0.001),
      (c = new THREE.SphereGeometry(1, 20, 20)),
      (u = new THREE.MeshBasicMaterial({
        color: R
      })).color.multiplyScalar(3),
      (E = new THREE.Mesh(c, u)).position.set(0, 1, 0),
      (E.name = "pointLight"),
      E.add(p),
      E.add(
        new THREE.Mesh(
          c,
          new THREE.MeshLambertMaterial({
            color: "white",
            transparent: !0,
            opacity: 0.3
          })
        )
      ),
      E.children[1].scale.set(1.02, 1.02, 1.02),
      E.add(
        new THREE.Mesh(
          c,
          new THREE.MeshBasicMaterial({
            color: "white",
            transparent: !0,
            opacity: 0.1
          })
        )
      ),
      E.children[2].scale.set(1.05, 1.05, 1.05),
      r.add(E),
      a.addMesh(E, 1);
    for (let e = 0; e < 8; e++)
      (R = new THREE.Color()).setHSL(
        Math.abs(THREE.MathUtils.randInt(-1e3, 1e3) / 1e3),
        1,
        THREE.MathUtils.randInt(500, 700) / 1e3
      ),
        (E = E.clone()),
        (u = u.clone()).color.set(R),
        (E.material = u),
        E.children[0].color.set(R),
        E.position.set(
          THREE.MathUtils.randInt(2 * -f, 2 * f),
          THREE.MathUtils.randInt(10, 15 * f) / 10,
          THREE.MathUtils.randInt(2 * -f, 1.3 * f)
        ),
        r.add(E),
        a.addMesh(E, 1);
    !(function () {
      (c = new THREE.IcosahedronGeometry(0.8, 0)),
        (u = new THREE.MeshPhongMaterial({
          envMap: g
        }));
      const e = new THREE.Mesh(c, u);
      (e.castShadow = !0),
        (e.name = "shootingBall"),
        window.addEventListener("pointerdown", function (t) {
          b.set(
            (t.clientX / window.innerWidth) * 2 - 1,
            (-t.clientY / window.innerHeight) * 2 + 1
          ),
            s.updateMatrixWorld(),
            T.setFromCamera(b, s),
            x.copy(T.ray.direction),
            x.add(T.ray.origin),
            (h = e.clone()).position.set(x.x, x.y, x.z),
            (h.material = h.material.clone()),
            (R = new THREE.Color()).setHSL(
              Math.abs(THREE.MathUtils.randInt(-1e3, 1e3) / 1e3),
              1,
              THREE.MathUtils.randInt(500, 700) / 1e3
            ),
            h.material.color.set(R),
            r.add(h),
            x.copy(T.ray.direction),
            x.multiplyScalar(H),
            a.addShootingMesh(h, y, x);
        });
    })();
    (M = []),
      (c = new THREE.BoxGeometry(33, 33, 33, 1, 1, 1)),
      (u = new THREE.MeshPhongMaterial({
        color: 5592405,
        shininess: 10,
        specular: 1118481
      }));
    let S = c.clone(),
      C = c.clone(),
      I = c.clone(),
      B = c.clone(),
      L = c.clone(),
      z = c.clone();
    S.translate(0, -17, 0),
      C.translate(30, 0, 0),
      I.translate(-30, 0, 0),
      B.translate(0, 0, 30),
      L.translate(0, 0, -30),
      z.translate(0, 30, 0),
      M.push(S),
      M.push(C),
      M.push(I),
      M.push(B),
      M.push(L),
      M.push(z),
      (c = BufferGeometryUtils.mergeGeometries(M));
    let D = new THREE.Mesh(c, u);
    (D.receiveShadow = !0),
      (D.name = "wall"),
      r.add(D),
      a.addCompoundMesh(D, 0, M),
      o(),
      window.addEventListener("resize", i);
  }
  function i() {
    (s.aspect = window.innerWidth / window.innerHeight),
      s.updateProjectionMatrix(),
      l.setSize(window.innerWidth, window.innerHeight);
  }
  function o() {
    requestAnimationFrame(o), d.update(), l.render(r, s);
  }
  let a,
    s,
    r,
    l,
    d,
    c,
    u,
    h,
    w,
    m,
    p,
    E,
    g,
    f = 5,
    R = "",
    M = [];
  new THREE.Object3D();
  (w = new THREE.CubeTextureLoader()).setCrossOrigin(""),
    w.setPath("https://threejs.org/examples/textures/cube/pisa/"),
    w.load(
      ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
      function (e) {
        (g = e), t();
      }
    );
  let y = 10,
    H = 35;
  const T = new THREE.Raycaster(),
    b = new THREE.Vector2(),
    x = new THREE.Vector3();
})();

export { e as AmmoPhysics };