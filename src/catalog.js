import { categories, ingredients } from "./menu.js";
import { appliedAsset } from "./appliedAssets.js";
export const assetURL = (value) =>
  value?.startsWith("data:image/") || value?.startsWith("/assets/")
    ? value
    : `/assets/${value}.webp`;
export const defaultCatalog = () =>
  Object.fromEntries(
    Object.entries(ingredients).map(([id, item]) => [
      id,
      {
        id,
        name: item.name,
        image: assetURL(item.image),
        appliedImage: "",
        prepared: Object.fromEntries(
          Object.keys(categories)
            .filter((c) => categories[c].items.includes(id))
            .map((c) => [c, assetURL(appliedAsset(c, id))]),
        ),
        categories: Object.keys(categories).filter((c) =>
          categories[c].items.includes(id),
        ),
        custom: false,
      },
    ]),
  );
const initialCatalog = defaultCatalog();
export const catalogOf = (business) => business?.catalog || initialCatalog;
export function itemIds(category, business) {
  const catalog = catalogOf(business);
  return [
    ...categories[category].items,
    ...Object.keys(catalog).filter(
      (id) => !categories[category].items.includes(id),
    ),
  ].filter((id) => catalog[id]?.categories.includes(category));
}
export const servedImage = (category, id, business) => {
  const item = catalogOf(business)[id];
  return item?.appliedImage || item?.prepared?.[category] || item?.image;
};
export const productOf = (category, business) => ({
  ...categories[category],
  ...(business?.products?.[category] || {}),
});
