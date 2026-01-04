/**
 * Модуль для создания графиков в DreamCalc
 * Визуализация прогресса накоплений
 */

import { debugLog, formatCurrency } from './utils.js';

/**
 * Класс для управления графиками
 */
export class ChartManager {
    constructor() {
        this.chart = null;
        debugLog('ChartManager initialized', 'log');
    }

    /**
     * Создаёт график прогресса накоплений
     * @param {HTMLElement} canvasElement - Canvas элемент
     * @param {Object} calculationData - Данные расчёта
     * @param {Object} results - Результаты расчёта
     * @returns {Chart} Экземпляр графика
     */
    createSavingsChart(canvasElement, calculationData, results) {
        if (!canvasElement) {
            debugLog('Canvas element not found for chart', 'error');
            return null;
        }

        // Очищаем предыдущий график если есть
        if (this.chart) {
            this.chart.destroy();
        }

        // Генерируем данные для графика
        const chartData = this.generateChartData(calculationData, results);

        const ctx = canvasElement.getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    // Линия накоплений (синяя)
                    {
                        label: 'Накопления',
                        data: chartData.savingsData,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#2563eb',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    // Линия цели (зелёная)
                    {
                        label: 'Цель',
                        data: chartData.goalData,
                        borderColor: '#10b981',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0
                    },
                    // Точка достижения (оранжевая)
                    {
                        label: 'Достижение цели',
                        data: chartData.goalPointData,
                        borderColor: '#f59e0b',
                        backgroundColor: '#f59e0b',
                        borderWidth: 0,
                        pointRadius: 8,
                        pointStyle: 'star',
                        showLine: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${formatCurrency(value)}`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: '📈 Прогресс накоплений по месяцам',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: {
                            bottom: 20
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Месяцы',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Сумма (сомони)',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: (value) => formatCurrency(value)
                        },
                        suggestedMin: 0,
                        suggestedMax: calculationData.totalCost * 1.1
                    }
                }
            }
        });

        debugLog('График создан', 'log');
        return this.chart;
    }

    /**
     * Генерирует данные для графика
     * @param {Object} calculationData - Данные расчёта
     * @param {Object} results - Результаты расчёта
     * @returns {Object} Данные для графика
     */
    generateChartData(calculationData, results) {
        const { totalCost, initialAmount, monthlySave } = calculationData;
        const { months } = results;

        // Генерируем месяцы
        const labels = [];
        const savingsData = [];
        const goalData = [];
        const goalPointData = new Array(months + 1).fill(null);

        // Начальная точка
        labels.push('Старт');
        savingsData.push(initialAmount);
        goalData.push(totalCost);
        goalPointData[0] = null;

        // Промежуточные месяцы
        for (let i = 1; i <= months; i++) {
            labels.push(`Месяц ${i}`);
            
            // Накопления на текущий месяц
            const currentSavings = initialAmount + (monthlySave * i);
            savingsData.push(currentSavings > totalCost ? totalCost : currentSavings);
            
            // Линия цели (постоянная)
            goalData.push(totalCost);

            // Точка достижения цели
            if (i === months) {
                goalPointData[i] = totalCost;
            } else {
                goalPointData[i] = null;
            }
        }

        // Добавляем точку "Цель достигнута" если нужно
        if (months === 0) {
            goalPointData[0] = totalCost;
        }

        return {
            labels,
            savingsData,
            goalData,
            goalPointData
        };
    }

    /**
     * Создаёт круговую диаграмму распределения
     * @param {HTMLElement} canvasElement - Canvas элемент
     * @param {Object} calculationData - Данные расчёта
     */
    createDistributionChart(canvasElement, calculationData) {
        if (!canvasElement) return null;

        const { totalCost, initialAmount, monthlySave } = calculationData;
        const remaining = totalCost - initialAmount;
        const months = Math.ceil(remaining / monthlySave);

        const ctx = canvasElement.getContext('2d');
        
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Уже есть', 'Ещё накопить'],
                datasets: [{
                    data: [initialAmount, remaining],
                    backgroundColor: [
                        '#10b981', // зелёный - уже есть
                        '#2563eb'  // синий - ещё накопить
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                size: 13
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.raw;
                                const percentage = ((value / totalCost) * 100).toFixed(1);
                                return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: '📊 Распределение средств',
                        font: {
                            size: 14
                        }
                    }
                }
            }
        });
    }

    /**
     * Создаёт график сравнения сценариев
     * @param {HTMLElement} canvasElement - Canvas элемент
     * @param {Array} scenarios - Массив сценариев
     */
    createScenariosChart(canvasElement, scenarios) {
        if (!canvasElement || !scenarios || scenarios.length === 0) return null;

        const labels = scenarios.map((s, i) => `Сценарий ${i + 1}`);
        const monthsData = scenarios.map(s => s.newMonths || 0);
        const monthlyData = scenarios.map(s => s.newMonthly || 0);

        const ctx = canvasElement.getContext('2d');
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Месяцев до цели',
                        data: monthsData,
                        backgroundColor: 'rgba(37, 99, 235, 0.7)',
                        borderColor: '#2563eb',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Платёж в месяц',
                        data: monthlyData,
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderColor: '#10b981',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Сценарии'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Месяцев'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Платёж (сомони)'
                        },
                        ticks: {
                            callback: (value) => formatCurrency(value)
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label;
                                const value = context.raw;
                                if (label.includes('Платёж')) {
                                    return `${label}: ${formatCurrency(value)}`;
                                }
                                return `${label}: ${value}`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Уничтожает текущий график
     */
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
            debugLog('График уничтожен', 'log');
        }
    }

    /**
     * Обновляет график с новыми данными
     * @param {Object} calculationData - Новые данные расчёта
     * @param {Object} results - Новые результаты
     */
    updateChart(calculationData, results) {
        if (!this.chart) return;

        const chartData = this.generateChartData(calculationData, results);
        
        this.chart.data.labels = chartData.labels;
        this.chart.data.datasets[0].data = chartData.savingsData;
        this.chart.data.datasets[1].data = chartData.goalData;
        this.chart.data.datasets[2].data = chartData.goalPointData;
        
        this.chart.update();
        debugLog('График обновлён', 'log');
    }

    /**
     * Экспортирует график как изображение
     * @returns {string} Data URL изображения
     */
    exportAsImage() {
        if (!this.chart) return null;
        return this.chart.toBase64Image();
    }
}

// Экспортируем экземпляр по умолчанию
export const chartManager = new ChartManager();
