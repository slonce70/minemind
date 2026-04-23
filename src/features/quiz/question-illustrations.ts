import type { AppLocale } from '../../lib/locale';
import type { QuizQuestionIllustration } from './types';

type IllustrationRecord = {
  alt: Record<AppLocale, string>;
  imageUri: string;
};

const questionIllustrations: Record<string, IllustrationRecord> = {
  'badlands-has-terracotta': {
    alt: {
      en: 'Voxel badlands biome with layered terracotta hills',
      ru: 'Блочный биом пустошей со слоистыми терракотовыми холмами',
      uk: 'Блоковий біом безплідних земель із шаруватими теракотовими пагорбами',
    },
    imageUri: '/question-illustrations/badlands-has-terracotta.png',
  },
  'bamboo-jungle-has-bamboo': {
    alt: {
      en: 'Voxel bamboo jungle filled with tall bamboo stalks',
      ru: 'Блочные бамбуковые джунгли с высокими стеблями бамбука',
      uk: 'Блокові бамбукові джунглі з високими стеблами бамбука',
    },
    imageUri: '/question-illustrations/bamboo-jungle-has-bamboo.png',
  },
  'village-has-villagers': {
    alt: {
      en: 'Voxel village with houses, crop fields, and safe settlement clues',
      ru: 'Блочная деревня с домами, грядками и признаками безопасного поселения',
      uk: 'Блокове село з будинками, грядками й ознаками безпечного поселення',
    },
    imageUri: '/question-illustrations/village-has-villagers.png',
  },
} satisfies Record<string, IllustrationRecord>;

export const illustratedQuestionIds = Object.keys(questionIllustrations);

export function getQuestionIllustration(
  questionId: string,
  locale: AppLocale = 'en',
): QuizQuestionIllustration | undefined {
  const illustration = questionIllustrations[questionId];

  if (!illustration) {
    return undefined;
  }

  return {
    alt: illustration.alt[locale],
    id: questionId,
    imageUri: illustration.imageUri,
  };
}
