/**
 * Модуль футера для DreamCalc
 * Автономный модуль с функциональностью и управлением состоянием
 * Версия: 2.0.0
 */

class FooterModule {
    constructor() {
        this.version = '2.0.0';
        this.isOnline = navigator.onLine;
        this.deferredPrompt = null;
        this.stats = {
            totalCalculations: 0,
            mostCommonGoal: '—',
            averageTime: 0,
            totalAmount: 0
        };
        
        // Инициализация базовых функций
        this.init();
    }
    
    /**
     * Инициализация модуля
     */
    init() {
        this.bindEvents();
        this.updateOnlineStatus();
        this.loadStats();
        this.setupInstallPrompt();
        this.updateTechnicalInfo();
        
        // Обновляем техническую информацию каждые 30 секунд
        setInterval(() => this.updateTechnicalInfo(), 30000);
        
        console.log(`FooterModule v${this.version} инициализирован`);
    }
    
    /**
     * Инициализация после загрузки DOM
     */
    initAfterDOM() {
        // Перепривязываем события после загрузки HTML
        setTimeout(() => {
            this.bindEvents();
            this.updateOnlineStatus();
            this.updateStatsDisplay();
            this.updateTechnicalInfo();
            
            // Восстанавливаем сохраненную тему
            const savedTheme = localStorage.getItem('dreamcalc-theme');
            if (savedTheme) {
                this.setTheme(savedTheme);
            }
        }, 100);
    }
    
    /**
     * Привязка обработчиков событий
     */
    bindEvents() {
        // События онлайн/оффлайн
        window.addEventListener('online', () => this.handleConnectionChange(true));
        window.addEventListener('offline', () => this.handleConnectionChange(false));
        
        // Событие изменения темы
        const themeToggle = document.querySelector('[onclick*="toggleTheme"]');
        if (themeToggle) {
            themeToggle.onclick = (e) => {
                e.preventDefault();
                this.toggleTheme();
            };
        }
        
        // Событие прокрутки наверх
        const scrollToTopBtn = document.querySelector('[onclick*="scrollToTop"]');
        if (scrollToTopBtn) {
            scrollToTopBtn.onclick = (e) => {
                e.preventDefault();
                this.scrollToTop();
            };
        }
        
        // Событие для кнопки установки PWA
        const installBtn = document.getElementById('install-button');
        if (installBtn) {
            installBtn.addEventListener('click', () => this.installPWA());
        }
    }
    
    /**
     * Загрузка статистики приложения
     */
    async loadStats() {
        try {
            // Пытаемся получить статистику из основного приложения
            if (window.app && window.app.storageManager) {
                const stats = window.app.storageManager.getStatistics();
                this.stats = stats;
                this.updateStatsDisplay();
            } else {
                // Загружаем из localStorage напрямую
                const history = JSON.parse(localStorage.getItem('dreamcalc_history') || '[]');
                
                if (history.length > 0) {
                    // Считаем самую частую цель
                    const goalCounts = {};
                    history.forEach(item => {
                        goalCounts[item.dreamName] = (goalCounts[item.dreamName] || 0) + 1;
                    });
                    
                    const mostCommonGoal = Object.entries(goalCounts)
                        .sort(([,a], [,b]) => b - a)[0]?.[0] || '—';
                    
                    // Суммарная стоимость
                    const totalAmount = history.reduce(
                        (sum, item) => sum + (item.calculationData?.totalCost || 0), 0
                    );
                    
                    // Среднее время
                    const averageTime = Math.round(
                        history.reduce((sum, item) => sum + (item.results?.months || 0), 0) / history.length
                    ) || 0;
                    
                    this.stats = {
                        totalCalculations: history.length,
                        mostCommonGoal,
                        totalAmount,
                        averageTime
                    };
                    
                    this.updateStatsDisplay();
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        }
    }
    
    /**
     * Обновление отображения статистики
     */
    updateStatsDisplay() {
        const statsElement = document.getElementById('footer-stats');
        if (!statsElement) return;
        
        const { totalCalculations, mostCommonGoal, averageTime, totalAmount } = this.stats;
        
        // Форматируем сумму
        const formattedAmount = new Intl.NumberFormat('ru-RU').format(Math.round(totalAmount));
        
        statsElement.innerHTML = `
            <span title="Статистика приложения">
                📊 <strong>${totalCalculations}</strong> расчётов • 
                ⭐ <strong>${mostCommonGoal}</strong> • 
                💰 <strong>${formattedAmount}</strong> сомони
            </span>
        `;
    }
    
    /**
     * Обработчик изменения соединения
     */
    handleConnectionChange(isOnline) {
        this.isOnline = isOnline;
        this.updateOnlineStatus();
        
        // Показываем уведомление
        if (isOnline) {
            this.showNotification('🌐 Соединение восстановлено', 'success');
            setTimeout(() => this.loadStats(), 1000); // Обновляем статистику
        } else {
            this.showNotification('📴 Работаем в оффлайн-режиме', 'warning');
        }
    }
    
    /**
     * Обновление статуса онлайн/оффлайн
     */
    updateOnlineStatus() {
        const statusElement = document.getElementById('footer-status');
        if (!statusElement) return;
        
        const indicator = statusElement.querySelector('.status-indicator');
        const text = statusElement.querySelector('span:not(.status-indicator)');
        
        if (this.isOnline) {
            indicator.className = 'status-indicator online';
            text.textContent = 'Онлайн';
            
            // Проверяем скорость соединения
            this.checkConnectionSpeed().then(speed => {
                if (speed < 1) { // Медленное соединение
                    indicator.className = 'status-indicator slow';
                    text.textContent = 'Медленно';
                }
            });
        } else {
            indicator.className = 'status-indicator offline';
            text.textContent = 'Оффлайн';
        }
    }
    
    /**
     * Проверка скорости соединения
     */
    async checkConnectionSpeed() {
        if (!navigator.connection) return 10; // По умолчанию считаем быстрым
        
        try {
            const connection = navigator.connection;
            if (connection.effectiveType) {
                // Преобразуем эффективный тип в примерную скорость (Mbps)
                const speedMap = {
                    'slow-2g': 0.5,
                    '2g': 1,
                    '3g': 2,
                    '4g': 10
                };
                return speedMap[connection.effectiveType] || 10;
            }
            
            // Если доступна реальная скорость
            if (connection.downlink) {
                return connection.downlink;
            }
            
            return 10;
        } catch (error) {
            console.warn('Не удалось проверить скорость соединения:', error);
            return 10;
        }
    }
    
    /**
     * Настройка подсказки установки PWA
     */
    setupInstallPrompt() {
        const installBtn = document.getElementById('install-button');
        if (!installBtn) return;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            installBtn.style.display = 'block';
            
            // Показываем анимацию
            installBtn.innerHTML = '📱 Установить приложение';
            installBtn.classList.add('pulse-animation');
        });
        
        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            installBtn.style.display = 'none';
            this.showNotification('🎉 Приложение установлено!', 'success');
        });
    }
    
    /**
     * Установка PWA
     */
    async installPWA() {
        if (!this.deferredPrompt) return;
        
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('Пользователь принял установку PWA');
        } else {
            console.log('Пользователь отклонил установку PWA');
        }
        
        this.deferredPrompt = null;
    }
    
    /**
     * Переключение темы
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('dreamcalc-theme', newTheme);
        
        // Показываем уведомление
        const themeName = newTheme === 'dark' ? '🌙 Тёмная' : '☀️ Светлая';
        this.showNotification(`${themeName} тема активирована`, 'info');
        
        // Обновляем кнопку если есть
        const themeToggle = document.querySelector('[onclick*="toggleTheme"]');
        if (themeToggle) {
            const icon = newTheme === 'dark' ? '☀️' : '🌙';
            themeToggle.innerHTML = `${icon} Сменить тему`;
        }
    }
    
    /**
     * Прокрутка наверх
     */
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // Микро-анимация для кнопки
        const btn = document.querySelector('[onclick*="scrollToTop"]');
        if (btn) {
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 150);
        }
    }
    
    /**
     * Обновление технической информации
     */
    updateTechnicalInfo() {
        // Статус приложения
        const statusElement = document.getElementById('tech-status');
        if (statusElement) {
            statusElement.textContent = this.isOnline ? '🟢 Онлайн' : '🔴 Оффлайн';
            if (!this.isOnline) {
                statusElement.textContent += ' (кеширован)';
            }
        }
        
        // Использование памяти (если доступно)
        const memoryElement = document.getElementById('tech-memory');
        if (memoryElement && performance.memory) {
            const usedMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
            const totalMB = Math.round(performance.memory.totalJSHeapSize / 1048576);
            memoryElement.textContent = `${usedMB} / ${totalMB} MB`;
        } else if (memoryElement) {
            memoryElement.textContent = 'Недоступно';
        }
    }
    
    /**
     * Показ благодарностей
     */
    showCredits() {
        // Проверяем доступность Bootstrap Modal
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modalElement = document.getElementById('creditsModal');
            if (modalElement) {
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            } else {
                this.showNotification('Модальное окно не найдено', 'warning');
            }
        } else {
            this.showNotification('Bootstrap не загружен', 'warning');
        }
    }
    
    /**
     * Показ уведомления
     */
    showNotification(message, type = 'info') {
        // Используем уведомление основного приложения, если доступно
        if (window.app && window.app.showNotification) {
            window.app.showNotification(message, type);
            return;
        }
        
        // Или создаём своё
        const alertClass = {
            success: 'alert-success',
            error: 'alert-danger',
            info: 'alert-info',
            warning: 'alert-warning'
        }[type] || 'alert-info';
        
        const alertHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show position-fixed bottom-0 end-0 m-3" 
                 style="z-index: 1050; max-width: 300px;">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', alertHTML);
        
        setTimeout(() => {
            const alert = document.querySelector('.alert');
            if (alert) alert.remove();
        }, 3000);
    }
    
    /**
     * Обновление статистики (вызвать извне при новом расчёте)
     */
    refreshStats() {
        this.loadStats();
    }
    
    /**
     * Получение текущей темы
     */
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }
    
    /**
     * Установка темы
     */
    setTheme(theme) {
        if (['light', 'dark'].includes(theme)) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('dreamcalc-theme', theme);
        }
    }
}

// Экспортируем экземпляр модуля
const footerModule = new FooterModule();

// Делаем доступным глобально
window.FooterModule = footerModule;

// Инициализация после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        footerModule.initAfterDOM();
    });
} else {
    footerModule.initAfterDOM();
}

// Экспорт для ES6 модулей
export default footerModule;