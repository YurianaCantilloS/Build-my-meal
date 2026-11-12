import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultBusiness, validateBusiness } from "../src/business.js";
import { totalOf } from "../src/menu.js";
import { assemblyLayout } from "../src/assembly.js";
import {
  fitPackage,
  packingFrame,
  packingDuration,
} from "../src/packingMotion.js";
test("Editing business prices updates base and toppings together without changing catalogue defaults", () => {
  const business = defaultBusiness();
  business.bases.pizza = 20000;
  business.toppings.cheese = 3500;
  assert.equal(totalOf("pizza", { cheese: 2, pepperoni: 1 }, business), 30500);
  assert.equal(totalOf("pizza", { cheese: 2, pepperoni: 1 }), 27500);
});
test("Settings accept free toppings but reject blank, negative, fractional, unsafe and nonnumeric prices", () => {
  for (const price of ["", -1, 1.2, Infinity, "oops", 10000000]) {
    const draft = defaultBusiness();
    draft.toppings.cheese = price;
    assert.equal(validateBusiness(draft).valid, false, String(price));
  }
  const draft = defaultBusiness();
  draft.name = "  Mi cocina  ";
  draft.toppings.cheese = "0";
  const result = validateBusiness(draft);
  assert.equal(result.valid, true);
  assert.equal(result.value.name, "Mi cocina");
  assert.equal(result.value.toppings.cheese, 0);
});
test("Pizza cheese stays below every topping even when added last or repeated nine times", () => {
  const recipe = {
    pepperoni: 2,
    onion: 1,
    mushroom: 1,
    basil: 1,
    bacon: 1,
    cheese: 9,
  };
  const { pieces } = assemblyLayout("pizza", recipe);
  const highestCheese = Math.max(
    ...pieces.filter((p) => p.id === "cheese").map((p) => p.y),
  );
  for (const p of pieces.filter((p) => p.id !== "cheese"))
    assert.ok(p.y > highestCheese + 0.04);
});
test("The package includes the entire food envelope with side and ceiling clearance", () => {
  for (const category of ["pizza", "burger", "hotdog"])
    for (const size of [
      { x: 4, y: 0.2, z: 4 },
      { x: 3.8, y: 5, z: 2 },
      { x: 4.6, y: 2, z: 2.5 },
    ]) {
      const box = fitPackage(category, size);
      assert.ok(box.w >= size.x + 0.79);
      assert.ok(box.d >= size.z + 0.79);
      assert.ok(box.bottom + box.lid >= size.y + 0.4);
    }
});
test("The lid cannot close before food placement finishes; animation ends with a fully closed lid", () => {
  for (let t = 0; t < packingDuration + 0.1; t += 0.01) {
    const frame = packingFrame(t);
    if (frame.close > 0) {
      assert.equal(frame.lower, 1);
      assert.equal(frame.arrive, 1);
    }
    assert.ok(frame.lift >= 0);
    assert.ok(Number.isFinite(frame.hinge));
  }
  assert.equal(packingDuration, 2.9);
  assert.equal(packingFrame(packingDuration - 0.01).done, false);
  const final = packingFrame(packingDuration);
  assert.equal(final.close, 1);
  assert.ok(Math.abs(final.hinge) < 1e-8);
  assert.equal(final.done, true);
});
