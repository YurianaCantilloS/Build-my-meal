import { test } from "node:test";
import assert from "node:assert/strict";
import { freshRecipes, totalOf } from "../src/menu.js";
import { spring } from "../src/motion.js";
test("The three starting recipes have the expected final COP prices", () => {
  const recipes = freshRecipes();
  assert.equal(totalOf("pizza", recipes.pizza), 18000);
  assert.equal(totalOf("burger", recipes.burger), 11000);
  assert.equal(totalOf("hotdog", recipes.hotdog), 12000);
});
test("Adding and removing multiple portions restores the original price", () => {
  const recipe = freshRecipes().pizza,
    original = totalOf("pizza", recipe);
  recipe.pepperoni = 2;
  recipe.mushroom = 3;
  assert.equal(totalOf("pizza", recipe), original + 7000 + 7500);
  recipe.pepperoni -= 2;
  recipe.mushroom = 0;
  assert.equal(totalOf("pizza", recipe), original);
});
test("Recipes are independent; switching and editing one never changes another", () => {
  const recipes = freshRecipes();
  recipes.burger.cheese = 3;
  assert.equal(totalOf("pizza", recipes.pizza), 18000);
  assert.equal(totalOf("hotdog", recipes.hotdog), 12000);
  assert.equal(freshRecipes().burger.cheese, undefined);
});
test("Physical spring settles without numerical instability at 30, 60 and 120 Hz", () => {
  for (const fps of [30, 60, 120]) {
    let position = 5,
      velocity = 0;
    for (let i = 0; i < fps * 5; i++) {
      [position, velocity] = spring(position, velocity, 1, 1 / fps);
      assert.ok(Number.isFinite(position));
      assert.ok(Math.abs(position) < 10);
    }
    assert.ok(Math.abs(position - 1) < 0.0001);
    assert.ok(Math.abs(velocity) < 0.0001);
  }
});

test("The physical trajectory is identical across frame rates and irregular frames", () => {
  for (const damping of [18, 30, 45]) {
    let reference = spring(4, -2, 1, 1, 210, damping);
    for (const fps of [30, 60, 120]) {
      let x = 4,
        v = -2;
      for (let i = 0; i < fps; i++)
        [x, v] = spring(x, v, 1, 1 / fps, 210, damping);
      assert.ok(Math.abs(x - reference[0]) < 1e-10);
      assert.ok(Math.abs(v - reference[1]) < 1e-10);
    }
  }
});
