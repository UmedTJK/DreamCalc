/**
 * Service Worker для DreamCalc PWA
 * Обеспечивает оффлайн-работу и кэширование
 */

const CACHE_NAME = 'dreamcalc-v1.2';
const urlsToCache = [
  '/DreamCalc/',
  '/DreamCalc/index.html',
  '/DreamCalc/styles/main.css',
  '/DreamCalc/scripts/app.js',
  '/DreamCalc/scripts/calculator.js',
  '/DreamCalc/scripts/uiComponents.js',
  '/DreamCalc/scripts/dreamData.js',
  '/DreamCalc/scripts/utils.js',
  '/DreamCalc/scripts/storage.js',
  '/DreamCalc/scripts/charts.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
];

// Установка Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Установка');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Кэшируем файлы');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Установка завершена');
        return self.skipWaiting();
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Активация');
  
  // Удаляем старые кэши
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
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
  // Пропускаем запросы к Chart.js и другим CDN (они уже в кэше)
  if (event.request.url.includes('cdn.jsdelivr.net')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Если файл есть в кэше, возвращаем его
        if (response) {
          console.log('[Service Worker] Используем кэш:', event.request.url);
          return response;
        }
        
        // Иначе загружаем из сети
        console.log('[Service Worker] Загружаем из сети:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // Проверяем валидный ли ответ
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Клонируем ответ (поток можно прочитать только один раз)
            const responseToCache = response.clone();
            
            // Добавляем в кэш для будущих запросов
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('[Service Worker] Добавлено в кэш:', event.request.url);
              });
            
            return response;
          })
          .catch(error => {
            console.log('[Service Worker] Ошибка загрузки:', error);
            
            // Для HTML-страниц показываем оффлайн-страницу
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/DreamCalc/offline.html')
                .then(response => response || new Response('Приложение недоступно оффлайн'));
            }
            
            // Для других файлов возвращаем заглушку
            return new Response('Оффлайн', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Получение сообщений от клиента
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Фоновая синхронизация (для будущих функций)
self.addEventListener('sync', event => {
  console.log('[Service Worker] Фоновая синхронизация:', event.tag);
  
  if (event.tag === 'sync-history') {
    event.waitUntil(syncHistory());
  }
});

/**
 * Синхронизация истории (заглушка для будущего)
 */
async function syncHistory() {
  console.log('[Service Worker] Синхронизация истории...');
  // В будущем здесь можно синхронизировать историю с облаком
  return Promise.resolve();
}
