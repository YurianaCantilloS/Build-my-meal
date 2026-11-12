import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Storefront,
  FloppyDisk,
  Plus,
  Trash,
  ImageSquare,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { categories, money } from "./menu.js";
import {
  defaultBusiness,
  validateBusiness,
  currencies,
  currencyDigits,
} from "./business.js";
import { readImageFile } from "./imageUpload.js";
const sections = { brand: "Marca", bases: "Bases", toppings: "Toppings" };
export function SettingsPanel({ business, onSave, onClose }) {
  const [draft, setDraft] = useState(() => structuredClone(business)),
    [errors, setErrors] = useState({}),
    [tab, setTab] = useState("brand"),
    [selected, setSelected] = useState(() => Object.keys(business.catalog)[0]),
    [uploading, setUploading] = useState(0),
    [message, setMessage] = useState("");
  const panel = useRef(),
    first = useRef(),
    editor = useRef(),
    content = useRef();
  useEffect(() => {
    if (content.current) content.current.scrollTop = 0;
  }, [tab]);
  function chooseTopping(id) {
    setSelected(id);
    if (matchMedia("(max-width:700px)").matches)
      requestAnimationFrame(() =>
        editor.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
  }
  useEffect(() => {
    first.current?.focus();
    const fn = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const list = [
          ...panel.current.querySelectorAll("button,input,select"),
        ].filter((el) => !el.disabled && el.getClientRects().length);
        if (e.shiftKey && document.activeElement === list[0]) {
          e.preventDefault();
          list.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === list.at(-1)) {
          e.preventDefault();
          list[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", fn);
    return () => {
      document.removeEventListener("keydown", fn);
      requestAnimationFrame(() =>
        document
          .querySelector(".settings-open")
          ?.focus({ preventScroll: true }),
      );
    };
  }, []);
  const step = currencyDigits(draft.currency || "COP") ? ".01" : "1";
  function top(key, value) {
    setDraft((old) => ({ ...old, [key]: value }));
    setMessage("");
  }
  function group(group, id, value) {
    setDraft((old) => ({ ...old, [group]: { ...old[group], [id]: value } }));
  }
  function product(id, key, value) {
    setDraft((old) => ({
      ...old,
      products: {
        ...old.products,
        [id]: { ...old.products[id], [key]: value },
      },
    }));
  }
  function topping(id, key, value) {
    setDraft((old) => ({
      ...old,
      catalog: { ...old.catalog, [id]: { ...old.catalog[id], [key]: value } },
    }));
  }
  async function upload(file, apply) {
    if (!file) return;
    setUploading((n) => n + 1);
    setMessage("");
    try {
      const image = await readImageFile(file);
      apply(image);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading((n) => n - 1);
    }
  }
  function imageInput(label, current, apply) {
    return (
      <label className="image-file-field">
        <span>{label}</span>
        <span className="file-picker">
          <ImageSquare size={17} />
          <b>{current ? "Cambiar imagen" : "Elegir imagen"}</b>
          <small>{current ? "Imagen lista" : "PNG · JPG · WebP"}</small>
        </span>
        <input
          className="file-hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-label={label}
          disabled={!!uploading}
          onChange={(e) => {
            const file = e.target.files[0];
            e.target.value = "";
            upload(file, apply);
          }}
        />
        {current && (
          <small>PNG, JPG o WebP · imagen guardada con el negocio</small>
        )}
      </label>
    );
  }
  function priceField(groupName, id, label) {
    return (
      <label className="price-field">
        <span>
          {label}
          <small>{draft.currency}</small>
        </span>
        <input
          type="number"
          inputMode="decimal"
          required
          min="0"
          max="9999999"
          step={step}
          aria-label={label}
          value={draft[groupName][id]}
          onChange={(e) => group(groupName, id, e.target.value)}
          aria-invalid={!!errors[groupName + "." + id]}
        />
      </label>
    );
  }
  function addTopping() {
    const id = "custom_" + crypto.randomUUID().replaceAll("-", "");
    setDraft((old) => ({
      ...old,
      catalog: {
        ...old.catalog,
        [id]: {
          id,
          name: "Nuevo topping",
          image: "",
          appliedImage: "",
          prepared: {},
          categories: ["pizza"],
          custom: true,
        },
      },
      toppings: { ...old.toppings, [id]: 0 },
    }));
    chooseTopping(id);
    setMessage("Añade su foto, nombre, precio y productos.");
  }
  function removeTopping() {
    const next = { ...draft.catalog },
      prices = { ...draft.toppings };
    delete next[selected];
    delete prices[selected];
    setDraft((old) => ({ ...old, catalog: next, toppings: prices }));
    setSelected(Object.keys(next)[0]);
    setMessage(
      "Se eliminará al guardar. Cancelar conserva el catálogo anterior.",
    );
  }
  function submit(e) {
    e.preventDefault();
    const result = validateBusiness(draft);
    setErrors(result.errors);
    if (!result.valid) {
      const [key, text] = Object.entries(result.errors)[0];
      setMessage(text);
      if (key.startsWith("catalog.") || key.startsWith("toppings.")) {
        setTab("toppings");
        setSelected(key.split(".")[1]);
      } else if (key.startsWith("products.") || key.startsWith("bases."))
        setTab("bases");
      else if (!["storage", "catalog"].includes(key)) setTab("brand");
      return;
    }
    const failure = onSave(result.value);
    if (failure) setMessage(failure);
  }
  const item = draft.catalog[selected];
  return (
    <div
      className="settings-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <form
        ref={panel}
        className="settings-panel business-editor"
        onSubmit={submit}
        noValidate
      >
        <header className="settings-heading">
          <div>
            <span className="step-index">TU NEGOCIO</span>
            <h2 id="settings-title">
              <Storefront size={23} />
              Personaliza tu menú
            </h2>
            <p>Marca, productos e ingredientes en un solo lugar.</p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Cerrar ajustes"
          >
            <X size={22} />
          </button>
        </header>
        <nav className="settings-tabs" aria-label="Secciones de ajustes">
          {Object.entries(sections).map(([id, title]) => (
            <button
              type="button"
              key={id}
              aria-pressed={tab === id}
              className={tab === id ? "active" : ""}
              onClick={() => {
                setTab(id);
                setMessage("");
              }}
            >
              {title}
              {id === "toppings" && (
                <small>{Object.keys(draft.catalog).length}</small>
              )}
            </button>
          ))}
        </nav>
        <div ref={content} className="settings-content">
          {tab === "brand" && (
            <section className="brand-settings">
              <div className="brand-preview">
                <div className="brand-preview-logo">
                  {draft.logo ? (
                    <img src={draft.logo} alt="Vista previa del logo" />
                  ) : (
                    <Storefront size={34} />
                  )}
                </div>
                <strong>{draft.name || "Tu negocio"}</strong>
                <span>{draft.slogan}</span>
              </div>
              <div className="brand-fields">
                {imageInput("Logo del negocio", draft.logo, (value) =>
                  top("logo", value),
                )}
                {draft.logo && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => top("logo", "")}
                  >
                    Quitar logo
                  </button>
                )}
                <label>
                  Nombre del negocio
                  <input
                    ref={first}
                    aria-label="Nombre del negocio"
                    maxLength={32}
                    value={draft.name}
                    onChange={(e) => top("name", e.target.value)}
                  />
                </label>
                <label>
                  Eslogan
                  <input
                    aria-label="Eslogan del negocio"
                    maxLength={80}
                    value={draft.slogan}
                    onChange={(e) => top("slogan", e.target.value)}
                  />
                </label>
                <label>
                  Moneda
                  <select
                    aria-label="Moneda del negocio"
                    value={draft.currency}
                    onChange={(e) => top("currency", e.target.value)}
                  >
                    {Object.entries(currencies).map(([id, label]) => (
                      <option key={id} value={id}>
                        {id} · {label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="settings-help">
                  COP está seleccionado por defecto. Cambiar moneda no convierte
                  los importes: puedes ajustar cada precio.
                </p>
              </div>
            </section>
          )}
          {tab === "bases" && (
            <section>
              <h3>
                Productos base <small>Ajusta su nombre, foto y precio.</small>
              </h3>
              <div className="base-editor-grid">
                {Object.entries(categories).map(([id, c]) => (
                  <article className="base-editor-card" key={id}>
                    <div className="base-photo">
                      <img
                        src={draft.products[id].image}
                        alt={`Base de ${c.name}`}
                      />
                    </div>
                    <h4>{c.name}</h4>
                    <label>
                      Nombre
                      <input
                        aria-label={`Nombre de ${c.name}`}
                        maxLength={32}
                        value={draft.products[id].name}
                        onChange={(e) => product(id, "name", e.target.value)}
                      />
                    </label>
                    <label>
                      Descripción de la base
                      <input
                        aria-label={`Descripción de base de ${c.name}`}
                        maxLength={60}
                        value={draft.products[id].baseName}
                        onChange={(e) =>
                          product(id, "baseName", e.target.value)
                        }
                      />
                    </label>
                    {priceField("bases", id, `Precio de ${c.name}`)}
                    {imageInput(
                      `Foto base de ${c.name}`,
                      draft.products[id].image,
                      (value) => product(id, "image", value),
                    )}
                    <small className="settings-help">
                      {id === "pizza"
                        ? "Usa una foto cenital sin toppings."
                        : id === "burger"
                          ? "Usa la mitad inferior del pan, sin fondo."
                          : "Usa pan y salchicha, sin toppings."}
                    </small>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        product(
                          id,
                          "image",
                          defaultBusiness().products[id].image,
                        )
                      }
                    >
                      Restaurar foto original
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}
          {tab === "toppings" && (
            <section>
              <div className="catalog-editor-heading">
                <div>
                  <h3>Catálogo de toppings</h3>
                  <p>Selecciona una foto para editar el ingrediente.</p>
                </div>
                <button
                  type="button"
                  className="new-topping-button"
                  disabled={Object.keys(draft.catalog).length >= 40}
                  onClick={addTopping}
                >
                  <Plus size={17} />
                  Nuevo topping
                </button>
              </div>
              <div className="catalog-editor-layout">
                <div className="catalog-picker">
                  {Object.values(draft.catalog).map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      className={selected === c.id ? "active" : ""}
                      onClick={() => chooseTopping(c.id)}
                      aria-label={`Editar ${c.name}`}
                    >
                      {c.image ? (
                        <img src={c.image} alt="" />
                      ) : (
                        <ImageSquare size={35} />
                      )}
                      <strong>{c.name}</strong>
                      <small>
                        {money(
                          Number(draft.toppings[c.id]) || 0,
                          draft.currency,
                        )}
                      </small>
                    </button>
                  ))}
                </div>
                {item ? (
                  <article ref={editor} className="topping-editor">
                    <div className="topping-editor-photo">
                      {item.image ? (
                        <img src={item.image} alt={`Foto de ${item.name}`} />
                      ) : (
                        <ImageSquare size={48} />
                      )}
                    </div>
                    <label>
                      Nombre del topping
                      <input
                        aria-label="Nombre del topping"
                        maxLength={40}
                        value={item.name}
                        onChange={(e) =>
                          topping(selected, "name", e.target.value)
                        }
                      />
                    </label>
                    {priceField("toppings", selected, "Precio del topping")}
                    {imageInput("Foto del topping", item.image, (value) =>
                      topping(selected, "image", value),
                    )}
                    <fieldset>
                      <legend>Disponible en</legend>
                      {Object.entries(categories).map(([id, c]) => (
                        <label key={id} className="category-checkbox">
                          <input
                            type="checkbox"
                            aria-label={`Disponible en ${c.name}`}
                            checked={item.categories.includes(id)}
                            onChange={(e) =>
                              topping(
                                selected,
                                "categories",
                                e.target.checked
                                  ? [...item.categories, id]
                                  : item.categories.filter((x) => x !== id),
                              )
                            }
                          />
                          {c.name}
                        </label>
                      ))}
                    </fieldset>
                    <details className="applied-image-details">
                      <summary>
                        Foto del ingrediente al servir (opcional)
                      </summary>
                      <p className="settings-help">
                        Puedes usar otra imagen ya preparada para colocar sobre
                        la comida. Si no eliges una, se usará su foto. Prefiere
                        imágenes sin fondo.
                      </p>
                      {item.appliedImage && (
                        <img
                          className="applied-photo-preview"
                          src={item.appliedImage}
                          alt="Ingrediente al servir"
                        />
                      )}
                      {imageInput(
                        "Foto aplicada del topping",
                        item.appliedImage,
                        (value) => topping(selected, "appliedImage", value),
                      )}
                      {item.appliedImage && (
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => topping(selected, "appliedImage", "")}
                        >
                          Usar imagen original al servir
                        </button>
                      )}
                    </details>
                    <button
                      type="button"
                      className="delete-topping"
                      onClick={removeTopping}
                    >
                      <Trash size={16} />
                      Eliminar topping
                    </button>
                  </article>
                ) : (
                  <p className="catalog-empty">
                    Crea tu primer topping con «Nuevo topping».
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
        <div className="settings-message" role="status">
          {uploading
            ? "Preparando imagen…"
            : message || Object.values(errors)[0] || ""}
        </div>
        <footer className="settings-actions">
          <button
            type="button"
            className="settings-reset"
            onClick={() => {
              const fresh = defaultBusiness();
              setDraft(fresh);
              setSelected(Object.keys(fresh.catalog)[0]);
              setErrors({});
              setMessage("Valores iniciales cargados. Guarda para aplicarlos.");
            }}
          >
            <ArrowCounterClockwise size={15} />
            Restablecer
          </button>
          <div>
            <button type="button" className="settings-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="checkout-button"
              disabled={!!uploading}
            >
              <FloppyDisk size={17} />
              Guardar cambios
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
