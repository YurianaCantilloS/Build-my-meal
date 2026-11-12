# Mordida — QA de la revisión v4

final result: passed

## Fuente y comparación

Se abrieron las dos capturas del usuario, copiadas a `qa/v4/burger-reference.png` (770 × 532) y `hotdog-reference.png` (556 × 455). Son recortes del alimento, sin información del viewport completo. Representan defectos que el usuario pidió corregir, no objetivos para reproducirlos.

La implementación se abrió en http://127.0.0.1:4173/?v=4 y se comprobó en 1280 × 800 y 390 × 844 CSS px. La captura de escritorio conserva aproximadamente 1270 × 800 px; el servicio puede aplicar normalización según la densidad del navegador. No se atribuyen diferencias de diseño a esa escala ni se afirma coincidencia píxel a píxel.

Se generaron y abrieron compuestos reales, referencia a la izquierda y corrección a la derecha: `burger-comparison.jpg` y `hotdog-comparison.jpg`. Se alinearon regiones de proporción equivalente y se normalizaron a 470 × 420 y 510 × 440 respectivamente. El estado de hamburguesa conserva queso, lechuga, tomate, tocineta y cebolla; el hot dog conserva queso, lechuga, cebolla y champiñones. Las vistas completas `burger-corrected.jpg` y `hotdog-centered.jpg` muestran el contexto de factura y bandeja inferior.

## Correcciones y evidencia posterior

- P1 — Empaque ausente: se restauró con una escena dedicada, tres formatos de caja hueca y tapa articulada. Se calcula la envolvente de la comida para dimensionar la cavidad, con margen lateral de 0,8 unidades total y altura adicional de 0,42. El producto entra antes de plegar y cerrar. La cámara queda fija durante el movimiento. `burger-seated.jpg`, `burger-closed.jpg`, `hotdog-seated.jpg`, `hotdog-closed.jpg` y `pizza-packing.jpg` muestran etapas observadas.
- P1 — Pan inferior parcialmente oculto y colocado bajo el plano del plato: se elevó su base y se separó la carne de su borde frontal. En una primera revisión aún quedaba muy fino; la corrección posterior deja un borde curvo continuo. Se volvió a capturar y comparar en `burger-comparison.jpg`, y se repitió el empaque con la nueva envolvente.
- P1 — Queso de pizza por encima del pepperoni: el orden de montaje ahora es independiente del orden de selección. El queso siempre queda en la capa más baja, con margen suficiente incluso para nueve porciones. `pizza-cheese-last.jpg` se capturó agregando queso después de pepperoni, champiñón y cebolla: los otros toppings permanecieron visibles encima.
- P2 — Hot dog desplazado hacia el borde posterior: se compensó su elevación con un desplazamiento hacia el centro proyectado del plato. El compuesto `hotdog-comparison.jpg` muestra el espacio más equilibrado alrededor del alimento; `hotdog-mobile.jpg` confirma la vista estrecha.
- P2 — Nombre y precios fijos: el panel «Ajustes» permite editar nombre, tres bases y nueve toppings. Menú, ticket, total y marca de caja usan la misma configuración. Se comprobó guardado y persistencia al recargar, además de cancelar sin aplicar. Evidencia en `settings-desktop.jpg`, `settings-mobile.jpg` y factura de `pizza-cheese-last.jpg`.
- P2 — Puntos y control de movimiento innecesarios: se retiraron XP, niveles, recompensas e interruptor de movimiento. Se mantiene el sonido opcional. La animación del constructor y del empaque queda habilitada.
- P2 — Foco al cerrar ajustes: se corrigió su devolución al engranaje y se comprobó con Escape. El diálogo de empaque recibe el foco mientras avanza y la confirmación lo recibe al terminar.

No quedan P0/P1/P2 abiertos en el alcance del prototipo.

## Cinco superficies visuales

Tipografía: se conservaron Barlow Condensed para titulares y DM Sans para controles; los ajustes tienen etiquetas explícitas y COP por campo. Espaciado: bandeja inferior y ticket lateral conservan jerarquía; el panel separado usa tres columnas de precios en escritorio y dos en móvil con desplazamiento vertical. Color: madera borgoña, carbón cálido, crema y coral coherentes entre constructor, ajustes y empaque. Imágenes: se reutilizaron los recortes fotográficos existentes, corrigiendo posiciones y profundidades; no se sustituyó el alimento por dibujos. Copy: español consistente y precios COP; el cierre informa que el pedido no se envía ni se cobra realmente.

## Comprobaciones funcionales

Se cambió el nombre a «Mordida Cocina», base de pizza a $20.000 y queso a $3.500. La hamburguesa con queso existente pasó de $22.500 a $23.000; tras recargar, la base de pizza y la marca conservaron los valores editados. Con pepperoni, champiñón, cebolla y queso el total fue $31.000. Después se restauraron los valores iniciales mediante el propio panel.

En 390 × 844, arrastrar tocineta de la bandeja hasta el hot dog añadió exactamente $4.000: de $20.500 a $24.500. Se editó el nombre del borrador y se canceló, manteniéndose «mordida.». «Ver factura» permitió acceder al CTA sin quedar cubierto. Se observaron colocación, plegado y cierre del empaque en móvil: `packing-mobile-open.jpg` y `packing-mobile-closed.jpg`. No hubo desbordamiento horizontal del documento.

Se comprobaron tres categorías de empaque y confirmaciones con importe correcto. Para capturar las fases se esperó a sus textos de estado, sin alterar el reloj ni el estado de la escena. Las primeras esperas largas del navegador agotaron su límite de consulta; se capturó después mediante esperas sucesivas de fase. Esto no fue un fallo del flujo de la aplicación. La última comprobación de consola devolvió cero errores o avisos.

20 pruebas automatizadas pasan y la compilación de producción termina correctamente. Las pruebas cubren validación de precios, cero permitido, rechazo de negativos/decimales/no numéricos, aislamiento del catálogo, queso debajo de todos los toppings, cavidades huecas, holgura y cierre posterior al descenso. Permanece el aviso de Vite por tamaño del bundle de Three.js; no es un fallo de compilación.

## Límites / P3

Las superficies fotográficas no son modelos volumétricos completos. Las cajas se adaptan al volumen del pedido; recetas extremas producen cajas altas. Las repeticiones de toppings pueden ocultar capas inferiores de la misma categoría. El guardado de ajustes es local al navegador, sin administración compartida ni autenticación. El móvil se probó mediante viewport, sin medición de FPS en hardware físico. Estas limitaciones están documentadas en README y no impiden el recorrido solicitado.
