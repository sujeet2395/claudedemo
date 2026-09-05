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
