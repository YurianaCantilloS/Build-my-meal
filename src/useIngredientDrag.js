import { useEffect, useRef, useState } from "react";
import { clamp } from "./motion.js";
import { playSound } from "./audio.js";

// Pointer capture works with a mouse, pen and touch. Moving the preview never
// changes the recipe; a valid release over the preparation area commits it once.
export function useIngredientDrag({ zone, canAdd, onAdd, reduced }) {
  const options = useRef();
  options.current = { zone, canAdd, onAdd, reduced };
  const gesture = useRef(null),
    element = useRef(null),
    suppressed = useRef(false);
  const frame = useRef(0),
    timer = useRef(0),
    previous = useRef(0);
  const [ghost, setGhost] = useState(null),
    [over, setOver] = useState(false);
  const isOver = useRef(false);
  function inside(x, y) {
    const r = options.current.zone()?.getBoundingClientRect();
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }
  function paint(now) {
    const g = gesture.current;
    if (!g?.active) return;
    const dt = Math.min((now - previous.current) / 1000 || 1 / 60, 1 / 30);
    previous.current = now;
    g.vx += ((g.x - g.px) / dt - g.vx) * 0.18;
    g.px = g.x;
    g.py = g.y;
    if (element.current)
      element.current.style.transform = `translate3d(${g.px - 72}px,${g.py - 54}px,0) rotate(${clamp(g.vx * 0.018, -10, 10) - 4}deg) scale(1.06)`;
    frame.current = requestAnimationFrame(paint);
  }
  function clear() {
    cancelAnimationFrame(frame.current);
    clearTimeout(timer.current);
    gesture.current = null;
    setGhost(null);
    setOver(false);
    isOver.current = false;
  }
  function cancel() {
    const g = gesture.current;
    cancelAnimationFrame(frame.current);
    setOver(false);
    isOver.current = false;
    if (!g?.active) {
      clear();
      return;
    }
    suppressed.current = true;
    setGhost({ id: g.id, returning: true });
    if (element.current)
      element.current.style.transform = `translate3d(${g.originX - 72}px,${g.originY - 54}px,0) rotate(0deg) scale(.45)`;
    timer.current = setTimeout(clear, options.current.reduced ? 0 : 330);
  }
  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    const key = (e) => {
      if (e.key === "Escape" && gesture.current) cancel();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  function handlers(id) {
    return {
      onDragStart: (e) => e.preventDefault(),
      onPointerDown: (e) => {
        if (e.button !== 0 || !options.current.canAdd(id)) return;
        clear();
        suppressed.current = false;
        const r = e.currentTarget.getBoundingClientRect();
        gesture.current = {
          id,
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          x: e.clientX,
          y: e.clientY,
          px: e.clientX,
          py: e.clientY,
          vx: 0,
          vy: 0,
          originX: r.left + r.width / 2,
          originY: r.top + r.height / 2,
          active: false,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
        if (e.pointerType === "mouse") e.preventDefault();
      },
      onPointerMove: (e) => {
        const g = gesture.current;
        if (!g || g.pointerId !== e.pointerId) return;
        g.x = e.clientX;
        g.y = e.clientY;
        if (!g.active && Math.hypot(g.x - g.startX, g.y - g.startY) > 6) {
          g.active = true;
          setGhost({ id, returning: false });
          playSound("click");
          previous.current = performance.now();
          frame.current = requestAnimationFrame(paint);
        }
        if (g.active) {
          e.preventDefault();
          const hit = inside(g.x, g.y);
          if (hit !== isOver.current) {
            isOver.current = hit;
            setOver(hit);
          }
        }
      },
      onPointerUp: (e) => {
        const g = gesture.current;
        if (!g || g.pointerId !== e.pointerId) return;
        if (e.currentTarget.hasPointerCapture(e.pointerId))
          e.currentTarget.releasePointerCapture(e.pointerId);
        if (!g.active) {
          gesture.current = null;
          return;
        }
        suppressed.current = true;
        if (inside(e.clientX, e.clientY) && options.current.canAdd(id)) {
          options.current.onAdd(id, { x: e.clientX, y: e.clientY });
          cancelAnimationFrame(frame.current);
          g.active = false;
          setOver(false);
          isOver.current = false;
          setGhost({ id, landing: true, returning: false });
          timer.current = setTimeout(clear, options.current.reduced ? 0 : 140);
        } else cancel();
      },
      onPointerCancel: cancel,
      onClick: (e) => {
        if (suppressed.current && e.detail !== 0) {
          suppressed.current = false;
          return;
        }
        if (!options.current.canAdd(id)) return;
        const r = e.currentTarget.getBoundingClientRect();
        options.current.onAdd(id, {
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
        });
      },
    };
  }
  return { ghost, ghostRef: element, over, handlers, cancel };
}
