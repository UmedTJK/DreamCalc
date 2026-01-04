/**
 * Модуль для работы с LocalStorage в DreamCalc
 * Управление историей расчётов и сохранёнными данными
 */

import { debugLog } from './utils.js';

const STORAGE_KEY = 'dreamcalc_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * Класс для управления локальным хранилищем
 */
export class StorageManager {
    constructor() {
        this.history = this.loadHistory();
        debugLog('StorageManager initialized', 'log');
    }

    /**
     * Загружает историю из LocalStorage
     * @returns {Array} Массив сохранённых расчётов
     */
    loadHistory() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            debugLog(`Ошибка загрузки истории: ${error.message}`, 'error');
            return [];
        }
    }

    /**
     * Сохраняет расчёт в историю
     * @param {Object} calculationData - Данные расчёта
     * @param {Object} results - Результаты расчёта
     * @returns {Object} Сохранённая запись
     */
    saveCalculation(calculationData, results) {
        const calculation = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('ru-RU'),
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            dreamName: calculationData.dreamName || 'Моя цель',
            calculationData: {
                totalCost: calculationData.totalCost,
                initialAmount: calculationData.initialAmount,
                monthlySave: calculationData.monthlySave
            },
            results: {
                months: results.months,
                years: results.years,
                goalDate: results.goalDate,
                totalSaved: results.totalSaved
            }
        };

        // Добавляем в начало массива (новые сверху)
        this.history.unshift(calculation);

        // Ограничиваем количество записей
        if (this.history.length > MAX_HISTORY_ITEMS) {
            this.history = this.history.slice(0, MAX_HISTORY_ITEMS);
        }

        // Сохраняем в LocalStorage
        this.persistHistory();

        debugLog(`Расчёт сохранён: ${calculation.dreamName}`, 'log');
        return calculation;
    }

    /**
     * Сохраняет историю в LocalStorage
     */
    persistHistory() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
        } catch (error) {
            debugLog(`Ошибка сохранения истории: ${error.message}`, 'error');
        }
    }

    /**
     * Возвращает всю историю
     * @returns {Array} Массив расчётов
     */
    getHistory() {
        return this.history;
    }

    /**
     * Возвращает количество сохранённых расчётов
     * @returns {number}
     */
    getHistoryCount() {
        return this.history.length;
    }

    /**
     * Очищает всю историю
     */
    clearHistory() {
        this.history = [];
        localStorage.removeItem(STORAGE_KEY);
        debugLog('История очищена', 'log');
    }

    /**
     * Удаляет конкретный расчёт по ID
     * @param {string} id - ID расчёта
     */
    removeCalculation(id) {
        this.history = this.history.filter(item => item.id !== id);
        this.persistHistory();
        debugLog(`Расчёт ${id} удалён`, 'log');
    }

    /**
     * Экспортирует историю в JSON
     * @returns {string} JSON строка
     */
    exportHistory() {
        return JSON.stringify({
            exportDate: new Date().toISOString(),
            app: 'DreamCalc',
            version: '1.0',
            history: this.history
        }, null, 2);
    }

    /**
     * Импортирует историю из JSON
     * @param {string} json - JSON строка
     * @returns {boolean} Успех операции
     */
    importHistory(json) {
        try {
            const data = JSON.parse(json);
            
            // Базовая валидация
            if (!data.history || !Array.isArray(data.history)) {
                throw new Error('Неверный формат истории');
            }

            this.history = data.history.slice(0, MAX_HISTORY_ITEMS);
            this.persistHistory();
            
            debugLog(`Импортировано ${this.history.length} расчётов`, 'log');
            return true;
        } catch (error) {
            debugLog(`Ошибка импорта: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Получает статистику по истории
     * @returns {Object} Статистика
     */
    getStatistics() {
        if (this.history.length === 0) {
            return {
                totalCalculations: 0,
                mostCommonGoal: '—',
                totalAmount: 0,
                averageTime: 0
            };
        }

        // Считаем самую частую цель
        const goalCounts = {};
        this.history.forEach(item => {
            goalCounts[item.dreamName] = (goalCounts[item.dreamName] || 0) + 1;
        });

        const mostCommonGoal = Object.entries(goalCounts)
            .sort(([,a], [,b]) => b - a)[0][0];

        // Суммарная стоимость всех целей
        const totalAmount = this.history.reduce(
            (sum, item) => sum + item.calculationData.totalCost, 0
        );

        // Среднее время достижения
        const averageTime = Math.round(
            this.history.reduce((sum, item) => sum + item.results.months, 0) / this.history.length
        );

        return {
            totalCalculations: this.history.length,
            mostCommonGoal,
            totalAmount,
            averageTime,
            lastCalculation: this.history[0]?.date || '—'
        };
    }
}

// Экспортируем экземпляр по умолчанию
export const storageManager = new StorageManager();
