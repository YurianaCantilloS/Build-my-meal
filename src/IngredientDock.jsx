import React, { useEffect, useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { money } from "./menu.js";
import { catalogOf, itemIds, servedImage } from "./catalog.js";
export function IngredientDock({
  category,
  recipe,
  disabled,
  drag,
  business,
  onAdd,
}) {
  const [compact, setCompact] = useState(
    () => matchMedia("(max-width:1000px)").matches,
  );
  useEffect(() => {
    const query = matchMedia("(max-width:1000px)"),
      fn = (e) => setCompact(e.matches);
    query.addEventListener("change", fn);
    return () => query.removeEventListener("change", fn);
  }, []);
  useEffect(() => {
    for (const id of itemIds(category, business)) {
      const image = new Image();
      image.src = servedImage(category, id, business);
      image.decode().catch(() => {});
    }
  }, [category, business]);
  const catalog = catalogOf(business),
    ids = itemIds(category, business);
  return (
    <section className="ingredient-dock" aria-label="Elige tus toppings">
      <div className="dock-simple-label">
        <div>
          <span>Toppings</span>
          <small>
            {compact
              ? "Toca para agregar. Repite si quieres más."
              : "Arrastra o haz clic para agregar."}
          </small>
        </div>
        <span className="dock-count">{ids.length} opciones</span>
      </div>
      <div className="ingredient-rail">
        {ids.map((id) => {
          const item = catalog[id],
            quantity = recipe[id] || 0;
          return (
            <button
              key={`${category}-${id}`}
              className={`topping-chip ${quantity ? "has-portions" : ""} ${drag.ghost?.id === id ? "being-dragged" : ""}`}
              disabled={disabled || quantity >= 9}
              aria-label={`${compact ? "Agregar" : "Arrastrar o agregar"} ${item.name}`}
              {...(compact
                ? { onClick: () => onAdd(id, 1) }
                : drag.handlers(id))}
            >
              <img src={item.image} alt="" draggable="false" />
              <span>
                {item.name}
                <small>
                  + {money(business.toppings[id], business.currency)}
                </small>
              </span>
              <i className="topping-add" aria-hidden="true">
                {quantity || <Plus size={13} />}
              </i>
            </button>
          );
        })}
      </div>
      {!ids.length && (
        <p className="catalog-empty">
          Todavía no hay toppings para este producto. Añádelos desde Ajustes.
        </p>
      )}
    </section>
  );
}
