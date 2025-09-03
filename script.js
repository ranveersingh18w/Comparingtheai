document.addEventListener('DOMContentLoaded', () => {
    const countdownTimer = document.getElementById('countdown-timer');
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const mainNav = document.querySelector('.main-nav');
    const views = document.querySelectorAll('.view');
    const addTaskForm = document.getElementById('add-task-form');
    const taskList = document.getElementById('task-list');
    const taskFilters = document.getElementById('task-filters');
    const weeklyPlanner = document.getElementById('weekly-planner');
    const monthlyPlanner = document.getElementById('monthly-planner');
    const monthYear = document.getElementById('month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const addEventModal = document.getElementById('add-event-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const saveEventBtn = document.getElementById('save-event');
    const tooltip = document.getElementById('tooltip');
    const globalSearch = document.getElementById('global-search');
    const quickTemplates = document.getElementById('quick-templates');
    const countdownChips = document.getElementById('countdown-chips');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let weeklyEvents = JSON.parse(localStorage.getItem('weeklyEvents')) || [];
    let monthlyEvents = JSON.parse(localStorage.getItem('monthlyEvents')) || [];
    let currentFilter = 'all';
    let currentDate = new Date();
    let editingEventId = null;
    let draggedIndex = null;
    let draggedTask = null;
    let draggedEventId = null;
    let pomodoroInterval = null;
    let pomodoroTimeLeft = 25 * 60;
    let pomodoroRunning = false;

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function saveWeeklyEvents() {
        localStorage.setItem('weeklyEvents', JSON.stringify(weeklyEvents));
    }

    function saveMonthlyEvents() {
        localStorage.setItem('monthlyEvents', JSON.stringify(monthlyEvents));
    }

    function renderTasks(searchQuery = '') {
        taskList.innerHTML = '';
        const filteredTasks = tasks.filter(task => {
            const searchMatch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

            if (searchQuery && !searchMatch) {
                return false;
            }

            if (currentFilter === 'all') {
                return true;
            }
            if (currentFilter === 'today') {
                const today = new Date().toISOString().slice(0, 10);
                return task.dueDate === today;
            }
            if (currentFilter === 'overdue') {
                const today = new Date().toISOString().slice(0, 10);
                return task.dueDate < today;
            }
            if (currentFilter === 'completed') {
                return task.completed;
            }
            if (currentFilter === 'high') {
                return task.priority === 'high';
            }
        });

        filteredTasks.forEach((task, index) => {
            const taskItem = document.createElement('li');
            taskItem.className = task.completed ? 'completed' : '';
            taskItem.setAttribute('draggable', 'true');
            taskItem.setAttribute('data-index', index);
            taskItem.innerHTML = '
                <input type="checkbox" data-index="' + index + '" ' + (task.completed ? 'checked' : '') + '>
                <span class="task-title" contenteditable="true" data-index="' + index + '">' + task.title + '</span>
                <span>' + task.priority + '</span>
                <span>' + task.dueDate + '</span>
                <span>' + task.tags.join(', ') + '</span>
                <button data-index="' + index + '">Delete</button>
            ';
            taskList.appendChild(taskItem);
        });
    }

    function renderWeeklyPlanner() {
        weeklyPlanner.innerHTML = '';
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        days.forEach(day => {
            const dayColumn = document.createElement('div');
            dayColumn.className = 'day-column';
            dayColumn.innerHTML = `<h3>${day}</h3>`;
            for (let i = 8; i < 22; i++) {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                timeSlot.dataset.time = `${i}:00`;
                dayColumn.appendChild(timeSlot);
                const timeSlot2 = document.createElement('div');
                timeSlot2.className = 'time-slot';
                timeSlot2.dataset.time = `${i}:30`;
                dayColumn.appendChild(timeSlot2);
            }
            weeklyPlanner.appendChild(dayColumn);
        });

        weeklyEvents.forEach(event => {
            const dayColumn = Array.from(weeklyPlanner.children).find(col => col.querySelector('h3').textContent === event.day);
            if (dayColumn) {
                const timeSlot = dayColumn.querySelector(`[data-time="${event.time}"]`);
                if (timeSlot) {
                    const eventElement = document.createElement('div');
                    eventElement.className = 'event';
                    eventElement.textContent = event.title;
                    timeSlot.appendChild(eventElement);
                }
            }
        });
    }

    function renderMonthlyPlanner(searchQuery = '') {
        monthlyPlanner.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        monthYear.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            monthlyPlanner.appendChild(emptyCell);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = i;
            dayCell.dataset.day = i;

            const eventsForDay = monthlyEvents.filter(event => {
                const eventDate = new Date(event.startDate);
                const searchMatch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (event.notes && event.notes.toLowerCase().includes(searchQuery.toLowerCase()));
                return eventDate.getFullYear() === year && eventDate.getMonth() === month && eventDate.getDate() === i && (!searchQuery || searchMatch);
            });

            eventsForDay.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'event';
                eventElement.textContent = event.title;
                eventElement.setAttribute('draggable', 'true');
                eventElement.dataset.eventId = event.id;
                dayCell.appendChild(eventElement);
            });

            monthlyPlanner.appendChild(dayCell);
        }
    }

    function addTask(e) {
        e.preventDefault();
        const title = document.getElementById('task-title').value;
        const priority = document.getElementById('task-priority').value;
        const dueDate = document.getElementById('task-due-date').value;
        const tags = document.getElementById('task-tags').value.split(',').map(tag => tag.trim());

        const newTask = {
            id: Date.now(),
            title,
            priority,
            dueDate,
            tags,
            completed: false
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();
        addTaskForm.reset();
    }

    function switchView(e) {
        if (e.target.tagName === 'BUTTON') {
            const viewName = e.target.dataset.view;
            views.forEach(view => {
                if (view.id === `${viewName}-view`) {
                    view.classList.add('active');
                } else {
                    view.classList.remove('active');
                }
            });
        }
    }

    function updateCountdown() {
        const now = new Date();
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const diff = endOfDay - now;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        countdownTimer.textContent = `Time left today: ${hours}h ${minutes}m ${seconds}s`;
    }

    function updateDateTime() {
        const now = new Date();
        const dateTimeString = now.toLocaleString();
        document.getElementById('current-datetime').textContent = dateTimeString;
    }

    function updateProgressRing() {
        const today = new Date().toISOString().slice(0, 10);
        const todayTasks = tasks.filter(task => task.dueDate === today);
        const completedTasks = todayTasks.filter(task => task.completed);
        const percentage = todayTasks.length > 0 ? (completedTasks.length / todayTasks.length) * 100 : 0;

        const circle = document.querySelector('.progress-ring__circle');
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (percentage / 100) * circumference;

        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = offset;

        document.querySelector('.progress-ring__text').textContent = `${Math.round(percentage)}%`;
    }

    function updateMotivationalText() {
        const hour = new Date().getHours();
        let message = '';
        if (hour < 12) {
            message = 'Good morning! Let\'s get things done!';
        } else if (hour < 18) {
            message = 'Keep up the great work!';
        } else {
            message = 'Almost there! Finish strong!';
        }
        document.getElementById('motivational-text').textContent = message;
    }

    function toggleTheme() {
        body.classList.toggle('dark-theme');
        const isDarkMode = body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        if (!isDarkMode) {
            body.classList.add('light-theme');
        } else {
            body.classList.remove('light-theme');
        }
    }

    function applyTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-theme');
        } else {
            body.classList.add('light-theme');
        }
    }

    mainNav.addEventListener('click', switchView);
    addTaskForm.addEventListener('submit', addTask);
    themeToggle.addEventListener('click', toggleTheme);

    taskFilters.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            currentFilter = e.target.dataset.filter;
            renderTasks();
        }
    });

    taskList.addEventListener('click', (e) => {
        const index = e.target.dataset.index;
        if (e.target.tagName === 'BUTTON') {
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
        } else if (e.target.type === 'checkbox') {
            tasks[index].completed = e.target.checked;
            saveTasks();
            renderTasks();
            updateProgressRing();
        }
    });

    taskList.addEventListener('blur', (e) => {
        if (e.target.classList.contains('task-title')) {
            const index = e.target.dataset.index;
            tasks[index].title = e.target.textContent;
            saveTasks();
        }
    }, true);

    taskList.addEventListener('dragstart', (e) => {
        draggedIndex = e.target.dataset.index;
        draggedTask = tasks[draggedIndex];
    });

    taskList.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    taskList.addEventListener('drop', (e) => {
        e.preventDefault();
        const droppedIndex = e.target.closest('li').dataset.index;
        const draggedItem = tasks.splice(draggedIndex, 1)[0];
        tasks.splice(droppedIndex, 0, draggedItem);
        saveTasks();
        renderTasks();
    });

    weeklyPlanner.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    weeklyPlanner.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedTask) {
            const timeSlot = e.target.closest('.time-slot');
            if (timeSlot) {
                const day = timeSlot.parentElement.querySelector('h3').textContent;
                const time = timeSlot.dataset.time;
                const newEvent = {
                    ...draggedTask,
                    day,
                    time
                };
                weeklyEvents.push(newEvent);
                saveWeeklyEvents();
                renderWeeklyPlanner();
                draggedTask = null;
            }
        }
    });

    monthlyPlanner.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('event')) {
            draggedEventId = e.target.dataset.eventId;
        }
    });

    monthlyPlanner.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    monthlyPlanner.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedEventId) {
            const dayCell = e.target.closest('.calendar-day');
            if (dayCell) {
                const day = dayCell.dataset.day;
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const event = monthlyEvents.find(ev => ev.id == draggedEventId);
                if (event) {
                    const newDate = new Date(year, month, day);
                    event.startDate = newDate.toISOString().slice(0, 10);
                    event.endDate = event.startDate;
                    saveMonthlyEvents();
                    renderMonthlyPlanner();
                    draggedEventId = null;
                }
            }
        }
    });

    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderMonthlyPlanner();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderMonthlyPlanner();
    });

    monthlyPlanner.addEventListener('click', (e) => {
        if (e.target.classList.contains('calendar-day')) {
            addEventModal.style.display = 'block';
            const day = e.target.dataset.day;
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            document.getElementById('event-start-date').value = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            editingEventId = null;
        } else if (e.target.classList.contains('event')) {
            const eventTitle = e.target.textContent;
            const event = monthlyEvents.find(ev => ev.title === eventTitle);
            if (event) {
                addEventModal.style.display = 'block';
                document.getElementById('event-title').value = event.title;
                document.getElementById('event-start-date').value = event.startDate;
                document.getElementById('event-end-date').value = event.endDate;
                document.getElementById('event-notes').value = event.notes;
                editingEventId = event.id;
            }
        }
    });

    monthlyPlanner.addEventListener('mouseover', (e) => {
        if (e.target.classList.contains('event')) {
            const eventTitle = e.target.textContent;
            const event = monthlyEvents.find(ev => ev.title === eventTitle);
            if (event) {
                tooltip.innerHTML = '
                    <strong>' + event.title + '</strong><br>
                    Start: ' + event.startDate + '<br>
                    End: ' + event.endDate + '<br>
                    Notes: ' + event.notes + '
                ';
                tooltip.style.display = 'block';
                tooltip.style.left = `${e.pageX + 10}px`;
                tooltip.style.top = `${e.pageY + 10}px`;
            }
        }
    });

    monthlyPlanner.addEventListener('mouseout', (e) => {
        if (e.target.classList.contains('event')) {
            tooltip.style.display = 'none';
        }
    });

    closeModalBtn.addEventListener('click', () => {
        addEventModal.style.display = 'none';
    });

    saveEventBtn.addEventListener('click', () => {
        const title = document.getElementById('event-title').value;
        const startDate = document.getElementById('event-start-date').value;
        const endDate = document.getElementById('event-end-date').value;
        const notes = document.getElementById('event-notes').value;

        if (editingEventId) {
            const eventIndex = monthlyEvents.findIndex(ev => ev.id === editingEventId);
            monthlyEvents[eventIndex] = { ...monthlyEvents[eventIndex], title, startDate, endDate, notes };
        } else {
            const newEvent = {
                id: Date.now(),
                title,
                startDate,
                endDate,
                notes
            };
            monthlyEvents.push(newEvent);
        }

        saveMonthlyEvents();
        renderMonthlyPlanner();
        addEventModal.style.display = 'none';
        editingEventId = null;
    });

    quickTemplates.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const template = e.target.dataset.template;
            if (template === 'assignment') {
                document.getElementById('task-title').value = 'Assignment: ';
                document.getElementById('task-tags').value = 'Assignment';
            } else if (template === 'exam') {
                document.getElementById('task-title').value = 'Exam: ';
                document.getElementById('task-tags').value = 'Exam';
            } else if (template === 'lab') {
                document.getElementById('task-title').value = 'Lab: ';
                document.getElementById('task-tags').value = 'Lab';
            }
        }
    });

    globalSearch.addEventListener('keyup', (e) => {
        const searchQuery = e.target.value;
        renderTasks(searchQuery);
        renderMonthlyPlanner(searchQuery);
    });

    setInterval(updateCountdown, 1000);
    setInterval(updateDateTime, 1000);
    setInterval(updateMotivationalText, 60000);
    updateCountdown();
    updateDateTime();
    updateProgressRing();
    updateMotivationalText();
    applyTheme();

    // Initial setup
    views[0].classList.add('active'); // Show the first view by default
    renderTasks();
    renderWeeklyPlanner();
    renderMonthlyPlanner();
});yTheme();

    // Initial setup
    views[0].classList.add('active'); // Show the first view by default
    renderTasks();
    renderWeeklyPlanner();
    renderMonthlyPlanner();
});