// Store screenshots: 6 screens x 3 languages x 5 sizes (iPhone 6.7"/6.5", iPad 12.9", Android phone/tablet).
//   npm i --no-save playwright@1.58.2 && npx playwright install chromium   (once)
//   npx expo start --web --port 8081 (offline is fine), npx tsx scripts/store/prepare.ts
//   node scripts/store/screenshots.mjs docs/store/screenshots [size-prefix]
// PNG without alpha, accepted by both stores (JPEG comes out bigger for this flat UI).
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const outRoot = process.argv[2];
const only = process.argv[3];
const base = 'http://localhost:8081';
const { ids, answers } = JSON.parse(readFileSync(new URL('./.out/answers.json', import.meta.url), 'utf8'));
const seed = JSON.parse(readFileSync(new URL('./.out/state.json', import.meta.url), 'utf8'));
const sizes = {
  'iphone-6.7': { deviceScaleFactor: 3, viewport: { height: 932, width: 430 } },
  'iphone-6.5': { deviceScaleFactor: 3, viewport: { height: 896, width: 414 } },
  'ipad-12.9': { deviceScaleFactor: 2, viewport: { height: 1366, width: 1024 } },
  'android-phone': { deviceScaleFactor: 3, viewport: { height: 640, width: 360 } },
  'android-tablet': { deviceScaleFactor: 2, viewport: { height: 1280, width: 800 } },
};
const nick = { en: 'BraveFox', ru: 'СмелыйЛис', uk: 'СміливийЛис' };
const challenger = { en: 'QuickBee', ru: 'БыстраяПчела', uk: 'ШвидкаБджола' };
const optionWord = { en: 'Option', ru: 'Вариант', uk: 'Варіант' };
const browser = await chromium.launch();

for (const [size, device] of Object.entries(sizes)) {
  if (only && !size.startsWith(only)) continue;

  for (const locale of ['uk', 'en', 'ru']) {
    const dir = `${outRoot}/${size}/${locale}`;
    mkdirSync(dir, { recursive: true });
    const context = await browser.newContext({ ...device, locale });
    const page = await context.newPage();
    const state = structuredClone(seed);
    state.state.locale = locale;
    state.state.profile = { avatarId: 'fox', locale, nickname: nick[locale] };
    state.state.progress.mistakes = ids;
    await page.goto(base);
    await page.evaluate((value) => localStorage.setItem('minemind-store', value), JSON.stringify(state));
    const shot = (name) => page.screenshot({ path: `${dir}/${name}.png` });

    await page.goto(`${base}/home`);
    await page.waitForTimeout(3500);
    await shot('1-home');

    await page.goto(`${base}/solo?variant=mistakes`);
    await page.waitForTimeout(5000);
    for (let step = 0; step < ids.length; step += 1) {
      if (step > 0) await page.waitForTimeout(1800);
      let index = -1;
      for (let candidate = 0; candidate < ids.length && index < 0; candidate += 1) {
        const option = page.getByLabel(new RegExp(`^${optionWord[locale]} [A-D]: ${answers[locale][candidate]}$`));
        if ((await option.count()) > 0) index = candidate;
      }
      await page.mouse.move(device.viewport.width / 2, device.viewport.height / 2);
      await page.mouse.wheel(0, -5000);
      await page.waitForTimeout(400);
      if (index === 0) await shot('2-question-picture');
      await page.getByLabel(new RegExp(`^${optionWord[locale]} [A-D]: ${answers[locale][index]}$`)).first().click();
      await page.waitForTimeout(1600);
      if (index === 1) {
        await page.mouse.wheel(0, -5000);
        await page.waitForTimeout(400);
        await shot('3-question-recipe');
      }
      await page.getByTestId('round-next').click();
    }
    await page.waitForURL(/results/, { timeout: 15000 });
    await page.waitForTimeout(4500);
    const rewards = page.getByText(/^(Нагороди|Rewards|Награды)$/).first();
    await rewards.evaluate((element) => element.scrollIntoView({ block: 'start' }));
    await page.mouse.wheel(0, -24);
    await page.waitForTimeout(1500);
    await shot('4-rewards');

    await page.goto(`${base}/collection`);
    await page.waitForTimeout(3000);
    await shot('5-collection');

    await page.goto(`${base}/challenge?c=6&d=medium&from=${encodeURIComponent(challenger[locale])}&score=1180&seed=store-demo`);
    await page.waitForTimeout(3000);
    await shot('6-challenge');
    await context.close();
    console.log('done', size, locale);
  }
}

await browser.close();
