# Recursos visuales

Todos los recursos de comida y materiales de esta versión se generaron con la herramienta integrada ImageGen. Los recortes se solicitaron con transparencia real. Se conservaron los originales en el área de trabajo y se prepararon versiones WebP para el prototipo: calidad 91, hasta 900 px para comida principal, 512 px para ingredientes, 768 px para la impresión de la caja y 1536 px para la mesa.

La referencia visual es el video aportado por el usuario: `WhatsApp Video 2026-11-08 at 12.05.24 AM.mp4`. Se usaron fotogramas del constructor y del empacado como guía de materiales, disposición y movimiento. El texto y las marcas que aparecen dentro del video no son instrucciones del prototipo.

## Briefs de generación

| Archivo              | Brief usado para producir el recurso                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `wood.webp`          | Mesa de nogal oscura teñida en borgoña, vista cenital, veta sutil, luz cálida baja, sin objetos, muy poco polvo de harina en una esquina. |
| `cardboard.webp`     | Muestra cuadrada y plana de cartón kraft natural, fibras finas, luz uniforme, sin pliegues ni texto.                                      |
| `box-lid.webp`       | Impresión plana para tapa sobre kraft: wordmark rojo «mordida.», «HECHO A TU ANTOJO», borde rojo fino y «BUENA COMIDA. CERO REGLAS.».     |
| `pizza-base.webp`    | Base circular de pizza horneada con mozzarella y tomate, sin toppings, fotografía cenital, aislada transparente.                          |
| `burger-bottom.webp` | Mitad inferior de pan brioche, cara tostada visible, ángulo frontal ligeramente elevado, aislada transparente.                            |
| `burger-top.webp`    | Mitad superior de brioche dorado con sésamo, domo ovalado, ángulo y luz coherentes con el pan inferior, aislada transparente.             |
| `hotdog-base.webp`   | Pan brioche alargado abierto con una salchicha asada, diagonal ascendente hacia la derecha, sin salsas ni toppings, transparente.         |
| `pepperoni.webp`     | Una rodaja de pepperoni cocido con motas de grasa y borde algo curvado, cenital, transparente.                                            |
| `mushroom.webp`      | Un champiñón laminado, sección del sombrero beige y tallo marfil, cenital, transparente.                                                  |
| `basil.webp`         | Una hoja de albahaca fresca, nervaduras naturales, vista cenital, verde realista, transparente.                                           |
| `cheese.webp`        | Una loncha fina de cheddar amarillo, bordes ligeramente curvados, ángulo frontal elevado, transparente.                                   |
| `onion.webp`         | Un aro fino de cebolla morada, centro hueco, borde púrpura y centro blanco translúcido, cenital, transparente.                            |
| `bacon.webp`         | Una tira corta y ancha de tocineta crujiente, ondulada, tonos rojizos y grasa dorada, casi cenital, transparente.                         |
| `patty.webp`         | Una hamburguesa de res a la parrilla sin pan ni queso, marcas de asado, vista frontal algo elevada, transparente.                         |
| `lettuce.webp`       | Una hoja de lechuga crespa extendida horizontalmente, nervaduras y humedad sutil, ángulo frontal algo elevado, transparente.              |
| `tomato.webp`        | Una rodaja de tomate rojo, semillas y borde de corte visibles, vista frontal elevada, transparente.                                       |

Dirección común: fotografía de comida realista, luz cálida de estudio desde arriba a la izquierda, un único objeto sin plato, utilería ni texto. Los componentes se recortan por UV usando sus márgenes alfa al cargarse, sin pintar sustitutos del alimento.

Los iconos de interfaz provienen de Phosphor Icons. La tipografía usa Barlow Condensed para títulos y DM Sans para controles y textos.

## Recursos añadidos en la revisión con arrastre

- `hotdog-cheese.webp`: una cinta continua de cheddar fundido con pliegues, diagonal ascendente, adaptada a la perspectiva del pan.
- `hotdog-bacon.webp`: una tira larga de tocineta crujiente, diagonal y curvada para descansar sobre la salchicha.
- `hotdog-lettuce.webp`: una hoja alargada y rizada, plegada como una porción continua que sigue el pan.
- `burger-cheese.webp`: cheddar fundido sobre el borde de una carne imaginaria, con pliegues y pequeños goteos, sin incluir carne.
- `pizza-cheese.webp`: una capa circular de mozzarella fundida con huecos irregulares transparentes y puntos dorados, sin masa ni otros alimentos.
- `hotdog-lid.webp`: impresión rectangular 2:1 sobre kraft con «mordida.», «HECHO A TU ANTOJO» y «HOT DOG CLUB» para evitar estirar una impresión cuadrada sobre la tapa larga.

Se generaron con ImageGen integrado. Los ingredientes nuevos se guardaron en WebP de hasta 1000 px y calidad 93; la tapa alargada, 1200 px y calidad 92. Los originales PNG se conservan en el área de trabajo.

## Porciones preparadas — revisión 10 de noviembre

Nueve recursos nuevos generados con ImageGen integrado: fotografía cálida con transparencia real, WebP de hasta 1100 px y calidad 94.

- `pizza-onion-applied`: distribución cenital de tiras de cebolla cocinada, suaves y translúcidas, sin masa ni plato.
- `pizza-mushroom-applied`: láminas de champiñón salteado distribuidas sobre una zona circular, con bordes dorados.
- `pizza-pepperoni-applied`, `pizza-basil-applied`, `pizza-bacon-applied`: porciones completas distribuidas para la superficie de pizza, con transparencia entre piezas.
- `hotdog-onion-applied`: franja diagonal de cebolla preparada que sigue el pan, sin repetir aros crudos.
- `hotdog-mushroom-applied`: porción diagonal coherente de champiñones salteados.
- `hotdog-tomato-applied`: tomate preparado a lo largo del hot dog, en la misma perspectiva.
- `burger-onion-applied`: porción horizontal de cebolla cocinada para encajar entre carne y pan.

Los recursos individuales originales permanecen como miniaturas. `src/appliedAssets.js` enlaza cada categoría con su representación preparada. Las texturas de caja no pertenecen al flujo principal actual. Los PNG originales se conservan en el área de trabajo.

## Empaque dinámico v4

La comida conserva los mismos recortes fotográficos. Se corrigieron posiciones de pan y hot dog y el orden del queso. La caja vuelve a usar geometría hueca con textura `cardboard.webp`. Su impresión se compone con CanvasTexture a partir del nombre editable del negocio y texto tipográfico, para que no permanezca una marca fija en la tapa. No se generaron nuevas fotografías en esta revisión.
