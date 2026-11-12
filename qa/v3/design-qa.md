# Mordida — Revisión del 10 de noviembre

final result: passed

## Fuente y estado comparado

La fuente es la captura del usuario `qa/v2/request-reference.png` (1891 × 926 px). Se excluyeron 27 px superiores de navegador: área de aplicación 1891 × 899. La captura representa la versión anterior, acompañada por instrucciones explícitas de cambiar la disposición: toppings abajo, factura de papel y porciones preparadas. Se usa para preservar marca, madera, fotorealismo y categorías; no para conservar el panel antiguo que el usuario pidió reemplazar.

Implementación local: http://127.0.0.1:4173/?v=3. Comparación equivalente: Hot dog, queso 1, tocineta 1, cebolla 1, tomate 2, lechuga 1, champiñones 0; total COP $25.000. Viewport CSS 1891 × 899, JPEG de navegador 1881 × 894. Ambos se normalizaron a 1280 × 609 para `qa/v3/comparison.jpg`, fuente izquierda y revisión derecha. Se abrió y revisó el compuesto. También se revisó `qa/v3/food-comparison.jpg`, con recortes del alimento para evaluar el montaje sin perder detalle.

## Hallazgos corregidos

- P1: la miniatura cruda se repetía como pequeños adhesivos sobre la comida. Se separaron recursos de selección y aplicación. La cebolla es una porción preparada que sigue el pan o se distribuye sobre pizza; los champiñones son láminas salteadas en una distribución coherente. Evidencia: `hotdog-desktop.jpg`, `pizza-desktop.jpg`, `burger-desktop.jpg` y comparación de alimento.
- P1: el retraso elástico del puntero y el movimiento permanente del alimento dificultaban colocarlo. Ahora el arrastre sigue directamente el puntero; solo la inclinación se amortigua. La porción se integra desde la posición de entrega con resorte analítico y escala inicial calculada a partir de su proyección. Se quitaron flotación y paralaje. Las texturas se decodifican y suben a GPU antes de habilitar la interacción para evitar trabajo de carga durante el primer arrastre.
- P1: el empacado provocaba cortes y distraía del pedido. Se retiró del flujo principal: «Enviar pedido» abre una confirmación directa. Ninguna caja atraviesa el alimento porque esta secuencia ya no se ejecuta.
- P2: los controles de cantidad y los mensajes ocupaban la bandeja inferior. Se simplificó a foto, nombre y precio. La corrección de cantidades está en la factura.
- P2: la factura alta podía ocultar líneas incluso en escritorio amplio. Se compactaron sus filas y se retiraron textos decorativos del ticket de escritorio. La receta equivalente muestra las cinco líneas y el total. En pantallas bajas el listado puede desplazarse dentro del ticket y el total y CTA permanecen visibles.
- P2: en móvil el alimento quedaba demasiado pequeño. Se aumentó su zoom sin cortar pan ni bandeja. El resumen móvil se oculta cuando el ticket está visible, evitando cubrir «Enviar pedido».

La comprobación posterior confirma las correcciones en las capturas finales. No quedan P0/P1/P2 abiertos en el flujo del prototipo.

## Cinco superficies visuales

- Tipografía: Barlow Condensed y DM Sans conservan la jerarquía de títulos, controles y marca. La factura usa números y separadores legibles.
- Espaciado: alimento a la izquierda, ticket a la derecha y bandeja inferior. En 390 × 844 la bandeja se desplaza horizontalmente y el ticket queda debajo. No hubo desbordamiento horizontal del documento en 390, 1280 ni 1891 CSS px.
- Color: madera borgoña, carbón cálido, crema y coral conservados. El ticket claro se distingue del fondo; los controles mantienen foco visible.
- Imágenes: fotografías con alfa y luz coherente. Las porciones tienen tamaños adaptados al alimento. Son superficies fotográficas con profundidad, no modelos volumétricos completos.
- Copy: nombres y COP coherentes. El cierre indica demostración sin cobro ni transmisión a restaurantes. Se retiraron las afirmaciones de que el alimento estaba empacado.

## Pruebas funcionales observadas

En 1280 × 720 se realizaron arrastres nativos sobre la escena: champiñones añadieron $2.500, cebolla $1.500, repetir champiñones añadió una sola porción adicional. Arrastrar queso fuera no modificó el total. Quitar una porción desde la factura descontó su valor. El mismo flujo funcionó en hot dog y hamburguesa; las categorías conservaron recetas independientes.

En 390 × 844 un arrastre real de carne añadió $6.500 al pedido de hamburguesa, pasando de $15.500 a $22.000. «Ver factura» mostró ticket y CTA sin superposición. Enviar confirmó $22.000 y otorgó XP una sola vez. Se comprobó también la confirmación de escritorio, reinicio, entrada por Enter y control de movimiento reducido. El último control después de precargar texturas repitió arrastres de champiñón y cebolla desde una carga fresca, mostrando $22.000 sin errores de consola.

15 pruebas automatizadas pasan: precios, independencia, representación preparada, conservación de porciones, estabilidad de resortes a 30/60/120 Hz, equivalencia de trayectoria y runtime. La compilación de producción termina correctamente. Queda el aviso de tamaño de bundle de Vite por Three.js; no es un fallo de compilación.

## Evidencia

`qa/v3/reference-recipe-desktop.jpg`, `comparison.jpg`, `food-comparison.jpg`, `pizza-desktop.jpg`, `hotdog-desktop.jpg`, `burger-desktop.jpg`, `burger-mobile.jpg`, `invoice-mobile.jpg`, `confirmation-desktop.jpg`, `confirmation-mobile.jpg`.

## Límites y seguimiento P3

El móvil se revisó mediante viewport, no en un teléfono físico. La estabilidad matemática del resorte no garantiza una tasa de FPS en todos los equipos. Porciones repetidas de un mismo topping se superponen con pequeñas variaciones; cantidades extremas pueden ocultar otros ingredientes. El pedido es local y simulado. La fidelidad se evalúa frente a las correcciones del usuario, sin atribuir precisión de píxel al video comprimido ni a la captura anterior.
