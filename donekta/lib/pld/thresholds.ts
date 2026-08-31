import { umaToPesos } from "./uma";

export const UMBRAL_IDENTIFICACION_UMA = 1605;
export const UMBRAL_IDENTIFICACION_MXN = 100; // PRUEBA: cambiar a umaToPesos(UMBRAL_IDENTIFICACION_UMA) en producción
export const UMBRAL_AVISO_UMA = UMBRAL_IDENTIFICACION_UMA;
export const UMBRAL_AVISO_MXN = 100; // PRUEBA
export const VENTANA_ACUMULACION_MESES = 6;
