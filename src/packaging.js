import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export const packageDimensions = {
  pizza: { w: 5.45, d: 5.45, bottom: 0.32, lid: 0.12, label: "Caja de pizza" },
  burger: {
    w: 3.9,
    d: 3.7,
    bottom: 0.68,
    lid: 1.05,
    label: "Estuche de hamburguesa",
  },
  hotdog: {
    w: 5.8,
    d: 2.7,
    bottom: 0.48,
    lid: 0.7,
    label: "Estuche alargado de hot dog",
  },
};

// A hollow tapered tray and a separately hinged hollow lid. There is no solid
// cube occupying the food cavity. Every panel has real thickness or a fold seam.
export function createPackaging(
  category,
  { cardboard, print, dimensions: customDimensions },
) {
  const dimensions = { ...packageDimensions[category], ...customDimensions },
    { w, d, bottom, lid } = dimensions;
  const group = new THREE.Group(),
    hinge = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    map: cardboard,
    color: 0xead7b9,
    roughness: 0.93,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  function solid(
    width,
    height,
    depth,
    x,
    y,
    z,
    parent = group,
    radius = 0.035,
  ) {
    const mesh = new THREE.Mesh(
      new RoundedBoxGeometry(
        width,
        height,
        depth,
        2,
        Math.min(radius, height * 0.4, depth * 0.1),
      ),
      material,
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function quad(points, parent = group) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points.flat(), 3),
    );
    geometry.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2),
    );
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  const inset = category === "pizza" ? 0.04 : 0.18,
    loW = w - inset * 2,
    loD = d - inset * 2;
  solid(loW, 0.045, loD, 0, 0, 0);
  quad([
    [-loW / 2, 0.025, loD / 2],
    [loW / 2, 0.025, loD / 2],
    [w / 2, bottom, d / 2],
    [-w / 2, bottom, d / 2],
  ]);
  quad([
    [loW / 2, 0.025, -loD / 2],
    [-loW / 2, 0.025, -loD / 2],
    [-w / 2, bottom, -d / 2],
    [w / 2, bottom, -d / 2],
  ]);
  quad([
    [-loW / 2, 0.025, -loD / 2],
    [-loW / 2, 0.025, loD / 2],
    [-w / 2, bottom, d / 2],
    [-w / 2, bottom, -d / 2],
  ]);
  quad([
    [loW / 2, 0.025, loD / 2],
    [loW / 2, 0.025, -loD / 2],
    [w / 2, bottom, -d / 2],
    [w / 2, bottom, d / 2],
  ]);
  // Narrow rolled edges give the open tray a credible paper-board thickness.
  solid(w, 0.035, 0.035, 0, bottom, d / 2);
  solid(0.035, 0.035, d, -w / 2, bottom, 0);
  solid(0.035, 0.035, d, w / 2, bottom, 0);
  hinge.position.set(0, bottom, -d / 2);
  hinge.rotation.x = -Math.PI * 0.88;
  group.add(hinge);
  const bevel =
      category === "pizza" ? 0.035 : category === "burger" ? 0.24 : 0.12,
    topW = w - bevel * 2,
    topD = d - bevel * 2;
  // Closed coordinates: lid's lower rim is at the tray lip; its crown is above it.
  quad(
    [
      [-w / 2, 0, d],
      [w / 2, 0, d],
      [topW / 2, lid, d - bevel],
      [-topW / 2, lid, d - bevel],
    ],
    hinge,
  );
  quad(
    [
      [w / 2, 0, 0],
      [-w / 2, 0, 0],
      [-topW / 2, lid, bevel],
      [topW / 2, lid, bevel],
    ],
    hinge,
  );
  quad(
    [
      [-w / 2, 0, 0],
      [-w / 2, 0, d],
      [-topW / 2, lid, d - bevel],
      [-topW / 2, lid, bevel],
    ],
    hinge,
  );
  quad(
    [
      [w / 2, 0, d],
      [w / 2, 0, 0],
      [topW / 2, lid, bevel],
      [topW / 2, lid, d - bevel],
    ],
    hinge,
  );
  solid(topW, 0.045, topD, 0, lid, d / 2, hinge);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(topW - 0.035, topD - 0.035),
    new THREE.MeshStandardMaterial({
      map: print,
      roughness: 0.95,
      color: 0xffefda,
    }),
  );
  label.rotation.x = -Math.PI / 2;
  label.position.set(0, lid + 0.026, d / 2);
  hinge.add(label);
  const flaps = [];
  for (const sign of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set((sign * w) / 2, bottom, 0);
    group.add(pivot);
    solid(
      category === "pizza" ? 0.36 : 0.24,
      0.025,
      d - 0.1,
      -sign * (category === "pizza" ? 0.18 : 0.12),
      0,
      0,
      pivot,
    );
    flaps.push({ pivot, sign });
  }
  const frontFlap = new THREE.Group();
  frontFlap.position.set(0, 0, d);
  hinge.add(frontFlap);
  solid(w * 0.7, 0.19, 0.025, 0, -0.095, 0, frontFlap, 0.01);
  return {
    group,
    hinge,
    flaps,
    frontFlap,
    dimensions: { ...dimensions, h: bottom + lid },
  };
}
