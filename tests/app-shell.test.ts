import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { iconMap } from '../src/features/ui/icon-map';
import { themeArt } from '../src/features/ui/theme-art';
import { minecraftCategory } from '../src/features/quiz/mock-data';
import { resources } from '../src/i18n/resources';
import { formatPlayerCount } from '../src/lib/count-format';
import { appTheme } from '../src/theme/tokens';

test('app theme exposes bottom-safe shell tokens and interaction states', () => {
  assert.ok(appTheme.surface.base);
  assert.ok(appTheme.surface.raised);
  assert.ok(appTheme.feedback.correct);
  assert.ok(appTheme.feedback.wrong);
  assert.ok(appTheme.layout.screenPadding);
});

test('home metadata stays aligned with the documented round size', () => {
  assert.equal(minecraftCategory.roundQuestionCount, 8);
});

test('critical home and rooms copy exists in every supported locale', () => {
  for (const locale of ['uk', 'en', 'ru'] as const) {
    assert.ok(resources[locale].translation.home.categoryCopy);
    assert.ok(resources[locale].translation.home.classroomAction);
    assert.ok(resources[locale].translation.home.playSolo);
    assert.ok(resources[locale].translation.home.roundLengthValue);
    assert.ok(resources[locale].translation.classroom.title);
    assert.ok(resources[locale].translation.rooms.title);
    assert.ok(resources[locale].translation.results.title);
    assert.ok(resources[locale].translation.avatars.fox);
  }
});

test('onboarding route binds visible copy to the in-progress selected locale', () => {
  const source = readFileSync(new URL('../app/onboarding.tsx', import.meta.url), 'utf8');

  assert.match(source, /lng:\s*selectedLocale/);
});

test('onboarding route groups form state in a reducer', () => {
  const source = readFileSync(new URL('../app/onboarding.tsx', import.meta.url), 'utf8');

  assert.match(source, /useReducer/);
  assert.match(source, /function onboardingReducer/);
  assert.match(source, /dispatch\(\{ type: 'nickname'/);
  assert.doesNotMatch(source, /const \[nickname, setNickname\]/);
});

test('production web hosting uses Netlify SPA fallback for exported routes', () => {
  const netlifyConfig = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');

  assert.match(netlifyConfig, /\[\[redirects\]\]/);
  assert.match(netlifyConfig, /from = "\/\*"/);
  assert.match(netlifyConfig, /to = "\/index\.html"/);
  assert.match(netlifyConfig, /status = 200/);
});

test('release validation enforces exported web bundle budgets', () => {
  const packageSource = readFileSync(new URL('../package.json', import.meta.url), 'utf8');
  const scriptSource = readFileSync(new URL('../scripts/check-web-export-budget.mjs', import.meta.url), 'utf8');

  assert.match(packageSource, /"check:web-budget": "node scripts\/check-web-export-budget\.mjs"/);
  assert.match(packageSource, /npm run check:web-budget/);
  assert.match(scriptSource, /maxWebEntryBundleBytes/);
  assert.match(scriptSource, /maxWebExportBytes/);
  assert.match(scriptSource, /maxQuestionIllustrationsBytes/);
});

test('release validation runs the full content authoring gate', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  ) as {
    scripts: Record<string, string>;
  };

  assert.equal(
    packageJson.scripts['validate:content'],
    'npx tsx scripts/validate-question-bank.ts && npx tsx scripts/validate-master-question-program.ts && npx tsx scripts/lint-question-duplicates.ts'
  );
  assert.match(packageJson.scripts['validate:release'], /npm run validate:content/);
  assert.ok(
    packageJson.scripts['validate:release'].indexOf('npm run validate:content') <
      packageJson.scripts['validate:release'].indexOf('npm run doctor:expo')
  );
});

test('content validators use Zod 4 schema factories', () => {
  const contentSource = readFileSync(new URL('../src/features/content/content-validator.ts', import.meta.url), 'utf8');
  const masterSource = readFileSync(new URL('../src/features/content/master-content-validator.ts', import.meta.url), 'utf8');

  assert.match(contentSource, /z\.strictObject/);
  assert.match(masterSource, /z\.strictObject/);
  assert.match(masterSource, /z\.url\(\)/);
  assert.doesNotMatch(contentSource, /z\.object\(/);
  assert.doesNotMatch(masterSource, /z\.string\(\)\.url\(\)/);
});

test('onboarding only commits the profile after guest session setup succeeds', () => {
  const source = readFileSync(new URL('../app/onboarding.tsx', import.meta.url), 'utf8');
  const ensureIndex = source.indexOf('await ensureGuestSession(profile);');
  const commitIndex = source.indexOf('completeOnboarding(profile);');

  assert.notEqual(ensureIndex, -1);
  assert.notEqual(commitIndex, -1);
  assert.ok(ensureIndex < commitIndex);
});

test('resetProfile keeps ukrainian as the default locale for the next onboarding flow', () => {
  const source = readFileSync(new URL('../src/state/app-store.ts', import.meta.url), 'utf8');
  const resetProfileIndex = source.indexOf("resetProfile: () =>\n        set({");

  assert.notEqual(resetProfileIndex, -1);
  const resetProfileBlock = source.slice(resetProfileIndex, resetProfileIndex + 220);
  assert.match(resetProfileBlock, /locale:\s*defaultAppLocale/);
});

test('i18n keeps ukrainian as the primary fallback language', () => {
  const source = readFileSync(new URL('../src/i18n/index.ts', import.meta.url), 'utf8');

  assert.match(source, /fallbackLng:\s*'uk'/);
  assert.match(source, /lng:\s*defaultAppLocale/);
});

test('web shell synchronizes the html language with the selected locale', () => {
  const source = readFileSync(new URL('../app/_layout.tsx', import.meta.url), 'utf8');

  assert.match(source, /Platform\.OS === 'web'/);
  assert.match(source, /document\.documentElement\.lang = locale/);
});

test('persisted routes wait for hydration before redirecting from restored app state', () => {
  const homeSource = readFileSync(new URL('../app/home.tsx', import.meta.url), 'utf8');
  const roomsSource = readFileSync(new URL('../app/rooms.tsx', import.meta.url), 'utf8');
  const resultsSource = readFileSync(new URL('../app/results.tsx', import.meta.url), 'utf8');
  const soloSource = readFileSync(new URL('../app/solo.tsx', import.meta.url), 'utf8');
  const onboardingSource = readFileSync(new URL('../app/onboarding.tsx', import.meta.url), 'utf8');

  assert.match(homeSource, /hasHydrated/);
  assert.match(roomsSource, /hasHydrated/);
  assert.match(resultsSource, /hasHydrated/);
  assert.match(soloSource, /hasHydrated/);
  assert.match(homeSource, /LoadingScreen/);
  assert.match(roomsSource, /LoadingScreen/);
  assert.match(resultsSource, /LoadingScreen/);
  assert.match(soloSource, /LoadingScreen/);
  assert.match(onboardingSource, /hasHydrated/);
  assert.match(onboardingSource, /if \(profile\) \{\s*return <Redirect href="\/home" \/>;/);
});

test('solo route keeps the active quiz screen scrollable so the fact card remains reachable', () => {
  const soloSource = readFileSync(new URL('../app/solo.tsx', import.meta.url), 'utf8');

  assert.match(soloSource, /<Card style=\{styles\.factCard\}>/);
  assert.match(soloSource, /return \(\s*<Screen>\s*<Stack\.Screen options=\{\{ headerShown: false \}\} \/>/);
});

test('solo route keeps post-answer progression manual so facts remain readable', () => {
  const soloSource = readFileSync(new URL('../app/solo.tsx', import.meta.url), 'utf8');
  const roundSource = readFileSync(new URL('../src/features/quiz/use-solo-round.ts', import.meta.url), 'utf8');

  assert.match(soloSource, /round\.isRevealed \? \(/);
  assert.match(soloSource, /t\('solo\.next'\)/);
  assert.match(soloSource, /round\.goNext/);
  assert.doesNotMatch(roundSource, /autoAdvanceTimeoutRef\.current\s*=\s*setTimeout/);
});

test('shared buttons and solo answers expose semantic web accessibility state', () => {
  const buttonSource = readFileSync(new URL('../src/components/ui/button.tsx', import.meta.url), 'utf8');
  const soloSource = readFileSync(new URL('../app/solo.tsx', import.meta.url), 'utf8');

  assert.match(buttonSource, /accessibilityRole="button"/);
  assert.match(buttonSource, /accessibilityLabel=\{accessibilityLabel \?\? label\}/);
  assert.match(buttonSource, /accessibilityState=\{\{/);
  assert.match(soloSource, /import \{ Image, type ImageSource \} from 'expo-image';/);
  assert.match(soloSource, /accessibilityRole="button"/);
  assert.match(soloSource, /selected: isSelected/);
});

test('android qa command can regenerate the ignored native project before install', () => {
  const packageSource = readFileSync(new URL('../package.json', import.meta.url), 'utf8');
  const scriptSource = readFileSync(new URL('../scripts/run-android-qa.mjs', import.meta.url), 'utf8');

  assert.match(packageSource, /"android:qa": "node scripts\/run-android-qa\.mjs"/);
  assert.match(scriptSource, /run\('npx', \['expo', 'prebuild', '--platform', 'android', '--non-interactive'\]\)/);
  assert.match(scriptSource, /:app:installDebug/);
  assert.match(scriptSource, /reactNativeArchitectures=arm64-v8a/);
});

test('home route exposes the classroom lobby from the main menu', () => {
  const homeSource = readFileSync(new URL('../app/home.tsx', import.meta.url), 'utf8');

  assert.match(homeSource, /router\.push\('\/classroom'\)/);
});

test('results route sends classroom rematches back to the classroom lobby', () => {
  const resultsSource = readFileSync(new URL('../app/results.tsx', import.meta.url), 'utf8');

  assert.match(resultsSource, /latestMatch\.mode === 'classroom'/);
  assert.match(resultsSource, /router\.replace\('\/classroom'\)/);
});

test('ukrainian UX copy stays fully localized in the most visible onboarding and game surfaces', () => {
  const uk = resources.uk.translation;

  assert.equal(uk.home.activeRoomCopy, 'Код {{code}}, {{countLabel}}. Можна повернутися в кімнату й почати матч.');
  assert.equal(
    uk.home.categoryCopy,
    'Короткі матчі на знання мобів, блоків, рецептів і базових механік Minecraft. {{questionCount}} питань, {{roundLength}}.',
  );
  assert.equal(uk.home.onlineReady, 'Готово до гри онлайн');
  assert.equal(uk.home.ready, 'Усе готово');
  assert.equal(uk.home.openLobby, 'Відкрити кімнату');
  assert.equal(uk.onboarding.subtitle, 'Обери безпечний нік, аватар і мову. Потім одразу стрибай у свій перший матч.');
  assert.equal(uk.results.badges.standardClear, 'Раунд завершено');
  assert.equal(uk.results.bestStreak, 'Найдовша серія');
  assert.equal(uk.results.subtitle, 'Перемога, серії правильних відповідей і нові Minecraft-факти');
  assert.equal(uk.results.title, 'Твій результат');
  assert.equal(uk.rooms.activeRoomCopy, 'У кімнаті зараз {{countLabel}}. Можна позначити готовність і почати матч.');
  assert.equal(uk.rooms.ready, 'Готовий');
  assert.equal(uk.rooms.readySummary, 'Готові: {{readyCount}} з {{participantCount}}');
  assert.equal(uk.rooms.subtitle, 'Створи приватну кімнату, поділися кодом і стартуй, коли всі будуть готові.');
  assert.equal(uk.rooms.toggleReady, 'Змінити статус готовності');
  assert.equal(
    uk.classroom.joinSessionHint,
    'Встав код-запрошення хоста або введи адресу вручну, а код класу додай нижче за потреби.',
  );
  assert.equal(uk.classroom.joinSessionPlaceholder, 'Введи код класу');
  assert.equal(uk.classroom.inviteTokenLabel, 'Запрошення або адреса');
  assert.equal(uk.solo.modeLabel, 'Соло-матч');
  assert.equal(uk.solo.roomModeLabel, 'Матч у кімнаті');
});

test('english and russian visible copy stays aligned with actual gameplay states', () => {
  const en = resources.en.translation;
  const ru = resources.ru.translation;

  assert.equal(en.avatars.axolotl, 'Axolotl');
  assert.equal(
    en.home.categoryCopy,
    'Fast battles about mobs, blocks, recipes, and Minecraft survival basics. {{questionCount}} questions, {{roundLength}}.',
  );
  assert.equal(en.home.roundLengthValue, '2-4 min');
  assert.equal(en.results.badges.standardClear, 'Round complete');
  assert.equal(ru.avatars.fox, 'Лис');
  assert.equal(ru.home.activeRoomCopy, 'Код {{code}}, {{countLabel}}. Можно вернуться в комнату и начать матч.');
  assert.equal(
    ru.home.categoryCopy,
    'Быстрые баттлы про мобов, блоки, рецепты и базовые механики Minecraft. {{questionCount}} вопросов, {{roundLength}}.',
  );
  assert.equal(ru.home.roundLengthValue, '2-4 мин');
  assert.equal(ru.home.onlineReady, 'Готово к игре онлайн');
  assert.equal(ru.home.ready, 'Все готово');
  assert.equal(ru.onboarding.subtitle, 'Выбери безопасный ник, аватар и язык. После этого сразу прыгай в свой первый матч.');
  assert.equal(ru.results.badges.standardClear, 'Раунд завершен');
  assert.equal(ru.results.subtitle, 'Победа, серии и новые факты о Minecraft');
  assert.equal(ru.results.title, 'Твой результат');
  assert.equal(ru.rooms.activeRoomCopy, 'Сейчас в комнате {{countLabel}}. Можно отметить готовность и начать матч.');
  assert.equal(ru.rooms.ready, 'Готов');
  assert.equal(ru.rooms.readySummary, 'Готовы: {{readyCount}} из {{participantCount}}');
  assert.equal(ru.rooms.subtitle, 'Создай приватную комнату, поделись кодом и стартуй, когда все будут готовы.');
  assert.equal(ru.rooms.toggleReady, 'Изменить готовность');
  assert.equal(
    ru.classroom.joinSessionHint,
    'Вставь приглашение от хоста или введи адрес вручную, а код класса добавь ниже при необходимости.',
  );
  assert.equal(ru.classroom.joinSessionPlaceholder, 'Введи код класса');
  assert.equal(en.classroom.inviteTokenLabel, 'Invite token or host address');
  assert.equal(ru.classroom.inviteTokenLabel, 'Приглашение или адрес');
  assert.equal(ru.classroom.subtitle, 'Запусти локальный матч в классе без внешнего сервера через ведущее устройство.');
  assert.equal(ru.solo.modeLabel, 'Соло-матч');
  assert.equal(ru.solo.roomModeLabel, 'Матч в комнате');
});

test('player-count copy can be formatted grammatically for visible room surfaces', () => {
  assert.equal(formatPlayerCount('uk', 1), '1 гравець');
  assert.equal(formatPlayerCount('uk', 4), '4 гравці');
  assert.equal(formatPlayerCount('ru', 1), '1 игрок');
  assert.equal(formatPlayerCount('ru', 5), '5 игроков');
  assert.equal(formatPlayerCount('en', 2), '2 players');
});

test('room-facing routes use formatted player-count labels instead of raw counts in copy', () => {
  const homeSource = readFileSync(new URL('../app/home.tsx', import.meta.url), 'utf8');
  const roomsSource = readFileSync(new URL('../app/rooms.tsx', import.meta.url), 'utf8');
  const classroomSource = readFileSync(new URL('../app/classroom.tsx', import.meta.url), 'utf8');

  assert.match(homeSource, /formatPlayerCount/);
  assert.match(roomsSource, /formatPlayerCount/);
  assert.match(classroomSource, /formatPlayerCount/);
});

test('home hero summary is driven by locale-owned copy instead of stitching label fragments in the route', () => {
  const source = readFileSync(new URL('../app/home.tsx', import.meta.url), 'utf8');
  const uk = resources.uk.translation;

  assert.equal(
    uk.home.categoryCopy,
    'Короткі матчі на знання мобів, блоків, рецептів і базових механік Minecraft. {{questionCount}} питань, {{roundLength}}.',
  );
  assert.equal(uk.home.roundLengthValue, '2-4 хв');
  assert.match(source, /t\('home\.categoryCopy',\s*\{/);
  assert.match(source, /questionCount:\s*minecraftCategory\.roundQuestionCount/);
  assert.match(source, /t\('home\.roundLengthValue'\)/);
  assert.doesNotMatch(source, /minecraftCategory\.roundDurationLabel/);
  assert.doesNotMatch(source, /t\('home\.questionsCount'\)/);
  assert.doesNotMatch(source, /t\('home\.questions'\)\.toLowerCase\(\)/);
});

test('onboarding avatar labels are driven by the selected locale instead of hardcoded english names', () => {
  const routeSource = readFileSync(new URL('../app/onboarding.tsx', import.meta.url), 'utf8');
  const viewSource = readFileSync(new URL('../src/features/onboarding/onboarding-view.tsx', import.meta.url), 'utf8');

  assert.match(routeSource, /avatarLabels=/);
  assert.match(routeSource, /t\(`avatars\.\$\{avatar\.id\}`,\s*translationOptions\)/);
  assert.match(viewSource, /avatarLabels\[selectedAvatarId\]/);
  assert.match(viewSource, /avatarLabels\[avatar\.id\]/);
});

test('fantasy layer exposes themed backgrounds and icon markers', () => {
  assert.ok(themeArt.overworld);
  assert.ok(themeArt.nether);
  assert.ok(iconMap.pickaxe);
  assert.ok(iconMap.trophy);
});

test('room lobby hero no longer renders the empty block glyph marker', () => {
  const roomSource = readFileSync(new URL('../src/features/rooms/room-lobby-view.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(roomSource, /icon="block"/);
});
