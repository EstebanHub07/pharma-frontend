# Registro de incidencias — Sesión 14

Ciclo: reproducir → escribir (o identificar) la prueba que falla → corregir la causa → ejecutar toda la suite → commit `fix(...)` con el ID.

Estado **Corregida** = la corrección está en la rama; pasa a **Cerrada** cuando `npx playwright test --repeat-each=3` da 7/7 en las tres corridas y la fila de la matriz se cumple.

| ID | Módulo | Descripción y pasos | Severidad | Causa | Corrección (commit) | Estado |
|---|---|---|---|---|---|---|
| INC-01 | Ventas | Con 20 000 ventas cargadas (`docs/sql/volumen_pruebas.sql`), abrir **Ventas** descarga todas las ventas en una sola respuesta; el paginador solo recorre lo que ya llegó. | Alta | `GET /api/v1/ventas/buscar` devolvía `List`; la SPA convertía el arreglo en una sola página. | Backend `37652b1` feat(paginacion) · Frontend `631bb2b` feat(ventas) | Corregida |
| INC-02 | Ventas (matriz I-02) | En **Nueva venta**, buscar un producto con stock 0 lo muestra y permite agregarlo. | Media | El buscador filtraba solo por `estado`, no por `stock > 0`. | `9db04e4` fix(ventas) | Corregida |
| INC-03 | Productos y Ventas (matriz I-08) | 1) En Productos, ir a la página 3 y pulsar F5: vuelve a la página 1. 2) En Ventas, estando en la página 5, cambiar la fecha «Desde» no reinicia la página hasta pulsar «Buscar». | Media | La página, el tamaño y el orden vivían en `signal`, no en la URL. | `7086fd5` feat(productos) · `631bb2b` feat(ventas) | Corregida |
| INC-04 | API Productos | `GET /api/v1/productos?pagina=0&tamanio=500` responde 400 con el cuerpo genérico de Spring (sin `requestId`), en lugar de 409. | Baja | El controlador validaba con `ResponseStatusException`. | Backend `37652b1` feat(paginacion): `PaginacionUtil` lanza `ReglaNegocioException` (409) | Corregida |
| INC-05 | Ventas (matriz I-02, con volumen) | Con 5 000 productos cargados, en **Nueva venta** no aparecen los productos cuyo nombre queda después de los primeros 100 por orden alfabético (p. ej. «ProductoStock2»). | Media | La nueva venta carga una sola página de 100 productos y filtra en el navegador. | Pendiente: búsqueda de productos en el servidor. | Abierta |
