import React, { useEffect, useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";

export function MobileInvoiceLink({ price, reduced }) {
  const [invoiceOnScreen, setInvoiceOnScreen] = useState(false);
  const [coversControls, setCoversControls] = useState(false);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const landscape = innerHeight < 500,
        top = innerHeight - (landscape ? 52 : 90);
      const selectors = landscape
        ? [".ingredient-dock", ".scene-canvas"]
        : [".ingredient-dock"];
      setCoversControls(
        selectors.some((selector) => {
          const r = document.querySelector(selector)?.getBoundingClientRect();
          return r && r.bottom > top && r.top < innerHeight;
        }),
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    const dock = document.querySelector(".ingredient-dock");
    if (dock) observer.observe(dock);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  useEffect(() => {
    const invoice = document.querySelector(".receipt-column");
    if (!invoice) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setInvoiceOnScreen(
          entry.isIntersecting && entry.intersectionRatio > 0.12,
        ),
      { threshold: [0, 0.12] },
    );
    observer.observe(invoice);
    return () => observer.disconnect();
  }, []);
  if (invoiceOnScreen || coversControls) return null;
  return (
    <button
      className="mobile-invoice-link"
      onClick={() => {
        const invoice = document.querySelector(".receipt-column");
        invoice?.focus({ preventScroll: true });
        invoice?.scrollIntoView({
          behavior: reduced ? "instant" : "smooth",
          block: "start",
        });
      }}
    >
      <span>
        Tu creación<strong>{price}</strong>
      </span>
      <span>
        Ver factura <ArrowRight size={17} />
      </span>
    </button>
  );
}
