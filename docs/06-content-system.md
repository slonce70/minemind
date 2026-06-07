# Content System

## Launch Content
- одна категорія: `Minecraft`
- три мови: `uk`, `en`, `ru`
- базовий тон: дружній, енергійний, без токсичності
- поточний runtime bank: `360` валідованих записів у `content/minecraft/minecraft-question-bank.v1.json`
- master content program: `360` approved localized records today, з target-моделлю `1080` records у slot blueprint

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
- `npx tsx scripts/export-master-question-packs.ts --out content/minecraft/minecraft-question-bank.v1.json` синхронізує runtime bank з localized master records
- `npm run validate:release` запускає content gate разом із tests, typecheck, Expo Doctor, security audit, Edge Function check, web smoke, і bundle budget
- для backend path готуємо `question_packs` і `questions` у Supabase
- canonical source лишається в repo, навіть якщо згодом з'явиться CSV/JSON import workflow
