import { expect, Page } from '@playwright/test';

// Cuentas de prueba creadas por las migraciones V2/V3 de PharmaBackend.
// Si cambiaste alguna contraseña, ajústala aquí.
export const USUARIOS = {
  admin: { usuario: 'admin', clave: 'password' },
  vendedor: { usuario: 'vendedor', clave: 'password' },
  almacen: { usuario: 'almacenero', clave: 'password' },
} as const;

export async function iniciarSesion(
  page: Page,
  quien: keyof typeof USUARIOS,
  ruta = '/inicio',
) {
  const { usuario, clave } = USUARIOS[quien];
  await page.goto(ruta);
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('Usuario').fill(usuario);
  await page.getByLabel('Contraseña', { exact: true }).fill(clave);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(
    page.getByRole('button', { name: 'Cerrar sesión' }),
  ).toBeVisible();
}
