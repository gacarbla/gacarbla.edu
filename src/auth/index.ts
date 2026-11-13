import { isApiError } from '../api/errors';
import { resolveAgeMode, setAgeMode, type AgeMode } from '../lib/age-mode';
import { exchangeEdu, loginLearner, logoutEdu, refreshEdu, type LearnerLoginInput } from './edu';
import { openUsersLoginPopup, PopupBlockedError, redirectToUsersLogin } from './popup';
import { clearAllSessions, getUsersBirthDate, session, setUsersProfile } from './session';
import type { EduAuthData } from './types';
import { getUsersMe, logoutUsers, refreshUsers, restoreUsersSession } from './users';

export interface AdultLoginData {
  me: Awaited<ReturnType<typeof getUsersMe>>;
  edu: EduAuthData;
  ageMode: AgeMode;
}

export type AdultLoginResult =
  | ({ redirected: false } & AdultLoginData)
  | { redirected: true };

/**
 * Completa el acceso adulto cuando la ventana ya terminó (o cuando se vuelve
 * del fallback de redirect): restaura la cookie, lee el perfil y hace
 * `exchange` a edu.
 */
export async function completeAdultLogin(): Promise<AdultLoginData> {
  try {
    await restoreUsersSession();
  } catch (error) {
    if (isApiError(error) && error.status === 401) {
      throw new Error('No hay una sesión que restaurar. Vuelve a iniciar el acceso.');
    }
    if (isApiError(error) && error.status === 403 && error.code === 'FORBIDDEN') {
      throw new Error(
        'La API todavía no autoriza el acceso desde este dominio. Escríbenos a hola@gacarbla.es.',
      );
    }
    throw error;
  }

  const me = await getUsersMe();
  setUsersProfile(
    {
      email: me.email,
      username: me.username,
      displayName: me.display_name ?? me.username,
      birthDate: me.birth_date,
    },
    me.id,
  );

  const edu = await exchangeEdu();
  const ageMode = resolveAgeMode(me.birth_date, edu.identity.ageBand);
  setAgeMode(ageMode);
  return { me, edu, ageMode };
}

/**
 * Flujo normal de una cuenta API adulta: ventana de api.gacarbla.es y
 * restauración de la sesión.
 *
 * Si el navegador bloquea la ventana, se continúa en esta misma pestaña con
 * el redirect oficial y se vuelve a edu con `auth=redirect`.
 */
export async function loginAdultWithPopup(returnTo = window.location.href): Promise<AdultLoginResult> {
  try {
    await openUsersLoginPopup(returnTo);
  } catch (error) {
    if (error instanceof PopupBlockedError) {
      redirectToUsersLogin(returnTo);
      return { redirected: true };
    }
    throw error;
  }

  return { redirected: false, ...(await completeAdultLogin()) };
}

/** Login de un menor tutelado; no hay cuenta users. */
export async function loginLearnerWithAge(input: LearnerLoginInput): Promise<{
  edu: EduAuthData;
  ageMode: AgeMode;
}> {
  const edu = await loginLearner(input);
  // La identidad de edu solo trae la banda legal; hasta que la API exponga la
  // fecha exacta del menor, se usa como respaldo.
  const ageMode = resolveAgeMode(undefined, edu.identity.ageBand);
  setAgeMode(ageMode);
  return { edu, ageMode };
}

/** Refresca ambas sesiones y vuelve a aplicar el estilo si cambió la fecha. */
export async function refreshSessions(): Promise<void> {
  if (session.users) await refreshUsers();
  await refreshEdu();
  const birthDate = getUsersBirthDate();
  const mode = resolveAgeMode(birthDate, session.edu?.identity.ageBand);
  setAgeMode(mode);
}

export async function logout(): Promise<void> {
  try {
    await logoutEdu();
  } finally {
    try {
      await logoutUsers();
    } finally {
      clearAllSessions();
    }
  }
}
