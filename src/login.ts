import './styles/main.css';
import './styles/login.css';

import { isApiError } from './api/errors';
import { completeAdultLogin, loginAdultWithPopup, loginLearnerWithAge } from './auth';
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
      case 'EDU_BIRTHDATE_REQUIRED':
        return 'La cuenta no tiene fecha de nacimiento. Contacta con soporte.';
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
  const aliasInput = learnerForm?.querySelector<HTMLInputElement>('input[name="alias"]');
  const pinInput = learnerForm?.querySelector<HTMLInputElement>('input[name="pin"]');
  const answerInput = learnerForm?.querySelector<HTMLInputElement>('input[name="answer"]');

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
    if (cards) cards.hidden = true;
    if (success) {
      success.hidden = false;
      success.setAttribute('tabindex', '-1');
      success.focus({ preventScroll: true });
      success.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'center',
      });
    }
  };

  const showAdult = (name: string | null): void => {
    setStatus(adultStatus, '');
    showSuccess(name || 'tu cuenta');
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
      if (result.redirected) {
        setStatus(adultStatus, 'Te llevamos al acceso oficial en esta página…');
        return;
      }
      showAdult(result.me.display_name ?? result.me.username);
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

  if (isRedirectReturn()) {
    clearRedirectMarker();
    if (adultButton) adultButton.disabled = true;
    if (adultRedirect) adultRedirect.disabled = true;
    setStatus(adultStatus, 'Completando el acceso…');
    completeAdultLogin()
      .then((result) => showAdult(result.me.display_name ?? result.me.username))
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
