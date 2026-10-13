export function porcentajeDe(valor: number, mayor: number): number {
  return mayor > 0 ? (valor / mayor) * 100 : 0;
}
