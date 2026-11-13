import './styles/main.css';
import './styles/app.css';

import { isApiError } from './api/errors';
import { restoreAppSession } from './auth';
import { acceptInvite } from './app/api';

const status = document.querySelector<HTMLElement>('#join-status');
const title = document.querySelector<HTMLElement>('#join-title');
const actions = document.querySelector<HTMLElement>('#join-actions');

const code = new URLSearchParams(window.location.search).get('code')?.trim() ?? '';

const messageFor = (error: unknown): string => {
  if (!isApiError(error)) return error instanceof Error ? error.message : 'No se pudo aceptar la invitación.';
  switch (error.code) {
    case 'EDU_INVITE_REVOKED':
      return 'Esta invitación fue revocada. Pide una nueva a tu docente.';
    case 'EDU_INVITE_EXPIRED':
      return 'Esta invitación ha caducado. Pide una nueva a tu docente.';
    case 'EDU_INVITE_EXHAUSTED':
      return 'Esta invitación ya no tiene usos disponibles.';
    case 'EDU_INVITE_NOT_FOUND':
      return 'No encontramos esta invitación. Revisa el enlace.';
    case 'EDU_CLASSROOM_INACTIVE':
      return 'El aula ya no está activa.';
    case 'EDU_TEACHER_ADULT_REQUIRED':
      return 'Solo una cuenta adulta puede aceptar una invitación de docente.';
    default:
      return error.message || 'No se pudo aceptar la invitación.';
  }
};

const render = (heading: string, text: string, tone: 'ok' | 'error' = 'ok'): void => {
  if (title) title.textContent = heading;
  if (status) {
    status.textContent = text;
    status.className = tone === 'error' ? 'notice notice--error' : 'notice notice--success';
  }
  if (actions) {
    actions.innerHTML = `
      <a class="btn btn--primary" href="/app/">Ir a mis aulas</a>
      <a class="btn btn--secondary" href="/">Volver a la portada</a>
    `;
  }
};

const run = async (): Promise<void> => {
  if (!code) {
    render('Invitación incompleta', 'El enlace no incluye un código de invitación.', 'error');
    return;
  }

  const restored = await restoreAppSession();
  if (!restored) {
    const next = `/join/?code=${encodeURIComponent(code)}`;
    window.location.replace(`/login/?next=${encodeURIComponent(next)}`);
    return;
  }

  try {
    await acceptInvite(code);
    render('Ya estás dentro', 'La invitación se ha aceptado. El aula aparecerá en tu lista.');
  } catch (error) {
    if (isApiError(error) && (error.code === 'EDU_INVITE_EXHAUSTED' || error.code === 'EDU_ALREADY_MEMBER')) {
      render('Ya formas parte', 'Esta invitación ya se había usado o ya perteneces al aula.');
      return;
    }
    render('No se pudo aceptar', messageFor(error), 'error');
  }
};

void run();
