/**
 * UI-компоненты для DreamCalc
 */

import { dreams } from './dreamData.js';

/**
 * Рендерит сетку целей
 * @param {HTMLElement} container - Контейнер для вставки
 * @param {Function} onSelect - Колбэк при выборе цели
 */
export function renderDreamGrid(container, onSelect) {
    const html = dreams.map(dream => `
        <div class="col-md-3 col-sm-4 col-6 mb-3">
            <div class="card dream-card text-center p-3 h-100" 
                 data-type="${dream.type}"
                 role="button"
                 tabindex="0">
                <div class="dream-icon">${dream.icon}</div>
                <h5 class="card-title">${dream.name}</h5>
                <p class="card-text text-muted small">${dream.hint}</p>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = `
        <div class="row">
            ${html}
        </div>
    `;
    
    // Добавляем обработчики выбора
    container.querySelectorAll('.dream-card').forEach(card => {
        card.addEventListener('click', () => onSelect(card.dataset.type));
        card.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelect(card.dataset.type);
        });
    });
}

/**
 * Рендерит форму параметров
 * @param {HTMLElement} container - Контейнер для вставки
 * @param {Object} values - Значения полей
 * @returns {Object} Ссылки на элементы ввода
 */
export function renderInputForm(container, values = {}) {
    container.innerHTML = `
        <form id="dream-form">
            <div class="row g-3">
                <div class="col-md-4">
                    <label for="totalCost" class="form-label">Общая стоимость</label>
                    <input type="number" 
                           class="form-control dream-input" 
                           id="totalCost" 
                           value="${values.totalCost || ''}"
                           placeholder="100000"
                           min="1"
                           required>
                </div>
                
                <div class="col-md-4">
                    <label for="initialAmount" class="form-label">Уже есть накоплений</label>
                    <input type="number" 
                           class="form-control dream-input" 
                           id="initialAmount" 
                           value="${values.initialAmount || ''}"
                           placeholder="20000"
                           min="0">
                </div>
                
                <div class="col-md-4">
                    <label for="monthlySave" class="form-label">Могу откладывать в месяц</label>
                    <input type="number" 
                           class="form-control dream-input" 
                           id="monthlySave" 
                           value="${values.monthlySave || ''}"
                           placeholder="5000"
                           min="1"
                           required>
                </div>
            </div>
            
            <div class="mt-4">
                <button type="submit" class="btn btn-dream btn-lg w-100">
                    🧮 Рассчитать план
                </button>
            </div>
        </form>
    `;
    
    return {
        form: container.querySelector('#dream-form'),
        totalCost: container.querySelector('#totalCost'),
        initialAmount: container.querySelector('#initialAmount'),
        monthlySave: container.querySelector('#monthlySave')
    };
}