/**
 * Данные для целей DreamCalc
 */

export const dreams = [
    { type: 'phone', icon: '📱', name: 'Телефон', hint: 'от 500 сомони', basePrice: 1500 },
    { type: 'laptop', icon: '💻', name: 'Ноутбук', hint: 'от 2 000 сомони', basePrice: 5000 },
    { type: 'tablet', icon: '📱', name: 'Планшет', hint: 'от 1 000 сомони', basePrice: 2500 },
    { type: 'bike', icon: '🚲', name: 'Велосипед', hint: 'от 1 500 сомони', basePrice: 3000 },
    { type: 'motorcycle', icon: '🏍️', name: 'Мотоцикл', hint: 'от 10 000 сомони', basePrice: 20000 },
    { type: 'car', icon: '🚗', name: 'Автомобиль', hint: 'от 50 000 сомони', basePrice: 100000 },
    { type: 'apartment', icon: '🏢', name: 'Квартира', hint: 'от 200 000 сомони', basePrice: 300000 },
    { type: 'house', icon: '🏠', name: 'Дом', hint: 'от 500 000 сомони', basePrice: 800000 },
    { type: 'land', icon: '🌳', name: 'Земельный участок', hint: 'от 100 000 сомони', basePrice: 150000 },
    { type: 'education', icon: '🎓', name: 'Обучение', hint: 'курсы/университет', basePrice: 50000 },
    { type: 'travel', icon: '✈️', name: 'Путешествие', hint: 'тур/отдых', basePrice: 30000 },
    { type: 'custom', icon: '✨', name: 'Другое', hint: 'своя цель', basePrice: 50000 }
];

/**
 * Получает цель по типу
 * @param {string} type - Тип цели
 * @returns {Object} Объект цели
 */
export function getDreamByType(type) {
    return dreams.find(dream => dream.type === type) || dreams[dreams.length - 1];
}