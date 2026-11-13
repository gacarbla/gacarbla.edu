import './styles/main.css';

import { initAgeModeIntegration } from './lib/age-mode';
import { initAulaDemo } from './lib/aula-demo';
import { initDialogs } from './lib/dialogs';
import { initHeader, initYear } from './lib/header';
import { initReveal } from './lib/reveal';

document.documentElement.classList.add('js');

initReveal();
initDialogs();
initAulaDemo();
initHeader();
initYear();
initAgeModeIntegration();
