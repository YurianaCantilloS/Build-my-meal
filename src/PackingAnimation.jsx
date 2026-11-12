import React, { useEffect, useRef, useState } from "react";
import { Package, Check } from "@phosphor-icons/react";
import { FoodScene } from "./scene.js";
export function PackingAnimation({
  category,
  recipe,
  business,
  onComplete,
  onError,
}) {
  const host = useRef(),
    dialog = useRef(),
    callbacks = useRef();
  callbacks.current = { onComplete, onError };
  const [stage, setStage] = useState("Preparando el empaque…");
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    dialog.current?.focus();
    let engine;
    try {
      engine = new FoodScene(host.current, {
        onReady: () => engine.startPacking(business),
        onPacked: () => callbacks.current.onComplete(),
        onStage: (text) => {
          setStage(text);
          setVisible(true);
        },
        onError: (e) => callbacks.current.onError(e),
      });
      engine.update({
        category,
        recipe,
        business,
        phase: "build",
        reduced: false,
      });
    } catch (e) {
      callbacks.current.onError(e);
    }
    return () => engine?.dispose();
  }, []);
  return (
    <div
      ref={dialog}
      tabIndex={-1}
      className="packing-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="packing-title"
    >
      <div className="packing-heading">
        <span className="step-index">{business.slogan}</span>
        <h2 id="packing-title">
          <Package size={25} />
          Un último toque.
        </h2>
        <p role="status">{stage}</p>
      </div>
      <div
        ref={host}
        className={`packing-viewport ${visible ? "" : "pending"}`}
        role="img"
        aria-label="La comida entra completa en su caja y la tapa se cierra"
      />
      <div className="packing-footer">
        <Check size={16} /> Tu receta, tal como la elegiste.
      </div>
    </div>
  );
}
