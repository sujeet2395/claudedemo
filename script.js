const generateBtn = document.getElementById('generate-btn');
const questionDisplay = document.getElementById('question-display');
const answerForm = document.getElementById('answer-form');
const answerInput = document.getElementById('answer-input');
const feedback = document.getElementById('feedback');

const OPERATORS = ['+', '-', '*'];

let currentQuestion = null;

function generateQuestion() {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  const operator = OPERATORS[Math.floor(Math.random() * OPERATORS.length)];

  let correctAnswer;
  if (operator === '+') correctAnswer = a + b;
  else if (operator === '-') correctAnswer = a - b;
  else correctAnswer = a * b;

  currentQuestion = { text: `${a} ${operator} ${b} = ?`, correctAnswer };

  questionDisplay.textContent = currentQuestion.text;
  answerInput.value = '';
  feedback.textContent = '';
  feedback.className = '';
}

// ---- Mode toggle ----
const practiceSection = document.getElementById('practice-section');
const quadraticSection = document.getElementById('quadratic-section');
const modePracticeBtn = document.getElementById('mode-practice');
const modeQuadraticBtn = document.getElementById('mode-quadratic');

function setMode(mode) {
  const quadratic = mode === 'quadratic';
  practiceSection.hidden = quadratic;
  quadraticSection.hidden = !quadratic;
  modePracticeBtn.classList.toggle('active', !quadratic);
  modeQuadraticBtn.classList.toggle('active', quadratic);
}

modePracticeBtn.addEventListener('click', () => setMode('practice'));
modeQuadraticBtn.addEventListener('click', () => setMode('quadratic'));

// ---- Quadratic level ----
const quadGenerateBtn = document.getElementById('quad-generate-btn');
const quadQuestionDisplay = document.getElementById('quad-question-display');
const quadForm = document.getElementById('quad-form');
const root1Input = document.getElementById('root1-input');
const root2Input = document.getElementById('root2-input');
const quadFeedback = document.getElementById('quad-feedback');

const ROOT_TOLERANCE = 1e-6;

let currentQuadratic = null;

function setQuadFeedback(text, cls) {
  quadFeedback.textContent = text;
  quadFeedback.className = cls;
}

function solveQuadratic(a, b, c) {
  const discriminant = b * b - 4 * a * c;
  if (discriminant >= 0) {
    const sqrtD = Math.sqrt(discriminant);
    return [
      { re: (-b + sqrtD) / (2 * a), im: 0 },
      { re: (-b - sqrtD) / (2 * a), im: 0 },
    ];
  }
  const re = -b / (2 * a);
  const im = Math.sqrt(-discriminant) / (2 * a);
  return [{ re, im: Math.abs(im) }, { re, im: -Math.abs(im) }];
}

function parseReal(text) {
  const [num, den] = text.split('/');
  const value = den === undefined ? Number(num) : Number(num) / Number(den);
  return text === '' || Number.isNaN(value) ? NaN : value;
}

// Accepts e.g. "3", "-2.5", "1/2", "2+3i", "2-3i", "-i", "4i". Returns null if invalid.
function parseComplex(input) {
  const s = input.replace(/\s+/g, '').replace(/[−–]/g, '-');
  const terms = s.match(/[+-]?[^+-]+/g);
  if (!terms || terms.join('') !== s) return null;

  let re = 0;
  let im = 0;
  for (const term of terms) {
    if (term.endsWith('i')) {
      const coeff = term.slice(0, -1);
      const value = coeff === '' || coeff === '+' ? 1 : coeff === '-' ? -1 : parseReal(coeff);
      if (Number.isNaN(value)) return null;
      im += value;
    } else {
      const value = parseReal(term);
      if (Number.isNaN(value)) return null;
      re += value;
    }
  }
  return { re, im };
}

function sameRoot(x, y) {
  return Math.abs(x.re - y.re) < ROOT_TOLERANCE && Math.abs(x.im - y.im) < ROOT_TOLERANCE;
}

function formatNumber(n) {
  return String(Number(n.toFixed(4)));
}

function formatRoot({ re, im }) {
  if (Math.abs(im) < ROOT_TOLERANCE) return formatNumber(re);
  const imPart = `${formatNumber(Math.abs(im))}i`;
  if (Math.abs(re) < ROOT_TOLERANCE) return `${im < 0 ? '-' : ''}${imPart}`;
  return `${formatNumber(re)} ${im < 0 ? '-' : '+'} ${imPart}`;
}

function formatEquation(a, b, c) {
  const term = (coeff, variable, first) => {
    if (coeff === 0) return '';
    const sign = coeff < 0 ? '-' : '+';
    const abs = Math.abs(coeff);
    const body = variable && abs === 1 ? variable : `${abs}${variable}`;
    if (first) return `${coeff < 0 ? '-' : ''}${body}`;
    return ` ${sign} ${body}`;
  };
  return `${term(a, 'x²', true)}${term(b, 'x', false)}${term(c, '', false)} = 0`;
}

async function generateQuadratic() {
  quadQuestionDisplay.textContent = 'Generating…';
  setQuadFeedback('', '');
  quadGenerateBtn.disabled = true;
  try {
    const res = await fetch('/api/quadratic', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);

    currentQuadratic = { a: data.a, b: data.b, c: data.c };
    quadQuestionDisplay.textContent = `Find the roots: ${formatEquation(data.a, data.b, data.c)}`;
    root1Input.value = '';
    root2Input.value = '';
  } catch (err) {
    currentQuadratic = null;
    const hint = location.protocol === 'file:' ? ' Run "npm start" and open http://localhost:3000.' : '';
    quadQuestionDisplay.textContent = 'Could not generate a quadratic.';
    setQuadFeedback(`${err.message}${hint}`, 'info');
  } finally {
    quadGenerateBtn.disabled = false;
  }
}

quadGenerateBtn.addEventListener('click', generateQuadratic);

quadForm.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!currentQuadratic) {
    setQuadFeedback('Click "Generate Quadratic" first.', 'info');
    return;
  }

  const r1 = parseComplex(root1Input.value);
  const r2 = parseComplex(root2Input.value);
  if (!r1 || !r2) {
    setQuadFeedback('Could not read your roots. Use forms like 3, -1.5, 1/2, 2+3i, -4i.', 'info');
    return;
  }

  const { a, b, c } = currentQuadratic;
  const [t1, t2] = solveQuadratic(a, b, c);
  const correct =
    (sameRoot(r1, t1) && sameRoot(r2, t2)) || (sameRoot(r1, t2) && sameRoot(r2, t1));

  if (correct) {
    setQuadFeedback('Correct!', 'correct');
  } else {
    const d = b * b - 4 * a * c;
    setQuadFeedback(
      `Incorrect. The roots were ${formatRoot(t1)} and ${formatRoot(t2)}.\n` +
        `Discriminant b²-4ac = ${d}; x = (-b ± √D) / 2a`,
      'incorrect'
    );
  }
});

generateBtn.addEventListener('click', generateQuestion);

answerForm.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!currentQuestion) {
    feedback.textContent = 'Click "Generate Question" first.';
    feedback.className = 'info';
    return;
  }

  const studentAnswer = Number(answerInput.value);

  if (studentAnswer === currentQuestion.correctAnswer) {
    feedback.textContent = 'Correct!';
    feedback.className = 'correct';
  } else {
    feedback.textContent = `Incorrect. The answer was ${currentQuestion.correctAnswer}.`;
    feedback.className = 'incorrect';
  }
});
