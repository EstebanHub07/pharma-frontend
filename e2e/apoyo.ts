import { APIRequestContext, expect, Page } from '@playwright/test';

// Cuentas de prueba creadas por las migraciones V2/V3 de PharmaBackend.
// Si cambiaste alguna contraseña, ajústala aquí.
export const USUARIOS = {
  admin: { usuario: 'admin', clave: 'password123' },
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

/** API del backend, para preparar datos sin pasar por la pantalla. */
export const API = 'http://localhost:8080/api/v1';

export async function tokenApi(
  request: APIRequestContext,
  quien: keyof typeof USUARIOS,
): Promise<string> {
  const { usuario, clave } = USUARIOS[quien];
  const r = await request.post(`${API}/auth/login`, {
    data: { username: usuario, password: clave },
  });
  expect(r.ok()).toBeTruthy();
  return (await r.json()).token as string;
}

/** DNI de 8 dígitos distinto en cada ejecución. */
export function dniAleatorio(): string {
  return String(Math.floor(10000000 + Math.random() * 89999999));
}
