function closeOtherDialogs(except: HTMLDialogElement | null): void {
  document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach((dialog) => {
    if (dialog !== except) dialog.close();
  });
}

export function openDialog(id: string): void {
  const dialog = document.getElementById(id);
  if (!(dialog instanceof HTMLDialogElement)) return;

  closeOtherDialogs(dialog);
  if (!dialog.open) dialog.showModal();
}

export function initDialogs(): void {
  document.querySelectorAll<HTMLElement>('[data-open-dialog]').forEach((trigger) => {
    if (!trigger.hasAttribute('aria-haspopup')) trigger.setAttribute('aria-haspopup', 'dialog');

    trigger.addEventListener('click', (event) => {
      const id = trigger.dataset.openDialog;
      if (!id) return;

      // Si el disparador es un enlace, evita que además navegue o desplace la página.
      event.preventDefault();
      openDialog(id);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-close-dialog]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      trigger.closest('dialog')?.close();
    });
  });

  document.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) => {
    // Cerrar al tocar el fondo, no al tocar el panel.
    dialog.addEventListener('pointerdown', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!inside) dialog.close();
    });

    // Los enlaces internos del menú cierran el diálogo antes de desplazar.
    dialog.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', () => dialog.close());
    });
  });
}
