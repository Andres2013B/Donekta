export const UMA_DIARIA_MXN = 117.31;
export function umaToPesos(umas: number, umaValue: number = UMA_DIARIA_MXN): number {
  return Math.round(umas * umaValue * 100) / 100;
}
