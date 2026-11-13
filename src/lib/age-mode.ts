export type AgeMode = 'kid' | 'teen' | 'adult' | 'senior';

/** Bandas que devuelve hoy la API en `exchange` / claims. */
export type ApiAgeBand = '<14' | '14-15' | '16-17' | '18+';

const AGE_MODES: readonly AgeMode[] = ['kid', 'teen', 'adult', 'senior'];

export function isAgeMode(value: unknown): value is AgeMode {
  return typeof value === 'string' && (AGE_MODES as readonly string[]).includes(value);
}

function ageInYears(birthDate: string, now = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  let age = now.getFullYear() - year;
  const currentMonth = now.getMonth() + 1;
  if (currentMonth < month || (currentMonth === month && now.getDate() < day)) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

/**
 * Traduce la fecha de nacimiento al estilo visual.
 *
 * La interfaz se elige por la edad exacta: 8–12 → kid, 13–17 → teen,
 * 18–64 → adult, 65+ → senior. Las bandas de la API son requisitos legales,
 * no una clasificación visual; solo se usan como respaldo si no hay fecha.
 *
 * La fecha viene del perfil de `users` (servidor) y se usa únicamente para
 * presentación. No se persiste, no se registra y no decide permisos.
 */
export function resolveAgeMode(birthDate?: string | null, fallbackBand?: ApiAgeBand): AgeMode {
  const age = birthDate ? ageInYears(birthDate) : null;
  if (age !== null) {
    if (age < 13) return 'kid';
    if (age < 18) return 'teen';
    if (age < 65) return 'adult';
    return 'senior';
  }

  if (fallbackBand === '<14') return 'kid';
  if (fallbackBand === '14-15' || fallbackBand === '16-17') return 'teen';
  return 'adult';
}

/**
 * Aplica el estilo de edad. La portada pública arranca siempre en `kid`
 * (10 años). Cuando la API identifica a la persona, llama a esta función o
 * lanza el evento `edu:set-age-mode`.
 */
export function setAgeMode(mode: AgeMode): void {
  document.documentElement.dataset.age = mode;
}

export function initAgeModeIntegration(): void {
  window.addEventListener('edu:set-age-mode', (event) => {
    const mode = (event as CustomEvent<unknown>).detail;
    if (isAgeMode(mode)) setAgeMode(mode);
  });
}
