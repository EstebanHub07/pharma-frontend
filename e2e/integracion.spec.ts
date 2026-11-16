import { expect, test } from '@playwright/test';
import { API, dniAleatorio, iniciarSesion, tokenApi } from './apoyo';

// E2E-10 (matriz I-01)
test('cliente nuevo y venta inmediata', async ({ page, request }) => {
  const token = await tokenApi(request, 'vendedor');
  const dni = dniAleatorio();
  const alta = await request.post(`${API}/clientes`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      dni,
      nombres: 'Cliente',
      apellidos: 'Prueba E2E',
      email: `e2e.${dni}@example.com`,
      telefono: '987654321',
      direccion: 'Av. Prueba 123',
      estado: true,
    },
  });
  expect(alta.status()).toBe(201);

  await iniciarSesion(page, 'vendedor', '/ventas/nueva');
  await page.getByTestId('buscar-cliente').fill(dni);
  await page.getByTestId('opcion-cliente').first().click();

  await page.getByTestId('buscar-producto').fill('Paracetamol');
  await page.getByTestId('opcion-producto').first().click();

  await page.getByRole('button', { name: 'Revisar venta' }).click();
  await page.getByLabel('Imprimir el comprobante al registrar').uncheck();
  const registro = page.waitForResponse(
    (r) => r.url().endsWith('/api/v1/ventas') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Confirmar venta' }).click();
  expect((await registro).status()).toBe(201);
  await expect(page.getByText(/Venta registrada/)).toBeVisible();
  await expect(page.getByText(dni)).toBeVisible(); // el comprobante muestra el DNI del cliente nuevo
});

// E2E-11 (matriz I-08)
test('en Ventas, cambiar la fecha estando en la página 3 vuelve a la página 1', async ({ page }) => {
  await iniciarSesion(page, 'vendedor', '/ventas');
  const actual = page.getByTestId('pagina-actual');
  await expect(actual).toHaveText(/Página 1 de/);

  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(actual).toHaveText(/Página 2 de/);
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(actual).toHaveText(/Página 3 de/);
  await expect(page).toHaveURL(/pagina=2/);

  await page.getByLabel('Desde').fill('2026-01-01');
  await expect(page).toHaveURL(/pagina=0/);
  await expect(page).toHaveURL(/desde=2026-01-01/);
  await expect(actual).toHaveText(/Página 1 de/);
});
