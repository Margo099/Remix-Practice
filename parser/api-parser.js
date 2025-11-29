// api-parser.js
// - собирает список товаров с первой страницы категории
// - если запущен с --detail, заходит на каждую страницу товара и собирает price, priceOld, promoPrice, rating, reviewCount, discount
// Запуск (PowerShell):
//   $env:CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
//   node api-parser.js "https://www.vprok.ru/catalog/7383/kapusta"
//   node api-parser.js "https://www.vprok.ru/catalog/7383/kapusta" --detail
//
// Парсер риентирован на стабильность для локального запуска
// Он использует puppeteer-core и локальный Chrome (CHROME_PATH)

const fs = require('fs').promises;
const puppeteer = require('puppeteer-core');

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

function normalizeNumStr(s) {
  if (s === undefined || s === null) return '';
  return String(s).replace(/\u00A0/g, ' ').replace(/[^0-9.,-]/g, '').replace(',', '.').trim();
}

function normalizeProductUrl(href) {
  try {
    const u = new URL(href);
    u.hash = ''; u.search = '';
    if (u.pathname.endsWith('/reviews')) u.pathname = u.pathname.replace(/\/reviews\/?$/, '');
    return u.toString();
  } catch (e) {
    return href;
  }
}

// Фильтрация "служебных" текстов (быстрый просмотр, цифры и т.п.)
function looksLikeProductName(t) {
  if (!t) return false;
  const trimmed = t.trim();
  if (trimmed.length < 3) return false;
  if (/^[\d.,\s]+$/.test(trimmed)) return false;
  if (/быстрый просмотр|купить|в корзину|отзывы|в избранное|поделиться/i.test(trimmed)) return false;
  return true;
}
async function collectProductList(page) {
  // ждём, пока хотя бы одна ссылка появится (если нет, то вернём пустой список)
  try {
    await page.waitForSelector('a[href*="/product/"]', { timeout: 8000 });
  } catch (e) {
    // ничего не найдено значит пусто
  }
  await sleep(600);

  const anchors = await page.$$eval('a[href*="/product/"]', nodes =>
    nodes.map(n => ({ href: n.href, text: (n.innerText || n.title || '').trim() }))
  );

  // Группируем по нормализованному product URL (чтобы /reviews не считались отдельным продуктом)
  const map = new Map();
  for (const a of anchors) {
    const key = (function (h) {
      try {
        const u = new URL(h);
        if (u.pathname.endsWith('/reviews')) u.pathname = u.pathname.replace(/\/reviews\/?$/, '');
        u.search = ''; u.hash = '';
        return u.toString();
      } catch (e) { return h; }
    })(a.href);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(a);
  }

  const out = [];
  for (const [url, nodes] of map.entries()) {
    // Имя- выбираем первое "похожее на название" из anchor text, иначе fallback на первый текст
    let name = '';
    for (const n of nodes) {
      if (looksLikeProductName(n.text)) { name = n.text.split('\n')[0].trim(); break; }
    }
    if (!name) name = (nodes[0] && nodes[0].text) || '';
    out.push({ name, url });
  }
  return out;
}

async function extractFromProductPage(browser, productUrl) {
  const page = await browser.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1200, height: 900 });
    await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 30000 }).catch(()=>{});
    await sleep(700);

    const data = {};

    // Текущая цена- это meta[itemprop="price"] или элемент с itemprop
    data.price = await page.$eval('meta[itemprop="price"]', el => el.getAttribute('content'), { timeout: 1200 }).catch(()=>null)
      || await page.$eval('[itemprop="price"]', el => (el.getAttribute('content') || el.innerText), { timeout: 1200 }).catch(()=>null)
      || '';

    // Рейтинг и отзывы
    data.rating = await page.$eval('[itemprop="ratingValue"]', el => (el.getAttribute('content') || el.innerText), { timeout: 1200 }).catch(()=>null) || '';
    data.reviewCount = await page.$eval('[itemprop="reviewCount"]', el => (el.getAttribute('content') || el.innerText), { timeout: 1200 }).catch(()=>null) || '';

    // Попробуем найти старую цену явным селектором
    data.priceOld = await page.$eval('del, .price-old, .Price_priceOld__3_X9N, .old-price', el => el.innerText, { timeout: 1000 }).catch(()=>null) || '';

    //Соберём все фрагменты текста с ценами (коротко, чтобы не перегружать)
    const fragments = await page.$$eval('div, span, p, strong, b, li', els =>
      els.map(e => (e.innerText || '').trim()).filter(Boolean).slice(0, 200)
    ).catch(()=>[]);

    // Собираем все числа с ₽ в pagee fragments
    const priceVals = [];
    for (const txt of fragments) {
      const re = /(\d[\d\s.,]*)\s*₽/g;
      let m;
      while ((m = re.exec(txt)) !== null) {
        const n = parseFloat(m[1].replace(/\s+/g, '').replace(',', '.'));
        if (!Number.isNaN(n)) priceVals.push({ value: n, text: txt });
      }
    }

    // Простая логика promo/old:
    // - promoPrice: если есть цена, близкая к текущей или помеченная "₽/шт" - берём её
    // - priceOld: максимальная найденная цена 
    if (!data.price && priceVals.length) {
      // если есть явное совпадение (например "129,99 ₽/шт"), попробуем найти
      const unit = priceVals.find(p => /\/\s*шт|\/шт|за шт|₽\/шт/i.test(p.text));
      data.price = unit ? String(unit.value) : String(priceVals[0].value);
    }
    if (!data.priceOld && priceVals.length) {
      const vals = Array.from(new Set(priceVals.map(p=>p.value))).sort((a,b)=>b-a);
      data.priceOld = String(vals[0]);
      // если current есть и priceOld == current, try second
      if (data.price && parseFloat(data.price) >= parseFloat(data.priceOld) && vals.length>1) {
        data.priceOld = String(vals[1]);
      }
    }
    // Скидка: ищем проценты в тексте фрагментов
    let discount = '';
    for (const t of fragments) {
      const dm = t.match(/(-?\d+)%/);
      if (dm) { discount = dm[1] + '%'; break; }
    }
    // promoPrice: предпочтём цену, которая меньше priceOld и близка к data.price
    let promoPrice = '';
    if (priceVals.length) {
      if (data.price) {
        const cur = parseFloat(String(data.price).replace(/[^0-9.,]/g,'').replace(',', '.'));
        const close = priceVals.find(p => Math.abs(p.value - cur) < 0.01);
        if (close) promoPrice = String(close.value);
      }
      if (!promoPrice) {
        // минимальная цена часто -текущая\акционная
        const min = priceVals.map(p=>p.value).sort((a,b)=>a-b)[0];
        if (min) promoPrice = String(min);
      }
    }

    return {
      price: data.price ? normalizeNumStr(data.price) : '',
      priceOld: data.priceOld ? normalizeNumStr(data.priceOld) : '',
      promoPrice: promoPrice ? normalizeNumStr(promoPrice) : '',
      rating: data.rating ? normalizeNumStr(data.rating) : '',
      reviewCount: data.reviewCount ? normalizeNumStr(data.reviewCount) : '',
      discount: discount || ''
    };
  } catch (e) {
    // в случае ошибки возвращаем пустые поля, но не ломаем весь процесс
    return { price:'', priceOld:'', promoPrice:'', rating:'', reviewCount:'', discount: '' };
  } finally {
    try { await page.close(); } catch (e){}
  }
}

async function main() {
  const argv = process.argv.slice(2);
  if (!argv.length) {
    console.error('Usage: node api-parser.js "<URL категории>" [--detail]');
    process.exit(1);
  }
  const categoryUrl = argv[0];
  const detail = argv.includes('--detail');

  const chromePath = process.env.CHROME_PATH;
  if (!chromePath) {
    console.error('CHROME_PATH не найден. Установите переменную окружения и повторите.');
    process.exit(1);
  }

  console.log('Запускаю браузер...');
  const browser = await puppeteer.launch({
    headless: false, // headful для надёжности при локальной отладке. можно сделать true для CI
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1366, height: 900 });

  try {
    console.log('Открываю категорию:', categoryUrl);
    await page.goto(categoryUrl, { waitUntil: 'networkidle2', timeout: 45000 }).catch(()=>{});
    await sleep(900);

    const productList = await collectProductList(page);
    if (!productList.length) {
      console.log('Не нашлось ссылок на товары — проверьте URL или откройте в браузере.');
      await browser.close();
      return;
    }

    if (!detail) {
      // быстрый режим-сохраняем имя и url
      const lines = productList.map(p => (
        `Название товара: ${p.name}\n` +
        `Ссылка на страницу товара: ${p.url}\n` +
        `Рейтинг: \nКоличество отзывов: \nЦена: \nАкционная цена: \nЦена до акции: \nРазмер скидки: \n`
      ));
      await fs.writeFile('products-api.txt', lines.join('\n'), 'utf8');
      console.log('Готово. products-api.txt написан (имя + url).');
      await browser.close();
      return;
    }

    // detailed режим-постепенно проходим товары (параллельно небольшое число)
    console.log(`Подробный сбор данных для ${productList.length} товаров...`);
    const results = [];
    const concurrency = 2;
    let idx = 0;

    async function worker() {
      while (true) {
        const i = idx++;
        if (i >= productList.length) return;
        const item = productList[i];
        console.log(`(${i+1}/${productList.length}) ${item.name}`);
        const details = await extractFromProductPage(browser, item.url);
        results.push({ ...item, ...details });
        // небольшая пауза, чтобы не сайт не вывалился
        await sleep(300);
      }
    }

    const workers = [];
    for (let w=0; w<concurrency; w++) workers.push(worker());
    await Promise.all(workers);

    const outLines = results.map(p => (
      `Название товара: ${p.name}\n` +
      `Ссылка на страницу товара: ${p.url}\n` +
      `Рейтинг: ${normalizeNumStr(p.rating)}\n` +
      `Количество отзывов: ${normalizeNumStr(p.reviewCount)}\n` +
      `Цена: ${normalizeNumStr(p.price)}\n` +
      `Акционная цена: ${normalizeNumStr(p.promoPrice)}\n` +
      `Цена до акции: ${normalizeNumStr(p.priceOld)}\n` +
      `Размер скидки: ${p.discount || ''}\n`
    ));

    await fs.writeFile('products-api.txt', outLines.join('\n'), 'utf8');
    console.log('Готово. Подробный products-api.txt записан.');
  } catch (err) {
    console.error('Ошибка:', err && err.message ? err.message : err);
  } finally {
    await browser.close();
  }
}

main();