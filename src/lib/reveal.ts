export function initReveal(): void {
  const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (elements.length === 0) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const showAll = (): void => {
    elements.forEach((element) => element.classList.add('is-visible'));
  };

  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    showAll();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -36px 0px', threshold: 0.12 },
  );

  elements.forEach((element) => observer.observe(element));

  reducedMotion.addEventListener('change', (event) => {
    if (!event.matches) return;
    observer.disconnect();
    showAll();
  });
}
