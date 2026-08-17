import { randomBytes } from 'node:crypto';
import { badRequest } from '../errors.js';

const costaRicaFormatter = new Intl.DateTimeFormat('es-CR', {
  timeZone: 'America/Costa_Rica',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export function formatearFecha(valor) {
  if (!valor) return null;
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  return costaRicaFormatter.format(fecha).replace(/\s+/g, ' ');
}

export function nowIso() {
  return new Date().toISOString();
}

export function crearNumeroSeguimiento(prefijo, consecutivo) {
  return `${prefijo}-${String(consecutivo).padStart(4, '0')}`;
}

export function generarId(prefijo) {
  return `${prefijo}-${Date.now().toString(16)}-${randomBytes(2).toString('hex')}`;
}

export function textoOpcional(valor) {
  if (valor == null) return null;
  const trimmed = String(valor).trim();
  return trimmed ? trimmed : null;
}

export function textoRequerido(valor) {
  return String(valor ?? '').trim();
}

export function parseFecha(valor, mensaje = 'La fecha no es valida.') {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    throw badRequest(mensaje);
  }
  return fecha.toISOString();
}

export function parseBoolean(valor, fallback) {
  if (valor === undefined || valor === null || valor === '') return fallback;
  if (typeof valor === 'boolean') return valor;
  const normalized = String(valor).trim().toLowerCase();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  return fallback;
}

export function esCorreoValido(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}
