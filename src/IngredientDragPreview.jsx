import React from "react";
import { catalogOf, servedImage } from "./catalog.js";
export function IngredientDragPreview({ drag, category, business }) {
  if (!drag.ghost) return null;
  const { id, returning, landing } = drag.ghost,
    item = catalogOf(business)[id];
  if (!item) return null;
  const prepared = drag.over || landing;
  return (
    <div
      ref={drag.ghostRef}
      className={`drag-ghost ${prepared ? "prepared" : ""} ${returning ? "returning" : ""} ${landing ? "landing" : ""}`}
      style={{ transform: "translate3d(-1000px,-1000px,0)" }}
      aria-hidden="true"
    >
      <img className="drag-raw" src={item.image} alt="" />
      <img
        className={`drag-prepared ${category === "pizza" ? "pizza-prepared" : ""}`}
        src={servedImage(category, id, business)}
        alt=""
      />
    </div>
  );
}
