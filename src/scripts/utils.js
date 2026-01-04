/**
 * Утилиты для DreamCalc
 */

/**
 * Форматирует число в читаемый вид с разделителями
 * @param {number} num - Число для форматирования
 * @param {string} currency - Валюта (по умолчанию 'TJS')
 * @returns {string} Отформатированная строка
 */
export function formatCurrency(num, currency = 'TJS') {
    return new Intl.NumberFormat('ru-RU').format(Math.round(num)) + ' ' + currency;
}

/**
 * Рассчитывает дату достижения цели
 * @param {number} months - Количество месяцев
 * @returns {string} Форматированная дата
 */
export function calculateGoalDate(months) {
    const today = new Date();
    const goalDate = new Date(today);
    goalDate.setMonth(today.getMonth() + months);
    
    return goalDate.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Валидирует ввод пользователя
 * @param {Object} data - Данные для валидации
 * @returns {string|null} Сообщение об ошибке или null
 */
export function validateInput(data) {
    if (!data.type) return 'Выберите цель';
    if (data.totalCost <= 0) return 'Введите стоимость цели';
    if (data.monthlySave <= 0) return 'Введите сумму ежемесячных накоплений';
    if (data.initialAmount < 0) return 'Накопления не могут быть отрицательными';
    return null;
}

/**
 * Логирование в консоль с префиксом
 * @param {string} message - Сообщение
 * @param {string} type - Тип ('log', 'warn', 'error')
 */
export function debugLog(message, type = 'log') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[DreamCalc ${timestamp}]`;
    
    console[type](`${prefix} ${message}`);
}