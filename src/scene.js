import * as THREE from "three";
import { assemblyLayout } from "./assembly.js";
import { servedImage, itemIds, productOf, assetURL } from "./catalog.js";
import { categories } from "./menu.js";
import { createPackaging } from "./packaging.js";
import { fitPackage, packingFrame } from "./packingMotion.js";
import { spring, clamp } from "./motion.js";

// Prepared food layers with contact shadows and time-step-independent settling.
export class FoodScene {
  constructor(host, callbacks) {
    this.host = host;
    this.callbacks = callbacks;
    this.disposed = false;
    this.textures = new Map();
    this.pieces = new Map();
    this.sequence = 0;
    this.foodVersion = 0;
    this.layerCount = 0;
    this.layerSpacing = 0.26;
    this.phase = "build";
    this.reduced = false;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(39, 1, 0.1, 100);
    this.camera.position.set(0, 9, 5.7);
    this.camera.lookAt(0, 0, 0);
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.host.appendChild(this.renderer.domElement);
    this.renderer.domElement.addEventListener(
      "webglcontextlost",
      (this.contextLost = (e) => {
        e.preventDefault();
        this.callbacks.onError(new Error("WebGL context lost"));
      }),
    );
    this.scene.add(new THREE.HemisphereLight(0xffefda, 0x493225, 3));
    const key = new THREE.DirectionalLight(0xffedcf, 4.1);
    key.position.set(-4, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -9;
    key.shadow.camera.right = 9;
    key.shadow.camera.top = 9;
    key.shadow.camera.bottom = -9;
    key.shadow.bias = -0.001;
    key.shadow.normalBias = 0.04;
    key.shadow.radius = 4;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xff8766, 1.3);
    rim.position.set(6, 3, -2);
    this.scene.add(rim);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.ShadowMaterial({ opacity: 0.32 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.13;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.tray = new THREE.Group();
    this.scene.add(this.tray);
    const metal = new THREE.MeshStandardMaterial({
      color: 0xb3a99a,
      metalness: 0.7,
      roughness: 0.39,
    });
    const disk = new THREE.Mesh(
      new THREE.CylinderGeometry(2.66, 2.6, 0.07, 96),
      metal,
    );
    disk.castShadow = true;
    disk.receiveShadow = true;
    this.tray.add(disk);
    const rimMesh = new THREE.Mesh(
      new THREE.TorusGeometry(2.64, 0.045, 12, 96),
      metal,
    );
    rimMesh.rotation.x = -Math.PI / 2;
    rimMesh.position.y = 0.05;
    this.tray.add(rimMesh);
    this.food = new THREE.Group();
    this.scene.add(this.food);
    this.food.position.x = 0.38;
    this.tray.position.x = 0.38;
    this.loader = new THREE.TextureLoader();
    this.previousTime = performance.now();
    this.elapsed = 0;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
    this.onVisibility = () => {
      this.previousTime = performance.now();
    };
    document.addEventListener("visibilitychange", this.onVisibility);
    this.animate = this.animate.bind(this);
    this.frame = requestAnimationFrame(this.animate);
  }
  resize() {
    const { width, height } = this.host.getBoundingClientRect();
    if (!width || !height) return;
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }
  async texture(name) {
    if (this.textures.has(name)) return this.textures.get(name);
    const promise = new Promise((resolve, reject) =>
      this.loader.load(
        assetURL(name),
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(
            8,
            this.renderer.capabilities.getMaxAnisotropy(),
          );
          let ratio = texture.image.width / texture.image.height;
          // Trim alpha margins by UVs, without resampling or modifying the supplied asset.
          if (!["cardboard", "box-lid", "hotdog-lid", "wood"].includes(name)) {
            const image = texture.image,
              canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            ctx.drawImage(image, 0, 0);
            const pixels = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            ).data;
            let x0 = canvas.width,
              y0 = canvas.height,
              x1 = 0,
              y1 = 0;
            for (let y = 0; y < canvas.height; y += 3)
              for (let x = 0; x < canvas.width; x += 3)
                if (pixels[(y * canvas.width + x) * 4 + 3] > 30) {
                  x0 = Math.min(x0, x);
                  x1 = Math.max(x1, x);
                  y0 = Math.min(y0, y);
                  y1 = Math.max(y1, y);
                }
            if (x1 > x0) {
              x0 = Math.max(0, x0 - 4);
              y0 = Math.max(0, y0 - 4);
              x1 = Math.min(canvas.width, x1 + 5);
              y1 = Math.min(canvas.height, y1 + 5);
              texture.repeat.set(
                (x1 - x0) / canvas.width,
                (y1 - y0) / canvas.height,
              );
              texture.offset.set(x0 / canvas.width, 1 - y1 / canvas.height);
              ratio = (x1 - x0) / (y1 - y0);
            }
          }
          resolve({ texture, ratio });
        },
        undefined,
        (error) =>
          reject(
            new Error(
              `No se pudo cargar /assets/${name}.webp: ${error.message || "error de imagen"}`,
            ),
          ),
      ),
    );
    this.textures.set(name, promise);
    return promise;
  }
  async plane(
    name,
    width,
    { billboard = false, curve = 0, tilt = 0, contact = false } = {},
  ) {
    const { texture, ratio } = await this.texture(name);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.09,
      depthWrite: true,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(
        width,
        width / ratio,
        curve ? 24 : 1,
        curve ? 12 : 1,
      ),
      material,
    );
    if (curve) {
      const p = mesh.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i) / (width / 2),
          y = p.getY(i) / (width / ratio / 2);
        p.setZ(
          i,
          curve * (0.25 * Math.cos(x * Math.PI) - Math.max(0, -y) ** 2),
        );
      }
      p.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    }
    if (contact) {
      const shadow = new THREE.Mesh(
        mesh.geometry.clone(),
        new THREE.MeshBasicMaterial({
          map: texture,
          color: 0x180c05,
          transparent: true,
          opacity: 0,
          alphaTest: 0.08,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
      );
      shadow.position.set(0.022, -0.018, -0.025);
      shadow.scale.setScalar(1.012);
      mesh.add(shadow);
      mesh.userData.contactShadow = shadow;
    }
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    mesh.userData.billboard = billboard;
    mesh.userData.tilt = tilt;
    mesh.userData.width = width;
    mesh.userData.height = width / ratio;
    if (!billboard) mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }
  update({ category, recipe, phase, reduced, drop, business }) {
    if (this.disposed) return;
    this.reduced = reduced;
    this.captureDrop(drop);
    this.phase = "build";
    const changedBusiness = business !== this.business;
    this.business = business;
    if (category !== this.category || changedBusiness) {
      this.category = category;
      this.lastDrop = null;
      this.recipe = { ...recipe };
      this.buildFood(category, recipe);
    } else if (JSON.stringify(recipe) !== JSON.stringify(this.recipe)) {
      this.recipe = { ...recipe };
      this.reconcile(recipe);
    }
  }
  async buildFood(category, recipe) {
    const version = ++this.foodVersion;
    this.clearFood();
    this.pieces.clear();
    this.ready = false;
    const initialLayout = assemblyLayout(category, recipe, this.business);
    this.layerCount = initialLayout.layerCount;
    this.layerSpacing = initialLayout.spacing;
    try {
      const base = await this.plane(
        productOf(category, this.business).image,
        category === "burger" ? 3.7 : category === "pizza" ? 4.85 : 4.6,
        { billboard: category !== "pizza" },
      );
      if (this.disposed || version !== this.foodVersion) {
        this.disposeMesh(base);
        return;
      }
      base.position.y =
        category === "pizza" ? 0.13 : category === "hotdog" ? 1.1 : 0.65;
      this.base = base;
      this.food.add(base);
      if (category === "burger") {
        const [patty, top] = await Promise.all([
          this.plane("patty", 3.5, { billboard: true }),
          this.plane("burger-top", 3.75, { billboard: true }),
        ]);
        if (this.disposed || version !== this.foodVersion) {
          this.disposeMesh(patty);
          this.disposeMesh(top);
          return;
        }
        patty.position.y = 1.25;
        patty.position.z = 0.1;
        this.food.add(patty);
        this.fixedPatty = patty;
        this.top = top;
        this.food.add(top);
        this.topY = 1.9 + this.layerCount * this.layerSpacing;
        this.topV = 0;
      }
      // Upload prepared textures before enabling gestures: the first drop must not
      // pause to decode an image or allocate its GPU texture.
      await Promise.all(
        itemIds(category, this.business).map(async (id) => {
          const { texture } = await this.texture(
            servedImage(category, id, this.business),
          );
          if (!this.disposed && version === this.foodVersion)
            this.renderer.initTexture(texture);
        }),
      );
      if (this.disposed || version !== this.foodVersion) return;
      await this.reconcile(this.recipe, true, version);
      if (this.disposed || version !== this.foodVersion) return;
      this.ready = true;
      this.callbacks.onReady();
    } catch (e) {
      if (!this.disposed && version === this.foodVersion)
        this.callbacks.onError(e);
    }
  }
  async reconcile(recipe, initial = false, version = this.foodVersion) {
    const category = this.category,
      {
        pieces: layout,
        layerCount,
        spacing,
      } = assemblyLayout(category, recipe, this.business);
    const wanted = new Map(layout.map((info) => [info.key, info]));
    this.layerCount = layerCount;
    this.layerSpacing = spacing;
    for (const [key, piece] of this.pieces)
      if (!wanted.has(key)) {
        piece.removing = true;
        piece.life = 0;
      }
    await Promise.all(
      layout.map(async (info) => {
        const existing = this.pieces.get(info.key);
        if (existing) {
          Object.assign(existing, {
            tx: info.x,
            ty: info.y,
            tz: info.z,
            removing: false,
          });
          return;
        }
        try {
          const mesh = await this.plane(info.asset, info.width, {
            billboard: info.billboard,
            curve: info.curve,
            tilt: info.tilt,
            contact: true,
          });
          if (
            this.disposed ||
            version !== this.foodVersion ||
            !(this.recipe[info.id] > Number(info.key.split("-")[1]))
          ) {
            this.disposeMesh(mesh);
            return;
          }
          if (this.pieces.has(info.key)) {
            this.disposeMesh(mesh);
            return;
          }
          const release =
            !initial &&
            this.lastDrop?.id === info.id &&
            performance.now() - this.lastDrop.time < 1500
              ? this.lastDrop.position
              : null;
          const from = release
            ? { x: release.x, y: release.y, z: release.z }
            : { x: info.x - 1.1, y: info.y - 0.65, z: info.z + 2.6 };
          const mode = initial ? "settled" : "slide";
          const distance = this.camera.position.distanceTo(
            this.food.localToWorld(new THREE.Vector3(info.x, info.y, info.z)),
          );
          const projectedWidth =
            (info.width * this.food.scale.x * this.height * this.camera.zoom) /
            (2 *
              distance *
              Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)));
          const piece = {
            startScale: release ? clamp(152 / projectedWidth, 0.25, 1.1) : 0.65,
            mesh,
            tx: info.x,
            ty: info.y,
            tz: info.z,
            from,
            mode,
            progress: 0,
            progressV: 0,
            x: initial ? info.x : from.x,
            y: initial ? info.y : from.y,
            z: initial ? info.z : from.z,
            vy: 0,
            vx: 0,
            vz: 0,
            delay: this.reduced ? 0 : info.delay,
            life: 0,
            rotation: info.rotation,
            spin: 0,
            landed: initial || this.reduced,
            tilt: info.tilt,
            layerIndex: info.layerIndex,
          };
          mesh.position.set(piece.x, piece.y, piece.z);
          if (!initial && !this.reduced) {
            mesh.scale.setScalar(piece.startScale);
            mesh.material.opacity = 0;
          }
          mesh.userData.frozenQuaternion = this.camera.quaternion.clone();
          this.pieces.set(info.key, piece);
          this.food.add(mesh);
        } catch (e) {
          if (!this.disposed && version === this.foodVersion)
            this.callbacks.onError(e);
        }
      }),
    );
  }
  captureDrop(drop) {
    if (!drop || drop.sequence === this.dropSequence) return;
    this.dropSequence = drop.sequence;
    if (!Number.isFinite(drop.clientX) || !Number.isFinite(drop.clientY)) {
      this.lastDrop = null;
      return;
    }
    const r = this.host.getBoundingClientRect();
    this.food.updateWorldMatrix(true, false);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(
      new THREE.Vector2(
        ((drop.clientX - r.left) / r.width) * 2 - 1,
        (-(drop.clientY - r.top) / r.height) * 2 + 1,
      ),
      this.camera,
    );
    const normal = this.camera.getWorldDirection(new THREE.Vector3());
    const center = this.food.localToWorld(new THREE.Vector3(0, 1.3, 0));
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        normal,
        center,
      ),
      point = new THREE.Vector3();
    if (ray.ray.intersectPlane(plane, point)) {
      this.food.worldToLocal(point);
      point.set(
        clamp(point.x, -6, 6),
        clamp(point.y, -3, 6),
        clamp(point.z, -5, 5),
      );
      this.lastDrop = { id: drop.id, position: point, time: performance.now() };
    }
  }
  animate() {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.animate);
    const now = performance.now(),
      dt = Math.min((now - this.previousTime) / 1000, 1 / 30);
    this.previousTime = now;
    if (document.hidden) return;
    this.elapsed += dt;
    if (!this.ready) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    if (this.pack) {
      this.animatePacking(dt);
      this.renderer.render(this.scene, this.camera);
      return;
    }
    for (const [key, p] of this.pieces) {
      p.life += dt;
      if (p.delay > 0) {
        p.delay -= dt;
        continue;
      }
      const targetY = p.ty;
      if (p.removing) {
        p.mesh.scale.setScalar(Math.max(0.01, 1 - p.life * 3.5));
        p.mesh.material.opacity = Math.max(0, 1 - p.life / 0.3);
        p.y += dt * 0.7;
        if (p.life > 0.3) {
          this.food.remove(p.mesh);
          this.disposeMesh(p.mesh);
          this.pieces.delete(key);
          continue;
        }
      } else if (this.reduced) {
        p.x = p.tx;
        p.y = targetY;
        p.z = p.tz;
        p.mesh.scale.setScalar(1);
        p.mesh.material.opacity = 1;
        p.landed = true;
      } else if (p.mode === "slide") {
        [p.progress, p.progressV] = spring(
          p.progress,
          p.progressV,
          1,
          dt,
          210,
          30,
        );
        const t = p.progress,
          arc = Math.sin(clamp(t, 0, 1) * Math.PI) * 0.03;
        p.x = p.from.x + (p.tx - p.from.x) * t;
        p.y = p.from.y + (targetY - p.from.y) * t + arc;
        p.z = p.from.z + (p.tz - p.from.z) * t;
        p.mesh.scale.setScalar(
          p.startScale + (1 - p.startScale) * clamp(t, 0, 1),
        );
        p.mesh.material.opacity = clamp(p.life / 0.14, 0, 1);
        p.spin *= Math.exp(-dt * 7);
        if (t > 0.998 && Math.abs(p.progressV) < 0.025) {
          p.mode = "settled";
          p.landed = true;
          p.vx = 0;
          p.vy = 0;
          p.vz = 0;
        }
      } else {
        [p.x, p.vx] = spring(p.x, p.vx, p.tx, dt, 110, 18);
        [p.z, p.vz] = spring(p.z, p.vz, p.tz, dt, 110, 18);
        if (p.mode === "fall" && !p.landed) {
          p.vy -= 17 * dt;
          p.y += p.vy * dt;
          if (p.y <= targetY) {
            p.y = targetY;
            p.vy = -p.vy * 0.16;
            p.spin *= 0.25;
            if (Math.abs(p.vy) < 0.4) {
              p.mode = "settled";
              p.landed = true;
              p.vy = 0;
            }
          }
        } else [p.y, p.vy] = spring(p.y, p.vy, targetY, dt, 160, 23);
        p.mesh.scale.setScalar(1);
        p.mesh.material.opacity = 1;
        p.spin *= Math.exp(-dt * 6);
      }
      if (p.mesh.userData.contactShadow)
        p.mesh.userData.contactShadow.material.opacity = p.landed
          ? 0.19
          : 0.16 * Math.pow(clamp(p.progress, 0, 1), 3);
      p.mesh.position.set(p.x, p.y, p.z);
      if (p.mesh.userData.billboard) {
        p.mesh.quaternion.copy(
          this.phase === "build"
            ? this.camera.quaternion
            : p.mesh.userData.frozenQuaternion || this.camera.quaternion,
        );
        if (p.tilt) p.mesh.rotateX(p.tilt);
        p.mesh.rotateZ(p.rotation + p.spin);
      } else p.mesh.rotation.set(-Math.PI / 2, 0, p.rotation + p.spin);
    }
    const orient = (mesh) => {
      if (mesh?.userData.billboard)
        mesh.quaternion.copy(
          this.phase === "build"
            ? this.camera.quaternion
            : mesh.userData.frozenQuaternion || this.camera.quaternion,
        );
    };
    orient(this.base);
    orient(this.fixedPatty);
    if (this.top) {
      const target = 1.9 + this.layerCount * (this.layerSpacing || 0.2);
      if (!Number.isFinite(this.topY) || !Number.isFinite(this.topV)) {
        this.topY = target;
        this.topV = 0;
      }
      if (this.reduced) this.topY = target;
      else
        [this.topY, this.topV] = spring(
          this.topY,
          this.topV,
          target,
          dt,
          110,
          19,
        );
      this.top.position.set(0, this.topY, 0.1);
      orient(this.top);
    }
    if (this.phase === "build") {
      const isBurger = this.category === "burger";
      const floating = 0;
      this.food.position.set(
        0.38,
        floating,
        isBurger ? 0.25 : this.category === "hotdog" ? 1.05 : 0,
      );
      this.food.rotation.x = 0;
      this.food.rotation.y = 0;
      const desiredZoom =
        this.width < 500
          ? isBurger
            ? 1.45
            : this.category === "pizza"
              ? 1.65
              : 1.23
          : this.height < 360 && this.width > 500
            ? isBurger
              ? 1.5
              : this.category === "pizza"
                ? 1.3
                : 1.4
            : 1.08;
      this.camera.zoom = this.reduced
        ? desiredZoom
        : this.camera.zoom +
          (desiredZoom - this.camera.zoom) * (1 - Math.exp(-dt * 8));
      this.camera.updateProjectionMatrix();
      this.food.scale.setScalar(
        isBurger ? 0.98 : this.category === "pizza" ? 1.17 : 1.08,
      );
      this.tray.scale.setScalar(
        isBurger ? 0.9 : this.category === "pizza" ? 1.17 : 1.08,
      );
      this.tray.position.set(0.38, 0, 0);
      const targetY = isBurger ? 4.2 : this.category === "hotdog" ? 7 : 9,
        targetZ = isBurger ? 9.7 : this.category === "hotdog" ? 7.5 : 5.7;
      const cameraTarget = new THREE.Vector3(0, targetY, targetZ);
      if (this.reduced) this.camera.position.copy(cameraTarget);
      else this.camera.position.lerp(cameraTarget, Math.min(1, dt * 3));
      this.camera.lookAt(
        this.width < 500
          ? 0.38
          : this.height < 210 && this.width <= 900
            ? -0.85
            : 0.1,
        isBurger ? 1.05 : 0,
        this.category === "pizza" ? 0.45 : 0,
      );
    }
    if (this.category === "pizza") {
      this.tray.updateWorldMatrix(true, false);
      this.camera.updateMatrixWorld();
      let extent = 0;
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const point = this.tray
          .localToWorld(
            new THREE.Vector3(Math.cos(a) * 2.72, 0.07, Math.sin(a) * 2.72),
          )
          .project(this.camera);
        extent = Math.max(extent, Math.abs(point.x), Math.abs(point.y));
      }
      if (extent > 0.88) {
        this.camera.zoom *= 0.88 / extent;
        this.camera.updateProjectionMatrix();
      }
    }
    // Orient after camera interpolation, avoiding a one-frame attachment lag.
    orient(this.base);
    orient(this.fixedPatty);
    orient(this.top);
    for (const p of this.pieces.values())
      if (p.mesh.userData.billboard) {
        orient(p.mesh);
        if (p.tilt) p.mesh.rotateX(p.tilt);
        p.mesh.rotateZ(p.rotation + p.spin);
      }
    this.renderer.render(this.scene, this.camera);
  }

  async startPacking(business) {
    const businessName = business?.name || "mordida.";
    if (this.disposed || this.pack) return;
    this.ready = false;
    try {
      const { texture: cardboard } = await this.texture("cardboard");
      if (this.disposed) return;
      // Lock one camera for placement and closure. All billboards are oriented once.
      this.camera.position.set(0, this.category === "burger" ? 7 : 11, 12);
      this.camera.lookAt(0, 1, 0);
      this.camera.zoom = 1;
      this.camera.updateProjectionMatrix();
      this.food.position.set(0, 0, 0);
      this.food.scale.setScalar(1);
      this.food.rotation.set(0, 0, 0);
      this.tray.visible = false;
      for (const p of this.pieces.values()) {
        p.mesh.position.set(p.tx, p.ty, p.tz);
        p.mesh.scale.setScalar(1);
        p.mesh.material.opacity = 1;
      }
      if (this.top)
        this.top.position.y = 1.9 + this.layerCount * this.layerSpacing;
      this.food.traverse((o) => {
        if (o.userData.billboard) {
          o.quaternion.copy(this.camera.quaternion);
          if (o.userData.tilt) o.rotateX(o.userData.tilt);
        }
      });
      this.food.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(this.food),
        size = bounds.getSize(new THREE.Vector3()),
        center = bounds.getCenter(new THREE.Vector3());
      const dimensions = fitPackage(this.category, size);
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#dfc49d";
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.textAlign = "center";
      ctx.fillStyle = "#8f342a";
      ctx.font =
        "bold " +
        Math.min(120, (850 / Math.max(1, businessName.length)) * 1.7) +
        "px sans-serif";
      ctx.fillText(businessName, 512, 485, 850);
      ctx.font = "24px sans-serif";
      ctx.fillText(business?.slogan || "", 512, 555, 850);
      if (business?.logo) {
        const logo = new Image();
        logo.src = business.logo;
        await logo.decode();
        if (this.disposed) return;
        const ratio = Math.min(220 / logo.width, 160 / logo.height);
        ctx.drawImage(
          logo,
          512 - (logo.width * ratio) / 2,
          170,
          logo.width * ratio,
          logo.height * ratio,
        );
      }
      ctx.font = "18px sans-serif";
      ctx.fillText("BUENA COMIDA. CERO REGLAS.", 512, 850);
      const print = new THREE.CanvasTexture(canvas);
      print.colorSpace = THREE.SRGBColorSpace;
      this.packPrint = print;
      this.package = createPackaging(this.category, {
        cardboard,
        print,
        dimensions,
      });
      this.scene.add(this.package.group);
      const destination = new THREE.Vector3(
        -center.x,
        0.09 - bounds.min.y,
        -center.z,
      );
      this.food.position.copy(destination).add(new THREE.Vector3(0, 3.4, 0));
      this.food.updateMatrixWorld(true);
      this.package.group.updateMatrixWorld(true);
      // Fit both the open lid and the lifted food before starting. No camera/zoom
      // change occurs while either object is travelling through the cavity.
      const envelope = new THREE.Box3()
        .setFromObject(this.package.group)
        .union(new THREE.Box3().setFromObject(this.food));
      const target = envelope.getCenter(new THREE.Vector3()),
        sphere = envelope.getBoundingSphere(new THREE.Sphere());
      const direction = this.camera.position
        .clone()
        .sub(new THREE.Vector3(0, 1, 0))
        .normalize();
      const distance =
        (sphere.radius /
          Math.sin(THREE.MathUtils.degToRad(this.camera.fov / 2)) /
          Math.min(1, this.camera.aspect)) *
        1.02;
      this.camera.position.copy(target).addScaledVector(direction, distance);
      this.camera.lookAt(target);
      // The camera direction is preserved, so the food envelope remains unchanged.
      this.pack = { time: 0, destination, sent: false, lastStage: "" };
      this.ready = true;
    } catch (e) {
      this.callbacks.onError(e);
    }
  }
  animatePacking(dt) {
    const state = this.pack;
    state.time += dt;
    const frame = packingFrame(state.time);
    this.package.group.position.x = -7 * (1 - frame.arrive);
    this.food.position.copy(state.destination);
    this.food.position.y += frame.lift;
    this.package.hinge.rotation.x = frame.hinge;
    for (const { pivot, sign } of this.package.flaps)
      pivot.rotation.z = sign * Math.PI * 0.44 * frame.fold;
    this.package.frontFlap.rotation.x = -Math.PI * 0.42 * frame.close;
    if (frame.stage !== state.lastStage) {
      state.lastStage = frame.stage;
      this.callbacks.onStage?.(frame.stage);
    }
    if (frame.done && !state.sent) {
      state.sent = true;
      this.callbacks.onPacked?.();
    }
  }

  clearFood() {
    for (const child of [...this.food.children]) {
      this.food.remove(child);
      this.disposeMesh(child);
    }
    this.base = null;
    this.top = null;
    this.fixedPatty = null;
  }
  disposeMesh(mesh) {
    mesh.traverse((o) => {
      o.geometry?.dispose();
      if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
      else o.material?.dispose();
    });
  }
  dispose() {
    this.disposed = true;
    this.foodVersion++;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.renderer.domElement.removeEventListener(
      "webglcontextlost",
      this.contextLost,
    );
    this.scene.traverse((o) => {
      if (o.isMesh) this.disposeMesh(o);
    });
    for (const promise of this.textures.values())
      promise.then(({ texture }) => texture.dispose()).catch(() => {});
    this.packPrint?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
