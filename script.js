const taskForm = document.getElementById('taskForm');
const taskTitleInput = document.getElementById('taskTitle');
const taskDescriptionInput = document.getElementById('taskDescription');
const taskTimerInput = document.getElementById('taskTimer');
const taskList = document.getElementById('taskList');
const modeToggle = document.getElementById('modeToggle');
const filterButtons = document.querySelectorAll('#filterOptions button');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let taskIntervals = {};
let isEditing = false;
let taskBeingEditedId = null;

window.addEventListener('load', () => {
    renderTasks(tasks);
});

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const taskTitle = taskTitleInput.value.trim();
    const taskDescription = taskDescriptionInput.value.trim();
    const taskTimer = parseInt(taskTimerInput.value.trim(), 10);

    if (taskTitle && taskTimer > 0) {
        if (isEditing) {
            const taskIndex = tasks.findIndex(task => task.id === taskBeingEditedId);
            tasks[taskIndex].title = taskTitle;
            tasks[taskIndex].description = taskDescription;
            tasks[taskIndex].timer = taskTimer;

            isEditing = false;
            taskBeingEditedId = null;
            taskForm.querySelector('button[type="submit"]').textContent = 'Add Task';
        } else {
            const newTask = {
                id: Date.now(),
                title: taskTitle,
                description: taskDescription,
                timer: taskTimer,
                completed: false,
                addedAt: new Date().getTime()
            };
            tasks.push(newTask);
        }

        localStorage.setItem('tasks', JSON.stringify(tasks));
        taskTitleInput.value = ''; 
        taskDescriptionInput.value = '';
        taskTimerInput.value = ''; 
        renderTasks(tasks);
    } else {
        alert('Please enter a valid title and timer.');
    }
});

function renderTasks(tasksArray) {
    taskList.innerHTML = '';
    clearAllIntervals();

    const filteredTasks = tasksArray.filter(task => {
        if (currentFilter === 'active') {
            return !isTaskExpired(task);
        }
        if (currentFilter === 'expired') {
            return isTaskExpired(task);
        }
        return true;
    });

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.classList.add('task');
        if (isTaskExpired(task)) {
            li.classList.add('expired');
        } else {
            li.classList.add('active');
        }

        const timeLeft = getTimeLeft(task);
        li.innerHTML = `
            <h3>${task.title}</h3>
            <p>${task.description}</p>
            <p>Time left: <span class="timer" id="timer-${task.id}">${formatTimeLeft(timeLeft)}</span></p>
            <button class="edit-btn" onclick="editTask(${task.id})">✏️ Edit</button>
            <button class="delete-btn" onclick="deleteTask(${task.id})">❌ Delete</button>`;
        taskList.appendChild(li);
        taskIntervals[task.id] = setInterval(() => {
            const timeLeft = getTimeLeft(task);
            document.getElementById(`timer-${task.id}`).innerText = formatTimeLeft(timeLeft);
            if (timeLeft <= 0) {
                clearInterval(taskIntervals[task.id]);
                renderTasks(tasks);
            }
        }, 1000);
    });
}

function clearAllIntervals() {
    Object.keys(taskIntervals).forEach(intervalId => {
        clearInterval(taskIntervals[intervalId]);
    });
}

function formatTimeLeft(milliseconds) {
    if (milliseconds <= 0) return '00:00';
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function getTimeLeft(task) {
    const now = new Date().getTime();
    const taskTime = task.addedAt + task.timer * 60000;
    return taskTime - now;
}

function isTaskExpired(task) {
    return getTimeLeft(task) <= 0;
}

function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTasks(tasks);
}

function editTask(taskId) {
    const taskToEdit = tasks.find(task => task.id === taskId);
    if (taskToEdit) {
        taskTitleInput.value = taskToEdit.title;
        taskDescriptionInput.value = taskToEdit.description;
        taskTimerInput.value = taskToEdit.timer;
        isEditing = true;
        taskBeingEditedId = taskId;
        taskForm.querySelector('button[type="submit"]').textContent = 'Update Task';
    }
}

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.dataset.filter;
        renderTasks(tasks);
    });
});

modeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});
