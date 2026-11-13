import { isApiError } from '../api/errors';
import { resolveAgeMode, setAgeMode, type AgeMode } from '../lib/age-mode';
import { exchangeEdu, loginLearner, logoutEdu, refreshEdu, type LearnerLoginInput } from './edu';
import { openUsersLoginPopup, PopupBlockedError, redirectToUsersLogin } from './popup';
import { clearAllSessions, getUsersBirthDate, session, setUsersProfile } from './session';
import type { EduAuthData, UsersMeRestView } from './types';
import { getUsersMe, logoutUsers, refreshUsers, restoreUsersSession } from './users';

export interface AdultLoginData {
  me: UsersMeRestView;
  edu: EduAuthData;
  ageMode: AgeMode;
}

/** Datos que la cuenta principal no tiene y hay que pedir para crear el perfil edu. */
export type AdultProfileField = 'birthDate';

export interface AdultProfileRequired {
  redirected: false;
  needsProfile: true;
  me: UsersMeRestView;
  missing: AdultProfileField[];
}

export type AdultLoginResult =
  | ({ redirected: false; needsProfile: false } & AdultLoginData)
  | AdultProfileRequired
  | { redirected: true };

function applyUsersMe(me: UsersMeRestView): void {
  setUsersProfile(
    {
      email: me.email,
      username: me.username,
      displayName: me.display_name ?? me.username,
      birthDate: me.birth_date,
    },
    me.id,
  );
}

/**
 * Completa el acceso adulto cuando la ventana ya terminó (o cuando se vuelve
 * del fallback de redirect): restaura la cookie, lee el perfil y hace
 * `exchange` a edu.
 *
 * Si la cuenta principal no tiene fecha de nacimiento, no se llama a soporte:
 * se devuelve `needsProfile` para que la pantalla de acceso pida completar el
 * perfil edu. Ese dato se sincroniza con la cuenta principal en la API.
 */
export async function completeAdultLogin(): Promise<AdultLoginResult> {
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
  applyUsersMe(me);

  if (!me.birth_date) {
    return { redirected: false, needsProfile: true, me, missing: ['birthDate'] };
  }

  try {
    const edu = await exchangeEdu();
    const ageMode = resolveAgeMode(me.birth_date, edu.identity.ageBand);
    setAgeMode(ageMode);
    return { redirected: false, needsProfile: false, me, edu, ageMode };
  } catch (error) {
    if (
      isApiError(error) &&
      (error.code === 'EDU_PROFILE_INCOMPLETE' || error.code === 'EDU_BIRTHDATE_REQUIRED')
    ) {
      return { redirected: false, needsProfile: true, me, missing: ['birthDate'] };
    }
    throw error;
  }
}

export interface AdultProfileInput {
  birthDate: string;
  nickname?: string;
}

/**
 * Crea el perfil edu con los datos que faltaban en la cuenta principal. La API
 * solo rellena campos vacíos: lo que ya existía queda bloqueado.
 */
export async function completeAdultProfile(
  me: UsersMeRestView,
  input: AdultProfileInput,
): Promise<AdultLoginData> {
  const edu = await exchangeEdu({
    birthDate: input.birthDate,
    ...(input.nickname ? { nickname: input.nickname } : {}),
  });

  const updatedMe: UsersMeRestView = {
    ...me,
    birth_date: input.birthDate,
    ...(input.nickname && !me.display_name ? { display_name: input.nickname } : {}),
  };
  applyUsersMe(updatedMe);

  const ageMode = resolveAgeMode(updatedMe.birth_date, edu.identity.ageBand);
  setAgeMode(ageMode);
  return { me: updatedMe, edu, ageMode };
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

  return completeAdultLogin();
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
