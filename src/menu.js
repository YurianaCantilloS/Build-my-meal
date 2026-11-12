export const money = (n, currency = "COP") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    ...(["COP", "CLP"].includes(currency) ? { maximumFractionDigits: 0 } : {}),
  }).format(n);
const ingredient = (id, name, price, image, color) => ({
  id,
  name,
  price,
  image,
  color,
});
export const ingredients = {
  pepperoni: ingredient("pepperoni", "Pepperoni", 3500, "pepperoni", "#ab3026"),
  mushroom: ingredient("mushroom", "Champiñones", 2500, "mushroom", "#c8b299"),
  basil: ingredient("basil", "Albahaca", 1500, "basil", "#628245"),
  cheese: ingredient("cheese", "Extra queso", 3000, "cheese", "#e5ba43"),
  onion: ingredient("onion", "Cebolla morada", 1500, "onion", "#a66c8a"),
  bacon: ingredient("bacon", "Tocineta", 4000, "bacon", "#ac5141"),
  patty: ingredient("patty", "Carne a la parrilla", 6500, "patty", "#75472d"),
  lettuce: ingredient("lettuce", "Lechuga fresca", 1500, "lettuce", "#81a951"),
  tomato: ingredient("tomato", "Tomate", 1500, "tomato", "#ca4533"),
};
export const categories = {
  pizza: {
    name: "Pizza",
    plural: "pizzas",
    subtitle: "Masa artesanal · 28 cm",
    base: 18000,
    baseName: "Base con mozzarella",
    image: "pizza-base",
    items: ["pepperoni", "mushroom", "basil", "cheese", "onion", "bacon"],
    initial: {},
    headline: ["Una pizza.", "Mil posibilidades."],
    description: "Un toque de aquí. Un poquito de allá. Toda tuya.",
  },
  burger: {
    name: "Hamburguesa",
    plural: "hamburguesas",
    subtitle: "Pan brioche · carne de res",
    base: 11000,
    baseName: "Brioche + carne de res",
    image: "burger-bottom",
    items: ["patty", "cheese", "lettuce", "tomato", "bacon", "onion"],
    initial: {},
    headline: ["Capa a capa.", "A tu manera."],
    description: "Más queso, más carácter. Construye tu favorita.",
  },
  hotdog: {
    name: "Hot dog",
    plural: "hot dogs",
    subtitle: "Brioche suave · salchicha premium",
    base: 12000,
    baseName: "Brioche + salchicha",
    image: "hotdog-base",
    items: ["cheese", "bacon", "onion", "tomato", "lettuce", "mushroom"],
    initial: {},
    headline: ["Un clásico.", "Tu gran versión."],
    description: "El antojo de siempre, con tu firma personal.",
  },
};
export const totalOf = (category, recipe, pricing) =>
  (pricing?.bases[category] ?? categories[category].base) +
  Object.entries(recipe).reduce(
    (sum, [id, count]) =>
      sum + (pricing?.toppings[id] ?? ingredients[id]?.price ?? 0) * count,
    0,
  );
export const freshRecipes = () =>
  Object.fromEntries(
    Object.entries(categories).map(([id, c]) => [id, { ...c.initial }]),
  );
