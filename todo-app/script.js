
/* ==============================
   1. GET HTML ELEMENTS
   ============================== */

const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const taskCount = document.querySelector("#task-count");
const filterGroup = document.querySelector("#filter-group");
const emptyMessage = document.querySelector("#empty-message");
const clearCompletedButton = document.querySelector("#clear-completed");

/* ==============================
   2. APPLICATION STATE
   ============================== */

const STORAGE_KEY = "taskflow-tasks";

let tasks = loadTasks();
let currentFilter = "all";

/* ==============================
   3. LOAD AND SAVE TASKS
   ============================== */

function loadTasks() {
    try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);

        if (!savedTasks) {
            return [];
        }

        const parsedTasks = JSON.parse(savedTasks);

        if (!Array.isArray(parsedTasks)) {
            return [];
        }

        return parsedTasks.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.text === "string" &&
            typeof task.completed === "boolean"
        );
    } catch (error) {
        console.error("Could not load saved tasks:", error);
        return [];
    }
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error("Could not save tasks:", error);
        alert("Your changes could not be saved in this browser.");
    }
}

/* ==============================
   4. CREATE A NEW TASK
   ============================== */

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const text = taskInput.value.trim();

    if (text === "") {
        taskInput.focus();
        return;
    }

    const newTask = {
        id: createTaskId(),
        text: text,
        completed: false
    };

    tasks.unshift(newTask);

    saveTasks();
    renderTasks();

    taskInput.value = "";
    taskInput.focus();
});

function createTaskId() {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2)
    );
}

/* ==============================
   5. FILTER TASKS
   ============================== */

filterGroup.addEventListener("click", function (event) {
    const button = event.target.closest("[data-filter]");

    if (!button || !filterGroup.contains(button)) {
        return;
    }

    currentFilter = button.dataset.filter;

    filterGroup.querySelectorAll("[data-filter]").forEach(filterButton => {
        const isActive = filterButton === button;

        filterButton.classList.toggle("active", isActive);
        filterButton.setAttribute("aria-pressed", String(isActive));
    });

    renderTasks();
});

function getVisibleTasks() {
    if (currentFilter === "active") {
        return tasks.filter(task => !task.completed);
    }

    if (currentFilter === "completed") {
        return tasks.filter(task => task.completed);
    }

    return tasks;
}

/* ==============================
   6. DISPLAY TASKS
   ============================== */

function renderTasks() {
    taskList.replaceChildren();

    const visibleTasks = getVisibleTasks();

    visibleTasks.forEach(task => {
        const item = document.createElement("li");
        item.className = "task-item";

        if (task.completed) {
            item.classList.add("completed");
        }

        item.dataset.id = task.id;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = task.completed;
        checkbox.dataset.action = "toggle";
        checkbox.setAttribute(
            "aria-label",
            `Mark ${task.text} as ${task.completed ? "active" : "completed"}`
        );

        const taskText = document.createElement("span");
        taskText.className = "task-text";
        taskText.textContent = task.text;

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "action-button";
        editButton.dataset.action = "edit";
        editButton.textContent = "Edit";
        editButton.setAttribute("aria-label", `Edit ${task.text}`);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "action-button delete";
        deleteButton.dataset.action = "delete";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute("aria-label", `Delete ${task.text}`);

        actions.append(editButton, deleteButton);
        item.append(checkbox, taskText, actions);
        taskList.appendChild(item);
    });

    const remainingTasks = tasks.filter(task => !task.completed).length;

    taskCount.textContent =
        `${remainingTasks} task${remainingTasks === 1 ? "" : "s"} remaining`;

    emptyMessage.hidden = visibleTasks.length > 0;

    if (visibleTasks.length === 0) {
        if (currentFilter === "active" && tasks.length > 0) {
            emptyMessage.textContent = "No active tasks. Great work!";
        } else if (currentFilter === "completed" && tasks.length > 0) {
            emptyMessage.textContent = "No completed tasks yet.";
        } else {
            emptyMessage.textContent = "No tasks yet. Add your first task above!";
        }
    }
}

/* ==============================
   7. EVENT DELEGATION
   Handle task actions from one
   listener on the task list.
   ============================== */

taskList.addEventListener("change", function (event) {
    const checkbox = event.target.closest('[data-action="toggle"]');

    if (!checkbox) {
        return;
    }

    const item = checkbox.closest(".task-item");
    const task = tasks.find(task => task.id === item.dataset.id);

    if (!task) {
        return;
    }

    task.completed = checkbox.checked;

    saveTasks();
    renderTasks();
});

taskList.addEventListener("click", function (event) {
    const button = event.target.closest("[data-action]");

    if (!button || !taskList.contains(button)) {
        return;
    }

    const item = button.closest(".task-item");

    if (!item) {
        return;
    }

    const task = tasks.find(task => task.id === item.dataset.id);

    if (!task) {
        return;
    }

    if (button.dataset.action === "delete") {
        tasks = tasks.filter(existingTask => existingTask.id !== task.id);

        saveTasks();
        renderTasks();
    }

    if (button.dataset.action === "edit") {
        const updatedText = prompt("Edit your task:", task.text);

        if (updatedText === null) {
            return;
        }

        const cleanedText = updatedText.trim();

        if (cleanedText === "") {
            alert("Task cannot be empty.");
            return;
        }

        if (cleanedText.length > 200) {
            alert("Task must be 200 characters or fewer.");
            return;
        }

        task.text = cleanedText;

        saveTasks();
        renderTasks();
    }
});

/* ==============================
   8. CLEAR COMPLETED TASKS
   ============================== */

clearCompletedButton.addEventListener("click", function () {
    const completedCount = tasks.filter(task => task.completed).length;

    if (completedCount === 0) {
        return;
    }

    tasks = tasks.filter(task => !task.completed);

    saveTasks();
    renderTasks();
});

/* ==============================
   9. INITIAL DISPLAY
   ============================== */

renderTasks();
