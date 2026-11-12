import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultBusiness, validateBusiness } from "../src/business.js";
import { itemIds, servedImage } from "../src/catalog.js";
import { totalOf, money } from "../src/menu.js";
import { assemblyLayout } from "../src/assembly.js";
test("Old name-and-price settings migrate without losing prices", () => {
  const old = {
    name: "Mi negocio",
    bases: { pizza: 25000, burger: 16000, hotdog: 14000 },
    toppings: defaultBusiness().toppings,
  };
  const result = validateBusiness(old);
  assert.ok(result.valid);
  assert.equal(result.value.currency, "COP");
  assert.equal(result.value.bases.pizza, 25000);
  assert.equal(Object.keys(result.value.catalog).length, 9);
  assert.equal(result.value.products.pizza.image, "/assets/pizza-base.webp");
});
test("New photographed toppings survive serialization and are available only on chosen products", () => {
  const business = defaultBusiness();
  business.catalog.custom_herb = {
    id: "custom_herb",
    name: "Albahaca especial",
    image: "/assets/basil.webp",
    appliedImage: "/assets/pizza-basil-applied.webp",
    categories: ["pizza"],
    custom: true,
  };
  business.toppings.custom_herb = 1800;
  const result = validateBusiness(JSON.parse(JSON.stringify(business)));
  assert.ok(result.valid);
  assert.ok(itemIds("pizza", result.value).includes("custom_herb"));
  assert.ok(!itemIds("burger", result.value).includes("custom_herb"));
  assert.equal(totalOf("pizza", { custom_herb: 2 }, result.value), 21600);
  const layer = assemblyLayout("pizza", { custom_herb: 1 }, result.value)
    .pieces[0];
  assert.equal(layer.asset, "/assets/pizza-basil-applied.webp");
  assert.ok(Number.isFinite(layer.y));
});
test("Currency accepts cents for USD but keeps whole pesos for COP", () => {
  const b = defaultBusiness();
  b.currency = "USD";
  b.bases.pizza = 12.5;
  b.toppings.basil = 1.25;
  assert.ok(validateBusiness(b).valid);
  assert.equal(totalOf("pizza", { basil: 1 }, b), 13.75);
  assert.match(money(13.75, "USD"), /13[,.]75/);
  b.currency = "COP";
  assert.equal(validateBusiness(b).valid, false);
});
test("Catalogue validates photos and category assignment", () => {
  const b = defaultBusiness();
  b.catalog.basil.image = "https://untrusted.example/photo.png";
  assert.equal(validateBusiness(b).valid, false);
  b.catalog.basil.image = "/assets/basil.webp";
  b.catalog.basil.categories = [];
  assert.equal(validateBusiness(b).valid, false);
});
test("Editing an original photo also updates its served representation unless a serving photo is selected", () => {
  const b = defaultBusiness();
  b.catalog.basil.image = "/assets/lettuce.webp";
  const result = validateBusiness(b);
  assert.ok(result.valid);
  assert.equal(
    servedImage("pizza", "basil", result.value),
    "/assets/lettuce.webp",
  );
  b.catalog.basil.appliedImage = "/assets/pizza-basil-applied.webp";
  assert.equal(
    servedImage("pizza", "basil", validateBusiness(b).value),
    "/assets/pizza-basil-applied.webp",
  );
});
