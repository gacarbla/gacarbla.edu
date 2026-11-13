export function initAulaDemo(): void {
  const reto = document.querySelector<HTMLElement>('[data-reto]');
  if (!reto) return;

  const feedback = document.querySelector<HTMLElement>('[data-reto-feedback]');
  const options = Array.from(reto.querySelectorAll<HTMLButtonElement>('[data-reto-answer]'));

  options.forEach((option) => {
    option.addEventListener('click', () => {
      const isCorrect = option.dataset.retoAnswer === 'azul';
      const correctOption = options.find((item) => item.dataset.retoAnswer === 'azul');

      options.forEach((item) => item.classList.remove('is-correct', 'is-wrong'));
      option.classList.add(isCorrect ? 'is-correct' : 'is-wrong');
      if (!isCorrect) correctOption?.classList.add('is-correct');

      if (feedback) {
        feedback.dataset.state = isCorrect ? 'correct' : 'wrong';
        feedback.textContent = isCorrect
          ? '¡Eso es! El azul se dispersa más que los demás.'
          : 'Casi. El azul se dispersa más que los demás.';
      }
    });
  });
}
