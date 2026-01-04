/**
 * Главный модуль DreamCalc
 * Инициализация приложения, управление состоянием и событиями
 */

// Импортируем все необходимые модули
import { storageManager } from './storage.js';
import { calculator, quickCalculate, formatResults } from './calculator.js';
import { renderDreamGrid, renderInputForm } from './uiComponents.js';
import { getDreamByType, dreams } from './dreamData.js';
import { validateInput, debugLog, formatCurrency } from './utils.js';
import { chartManager } from './charts.js';

/**
 * Класс главного приложения
 */
class DreamCalcApp {
    constructor() {
        // Состояние приложения
        this.state = {
            selectedDream: null,
            dreamType: null,
            formData: {
                totalCost: 0,
                initialAmount: 0,
                monthlySave: 0
            },
            results: null,
            isLoading: false
        };
        
        // Менеджер хранилища
        this.storageManager = storageManager;
        
        // Менеджер графиков
        this.chartManager = chartManager;
        
        // Ссылки на DOM-элементы
        this.elements = {
            mainContent: null,
            dreamGridContainer: null,
            inputFormContainer: null,
            customNameInput: null,
            resultsContainer: null
        };
        
        // Инициализация при запуске
        this.init();
    }
    
    /**
     * Инициализация приложения
     */
    init() {
        debugLog('Инициализация DreamCalc', 'log');
        
        // Находим основные элементы
        this.findElements();
        
        // Рендерим начальный интерфейс
        this.renderInitialUI();
        
        // Устанавливаем обработчики событий
        this.setupEventListeners();
        
        // Автоматический выбор тестовой цели
        this.selectDream('car');
        
        debugLog('Приложение готово к работе', 'log');
    }
    
    /**
     * Находим и сохраняем ссылки на DOM-элементы
     */
    findElements() {
        this.elements.mainContent = document.getElementById('main-content');
        this.elements.resultsContainer = document.createElement('div');
        this.elements.resultsContainer.id = 'results-container';
        
        debugLog('DOM-элементы найдены', 'log');
    }
    
    /**
     * Рендерим начальный интерфейс
     */
    renderInitialUI() {
        const { mainContent } = this.elements;
        
        // Создаём структуру приложения
        mainContent.innerHTML = `
            <div class="row">
                <!-- Левая колонка: выбор цели -->
                <div class="col-lg-6 mb-4">
                    <div class="card shadow-sm h-100">
                        <div class="card-body">
                            <h2 class="card-title h4 mb-4">1. Выберите цель</h2>
                            <div id="dream-grid-container"></div>
                            
                            <div class="mt-4" id="custom-name-section" style="display: none;">
                                <label for="custom-dream-name" class="form-label">
                                    Название своей цели
                                </label>
                                <input type="text" 
                                       class="form-control dream-input" 
                                       id="custom-dream-name"
                                       placeholder="Например: Поездка в Японию">
                                <div class="form-text">Введите название своей цели</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Правая колонка: параметры -->
                <div class="col-lg-6 mb-4">
                    <div class="card shadow-sm h-100">
                        <div class="card-body">
                            <h2 class="card-title h4 mb-4">2. Параметры накоплений</h2>
                            <div id="input-form-container"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Результаты (будет показано после расчёта) -->
            <div class="row mt-4">
                <div class="col-12">
                    <div id="results-placeholder"></div>
                </div>
            </div>

            <div class="d-flex gap-2 justify-content-center mt-3">
                <button class="btn btn-outline-secondary" onclick="app.showHistory()">
                    📊 История расчётов
                </button>
            </div>

            <!-- Контейнер для истории -->
            <div id="history-container" style="display: none;"></div>
        `;
        
        // Сохраняем ссылки на контейнеры
        this.elements.dreamGridContainer = document.getElementById('dream-grid-container');
        this.elements.inputFormContainer = document.getElementById('input-form-container');
        this.elements.customNameInput = document.getElementById('custom-dream-name');
        this.elements.resultsPlaceholder = document.getElementById('results-placeholder');
        
        // Рендерим компоненты
        this.renderDreamGrid();
        this.renderInputForm();
    }
    
    /**
     * Рендерим сетку целей
     */
    renderDreamGrid() {
        renderDreamGrid(
            this.elements.dreamGridContainer,
            (type) => this.selectDream(type)
        );
    }
    
    /**
     * Рендерим форму ввода
     */
    renderInputForm() {
        const formElements = renderInputForm(
            this.elements.inputFormContainer,
            this.state.formData
        );
        
        // Сохраняем ссылку на форму
        this.elements.form = formElements.form;
        this.elements.totalCostInput = formElements.totalCost;
        this.elements.initialAmountInput = formElements.initialAmount;
        this.elements.monthlySaveInput = formElements.monthlySave;
    }
    
    /**
     * Устанавливаем обработчики событий
     */
    setupEventListeners() {
        // Обработчик отправки формы
        if (this.elements.form) {
            this.elements.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCalculate();
            });
        }
        
        // Обработчик изменения поля своей цели
        if (this.elements.customNameInput) {
            this.elements.customNameInput.addEventListener('input', (e) => {
                this.state.selectedDream = e.target.value || this.state.selectedDream;
            });
        }
        
        // Дебаг-кнопка (только для разработки)
        this.setupDebugControls();
    }
    
    /**
     * Выбор цели
     * @param {string} type - Тип цели
     */
    selectDream(type) {
        const dream = getDreamByType(type);
        
        // Обновляем состояние
        this.state.dreamType = type;
        this.state.selectedDream = dream.name;
        
        // Если выбрано "Другое", показываем поле для ввода названия
        const customSection = document.getElementById('custom-name-section');
        if (customSection) {
            customSection.style.display = type === 'custom' ? 'block' : 'none';
        }
        
        // Сбрасываем выделение у всех карточек
        document.querySelectorAll('.dream-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Выделяем выбранную карточку
        const selectedCard = document.querySelector(`.dream-card[data-type="${type}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
        
        // Автозаполняем поля формы примерными значениями
        this.autofillForm(dream.basePrice);
        
        debugLog(`Выбрана цель: ${dream.name}`, 'log');
    }
    
    /**
     * Автозаполнение формы примерными значениями
     * @param {number} basePrice - Базовая цена цели
     */
    autofillForm(basePrice) {
        if (!basePrice || basePrice <= 0) return;
        
        const formData = {
            totalCost: basePrice,
            initialAmount: Math.floor(basePrice * 0.2), // 20% уже есть
            monthlySave: Math.floor(basePrice * 0.05)  // 5% в месяц
        };
        
        // Обновляем состояние
        this.state.formData = formData;
        
        // Обновляем поля ввода, если они существуют
        if (this.elements.totalCostInput) {
            this.elements.totalCostInput.value = formData.totalCost;
        }
        if (this.elements.initialAmountInput) {
            this.elements.initialAmountInput.value = formData.initialAmount;
        }
        if (this.elements.monthlySaveInput) {
            this.elements.monthlySaveInput.value = formData.monthlySave;
        }
    }
    
    /**
     * Обработчик расчёта
     */
    handleCalculate() {
        // Собираем данные из формы
        const formData = {
            totalCost: parseFloat(this.elements.totalCostInput.value) || 0,
            initialAmount: parseFloat(this.elements.initialAmountInput.value) || 0,
            monthlySave: parseFloat(this.elements.monthlySaveInput.value) || 0
        };
        
        // Обновляем состояние
        this.state.formData = formData;
        
        // Если выбрано "Другое", берём название из поля
        if (this.state.dreamType === 'custom' && this.elements.customNameInput) {
            this.state.selectedDream = this.elements.customNameInput.value || 'Моя цель';
        }
        
        // Валидация
        const validationError = validateInput({
            type: this.state.dreamType,
            ...formData
        });
        
        if (validationError) {
            this.showError(validationError);
            return;
        }
        
        // Показываем загрузку
        this.setState({ isLoading: true });
        
        // Имитируем задержку для лучшего UX (можно убрать в продакшене)
        setTimeout(() => {
            // Выполняем расчёт
            this.calculatePlan(formData);
            
            // Скрываем загрузку
            this.setState({ isLoading: false });
        }, 300);
    }
    
    /**
     * Выполнение расчёта
     * @param {Object} formData - Данные из формы
     */
    calculatePlan(formData) {
        try {
            // Используем наш калькулятор
            const results = calculator.calculatePlan(formData);
            
            // Подготовка данных для сохранения
            const calculationData = {
                dreamName: this.state.selectedDream,
                totalCost: formData.totalCost,
                initialAmount: formData.initialAmount,
                monthlySave: formData.monthlySave
            };

            // Сохраняем в историю
            this.storageManager.saveCalculation(calculationData, results);

            // Форматируем результаты для отображения
            const formattedResults = formatResults({
                ...results,
                dreamName: this.state.selectedDream,
                formData: this.state.formData
            });
            
            // Обновляем состояние
            this.setState({ 
                results: formattedResults 
            });
            
            // Рендерим результаты
            this.renderResults(formattedResults);
            
            debugLog(`Рассчитан план: ${results.months} месяцев`, 'log');
            
        } catch (error) {
            debugLog(`Ошибка расчёта: ${error.message}`, 'error');
            this.showError('Произошла ошибка при расчёте. Проверьте введённые данные.');
        }
    }
    
    /**
     * Рендерим результаты расчёта
     * @param {Object} results - Результаты расчёта
     */
    renderResults(results) {
        const { resultsPlaceholder } = this.elements;
        
        // Форматируем дату для отображения
        const goalDate = results.goalDate === 'Сегодня!' 
            ? '<span class="text-success fw-bold">Сегодня!</span>'
            : `<strong class="text-primary">${results.goalDate}</strong>`;
        
        const resultsHTML = `
            <div class="card shadow-lg border-success results-card">
                <div class="card-header bg-success text-white">
                    <h3 class="card-title mb-0">📅 Ваш план накоплений</h3>
                </div>
                
                <div class="card-body">
                    <!-- Основная информация -->
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <h4>${results.dreamName}</h4>
                            <p class="text-muted">
                                Стоимость: <strong>${formatCurrency(results.formData.totalCost)}</strong><br>
                                Уже есть: <strong>${formatCurrency(results.formData.initialAmount)}</strong><br>
                                Откладываю в месяц: <strong>${formatCurrency(results.formData.monthlySave)}</strong>
                            </p>
                        </div>
                        
                        <div class="col-md-6">
                            <div class="alert alert-info">
                                <strong>📅 Дата достижения:</strong><br>
                                ${goalDate}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Ключевые метрики -->
                    <div class="row g-3 mb-4">
                        <div class="col-md-3 col-6">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <div class="h5 text-muted">Месяцев</div>
                                    <div class="display-6 fw-bold text-primary">${results.months}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 col-6">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <div class="h5 text-muted">Лет</div>
                                    <div class="display-6 fw-bold text-primary">${results.years}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 col-6">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <div class="h5 text-muted">Итого накоплю</div>
                                    <div class="h4 fw-bold text-success">${results.formattedTotalSaved}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-3 col-6">
                            <div class="card bg-light">
                                <div class="card-body text-center">
                                    <div class="h5 text-muted">Сверх цели</div>
                                    <div class="h4 fw-bold text-warning">${results.formattedExtraSaved}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- График прогресса -->
                    <div class="card mt-4">
                        <div class="card-body">
                            <div style="position: relative; height: 300px;">
                                <canvas id="savings-chart"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Дополнительные графики -->
                    <div class="row mt-3">
                        <div class="col-md-6">
                            <div class="card h-100">
                                <div class="card-body">
                                    <div style="position: relative; height: 250px;">
                                        <canvas id="distribution-chart"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ${results.analysis.scenarios && results.analysis.scenarios.length > 0 ? `
                        <div class="col-md-6">
                            <div class="card h-100">
                                <div class="card-body">
                                    <div style="position: relative; height: 250px;">
                                        <canvas id="scenarios-chart"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <!-- Анализ и советы -->
                    ${results.analysis ? `
                    <div class="alert alert-warning">
                        <h5 class="alert-heading">💡 ${results.analysis.message}</h5>
                        ${results.analysis.tips && results.analysis.tips.length > 0 ? `
                        <hr>
                        <ul class="mb-0">
                            ${results.analysis.tips.map(tip => `<li>${tip}</li>`).join('')}
                        </ul>
                        ` : ''}
                    </div>
                    ` : ''}
                    
                    <!-- Альтернативные сценарии -->
                    ${results.analysis.scenarios && results.analysis.scenarios.length > 0 ? `
                    <div class="mt-4">
                        <h5>🚀 Альтернативные сценарии:</h5>
                        <div class="row g-3">
                            ${results.analysis.scenarios.map((scenario, index) => `
                            <div class="col-lg-4 col-md-6">
                                <div class="card h-100">
                                    <div class="card-body">
                                        <h6 class="card-title">${scenario.title}</h6>
                                        <p class="card-text">${scenario.description}</p>
                                        ${scenario.newMonthly ? `
                                        <small class="text-muted">
                                            Новый платёж: ${formatCurrency(scenario.newMonthly)}
                                        </small>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <!-- Кнопки действий -->
                    <div class="d-flex gap-2 justify-content-center mt-4">
                        <button class="btn btn-outline-primary" onclick="app.recalculate()">
                            🔄 Пересчитать
                        </button>
                        <button class="btn btn-success" onclick="app.shareResults()">
                            📤 Поделиться
                        </button>
                        <button class="btn btn-outline-info" onclick="app.exportChart()">
                            📊 Экспорт графика
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        resultsPlaceholder.innerHTML = resultsHTML;
        
        // Прокручиваем к результатам
        resultsPlaceholder.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });

        // Создаём графики
        setTimeout(() => {
            // Основной график накоплений
            const savingsCanvas = document.getElementById('savings-chart');
            if (savingsCanvas) {
                this.chartManager.createSavingsChart(
                    savingsCanvas,
                    results.formData,
                    results
                );
            }

            // Круговая диаграмма распределения
            const distributionCanvas = document.getElementById('distribution-chart');
            if (distributionCanvas) {
                this.chartManager.createDistributionChart(
                    distributionCanvas,
                    results.formData
                );
            }

            // График сценариев (если есть)
            if (results.analysis.scenarios && results.analysis.scenarios.length > 0) {
                const scenariosCanvas = document.getElementById('scenarios-chart');
                if (scenariosCanvas) {
                    this.chartManager.createScenariosChart(
                        scenariosCanvas,
                        results.analysis.scenarios
                    );
                }
            }
        }, 100);
    }
    
    /**
     * Показывает ошибку
     * @param {string} message - Сообщение об ошибке
     */
    showError(message) {
        const alertHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>⚠️ Ошибка:</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Вставляем ошибку перед формой
        this.elements.inputFormContainer.insertAdjacentHTML('afterbegin', alertHTML);
        
        // Автоматически скрываем через 5 секунд
        setTimeout(() => {
            const alert = this.elements.inputFormContainer.querySelector('.alert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
        
        debugLog(`Ошибка: ${message}`, 'warn');
    }
    
    /**
     * Обновление состояния приложения
     * @param {Object} newState - Новые значения состояния
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
    }

    /**
     * Экспортирует график как изображение
     */
    exportChart() {
        const imageUrl = this.chartManager.exportAsImage();
        
        if (!imageUrl) {
            this.showNotification('Нет графика для экспорта', 'warning');
            return;
        }
        
        // Создаём временную ссылку для скачивания
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = `dreamcalc_chart_${new Date().toISOString().slice(0,10)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        this.showNotification('График экспортирован как PNG', 'success');
    }

    /**
     * Показывает историю расчётов
     */
    showHistory() {
        const history = this.storageManager.getHistory();
        const stats = this.storageManager.getStatistics();
        
        if (history.length === 0) {
            this.showNotification('История расчётов пуста', 'info');
            return;
        }

        const historyHTML = `
            <div class="card shadow-sm mt-4">
                <div class="card-header bg-light">
                    <h5 class="card-title mb-0">📊 История расчётов</h5>
                </div>
                <div class="card-body">
                    <!-- Статистика -->
                    <div class="row mb-3">
                        <div class="col-md-3 col-6">
                            <div class="card bg-info bg-opacity-10">
                                <div class="card-body text-center p-2">
                                    <div class="h6 text-muted">Всего расчётов</div>
                                    <div class="h4 fw-bold">${stats.totalCalculations}</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 col-6">
                            <div class="card bg-info bg-opacity-10">
                                <div class="card-body text-center p-2">
                                    <div class="h6 text-muted">Частая цель</div>
                                    <div class="h6 fw-bold">${stats.mostCommonGoal}</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 col-6">
                            <div class="card bg-info bg-opacity-10">
                                <div class="card-body text-center p-2">
                                    <div class="h6 text-muted">Сумма целей</div>
                                    <div class="h6 fw-bold">${formatCurrency(stats.totalAmount)}</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 col-6">
                            <div class="card bg-info bg-opacity-10">
                                <div class="card-body text-center p-2">
                                    <div class="h6 text-muted">Средний срок</div>
                                    <div class="h6 fw-bold">${stats.averageTime} мес.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Таблица истории -->
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Дата</th>
                                    <th>Цель</th>
                                    <th>Стоимость</th>
                                    <th>Срок</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${history.map(item => `
                                    <tr>
                                        <td>
                                            <small>${item.date}</small><br>
                                            <small class="text-muted">${item.time}</small>
                                        </td>
                                        <td>${item.dreamName}</td>
                                        <td>${formatCurrency(item.calculationData.totalCost)}</td>
                                        <td>${item.results.months} мес.</td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-primary" 
                                                    onclick="app.loadCalculation('${item.id}')">
                                                🔄
                                            </button>
                                            <button class="btn btn-sm btn-outline-danger" 
                                                    onclick="app.deleteCalculation('${item.id}')">
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Кнопки управления -->
                    <div class="d-flex gap-2 justify-content-end mt-3">
                        <button class="btn btn-outline-secondary btn-sm" onclick="app.exportHistory()">
                            📥 Экспорт
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="app.clearHistory()">
                            🗑️ Очистить историю
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="app.closeHistory()">
                            ✕ Закрыть
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Вставляем историю в контейнер
        const container = document.getElementById('history-container');
        if (container) {
            container.innerHTML = historyHTML;
            container.style.display = 'block';
        }
    }

    /**
     * Загружает расчёт из истории
     * @param {string} id - ID расчёта
     */
    loadCalculation(id) {
        const history = this.storageManager.getHistory();
        const calculation = history.find(item => item.id === id);
        
        if (calculation) {
            // Заполняем форму
            this.elements.totalCostInput.value = calculation.calculationData.totalCost;
            this.elements.initialAmountInput.value = calculation.calculationData.initialAmount;
            this.elements.monthlySaveInput.value = calculation.calculationData.monthlySave;
            
            // Показываем уведомление
            this.showNotification(`Расчёт "${calculation.dreamName}" загружен`, 'success');
            
            // Прокручиваем к форме
            this.elements.totalCostInput.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * Удаляет расчёт из истории
     * @param {string} id - ID расчёта
     */
    deleteCalculation(id) {
        if (confirm('Удалить этот расчёт из истории?')) {
            this.storageManager.removeCalculation(id);
            this.showHistory(); // Обновляем отображение
            this.showNotification('Расчёт удалён', 'success');
        }
    }

    /**
     * Экспортирует историю
     */
    exportHistory() {
        const data = this.storageManager.exportHistory();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `dreamcalc_history_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        this.showNotification('История экспортирована', 'success');
    }

    /**
     * Очищает историю
     */
    clearHistory() {
        if (confirm('Очистить всю историю расчётов?')) {
            this.storageManager.clearHistory();
            const historyContainer = document.getElementById('history-container');
            if (historyContainer) {
                historyContainer.innerHTML = '';
                historyContainer.style.display = 'none';
            }
            this.showNotification('История очищена', 'success');
        }
    }

    /**
     * Закрывает панель истории
     */
    closeHistory() {
        const historyContainer = document.getElementById('history-container');
        if (historyContainer) {
            historyContainer.style.display = 'none';
        }
    }

    /**
     * Показывает уведомление
     * @param {string} message - Сообщение
     * @param {string} type - Тип (success, error, info, warning)
     */
    showNotification(message, type = 'info') {
        const alertClass = {
            success: 'alert-success',
            error: 'alert-danger',
            info: 'alert-info',
            warning: 'alert-warning'
        }[type] || 'alert-info';

        const alertHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        // Вставляем уведомление в верхней части страницы
        const container = document.querySelector('.container');
        if (container) {
            container.insertAdjacentHTML('afterbegin', alertHTML);
            
            // Автоматически скрываем через 5 секунд
            setTimeout(() => {
                const alert = container.querySelector('.alert');
                if (alert) {
                    alert.remove();
                }
            }, 5000);
        }
    }
    
    /**
     * Настройка дебаг-контролов (только для разработки)
     */
    setupDebugControls() {
        // Добавляем панель дебага в футер
        const debugPanel = document.createElement('div');
        debugPanel.className = 'mt-4 p-3 border rounded bg-light';
        debugPanel.innerHTML = `
            <h6 class="mb-2">🔧 Отладка</h6>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-secondary" onclick="app.printState()">
                    🖨️ Состояние
                </button>
                <button class="btn btn-outline-secondary" onclick="app.resetApp()">
                    🔄 Сброс
                </button>
                <button class="btn btn-outline-secondary" onclick="app.testCalculation()">
                    🧪 Тест
                </button>
            </div>
            <div class="mt-2">
                <small class="text-muted" id="debug-output"></small>
            </div>
        `;
        
        document.querySelector('footer').prepend(debugPanel);
    }
    
    /**
     * Методы для дебага (доступны из консоли)
     */
    printState() {
        console.log('📊 Состояние приложения:', this.state);
        debugLog('Состояние выведено в консоль', 'log');
    }
    
    resetApp() {
        this.state = {
            selectedDream: null,
            dreamType: null,
            formData: {
                totalCost: 0,
                initialAmount: 0,
                monthlySave: 0
            },
            results: null,
            isLoading: false
        };
        
        // Уничтожаем графики
        this.chartManager.destroy();
        
        // Перерендериваем интерфейс
        this.renderDreamGrid();
        this.renderInputForm();
        
        // Очищаем результаты
        this.elements.resultsPlaceholder.innerHTML = '';
        
        // Очищаем историю из UI
        const historyContainer = document.getElementById('history-container');
        if (historyContainer) {
            historyContainer.innerHTML = '';
            historyContainer.style.display = 'none';
        }
        
        debugLog('Приложение сброшено', 'log');
    }
    
    testCalculation() {
        // Тестовый расчёт
        const testData = {
            totalCost: 100000,
            initialAmount: 20000,
            monthlySave: 5000
        };
        
        this.elements.totalCostInput.value = testData.totalCost;
        this.elements.initialAmountInput.value = testData.initialAmount;
        this.elements.monthlySaveInput.value = testData.monthlySave;
        
        this.handleCalculate();
        
        debugLog('Тестовый расчёт выполнен', 'log');
    }
    
    recalculate() {
        // Просто запускаем расчёт с текущими данными
        this.handleCalculate();
    }
    
    shareResults() {
        if (!this.state.results) {
            this.showError('Нет результатов для публикации');
            return;
        }
        
        const text = `Мой план накоплений на DreamCalc:\n` +
                    `Цель: ${this.state.results.dreamName}\n` +
                    `Достигну через: ${this.state.results.months} месяцев\n` +
                    `Дата: ${this.state.results.goalDate}\n` +
                    `Ссылка: ${window.location.href}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Мой план накоплений',
                text: text,
                url: window.location.href
            });
        } else {
            // Копируем в буфер обмена
            navigator.clipboard.writeText(text)
                .then(() => alert('Результаты скопированы в буфер обмена! 📋'))
                .catch(() => alert('Не удалось скопировать результаты'));
        }
        
        debugLog('Результаты отправлены', 'log');
    }
}

// Создаём и экспортируем экземпляр приложения
const app = new DreamCalcApp();

// Делаем приложение глобально доступным для дебага
window.app = app;

// Экспортируем для возможного использования в других модулях
export default app;