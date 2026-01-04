/**
 * Модуль расчётов для DreamCalc
 * Чистая бизнес-логика без UI-зависимостей
 */

import { calculateGoalDate } from './utils.js';

/**
 * Основной класс калькулятора
 */
export class DreamCalculator {
    constructor() {
        this.currency = 'TJS';
    }

    /**
     * Рассчитывает план накоплений
     * @param {Object} params - Параметры расчёта
     * @param {number} params.totalCost - Общая стоимость цели
     * @param {number} params.initialAmount - Уже накоплено
     * @param {number} params.monthlySave - Ежемесячные отчисления
     * @returns {Object} Результаты расчёта
     */
    calculatePlan(params) {
        const { totalCost, initialAmount, monthlySave } = params;
        
        // Валидация базовых условий
        if (initialAmount >= totalCost) {
            return this.createAlreadyReachedResult(totalCost);
        }
        
        // Основной расчёт
        const remaining = totalCost - initialAmount;
        const months = Math.ceil(remaining / monthlySave);
        const years = (months / 12).toFixed(1);
        
        // Дополнительные метрики
        const goalDate = calculateGoalDate(months);
        const totalSaved = initialAmount + (monthlySave * months);
        const extraSaved = totalSaved - totalCost;
        
        // Анализ и советы
        const analysis = this.analyzePlan(months, monthlySave, totalCost);
        
        return {
            months,
            years,
            goalDate,
            totalSaved,
            extraSaved,
            remaining,
            currency: this.currency,
            analysis,
            isAlreadyReached: false
        };
    }

    /**
     * Создаёт результат для уже достигнутой цели
     * @param {number} totalCost - Стоимость цели
     * @returns {Object} Результат
     */
    createAlreadyReachedResult(totalCost) {
        return {
            months: 0,
            years: 0,
            goalDate: 'Сегодня!',
            totalSaved: totalCost,
            extraSaved: 0,
            remaining: 0,
            currency: this.currency,
            analysis: {
                message: '🎉 Поздравляем! У вас уже достаточно средств для этой цели.',
                tips: ['Рассмотрите более амбициозную цель', 'Можете начать инвестировать эти деньги']
            },
            isAlreadyReached: true
        };
    }

    /**
     * Анализирует план и генерирует советы
     * @param {number} months - Количество месяцев
     * @param {number} monthlySave - Ежемесячные отчисления
     * @param {number} totalCost - Стоимость цели
     * @returns {Object} Анализ и советы
     */
    analyzePlan(months, monthlySave, totalCost) {
        const tips = [];
        let message = '';
        
        // Анализ по времени
        if (months <= 6) {
            message = 'Отличный план! Цель достижима в ближайшее время.';
        } else if (months <= 24) {
            message = 'Хороший темп! Цель будет достигнута в течение 2 лет.';
        } else if (months <= 60) {
            message = 'Долгосрочная цель. Рассмотрите увеличение накоплений для ускорения.';
            tips.push('Увеличьте ежемесячные отчисления на 10-20% для ускорения');
        } else {
            message = 'Очень долгосрочная цель. Рекомендуем пересмотреть параметры.';
            tips.push('Рассмотрите возможность инвестирования для ускорения роста');
            tips.push('Разбейте большую цель на несколько этапов');
        }
        
        // Анализ по сумме отчислений
        const monthlyPercentage = (monthlySave / totalCost) * 100;
        if (monthlyPercentage < 5) {
            tips.push('Ежемесячные отчисления составляют менее 5% от цели — попробуйте увеличить');
        } else if (monthlyPercentage > 30) {
            tips.push('Вы откладываете более 30% от цели — отличная дисциплина!');
        }
        
        // Генерация альтернативных сценариев
        const scenarios = this.generateScenarios(months, monthlySave, totalCost);
        
        return {
            message,
            tips,
            scenarios
        };
    }

    /**
     * Генерирует альтернативные сценарии
     * @param {number} baseMonths - Базовое количество месяцев
     * @param {number} monthlySave - Текущие ежемесячные отчисления
     * @param {number} totalCost - Стоимость цели
     * @returns {Array} Массив сценариев
     */
    generateScenarios(baseMonths, monthlySave, totalCost) {
        const scenarios = [];
        
        // Сценарий 1: +20% к ежемесячным отчислениям
        const increasedSave = monthlySave * 1.2;
        const monthsIncreased = Math.ceil(totalCost / increasedSave);
        const timeSaved = baseMonths - monthsIncreased;
        
        if (timeSaved > 0) {
            scenarios.push({
                title: 'Если увеличить накопления на 20%',
                description: `Сможете достичь цели на ${timeSaved} месяцев раньше`,
                newMonthly: increasedSave,
                newMonths: monthsIncreased
            });
        }
        
        // Сценарий 2: Начальный взнос +50%
        const increasedInitial = totalCost * 0.3; // 30% вместо 20%
        const monthsWithInitial = Math.ceil((totalCost - increasedInitial) / monthlySave);
        const initialTimeSaved = baseMonths - monthsWithInitial;
        
        if (initialTimeSaved > 0) {
            scenarios.push({
                title: 'Если увеличить начальный взнос',
                description: `Добавьте ${Math.round(increasedInitial - (totalCost * 0.2))} ${this.currency} к накоплениям`,
                benefit: `Сэкономите ${initialTimeSaved} месяцев`
            });
        }
        
        // Сценарий 3: Поиск дополнительных доходов
        if (baseMonths > 12) {
            scenarios.push({
                title: 'Поиск дополнительного дохода',
                description: 'Подработка или фриланс могут значительно ускорить процесс',
                suggestion: 'Даже +10% к доходам сократит срок на 1-3 месяца'
            });
        }
        
        return scenarios;
    }

    /**
     * Рассчитывает необходимую сумму ежемесячных отчислений
     * для достижения цели за заданное время
     * @param {number} totalCost - Стоимость цели
     * @param {number} initialAmount - Уже накоплено
     * @param {number} targetMonths - Желаемый срок в месяцах
     * @returns {number} Необходимая ежемесячная сумма
     */
    calculateRequiredMonthlySave(totalCost, initialAmount, targetMonths) {
        if (targetMonths <= 0) {
            throw new Error('Срок должен быть больше 0 месяцев');
        }
        
        const remaining = totalCost - initialAmount;
        if (remaining <= 0) return 0;
        
        return Math.ceil(remaining / targetMonths);
    }

    /**
     * Рассчитывает срок достижения цели с учётом инфляции
     * @param {Object} params - Параметры расчёта
     * @param {number} params.totalCost - Текущая стоимость цели
     * @param {number} params.inflationRate - Годовая инфляция (в процентах)
     * @param {number} params.months - Расчётный срок без инфляции
     * @returns {Object} Скорректированный план
     */
    calculateWithInflation(params) {
        const { totalCost, inflationRate, months, monthlySave } = params;
        
        if (inflationRate <= 0) {
            return this.calculatePlan({ totalCost, initialAmount: 0, monthlySave });
        }
        
        // Конвертируем месячную инфляцию
        const monthlyInflation = inflationRate / 12 / 100;
        
        // Рассчитываем будущую стоимость цели
        let futureCost = totalCost;
        for (let i = 0; i < months; i++) {
            futureCost *= (1 + monthlyInflation);
        }
        
        // Пересчитываем план с учётом будущей стоимости
        const adjustedMonths = Math.ceil(futureCost / monthlySave);
        
        return {
            originalMonths: months,
            adjustedMonths,
            futureCost: Math.round(futureCost),
            monthlyInflation: monthlyInflation * 100,
            currency: this.currency,
            note: `С учётом инфляции ${inflationRate}% годовых`
        };
    }
}

/**
 * Создаём и экспортируем экземпляр калькулятора по умолчанию
 */
export const calculator = new DreamCalculator();

/**
 * Экспортируем утилитарные функции для прямого использования
 */

/**
 * Быстрый расчёт без создания экземпляра класса
 * @param {Object} params - Параметры расчёта
 * @returns {Object} Результаты расчёта
 */
export function quickCalculate(params) {
    const calc = new DreamCalculator();
    return calc.calculatePlan(params);
}

/**
 * Форматирует результаты для отображения
 * @param {Object} results - Результаты расчёта
 * @returns {Object} Отформатированные результаты
 */
export function formatResults(results) {
    return {
        ...results,
        monthsText: `${results.months} ${getMonthWord(results.months)}`,
        yearsText: `${results.years} ${getYearWord(results.years)}`,
        formattedTotalSaved: `${results.totalSaved.toLocaleString('ru-RU')} ${results.currency}`,
        formattedExtraSaved: results.extraSaved > 0 
            ? `+${results.extraSaved.toLocaleString('ru-RU')} ${results.currency}`
            : '—'
    };
}

/**
 * Вспомогательная функция для правильного склонения
 */
function getMonthWord(months) {
    const lastDigit = months % 10;
    const lastTwoDigits = months % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'месяцев';
    if (lastDigit === 1) return 'месяц';
    if (lastDigit >= 2 && lastDigit <= 4) return 'месяца';
    return 'месяцев';
}

function getYearWord(years) {
    const yearNum = parseFloat(years);
    const lastDigit = Math.floor(yearNum) % 10;
    const lastTwoDigits = Math.floor(yearNum) % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'лет';
    if (lastDigit === 1) return 'год';
    if (lastDigit >= 2 && lastDigit <= 4) return 'года';
    return 'лет';
}