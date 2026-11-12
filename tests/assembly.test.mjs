import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { assemblyLayout } from "../src/assembly.js";
import { createPackaging, packageDimensions } from "../src/packaging.js";

test("Hot dog cheese, lettuce and bacon are full coherent portions rather than five small stickers", () => {
  const { pieces } = assemblyLayout("hotdog", {
    cheese: 1,
    lettuce: 1,
    bacon: 1,
  });
  assert.equal(pieces.length, 3);
  for (const p of pieces) {
    assert.ok(p.width > 3);
    assert.ok(p.asset.startsWith("hotdog-"));
  }
});
test("A second hot dog portion adds one full portion and preserves the first", () => {
  const first = assemblyLayout("hotdog", { cheese: 1 }).pieces;
  const second = assemblyLayout("hotdog", { cheese: 2 }).pieces;
  assert.equal(second.length, 2);
  assert.deepEqual(second[0], first[0]);
});
test("Adding another pizza ingredient never reshuffles existing toppings", () => {
  const before = assemblyLayout("pizza", { pepperoni: 1, basil: 1 }).pieces;
  const after = assemblyLayout("pizza", {
    pepperoni: 1,
    basil: 1,
    onion: 1,
  }).pieces;
  for (const p of before)
    assert.deepEqual(
      after.find((q) => q.key === p.key),
      p,
    );
});
test("Extra pizza cheese uses a single melted layer, not small yellow squares", () => {
  const { pieces } = assemblyLayout("pizza", { cheese: 1 });
  assert.equal(pieces.length, 1);
  assert.equal(pieces[0].asset, "pizza-cheese");
  assert.ok(pieces[0].width > 4);
});
test("Packaging has an empty food cavity when open and a real closing lid", () => {
  for (const category of ["pizza", "burger", "hotdog"]) {
    const model = createPackaging(category, {
      cardboard: new THREE.Texture(),
      print: new THREE.Texture(),
    });
    model.group.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(
      new THREE.Vector3(0, 5, 0),
      new THREE.Vector3(0, -1, 0),
    );
    const openHit = ray.intersectObject(model.group, true)[0];
    assert.ok(openHit, category);
    assert.ok(
      openHit.point.y < 0.1,
      `${category}: the food cavity must reach the bottom instead of a solid block`,
    );
    model.hinge.rotation.x = 0;
    model.group.updateMatrixWorld(true);
    const closedHit = ray.intersectObject(model.group, true)[0];
    const expected =
      packageDimensions[category].bottom + packageDimensions[category].lid;
    assert.ok(
      Math.abs(closedHit.point.y - expected) < 0.06,
      `${category}: lid must close at the tray's actual crown`,
    );
  }
  assert.ok(packageDimensions.hotdog.w / packageDimensions.hotdog.d > 2);
  assert.ok(packageDimensions.burger.w < packageDimensions.pizza.w);
});

test("Onion and mushrooms use prepared portions sized to the food, distinct from the raw thumbnail", () => {
  for (const category of ["pizza", "hotdog"]) {
    const { pieces } = assemblyLayout(category, { onion: 1, mushroom: 1 });
    assert.equal(pieces.length, 2);
    for (const p of pieces) {
      assert.equal(p.asset, category + "-" + p.id + "-applied");
      assert.ok(p.width > 3.5);
    }
  }
  assert.equal(
    assemblyLayout("burger", { onion: 1 }).pieces[0].asset,
    "burger-onion-applied",
  );
});
