import type { AppLocale } from './locale';

function getPluralCategory(locale: AppLocale, count: number) {
  if (locale === 'en') {
    return count === 1 ? 'one' : 'many';
  }

  const abs = Math.abs(count);
  const mod10 = abs % 10;
  const mod100 = abs % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return 'one';
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'few';
  }

  return 'many';
}

export function formatPlayerCount(locale: AppLocale, count: number) {
  const category = getPluralCategory(locale, count);

  if (locale === 'uk') {
    const noun = category === 'one' ? 'гравець' : category === 'few' ? 'гравці' : 'гравців';
    return `${count} ${noun}`;
  }

  if (locale === 'ru') {
    const noun = category === 'one' ? 'игрок' : category === 'few' ? 'игрока' : 'игроков';
    return `${count} ${noun}`;
  }

  return `${count} ${category === 'one' ? 'player' : 'players'}`;
}
