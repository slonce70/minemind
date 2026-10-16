import { nicknameMaxLength } from '../../../supabase/functions/_shared/nickname-rules';
import type { AppLocale } from '../../lib/locale';

// Friendly default nicknames: adjective + noun in the player's language (uk/ru pairs are all
// masculine so the endings agree). Pairs longer than the nickname limit are skipped.
const words: Record<AppLocale, { adjectives: string[]; nouns: string[] }> = {
  en: {
    adjectives: ['Swift', 'Clever', 'Brave', 'Jolly', 'Wise', 'Quiet', 'Bright', 'Sunny', 'Starry', 'Frosty', 'Fiery', 'Golden', 'Silver', 'Lucky', 'Mighty', 'Cosy', 'Happy', 'Sneaky', 'Bold', 'Nimble'],
    nouns: ['Fox', 'Cube', 'Miner', 'Builder', 'Explorer', 'Mole', 'Falcon', 'Hedgehog', 'Dragon', 'Kitten', 'Penguin', 'Wolf', 'Whale', 'Bear', 'Crafter', 'Comet', 'Pebble', 'Compass', 'Lantern', 'Otter'],
  },
  ru: {
    adjectives: ['Быстрый', 'Хитрый', 'Смелый', 'Весёлый', 'Мудрый', 'Тихий', 'Яркий', 'Звёздный', 'Лесной', 'Горный', 'Солнечный', 'Ночной', 'Серебряный', 'Золотой', 'Ледяной', 'Огненный', 'Волшебный', 'Добрый', 'Бравый', 'Ловкий'],
    nouns: ['Лис', 'Кубик', 'Шахтёр', 'Строитель', 'Странник', 'Крот', 'Сокол', 'Ёжик', 'Дракон', 'Котик', 'Пингвин', 'Волк', 'Кит', 'Медведь', 'Мастер', 'Клад', 'Камень', 'Луч', 'Компас', 'Рюкзак'],
  },
  uk: {
    adjectives: ['Швидкий', 'Хитрий', 'Сміливий', 'Веселий', 'Мудрий', 'Тихий', 'Яскравий', 'Зоряний', 'Лісовий', 'Гірський', 'Сонячний', 'Нічний', 'Срібний', 'Золотий', 'Крижаний', 'Вогняний', 'Чарівний', 'Добрий', 'Бравий', 'Спритний'],
    nouns: ['Лис', 'Кубик', 'Шахтар', 'Будівник', 'Мандрівник', 'Кріт', 'Сокіл', 'Їжак', 'Дракон', 'Котик', 'Пінгвін', 'Вовк', 'Кит', 'Ведмідь', 'Майстер', 'Скарб', 'Камінь', 'Промінь', 'Компас', 'Рюкзак'],
  },
};

export function nicknameCandidates(locale: AppLocale) {
  const { adjectives, nouns } = words[locale];

  return adjectives.flatMap((adjective) =>
    nouns.map((noun) => `${adjective} ${noun}`).filter((name) => name.length <= nicknameMaxLength)
  );
}

export function generateNickname(locale: AppLocale, random: () => number = Math.random, avoid?: string) {
  const candidates = nicknameCandidates(locale).filter((name) => name !== avoid);

  return candidates[Math.floor(random() * candidates.length)] ?? candidates[0];
}
