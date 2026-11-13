import './styles/main.css';
import './styles/login.css';

import { isApiError } from './api/errors';
import {
  completeAdultLogin,
  completeAdultProfile,
  loginAdultWithPopup,
  loginLearnerWithAge,
  type AdultProfileRequired,
  type AdultLoginResult,
} from './auth';
import type { UsersMeRestView } from './auth/types';
import { clearRedirectMarker, isRedirectReturn, redirectToUsersLogin } from './auth/popup';
import { initAgeModeIntegration } from './lib/age-mode';
import { initYear } from './lib/header';

function setStatus(element: HTMLElement | null, message: string, kind: 'ok' | 'error' | 'none' = 'none'): void {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle('is-error', kind === 'error');
  element.classList.toggle('is-ok', kind === 'ok');
}

function friendlyError(error: unknown): string {
  if (isApiError(error)) {
    switch (error.code) {
      case 'EDU_LOGIN_INVALID':
      case 'AUTH_FAIL':
        return 'Alias, contraseña o segundo paso incorrectos.';
      case 'EDU_ACCOUNT_LOCKED':
      case 'EDU_RATE_LIMITED':
      case 'RATE_LIMITED':
        return 'Demasiados intentos. Espera unos minutos y vuelve a probar.';
      case 'EDU_LEARNER_NOT_ACTIVE':
        return 'Esta cuenta no está activa. Habla con tu docente.';
      case 'EDU_ADULT_ACCOUNT_REQUIRED':
        return 'Esta cuenta es de una persona menor de 16. Entra con el alias de alumno que te dio tu tutor.';
      case 'EDU_LEARNER_EXPIRED':
        return 'Tu cuenta de alumno ha caducado. Pide a tu tutor que la actualice.';
      case 'EDU_PROFILE_INCOMPLETE':
        return 'Completa tu fecha de nacimiento para crear tu perfil de edu.';
      case 'EDU_BIRTHDATE_INVALID':
        return 'Esa fecha de nacimiento no es válida.';
      case 'EDU_PROFILE_SYNC_FAILED':
        return 'No se pudo guardar el dato en tu cuenta gacarbla. Inténtalo de nuevo.';
      case 'NETWORK_ERROR':
      case 'WS_UNAVAILABLE':
      case 'WS_CLOSED':
      case 'WS_TIMEOUT':
        return 'No se pudo conectar con el servidor. Revisa tu conexión.';
      default:
        return error.message || 'No se pudo completar el acceso.';
    }
  }

  return error instanceof Error ? error.message : 'No se pudo completar el acceso.';
}

function safeNextTarget(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function initLogin(): void {
  const adultButton = document.querySelector<HTMLButtonElement>('#users-login');
  const adultRedirect = document.querySelector<HTMLButtonElement>('#users-login-redirect');
  const adultStatus = document.querySelector<HTMLElement>('#adult-status');
  const learnerForm = document.querySelector<HTMLFormElement>('#learner-form');
  const learnerStatus = document.querySelector<HTMLElement>('#learner-status');
  const submit = document.querySelector<HTMLButtonElement>('#learner-submit');
  const factor = document.querySelector<HTMLSelectElement>('#learner-factor');
  const pinField = document.querySelector<HTMLElement>('#pin-field');
  const answerField = document.querySelector<HTMLElement>('#answer-field');
  const cards = document.querySelector<HTMLElement>('.auth-cards');
  const success = document.querySelector<HTMLElement>('#auth-success');
  const successName = document.querySelector<HTMLElement>('#success-name');
  const setup = document.querySelector<HTMLElement>('#profile-setup');
  const setupForm = document.querySelector<HTMLFormElement>('#profile-form');
  const setupSubmit = document.querySelector<HTMLButtonElement>('#profile-submit');
  const setupStatus = document.querySelector<HTMLElement>('#profile-status');
  const setupName = setupForm?.querySelector<HTMLInputElement>('input[name="nickname"]');
  const setupBirth = setupForm?.querySelector<HTMLInputElement>('input[name="birthDate"]');
  const setupNameHint = document.querySelector<HTMLElement>('#setup-name-hint');
  const setupAccount = document.querySelector<HTMLElement>('#setup-account');
  const successContinue = document.querySelector<HTMLAnchorElement>('#success-continue');
  const next = safeNextTarget(new URLSearchParams(window.location.search).get('next'));
  const aliasInput = learnerForm?.querySelector<HTMLInputElement>('input[name="alias"]');
  const pinInput = learnerForm?.querySelector<HTMLInputElement>('input[name="pin"]');
  const answerInput = learnerForm?.querySelector<HTMLInputElement>('input[name="answer"]');
  let pendingMe: UsersMeRestView | null = null;

  const updateFactor = (): void => {
    if (!factor) return;
    const pin = factor.value === 'pin';
    if (pinField) pinField.hidden = !pin;
    if (answerField) answerField.hidden = pin;
    if (pinInput) pinInput.required = pin;
    if (answerInput) answerInput.required = !pin;
  };

  factor?.addEventListener('change', () => {
    updateFactor();
    if (factor.value === 'pin') pinInput?.focus();
    else answerInput?.focus();
  });
  updateFactor();

  const showSuccess = (name: string): void => {
    if (successName) successName.textContent = name;
    if (successContinue) {
      successContinue.href = next ?? '/app/';
      successContinue.textContent = next?.startsWith('/join') ? 'Aceptar invitación' : 'Ir a mis aulas';
    }
    if (cards) cards.hidden = true;
    if (setup) setup.hidden = true;
    if (success) {
      success.hidden = false;
      success.setAttribute('tabindex', '-1');
      success.focus({ preventScroll: true });
      success.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'center',
      });
    }
    if (next) {
      window.setTimeout(() => window.location.assign(next), 550);
    }
  };

  const showAdult = (name: string | null): void => {
    setStatus(adultStatus, '');
    showSuccess(name || 'tu cuenta');
  };

  const showProfileSetup = (result: AdultProfileRequired): void => {
    pendingMe = result.me;
    if (cards) cards.hidden = true;
    if (success) success.hidden = true;
    if (setup) setup.hidden = false;
    if (setupAccount) {
      setupAccount.textContent = result.me.email ?? result.me.username;
    }
    if (setupName) {
      setupName.value = '';
      setupName.readOnly = false;
      if (setupNameHint) {
        setupNameHint.textContent =
          'Opcional. Puede ser distinto del nombre visible de tu cuenta gacarbla.';
      }
    }
    if (setupBirth) {
      setupBirth.value = '';
      setupBirth.required = true;
    }
    setStatus(adultStatus, '');
    setStatus(setupStatus, '');
    setup?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'center',
    });
    setupBirth?.focus({ preventScroll: true });
  };

  const handleAdultResult = (result: AdultLoginResult): void => {
    if (result.redirected) {
      setStatus(adultStatus, 'Te llevamos al acceso oficial en esta página…');
      return;
    }
    if (result.needsProfile) {
      showProfileSetup(result);
      return;
    }
    showAdult(result.me.display_name ?? result.me.username);
  };

  const cleanReturnUrl = (): string => {
    const url = new URL(window.location.href);
    url.searchParams.delete('mode');
    return url.toString();
  };

  adultButton?.addEventListener('click', async () => {
    adultButton.disabled = true;
    setStatus(adultStatus, 'Abriendo la ventana segura de api.gacarbla.es…');
    try {
      const result = await loginAdultWithPopup(cleanReturnUrl());
      handleAdultResult(result);
    } catch (error) {
      setStatus(adultStatus, friendlyError(error), 'error');
    } finally {
      if (!document.hidden) adultButton.disabled = false;
      adultButton.blur();
    }
  });

  adultRedirect?.addEventListener('click', () => {
    setStatus(adultStatus, 'Te llevamos al acceso oficial en esta página…');
    redirectToUsersLogin(cleanReturnUrl());
  });

  learnerForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!learnerForm || !submit) return;

    const data = new FormData(learnerForm);
    const alias = String(data.get('alias') ?? '').trim().toLowerCase();
    const password = String(data.get('password') ?? '');
    const selectedFactor = String(data.get('factor') ?? 'pin');
    const pin = String(data.get('pin') ?? '').trim();
    const answer = String(data.get('answer') ?? '').trim();

    if (!alias || !password) {
      setStatus(learnerStatus, 'Escribe tu alias y tu contraseña.', 'error');
      return;
    }
    if (selectedFactor === 'pin' && !pin) {
      setStatus(learnerStatus, 'Escribe tu PIN.', 'error');
      pinInput?.focus();
      return;
    }
    if (selectedFactor === 'answer' && !answer) {
      setStatus(learnerStatus, 'Escribe tu respuesta de seguridad.', 'error');
      answerInput?.focus();
      return;
    }

    submit.disabled = true;
    setStatus(learnerStatus, 'Entrando…');
    try {
      const result = await loginLearnerWithAge({
        alias,
        password,
        ...(selectedFactor === 'pin' ? { pin } : { securityAnswer: answer }),
      });
      setStatus(learnerStatus, '');
      showSuccess(result.edu.identity.alias || alias);
    } catch (error) {
      setStatus(learnerStatus, friendlyError(error), 'error');
    } finally {
      submit.disabled = false;
    }
  });

  setupForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!setupForm || !setupSubmit || !pendingMe) return;

    const data = new FormData(setupForm);
    const birthDate = String(data.get('birthDate') ?? '').trim();
    const nickname = String(data.get('nickname') ?? '').trim() || undefined;

    if (!birthDate) {
      setStatus(setupStatus, 'Escribe tu fecha de nacimiento.', 'error');
      setupBirth?.focus();
      return;
    }
    const birth = new Date(`${birthDate}T00:00:00`);
    if (Number.isNaN(birth.getTime()) || birth.getTime() > Date.now()) {
      setStatus(setupStatus, 'Esa fecha de nacimiento no es válida.', 'error');
      setupBirth?.focus();
      return;
    }
    let age = new Date().getFullYear() - birth.getFullYear();
    const monthDiff = new Date().getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && new Date().getDate() < birth.getDate())) age -= 1;
    if (age < 16) {
      setStatus(
        setupStatus,
        'Para menores de 16, entra con el alias de alumno que te dio tu tutor.',
        'error',
      );
      return;
    }

    setupSubmit.disabled = true;
    setStatus(setupStatus, 'Guardando tu perfil…');
    try {
      const result = await completeAdultProfile(pendingMe, {
        birthDate,
        ...(nickname ? { nickname } : {}),
      });
      pendingMe = null;
      showAdult(result.me.display_name ?? result.me.username);
    } catch (error) {
      setStatus(setupStatus, friendlyError(error), 'error');
    } finally {
      setupSubmit.disabled = false;
    }
  });

  if (isRedirectReturn()) {
    clearRedirectMarker();
    if (adultButton) adultButton.disabled = true;
    if (adultRedirect) adultRedirect.disabled = true;
    setStatus(adultStatus, 'Completando el acceso…');
    completeAdultLogin()
      .then(handleAdultResult)
      .catch((error) => setStatus(adultStatus, friendlyError(error), 'error'))
      .finally(() => {
        if (adultButton) adultButton.disabled = false;
        if (adultRedirect) adultRedirect.disabled = false;
      });
    return;
  }

  const mode = new URLSearchParams(window.location.search).get('mode');
  if (mode === 'learner') {
    aliasInput?.focus();
    learnerForm?.closest('section')?.scrollIntoView({ block: 'center' });
  } else if (mode === 'adult') {
    adultButton?.focus();
  }
}

initAgeModeIntegration();
initYear();
initLogin();
