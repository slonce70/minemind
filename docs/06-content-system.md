# Content System

## Launch Content
- одна категорія: `Minecraft`
- три мови: `uk`, `en`, `ru`
- базовий тон: дружній, енергійний, без токсичності

## Content Principles
- короткі питання
- варіанти відповіді без двозначності
- пояснення після відповіді додає корисний факт
- важливіше відчуття battle flow, ніж ultra-hard trivia

## Difficulty Band
- `8-12`
- легкі і середні питання
- без надто вузьких speedrunner / technical деталей у v1

## Editorial Workflow
- локально в коді використовуємо mock bank
- для backend path готуємо `question_packs` і `questions` у Supabase
- далі можна перенести контент у CSV/JSON import pipeline
