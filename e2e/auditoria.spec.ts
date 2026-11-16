import { expect, test } from '@playwright/test';
import { API, iniciarSesion, tokenApi } from './apoyo';

// E2E-12
test('la venta registrada aparece en la página de auditoría del admin', async ({ page, request }) => {
  // Se registra una venta por la API con el vendedor
  const token = await tokenApi(request, 'vendedor');
  const auth = { Authorization: `Bearer ${token}` };
  const clientes = await (await request.get(`${API}/clientes`, { headers: auth })).json();
  const cliente = clientes.find((c: { estado: boolean }) => c.estado);
  const pagina = await (
    await request.get(`${API}/productos?pagina=0&tamanio=100`, { headers: auth })
  ).json();
  const producto = pagina.contenido.find(
    (p: { estado: boolean; stock: number }) => p.estado && p.stock > 0,
  );
  const venta = await request.post(`${API}/ventas`, {
    headers: auth,
    data: { clienteId: cliente.id, detalles: [{ productoId: producto.id, cantidad: 1 }] },
  });
  expect(venta.status()).toBe(201);
  const ventaId = String((await venta.json()).id);

  await iniciarSesion(page, 'admin', '/auditoria?accion=VENTA_REGISTRADA');
  const fila = page.getByTestId('tabla-auditoria').locator('tbody tr', { hasText: ventaId }).first();
  await expect(fila).toContainText('vendedor');
  await expect(fila).toContainText('VENTA_REGISTRADA');
});

// E2E-13
test('el vendedor no ve Auditoría y la URL directa es denegada', async ({ page }) => {
  await iniciarSesion(page, 'vendedor');
  await expect(page.getByRole('link', { name: /Auditoría/ })).toHaveCount(0);
  await page.goto('/auditoria');
  await expect(page.getByRole('heading', { name: /Acceso denegado/ })).toBeVisible();
});
