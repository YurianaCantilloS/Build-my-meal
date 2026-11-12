import React from "react";
import { ArrowRight, Package, Minus } from "@phosphor-icons/react";
import { money } from "./menu.js";
import { itemIds, catalogOf, productOf } from "./catalog.js";
import { currencies } from "./business.js";

export function Receipt({
  category,
  recipe,
  total,
  business,
  price,
  disabled,
  onCheckout,
  onRemove,
  checkoutRef,
}) {
  const config = productOf(category, business),
    catalog = catalogOf(business);
  const priceOf = (value) => money(value, business.currency);
  return (
    <aside
      className="receipt-column"
      tabIndex={-1}
      aria-label="Factura en tiempo real"
    >
      <div className="receipt-paper">
        {business.logo && (
          <img
            className="receipt-logo"
            src={business.logo}
            alt="Logo del negocio"
          />
        )}
        <div className="receipt-brand">{business.name}</div>
        <div className="receipt-subtitle">{business.slogan}</div>
        <div className="receipt-rule" />
        <div className="receipt-caption">
          <span>TICKET DE TU CREACIÓN</span>
          <strong># MD-001</strong>
        </div>
        <div className="receipt-product">
          <span>1 × {config.name} artesanal</span>
          <small>{config.subtitle}</small>
        </div>
        <div className="receipt-table-head">
          <span>CANT. / DESCRIPCIÓN</span>
          <span>VALOR</span>
        </div>
        <div className="receipt-base">
          <span>
            <b>1</b> {config.baseName}
          </span>
          <strong>{priceOf(business.bases[category])}</strong>
        </div>
        <div className="receipt-entries">
          {itemIds(category, business).map((id) => {
            const quantity = recipe[id] || 0,
              item = { ...catalog[id], price: business.toppings[id] };
            return (
              <div
                className={`receipt-entry ${quantity ? "present" : ""}`}
                aria-hidden={!quantity}
                key={`${category}-${id}`}
              >
                <div className="receipt-line">
                  <div>
                    <span className="receipt-quantity" key={quantity}>
                      {quantity}
                    </span>
                    <span>
                      {item.name}
                      <small>{priceOf(item.price)} / porción</small>
                    </span>
                  </div>
                  <strong key={quantity}>
                    {priceOf(item.price * quantity)}
                  </strong>
                  <button
                    className="receipt-remove"
                    tabIndex={quantity ? 0 : -1}
                    disabled={disabled || !quantity}
                    onClick={() => onRemove(id)}
                    aria-label={`Quitar una porción de ${item.name}`}
                  >
                    <Minus size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="receipt-rule" />
        <div className="receipt-subtotal">
          <span>Subtotal</span>
          <span>{priceOf(total)}</span>
        </div>
        <div className="receipt-subtotal">
          <span>Cargos adicionales</span>
          <span>{priceOf(0)}</span>
        </div>
        <div className="receipt-total">
          <div>
            <span>TOTAL</span>
            <small>
              {currencies[business.currency]} · {business.currency}
            </small>
          </div>
          {price}
          <span className="sr-only" aria-live="polite">
            Total: {priceOf(total)} {business.currency}
          </span>
        </div>
        <div className="receipt-rule" />
        <p className="receipt-thanks">
          Buena comida. Cero reglas.
          <br />
          <strong>Gracias por ponerle tu toque.</strong>
        </p>
        <div className="receipt-stamp">PEDIDO DE DEMOSTRACIÓN</div>
      </div>
      <button
        ref={checkoutRef}
        className="checkout-button"
        disabled={disabled}
        onClick={onCheckout}
      >
        <Package size={20} />
        <span>Empacar y pedir</span>
        <ArrowRight size={20} weight="bold" />
      </button>
      <p className="demo-label">
        Sin cobros reales. La factura es una simulación.
      </p>
    </aside>
  );
}
