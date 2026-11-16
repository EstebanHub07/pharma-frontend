import { expect, test } from '@playwright/test';
import { iniciarSesion } from './apoyo';

const CLIENTE = 'Ramos';
const PRODUCTO = 'Paracetamol';

// E2E-08
test('venta con cantidad mayor al stock: se avisa y no se registra', async ({ page }) => {
  let seRegistro = false;
  page.on('request', (r) => {
    if (r.url().endsWith('/api/v1/ventas') && r.method() === 'POST') seRegistro = true;
  });

  await iniciarSesion(page, 'vendedor', '/ventas/nueva');
  await page.getByTestId('buscar-cliente').fill(CLIENTE);
  await page.getByTestId('opcion-cliente').first().click();

  await page.getByTestId('buscar-producto').fill(PRODUCTO);
  const opcion = page.getByTestId('opcion-producto').first();
  const stock = Number(await opcion.getAttribute('data-stock'));
  await opcion.click();
  await page.getByTestId('cantidad').last().fill(String(stock + 1));

  await expect(page.getByText('Supera el stock disponible.')).toBeVisible();
  await page.getByRole('button', { name: 'Revisar venta' }).click();
  await expect(page.getByRole('alert')).toHaveText(/superan el stock disponible/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(seRegistro).toBe(false);
});

// E2E-09
test('venta sin productos: no se puede confirmar', async ({ page }) => {
  await iniciarSesion(page, 'vendedor', '/ventas/nueva');
  await page.getByTestId('buscar-cliente').fill(CLIENTE);
  await page.getByTestId('opcion-cliente').first().click();

  await page.getByRole('button', { name: 'Revisar venta' }).click();
  await expect(page.getByText('La venta debe incluir al menos un producto.')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
