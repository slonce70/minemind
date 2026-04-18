# Content System

## Launch Content
- одна категорія: `Minecraft`
- три мови: `uk`, `en`, `ru`
- базовий тон: дружній, енергійний, без токсичності
- milestone A: `60` активних запитань у локальному банку

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
- авторинг іде через canonical JSON bank у репозиторії
- `npx tsx scripts/validate-question-bank.ts` перевіряє schema та editorial shape
- `npx tsx scripts/export-question-packs.ts` готує derived pack slices для runtime/backend path
- для backend path готуємо `question_packs` і `questions` у Supabase
- далі можна перенести контент у CSV/JSON import pipeline, але canonical source лишається в repo
