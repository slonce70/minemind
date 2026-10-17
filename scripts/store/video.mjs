// Store preview video (App Preview 886x1920, 15-30 s): records a solo round, rewards and the collection.
//   node scripts/store/video.mjs <out-dir> <uk|en|ru>   (same setup as screenshots.mjs)
//   ffmpeg -ss 0.6 -i <recording>.webm -t 29 -vf "scale=886:1920:flags=lanczos,fps=30" \
//     -c:v libx264 -pix_fmt yuv420p -crf 20 -an -movflags +faststart preview-<locale>.mp4
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const [outDir, locale = 'uk'] = process.argv.slice(2);
const base = 'http://localhost:8081';
const { ids, answers } = JSON.parse(readFileSync(new URL('./.out/answers.json', import.meta.url), 'utf8'));
const seed = JSON.parse(readFileSync(new URL('./.out/state.json', import.meta.url), 'utf8'));
const optionWord = { en: 'Option', ru: 'Вариант', uk: 'Варіант' };
const nick = { en: 'BraveFox', ru: 'СмелыйЛис', uk: 'СміливийЛис' };
seed.state.locale = locale;
seed.state.profile = { avatarId: 'fox', locale, nickname: nick[locale] };
seed.state.progress.mistakes = ids;

const browser = await chromium.launch();
// Prime storage in a throwaway context so the recording starts on the home screen.
const prime = await browser.newContext();
const primePage = await prime.newPage();
await primePage.goto(base);
await primePage.evaluate((value) => localStorage.setItem('minemind-store', value), JSON.stringify(seed));
const storageState = await prime.storageState();
await prime.close();

const context = await browser.newContext({
  deviceScaleFactor: 2,
  locale,
  recordVideo: { dir: outDir, size: { height: 960, width: 443 } },
  storageState,
  viewport: { height: 960, width: 443 },
});
const page = await context.newPage();
await page.goto(`${base}/home`);
await page.waitForTimeout(2500);
await page.mouse.wheel(0, 500);
await page.waitForTimeout(1200);
await page.mouse.wheel(0, -500);
await page.waitForTimeout(600);
await page.goto(`${base}/solo?variant=mistakes`);
await page.waitForTimeout(3500);
for (let step = 0; step < ids.length; step += 1) {
  let index = -1;
  for (let candidate = 0; candidate < ids.length && index < 0; candidate += 1) {
    if ((await page.getByLabel(new RegExp(`^${optionWord[locale]} [A-D]: ${answers[locale][candidate]}$`)).count()) > 0) index = candidate;
  }
  await page.waitForTimeout(900);
  await page.getByLabel(new RegExp(`^${optionWord[locale]} [A-D]: ${answers[locale][index]}$`)).first().click();
  await page.waitForTimeout(1700);
  await page.getByTestId('round-next').click();
  await page.waitForTimeout(800);
}
await page.waitForURL(/results/);
await page.waitForTimeout(2500);
const rewards = page.getByText(/^(Нагороди|Rewards|Награды)$/).first();
await rewards.evaluate((element) => element.scrollIntoView({ behavior: 'smooth', block: 'start' }));
await page.waitForTimeout(3500);
await page.goto(`${base}/collection`);
await page.waitForTimeout(2500);
await page.mouse.wheel(0, 600);
await page.waitForTimeout(1500);
const video = page.video();
await context.close();
console.log(await video.path());
await browser.close();
