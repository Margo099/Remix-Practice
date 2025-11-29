// puppeteer_simple.js
// Простой рабочий скрипт для тестового задания vprok.ru
// - делает fullPage скриншот - screenshot.jpg
// - сохраняет price, priceOld, rating, reviewCount - product.txt
// Запуск (PowerShell):
//   $env:CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
//   node puppeteer_simple.js "<URL>" "Регион"
//   использовала именно puppeteer-core, потому что это локально, стабильно и позволяет избежать проблем с загрузкой Chromium в CI/локальной среде. Если критично, смогу переделать 
// - TODO: можно вынести парсеры в отдельные модули, если проект будет расти, еще можно сделать связку puppeteer-core + anti-detect

const fs = require('fs').promises;
const puppeteer = require('puppeteer-core');

// Небольшая утилка для ожидания (вместо page.waitForTimeout, чтобы не зависеть от версии Puppeteer), потому что при переходе по ссылке, требует подождать
function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// Чистка числа из текста, чтобы привести "129,99 ₽" - "129.99"
function cleanNumber(s) {
  if (!s) return '';
  const only = String(s).replace(/[^0-9.,]/g, '').replace(',', '.').trim();
  const parts = only.split('.');
  if (parts.length <= 2) return only;
  return parts.slice(0, 2).join('.') + parts.slice(2).join('');
}

// Обычная простая смена региона: кликаем кнопку, вводим текст, кликаем по совпадению
async function simpleSetRegion(page, region) {
  if (!region) return false;
  try {
    const btn = await page.$('button[data-testid="region-button"], .RegionSelect_region__3pS-Q');
    if (!btn) {
      console.log('[region] Кнопка региона не найдена- пропускаю переключение');
      return false;
    }
    console.log('[region] Открываю выбор региона...');
    await btn.click();
    await sleep(500);

    const input = await page.$('.RegionSelect_search__2hX9k input, [data-testid="region-search"] input');
    if (input) {
      console.log('[region] Ввожу название региона в поиск...');
      await input.type(region, { delay: 80 });
      await sleep(700);
      // клик по первому подходящему элементу с нужным текстом
      const clicked = await page.evaluate((r) => {
        const nodes = Array.from(document.querySelectorAll('li, div, button')).slice(0, 200);
        const lower = r.trim().toLowerCase();
        for (const n of nodes) {
          if (!n.innerText) continue;
          const t = n.innerText.trim().toLowerCase();
          if (t === lower || t.includes(lower)) {
            try { n.click(); } catch (e) {}
            return true;
          }
        }
        return false;
      }, region);
      if (clicked) {
        console.log('[region] Регион установлен по текстовому совпадению:', region);
      } else {
        console.log('[region] Регион не найден в списке');
      }
      return clicked;
    } else {
      console.log('[region] Поле поиска региона не найдено');
      return false;
    }
  } catch (e) {
    console.log('[region] Ошибка при смене региона (игнорируем):', e && e.message ? e.message : e);
    return false;
  }
}

// Главная логика
(async () => {
  const [url, region] = process.argv.slice(2);
  if (!url || !region) {
    console.error('Usage: node puppeteer_simple.js <URL> "<Регион>"');
    process.exit(1);
  }

  const chromePath = process.env.CHROME_PATH;
  if (!chromePath) {
    console.error('CHROME_PATH не найден. Установите переменную окружения в этой сессии и повторите');
    console.error('Пример (PowerShell): $env:CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"');
    process.exit(1);
  }

  console.log('Запускаю браузер (локальный Chrome)...');
  const browser = await puppeteer.launch({
    headless: false, // Для теста 
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  // Простой User-Agent чтобы вести себя более "как человек" и пройти проверку на бота 
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1366, height: 900 });

  try {
    console.log('Открываю страницу:', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

    // Небольшая пауза на всякий случай (lazy-load\проверка)
    await sleep(1200);

    // Попытка сменить регион
    await simpleSetRegion(page, region);
    await sleep(900); // дать странице обновиться после смены региона

    // 1) Сначала пробуем JSON-LD, если есть, это надёжно и аккуратно
    let data = {};
    try {
      const scripts = await page.$$eval('script[type="application/ld+json"]', s => s.map(el => el.innerText));
      for (const txt of scripts) {
        try {
          const obj = JSON.parse(txt);
          const arr = Array.isArray(obj) ? obj : [obj];
          for (const it of arr) {
            if (it.aggregateRating) {
              data.rating = data.rating || it.aggregateRating.ratingValue;
              data.reviewCount = data.reviewCount || it.aggregateRating.reviewCount;
            }
            if (it.offers) {
              const off = Array.isArray(it.offers) ? it.offers[0] : it.offers;
              if (off && off.price) data.price = data.price || off.price;
            }
          }
        } catch (e) {
          // пропускаем некорректный JSON
        }
      }
      if (Object.keys(data).length) console.log('[parser] JSON-LD дал что-то полезное');
      else console.log('[parser] JSON-LD пуст или не дал нужных полей');
    } catch (e) {
      console.log('[parser] Ошибка при чтении JSON-LD (игнорируем):', e && e.message ? e.message : e);
    }

    // 2) Фолбэк по DOM
      // TODO: если в будущем потребуется, возвращать unit/weight/manufacturer и т.д. можно дополнить 
    if (!data.price || !data.rating) {
      //цена: meta[itemprop="price"] или [itemprop="price"]
      try {
        const priceMeta = await page.$eval('meta[itemprop="price"]', el => el.getAttribute('content'), { timeout: 2000 }).catch(() => null);
        const priceItem = await page.$eval('[itemprop="price"]', el => el.getAttribute('content') || el.innerText, { timeout: 2000 }).catch(() => null);
        data.price = data.price || priceMeta || priceItem || (await page.$eval('.Price_price__B1nK-, .price', el => el.innerText, { timeout: 2000 }).catch(() => null));
        if (data.price) console.log('[parser] Цена найдена в DOM:', data.price);
      } catch (e) {
      }

      // Рейтинг и количество отзывов
      try {
        const r = await page.$eval('[itemprop="ratingValue"]', el => el.getAttribute('content') || el.innerText, { timeout: 2000 }).catch(() => null);
        const rc = await page.$eval('[itemprop="reviewCount"]', el => el.getAttribute('content') || el.innerText, { timeout: 2000 }).catch(() => null);
        data.rating = data.rating || r;
        data.reviewCount = data.reviewCount || rc;
        if (r) console.log('[parser] Рейтинг найден:', r);
        if (rc) console.log('[parser] Отзывов найдено:', rc);
      } catch (e) {
      }

      // Если не нашли priceOld -собираем все вхождения цен с символом ₽ и выбираем подходящую как старую цену
      if (!data.priceOld) {
        try {
          const priceTexts = await page.$$eval('div, span, p, strong, b', els => els.map(e => (e.innerText || '').replace(/\u00A0/g, ' ')));
          const nums = [];
          for (const t of priceTexts) {
            const matches = t.match(/(\d[\d\s.,]*)\s*₽/g);
            if (matches) {
              for (const m of matches) {
                const num = m.replace(/[^0-9.,]/g, '').replace(',', '.');
                const parsed = parseFloat(num);
                if (!Number.isNaN(parsed)) nums.push(parsed);
              }
            }
          }
          if (nums.length) {
            nums.sort((a, b) => b - a);
            const cur = data.price ? parseFloat(cleanNumber(data.price)) : null;
            let old = null;
            if (cur) old = nums.find(n => n > cur);
            if (!old) old = nums[0];
            if (old) {
              data.priceOld = String(old);
              console.log('[parser] Старая цена определена из текста страницы:', data.priceOld);
            }
          }
        } catch (e) {
        }
      }
    }

    // Делаем цену записываемой в формате и фиксируем- всегда 4 строки, как в ТЗ
    const out = {
      price: data.price ? String(parseFloat(cleanNumber(data.price)) || '') : '',
      priceOld: data.priceOld ? String(parseFloat(cleanNumber(data.priceOld)) || '') : '',
      rating: data.rating ? String(parseFloat(cleanNumber(data.rating)) || '') : '',
      reviewCount: data.reviewCount ? String(parseInt(cleanNumber(data.reviewCount), 10) || '') : ''
    };

    const content = `price=${out.price}\npriceOld=${out.priceOld}\nrating=${out.rating}\nreviewCount=${out.reviewCount}\n`;
    console.log('Записываю product.txt...');
    await fs.writeFile('product.txt', content, 'utf8');
    console.log('Готово. Вот что удалось записать:\n' + content);

    // Скриншот(полноразмерный)
    await page.screenshot({ path: 'screenshot.jpg', fullPage: true });
    console.log('Скриншот сохранён: screenshot.jpg');

  } catch (err) {
    console.error('Ошибка в основном потоке:', err && err.message ? err.message : err);
  } finally {
    // Закрываем браузер (даже при ошибке)
    await browser.close();
  }
})();