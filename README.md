# Mordida — Constructor y ajustes del negocio

Revisión v5: pizza, hamburguesa y hot dog con toppings arrastrables, factura de papel, empaque 3D y panel separado de nombre y precios. Se retiraron los puntos y el interruptor de movimiento.

## Probar

Requiere Node.js y un navegador moderno con WebGL 2.

```sh
npm install
npm run dev
```

Vista local de esta entrega: http://127.0.0.1:4173/?v=5. Para elegir el puerto en Windows:

```sh
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173 --strictPort
npm run build
npm run preview
node --test tests/*.test.mjs
```

La compilación está en `dist/client/`; debe servirse por HTTP.

## Pedidos

1. Elige Pizza, Hamburguesa o Hot dog. La factura comienza con el precio de la base.
2. Arrastra un topping desde la bandeja inferior hasta la comida. La miniatura se convierte en una porción preparada, adaptada al alimento.
3. Cada entrega válida añade una porción. Soltar fuera o pulsar Escape cancela sin cobrar. También puedes tocar una tarjeta o usar Enter/Espacio. El límite es nueve porciones por ingrediente.
4. La factura suma cantidades y precios en COP. El signo menos quita una porción. Cambiar de categoría conserva sus recetas independientes; «Empezar de nuevo» limpia la receta actual.
5. «Empacar y pedir» abre una secuencia de 2,9 segundos: llega una caja abierta, la comida baja completa, se pliegan los bordes y cierra la tapa. Cada categoría tiene dimensiones apropiadas, ampliadas según el volumen del pedido.
6. Después aparece la confirmación. El pedido es una simulación local: no hay cobro, envío a restaurantes ni entrega real. La factura no es fiscal.

En móvil, la bandeja se desplaza horizontalmente y el ticket aparece debajo. «Ver factura» lleva al desglose y se oculta cuando ya está visible.

## Nombre y precios

Abre el engranaje «Ajustes» en la cabecera. Puedes cambiar el nombre del negocio, los tres precios base y el precio por porción de cada topping, compartido entre categorías. «Guardar cambios» actualiza menú, factura, total y marca del empaque. Los valores se conservan al recargar mediante `localStorage`, únicamente en este navegador.

«Cancelar» y Escape descartan el borrador. «Restablecer valores» recupera los valores iniciales dentro del borrador; se aplica al guardar. Los precios deben ser enteros entre 0 y 9.999.999 COP. El nombre admite de 1 a 32 caracteres. Este panel local no incluye autenticación, backend ni sincronización entre dispositivos.

## Movimiento y geometría

El arrastre sigue directamente al puntero mediante Pointer Events. La integración final usa un resorte analítico estable, interpolación de escala y un fundido breve. Las texturas se preparan en GPU antes de habilitar el arrastre. Las animaciones están habilitadas y el sonido Web Audio continúa siendo opcional.

La pizza coloca el queso debajo de todos los demás toppings, incluso si se añade al final o varias veces. La hamburguesa mantiene el pan inferior sobre el plato y deja visible su borde frontal completo. El hot dog se desplaza hacia el centro visual del plato.

El empaque usa una escena independiente para conservar estable el constructor. La caja es hueca, con paredes y tapa articulada. Sus medidas se calculan a partir de la envolvente tridimensional del alimento, con holgura lateral y superior. La cámara se encuadra antes del descenso y permanece fija durante colocación y cierre. La tapa no empieza a cerrar hasta que el alimento está sentado por completo. Los recursos se liberan al terminar.

## Módulos

| Archivo | Responsabilidad |
| --- | --- |
| `src/App.jsx` | Categorías, recetas, total, ajustes y confirmación. |
| `src/business.js` | Valores iniciales, validación y carga de precios. |
| `src/SettingsPanel.jsx` | Edición, cancelación y guardado del negocio. |
| `src/IngredientDock.jsx` | Toppings con foto, nombre y precio. |
| `src/IngredientDragPreview.jsx`, `src/useIngredientDrag.js` | Arrastre y representación preparada. |
| `src/Receipt.jsx`, `src/MobileInvoiceLink.jsx` | Factura y acceso móvil. |
| `src/appliedAssets.js`, `src/assembly.js` | Recursos, orden y dimensiones de capas. |
| `src/scene.js` | Three.js, montaje y envolvente del empaque. |
| `src/PackingAnimation.jsx` | Presentación cinematográfica y estados accesibles. |
| `src/packaging.js`, `src/packingMotion.js` | Caja hueca, ajuste y secuencia de cierre. |
| `src/menu.js`, `src/motion.js`, `src/audio.js` | Catálogo, física y audio. |
| `qa/v5/`, `design-qa.md` | Capturas y revisión de esta entrega. |

## Validación y límites

20 pruebas comprueban precios editados, validación de ajustes, independencia de recetas, orden del queso, estabilidad de resortes, cavidad de cajas, holgura y secuencia de cierre. La compilación de producción pasa. También se revisó el flujo real en escritorio y viewport móvil, incluido arrastre, persistencia tras recargar, cancelación, teclado y empaque.

La comida utiliza fotografías transparentes sobre superficies con profundidad, no modelos volumétricos completos. El QA móvil es de viewport, no una medición en teléfonos físicos; no se garantiza una tasa de FPS para todos los dispositivos. Los pedidos contienen una unidad de la categoría actual, sin carrito de varios productos. Google Fonts carga Barlow Condensed y DM Sans con alternativas de respaldo. No se requieren claves de API.

## Adaptación responsive v5

Se comprobaron viewports de 320 × 640, 390 × 844, 768 × 1024, 1024 × 768, 1440 × 900 y orientación horizontal de 568 × 320 y 844 × 390. Tablet usa encabezado en una fila, comida y título en paralelo y un ticket centrado de ancho limitado. Los teléfonos conservan el carrusel de toppings; el resumen flotante se oculta cuando cubriría ingredientes o comida. Las pantallas horizontales compactan la cabecera, la escena y los diálogos. Se respetan los márgenes de área segura del dispositivo.

La secuencia de empaque dura 2,9 segundos en lugar de 6,8: aproximadamente un 57 % menos. Se conservan los intervalos separados para entrada de la caja, descenso de la comida, plegado y cierre.
