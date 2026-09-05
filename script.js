const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');

let todos = [];

function render() {
  list.innerHTML = '';
  todos.forEach((text, index) => {
    const li = document.createElement('li');
    li.textContent = text;

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => {
      todos.splice(index, 1);
      render();
    };

    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (text) {
    todos.push(text);
    input.value = '';
    render();
  }
});

render();
