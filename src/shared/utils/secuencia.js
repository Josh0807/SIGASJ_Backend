import { db } from '../db.js';
import { crearNumeroSeguimiento } from './helpers.js';

export function generarNumero(prefijo) {
  const existing = db.prepare('SELECT * FROM SecuenciasContador WHERE Prefijo = ?').get(prefijo);
  if (!existing) {
    db.prepare('INSERT INTO SecuenciasContador (Prefijo, UltimoValor) VALUES (?, 1)').run(prefijo);
    return crearNumeroSeguimiento(prefijo, 1);
  }

  const next = existing.UltimoValor + 1;
  db.prepare('UPDATE SecuenciasContador SET UltimoValor = ? WHERE Prefijo = ?').run(next, prefijo);
  return crearNumeroSeguimiento(prefijo, next);
}
