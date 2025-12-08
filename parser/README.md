
# Vprok-scraper

Небольшой рабочий парсер для vprok.ru. В репозитории лежат два скрипта:

- `puppeteer_simple.js` — Часть 1: делает скриншот страницы товара и сохраняет `product.txt` (price, priceOld, rating, reviewCount)
- `api-parser.js` — Часть 2: собирает товары с первой страницы категории; команда (`--detail`) проходит по страницам товаров и собирает подробные поля (цены, скидки, рейтинг, отзывы) Результат — `products-api.txt`

Важно про запуск

Требования
- Node.js 18+ (рекомендуется)
- Локально установлен Chrome/Edge (нужен путь к исполняемому файлу)
- В проекте используется puppeteer-core (не скачивает Chromium автоматически) -необходимо задать переменную окружения CHROME_PATH

Установка зависимостей
1. В корне проекта:
   npm install

2. В PowerShell (Windows) укажите путь к Chrome:
   $env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"

   На macOS/Linux задайте аналогичную переменную окружения в вашей оболочке:
   export CHROME_PATH="/path/to/Google Chrome"

Скрипт: puppeteer_simple.js (Часть 1)
- Что делает:
  - Открывает страницу товара
  - (Best effort) пытается установить регион, если передан вторым аргументом
  - Записывает product.txt с простыми полями:
    price=...
    priceOld=...
    rating=...
    reviewCount=...
  - Делает полноразмерный скриншот страницы->screenshot.jpg

- Пример запуска (PowerShell):
  $env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"  
  node puppeteer_simple.js "https://www.vprok.ru/product/..." "Москва и область"

- Где смотреть результат:
  - product.txt
  - screenshot.jpg

- Примеры product.txt:
  price=27.9
  priceOld=1379
  rating=4.8
  reviewCount=419

- Примечание:
  - Если в среде используется официальный `puppeteer` (не core), можно заменить зависимость

Скрипт: api-parser.js (Часть 2)
- Что делает:
  - Быстрый режим (по умолчанию)- собирает список товаров (название + URL) с первой страницы категории и пишет products-api.txt
  - Подробный режим (`--detail`) -проходит по каждому найденному URL товара и собирает:
    Название товара, Ссылка, Рейтинг, Количество отзывов, Цена, Акционная цена, Цена до акции, Размер скидки
  - Подробный режим медленнее (открывает страницы товаров). Для стабильности параллелизм настроен на небольшой (по умолчанию concurrency 2)

- Пример запуска (быстрый):
  $env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"  
  node api-parser.js "https://www.vprok.ru/catalog/7383/kapusta"

- Пример запуска (подробный):
  $env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"  
  node api-parser.js "https://www.vprok.ru/catalog/7383/kapusta" --detail

- Где смотреть результат:
  - products-api.txt

- Пример фрагмента products-api.txt (формат одного товара):
  Название товара: Капуста белокочанная 2.0-3.0кг
  Ссылка на страницу товара: https://www.vprok.ru/product/kapusta-belokochannaya-20-30kg--1264596
  Рейтинг: 4.8
  Количество отзывов: 419
  Цена: 27.9
  Акционная цена:  (если есть)
  Цена до акции: 1379
  Размер скидки: -27%

Рекомендации по репозиторию (git)
- Автоматически генерируемые файлы (`product.txt`, `products-api.txt`, `screenshot.jpg`) обычно не хранятся в репозитории, потому что они:
  - Большие и часто меняются
  - Могут засорять историю коммитов
  Однако, я оставила их в репо в качестве подтверждения работы скриптов


Что мя предлагаю улучшить
- Вместо DOM-скрейпинга использовать реальный API-эндпоинт (XHR/Fetch) это будет быстрее и стабильнее, но требует анализа сетевых запросов
- Добавить флаги: --outdir, --headless, --concurrency и т.п.
- Вынести парсеры в модули и покрыть тестами
- Подготовить компактные примеры outputs/ и добавить их в репозиторий
