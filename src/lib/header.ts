export function initHeader(): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;

  const update = (): void => {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
}

export function initYear(): void {
  document.querySelectorAll<HTMLElement>('[data-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
}
