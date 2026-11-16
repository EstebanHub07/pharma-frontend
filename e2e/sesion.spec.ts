import { expect, test } from '@playwright/test';
import { iniciarSesion } from './apoyo';

// E2E-14
test('token alterado en sessionStorage: vuelve al login con aviso de sesión expirada', async ({ page }) => {
  await iniciarSesion(page, 'vendedor', '/productos');
  await expect(page.getByTestId('tabla-productos')).toBeVisible();

  // Se cambia la firma del token guardado, como si ya no fuera válido
  await page.evaluate(() => {
    const clave = 'pharmasoft.sesion';
    const sesion = JSON.parse(sessionStorage.getItem(clave) ?? '{}');
    sesion.token = sesion.token + 'x';
    sessionStorage.setItem(clave, JSON.stringify(sesion));
  });
  await page.reload();

  await expect(page).toHaveURL(/\/login\?.*expirada=1/);
  await expect(page.getByRole('status')).toHaveText(/Su sesión expiró/);
});
