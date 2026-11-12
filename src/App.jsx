import React, { useEffect, useRef, useState } from "react";
import {
  Pizza,
  Hamburger,
  Bread,
  SpeakerHigh,
  SpeakerSlash,
  Plus,
  ArrowRight,
  ArrowCounterClockwise,
  Check,
  GearSix,
} from "@phosphor-icons/react";
import {
  categories,
  ingredients,
  money,
  totalOf,
  freshRecipes,
} from "./menu.js";
import { setSound, playSound } from "./audio.js";
import { FoodScene } from "./scene.js";
import { IngredientDragPreview } from "./IngredientDragPreview.jsx";
import { IngredientDock } from "./IngredientDock.jsx";
import { Receipt } from "./Receipt.jsx";
import { MobileInvoiceLink } from "./MobileInvoiceLink.jsx";
import { useIngredientDrag } from "./useIngredientDrag.js";
import { SettingsPanel } from "./SettingsPanel.jsx";
import { PackingAnimation } from "./PackingAnimation.jsx";
import { loadBusiness, SETTINGS_KEY } from "./business.js";
import { catalogOf, itemIds, productOf } from "./catalog.js";
const icons = { pizza: Pizza, burger: Hamburger, hotdog: Bread };
function AnimatedPrice({ value, reduced, currency = "COP" }) {
  const ref = useRef(null),
    current = useRef(value);
  useEffect(() => {
    let frame;
    const from = current.current,
      start = performance.now();
    const animate = (now) => {
      const t = reduced ? 1 : Math.min(1, (now - start) / 470);
      current.current = from + (value - from) * (1 - Math.pow(1 - t, 4));
      if (ref.current)
        ref.current.textContent = money(current.current, currency);
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, reduced, currency]);
  return (
    <span ref={ref} aria-hidden="true">
      {money(current.current, currency)}
    </span>
  );
}
function Scene({
  category,
  recipe,
  phase,
  reduced,
  drop,
  business,
  onReady,
  onError,
}) {
  const host = useRef(),
    engine = useRef(),
    latest = useRef();
  latest.current = { category, recipe, phase, reduced, drop, business };
  const callbacks = useRef();
  callbacks.current = { onReady, onError };
  useEffect(() => {
    try {
      engine.current = new FoodScene(host.current, {
        onReady: () => callbacks.current.onReady(),
        onError: (e) => callbacks.current.onError(e),
      });
      engine.current.update(latest.current);
    } catch (e) {
      callbacks.current.onError(e);
    }
    return () => {
      engine.current?.dispose();
      engine.current = null;
    };
  }, [FoodScene]);
  useEffect(() => {
    engine.current?.update({
      category,
      recipe,
      phase,
      reduced,
      drop,
      business,
    });
  }, [category, recipe, phase, reduced, drop, business]);
  return (
    <div
      className="scene-canvas"
      ref={host}
      role="img"
      aria-label={`Vista interactiva: ${productOf(category, business).name} con ${Object.entries(
        recipe,
      )
        .filter(([, n]) => n > 0)
        .map(([id, n]) => `${n} ${catalogOf(business)[id]?.name || id}`)
        .join(", ")}`}
    />
  );
}
export function App() {
  const [category, setCategory] = useState("pizza"),
    [recipes, setRecipes] = useState(freshRecipes),
    [sound, setSoundState] = useState(false),
    [phase, setPhase] = useState("build"),
    [ready, setReady] = useState(false),
    [sceneError, setSceneError] = useState(false),
    [business, setBusiness] = useState(loadBusiness),
    [settingsOpen, setSettingsOpen] = useState(false),
    [order, setOrder] = useState(null),
    [notice, setNotice] = useState(""),
    [drop, setDrop] = useState(null);
  const reduced = false,
    recipe = recipes[category],
    config = productOf(category, business),
    catalog = catalogOf(business),
    total = totalOf(category, recipe, business);
  const noticeTimer = useRef(),
    checkoutRef = useRef(),
    kitchenRef = useRef();
  const dropSequence = useRef(0);
  const drag = useIngredientDrag({
    zone: () => kitchenRef.current?.querySelector(".scene-canvas"),
    canAdd: (id) =>
      phase === "build" && ready && !sceneError && (recipe[id] || 0) < 9,
    onAdd: (id, origin) => changeIngredient(id, 1, origin),
    reduced,
  });
  useEffect(() => {
    document.title = business.name + " — Tu antojo, tus reglas";
  }, [business.name]);
  useEffect(() => () => clearTimeout(noticeTimer.current), []);
  useEffect(() => {
    const fn = (e) => {
      const b = e.target.closest("button");
      if (b) {
        const r = b.getBoundingClientRect();
        b.style.setProperty("--mx", `${e.clientX - r.left}px`);
        b.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
    };
    document.addEventListener("pointermove", fn, { passive: true });
    return () => document.removeEventListener("pointermove", fn);
  }, []);
  function announce(text) {
    setNotice(text);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 2200);
  }
  function changeIngredient(id, delta, origin) {
    if (
      phase !== "build" ||
      !catalog[id] ||
      !itemIds(category, business).includes(id)
    )
      return;
    const next = Math.max(0, Math.min(9, (recipe[id] || 0) + delta));
    if (next === (recipe[id] || 0)) return;
    if (delta > 0)
      setDrop({
        sequence: ++dropSequence.current,
        id,
        clientX: origin?.x,
        clientY: origin?.y,
      });
    setRecipes((previous) => ({
      ...previous,
      [category]: { ...previous[category], [id]: next },
    }));
    playSound(delta > 0 ? "drop" : "click");
    announce(
      delta > 0
        ? `${catalog[id].name} · ¡buen toque!`
        : `Quitaste ${catalog[id].name.toLowerCase()}`,
    );
  }
  function switchCategory(id) {
    if (phase !== "build" || id === category) return;
    playSound();
    drag.cancel();
    setCategory(id);
    setReady(false);
  }
  function reset() {
    setDrop(null);
    setRecipes((previous) => ({
      ...previous,
      [category]: { ...config.initial },
    }));
    playSound();
    announce("Una base fresca para volver a crear.");
  }
  function checkout() {
    if (phase !== "build" || !ready || sceneError) return;
    setNotice("");
    clearTimeout(noticeTimer.current);
    window.scrollTo({ top: 0, behavior: "instant" });
    setOrder({
      category,
      name: config.name,
      recipe: { ...recipe },
      total,
      currency: business.currency,
      number: `MD-${String(Date.now()).slice(-5)}`,
    });
    drag.cancel();
    setPhase("packing");
    playSound();
  }
  function restart() {
    setPhase("build");
    setOrder(null);
    announce("La cocina es tuya otra vez.");
    requestAnimationFrame(() => {
      document
        .querySelector(".category-tab.selected")
        ?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
    });
  }
  function saveBusiness(value) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(value));
    } catch {
      return "No pudimos guardar las fotos. Reduce su tamaño o elimina imágenes que no uses.";
    }
    drag.cancel();
    setDrop(null);
    setSceneError(false);
    setReady(false);
    setRecipes((previous) =>
      Object.fromEntries(
        Object.entries(previous).map(([category, recipe]) => [
          category,
          Object.fromEntries(
            Object.entries(recipe).filter(([id]) =>
              itemIds(category, value).includes(id),
            ),
          ),
        ]),
      ),
    );
    setBusiness(value);
    setSettingsOpen(false);
    announce("Tu negocio y tu menú están actualizados.");
    return "";
  }
  return (
    <div
      className={`app phase-${phase === "build" ? "build" : "order"} ${reduced ? "reduce-motion" : ""} ${drag.ghost ? "is-dragging" : ""} ${drag.over ? "is-drag-over" : ""}`}
    >
      <header
        className="topbar"
        inert={phase !== "build" || settingsOpen ? true : undefined}
      >
        <a
          className="brand"
          href="#inicio"
          aria-label={`${business.name}, inicio`}
        >
          <span className="brand-mark">
            {business.logo ? (
              <img src={business.logo} alt="" />
            ) : (
              <Hamburger size={29} weight="duotone" />
            )}
          </span>
          <span>
            {business.name}
            <small>{business.slogan}</small>
          </span>
        </a>
        <nav className="category-tabs" aria-label="Elige tu comida">
          {Object.entries(categories).map(([id, c]) => {
            const Icon = icons[id];
            return (
              <button
                key={id}
                className={`category-tab ${category === id ? "selected" : ""}`}
                aria-pressed={category === id}
                disabled={phase !== "build"}
                onClick={() => switchCategory(id)}
              >
                <Icon size={22} weight={category === id ? "fill" : "regular"} />
                <span>{productOf(id, business).name}</span>
              </button>
            );
          })}
        </nav>
        <div className="header-right">
          <button
            className="settings-open"
            onClick={() => {
              drag.cancel();
              setSettingsOpen(true);
            }}
            aria-label="Ajustes del negocio"
          >
            <GearSix size={20} />
            <span>Ajustes</span>
          </button>
          <button
            className={`sound-toggle ${sound ? "on" : ""}`}
            aria-label={sound ? "Desactivar sonido" : "Activar sonido"}
            aria-pressed={sound}
            onClick={() => {
              setSound(!sound);
              setSoundState(!sound);
            }}
          >
            {sound ? <SpeakerHigh size={20} /> : <SpeakerSlash size={20} />}
            <span>Sonido</span>
            <i aria-hidden="true" />
          </button>
        </div>
      </header>
      <main
        id="inicio"
        className="workbench"
        inert={phase !== "build" || settingsOpen ? true : undefined}
      >
        <section
          ref={kitchenRef}
          className={`kitchen ${drag.over ? "drop-ready" : ""}`}
          aria-label="Constructor visual y zona para soltar ingredientes"
        >
          <div className="scene-header">
            <div className="eyebrow">
              <span /> TU ANTOJO, TUS REGLAS
            </div>
            <h1 key={category}>
              {config.headline[0]}
              <br />
              <em>{config.headline[1]}</em>
            </h1>
            <p>{config.description}</p>
          </div>
          <Scene
            category={category}
            recipe={recipe}
            business={business}
            phase="build"
            reduced={reduced}
            drop={drop}
            onReady={() => setReady(true)}
            onError={(e) => {
              console.error("FoodScene:", e);
              setSceneError(true);
            }}
          />
          <div className={`drop-target-label ${drag.ghost ? "show" : ""}`}>
            <Plus size={18} />
            {drag.over
              ? "Suelta. Nosotros ponemos el toque final."
              : "Trae tu ingrediente hasta aquí"}
          </div>
          {!ready && !sceneError && (
            <div className="scene-loading">
              <span className="loader" /> Preparando tu cocina…
            </div>
          )}
          {sceneError && (
            <div className="scene-loading error">
              <p>No pudimos abrir la escena 3D.</p>
              <button onClick={() => location.reload()}>
                Volver a intentar
              </button>
            </div>
          )}
          <div className="stage-bottom">
            <div className="stage-product">
              <strong>{config.name} artesanal</strong>
              <span>{config.subtitle}</span>
            </div>
            <button
              className="reset-button"
              onClick={reset}
              disabled={phase !== "build"}
            >
              <ArrowCounterClockwise size={16} /> Empezar de nuevo
            </button>
          </div>
          <div
            className={`notice ${notice ? "visible" : ""}`}
            aria-live="polite"
          >
            <Check size={16} />
            {notice}
          </div>
        </section>
        <IngredientDock
          category={category}
          recipe={recipe}
          disabled={!ready || sceneError || phase !== "build"}
          drag={drag}
          business={business}
          onAdd={changeIngredient}
        />
        <Receipt
          category={category}
          recipe={recipe}
          total={total}
          business={business}
          price={
            <AnimatedPrice
              value={total}
              reduced={reduced}
              currency={business.currency}
            />
          }
          disabled={!ready || sceneError || phase !== "build"}
          onRemove={(id) => changeIngredient(id, -1)}
          onCheckout={checkout}
          checkoutRef={checkoutRef}
        />
      </main>
      {phase === "build" && (
        <MobileInvoiceLink
          price={
            <AnimatedPrice
              value={total}
              reduced={reduced}
              currency={business.currency}
            />
          }
          reduced={reduced}
        />
      )}
      <footer className="footer">
        <span>{business.slogan}</span>
        <div>
          <span className="status-dot" /> Cocina abierta para tus ideas
        </div>
      </footer>
      {phase === "build" && (
        <IngredientDragPreview
          drag={drag}
          category={category}
          business={business}
        />
      )}
      {settingsOpen && (
        <SettingsPanel
          business={business}
          onSave={saveBusiness}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {phase === "packing" && order && (
        <PackingAnimation
          category={order.category}
          recipe={order.recipe}
          business={business}
          onComplete={() => {
            setPhase("success");
            playSound("success");
          }}
          onError={(error) => {
            console.error(error);
            setPhase("build");
            announce("No se pudo preparar la caja. Intenta de nuevo.");
          }}
        />
      )}
      {phase === "success" && order && (
        <div
          className="success-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-title"
        >
          <Success order={order} onRestart={restart} />
        </div>
      )}
    </div>
  );
}
function Success({ order, onRestart }) {
  const button = useRef(),
    card = useRef();
  useEffect(() => {
    card.current?.focus();
    const fn = (e) => {
      if (e.key === "Escape") onRestart();
      if (e.key === "Tab") {
        e.preventDefault();
        button.current?.focus();
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);
  return (
    <div ref={card} tabIndex={-1} className="success-card">
      <div className="success-icon">
        <Check size={26} weight="bold" />
      </div>
      <span className="step-index">PEDIDO CONFIRMADO</span>
      <h2 id="success-title">
        ¡Pedido
        <br />
        <em>recibido!</em>
      </h2>
      <p>
        Tu receta quedó tal como la elegiste.
        <br />
        Tu antojo, empacado y listo.
      </p>
      <div className="success-order">
        <span>Pedido de prueba {order.number}</span>
        <strong>{money(order.total, order.currency)}</strong>
      </div>
      <button ref={button} className="checkout-button" onClick={onRestart}>
        Crear otro antojo <ArrowRight size={20} />
      </button>
      <small>
        Pedido de demostración. No se envía a un restaurante ni se realiza un
        cobro.
      </small>
    </div>
  );
}
