# Mordida — QA responsive y empaque rápido

final result: passed

## Fuente y comparación

La versión v4 ya validada es la referencia de continuidad visual. Se abrió su captura `qa/v4/hotdog-mobile.jpg` y se comparó con la revisión actual en `qa/v5/phone-comparison.jpg`: anterior a la izquierda y actual a la derecha. Ambos representan Hot dog con queso, lechuga, cebolla, champiñones y tocineta; total COP $24.500. Viewport 390 × 844 CSS px, imágenes normalizadas a 390 × 844 para corregir diferencias de captura del navegador. La fuente contiene un aviso transitorio; no se lo trató como cambio de diseño.

El usuario pidió ampliar la adaptación responsive y acelerar la caja. Se conservaron marca, tipografías, colores, fotografías, categorías, bandeja inferior, factura y ajustes. No se introdujo una dirección visual nueva. El compuesto permite ver las diferencias de altura, tamaño de escena y espacio bajo la bandeja; no se busca copiar los defectos de la versión anterior.

## Comprobaciones y correcciones

- P2: la bandeja podía quedar tapada por el resumen fijo en teléfonos de poca altura. Se detecta la intersección con la franja inferior y el resumen se oculta cuando cubriría los ingredientes. En horizontal también se protege la comida. Se comprobó después mediante arrastre nativo en 320 × 640, con fotografía y precio accesibles. Evidencia posterior: `phone-320-drag.jpg` y `phone-390.jpg`. Las capturas `before-phone-320.jpg` y `before-landscape-568.jpg` documentan la situación previa a esta última corrección.
- P2: tablet reutilizaba la composición estrecha de teléfono. Ahora tiene cabecera en una fila, título a la izquierda y comida a la derecha, seis toppings visibles y ticket centrado con ancho máximo de 560 px. Evidencia: `tablet-768.jpg`.
- P2: portátiles compactos requerían límites de marca y ajustes de tamaño. Se compactaron cabecera, titular y controles; los seis ingredientes permanecen en una cuadrícula. Evidencia: `laptop-1024.jpg`.
- P2: los teléfonos horizontales necesitaban alturas menores y diálogos desplazables. Se compactaron cabecera, escena, estado de empaque y márgenes. Ajustes y confirmación permiten desplazamiento interno en alturas reducidas. Se comprobaron controles de cabecera dentro del viewport en 568 × 320 y ausencia de desbordamiento en 844 × 390.
- P2: el empaque resultaba lento. Se redujo de 6,8 a 2,9 segundos, un 57 % aproximadamente. Entrada de caja: 0–0,6 s; descenso: 0,6–1,45 s; plegado: 1,45–1,70 s; tapa: 1,75–2,50 s; confirmación a partir de 2,9 s. Se mantienen curvas suaves y la tapa empieza después de terminar el descenso. Se observó cierre y confirmación en teléfono pequeño y horizontal: `fast-pack-phone.jpg`, `fast-pack-landscape.jpg`.

No quedan P0/P1/P2 abiertos en este alcance.

## Validación funcional y visual

Se revisaron 320 × 640, 390 × 844, 768 × 1024, 1024 × 768, 1440 × 900, 568 × 320 y 844 × 390. La inspección del documento devolvió ausencia de desbordamiento horizontal. En el teléfono horizontal de 568 px, marca, categorías y acciones quedaron dentro del ancho disponible. Se abrió y cerró el panel de ajustes y se completó el pedido con el ticket y la confirmación correctos.

En 320 × 640 se arrastró realmente tocineta desde la bandeja hasta el hot dog. La cantidad pasó de una a dos y el total de $24.500 a $28.500. Quitar una porción restauró $24.500. Se comprobó navegación al ticket, CTA y confirmación en la secuencia abreviada. El desplazamiento horizontal devolvió la bandeja a su posición inicial.

Las cinco superficies visuales mantienen continuidad: Barlow Condensed/DM Sans; espaciado adaptado al ancho y altura; paleta borgoña, carbón, crema y coral; los mismos recursos fotográficos sin cortes nuevos en los tamaños verificados; nombres y precios COP consistentes. Los avisos y las áreas seguras tienen espacio reservado. No fue necesario comparar detalles de nuevos assets porque no se añadieron imágenes ni se cambió su diseño.

Las cinco pruebas dirigidas de precios, orden de capas, holgura y secuencia pasan. La prueba de empaque comprueba ahora que no confirma antes de 2,9 s y que la tapa nunca cierra antes de que la comida esté colocada. La compilación final de producción pasa; permanece el aviso habitual del tamaño del bundle de Three.js. La consola del navegador no mostró errores ni avisos.

## Evidencia y límites

`responsive-preview.jpg` reúne escritorio y teléfono. Las capturas de tamaños específicos están en `qa/v5/`. El navegador puede devolver JPEG normalizado según densidad; se usan dimensiones CSS para las comprobaciones geométricas.

La comprobación móvil usa viewports, no teléfonos físicos. En pantallas de poca altura se necesita desplazamiento para alcanzar ingredientes, factura o contenido de los diálogos. La animación dura 2,9 s; una carga inicial de texturas puede añadir espera antes de que comience. Se conservan los límites de prototipo: pedidos simulados y configuración local al navegador.
