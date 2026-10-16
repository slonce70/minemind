# Content System

## Launch Content
- одна категорія: `Minecraft`
- три мови: `uk`, `en`, `ru`
- базовий тон: дружній, енергійний, без токсичності
- поточний runtime bank: `360` активних записів у `content/minecraft/minecraft-question-bank.v1.json` (`15` на кожну пару тема × складність)
- master content program: `360` approved localized records today, з target-моделлю `1080` records у slot blueprint
- кожен запис перевірено на факти для актуальних Java і Bedrock `1.21.x`; українські й російські назви взято з офіційних мовних файлів гри

## Content Principles
- короткі питання
- варіанти відповіді без двозначності
- пояснення після відповіді додає корисний факт
- важливіше відчуття battle flow, ніж ultra-hard trivia

## Difficulty Model
- `easy / medium / hard`
- child-facing labels: `Builder / Explorer / Nether Pro`
- `easy` тримається на obvious survival/crafting знаннях
- `medium` покриває core game understanding
- `hard` уже включає deeper mechanics, але без niche edge cases

## Editorial Workflow
- авторинг іде через master JSON bank у `content/minecraft/minecraft-master-bank.v2.json`
- `npm run validate:content` перевіряє runtime bank, master program schema, і duplicate lint
- `npm run export:content` синхронізує runtime bank з master records і перегенеровує `supabase/seed.sql`
- export розкладає правильну відповідь по позиціях детерміновано від id запису, а застосунок і сервер ще раз перемішують варіанти в кожному раунді
- `validate:content` також запускає редакторський лінтер (`src/features/content/content-lint.ts`): довжина промпту ≤ `120`, варіанту ≤ `32`, пояснення ≤ `180` символів; алфавіт відповідає мові (uk без ы/э/ъ/ё, ru без і/ї/є/ґ, ru — не копія uk); правильна відповідь не стоїть у тексті питання; немає дублів промптів; розподіл `correctIndex` по банку в межах `15–35%` на позицію
- `npm run validate:release` запускає content gate разом із tests, typecheck, Expo Doctor, security audit, Edge Function check, web smoke, і bundle budget
- backend path: `question_packs` (по одному на мову × складність, `slug` на кшталт `minecraft-uk-easy`) і `questions` (`content_id` = id запису банку) у Supabase; таблиці закриті RLS, читає їх лише service role в Edge Functions
- canonical source лишається в repo, навіть якщо згодом з'явиться CSV/JSON import workflow
