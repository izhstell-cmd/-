// Task Management Application
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.editingTaskId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
        this.initTheme();
        this.showWelcomeMessage();
    }

    // Event Bindings
    bindEvents() {
        // Add task
        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Task filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // Modal events
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('modalCancel').addEventListener('click', () => this.closeModal());
        document.getElementById('modalSave').addEventListener('click', () => this.saveTaskEdit());
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    // Task Management
    addTask() {
        const input = document.getElementById('taskInput');
        const priority = document.getElementById('taskPriority').value;
        const title = input.value.trim();

        if (!title) {
            this.showToast('Пожалуйста, введите название задачи', 'warning');
            return;
        }

        const task = {
            id: this.generateId(),
            title,
            description: '',
            priority,
            completed: false,
            createdAt: new Date().toISOString(),
            dueDate: null
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        input.value = '';
        this.showToast('Задача успешно добавлена!', 'success');
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
            const message = task.completed ? 'Задача выполнена!' : 'Задача возвращена в работу';
            this.showToast(message, task.completed ? 'success' : 'warning');
        }
    }

    deleteTask(id) {
        if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showToast('Задача удалена', 'success');
        }
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.editingTaskId = id;
            document.getElementById('modalTitle').textContent = 'Редактировать задачу';
            document.getElementById('modalTaskTitle').value = task.title;
            document.getElementById('modalTaskDescription').value = task.description || '';
            document.getElementById('modalTaskPriority').value = task.priority;
            document.getElementById('modalTaskDueDate').value = task.dueDate ? task.dueDate.split('T')[0] : '';
            this.openModal();
        }
    }

    saveTaskEdit() {
        if (!this.editingTaskId) return;

        const title = document.getElementById('modalTaskTitle').value.trim();
        const description = document.getElementById('modalTaskDescription').value.trim();
        const priority = document.getElementById('modalTaskPriority').value;
        const dueDate = document.getElementById('modalTaskDueDate').value;

        if (!title) {
            this.showToast('Название задачи не может быть пустым', 'warning');
            return;
        }

        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (task) {
            task.title = title;
            task.description = description;
            task.priority = priority;
            task.dueDate = dueDate || null;
            
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.closeModal();
            this.showToast('Задача обновлена!', 'success');
        }
    }

    // Filtering
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTasks();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'completed':
                return this.tasks.filter(task => task.completed);
            case 'pending':
                return this.tasks.filter(task => !task.completed);
            case 'high':
                return this.tasks.filter(task => task.priority === 'high');
            default:
                return this.tasks;
        }
    }

    // Rendering
    renderTasks() {
        const taskList = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            taskList.style.display = 'none';
            emptyState.style.display = 'flex';
            
            // Update empty state message based on filter
            const emptyStateTitle = emptyState.querySelector('h3');
            const emptyStateText = emptyState.querySelector('p');
            
            switch (this.currentFilter) {
                case 'completed':
                    emptyStateTitle.textContent = 'Нет выполненных задач';
                    emptyStateText.textContent = 'Завершите задачи, чтобы увидеть их здесь';
                    break;
                case 'pending':
                    emptyStateTitle.textContent = 'Нет задач в работе';
                    emptyStateText.textContent = 'Все задачи выполнены!';
                    break;
                case 'high':
                    emptyStateTitle.textContent = 'Нет задач с высоким приоритетом';
                    emptyStateText.textContent = 'Создайте задачу с высоким приоритетом';
                    break;
                default:
                    emptyStateTitle.textContent = 'Пока нет задач';
                    emptyStateText.textContent = 'Добавьте свою первую задачу, чтобы начать работу';
            }
        } else {
            taskList.style.display = 'block';
            emptyState.style.display = 'none';
            
            taskList.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
            
            // Bind task events
            this.bindTaskEvents();
        }
    }

    createTaskHTML(task) {
        const createdDate = new Date(task.createdAt).toLocaleDateString('ru-RU');
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('ru-RU') : null;
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="taskManager.toggleTask('${task.id}')">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-content">
                    <div class="task-title">${this.escapeHtml(task.title)}</div>
                    <div class="task-meta">
                        <span class="task-priority ${task.priority}">${this.getPriorityText(task.priority)}</span>
                        <span><i class="fas fa-calendar"></i> ${createdDate}</span>
                        ${dueDate ? `<span class="${isOverdue ? 'text-error' : ''}"><i class="fas fa-clock"></i> до ${dueDate}</span>` : ''}
                        ${task.description ? `<span><i class="fas fa-info-circle"></i> Есть описание</span>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn edit" onclick="taskManager.editTask('${task.id}')" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-action-btn delete" onclick="taskManager.deleteTask('${task.id}')" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    bindTaskEvents() {
        // Events are bound via onclick in HTML for simplicity
        // In a production app, you'd want to use event delegation
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;
        const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('productivity').textContent = `${productivity}%`;
    }

    // Modal Management
    openModal() {
        document.getElementById('taskModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('taskModal').classList.remove('active');
        document.body.style.overflow = '';
        this.editingTaskId = null;
        
        // Clear form
        document.getElementById('modalTaskTitle').value = '';
        document.getElementById('modalTaskDescription').value = '';
        document.getElementById('modalTaskPriority').value = 'medium';
        document.getElementById('modalTaskDueDate').value = '';
    }

    // Theme Management
    initTheme() {
        const savedTheme = localStorage.getItem('taskflow-theme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('taskflow-theme', theme);
        
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // Toast Notifications
    showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${this.escapeHtml(message)}</div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    getToastIcon(type) {
        switch (type) {
            case 'success': return '<i class="fas fa-check-circle"></i>';
            case 'error': return '<i class="fas fa-exclamation-circle"></i>';
            case 'warning': return '<i class="fas fa-exclamation-triangle"></i>';
            default: return '<i class="fas fa-info-circle"></i>';
        }
    }

    // Local Storage
    saveTasks() {
        localStorage.setItem('taskflow-tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('taskflow-tasks');
        return saved ? JSON.parse(saved) : [];
    }

    // Utility Functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getPriorityText(priority) {
        switch (priority) {
            case 'high': return 'Высокий';
            case 'medium': return 'Средний';
            case 'low': return 'Низкий';
            default: return 'Средний';
        }
    }

    showWelcomeMessage() {
        if (this.tasks.length === 0) {
            setTimeout(() => {
                this.showToast('Добро пожаловать в TaskFlow! Создайте свою первую задачу.', 'success');
            }, 1000);
        }
    }

    // Export/Import functionality (bonus feature)
    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `taskflow-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showToast('Задачи экспортированы!', 'success');
    }

    importTasks(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                if (Array.isArray(importedTasks)) {
                    this.tasks = importedTasks;
                    this.saveTasks();
                    this.renderTasks();
                    this.updateStats();
                    this.showToast('Задачи успешно импортированы!', 'success');
                } else {
                    throw new Error('Invalid format');
                }
            } catch (error) {
                this.showToast('Ошибка при импорте файла', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Keyboard shortcuts
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N - Add new task
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                document.getElementById('taskInput').focus();
            }
            
            // Ctrl/Cmd + / - Toggle theme
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    // Search functionality
    searchTasks(query) {
        const searchResults = this.tasks.filter(task => 
            task.title.toLowerCase().includes(query.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(query.toLowerCase()))
        );
        return searchResults;
    }
}

// Add CSS animation for toast slide out
const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    .text-error {
        color: var(--error-color) !important;
    }
`;
document.head.appendChild(style);

// Initialize the application
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
    taskManager.initKeyboardShortcuts();
});

// Service Worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// PWA Install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or notification
    const installBtn = document.createElement('button');
    installBtn.textContent = 'Установить приложение';
    installBtn.className = 'btn btn-primary';
    installBtn.style.position = 'fixed';
    installBtn.style.bottom = '20px';
    installBtn.style.right = '20px';
    installBtn.style.zIndex = '1000';
    
    installBtn.addEventListener('click', () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
            installBtn.remove();
        });
    });
    
    document.body.appendChild(installBtn);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (installBtn.parentNode) {
            installBtn.remove();
        }
    }, 10000);
});