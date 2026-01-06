/**
 * Service Worker для DreamCalc PWA
 * Обеспечивает оффлайн-работу и кэширование
 * Версия: 2.1.0 (с поддержкой модулей хедера и футера)
 * Адаптирован для локальной разработки
 */

const CACHE_NAME = 'dreamcalc-v2.1.0';
const urlsToCache = [
  // Основные файлы (относительные пути для локальной разработки)
  './',
  './index.html',
  './styles/main.css',
  './manifest.json',
  
  // Основные скрипты
  './scripts/app.js',
  './scripts/calculator.js',
  './scripts/uiComponents.js',
  './scripts/dreamData.js',
  './scripts/utils.js',
  './scripts/storage.js',
  './scripts/charts.js',
  
  // Модуль хедера
  './modules/header/header.html',
  './modules/header/header.css',
  './modules/header/header.js',
  
  // Модуль футера
  './modules/footer/footer.html',
  './modules/footer/footer.css',
  './modules/footer/footer.js',
  
  // Внешние зависимости
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
];

// Установка Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Установка v2.1.0 для локальной разработки');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Кэшируем основные файлы');
        
        // Кэшируем основные файлы (игнорируем ошибки для внешних ресурсов)
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(error => {
              console.log(`[Service Worker] Пропускаем (ошибка): ${url}`, error.message);
              return Promise.resolve(); // Игнорируем ошибки
            });
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Установка завершена');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Критическая ошибка:', error);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Активация v2.1.0');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('dreamcalc-')) {
            console.log('[Service Worker] Удаляем старый кэш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Активация завершена');
      return self.clients.claim();
    })
  );
});

// Перехват запросов
self.addEventListener('fetch', event => {
  // Для локальной разработки обрабатываем все запросы
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Если есть в кэше, возвращаем
        if (response) {
          return response;
        }
        
        // Загружаем из сети
        return fetch(event.request)
          .then(response => {
            // Кэшируем только успешные ответы
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return response;
          })
          .catch(error => {
            console.log('[Service Worker] Ошибка загрузки:', event.request.url);
            
            // Для HTML страниц возвращаем заглушку
            if (event.request.headers.get('accept').includes('text/html')) {
              return new Response(
                '<!DOCTYPE html><html><head><title>DreamCalc - Оффлайн</title><style>body{font-family:Inter,sans-serif;padding:20px;text-align:center}h1{color:#2563eb}p{color:#64748b}</style></head><body><h1>📴 Оффлайн режим</h1><p>DreamCalc работает оффлайн. Обновите страницу при восстановлении соединения.</p></body></html>',
                { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
              );
            }
            
            return new Response('Оффлайн', { status: 503 });
          });
      })
  );
});

// Сообщения от клиента
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});