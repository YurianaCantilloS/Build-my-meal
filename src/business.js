import { categories, ingredients } from "./menu.js";
import { defaultCatalog } from "./catalog.js";
export const SETTINGS_KEY = "mordida-business-v1";
export const currencies = {
  COP: "Pesos colombianos",
  USD: "Dólares estadounidenses",
  EUR: "Euros",
  MXN: "Pesos mexicanos",
  PEN: "Soles peruanos",
  CLP: "Pesos chilenos",
  ARS: "Pesos argentinos",
  BRL: "Reales brasileños",
};
export const currencyDigits = (currency) =>
  ["COP", "CLP"].includes(currency)
    ? 0
    : new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency,
      }).resolvedOptions().maximumFractionDigits;
export const defaultBusiness = () => ({
  version: 2,
  name: "mordida.",
  slogan: "HECHO A TU ANTOJO",
  logo: "",
  currency: "COP",
  bases: Object.fromEntries(
    Object.entries(categories).map(([id, c]) => [id, c.base]),
  ),
  toppings: Object.fromEntries(
    Object.entries(ingredients).map(([id, c]) => [id, c.price]),
  ),
  products: Object.fromEntries(
    Object.entries(categories).map(([id, c]) => [
      id,
      { name: c.name, baseName: c.baseName, image: `/assets/${c.image}.webp` },
    ]),
  ),
  catalog: defaultCatalog(),
});
export const isImageSource = (value) =>
  typeof value === "string" &&
  (value === "" ||
    /^\/assets\/[a-z0-9-]+\.webp$/.test(value) ||
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value));
export function validateBusiness(input = {}) {
  const value = defaultBusiness(),
    errors = {};
  value.name = String(input.name || "").trim();
  value.slogan = String(input.slogan ?? value.slogan).trim();
  value.logo = input.logo ?? "";
  value.currency = input.currency ?? "COP";
  if (!value.name || value.name.length > 32)
    errors.name = "Escribe un nombre de 1 a 32 caracteres.";
  if (value.slogan.length > 80)
    errors.slogan = "Usa un eslogan de hasta 80 caracteres.";
  if (!currencies[value.currency]) {
    errors.currency = "Selecciona una moneda disponible.";
    value.currency = "COP";
  }
  if (!isImageSource(value.logo))
    errors.logo = "Usa una imagen PNG, JPG o WebP.";
  const candidate = input.catalog ?? defaultCatalog();
  value.catalog = {};
  if (Object.keys(candidate).length > 40)
    errors.catalog = "Puedes guardar hasta 40 toppings.";
  for (const [id, item] of Object.entries(candidate)) {
    if (!/^[a-z0-9_-]{1,65}$/.test(id)) {
      errors.catalog = "Identificador de topping inválido.";
      continue;
    }
    const name = String(item.name || "").trim(),
      assigned = (item.categories || []).filter((c) => categories[c]);
    if (!name || name.length > 40)
      errors["catalog." + id] =
        "Cada topping necesita un nombre de hasta 40 caracteres.";
    if (!assigned.length)
      errors["catalog." + id] = "Selecciona al menos un producto.";
    if (
      !item.image ||
      !isImageSource(item.image) ||
      !isImageSource(item.appliedImage || "")
    )
      errors["catalog." + id] = "Añade una foto válida al topping.";
    const original = defaultCatalog()[id];
    const prepared = item.image === original?.image ? original.prepared : {};
    value.catalog[id] = {
      id,
      name,
      image: item.image,
      appliedImage: item.appliedImage || "",
      prepared,
      categories: [...new Set(assigned)],
      custom: !ingredients[id],
    };
  }
  const precision = 10 ** currencyDigits(value.currency);
  const validPrice = (raw) =>
    raw !== "" &&
    raw != null &&
    Number.isFinite(Number(raw)) &&
    Number(raw) >= 0 &&
    Number(raw) <= 9999999 &&
    Math.abs(Number(raw) * precision - Math.round(Number(raw) * precision)) <
      1e-6;
  for (const group of ["bases", "toppings"]) {
    const ids =
      group === "bases" ? Object.keys(categories) : Object.keys(value.catalog);
    value[group] = {};
    for (const id of ids) {
      const raw = input[group]?.[id];
      if (!validPrice(raw))
        errors[group + "." + id] =
          `Precio inválido: usa de 0 a 9.999.999, con ${currencyDigits(value.currency)} decimales como máximo.`;
      else value[group][id] = Number(raw);
    }
  }
  for (const id of Object.keys(categories)) {
    const product = { ...value.products[id], ...input.products?.[id] };
    product.name = String(product.name || "").trim();
    product.baseName = String(product.baseName || "").trim();
    if (
      !product.name ||
      product.name.length > 32 ||
      !product.baseName ||
      product.baseName.length > 60
    )
      errors["products." + id] = "Completa los nombres del producto y su base.";
    if (!isImageSource(product.image) || !product.image)
      errors["products." + id] = "Selecciona una imagen de base válida.";
    value.products[id] = product;
  }
  if (JSON.stringify(value).length > 4000000)
    errors.storage =
      "Las fotos ocupan demasiado espacio. Usa imágenes más pequeñas o elimina toppings que no utilices.";
  return { value, errors, valid: Object.keys(errors).length === 0 };
}
export function loadBusiness() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (raw) {
      const checked = validateBusiness(raw);
      if (checked.valid) return checked.value;
    }
  } catch {}
  return defaultBusiness();
}
