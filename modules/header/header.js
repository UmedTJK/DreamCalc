/**
 * Модуль хедера для DreamCalc
 * Упрощенная версия: только тема, PWA и статистика
 * Версия: 2.1.0 (упрощенная)
 */

class HeaderModule {
    constructor() {
        this.version = '2.1.0';
        this.isOnline = navigator.onLine;
        this.deferredPrompt = null;
        this.bannerVisible = true;
        this.stats = {
            totalCalculations: 0,
            mostCommonGoal: '—',
            totalAmount: 0
        };
        
        // Инициализация
        this.init();
    }
    
    /**
     * Инициализация модуля
     */
    init() {
        this.bindEvents();
        this.updateOnlineStatus();
        this.setupInstallPrompt();
        this.updateStats();
        this.syncTheme();
        
        // Обновляем статистику каждые 30 секунд
        setInterval(() => this.updateStats(), 30000);
        
        console.log(`HeaderModule v${this.version} инициализирован (упрощенный)`);
    }
    
    /**
     * Инициализация после загрузки DOM
     */
    initAfterDOM() {
        setTimeout(() => {
            this.bindEvents();
            this.updateOnlineStatus();
            this.updateStatsDisplay();
            
            // Восстанавливаем состояние баннера
            const bannerState = localStorage.getItem('dreamcalc-banner-visible');
            if (bannerState !== null) {
                this.bannerVisible = bannerState === 'true';
                this.updateBannerVisibility();
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
        document.addEventListener('theme-change', (e) => {
            this.updateThemeIcon(e.detail.theme);
        });
        
        // Кнопка темы в хедере
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        }
        
        // Кнопка темы в дропдауне
        const dropdownThemeToggle = document.getElementById('dropdown-theme-toggle');
        if (dropdownThemeToggle) {
            dropdownThemeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
        }
        
        // Кнопка установки PWA в хедере
        const installBtn = document.getElementById('install-button');
        if (installBtn) {
            installBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.installPWA();
            });
        }
        
        // Кнопка установки PWA в дропдауне
        const dropdownInstallPWA = document.getElementById('dropdown-install-pwa');
        if (dropdownInstallPWA) {
            dropdownInstallPWA.addEventListener('click', (e) => {
                e.preventDefault();
                this.installPWA();
            });
        }
    }
    
    /**
     * Обновление статистики
     */
    async updateStats() {
        try {
            // Загружаем из localStorage напрямую
            const history = JSON.parse(localStorage.getItem('dreamcalc_history') || '[]');
            
            if (history.length > 0) {
                // Считаем самую частую цель
                const goalCounts = {};
                history.forEach(item => {
                    if (item.dreamName) {
                        goalCounts[item.dreamName] = (goalCounts[item.dreamName] || 0) + 1;
                    }
                });
                
                const mostCommonGoal = Object.entries(goalCounts)
                    .sort(([,a], [,b]) => b - a)[0]?.[0] || '—';
                
                // Суммарная стоимость
                const totalAmount = history.reduce(
                    (sum, item) => sum + (item.calculationData?.totalCost || 0), 0
                );
                
                this.stats = {
                    totalCalculations: history.length,
                    mostCommonGoal,
                    totalAmount
                };
                
                this.updateStatsDisplay();
            } else {
                // Нет истории
                this.stats = {
                    totalCalculations: 0,
                    mostCommonGoal: '—',
                    totalAmount: 0
                };
                this.updateStatsDisplay();
            }
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
            this.stats = {
                totalCalculations: 0,
                mostCommonGoal: '—',
                totalAmount: 0
            };
            this.updateStatsDisplay();
        }
    }
    
    /**
     * Обновление отображения статистики
     */
    updateStatsDisplay() {
        // Обновляем баннер
        const totalCalculationsEl = document.getElementById('total-calculations');
        const mostCommonGoalEl = document.getElementById('most-common-goal');
        const totalAmountEl = document.getElementById('total-amount');
        
        if (totalCalculationsEl) {
            totalCalculationsEl.textContent = this.stats.totalCalculations;
        }
        
        if (mostCommonGoalEl) {
            mostCommonGoalEl.textContent = this.stats.mostCommonGoal;
        }
        
        if (totalAmountEl) {
            totalAmountEl.textContent = new Intl.NumberFormat('ru-RU').format(
                Math.round(this.stats.totalAmount)
            );
        }
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
            setTimeout(() => this.updateStats(), 1000);
        } else {
            this.showNotification('📴 Работаем в оффлайн-режиме', 'warning');
        }
    }
    
    /**
     * Обновление статуса онлайн/оффлайн
     */
    updateOnlineStatus() {
        const statusElement = document.getElementById('header-status');
        if (!statusElement) return;
        
        const indicator = statusElement.querySelector('.status-indicator');
        
        if (this.isOnline) {
            indicator.className = 'status-indicator online';
            statusElement.title = 'Онлайн';
        } else {
            indicator.className = 'status-indicator offline';
            statusElement.title = 'Оффлайн';
        }
    }
    
    /**
     * Настройка подсказки установки PWA
     */
    setupInstallPrompt() {
        const installBtn = document.getElementById('install-button');
        const pwaStatus = document.getElementById('header-pwa-status');
        
        if (!installBtn || !pwaStatus) return;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            
            // Показываем кнопку установки
            installBtn.style.display = 'flex';
            installBtn.classList.add('pulse-animation');
            
            // Обновляем статус PWA
            pwaStatus.title = 'Доступно для установки';
        });
        
        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            installBtn.style.display = 'none';
            
            // Обновляем статус PWA
            pwaStatus.title = 'Приложение установлено';
            pwaStatus.innerHTML = '📱 ✓';
            
            this.showNotification('🎉 Приложение установлено!', 'success');
        });
        
        // Проверяем, установлено ли уже приложение
        if (window.matchMedia('(display-mode: standalone)').matches) {
            installBtn.style.display = 'none';
            pwaStatus.title = 'Приложение установлено';
            pwaStatus.innerHTML = '📱 ✓';
        }
    }
    
    /**
     * Установка PWA
     */
    async installPWA() {
        if (!this.deferredPrompt) {
            this.showNotification('Установка PWA недоступна в этом браузере', 'warning');
            return;
        }
        
        try {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('Пользователь принял установку PWA');
            } else {
                console.log('Пользователь отклонил установку PWA');
            }
        } catch (error) {
            console.error('Ошибка установки PWA:', error);
            this.showNotification('Ошибка при установке', 'error');
        }
        
        this.deferredPrompt = null;
    }
    
    /**
     * Переключение темы
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Устанавливаем тему
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('dreamcalc-theme', newTheme);
        
        // Обновляем иконку
        this.updateThemeIcon(newTheme);
        
        // Показываем уведомление
        const themeName = newTheme === 'dark' ? '🌙 Тёмная' : '☀️ Светлая';
        this.showNotification(`${themeName} тема активирована`, 'info');
    }
    
    /**
     * Обновление иконки темы
     */
    updateThemeIcon(theme) {
        const themeIcon = document.getElementById('theme-icon');
        const dropdownThemeIcon = document.getElementById('dropdown-theme-toggle')?.querySelector('i');
        
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
        
        if (dropdownThemeIcon) {
            dropdownThemeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
            const textElement = dropdownThemeIcon.nextSibling;
            if (textElement && textElement.nodeType === Node.TEXT_NODE) {
                textElement.textContent = theme === 'dark' ? ' Светлая тема' : ' Тёмная тема';
            }
        }
    }
    
    /**
     * Синхронизация темы с футером
     */
    syncTheme() {
        const savedTheme = localStorage.getItem('dreamcalc-theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            this.updateThemeIcon(savedTheme);
        }
    }
    
    /**
     * Переключение видимости баннера (оставляем на случай если понадобится)
     */
    toggleBanner() {
        this.bannerVisible = !this.bannerVisible;
        this.updateBannerVisibility();
        
        // Сохраняем состояние
        localStorage.setItem('dreamcalc-banner-visible', this.bannerVisible);
        
        // Показываем уведомление
        const action = this.bannerVisible ? 'показан' : 'скрыт';
        this.showNotification(`Баннер ${action}`, 'info');
    }
    
    /**
     * Обновление видимости баннера
     */
    updateBannerVisibility() {
        const banner = document.getElementById('header-banner');
        if (banner) {
            banner.style.display = this.bannerVisible ? 'block' : 'none';
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
            <div class="alert ${alertClass} alert-dismissible fade show position-fixed top-0 end-0 m-3" 
                 style="z-index: 1060; max-width: 300px;">
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
     * Обновление статистики (вызвать извне)
     */
    refreshStats() {
        this.updateStats();
    }
}

// Экспортируем экземпляр модуля
const headerModule = new HeaderModule();

// Делаем доступным глобально
window.HeaderModule = headerModule;
window.headerModule = headerModule; // Алиас для обратной совместимости

// Инициализация после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        headerModule.initAfterDOM();
    });
} else {
    headerModule.initAfterDOM();
}

// Экспорт для ES6 модулей
export default headerModule;