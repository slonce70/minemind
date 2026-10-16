import type { ApiErrorCode } from '../../supabase/functions/_shared/error-codes';
import type { AppLocale } from '../lib/locale';

type PlayerErrorMessages = {
  generic: string;
  network: string;
  session: string;
};

export const playerErrorResources = {
  uk: {
    generic: 'Щось пішло не так. Спробуй ще раз.',
    network: 'Проблема зі з’єднанням. Спробуй ще раз.',
    session: 'Термін дії сесії минув. Спробуй ще раз.',
  },
  en: {
    generic: 'Something went wrong. Please try again.',
    network: 'Connection problem. Please try again.',
    session: 'Your session expired. Please try again.',
  },
  ru: {
    generic: 'Что-то пошло не так. Попробуй еще раз.',
    network: 'Проблема с подключением. Попробуй еще раз.',
    session: 'Срок действия сессии истек. Попробуй еще раз.',
  },
} as const satisfies Record<AppLocale, PlayerErrorMessages>;

/** Translations for the `code` field of Edge Function errors. */
export const apiErrorResources = {
  uk: {
    answer_already_submitted: 'Відповідь на це питання вже зараховано.',
    host_only: 'Це може зробити лише ведучий кімнати.',
    invalid_nickname: 'Нікнейм не підходить: 2–16 літер або цифр, без поганих слів.',
    invalid_request: 'Гра надіслала дивний запит. Онови застосунок і спробуй ще раз.',
    no_active_round: 'У кімнаті зараз немає раунду.',
    no_questions: 'Питання для цієї складності ще не готові. Спробуй пізніше.',
    not_enough_players: 'Для бою потрібні щонайменше двоє гравців.',
    not_room_member: 'Ти вже не в цій кімнаті. Зайди ще раз за кодом.',
    players_not_ready: 'Не всі гравці готові.',
    question_not_open: 'Це питання ще не почалося.',
    question_not_in_round: 'Це питання не з поточного раунду.',
    rate_limited: 'Забагато спроб. Зачекай хвилинку.',
    room_closed: 'Ця кімната вже не приймає гравців.',
    room_full: 'Кімната заповнена.',
    room_in_progress: 'У кімнаті вже йде бій.',
    room_not_found: 'Кімнату з таким кодом не знайдено.',
    round_not_found: 'Раунд не знайдено.',
    round_over: 'Час раунду вийшов.',
    server_error: 'На сервері щось пішло не так. Спробуй ще раз.',
    unauthorized: 'Термін дії сесії минув. Спробуй ще раз.',
  },
  en: {
    answer_already_submitted: 'You already answered this question.',
    host_only: 'Only the room host can do that.',
    invalid_nickname: "That nickname won't work: use 2–16 letters or numbers, no rude words.",
    invalid_request: 'The game sent a bad request. Update the app and try again.',
    no_active_round: 'There is no round running in this room.',
    no_questions: "Questions for this difficulty aren't ready yet. Try again later.",
    not_enough_players: 'You need at least two players to start.',
    not_room_member: "You're no longer in this room. Join again with the code.",
    players_not_ready: 'Not everyone is ready yet.',
    question_not_open: "This question hasn't started yet.",
    question_not_in_round: "That question isn't part of this round.",
    rate_limited: 'Too many tries. Wait a minute.',
    room_closed: "This room isn't taking new players.",
    room_full: 'The room is full.',
    room_in_progress: 'A battle is already running in this room.',
    room_not_found: 'No room with that code.',
    round_not_found: 'Round not found.',
    round_over: "Time's up for this round.",
    server_error: 'Something went wrong on our side. Please try again.',
    unauthorized: 'Your session expired. Please try again.',
  },
  ru: {
    answer_already_submitted: 'Ответ на этот вопрос уже засчитан.',
    host_only: 'Это может сделать только ведущий комнаты.',
    invalid_nickname: 'Ник не подходит: 2–16 букв или цифр, без плохих слов.',
    invalid_request: 'Игра отправила странный запрос. Обнови приложение и попробуй еще раз.',
    no_active_round: 'В комнате сейчас нет раунда.',
    no_questions: 'Вопросы для этой сложности пока не готовы. Попробуй позже.',
    not_enough_players: 'Для битвы нужно минимум два игрока.',
    not_room_member: 'Ты больше не в этой комнате. Зайди снова по коду.',
    players_not_ready: 'Не все игроки готовы.',
    question_not_open: 'Этот вопрос еще не начался.',
    question_not_in_round: 'Этот вопрос не из текущего раунда.',
    rate_limited: 'Слишком много попыток. Подожди минутку.',
    room_closed: 'Эта комната больше не принимает игроков.',
    room_full: 'Комната заполнена.',
    room_in_progress: 'В комнате уже идет битва.',
    room_not_found: 'Комната с таким кодом не найдена.',
    round_not_found: 'Раунд не найден.',
    round_over: 'Время раунда вышло.',
    server_error: 'На сервере что-то пошло не так. Попробуй еще раз.',
    unauthorized: 'Срок действия сессии истек. Попробуй еще раз.',
  },
} as const satisfies Record<AppLocale, Record<ApiErrorCode, string>>;
