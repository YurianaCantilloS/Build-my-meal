import { categories } from "./menu.js";
import { clamp } from "./motion.js";
import { servedImage, itemIds } from "./catalog.js";

// Each portion is a prepared food layer, never a repeated thumbnail sprite.
export function assemblyLayout(category, recipe, business) {
  const available = itemIds(category, business);
  const preferred =
    category === "hotdog"
      ? ["lettuce", "cheese", "bacon", "tomato", "onion", "mushroom"]
      : category === "pizza"
        ? ["cheese", "pepperoni", "mushroom", "basil", "onion", "bacon"]
        : categories[category].items;
  const ordered = [
    ...preferred,
    ...available.filter((id) => !preferred.includes(id)),
  ].filter((id) => available.includes(id));
  const count = ordered.reduce((sum, id) => sum + (recipe[id] || 0), 0);
  const spacing = clamp(0.2 - Math.max(0, count - 5) * 0.008, 0.08, 0.2);
  const pieces = [];
  let layer = 0;
  ordered.forEach((id, index) => {
    for (let portion = 0; portion < (recipe[id] || 0); portion++) {
      let x = 0,
        y,
        z = 0,
        width,
        rotation = 0,
        billboard = false,
        curve = 0;
      if (category === "pizza") {
        y =
          id === "cheese"
            ? 0.16 + portion * 0.003
            : 0.25 + index * 0.02 + portion * 0.003;
        width = id === "cheese" ? 4.13 : 4.0;
        rotation = portion * 0.48;
        curve = 0.018;
      } else if (category === "hotdog") {
        x = portion * 0.018;
        y = 1.23 + index * 0.038 + portion * 0.025;
        z = 0.12 + index * 0.045 + portion * 0.025;
        width = id === "lettuce" ? 3.85 : id === "cheese" ? 3.72 : 3.58;
        rotation = portion * 0.012;
        billboard = true;
        curve = 0.025;
      } else {
        y = 1.43 + layer * spacing;
        z = 0.15 + layer * 0.025;
        width =
          id === "patty"
            ? 3.45
            : id === "onion"
              ? 3.3
              : id === "tomato"
                ? 2.95
                : id === "bacon"
                  ? 3.4
                  : 3.65;
        billboard = id === "patty" || id === "onion";
        curve = id === "cheese" ? 0.2 : id === "lettuce" ? 0.08 : 0;
        layer++;
      }
      pieces.push({
        key: id + "-" + portion + "-0",
        id,
        x,
        y,
        z,
        width,
        rotation,
        asset: business
          ? servedImage(category, id, business)
          : servedImage(category, id)
              .replace("/assets/", "")
              .replace(".webp", ""),
        billboard,
        curve,
        tilt: 0,
        layerIndex: category === "burger" ? layer - 1 : 0,
        delay: 0,
      });
    }
  });
  return { pieces, layerCount: layer, spacing };
}
