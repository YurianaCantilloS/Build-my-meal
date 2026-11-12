export const appliedAssets = {
  pizza: {
    pepperoni: "pizza-pepperoni-applied",
    mushroom: "pizza-mushroom-applied",
    onion: "pizza-onion-applied",
    basil: "pizza-basil-applied",
    bacon: "pizza-bacon-applied",
    cheese: "pizza-cheese",
  },
  hotdog: {
    cheese: "hotdog-cheese",
    bacon: "hotdog-bacon",
    lettuce: "hotdog-lettuce",
    onion: "hotdog-onion-applied",
    mushroom: "hotdog-mushroom-applied",
    tomato: "hotdog-tomato-applied",
  },
  burger: {
    cheese: "burger-cheese",
    onion: "burger-onion-applied",
    patty: "patty",
    lettuce: "lettuce",
    tomato: "tomato",
    bacon: "bacon",
  },
};
export const appliedAsset = (category, id) => appliedAssets[category][id];
