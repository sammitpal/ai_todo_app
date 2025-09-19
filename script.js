class TodoBoard {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentEditingTask = null;
        this.taskIdCounter = this.getNextTaskId();
        
        this.initializeEventListeners();
        this.renderTasks();
        this.updateTaskCounts();
    }

    initializeEventListeners() {
        // Add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.openModal();
        });

        // Modal close events
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });

        // Click outside modal to close
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target.id === 'taskModal') {
                this.closeModal();
            }
        });

        // Form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        // Drag and drop setup
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const columns = document.querySelectorAll('.column-content');
        
        columns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.parentElement.classList.add('drag-over');
            });

            column.addEventListener('dragleave', (e) => {
                if (!column.parentElement.contains(e.relatedTarget)) {
                    column.parentElement.classList.remove('drag-over');
                }
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.parentElement.classList.remove('drag-over');
                
                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = column.parentElement.dataset.status;
                
                this.moveTask(taskId, newStatus);
            });
        });
    }

    openModal(task = null) {
        const modal = document.getElementById('taskModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('taskForm');
        
        if (task) {
            modalTitle.textContent = 'Edit Task';
            this.currentEditingTask = task;
            this.populateForm(task);
        } else {
            modalTitle.textContent = 'Add New Task';
            this.currentEditingTask = null;
            form.reset();
        }
        
        modal.style.display = 'block';
        document.getElementById('taskTitle').focus();
    }

    closeModal() {
        document.getElementById('taskModal').style.display = 'none';
        document.getElementById('taskForm').reset();
        this.currentEditingTask = null;
    }

    populateForm(task) {
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskAssignee').value = task.assignee;
        document.getElementById('taskStatus').value = task.status;
    }

    saveTask() {
        const formData = new FormData(document.getElementById('taskForm'));
        const taskData = {
            title: formData.get('title').trim(),
            description: formData.get('description').trim(),
            priority: formData.get('priority'),
            assignee: formData.get('assignee').trim(),
            status: formData.get('status'),
            createdAt: new Date().toISOString()
        };

        if (!taskData.title) {
            alert('Please enter a task title');
            return;
        }

        if (this.currentEditingTask) {
            // Update existing task
            const taskIndex = this.tasks.findIndex(task => task.id === this.currentEditingTask.id);
            this.tasks[taskIndex] = { ...this.currentEditingTask, ...taskData };
        } else {
            // Create new task
            taskData.id = this.taskIdCounter++;
            this.tasks.push(taskData);
        }

        this.saveTasks();
        this.renderTasks();
        this.updateTaskCounts();
        this.closeModal();
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            this.updateTaskCounts();
        }
    }

    moveTask(taskId, newStatus) {
        const task = this.tasks.find(task => task.id == taskId);
        if (task && task.status !== newStatus) {
            task.status = newStatus;
            this.saveTasks();
            this.renderTasks();
            this.updateTaskCounts();
        }
    }

    renderTasks() {
        const columns = {
            'todo': document.getElementById('todo-column'),
            'in-progress': document.getElementById('in-progress-column'),
            'review': document.getElementById('review-column'),
            'done': document.getElementById('done-column')
        };

        // Clear all columns
        Object.values(columns).forEach(column => {
            column.innerHTML = '';
        });

        // Group tasks by status
        const tasksByStatus = this.groupTasksByStatus();

        // Render tasks in each column
        Object.keys(columns).forEach(status => {
            const column = columns[status];
            const tasks = tasksByStatus[status] || [];

            if (tasks.length === 0) {
                column.innerHTML = '<div class="empty-state"><i class="fas fa-clipboard-list"></i><br>No tasks yet</div>';
            } else {
                tasks.forEach(task => {
                    column.appendChild(this.createTaskElement(task));
                });
            }
        });
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-card priority-${task.priority}`;
        taskElement.draggable = true;
        taskElement.dataset.taskId = task.id;

        taskElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            taskElement.classList.add('dragging');
        });

        taskElement.addEventListener('dragend', () => {
            taskElement.classList.remove('dragging');
        });

        const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        const assigneeDisplay = task.assignee || 'Unassigned';
        const description = task.description ? 
            `<div class="task-description">${task.description}</div>` : '';

        taskElement.innerHTML = `
            <div class="task-actions">
                <button class="task-action-btn" onclick="todoBoard.openModal(todoBoard.getTask(${task.id}))">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="task-action-btn" onclick="todoBoard.deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="task-title">${task.title}</div>
            ${description}
            <div class="task-meta">
                <span class="task-priority priority-${task.priority}">${priorityText}</span>
                <span class="task-assignee">${assigneeDisplay}</span>
            </div>
        `;

        return taskElement;
    }

    groupTasksByStatus() {
        return this.tasks.reduce((groups, task) => {
            const status = task.status || 'todo';
            if (!groups[status]) {
                groups[status] = [];
            }
            groups[status].push(task);
            return groups;
        }, {});
    }

    updateTaskCounts() {
        const tasksByStatus = this.groupTasksByStatus();
        
        document.getElementById('todo-count').textContent = (tasksByStatus['todo'] || []).length;
        document.getElementById('in-progress-count').textContent = (tasksByStatus['in-progress'] || []).length;
        document.getElementById('review-count').textContent = (tasksByStatus['review'] || []).length;
        document.getElementById('done-count').textContent = (tasksByStatus['done'] || []).length;
    }

    getTask(taskId) {
        return this.tasks.find(task => task.id === taskId);
    }

    loadTasks() {
        try {
            const saved = localStorage.getItem('jira-todo-tasks');
            return saved ? JSON.parse(saved) : this.getDefaultTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
            return this.getDefaultTasks();
        }
    }

    saveTasks() {
        try {
            localStorage.setItem('jira-todo-tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
        }
    }

    getNextTaskId() {
        if (this.tasks.length === 0) return 1;
        return Math.max(...this.tasks.map(task => task.id)) + 1;
    }

    getDefaultTasks() {
        return [
            {
                id: 1,
                title: 'Set up project repository',
                description: 'Initialize Git repository and set up basic project structure',
                priority: 'high',
                assignee: 'John Doe',
                status: 'done',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                title: 'Design user interface mockups',
                description: 'Create wireframes and visual designs for the main application screens',
                priority: 'medium',
                assignee: 'Jane Smith',
                status: 'in-progress',
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                title: 'Implement authentication system',
                description: 'Add user login, registration, and session management',
                priority: 'high',
                assignee: 'Mike Johnson',
                status: 'todo',
                createdAt: new Date().toISOString()
            },
            {
                id: 4,
                title: 'Write API documentation',
                description: 'Document all REST API endpoints with examples',
                priority: 'low',
                assignee: 'Sarah Wilson',
                status: 'review',
                createdAt: new Date().toISOString()
            },
            {
                id: 5,
                title: 'Set up CI/CD pipeline',
                description: 'Configure automated testing and deployment workflow',
                priority: 'medium',
                assignee: 'Alex Brown',
                status: 'todo',
                createdAt: new Date().toISOString()
            }
        ];
    }

    // Keyboard shortcuts
    handleKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N to add new task
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.openModal();
            }
            
            // Escape to close modal
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }
}

// Initialize the todo board when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todoBoard = new TodoBoard();
    window.todoBoard.handleKeyboardShortcuts();
});

// Keyboard shortcuts info
console.log('🔥 JIRA-Style Todo Board loaded!');
console.log('⌨️  Keyboard shortcuts:');
console.log('   • Ctrl/Cmd + N: Add new task');
console.log('   • Escape: Close modal');
console.log('   • Drag and drop tasks between columns');