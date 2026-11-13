import './styles/main.css';
import './styles/login.css';

import { isApiError } from './api/errors';
import {
  completeAdultLogin,
  completeAdultProfile,
  loginAdultWithPopup,
  loginLearnerWithAge,
  type AdultLoginResult,
} from './auth';
import { identifyLearner } from './auth/edu';
import { redirectToUsersLogin } from './auth/popup';
import type { UsersMeRestView } from './auth/types';

type Step = 'choice' | 'account' | 'profile' | 'credentials' | 'method' | 'success';
type Factor = 'pin' | 'security_answer';

interface LoginState {
  step: Step;
  alias: string;
  password: string;
  factors: Factor[];
  question: string | null;
  pendingMe: UsersMeRestView | null;
  next: string;
  fallbackMethods: boolean;
  redirectReturn: boolean;
}

const state: LoginState = {
  step: 'choice',
  alias: '',
  password: '',
  factors: [],
  question: null,
  pendingMe: null,
  next: '/app/',
  fallbackMethods: false,
  redirectReturn: false,
};

const icon = (name: string): string => {
  const paths: Record<string, string> = {
    brand: '<path d="M12 3 4 7v5c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V7l-8-4Z" fill="currentColor" stroke="none"/><path d="m8.5 12 2.3 2.3 4.7-5" stroke="#fffdf7" stroke-width="1.8" fill="none"/>',
    key: '<circle cx="8" cy="15" r="3.5"/><path d="m10.5 12.5 8-8m-2.5 2.5 2.5 2.5m-5.5 0 2 2"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.4-5.5 7-5.5s6.2 1.9 7 5.5"/>',
    lock: '<rect x="4.5" y="10" width="15" height="10.5" rx="3"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    spark: '<path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7Z" fill="currentColor" stroke="none"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.lock}</svg>`;
};

const card = document.querySelector<HTMLElement>('#login-card');
const iconHolder = document.querySelector<HTMLElement>('#login-icon');
const eyebrow = document.querySelector<HTMLElement>('#login-eyebrow');
const title = document.querySelector<HTMLElement>('#login-title');
const description = document.querySelector<HTMLElement>('#login-desc');
const content = document.querySelector<HTMLElement>('#login-content');
const foot = document.querySelector<HTMLElement>('#login-foot');

const esc = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });

const safeNextTarget = (value: string | null): string => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/app/';
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return '/app/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/app/';
  }
};

state.next = safeNextTarget(new URLSearchParams(window.location.search).get('next'));

const friendlyError = (error: unknown): string => {
  if (!isApiError(error)) {
    return error instanceof Error ? error.message : 'No se pudo completar el acceso.';
  }
  switch (error.code) {
    case 'EDU_LOGIN_INVALID':
    case 'AUTH_FAIL':
      return 'El alias o la contraseña no son correctos.';
    case 'EDU_ACCOUNT_LOCKED':
    case 'EDU_RATE_LIMITED':
    case 'RATE_LIMITED':
      return 'Demasiados intentos. Espera unos minutos y vuelve a probar.';
    case 'EDU_LEARNER_NOT_ACTIVE':
      return 'Esta cuenta no está activa. Habla con tu docente.';
    case 'EDU_LEARNER_EXPIRED':
      return 'Tu cuenta de alumno ha caducado. Pide a tu tutor que la actualice.';
    case 'EDU_ADULT_ACCOUNT_REQUIRED':
      return 'Esta cuenta necesita el acceso de una persona adulta.';
    case 'EDU_PROFILE_INCOMPLETE':
      return 'Completa tu fecha de nacimiento para crear tu perfil de edu.';
    case 'EDU_BIRTHDATE_INVALID':
      return 'Esa fecha de nacimiento no es válida.';
    case 'EDU_PROFILE_SYNC_FAILED':
      return 'No se pudo guardar el dato en tu cuenta gacarbla. Inténtalo de nuevo.';
    case 'EDU_SESSION_EXPIRED':
    case 'AUTH_REQUIRED':
      return 'La sesión ha caducado. Vuelve a empezar.';
    case 'NETWORK_ERROR':
    case 'WS_UNAVAILABLE':
    case 'WS_CLOSED':
    case 'WS_TIMEOUT':
      return 'No se pudo conectar con el servidor. Revisa tu conexión.';
    default:
      return error.message || 'No se pudo completar el acceso.';
  }
};

const setHeader = (name: string, small: string, heading: string, text: string): void => {
  if (iconHolder) iconHolder.innerHTML = icon(name);
  if (eyebrow) eyebrow.textContent = small;
  if (title) title.textContent = heading;
  if (description) description.textContent = text;
};

const setFoot = (html: string): void => {
  if (foot) foot.innerHTML = html;
};

const alertBox = (message: string, tone: 'error' | 'info' = 'error'): string =>
  `<p class="login-alert login-alert--${tone}" role="${tone === 'error' ? 'alert' : 'status'}">${esc(message)}</p>`;

const focusStep = (): void => {
  window.requestAnimationFrame(() => {
    const first = content?.querySelector<HTMLElement>(
      'input:not([type="radio"]):not([type="hidden"]), select, button',
    );
    const target =
      first && (state.step === 'credentials' || state.step === 'method' || state.step === 'profile')
        ? first
        : title;
    target?.focus({ preventScroll: true });
  });
};

const showStep = (): void => {
  if (!content) return;
  content.classList.remove('is-changing');
  void content.offsetWidth;
  content.classList.add('is-changing');
  renderContent();
  focusStep();
};

const renderContent = (): void => {
  if (!content) return;
  switch (state.step) {
    case 'choice':
      renderChoice();
      break;
    case 'account':
      renderAccount();
      break;
    case 'profile':
      renderProfile();
      break;
    case 'credentials':
      renderCredentials();
      break;
    case 'method':
      renderMethod();
      break;
    case 'success':
      renderSuccess();
      break;
  }
};

const setBusy = (button: HTMLButtonElement | null, busy: boolean, label = 'Comprobando…'): void => {
  if (!button) return;
  if (busy) {
    button.dataset.label = button.textContent ?? '';
    button.disabled = true;
    button.textContent = label;
  } else {
    button.disabled = false;
    button.textContent = button.dataset.label ?? button.textContent;
  }
};

const renderChoice = (): void => {
  setHeader(
    'spark',
    'Acceso',
    '¿Cómo quieres entrar?',
    'Elige la puerta que corresponde a tu cuenta. Las aulas son privadas: solo se entra con una cuenta o una invitación.',
  );
  setFoot(
    '¿No tienes cuenta? <a href="https://api.gacarbla.es/users/register" target="_blank" rel="noopener noreferrer">Créala en la ventana oficial</a>.',
  );
  content!.innerHTML = `
    <div class="login-choices">
      <button class="login-choice login-choice--account" type="button" data-choice="account">
        <span class="login-choice__icon">${icon('key')}</span>
        <span class="login-choice__copy">
          <strong>Acceder con cuenta</strong>
          <small>Para tu cuenta de gacarbla</small>
        </span>
        <span class="login-choice__arrow" aria-hidden="true">${icon('arrow')}</span>
      </button>
      <button class="login-choice" type="button" data-choice="user">
        <span class="login-choice__icon">${icon('user')}</span>
        <span class="login-choice__copy">
          <strong>Acceder con usuario</strong>
          <small>Para el alias de tu aula</small>
        </span>
        <span class="login-choice__arrow" aria-hidden="true">${icon('arrow')}</span>
      </button>
    </div>
  `;
  content!.querySelector('[data-choice="account"]')?.addEventListener('click', () => {
    state.step = 'account';
    showStep();
    void runAccount();
  });
  content!.querySelector('[data-choice="user"]')?.addEventListener('click', () => {
    state.step = 'credentials';
    showStep();
  });
};

const renderAccount = (): void => {
  const completing = state.redirectReturn;
  setHeader(
    'key',
    'Cuenta gacarbla',
    completing ? 'Completando el acceso' : 'Acceso con cuenta',
    completing
      ? 'Estamos restaurando tu sesión segura. Un momento.'
      : 'Vamos a abrir la ventana oficial de gacarbla. Allí se gestionan la contraseña, el segundo factor y la verificación de email.',
  );
  setFoot(
    completing
      ? 'No cierres esta pestaña hasta que termine.'
      : 'La ventana oficial se abre en una pestaña nueva. No escribas tu contraseña en esta página.',
  );
  content!.innerHTML = `
    <div class="login-loading" role="status" aria-live="polite">
      <span class="login-spinner" aria-hidden="true"></span>
      <p><strong>${completing ? 'Restaurando tu sesión…' : 'Abriendo la ventana segura…'}</strong></p>
      <p class="login-hint">${completing ? 'Estamos comprobando tu cuenta y preparando tus aulas.' : 'Si no aparece, revisa el bloqueo de ventanas emergentes de tu navegador.'}</p>
    </div>
    <div class="login-actions">
      ${completing ? '' : '<button class="login-link" type="button" id="account-manual">¿No se abre? Accede en esta página</button>'}
      <button class="login-link login-link--muted" type="button" id="account-back">Volver</button>
    </div>
  `;
  content!.querySelector('#account-manual')?.addEventListener('click', () => {
    redirectToUsersLogin(window.location.href);
  });
  content!.querySelector('#account-back')?.addEventListener('click', () => {
    state.redirectReturn = false;
    state.step = 'choice';
    showStep();
  });
};

const handleAdultResult = (result: AdultLoginResult): void => {
  if (result.redirected) return;
  if (result.needsProfile) {
    state.pendingMe = result.me;
    state.step = 'profile';
    showStep();
    return;
  }
  showSuccess();
};

const renderAccountError = (message: string): void => {
  if (!content) return;
  content.innerHTML = `
    ${alertBox(message)}
    <div class="login-actions">
      <button class="btn btn--primary btn--lg login-submit" type="button" id="account-retry">Reintentar</button>
      <button class="login-link login-link--muted" type="button" id="account-back">Volver</button>
    </div>
  `;
  content.querySelector('#account-retry')?.addEventListener('click', () => {
    state.step = 'account';
    showStep();
    void (state.redirectReturn ? runRedirectCompletion() : runAccount());
  });
  content.querySelector('#account-back')?.addEventListener('click', () => {
    state.redirectReturn = false;
    state.step = 'choice';
    showStep();
  });
  focusStep();
};

const runAccount = async (): Promise<void> => {
  state.redirectReturn = false;
  try {
    handleAdultResult(await loginAdultWithPopup(window.location.href));
  } catch (error) {
    renderAccountError(friendlyError(error));
  }
};

const runRedirectCompletion = async (): Promise<void> => {
  try {
    handleAdultResult(await completeAdultLogin());
  } catch (error) {
    renderAccountError(friendlyError(error));
  }
};

const renderProfile = (): void => {
  const me = state.pendingMe;
  setHeader(
    'user',
    'Un último paso',
    'Completa tu perfil',
    'Solo falta la fecha de nacimiento. Tu nombre visible de edu es independiente: puedes usar el que prefieras.',
  );
  setFoot('La fecha se guarda en tu cuenta gacarbla y se usa para adaptar la web a tu edad.');
  content!.innerHTML = `
    <form class="login-form" id="profile-form" novalidate>
      <p class="login-account"><span>Cuenta vinculada</span><strong>${esc(me?.email ?? me?.username ?? 'tu cuenta')}</strong></p>
      <label class="login-field">Nombre visible en edu (opcional)
        <input name="nickname" type="text" autocomplete="nickname" maxlength="60" placeholder="Puede ser distinto del de tu cuenta" />
      </label>
      <label class="login-field">Fecha de nacimiento
        <input name="birthDate" type="date" autocomplete="bday" required />
      </label>
      <button class="btn btn--primary btn--lg login-submit" type="submit" id="profile-submit">Guardar y entrar</button>
      <div id="profile-alert"></div>
    </form>
  `;
  const form = content!.querySelector<HTMLFormElement>('#profile-form');
  const submit = content!.querySelector<HTMLButtonElement>('#profile-submit');
  const alertHolder = content!.querySelector<HTMLElement>('#profile-alert');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form || !submit || !me) return;
    const data = new FormData(form);
    const birthDate = String(data.get('birthDate') ?? '').trim();
    const nickname = String(data.get('nickname') ?? '').trim();
    if (!birthDate) {
      if (alertHolder) alertHolder.innerHTML = alertBox('Escribe tu fecha de nacimiento.');
      form.querySelector<HTMLInputElement>('input[name="birthDate"]')?.focus();
      return;
    }
    const birth = new Date(`${birthDate}T00:00:00`);
    if (Number.isNaN(birth.getTime()) || birth.getTime() > Date.now()) {
      if (alertHolder) alertHolder.innerHTML = alertBox('Esa fecha de nacimiento no es válida.');
      return;
    }
    let age = new Date().getFullYear() - birth.getFullYear();
    const monthDiff = new Date().getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && new Date().getDate() < birth.getDate())) age -= 1;
    if (age < 16) {
      if (alertHolder) alertHolder.innerHTML = alertBox('Para menores de 16, entra con el alias de alumno que te dio tu tutor.');
      return;
    }
    setBusy(submit, true, 'Guardando…');
    try {
      await completeAdultProfile(me, {
        birthDate,
        ...(nickname ? { nickname } : {}),
      });
      showSuccess();
    } catch (error) {
      if (alertHolder) alertHolder.innerHTML = alertBox(friendlyError(error));
      setBusy(submit, false);
    }
  });
};

const renderCredentials = (): void => {
  setHeader(
    'user',
    'Alumnado',
    'Acceso con usuario',
    'Usa el alias y la contraseña que te dio tu docente. Después te pediremos el segundo paso.',
  );
  setFoot('¿No tienes alias? Pídeselo a tu docente. No hay registro público de alumnado.');
  content!.innerHTML = `
    <form class="login-form" id="credentials-form" novalidate>
      <label class="login-field">Alias
        <input name="alias" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required value="${esc(state.alias)}" />
      </label>
      <label class="login-field">Contraseña
        <input name="password" type="password" autocomplete="current-password" required value="${esc(state.password)}" />
      </label>
      <button class="btn btn--primary btn--lg login-submit" type="submit" id="credentials-submit">Continuar</button>
      <div id="credentials-alert"></div>
      <button class="login-link login-link--muted" type="button" id="credentials-back">Volver al inicio</button>
    </form>
  `;
  const form = content!.querySelector<HTMLFormElement>('#credentials-form');
  const submit = content!.querySelector<HTMLButtonElement>('#credentials-submit');
  const alertHolder = content!.querySelector<HTMLElement>('#credentials-alert');
  content!.querySelector('#credentials-back')?.addEventListener('click', () => {
    state.step = 'choice';
    showStep();
  });
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form || !submit) return;
    const data = new FormData(form);
    const alias = String(data.get('alias') ?? '').trim().toLowerCase();
    const password = String(data.get('password') ?? '');
    if (!alias || !password) {
      if (alertHolder) alertHolder.innerHTML = alertBox('Escribe tu alias y tu contraseña.');
      return;
    }
    state.alias = alias;
    state.password = password;
    setBusy(submit, true);
    try {
      const result = await identifyLearner({ alias, password });
      if ('needsSecondFactor' in result) {
        state.factors = result.factors.length > 0 ? result.factors : ['pin', 'security_answer'];
        state.question = result.question ?? null;
        state.fallbackMethods = result.factors.length === 0;
        state.step = 'method';
        showStep();
        return;
      }
      showSuccess();
    } catch (error) {
      if (isApiError(error) && error.code === 'EDU_LOGIN_INVALID') {
        if (alertHolder) {
          alertHolder.innerHTML = `
            ${alertBox('El alias o la contraseña no son correctos.')}
            <button class="login-link" type="button" id="use-second-step">¿Tu contraseña es correcta? Continuar con mi segundo paso</button>
          `;
          alertHolder.querySelector('#use-second-step')?.addEventListener('click', () => {
            state.factors = ['pin', 'security_answer'];
            state.fallbackMethods = true;
            state.question = null;
            state.step = 'method';
            showStep();
          });
        }
      } else if (alertHolder) {
        alertHolder.innerHTML = alertBox(friendlyError(error));
      }
      setBusy(submit, false);
    }
  });
};

const renderMethod = (): void => {
  const factors = state.factors.length > 0 ? state.factors : (['pin', 'security_answer'] as Factor[]);
  const first = factors[0]!;
  setHeader(
    'lock',
    'Verificación',
    'Verifica que eres tú',
    factors.length > 1
      ? 'Elige el segundo paso que tengas configurado para entrar.'
      : first === 'pin'
        ? 'Introduce tu PIN para entrar en el aula.'
        : 'Responde a tu pregunta de seguridad para entrar en el aula.',
  );
  setFoot('Si no recuerdas el segundo paso, pide ayuda a tu docente.');
  content!.innerHTML = `
    <form class="login-form" id="method-form" novalidate>
      <div class="login-methods" role="radiogroup" aria-label="Método de verificación">
        ${factors.includes('pin') ? `
          <label class="login-method">
            <input type="radio" name="method" value="pin" ${first === 'pin' ? 'checked' : ''} />
            <span class="login-method__icon">${icon('lock')}</span>
            <span class="login-method__copy"><strong>PIN</strong><small>El código que te dio tu docente</small></span>
          </label>
        ` : ''}
        ${factors.includes('security_answer') ? `
          <label class="login-method">
            <input type="radio" name="method" value="security_answer" ${first === 'security_answer' ? 'checked' : ''} />
            <span class="login-method__icon">${icon('user')}</span>
            <span class="login-method__copy"><strong>Pregunta de seguridad</strong><small>La respuesta que elegiste</small></span>
          </label>
        ` : ''}
      </div>
      <div id="method-field"></div>
      <button class="btn btn--primary btn--lg login-submit" type="submit" id="method-submit">Entrar en mi aula</button>
      <div id="method-alert"></div>
      <button class="login-link login-link--muted" type="button" id="method-back">Usar otro alias</button>
    </form>
  `;
  const form = content!.querySelector<HTMLFormElement>('#method-form');
  const field = content!.querySelector<HTMLElement>('#method-field');
  const alertHolder = content!.querySelector<HTMLElement>('#method-alert');
  const submit = content!.querySelector<HTMLButtonElement>('#method-submit');

  const selectedMethod = (): Factor => {
    const checked = form?.querySelector<HTMLInputElement>('input[name="method"]:checked');
    return (checked?.value as Factor) ?? first;
  };

  const renderField = (): void => {
    if (!field) return;
    const method = selectedMethod();
    field.innerHTML = method === 'pin'
      ? `<label class="login-field">Introduce tu PIN
          <input name="pin" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="32" required />
        </label>`
      : `
        ${state.question ? `<p class="login-question">${esc(state.question)}</p>` : ''}
        <label class="login-field">Tu respuesta
          <input name="answer" type="text" autocomplete="off" maxlength="200" required />
        </label>
      `;
    field.querySelector<HTMLInputElement>('input')?.focus();
  };

  renderField();
  form?.querySelectorAll<HTMLInputElement>('input[name="method"]').forEach((input) => {
    input.addEventListener('change', renderField);
  });
  content!.querySelector('#method-back')?.addEventListener('click', () => {
    state.step = 'credentials';
    showStep();
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form || !submit) return;
    const method = selectedMethod();
    const value = method === 'pin'
      ? (form.querySelector<HTMLInputElement>('input[name="pin"]')?.value ?? '').trim()
      : (form.querySelector<HTMLInputElement>('input[name="answer"]')?.value ?? '').trim();
    if (!value) {
      if (alertHolder) {
        alertHolder.innerHTML = alertBox(
          method === 'pin' ? 'Escribe tu PIN.' : 'Escribe tu respuesta de seguridad.',
        );
      }
      return;
    }
    setBusy(submit, true, 'Entrando…');
    try {
      await loginLearnerWithAge({
        alias: state.alias,
        password: state.password,
        ...(method === 'pin' ? { pin: value } : { securityAnswer: value }),
      });
      showSuccess();
    } catch (error) {
      if (alertHolder) {
        alertHolder.innerHTML = alertBox(
          isApiError(error) && error.code === 'EDU_LOGIN_INVALID'
            ? 'El alias, la contraseña o el segundo paso no son correctos.'
            : friendlyError(error),
        );
      }
      setBusy(submit, false);
    }
  });
};

const renderSuccess = (): void => {
  setHeader(
    'check',
    'Sesión iniciada',
    'Ya estás dentro',
    'Abriendo tus aulas…',
  );
  setFoot('');
  content!.innerHTML = `
    <div class="login-loading login-loading--success" role="status" aria-live="polite">
      <span class="login-spinner" aria-hidden="true"></span>
      <p>Preparando tu espacio.</p>
    </div>
  `;
};

const showSuccess = (): void => {
  state.step = 'success';
  showStep();
  window.setTimeout(() => {
    window.location.assign(state.next);
  }, 650);
};

const render = (): void => {
  renderContent();
};

// El primer render se hace con el mismo pipeline que los cambios de paso.
const isRedirectReturn =
  new URLSearchParams(window.location.search).get('auth') === 'redirect';
if (isRedirectReturn) {
  const url = new URL(window.location.href);
  url.searchParams.delete('auth');
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  state.redirectReturn = true;
  state.step = 'account';
  showStep();
  void runRedirectCompletion();
} else {
  if (card) card.classList.add('is-ready');
  render();
  focusStep();
}
