import './styles/main.css';
import './styles/app.css';

import { isApiError } from './api/errors';
import { restoreAppSession, logout } from './auth';
import { clearAllSessions, session } from './auth/session';
import type { ApiAgeBand } from './lib/age-mode';
import { resolveAgeMode, setAgeMode } from './lib/age-mode';
import {
  addManualGrade,
  addMember,
  archiveClassroom,
  changeAlias,
  createClassroom,
  createExercise,
  createFolder,
  createInvite,
  createPage,
  createThread,
  deleteExercise,
  deleteFolder,
  deleteMessage,
  deletePage,
  deleteClassroom,
  duplicatePage,
  getClassroom,
  getGradebook,
  getMe,
  getPage,
  getPageHtml,
  listClassrooms,
  listExercises,
  listFolders,
  listInvites,
  listMembers,
  listMessages,
  listPages,
  listPageComments,
  listThreads,
  searchContent,
  publishPage,
  removeMember,
  requestApproval,
  requestCenter,
  respondApproval,
  revokeInvite,
  sendMessage,
  startAttempt,
  submitAttempt,
  unpublishPage,
  updateClassroom,
  updatePage,
  updateNotificationPrefs,
  updateMember,
  addPageComment,
  listApprovals,
  type Approval,
  type Classroom,
  type ClassroomRole,
  type Comment,
  type EduMe,
  type Folder,
  type Invite,
  type Member,
  type Message,
  type PageSummary,
  type ViewerRole,
} from './app/api';

interface AppState {
  me: EduMe | null;
}

const state: AppState = { me: null };
let renderToken = 0;
let lastInvite: { link: string; role: ClassroomRole; classroomId: string } | null = null;
let selectedThreadId: string | null = null;

const view = (): HTMLElement => {
  const element = document.querySelector<HTMLElement>('#view');
  if (!element) throw new Error('Falta el contenedor principal.');
  return element;
};

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

const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const fmtDateShort = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(date);
};

const roleLabel = (role: ViewerRole | string): string => {
  switch (role) {
    case 'owner': return 'Propietario';
    case 'teacher': return 'Docente';
    case 'student': return 'Alumno';
    case 'guardian_observer': return 'Tutor';
    case 'center': return 'Centro';
    default: return role;
  }
};

const statusLabel = (status: string): string => {
  switch (status) {
    case 'active': return 'Activa';
    case 'archived': return 'Archivada';
    case 'deleted': return 'En papelera';
    case 'draft': return 'Borrador';
    case 'published': return 'Publicado';
    case 'removed': return 'Fuera';
    case 'in_progress': return 'En curso';
    case 'submitted': return 'Enviado';
    case 'graded': return 'Corregido';
    case 'expired': return 'Caducado';
    default: return status;
  }
};

const badge = (text: string, tone = ''): string =>
  `<span class="badge${tone ? ` badge--${tone}` : ''}">${esc(text)}</span>`;

const iconEmpty = (): string =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5Z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/><path d="M8 7h8M8 11h6"/></svg>`;

const iconArrow = (): string =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;

const notice = (message: string, tone: 'info' | 'error' | 'success' = 'info'): string =>
  `<div class="notice notice--${tone}" role="status">${message}</div>`;

const apiMessage = (error: unknown): string => {
  if (!isApiError(error)) return error instanceof Error ? error.message : 'Algo salió mal.';
  switch (error.code) {
    case 'EDU_CLASSROOM_LIMIT':
      return 'Ya tienes tu aula personal. El programa para centros permite crear más.';
    case 'EDU_CLASSROOM_STUDENT_LIMIT':
      return 'El aula personal admite hasta 12 alumnos. Para grupos mayores, solicita el programa para centros.';
    case 'EDU_APPROVAL_PENDING':
    case 'EDU_APPROVAL_REQUIRED':
      return 'Esta acción necesita la aprobación de tu tutor. Te avisaremos cuando la responda.';
    case 'EDU_APPROVAL_EMAIL_UNAVAILABLE':
      return 'No se pudo avisar a tu tutor. La solicitud queda pendiente; inténtalo más tarde.';
    case 'EDU_ROSTER_FORBIDDEN':
      return 'No puedes ver el censo completo de esta aula.';
    case 'EDU_PAGE_VERSION_CONFLICT':
      return 'Otra pestaña guardó cambios. Recarga la página para ver la última versión.';
    case 'EDU_PAGE_VERSION_REQUIRED':
      return 'Falta la versión de la página. Recarga antes de guardar.';
    case 'EDU_INVITE_REVOKED':
      return 'Esta invitación fue revocada.';
    case 'EDU_INVITE_EXPIRED':
      return 'Esta invitación ha caducado. Pide una nueva a tu docente.';
    case 'EDU_INVITE_EXHAUSTED':
      return 'Esta invitación ya no tiene usos disponibles.';
    case 'EDU_INVITE_NOT_FOUND':
      return 'No encontramos esta invitación.';
    case 'EDU_CLASSROOM_INACTIVE':
      return 'El aula ya no está activa.';
    case 'EDU_ATTEMPT_ACTIVE':
      return 'Ya tienes un intento abierto para este ejercicio.';
    case 'EDU_ATTEMPTS_EXHAUSTED':
      return 'Has usado todos los intentos de este ejercicio.';
    case 'EDU_ATTEMPT_CLOSED':
      return 'Este intento ya está cerrado.';
    case 'EDU_THREAD_CONFLICT':
      return 'Ya existe una conversación con esa persona.';
    case 'EDU_TEACHER_ADULT_REQUIRED':
      return 'Solo una cuenta adulta puede ser docente.';
    case 'EDU_MAIL_NOT_CONFIGURED':
      return 'El envío de emails no está configurado. Comparte el enlace manualmente.';
    case 'EDU_TICKET_BACKEND_UNAVAILABLE':
      return 'No se pudo registrar la solicitud del centro. Inténtalo de nuevo más tarde.';
    case 'AUTH_REQUIRED':
    case 'EDU_SESSION_EXPIRED':
      return 'La sesión ha caducado. Vuelve a entrar.';
    default:
      return error.message || 'No se pudo completar la acción.';
  }
};

const toast = (message: string, tone: 'ok' | 'error' = 'ok'): void => {
  const element = document.querySelector<HTMLElement>('#toast');
  if (!element) return;
  element.textContent = message;
  element.classList.toggle('toast--error', tone === 'error');
  element.hidden = false;
  window.clearTimeout((element as HTMLElement & { timer?: number }).timer);
  (element as HTMLElement & { timer?: number }).timer = window.setTimeout(() => {
    element.hidden = true;
  }, 4200);
};

const setBusy = (button: HTMLButtonElement | null, busy: boolean, label = 'Guardando…'): void => {
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

const safeNext = (): string => `${window.location.pathname}${window.location.search}${window.location.hash}`;

const goLogin = (): void => {
  clearAllSessions();
  window.location.replace(`/login/?next=${encodeURIComponent(safeNext())}`);
};

const paintAge = (me: EduMe): void => {
  const birthDate = session.edu?.birthDate ?? null;
  const band = (me.ageBand ?? session.edu?.identity.ageBand ?? undefined) as ApiAgeBand | undefined;
  setAgeMode(resolveAgeMode(birthDate, band));
};

const shell = (): void => {
  const me = state.me;
  if (!me) return;
  const name = me.nickname?.trim() || me.alias;
  const initial = name.slice(0, 1).toUpperCase() || 'G';
  const isLearner = me.kind === 'learner';
  document.body.classList.add('app-body');
  document.body.innerHTML = `
    <a class="skip-link" href="#view" id="skip-view">Saltar al contenido</a>
    <header class="app-top">
      <div class="container app-top__inner">
        <a class="brand" href="#/" aria-label="gacarbla.edu, ir a mis aulas">
          <span class="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 40 40">
              <rect width="40" height="40" rx="12" fill="currentColor" />
              <path d="M10.5 14.2c4.1-2 7.1-2 9.5 0 2.4-2 5.4-2 9.5 0v13.1c-4.1-1.9-7.1-1.9-9.5 0-2.4-1.9-5.4-1.9-9.5 0V14.2Z" fill="#fffdf7" />
              <path d="M20 14.5v12.5" stroke="#146b54" stroke-width="1.8" stroke-linecap="round" />
              <path d="M28.4 8.4c.4 2.3 1.5 3.4 3.8 3.8-2.3.4-3.4 1.5-3.8 3.8-.4-2.3-1.5-3.4-3.8-3.8 2.3-.4 3.4-1.5 3.8-3.8Z" fill="#f6c453" />
            </svg>
          </span>
          <span class="brand__word">gacarbla<span class="brand__tld">.edu</span></span>
        </a>
        <nav class="app-nav" aria-label="Principal">
          <a class="app-nav__link" href="#/">Mis aulas</a>
        </nav>
        <div class="profile-menu">
          <button class="profile-trigger" id="profile-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="profile-dropdown">
            <span class="profile-avatar" aria-hidden="true">${esc(initial)}</span>
            <span class="profile-name">${esc(name)}</span>
            <svg class="profile-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          <div class="profile-dropdown" id="profile-dropdown" role="menu" hidden>
            <div class="profile-dropdown__head">
              <span class="profile-avatar profile-avatar--lg" aria-hidden="true">${esc(initial)}</span>
              <div>
                <strong>${esc(name)}</strong>
                <span>${esc(me.alias)}</span>
              </div>
            </div>
            <a class="profile-menu__item" href="#/perfil" role="menuitem">Mi perfil</a>
            ${isLearner ? '' : '<a class="profile-menu__item" href="#/aprobaciones" role="menuitem">Aprobaciones</a>'}
            ${isLearner ? '' : '<div class="profile-menu__sep" role="separator"></div><a class="profile-menu__item profile-menu__item--muted" href="#/centros" role="menuitem">Programa para centros</a>'}
            <div class="profile-menu__sep" role="separator"></div>
            <button class="profile-menu__item profile-menu__item--danger" type="button" role="menuitem" id="logout">Cerrar sesión</button>
          </div>
        </div>
      </div>
    </header>
    <main class="container app-main" id="view" tabindex="-1"></main>
    <div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
  `;

  document.querySelector('#skip-view')?.addEventListener('click', (event) => {
    event.preventDefault();
    document.querySelector<HTMLElement>('#view')?.focus();
  });

  const trigger = document.querySelector<HTMLButtonElement>('#profile-trigger');
  const dropdown = document.querySelector<HTMLElement>('#profile-dropdown');
  const closeMenu = (restoreFocus = false): void => {
    if (!dropdown || !trigger) return;
    dropdown.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus();
  };
  const openMenu = (): void => {
    if (!dropdown || !trigger) return;
    dropdown.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    dropdown.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  };
  trigger?.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!dropdown) return;
    if (dropdown.hidden) openMenu();
    else closeMenu();
  });
  document.addEventListener('click', (event) => {
    if (!dropdown || dropdown.hidden) return;
    const target = event.target as Node;
    if (!dropdown.contains(target) && !trigger?.contains(target)) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (!dropdown || dropdown.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const items = Array.from(dropdown.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    const current = document.activeElement as HTMLElement | null;
    const index = items.indexOf(current ?? items[0]!);
    const next = event.key === 'ArrowDown'
      ? items[(index + 1) % items.length]
      : items[(index - 1 + items.length) % items.length];
    next?.focus();
  });
  dropdown?.querySelectorAll<HTMLElement>('[role="menuitem"]').forEach((item) => {
    item.addEventListener('click', () => closeMenu());
  });

  document.querySelector('#logout')?.addEventListener('click', async () => {
    try {
      await logout();
    } finally {
      clearAllSessions();
      window.location.assign('/');
    }
  });
};

const renderNotFound = (): void => {
  view().innerHTML = `
    ${notice('No encontramos esta página.', 'error')}
    <p><a class="btn btn--primary" href="#/">Volver a mis aulas</a></p>
  `;
};

const showFatal = (error: unknown): void => {
  if (isApiError(error) && (error.status === 401 || error.code === 'AUTH_REQUIRED')) {
    goLogin();
    return;
  }
  view().innerHTML = `
    ${notice(esc(apiMessage(error)), 'error')}
    <p><button class="btn btn--primary" type="button" id="retry">Reintentar</button></p>
  `;
  document.querySelector('#retry')?.addEventListener('click', () => { void route(); });
};

const route = async (): Promise<void> => {
  if (!state.me) return;
  const token = ++renderToken;
  const path = window.location.hash.replace(/^#/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  try {
    if (parts.length === 0) {
      await renderDashboard(token);
    } else if (parts[0] === 'perfil') {
      await renderProfile(token);
    } else if (parts[0] === 'aprobaciones') {
      await renderApprovals(token);
    } else if (parts[0] === 'centros') {
      renderCenters();
    } else if (parts[0] === 'aula' && parts[1]) {
      await renderClassroom(token, decodeURIComponent(parts[1]), parts[2] ?? 'temario', parts[3]);
    } else {
      renderNotFound();
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    const main = view();
    main.classList.remove('is-entering');
    void main.offsetWidth;
    main.classList.add('is-entering');
  } catch (error) {
    if (token === renderToken) showFatal(error);
  }
};

const navigate = (hash: string): void => {
  if (window.location.hash === hash) {
    void route();
  } else {
    window.location.hash = hash;
  }
};

/* ------------------------------------------------------------------ */
/* Panel                                                              */
/* ------------------------------------------------------------------ */

const renderDashboard = async (token: number): Promise<void> => {
  const classrooms = await listClassrooms();
  if (token !== renderToken) return;
  const me = state.me!;
  const name = me.nickname?.trim() || me.alias;
  const canCreate = me.kind === 'profile';
  const isCenter = me.kind === 'center';

  const cards = classrooms
    .map((classroom) => `
      <a class="classroom-card" href="#/aula/${esc(classroom.id)}/temario">
        <div class="classroom-card__top">
          <span class="classroom-card__badges">
            ${badge(roleLabel(classroom.viewerRole), classroom.viewerRole)}
            ${classroom.status !== 'active' ? badge(statusLabel(classroom.status), 'draft') : ''}
          </span>
          <span class="classroom-card__arrow" aria-hidden="true">${iconArrow()}</span>
        </div>
        <h2>${esc(classroom.name)}</h2>
        <p>${esc(classroom.description || 'Sin descripción.')}</p>
        <div class="classroom-card__meta">
          <span>${classroom.ageMin != null || classroom.ageMax != null ? `Edad ${classroom.ageMin ?? '—'}–${classroom.ageMax ?? '—'}` : 'Sin rango de edad'}</span>
          <span>Actualizada ${esc(fmtDateShort(classroom.updatedAt))}</span>
        </div>
      </a>
    `)
    .join('');

  view().innerHTML = `
    <section class="app-hero">
      <div class="app-hero__copy">
        <p class="eyebrow">Tu espacio</p>
        <h1>Hola, ${esc(name)}.</h1>
        <p>Organiza el temario, invita a tu grupo y sigue lo que pasa en cada aula.</p>
      </div>
      <div class="app-hero__actions">
        ${canCreate ? '<button class="btn btn--primary" id="new-classroom" type="button">Crear aula</button>' : ''}
      </div>
    </section>
    <div class="app-chips" aria-label="Características">
      <span class="app-chip">Aulas privadas por invitación</span>
      <span class="app-chip">Sin catálogo público</span>
      ${canCreate ? '<span class="app-chip">1 aula personal · 12 plazas</span>' : ''}
    </div>
    <div id="dashboard-notice"></div>
    ${
      classrooms.length === 0
        ? `<section class="panel"><div class="empty">
            <span class="empty__icon" aria-hidden="true">${iconEmpty()}</span>
            <h3>${canCreate ? 'Aún no tienes aulas.' : 'Aún no estás en ningún aula.'}</h3>
            <p>${isCenter
              ? 'La gestión de las aulas de centro estará disponible desde el panel del centro. Mientras tanto, puedes solicitar información desde el menú de perfil.'
              : canCreate
                ? 'Crea tu primera aula privada y comparte una invitación. Si te han invitado, abre el enlace que te envió tu docente.'
                : 'Abre el enlace de invitación que te dio tu docente. Cuando lo aceptes, el aula aparecerá aquí.'}</p>
            ${canCreate ? '<p><button class="btn btn--primary" type="button" id="empty-create">Crear mi aula</button></p>' : ''}
          </div></section>`
        : `<section class="classroom-grid" aria-label="Tus aulas">${cards}</section>`
    }
    <dialog class="app-dialog" id="classroom-dialog">
      <div class="app-dialog__inner">
        <h2>Crear un aula</h2>
        <p class="app-dialog__lede">Las aulas son privadas. Podrás invitar a tu grupo después.</p>
        <form id="classroom-form" class="form-grid" novalidate>
          <label class="field field--full">Nombre del aula
            <input name="name" type="text" minlength="3" maxlength="100" required placeholder="3º ESO — Matemáticas" />
          </label>
          <label class="field field--full">Descripción
            <textarea name="description" maxlength="2000" placeholder="Grupo de refuerzo, objetivos, horario…"></textarea>
          </label>
          <label class="field">Edad mínima
            <input name="ageMin" type="number" min="0" max="120" inputmode="numeric" placeholder="14" />
          </label>
          <label class="field">Edad máxima
            <input name="ageMax" type="number" min="0" max="120" inputmode="numeric" placeholder="15" />
          </label>
          <p class="field__hint field--full">Por defecto, una cuenta puede tener un aula personal con hasta 12 alumnos. El programa para centros no tiene esos límites.</p>
          <div class="form-actions field--full">
            <button class="btn btn--secondary" type="button" data-close>Cancelar</button>
            <button class="btn btn--primary" type="submit" id="classroom-submit">Crear aula</button>
          </div>
        </form>
      </div>
    </dialog>
  `;

  const dialog = document.querySelector<HTMLDialogElement>('#classroom-dialog');
  const openDialog = (): void => {
    if (dialog) {
      dialog.showModal();
      dialog.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
    }
  };
  document.querySelector('#new-classroom')?.addEventListener('click', openDialog);
  document.querySelector('#empty-create')?.addEventListener('click', openDialog);
  dialog?.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());

  const form = dialog?.querySelector<HTMLFormElement>('#classroom-form');
  const submit = dialog?.querySelector<HTMLButtonElement>('#classroom-submit') ?? null;
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form || !submit) return;
    const data = new FormData(form);
    const nameValue = String(data.get('name') ?? '').trim();
    const description = String(data.get('description') ?? '').trim();
    const ageMinRaw = String(data.get('ageMin') ?? '').trim();
    const ageMaxRaw = String(data.get('ageMax') ?? '').trim();
    if (nameValue.length < 3) {
      toast('El nombre debe tener al menos 3 caracteres.', 'error');
      return;
    }
    const ageMin = ageMinRaw ? Number(ageMinRaw) : undefined;
    const ageMax = ageMaxRaw ? Number(ageMaxRaw) : undefined;
    if (ageMin != null && ageMax != null && ageMin > ageMax) {
      toast('La edad mínima no puede ser mayor que la máxima.', 'error');
      return;
    }
    setBusy(submit, true, 'Creando…');
    try {
      const created = await createClassroom({
        name: nameValue,
        ...(description ? { description } : {}),
        ...(ageMin != null ? { ageMin } : {}),
        ...(ageMax != null ? { ageMax } : {}),
      }) as Classroom & { approvalId?: string; status?: string };
      dialog?.close();
      if ('approvalId' in created || String(created.status) === 'pending') {
        const holder = document.querySelector<HTMLElement>('#dashboard-notice');
        if (holder) {
          holder.innerHTML = notice(
            'Tu aula queda <strong>pendiente de aprobación de tu tutor</strong>. Te avisaremos cuando la responda.',
            'info',
          );
        }
        return;
      }
      toast('Aula creada.');
      navigate(`#/aula/${created.id}/temario`);
    } catch (error) {
      toast(apiMessage(error), 'error');
    } finally {
      setBusy(submit, false);
    }
  });
};

/* ------------------------------------------------------------------ */
/* Aula                                                               */
/* ------------------------------------------------------------------ */

const canManage = (role: ViewerRole): boolean =>
  role === 'owner' || role === 'teacher' || role === 'center';

const renderClassroom = async (
  token: number,
  classroomId: string,
  tab: string,
  sub?: string,
): Promise<void> => {
  const classroom = await getClassroom(classroomId);
  if (token !== renderToken) return;

  if (tab === 'temario' && !sub && !window.location.hash.includes('/temario')) {
    navigate(`#/aula/${encodeURIComponent(classroomId)}/temario`);
    return;
  }

  const manageable = canManage(classroom.viewerRole);
  const tabs: Array<{ key: string; label: string }> = [
    { key: 'temario', label: 'Temario' },
    { key: 'personas', label: 'Personas' },
    { key: 'ejercicios', label: 'Ejercicios' },
    { key: 'boletin', label: 'Boletín' },
    { key: 'mensajes', label: 'Mensajes' },
  ];

  view().innerHTML = `
    <a class="app-back" href="#/">← Mis aulas</a>
    <section class="classroom-head">
      <div>
        <div class="classroom-card__top">
          ${badge(roleLabel(classroom.viewerRole), classroom.viewerRole)}
          ${classroom.status !== 'active' ? badge(statusLabel(classroom.status), 'draft') : ''}
        </div>
        <h1>${esc(classroom.name)}</h1>
        <p>${esc(classroom.description || 'Sin descripción.')}</p>
      </div>
      <div class="classroom-head__actions">
        ${manageable ? '<button class="btn btn--secondary" id="edit-classroom" type="button">Editar aula</button>' : ''}
        ${classroom.viewerRole === 'owner' || classroom.viewerRole === 'center' ? '<button class="btn btn--ghost" id="archive-classroom" type="button">Archivar</button>' : ''}
        ${classroom.viewerRole === 'owner' || classroom.viewerRole === 'center' ? '<button class="btn btn--ghost" id="delete-classroom" type="button">Borrar</button>' : ''}
      </div>
    </section>
    <nav class="tabs" aria-label="Secciones del aula">
      ${tabs.map((item) => `
        <a class="tab" href="#/aula/${esc(classroomId)}/${item.key}" ${tab === item.key ? 'aria-current="page"' : ''}>${item.label}</a>
      `).join('')}
    </nav>
    <div id="tab-content"></div>
    <dialog class="app-dialog" id="edit-classroom-dialog">
      <div class="app-dialog__inner">
        <h2>Editar aula</h2>
        <form id="edit-classroom-form" class="form-grid" novalidate>
          <label class="field field--full">Nombre
            <input name="name" type="text" minlength="3" maxlength="100" required value="${esc(classroom.name)}" />
          </label>
          <label class="field field--full">Descripción
            <textarea name="description" maxlength="2000">${esc(classroom.description ?? '')}</textarea>
          </label>
          <label class="field">Edad mínima
            <input name="ageMin" type="number" min="0" max="120" value="${classroom.ageMin ?? ''}" />
          </label>
          <label class="field">Edad máxima
            <input name="ageMax" type="number" min="0" max="120" value="${classroom.ageMax ?? ''}" />
          </label>
          <div class="form-actions field--full">
            <button class="btn btn--secondary" type="button" data-close>Cancelar</button>
            <button class="btn btn--primary" type="submit" id="edit-classroom-submit">Guardar</button>
          </div>
        </form>
      </div>
    </dialog>
  `;

  const editDialog = document.querySelector<HTMLDialogElement>('#edit-classroom-dialog');
  document.querySelector('#edit-classroom')?.addEventListener('click', () => editDialog?.showModal());
  editDialog?.querySelector('[data-close]')?.addEventListener('click', () => editDialog.close());
  const editForm = editDialog?.querySelector<HTMLFormElement>('#edit-classroom-form');
  const editSubmit = editDialog?.querySelector<HTMLButtonElement>('#edit-classroom-submit') ?? null;
  editForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!editForm || !editSubmit) return;
    const data = new FormData(editForm);
    const nameValue = String(data.get('name') ?? '').trim();
    const description = String(data.get('description') ?? '').trim();
    const ageMinRaw = String(data.get('ageMin') ?? '').trim();
    const ageMaxRaw = String(data.get('ageMax') ?? '').trim();
    if (nameValue.length < 3) {
      toast('El nombre debe tener al menos 3 caracteres.', 'error');
      return;
    }
    setBusy(editSubmit, true);
    try {
      await updateClassroom(classroomId, {
        name: nameValue,
        description: description || null,
        ageMin: ageMinRaw ? Number(ageMinRaw) : null,
        ageMax: ageMaxRaw ? Number(ageMaxRaw) : null,
      });
      toast('Aula actualizada.');
      editDialog?.close();
      await route();
    } catch (error) {
      toast(apiMessage(error), 'error');
    } finally {
      setBusy(editSubmit, false);
    }
  });

  document.querySelector('#archive-classroom')?.addEventListener('click', async () => {
    if (!window.confirm('¿Archivar esta aula? Los alumnos dejarán de verla.')) return;
    try {
      await archiveClassroom(classroomId);
      toast('Aula archivada.');
      navigate('#/');
    } catch (error) {
      if (
        isApiError(error) &&
        (error.code === 'EDU_APPROVAL_REQUIRED' || error.code === 'EDU_APPROVAL_PENDING')
      ) {
        try {
          await requestApproval('archive_classroom', classroomId, {});
          toast('Solicitud enviada a tu tutor.');
          return;
        } catch (requestError) {
          toast(apiMessage(requestError), 'error');
          return;
        }
      }
      toast(apiMessage(error), 'error');
    }
  });

  document.querySelector('#delete-classroom')?.addEventListener('click', async () => {
    if (!window.confirm('¿Mover esta aula a la papelera? Podrás restaurarla durante 30 días.')) return;
    try {
      await deleteClassroom(classroomId);
      toast('Aula movida a la papelera.');
      navigate('#/');
    } catch (error) {
      if (
        isApiError(error) &&
        (error.code === 'EDU_APPROVAL_REQUIRED' || error.code === 'EDU_APPROVAL_PENDING')
      ) {
        try {
          await requestApproval('delete_classroom', classroomId, {});
          toast('Solicitud enviada a tu tutor.');
          return;
        } catch (requestError) {
          toast(apiMessage(requestError), 'error');
          return;
        }
      }
      toast(apiMessage(error), 'error');
    }
  });

  const content = document.querySelector<HTMLElement>('#tab-content');
  if (!content) return;

  if (tab === 'pagina' && sub) {
    await renderPageEditor(content, classroom, sub);
    return;
  }

  switch (tab) {
    case 'personas':
      await renderPeople(content, classroom);
      break;
    case 'ejercicios':
      await renderExercises(content, classroom);
      break;
    case 'boletin':
      await renderGradebook(content, classroom);
      break;
    case 'mensajes':
      await renderMessages(content, classroom);
      break;
    case 'temario':
    default:
      await renderSyllabus(content, classroom);
      break;
  }
};

/* ------------------------------------------------------------------ */
/* Temario                                                            */
/* ------------------------------------------------------------------ */

const renderSyllabus = async (container: HTMLElement, classroom: Classroom): Promise<void> => {
  const manageable = canManage(classroom.viewerRole);
  const [folders, pages] = await Promise.all([
    listFolders(classroom.id).catch(() => [] as Folder[]),
    listPages(classroom.id),
  ]);

  const pagesByFolder = new Map<string | null, PageSummary[]>();
  for (const page of pages) {
    const key = page.folderId ?? null;
    const list = pagesByFolder.get(key) ?? [];
    list.push(page);
    pagesByFolder.set(key, list);
  }

  const renderPage = (page: PageSummary): string => `
    <div class="content-item">
      <span aria-hidden="true">📄</span>
      <div class="content-item__main">
        <a class="content-item__title" href="#/aula/${esc(classroom.id)}/pagina/${esc(page.id)}">${esc(page.title)}</a>
        <div class="content-item__meta">
          ${badge(statusLabel(page.status), page.status === 'published' ? 'published' : 'draft')}
          <span>v${page.version}</span>
          <span>Actualizada ${esc(fmtDateShort(page.updatedAt))}</span>
        </div>
      </div>
      ${manageable ? `<div class="content-item__actions">
        <button class="icon-btn" type="button" data-delete-page="${esc(page.id)}" aria-label="Borrar ${esc(page.title)}">×</button>
      </div>` : ''}
    </div>
  `;
  const folderBlocks = folders
    .filter((folder) => folder.parentFolderId == null)
    .sort((a, b) => a.position - b.position || a.title.localeCompare(b.title))
    .map((folder) => {
      const list = (pagesByFolder.get(folder.id) ?? []).map(renderPage).join('');
      return `
        <div class="content-item content-item--folder">
          <span aria-hidden="true">📁</span>
          <div class="content-item__main">
            <span class="content-item__title">${esc(folder.title)}</span>
            <div class="content-item__meta"><span>${pagesByFolder.get(folder.id)?.length ?? 0} página${(pagesByFolder.get(folder.id)?.length ?? 0) === 1 ? '' : 's'}</span></div>
          </div>
          ${manageable ? `<div class="content-item__actions">
            <button class="icon-btn" type="button" data-delete-folder="${esc(folder.id)}" aria-label="Borrar ${esc(folder.title)}">×</button>
          </div>` : ''}
        </div>
        ${list}
      `;
    })
    .join('');

  const rootPages = (pagesByFolder.get(null) ?? []).map(renderPage).join('');
  const hasContent = folders.length > 0 || pages.length > 0;

  container.innerHTML = `
    <section class="panel">
      <div class="panel__head">
        <h2>Temario</h2>
        ${manageable ? `<div class="toolbar">
          <button class="btn btn--secondary" type="button" id="new-folder">Nueva carpeta</button>
          <button class="btn btn--primary" type="button" id="new-page">Nueva página</button>
        </div>` : ''}
      </div>
      <form id="content-search" class="toolbar" style="margin-bottom:1rem">
        <label class="field" style="flex:1;min-width:12rem">Buscar en el temario
          <input name="q" type="search" minlength="2" maxlength="200" placeholder="Fracciones, examen…" />
        </label>
        <button class="btn btn--secondary" type="submit" style="align-self:end">Buscar</button>
      </form>
      <div id="search-results"></div>
      ${hasContent
        ? `<div class="content-list">${folderBlocks}${rootPages}</div>`
        : `<div class="empty">
            <h3>El temario está vacío.</h3>
            <p>${manageable ? 'Crea una carpeta o una página para empezar. Las páginas se publican cuando están listas.' : 'Tu docente todavía no ha publicado contenido.'}</p>
          </div>`}
    </section>
    ${manageable ? `
      <dialog class="app-dialog" id="folder-dialog">
        <div class="app-dialog__inner">
          <h2>Nueva carpeta</h2>
          <form id="folder-form" class="form-grid" novalidate>
            <label class="field field--full">Título
              <input name="title" type="text" maxlength="160" required placeholder="Unidad 1" />
            </label>
            <div class="form-actions field--full">
              <button class="btn btn--secondary" type="button" data-close>Cancelar</button>
              <button class="btn btn--primary" type="submit" id="folder-submit">Crear carpeta</button>
            </div>
          </form>
        </div>
      </dialog>
      <dialog class="app-dialog" id="page-dialog">
        <div class="app-dialog__inner">
          <h2>Nueva página</h2>
          <form id="page-form" class="form-grid" novalidate>
            <label class="field field--full">Título
              <input name="title" type="text" maxlength="200" required placeholder="Fracciones" />
            </label>
            <label class="field field--full">Carpeta
              <select name="folderId">
                <option value="">Sin carpeta</option>
                ${folders.map((folder) => `<option value="${esc(folder.id)}">${esc(folder.title)}</option>`).join('')}
              </select>
            </label>
            <label class="field field--full">Contenido (Markdown)
              <textarea name="markdown" maxlength="200000" placeholder="# Fracciones&#10;&#10;Escribe aquí el contenido…"></textarea>
            </label>
            <div class="form-actions field--full">
              <button class="btn btn--secondary" type="button" data-close>Cancelar</button>
              <button class="btn btn--primary" type="submit" id="page-submit">Crear página</button>
            </div>
          </form>
        </div>
      </dialog>
    ` : ''}
  `;

  const folderDialog = document.querySelector<HTMLDialogElement>('#folder-dialog');
  const pageDialog = document.querySelector<HTMLDialogElement>('#page-dialog');
  document.querySelector('#new-folder')?.addEventListener('click', () => folderDialog?.showModal());
  document.querySelector('#new-page')?.addEventListener('click', () => pageDialog?.showModal());
  folderDialog?.querySelector('[data-close]')?.addEventListener('click', () => folderDialog.close());
  pageDialog?.querySelector('[data-close]')?.addEventListener('click', () => pageDialog.close());

  const folderForm = folderDialog?.querySelector<HTMLFormElement>('#folder-form');
  const folderSubmit = folderDialog?.querySelector<HTMLButtonElement>('#folder-submit') ?? null;
  folderForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!folderForm || !folderSubmit) return;
    const title = String(new FormData(folderForm).get('title') ?? '').trim();
    if (!title) return;
    setBusy(folderSubmit, true, 'Creando…');
    try {
      await createFolder(classroom.id, { title });
      folderDialog?.close();
      toast('Carpeta creada.');
      await route();
    } catch (error) {
      toast(apiMessage(error), 'error');
    } finally {
      setBusy(folderSubmit, false);
    }
  });

  const pageForm = pageDialog?.querySelector<HTMLFormElement>('#page-form');
  const pageSubmit = pageDialog?.querySelector<HTMLButtonElement>('#page-submit') ?? null;
  pageForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!pageForm || !pageSubmit) return;
    const data = new FormData(pageForm);
    const title = String(data.get('title') ?? '').trim();
    const folderId = String(data.get('folderId') ?? '').trim();
    const markdown = String(data.get('markdown') ?? '');
    if (!title) return;
    setBusy(pageSubmit, true, 'Creando…');
    try {
      const page = await createPage(classroom.id, {
        title,
        ...(folderId ? { folderId } : {}),
        ...(markdown ? { markdown } : {}),
      });
      pageDialog?.close();
      toast('Página creada.');
      navigate(`#/aula/${encodeURIComponent(classroom.id)}/pagina/${encodeURIComponent(page.id)}`);
    } catch (error) {
      toast(apiMessage(error), 'error');
    } finally {
      setBusy(pageSubmit, false);
    }
  });

  const searchForm = container.querySelector<HTMLFormElement>('#content-search');
  const searchResults = container.querySelector<HTMLElement>('#search-results');
  searchForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!searchForm || !searchResults) return;
    const query = String(new FormData(searchForm).get('q') ?? '').trim();
    if (query.length < 2) {
      toast('Escribe al menos dos caracteres.', 'error');
      return;
    }
    searchResults.innerHTML = notice('Buscando…');
    try {
      const results = await searchContent(query, classroom.id);
      searchResults.innerHTML = results.length
        ? `<div class="content-list">${results.map((result) => `
            <div class="content-item">
              <span aria-hidden="true">🔎</span>
              <div class="content-item__main">
                <a class="content-item__title" href="#/aula/${esc(classroom.id)}/pagina/${esc(result.pageId)}">${esc(result.title)}</a>
                <div class="content-item__meta">
                  ${badge(statusLabel(result.status), result.status === 'published' ? 'published' : 'draft')}
                  <span>${esc(fmtDateShort(result.updatedAt))}</span>
                </div>
                <p class="field__hint">${esc(result.snippet)}</p>
              </div>
            </div>
          `).join('')}</div>`
        : notice('No encontramos páginas con esa búsqueda.', 'info');
    } catch (error) {
      searchResults.innerHTML = notice(esc(apiMessage(error)), 'error');
    }
  });

  container.querySelectorAll<HTMLButtonElement>('[data-delete-page]').forEach((button) => {
    button.addEventListener('click', async () => {
      const pageId = button.dataset.deletePage;
      if (!pageId || !window.confirm('¿Mover esta página a la papelera?')) return;
      try {
        await deletePage(classroom.id, pageId);
        toast('Página borrada.');
        await route();
      } catch (error) {
        toast(apiMessage(error), 'error');
      }
    });
  });

  container.querySelectorAll<HTMLButtonElement>('[data-delete-folder]').forEach((button) => {
    button.addEventListener('click', async () => {
      const folderId = button.dataset.deleteFolder;
      if (!folderId || !window.confirm('¿Borrar esta carpeta y todo su contenido?')) return;
      try {
        await deleteFolder(classroom.id, folderId);
        toast('Carpeta borrada.');
        await route();
      } catch (error) {
        toast(apiMessage(error), 'error');
      }
    });
  });
};

const commentsPanel = (comments: Comment[], canComment: boolean, staff: boolean): string => `
  <section class="panel">
    <div class="panel__head"><h2>Comentarios</h2></div>
    ${comments.length
      ? `<div class="content-list">${comments.map((comment) => `
          <div class="content-item">
            <div class="content-item__main">
              <div class="content-item__meta">
                <span>${esc(comment.authorAlias ?? 'Participante')}</span>
                <span>${esc(fmtDate(comment.createdAt))}</span>
                ${comment.visibility === 'teachers' ? badge('Solo docentes') : ''}
              </div>
              <div class="message__body">${comment.deletedAt ? '<em>Comentario eliminado.</em>' : comment.bodyHtml}</div>
            </div>
          </div>
        `).join('')}</div>`
      : '<p class="field__hint">Todavía no hay comentarios.</p>'}
    ${canComment ? `
      <form id="comment-form" class="field" style="margin-top:1rem">
        <span>Nuevo comentario</span>
        <textarea name="bodyMd" maxlength="10000" required placeholder="Escribe un comentario…"></textarea>
        ${staff ? `<label class="field">Visibilidad
          <select name="visibility">
            <option value="classroom">Todo el aula</option>
            <option value="teachers">Solo docentes</option>
          </select>
        </label>` : ''}
        <div class="form-actions">
          <button class="btn btn--primary" type="submit" id="comment-submit">Comentar</button>
        </div>
      </form>
    ` : ''}
  </section>
`;

const bindComments = (container: HTMLElement, pageId: string): void => {
  const form = container.querySelector<HTMLFormElement>('#comment-form');
  const submit = container.querySelector<HTMLButtonElement>('#comment-submit');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form || !submit) return;
    const data = new FormData(form);
    const bodyMd = String(data.get('bodyMd') ?? '').trim();
    const visibility = String(data.get('visibility') ?? 'classroom') as 'classroom' | 'teachers';
    if (!bodyMd) {
      toast('Escribe un comentario.', 'error');
      return;
    }
    setBusy(submit, true, 'Enviando…');
    try {
      await addPageComment(pageId, bodyMd, visibility);
      toast('Comentario publicado.');
      await route();
    } catch (error) {
      toast(apiMessage(error), 'error');
    } finally {
      setBusy(submit, false);
    }
  });
};

const renderPageEditor = async (
  container: HTMLElement,
  classroom: Classroom,
  pageId: string,
): Promise<void> => {
  const manageable = canManage(classroom.viewerRole);
  const page = await getPage(pageId);
  const comments = await listPageComments(pageId).catch(() => [] as Comment[]);
  const canComment = classroom.viewerRole !== 'guardian_observer';

  if (!manageable || page.markdown === undefined) {
    let html = '';
    try {
      html = await getPageHtml(pageId);
    } catch (error) {
      container.innerHTML = notice(esc(apiMessage(error)), 'error');
      return;
    }
    container.innerHTML = `
      <section class="panel">
        <div class="panel__head">
          <div>
            <p class="eyebrow">Temario</p>
            <h2>${esc(page.title)}</h2>
          </div>
          <a class="btn btn--secondary" href="#/aula/${esc(classroom.id)}/temario">Volver</a>
        </div>
        <iframe class="page-frame" sandbox="" title="${esc(page.title)}" srcdoc="${esc(html)}"></iframe>
      </section>
      ${commentsPanel(comments, canComment, manageable)}
    `;
    bindComments(container, pageId);
    return;
  }

  container.innerHTML = `
    <section class="panel">
      <div class="panel__head">
        <div>
          <p class="eyebrow">Temario</p>
          <h2>Editar página</h2>
        </div>
        <div class="toolbar">
          <a class="btn btn--secondary" href="#/aula/${esc(classroom.id)}/temario">Volver</a>
          ${page.status === 'published'
            ? '<button class="btn btn--secondary" type="button" id="unpublish-page">Despublicar</button>'
            : '<button class="btn btn--primary" type="button" id="publish-page">Publicar</button>'}
          <button class="btn btn--secondary" type="button" id="duplicate-page">Duplicar</button>
          <button class="btn btn--ghost" type="button" id="delete-page">Borrar</button>
        </div>
      </div>
      <div class="editor">
        <label class="field">Título
          <input id="page-title" type="text" maxlength="200" value="${esc(page.title)}" />
        </label>
        <label class="field">Contenido (Markdown)
          <textarea class="editor__textarea" id="page-markdown" maxlength="200000">${esc(page.markdown ?? '')}</textarea>
        </label>
        <div class="content-item__meta">
          ${badge(statusLabel(page.status), page.status === 'published' ? 'published' : 'draft')}
          <span>Versión ${page.version}</span>
          <span>Actualizada ${esc(fmtDate(page.updatedAt))}</span>
        </div>
        <div class="form-actions">
          <button class="btn btn--primary" type="button" id="save-page">Guardar cambios</button>
        </div>
      </div>
    </section>
    ${commentsPanel(comments, canComment, manageable)}
  `;

  bindComments(container, pageId);

  const save = document.querySelector<HTMLButtonElement>('#save-page');
  save?.addEventListener('click', async () => {
    const title = document.querySelector<HTMLInputElement>('#page-title')?.value.trim() ?? '';
    const markdown = document.querySelector<HTMLTextAreaElement>('#page-markdown')?.value ?? '';
    if (!title) {
      toast('La página necesita un título.', 'error');
      return;
    }
    setBusy(save, true, 'Guardando…');
    try {
      const updated = await updatePage(classroom.id, pageId, { title, markdown }, page.version);
      toast('Página guardada.');
      page.version = updated.version;
      page.status = updated.status;
      await route();
    } catch (error) {
      toast(apiMessage(error), 'error');
    } finally {
      setBusy(save, false);
    }
  });

  document.querySelector('#publish-page')?.addEventListener('click', async () => {
    try {
      await publishPage(pageId);
      toast('Página publicada.');
      await route();
    } catch (error) {
      if (
        isApiError(error) &&
        (error.code === 'EDU_APPROVAL_REQUIRED' || error.code === 'EDU_APPROVAL_PENDING')
      ) {
        try {
          await requestApproval('publish_content', classroom.id, { pageId });
          toast('Solicitud enviada a tu tutor. Te avisaremos cuando la apruebe.');
          return;
        } catch (requestError) {
          toast(apiMessage(requestError), 'error');
          return;
        }
      }
      toast(apiMessage(error), 'error');
    }
  });

  document.querySelector('#unpublish-page')?.addEventListener('click', async () => {
    try {
      await unpublishPage(pageId);
      toast('Página despublicada.');
      await route();
    } catch (error) {
      toast(apiMessage(error), 'error');
    }
  });

  document.querySelector('#delete-page')?.addEventListener('click', async () => {
    if (!window.confirm('¿Mover esta página a la papelera?')) return;
    try {
      await deletePage(classroom.id, pageId);
      toast('Página borrada.');
      navigate(`#/aula/${encodeURIComponent(classroom.id)}/temario`);
    } catch (error) {
      toast(apiMessage(error), 'error');
    }
  });

  document.querySelector('#duplicate-page')?.addEventListener('click', async () => {
    try {
      const copy = await duplicatePage(pageId, `Copia de ${page.title}`);
      toast('Página duplicada.');
      navigate(`#/aula/${encodeURIComponent(classroom.id)}/pagina/${encodeURIComponent(copy.id)}`);
    } catch (error) {
      toast(apiMessage(error), 'error');
    }
  });
};

/* ------------------------------------------------------------------ */
/* Personas                                                           */
/* ------------------------------------------------------------------ */

const renderPeople = async (container: HTMLElement, classroom: Classroom): Promise<void> => {
  const manageable = canManage(classroom.viewerRole);
  let members: Member[] = [];
  try {
    members = await listMembers(classroom.id);
  } catch (error) {
    container.innerHTML = notice(esc(apiMessage(error)), 'error');
    return;
  }

  let invites: Invite[] = [];
  if (manageable) {
    invites = await listInvites(classroom.id).catch(() => []);
  }

  const memberRows = members.map((member) => `
    <tr>
      <td>
        <strong>${esc(member.nickname || member.alias || 'Sin nombre')}</strong>
        <div class="content-item__meta"><span>${esc(member.alias ?? '')}</span></div>
      </td>
      <td>${manageable && member.identityId !== classroom.ownerIdentityId && member.role !== 'guardian_observer'
        ? `<select data-member-role="${esc(member.identityId)}" aria-label="Rol de ${esc(member.alias ?? member.identityId)}">
            <option value="student" ${member.role === 'student' ? 'selected' : ''}>Alumno</option>
            <option value="teacher" ${member.role === 'teacher' ? 'selected' : ''}>Docente</option>
          </select>`
        : badge(roleLabel(member.role), member.role)}</td>
      <td>${badge(statusLabel(member.status), member.status === 'active' ? 'published' : 'draft')}</td>
      <td>${esc(fmtDateShort(member.joinedAt))}</td>
      ${manageable && member.identityId !== classroom.ownerIdentityId ? `<td><button class="icon-btn" type="button" data-remove-member="${esc(member.identityId)}" aria-label="Expulsar a ${esc(member.alias ?? member.identityId)}">×</button></td>` : `${manageable ? '<td></td>' : ''}`}
    </tr>
  `).join('');

  const inviteRows = invites.map((invite) => `
    <tr>
      <td>${badge(roleLabel(invite.role), invite.role)}</td>
      <td>${invite.uses} / ${invite.maxUses}</td>
      <td>${esc(fmtDateShort(invite.expiresAt))}</td>
      <td>${invite.revokedAt ? badge('Revocada', 'danger') : badge('Activa', 'published')}</td>
      <td>${invite.revokedAt ? '' : `<button class="icon-btn" type="button" data-revoke-invite="${esc(invite.id)}" aria-label="Revocar invitación">×</button>`}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    ${lastInvite && lastInvite.classroomId === classroom.id ? notice(
      `Enlace de invitación (${roleLabel(lastInvite.role)}): <strong>${esc(lastInvite.link)}</strong>
       <button class="btn btn--secondary" type="button" id="copy-invite">Copiar enlace</button>`,
      'success',
    ) : ''}
    <section class="panel">
      <div class="panel__head">
        <h2>Personas</h2>
        ${manageable ? '<button class="btn btn--primary" type="button" id="new-invite">Crear invitación</button>' : ''}
      </div>
      ${members.length
        ? `<div class="table-wrap"><table class="app-table">
            <thead><tr><th>Persona</th><th>Rol</th><th>Estado</th><th>Desde</th>${manageable ? '<th></th>' : ''}</tr></thead>
            <tbody>${memberRows}</tbody>
          </table></div>`
        : '<div class="empty"><h3>No hay miembros todavía.</h3><p>Comparte una invitación para que se unan.</p></div>'}
    </section>
    ${manageable ? `
      <section class="panel">
        <div class="panel__head"><h2>Invitaciones</h2></div>
        ${invites.length
          ? `<div class="table-wrap"><table class="app-table">
              <thead><tr><th>Rol</th><th>Usos</th><th>Caduca</th><th>Estado</th><th></th></tr></thead>
              <tbody>${inviteRows}</tbody>
            </table></div>`
          : '<p class="field__hint">No hay invitaciones activas. Crea una para compartir el aula.</p>'}
        <details class="content-item" style="margin-top:1rem">
          <summary>Añadir a alguien por su identificador</summary>
          <form id="member-form" class="form-grid" style="margin-top:.8rem">
            <label class="field field--full">Identidad (UUID)
              <input name="identityId" type="text" required placeholder="uuid de la persona" />
            </label>
            <label class="field">Rol
              <select name="role"><option value="student">Alumno</option><option value="teacher">Docente</option></select>
            </label>
            <div class="form-actions field--full">
              <button class="btn btn--primary" type="submit" id="member-submit">Añadir</button>
            </div>
          </form>
        </details>
      </section>
      <dialog class="app-dialog" id="invite-dialog">
        <div class="app-dialog__inner">
          <h2>Crear invitación</h2>
          <p class="app-dialog__lede">El código se muestra una sola vez. Comparte el enlace, no el código suelto.</p>
          <form id="invite-form" class="form-grid" novalidate>
            <label class="field">Rol
              <select name="role"><option value="student">Alumno</option><option value="teacher">Docente</option></select>
            </label>
            <label class="field">Usos máximos
              <input name="maxUses" type="number" min="1" max="500" value="30" required />
            </label>
            <label class="field field--full">Caduca
              <select name="expiresInSec">
                <option value="3600">En 1 hora</option>
                <option value="86400">En 1 día</option>
                <option value="604800" selected>En 7 días</option>
                <option value="2592000">En 30 días</option>
              </select>
            </label>
            <div class="form-actions field--full">
              <button class="btn btn--secondary" type="button" data-close>Cancelar</button>
              <button class="btn btn--primary" type="submit" id="invite-submit">Crear invitación</button>
            </div>
          </form>
        </div>
      </dialog>
    ` : ''}
  `;

  document.querySelector('#copy-invite')?.addEventListener('click', async () => {
    if (!lastInvite) return;
    try {
      await navigator.clipboard.writeText(lastInvite.link);
      toast('Enlace copiado.');
    } catch {
      toast('No se pudo copiar. Selecciona el enlace manualmente.', 'error');
    }
  });

  const inviteDialog = document.querySelector<HTMLDialogElement>('#invite-dialog');
  document.querySelector('#new-invite')?.addEventListener('click', () => inviteDialog?.showModal());
  inviteDialog?.querySelector('[data-close]')?.addEventListener('click', () => inviteDialog.close());
  const inviteForm = inviteDialog?.querySelector<HTMLFormElement>('#invite-form');
  const inviteSubmit = inviteDialog?.querySelector<HTMLButtonElement>('#invite-submit') ?? null;
  inviteForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!inviteForm || !inviteSubmit) return;
    const data = new FormData(inviteForm);
    const role = String(data.get('role') ?? 'student') as 'student' | 'teacher';
    const maxUses = Number(data.get('maxUses') ?? 1);
    const expiresInSec = Number(data.get('expiresInSec') ?? 604800);
    setBusy(inviteSubmit, true, 'Creando…');
    try {
      const created = await createInvite(classroom.id, { role, maxUses, expiresInSec });
      lastInvite = {
        link: `${window.location.origin}/join/?code=${encodeURIComponent(created.code)}`,
        role: created.role,
        classroomId: classroom.id,
      };
      inviteDialog?.close();
      toast('Invitación creada. Copia el enlace.');
      await route();
    } catch (error) {
      toast(apiMessage(error), 'error');
    } finally {
      setBusy(inviteSubmit, false);
    }
  });

  const memberForm = document.querySelector<HTMLFormElement>('#member-form');
  const memberSubmit = document.querySelector<HTMLButtonElement>('#member-submit') ?? null;
  memberForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!memberForm || !memberSubmit) return;
    const data = new FormData(memberForm);
    const identityId = String(data.get('identityId') ?? '').trim();
    const role = String(data.get('role') ?? 'student') as ClassroomRole;
    if (!identityId) return;
    setBusy(memberSubmit, true, 'Añadiendo…');
    try {
      await addMember(classroom.id, { identityId, role });
      toast('Miembro añadido.');
      await route();
    } catch (error) {
      toast(apiMessage(error), 'error');
    } finally {
      setBusy(memberSubmit, false);
    }
  });

  container.querySelectorAll<HTMLButtonElement>('[data-remove-member]').forEach((button) => {
    button.addEventListener('click', async () => {
      const identityId = button.dataset.removeMember;
      if (!identityId || !window.confirm('¿Expulsar a esta persona del aula?')) return;
      try {
        await removeMember(classroom.id, identityId);
        toast('Miembro expulsado.');
        await route();
      } catch (error) {
        toast(apiMessage(error), 'error');
      }
    });
  });

  container.querySelectorAll<HTMLSelectElement>('[data-member-role]').forEach((select) => {
    select.addEventListener('change', async () => {
      const identityId = select.dataset.memberRole;
      const role = select.value as 'student' | 'teacher';
      if (!identityId) return;
      try {
        await updateMember(classroom.id, { identityId, role });
        toast('Rol actualizado.');
        await route();
      } catch (error) {
        toast(apiMessage(error), 'error');
        await route();
      }
    });
  });

  container.querySelectorAll<HTMLButtonElement>('[data-revoke-invite]').forEach((button) => {
    button.addEventListener('click', async () => {
      const inviteId = button.dataset.revokeInvite;
      if (!inviteId || !window.confirm('¿Revocar esta invitación?')) return;
      try {
        await revokeInvite(classroom.id, inviteId);
        toast('Invitación revocada.');
        await route();
      } catch (error) {
        toast(apiMessage(error), 'error');
      }
    });
  });
};

/* ------------------------------------------------------------------ */
/* Ejercicios                                                         */
/* ------------------------------------------------------------------ */

const typeLabel = (type: string): string => {
  switch (type) {
    case 'multiple_choice': return 'Opción múltiple';
    case 'true_false': return 'Verdadero / falso';
    case 'short_answer': return 'Respuesta corta';
    case 'open': return 'Respuesta abierta';
    default: return type;
  }
};

const renderExercises = async (container: HTMLElement, classroom: Classroom): Promise<void> => {
  const manageable = canManage(classroom.viewerRole);
  const [exercises, pages] = await Promise.all([
    listExercises(classroom.id),
    listPages(classroom.id).catch(() => [] as PageSummary[]),
  ]);
  const isStudent = classroom.viewerRole === 'student';

  const cards = exercises.map((exercise) => {
    const supported = ['multiple_choice', 'true_false', 'short_answer'].includes(exercise.type);
    return `
    <div class="content-item">
      <span aria-hidden="true">🧩</span>
      <div class="content-item__main">
        <span class="content-item__title">${esc(exercise.promptMd.slice(0, 120))}${exercise.promptMd.length > 120 ? '…' : ''}</span>
        <div class="content-item__meta">
          ${badge(typeLabel(exercise.type))}
          ${badge(statusLabel(exercise.status), exercise.status === 'published' ? 'published' : 'draft')}
          <span>${exercise.points} puntos</span>
          <span>${exercise.attemptsAllowed} intento${exercise.attemptsAllowed === 1 ? '' : 's'}</span>
          ${isStudent && exercise.status === 'published' && !supported ? '<span>Tipo no disponible en esta versión</span>' : ''}
        </div>
      </div>
      <div class="content-item__actions">
        ${isStudent && exercise.status === 'published' && supported
          ? `<button class="btn btn--primary" type="button" data-start-exercise="${esc(exercise.id)}">Empezar</button>`
          : ''}
        ${manageable ? `<button class="icon-btn" type="button" data-delete-exercise="${esc(exercise.id)}" aria-label="Borrar ejercicio">×</button>` : ''}
      </div>
    </div>
  `;
  }).join('');

  container.innerHTML = `
    <section class="panel">
      <div class="panel__head">
        <h2>Ejercicios</h2>
        ${manageable && pages.length > 0 ? '<button class="btn btn--primary" type="button" id="new-exercise">Nuevo ejercicio</button>' : ''}
      </div>
      ${manageable && pages.length === 0 ? notice('Crea primero una página en el temario: los ejercicios publicados necesitan una página.', 'info') : ''}
      ${exercises.length
        ? `<div class="content-list">${cards}</div>`
        : `<div class="empty"><h3>No hay ejercicios.</h3><p>${manageable ? 'Crea uno para practicar lo que estás enseñando.' : 'Tu docente todavía no ha publicado ejercicios.'}</p></div>`}
    </section>
    ${manageable ? `
      <dialog class="app-dialog" id="exercise-dialog">
        <div class="app-dialog__inner">
          <h2>Nuevo ejercicio</h2>
          <form id="exercise-form" class="form-grid" novalidate>
            <label class="field field--full">Página del temario
              <select name="pageId" required>
                <option value="">Elige una página</option>
                ${pages.map((page) => `<option value="${esc(page.id)}">${esc(page.title)}</option>`).join('')}
              </select>
            </label>
            <label class="field">Tipo
              <select name="type" id="exercise-type">
                <option value="multiple_choice">Opción múltiple</option>
                <option value="true_false">Verdadero / falso</option>
                <option value="short_answer">Respuesta corta</option>
              </select>
            </label>
            <label class="field">Puntos
              <input name="points" type="number" min="0.01" max="1000" step="0.01" value="1" required />
            </label>
            <label class="field field--full">Enunciado
              <textarea name="promptMd" required placeholder="¿Cuál es el resultado de 2 + 2?"></textarea>
            </label>
            <div class="field field--full" id="mc-fields">
              <label class="field">Opciones (una por línea)
                <textarea name="options" placeholder="3&#10;4&#10;5"></textarea>
              </label>
              <label class="field" style="margin-top:.5rem">Opción correcta (número)
                <input name="correctIndex" type="number" min="1" max="50" value="1" />
              </label>
            </div>
            <label class="field field--full" id="tf-fields" hidden>Respuesta correcta
              <select name="tfCorrect"><option value="true">Verdadero</option><option value="false">Falso</option></select>
            </label>
            <label class="field field--full" id="sa-fields" hidden>Respuestas aceptadas (separadas por comas)
              <input name="accepted" type="text" placeholder="4, cuatro" />
            </label>
            <label class="field">Intentos permitidos
              <input name="attemptsAllowed" type="number" min="1" max="20" value="1" required />
            </label>
            <div class="form-actions field--full">
              <button class="btn btn--secondary" type="button" data-close>Cancelar</button>
              <button class="btn btn--primary" type="submit" id="exercise-submit">Crear y publicar</button>
            </div>
          </form>
        </div>
      </dialog>
    ` : ''}
    <dialog class="app-dialog" id="attempt-dialog">
      <div class="app-dialog__inner" id="attempt-inner"></div>
    </dialog>
  `;

  const exerciseDialog = document.querySelector<HTMLDialogElement>('#exercise-dialog');
  const typeSelect = document.querySelector<HTMLSelectElement>('#exercise-type');
  const mcFields = document.querySelector<HTMLElement>('#mc-fields');
  const tfFields = document.querySelector<HTMLElement>('#tf-fields');
  const saFields = document.querySelector<HTMLElement>('#sa-fields');
  const updateTypeFields = (): void => {
    const type = typeSelect?.value ?? 'multiple_choice';
    if (mcFields) mcFields.hidden = type !== 'multiple_choice';
    if (tfFields) tfFields.hidden = type !== 'true_false';
    if (saFields) saFields.hidden = type !== 'short_answer';
  };
  typeSelect?.addEventListener('change', updateTypeFields);
  updateTypeFields();

  document.querySelector('#new-exercise')?.addEventListener('click', () => exerciseDialog?.showModal());
  exerciseDialog?.querySelector('[data-close]')?.addEventListener('click', () => exerciseDialog.close());

  const exerciseForm = exerciseDialog?.querySelector<HTMLFormElement>('#exercise-form');
  const exerciseSubmit = exerciseDialog?.querySelector<HTMLButtonElement>('#exercise-submit') ?? null;
  exerciseForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!exerciseForm || !exerciseSubmit) return;
    const data = new FormData(exerciseForm);
    const pageId = String(data.get('pageId') ?? '').trim();
    const type = String(data.get('type') ?? 'multiple_choice') as 'multiple_choice' | 'true_false' | 'short_answer';
    const promptMd = String(data.get('promptMd') ?? '').trim();
    const points = Number(data.get('points') ?? 1);
    const attemptsAllowed = Number(data.get('attemptsAllowed') ?? 1);
    if (!pageId) {
      toast('Elige la página del temario a la que pertenece el ejercicio.', 'error');
      return;
    }
    if (!promptMd) {
      toast('Escribe el enunciado.', 'error');
      return;
    }
    let publicConfig: Record<string, unknown> = {};
    let answerKey: Record<string, unknown> = {};
    if (type === 'multiple_choice') {
      const options = String(data.get('options') ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      if (options.length < 2) {
        toast('Añade al menos dos opciones.', 'error');
        return;
      }
      const correctIndex = Math.max(1, Math.min(options.length, Number(data.get('correctIndex') ?? 1))) - 1;
      const optionObjects = options.map((text) => ({ id: crypto.randomUUID(), text }));
      publicConfig = { options: optionObjects, multiple: false, shuffle: false };
      answerKey = { correctOptionIds: [optionObjects[correctIndex]!.id] };
    } else if (type === 'true_false') {
      publicConfig = { requireJustification: false };
      answerKey = { correct: String(data.get('tfCorrect') ?? 'true') === 'true' };
    } else {
      const accepted = String(data.get('accepted') ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      publicConfig = { maxLength: 200 };
      answerKey = { accepted, caseSensitive: false };
    }
    setBusy(exerciseSubmit, true, 'Creando…');
    try {
      await createExercise(classroom.id, {
        pageId,
        type,
        promptMd,
        publicConfig,
        answerKey,
        points,
        attemptsAllowed,
        status: 'published',
      });
      exerciseDialog?.close();
      toast('Ejercicio creado y publicado.');
      await route();
    } catch (error) {
      if (
        isApiError(error) &&
        (error.code === 'EDU_APPROVAL_REQUIRED' || error.code === 'EDU_APPROVAL_PENDING')
      ) {
        try {
          await requestApproval('publish_content', classroom.id, { pageId });
          toast('Solicitud enviada a tu tutor. Te avisaremos cuando la apruebe.');
          exerciseDialog?.close();
          return;
        } catch (requestError) {
          toast(apiMessage(requestError), 'error');
          return;
        }
      }
      toast(apiMessage(error), 'error');
    } finally {
      setBusy(exerciseSubmit, false);
    }
  });

  container.querySelectorAll<HTMLButtonElement>('[data-delete-exercise]').forEach((button) => {
    button.addEventListener('click', async () => {
      const exerciseId = button.dataset.deleteExercise;
      if (!exerciseId || !window.confirm('¿Borrar este ejercicio?')) return;
      try {
        await deleteExercise(classroom.id, exerciseId);
        toast('Ejercicio borrado.');
        await route();
      } catch (error) {
        toast(apiMessage(error), 'error');
      }
    });
  });

  const attemptDialog = document.querySelector<HTMLDialogElement>('#attempt-dialog');
  const attemptInner = document.querySelector<HTMLElement>('#attempt-inner');
  if (!attemptDialog || !attemptInner) return;

  const startExercise = async (exerciseId: string): Promise<void> => {
    attemptInner.innerHTML = notice('Preparando el ejercicio…');
    attemptDialog.showModal();
    try {
      const attempt = await startAttempt(exerciseId);
      renderAttemptForm(attemptInner, attempt, attemptDialog);
    } catch (error) {
      attemptInner.innerHTML = notice(esc(apiMessage(error)), 'error');
    }
  };

  container.querySelectorAll<HTMLButtonElement>('[data-start-exercise]').forEach((button) => {
    button.addEventListener('click', () => {
      const exerciseId = button.dataset.startExercise;
      if (exerciseId) void startExercise(exerciseId);
    });
  });
};

const renderAttemptForm = (
  container: HTMLElement,
  attempt: Awaited<ReturnType<typeof startAttempt>>,
  dialog: HTMLDialogElement,
): void => {
  const config = attempt.publicConfig as {
    options?: Array<{ id: string; text: string }>;
    multiple?: boolean;
  };
  const exercise = attempt.exercise;

  let fields = '';
  if (exercise.type === 'multiple_choice') {
    const options = config.options ?? [];
    const inputType = config.multiple ? 'checkbox' : 'radio';
    fields = options.map((option) => `
      <label class="attempt__option">
        <input type="${inputType}" name="option" value="${esc(option.id)}" />
        <span>${esc(option.text)}</span>
      </label>
    `).join('');
  } else if (exercise.type === 'true_false') {
    fields = `
      <label class="attempt__option"><input type="radio" name="tf" value="true" /><span>Verdadero</span></label>
      <label class="attempt__option"><input type="radio" name="tf" value="false" /><span>Falso</span></label>
    `;
  } else {
    fields = `<label class="field">Tu respuesta
      <textarea name="text" maxlength="5000" required></textarea>
    </label>`;
  }

  container.innerHTML = `
    <p class="eyebrow">Ejercicio</p>
    <h2>${esc(exercise.promptMd.split('\n')[0] || 'Ejercicio')}</h2>
    <div class="attempt">
      <div class="attempt__prompt">${esc(exercise.promptMd)}</div>
      ${attempt.deadline ? `<p class="field__hint">Entrega antes de ${esc(fmtDate(attempt.deadline))}.</p>` : ''}
      <form id="attempt-form">
        <div class="content-list">${fields}</div>
        <div class="form-actions">
          <button class="btn btn--secondary" type="button" data-close>Cancelar</button>
          <button class="btn btn--primary" type="submit" id="attempt-submit">Enviar respuesta</button>
        </div>
      </form>
    </div>
  `;

  container.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
  const form = container.querySelector<HTMLFormElement>('#attempt-form');
  const submit = container.querySelector<HTMLButtonElement>('#attempt-submit');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form || !submit) return;
    let answers: Record<string, unknown>;
    if (exercise.type === 'multiple_choice') {
      const selected = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="option"]:checked')).map((input) => input.value);
      if (selected.length === 0) {
        toast('Selecciona una opción.', 'error');
        return;
      }
      answers = { selectedOptionIds: selected };
    } else if (exercise.type === 'true_false') {
      const selected = form.querySelector<HTMLInputElement>('input[name="tf"]:checked');
      if (!selected) {
        toast('Selecciona verdadero o falso.', 'error');
        return;
      }
      answers = { value: selected.value === 'true' };
    } else {
      const text = form.querySelector<HTMLTextAreaElement>('textarea[name="text"]')?.value.trim() ?? '';
      if (!text) {
        toast('Escribe una respuesta.', 'error');
        return;
      }
      answers = { text };
    }

    setBusy(submit, true, 'Enviando…');
    try {
      const result = await submitAttempt(attempt.attemptId, answers);
      renderAttemptResult(container, result, dialog);
    } catch (error) {
      toast(apiMessage(error), 'error');
      setBusy(submit, false);
    }
  });
};

const renderAttemptResult = (
  container: HTMLElement,
  result: Awaited<ReturnType<typeof submitAttempt>>,
  dialog: HTMLDialogElement,
): void => {
  const pending = result.pendingFeedback || result.score == null;
  container.innerHTML = `
    <p class="eyebrow">Resultado</p>
    <h2>${pending ? 'Respuesta enviada' : 'Ejercicio corregido'}</h2>
    <div class="attempt">
      <div class="attempt__result">
        ${pending
          ? '<p>Tu respuesta está guardada. La nota aparecerá cuando el docente la publique.</p>'
          : `<p><strong>${esc(result.score ?? 0)} / ${esc(result.maxScore)}</strong></p>`}
        ${result.feedback ? `<p>${esc(result.feedback)}</p>` : ''}
      </div>
      <div class="form-actions">
        <button class="btn btn--primary" type="button" data-close>Cerrar</button>
      </div>
    </div>
  `;
  container.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
};

/* ------------------------------------------------------------------ */
/* Boletín                                                            */
/* ------------------------------------------------------------------ */

const renderGradebook = async (container: HTMLElement, classroom: Classroom): Promise<void> => {
  const gradebook = await getGradebook(classroom.id);
  const staff = gradebook.scope === 'staff';

  if (staff) {
    const exerciseColumns = gradebook.exercises.map((exercise) => `<th>${esc(exercise.label.slice(0, 40))}</th>`).join('');
    const rows = gradebook.students.map((student) => {
      const cells = gradebook.exercises.map((exercise) => {
        const attempts = student.attempts.filter((attempt) => attempt.exerciseId === exercise.id);
        const last = attempts[attempts.length - 1];
        return `<td>${last?.score != null ? `${last.score} / ${last.maxScore}` : '—'}</td>`;
      }).join('');
      return `<tr>
        <td><strong>${esc(student.nickname || student.alias || 'Sin nombre')}</strong></td>
        ${cells}
        <td>${student.weightedScore != null ? esc(student.weightedScore) : '—'}</td>
      </tr>`;
    }).join('');

    const studentOptions = gradebook.students
      .map((student) => `<option value="${esc(student.identityId)}">${esc(student.nickname || student.alias || student.identityId)}</option>`)
      .join('');

    container.innerHTML = `
      <section class="panel">
        <div class="panel__head"><h2>Boletín</h2></div>
        ${gradebook.students.length
          ? `<div class="table-wrap"><table class="app-table">
              <thead><tr><th>Alumno</th>${exerciseColumns}<th>Nota</th></tr></thead>
              <tbody>${rows}</tbody>
            </table></div>`
          : '<div class="empty"><h3>No hay alumnos todavía.</h3><p>Cuando se unan, aquí verás su progreso.</p></div>'}
      </section>
      <section class="panel">
        <div class="panel__head"><h2>Poner una nota manual</h2></div>
        <form id="grade-form" class="form-grid">
          <label class="field">Alumno
            <select name="identityId" required>${studentOptions}</select>
          </label>
          <label class="field">Título
            <input name="title" type="text" maxlength="120" required placeholder="Participación" />
          </label>
          <label class="field">Nota
            <input name="score" type="number" min="0" max="1000" step="0.01" required />
          </label>
          <label class="field">Comentario
            <input name="feedback" type="text" maxlength="500" />
          </label>
          <div class="form-actions field--full">
            <button class="btn btn--primary" type="submit" id="grade-submit">Guardar nota</button>
          </div>
        </form>
      </section>
    `;

    const form = container.querySelector<HTMLFormElement>('#grade-form');
    const submit = container.querySelector<HTMLButtonElement>('#grade-submit');
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form || !submit) return;
      const data = new FormData(form);
      const identityId = String(data.get('identityId') ?? '');
      const title = String(data.get('title') ?? '').trim();
      const score = Number(data.get('score') ?? 0);
      const feedback = String(data.get('feedback') ?? '').trim();
      if (!identityId || !title) return;
      setBusy(submit, true);
      try {
        await addManualGrade(classroom.id, {
          identityId,
          title,
          score,
          ...(feedback ? { feedback } : {}),
        });
        toast('Nota guardada.');
        await route();
      } catch (error) {
        toast(apiMessage(error), 'error');
      } finally {
        setBusy(submit, false);
      }
    });
    return;
  }

  const student = gradebook.students[0];
  container.innerHTML = `
    <section class="panel">
      <div class="panel__head"><h2>Tu boletín</h2></div>
      ${student
        ? `<p class="field__hint">Nota global: <strong>${student.weightedScore != null ? esc(student.weightedScore) : '—'}</strong></p>
          <div class="table-wrap"><table class="app-table">
            <thead><tr><th>Ejercicio</th><th>Intento</th><th>Nota</th><th>Estado</th></tr></thead>
            <tbody>
              ${student.attempts.length
                ? student.attempts.map((attempt) => {
                    const exercise = gradebook.exercises.find((item) => item.id === attempt.exerciseId);
                    return `<tr>
                      <td>${esc(exercise?.label ?? attempt.exerciseId)}</td>
                      <td>${attempt.attemptNo}</td>
                      <td>${attempt.score != null ? `${attempt.score} / ${attempt.maxScore}` : '—'}</td>
                      <td>${badge(statusLabel(attempt.status), attempt.status === 'graded' ? 'published' : 'draft')}</td>
                    </tr>`;
                  }).join('')
                : '<tr><td colspan="4">Todavía no hay intentos.</td></tr>'}
            </tbody>
          </table></div>
          ${student.grades.length
            ? `<h3 style="margin-top:1rem">Notas manuales</h3><div class="content-list">${student.grades.map((grade) => `
                <div class="content-item"><div class="content-item__main"><span class="content-item__title">${esc(grade.title)}</span><div class="content-item__meta"><span>${esc(grade.score)}</span>${grade.feedback ? `<span>${esc(grade.feedback)}</span>` : ''}</div></div></div>
              `).join('')}</div>`
            : ''}`
        : '<div class="empty"><h3>Sin datos todavía.</h3><p>Cuando hagas ejercicios, aparecerán aquí.</p></div>'}
    </section>
  `;
};

/* ------------------------------------------------------------------ */
/* Mensajes                                                           */
/* ------------------------------------------------------------------ */

const renderMessages = async (container: HTMLElement, classroom: Classroom): Promise<void> => {
  const [members, threads] = await Promise.all([
    listMembers(classroom.id).catch(() => [] as Member[]),
    listThreads(classroom.id),
  ]);
  const memberName = new Map(members.map((member) => [member.identityId, member.nickname || member.alias || member.identityId]));
  const myIdentity = state.me?.identityId ?? '';

  const threadButtons = threads.map((thread) => {
    const otherId = thread.kind === 'student_teacher'
      ? (thread.learnerIdentityId === myIdentity ? thread.teacherIdentityId : thread.learnerIdentityId)
      : (thread.guardianIdentityId === myIdentity ? thread.teacherIdentityId : thread.learnerIdentityId);
    return `<button class="thread" type="button" data-thread="${esc(thread.id)}" aria-current="${selectedThreadId === thread.id}">
      <strong>${esc(memberName.get(otherId) ?? 'Conversación')}</strong>
      <span>${thread.kind === 'student_teacher' ? 'Alumno y docente' : 'Tutor y docente'} · ${esc(fmtDateShort(thread.updatedAt))}</span>
    </button>`;
  }).join('');

  const canCreateThread = classroom.viewerRole === 'student' || canManage(classroom.viewerRole);
  const teacherOptions = members.filter((member) => member.role === 'teacher');
  const studentOptions = members.filter((member) => member.role === 'student');

  container.innerHTML = `
    <section class="panel">
      <div class="panel__head">
        <h2>Mensajes</h2>
        ${canCreateThread ? '<button class="btn btn--primary" type="button" id="new-thread">Nueva conversación</button>' : ''}
      </div>
      <div class="messages">
        <div class="thread-list">${threadButtons || '<p class="field__hint">No hay conversaciones todavía.</p>'}</div>
        <div class="messages__panel" id="messages-panel"><p class="field__hint">Elige una conversación para ver los mensajes.</p></div>
      </div>
    </section>
    <dialog class="app-dialog" id="thread-dialog">
      <div class="app-dialog__inner">
        <h2>Nueva conversación</h2>
        <form id="thread-form" class="form-grid">
          ${classroom.viewerRole === 'student'
            ? `<label class="field field--full">Docente
                <select name="teacherIdentityId">
                  <option value="">El docente del aula</option>
                  ${teacherOptions.map((member) => `<option value="${esc(member.identityId)}">${esc(member.nickname || member.alias || member.identityId)}</option>`).join('')}
                </select>
              </label>`
            : `<label class="field field--full">Alumno
                <select name="learnerIdentityId" required>
                  <option value="">Elige un alumno</option>
                  ${studentOptions.map((member) => `<option value="${esc(member.identityId)}">${esc(member.nickname || member.alias || member.identityId)}</option>`).join('')}
                </select>
              </label>`}
          <div class="form-actions field--full">
            <button class="btn btn--secondary" type="button" data-close>Cancelar</button>
            <button class="btn btn--primary" type="submit" id="thread-submit">Abrir conversación</button>
          </div>
        </form>
      </div>
    </dialog>
  `;

  const panel = document.querySelector<HTMLElement>('#messages-panel');
  const dialog = document.querySelector<HTMLDialogElement>('#thread-dialog');

  const loadMessages = async (threadId: string): Promise<void> => {
    selectedThreadId = threadId;
    if (!panel) return;
    panel.innerHTML = notice('Cargando mensajes…');
    try {
      const messages = await listMessages(threadId);
      panel.innerHTML = `
        <div class="message-list" id="message-list">
          ${messages.map((message) => renderMessage(message, memberName, myIdentity)).join('') || '<p class="field__hint">Todavía no hay mensajes.</p>'}
        </div>
        <form id="message-form" class="field">
          <span>Nuevo mensaje</span>
          <textarea name="bodyMd" maxlength="5000" required placeholder="Escribe un mensaje…"></textarea>
          <div class="form-actions">
            <button class="btn btn--primary" type="submit" id="message-submit">Enviar</button>
          </div>
        </form>
      `;
      panel.querySelectorAll<HTMLButtonElement>('[data-delete-message]').forEach((button) => {
        button.addEventListener('click', async () => {
          const messageId = button.dataset.deleteMessage;
          if (!messageId || !window.confirm('¿Borrar este mensaje?')) return;
          try {
            await deleteMessage(threadId, messageId);
            await loadMessages(threadId);
          } catch (error) {
            toast(apiMessage(error), 'error');
          }
        });
      });
      const form = panel.querySelector<HTMLFormElement>('#message-form');
      const submit = panel.querySelector<HTMLButtonElement>('#message-submit');
      form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!form || !submit) return;
        const bodyMd = form.querySelector<HTMLTextAreaElement>('textarea[name="bodyMd"]')?.value.trim() ?? '';
        if (!bodyMd) return;
        setBusy(submit, true, 'Enviando…');
        try {
          await sendMessage(threadId, bodyMd);
          await loadMessages(threadId);
        } catch (error) {
          toast(apiMessage(error), 'error');
          setBusy(submit, false);
        }
      });
      panel.querySelector<HTMLTextAreaElement>('#message-form textarea')?.focus();
    } catch (error) {
      panel.innerHTML = notice(esc(apiMessage(error)), 'error');
    }
  };

  container.querySelectorAll<HTMLButtonElement>('[data-thread]').forEach((button) => {
    button.addEventListener('click', () => {
      const threadId = button.dataset.thread;
      if (!threadId) return;
      container.querySelectorAll<HTMLButtonElement>('[data-thread]').forEach((item) => {
        item.setAttribute('aria-current', String(item.dataset.thread === threadId));
      });
      void loadMessages(threadId);
    });
  });

  if (selectedThreadId && threads.some((thread) => thread.id === selectedThreadId)) {
    await loadMessages(selectedThreadId);
  }

  document.querySelector('#new-thread')?.addEventListener('click', () => dialog?.showModal());
  dialog?.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
  const threadForm = dialog?.querySelector<HTMLFormElement>('#thread-form');
  const threadSubmit = dialog?.querySelector<HTMLButtonElement>('#thread-submit');
  threadForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!threadForm || !threadSubmit) return;
    const data = new FormData(threadForm);
    const teacherIdentityId = String(data.get('teacherIdentityId') ?? '').trim();
    const learnerIdentityId = String(data.get('learnerIdentityId') ?? '').trim();
    setBusy(threadSubmit, true, 'Abriendo…');
    try {
      const thread = await createThread(classroom.id, {
        kind: 'student_teacher',
        ...(teacherIdentityId ? { teacherIdentityId } : {}),
        ...(learnerIdentityId ? { learnerIdentityId } : {}),
      });
      dialog?.close();
      selectedThreadId = thread.id;
      await route();
    } catch (error) {
      toast(apiMessage(error), 'error');
    } finally {
      setBusy(threadSubmit, false);
    }
  });
};

const renderMessage = (
  message: Message,
  names: Map<string, string>,
  myIdentity: string,
): string => {
  if (message.deletedAt) {
    return `<article class="message message--system"><div class="message__meta">Mensaje eliminado</div></article>`;
  }
  const mine = message.authorIdentityId === myIdentity;
  const author = message.authorIdentityId ? names.get(message.authorIdentityId) ?? 'Participante' : 'Sistema';
  return `<article class="message${mine ? ' message--mine' : ''}${message.kind === 'system_access_notice' ? ' message--system' : ''}">
    <div class="message__meta">
      <strong>${esc(author)}</strong>
      <span>${esc(fmtDate(message.createdAt))}</span>
      ${message.canDelete ? `<button class="icon-btn" type="button" data-delete-message="${esc(message.id)}" aria-label="Borrar mensaje">×</button>` : ''}
    </div>
    <div class="message__body">${message.bodyHtml}</div>
  </article>`;
};

/* ------------------------------------------------------------------ */
/* Aprobaciones                                                       */
/* ------------------------------------------------------------------ */

const approvalActionLabel = (action: string): string => {
  switch (action) {
    case 'create_classroom': return 'Crear un aula';
    case 'invite_student': return 'Invitar a un alumno';
    case 'publish_content': return 'Publicar contenido';
    case 'archive_classroom': return 'Archivar un aula';
    case 'delete_classroom': return 'Borrar un aula';
    default: return action;
  }
};

const approvalPayloadSummary = (payload: Record<string, unknown>): string => {
  if (typeof payload.name === 'string') return `Aula: ${payload.name}`;
  if (typeof payload.pageId === 'string') return `Página: ${payload.pageId}`;
  if (typeof payload.identityId === 'string') return `Persona: ${payload.identityId}`;
  const text = JSON.stringify(payload);
  return text.length > 160 ? `${text.slice(0, 157)}…` : text;
};

const renderApprovals = async (token: number): Promise<void> => {
  let approvals: Approval[] = [];
  try {
    approvals = await listApprovals();
  } catch (error) {
    if (isApiError(error) && (error.status === 403 || error.code === 'EDU_APPROVAL_FORBIDDEN')) {
      view().innerHTML = `
        <section class="app-hero"><div><p class="eyebrow">Aprobaciones</p><h1>Solicitudes de tus tutelados</h1></div></section>
        ${notice('No tienes solicitudes pendientes. Esta sección es para tutores que deben aprobar acciones de un menor.', 'info')}
      `;
      return;
    }
    throw error;
  }
  if (token !== renderToken) return;

  const pending = approvals.filter((approval) => approval.status === 'pending');
  const resolved = approvals.filter((approval) => approval.status !== 'pending');

  view().innerHTML = `
    <section class="app-hero">
      <div>
        <p class="eyebrow">Aprobaciones</p>
        <h1>Solicitudes de tus tutelados.</h1>
        <p>Revisa las acciones sensibles que han pedido y responde. Cada aprobación es de un solo uso.</p>
      </div>
    </section>
    <section class="panel">
      <div class="panel__head"><h2>Pendientes</h2></div>
      ${pending.length
        ? `<div class="content-list">${pending.map((approval) => `
            <div class="content-item">
              <div class="content-item__main">
                <span class="content-item__title">${esc(approvalActionLabel(approval.action))}</span>
                <div class="content-item__meta">
                  <span>Solicita ${esc(approval.requesterAlias ?? approval.requesterIdentityId)}</span>
                  <span>${esc(fmtDate(approval.createdAt))}</span>
                  <span>Caduca ${esc(fmtDate(approval.expiresAt))}</span>
                </div>
                <p class="field__hint">${esc(approvalPayloadSummary(approval.payload))}</p>
              </div>
              <div class="content-item__actions">
                <button class="btn btn--primary" type="button" data-approve="${esc(approval.id)}">Aprobar</button>
                <button class="btn btn--ghost" type="button" data-reject="${esc(approval.id)}">Rechazar</button>
              </div>
            </div>
          `).join('')}</div>`
        : '<div class="empty"><h3>Nada pendiente.</h3><p>Cuando un menor de tu grupo pida una acción sensible, aparecerá aquí.</p></div>'}
    </section>
    ${resolved.length ? `
      <section class="panel">
        <div class="panel__head"><h2>Historial reciente</h2></div>
        <div class="content-list">${resolved.slice(0, 10).map((approval) => `
          <div class="content-item">
            <div class="content-item__main">
              <span class="content-item__title">${esc(approvalActionLabel(approval.action))}</span>
              <div class="content-item__meta">
                <span>${esc(approval.requesterAlias ?? approval.requesterIdentityId)}</span>
                <span>${esc(fmtDate(approval.createdAt))}</span>
                ${badge(approval.status, approval.status === 'approved' ? 'published' : 'danger')}
              </div>
            </div>
          </div>
        `).join('')}</div>
      </section>
    ` : ''}
  `;

  const respond = async (approvalId: string, approve: boolean): Promise<void> => {
    let reason: string | undefined;
    if (!approve) {
      reason = window.prompt('Motivo del rechazo (opcional)') ?? undefined;
    }
    try {
      const result = await respondApproval(approvalId, approve, reason);
      const executed = Boolean((result as { executed?: boolean } | null)?.executed);
      toast(approve ? (executed ? 'Aprobado y ejecutado.' : 'Aprobado. El menor puede reintentar la acción.') : 'Solicitud rechazada.');
      await route();
    } catch (error) {
      toast(apiMessage(error), 'error');
    }
  };

  view().querySelectorAll<HTMLButtonElement>('[data-approve]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.approve;
      if (id) void respond(id, true);
    });
  });
  view().querySelectorAll<HTMLButtonElement>('[data-reject]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.reject;
      if (id) void respond(id, false);
    });
  });
};

/* ------------------------------------------------------------------ */
/* Centros                                                            */
/* ------------------------------------------------------------------ */

const renderCenters = (): void => {
  if (state.me?.kind === 'learner') {
    view().innerHTML = `
      <section class="app-hero">
        <div><p class="eyebrow">Programa para centros</p><h1>Para tu centro.</h1></div>
      </section>
      ${notice('El programa para centros requiere una cuenta adulta. Pide a tu docente o a tu centro que lo solicite.', 'info')}
    `;
    return;
  }
  view().innerHTML = `
    <section class="app-hero">
      <div>
        <p class="eyebrow">Programa para centros</p>
        <h1>Lleva gacarbla.edu a tu centro.</h1>
        <p>Las cuentas docentes de un centro adherido no tienen el límite de un aula ni de 12 plazas. La solicitud pasa por una revisión y un compromiso de seguridad y protección de menores.</p>
      </div>
    </section>
    <section class="panel">
      <div class="panel__head"><h2>Solicitar información</h2></div>
      ${state.me?.ageBand === '16-17' ? notice('El programa para centros requiere una cuenta adulta (18+).', 'info') : ''}
      <form id="center-form" class="form-grid" novalidate>
        <label class="field field--full">Nombre legal del centro
          <input name="legalName" type="text" minlength="2" maxlength="200" required placeholder="Colegio Ejemplo S.L." />
        </label>
        <label class="field">CIF / identificación fiscal
          <input name="taxId" type="text" minlength="3" maxlength="32" required placeholder="B12345678" />
        </label>
        <label class="field">Número de docentes
          <input name="staffCount" type="number" min="1" step="1" required value="10" />
        </label>
        <label class="field">Participantes previstos
          <input name="participantsCount" type="number" min="1" step="1" required value="100" />
        </label>
        <label class="field">Máximo de alumnos
          <input name="maxStudents" type="number" min="1" step="1" required value="150" />
        </label>
        <label class="field field--full">¿Para qué lo queréis usar?
          <textarea name="reason" minlength="10" maxlength="2000" required placeholder="Queremos usar gacarbla.edu con 12 aulas de secundaria…"></textarea>
        </label>
        <p class="field__hint field--full">Al enviar la solicitud se crea un ticket interno. No publiques datos personales de menores en este formulario.</p>
        <div class="form-actions field--full">
          <button class="btn btn--primary" type="submit" id="center-submit">Enviar solicitud</button>
        </div>
      </form>
    </section>
  `;

  const form = document.querySelector<HTMLFormElement>('#center-form');
  const submit = document.querySelector<HTMLButtonElement>('#center-submit');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form || !submit) return;
    const data = new FormData(form);
    const legalName = String(data.get('legalName') ?? '').trim();
    const taxId = String(data.get('taxId') ?? '').trim();
    const reason = String(data.get('reason') ?? '').trim();
    const staffCount = Number(data.get('staffCount') ?? 0);
    const participantsCount = Number(data.get('participantsCount') ?? 0);
    const maxStudents = Number(data.get('maxStudents') ?? 0);
    if (legalName.length < 2 || taxId.length < 3 || reason.length < 10) {
      toast('Revisa los campos: faltan datos o el motivo es demasiado corto.', 'error');
      return;
    }
    if (staffCount < 1 || participantsCount < 1 || maxStudents < 1) {
      toast('Los contadores deben ser números positivos.', 'error');
      return;
    }
    setBusy(submit, true, 'Enviando…');
    try {
      const request = await requestCenter({
        legalName,
        taxId,
        reason,
        staffCount,
        participantsCount,
        maxStudents,
      });
      view().querySelector<HTMLElement>('#center-form')?.closest('section')?.insertAdjacentHTML('beforeend', notice(
        `Solicitud recibida. Estado: <strong>${esc(request.status)}</strong>. Guarda este identificador: <strong>${esc(request.id)}</strong>.`,
        'success',
      ));
      form.reset();
      toast('Solicitud enviada.');
    } catch (error) {
      toast(apiMessage(error), 'error');
    } finally {
      setBusy(submit, false);
    }
  });
};

/* ------------------------------------------------------------------ */
/* Perfil                                                             */
/* ------------------------------------------------------------------ */

const renderProfile = async (token: number): Promise<void> => {
  const me = await getMe();
  if (token !== renderToken) return;
  state.me = me;
  paintAge(me);

  const notifications = me.notifications ?? { email: true, push: false, digest: 'off' };

  view().innerHTML = `
    <section class="app-hero">
      <div>
        <p class="eyebrow">Mi perfil</p>
        <h1>${esc(me.nickname?.trim() || me.alias)}</h1>
        <p>Tu identidad en edu. El nombre visible puede ser distinto del de tu cuenta gacarbla.</p>
      </div>
    </section>
    <section class="panel">
      <div class="panel__head"><h2>Identidad</h2></div>
      <div class="content-list">
        <div class="content-item"><div class="content-item__main"><span class="content-item__title">Alias</span><div class="content-item__meta"><span>${esc(me.alias)}</span></div></div></div>
        <div class="content-item"><div class="content-item__main"><span class="content-item__title">Nombre visible en edu</span><div class="content-item__meta"><span>${esc(me.nickname || 'Sin nombre')}</span></div></div></div>
        <div class="content-item"><div class="content-item__main"><span class="content-item__title">Tipo de cuenta</span><div class="content-item__meta"><span>${esc(me.kind)}</span><span>${esc(me.ageBand ?? '—')}</span></div></div></div>
        <div class="content-item"><div class="content-item__main"><span class="content-item__title">Estado</span><div class="content-item__meta"><span>${esc(me.status ?? '—')}</span></div></div></div>
      </div>
      <form id="alias-form" class="form-grid" style="margin-top:1rem">
        <label class="field field--full">Cambiar alias
          <input name="alias" type="text" minlength="3" maxlength="24" pattern="[a-z0-9][a-z0-9._-]*" required value="${esc(me.alias)}" />
          <span class="field__hint">Solo minúsculas, números, punto, guion y guion bajo. Puedes cambiarlo una vez al mes.</span>
        </label>
        <div class="form-actions field--full">
          <button class="btn btn--primary" type="submit" id="alias-submit">Guardar alias</button>
        </div>
      </form>
    </section>
    <section class="panel">
      <div class="panel__head"><h2>Notificaciones</h2></div>
      <form id="notifications-form" class="form-grid">
        <label class="field"><span>Email</span>
          <select name="email"><option value="true" ${notifications.email ? 'selected' : ''}>Sí</option><option value="false" ${!notifications.email ? 'selected' : ''}>No</option></select>
        </label>
        <label class="field"><span>Avisos en la app</span>
          <select name="push"><option value="true" ${notifications.push ? 'selected' : ''}>Sí</option><option value="false" ${!notifications.push ? 'selected' : ''}>No</option></select>
        </label>
        <label class="field"><span>Resumen</span>
          <select name="digest">
            <option value="off" ${notifications.digest === 'off' ? 'selected' : ''}>No enviar</option>
            <option value="daily" ${notifications.digest === 'daily' ? 'selected' : ''}>Diario</option>
            <option value="weekly" ${notifications.digest === 'weekly' ? 'selected' : ''}>Semanal</option>
          </select>
        </label>
        <div class="form-actions field--full">
          <button class="btn btn--primary" type="submit" id="notifications-submit">Guardar preferencias</button>
        </div>
      </form>
    </section>
    <section class="panel">
      <div class="panel__head"><h2>Sesión</h2></div>
      <p class="field__hint">La sesión se guarda en esta pestaña. Al cerrar sesión se borra también de este dispositivo.</p>
      <button class="btn btn--secondary" type="button" id="logout-profile">Cerrar sesión</button>
    </section>
  `;

  const aliasForm = document.querySelector<HTMLFormElement>('#alias-form');
  const aliasSubmit = document.querySelector<HTMLButtonElement>('#alias-submit');
  aliasForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!aliasForm || !aliasSubmit) return;
    const alias = String(new FormData(aliasForm).get('alias') ?? '').trim().toLowerCase();
    if (!alias) return;
    setBusy(aliasSubmit, true);
    try {
      const result = await changeAlias(alias);
      state.me = { ...me, alias: result.alias };
      const stored = session.edu;
      if (stored) {
        stored.identity = { ...stored.identity, alias: result.alias };
      }
      toast('Alias actualizado.');
      await route();
    } catch (error) {
      toast(apiMessage(error), 'error');
    } finally {
      setBusy(aliasSubmit, false);
    }
  });

  const notificationsForm = document.querySelector<HTMLFormElement>('#notifications-form');
  const notificationsSubmit = document.querySelector<HTMLButtonElement>('#notifications-submit');
  notificationsForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!notificationsForm || !notificationsSubmit) return;
    const data = new FormData(notificationsForm);
    setBusy(notificationsSubmit, true);
    try {
      await updateNotificationPrefs({
        email: String(data.get('email')) === 'true',
        push: String(data.get('push')) === 'true',
        digest: String(data.get('digest')) as 'off' | 'daily' | 'weekly',
      });
      toast('Preferencias guardadas.');
    } catch (error) {
      toast(apiMessage(error), 'error');
    } finally {
      setBusy(notificationsSubmit, false);
    }
  });

  document.querySelector('#logout-profile')?.addEventListener('click', async () => {
    try {
      await logout();
    } finally {
      clearAllSessions();
      window.location.assign('/');
    }
  });
};

/* ------------------------------------------------------------------ */
/* Arranque                                                           */
/* ------------------------------------------------------------------ */

const bootstrap = async (): Promise<void> => {
  const restored = await restoreAppSession();
  if (!restored) {
    goLogin();
    return;
  }
  try {
    state.me = await getMe();
  } catch {
    goLogin();
    return;
  }
  paintAge(state.me);
  shell();
  window.addEventListener('hashchange', () => { void route(); });
  await route();
};

void bootstrap();
