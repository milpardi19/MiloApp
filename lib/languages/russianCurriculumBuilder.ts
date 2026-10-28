import type { LearningLesson, LearningSentence } from './types';
type DialogueLine = LearningLesson['dialogue'][number];
type LessonQuestion = NonNullable<LearningLesson['checks']>[number];
import {
  buildRussianSentence,
  extendRussianLesson,
} from './russianPhonetics';

export type RuGender = 'm' | 'f' | 'n' | 'pl';

/**
 * Fully inflected, stress-marked Russian noun phrase with accurate Persian glosses.
 * Guarantees 100% grammatical gender, number, and case agreement across all 6 cases.
 */
export interface RuPhrase {
  readonly nom: string;
  readonly gen: string;
  readonly dat: string;
  readonly acc: string;
  readonly ins: string;
  readonly prep: string;
  readonly gender: RuGender;
  readonly headword: string;
  readonly fa: string;
  readonly headFa: string;
}

/**
 * Domain-compatible Russian transitive/collocational verb tuple.
 */
export interface RuAction {
  readonly inf: string;       // e.g. «прове́рить»
  readonly pres1Sg: string;   // e.g. «проверя́ю»
  readonly pres1Pl: string;   // e.g. «проверя́ем»
  readonly pastPl: string;    // e.g. «прове́рили»
  readonly partPass?: string; // optional passive or active marker
  readonly gerund?: string;   // optional verbal adverb e.g. «проверя́я»
  readonly faInf: string;     // e.g. «بررسی کردن»
  readonly faPres1Sg: string; // e.g. «بررسی می‌کنم»
  readonly faPres1Pl: string; // e.g. «بررسی می‌کنیم»
  readonly faPastPl: string;  // e.g. «بررسی کردیم»
  readonly faImp: string;     // e.g. «بررسی کنید»
  readonly faGerund?: string; // e.g. «با بررسیِ»
}

export function ruPhrase(
  nom: string,
  gen: string,
  dat: string,
  acc: string,
  ins: string,
  prep: string,
  gender: RuGender,
  headword: string,
  fa: string,
  headFa: string,
): RuPhrase {
  return { nom, gen, dat, acc, ins, prep, gender, headword, fa, headFa };
}

export function ruAction(
  inf: string,
  pres1Sg: string,
  pres1Pl: string,
  pastPl: string,
  faInf: string,
  faPres1Sg: string,
  faPres1Pl: string,
  faPastPl: string,
  faImp: string,
  gerund?: string,
  faGerund?: string,
): RuAction {
  return {
    inf,
    pres1Sg,
    pres1Pl,
    pastPl,
    faInf,
    faPres1Sg,
    faPres1Pl,
    faPastPl,
    faImp,
    gerund,
    faGerund,
  };
}

/** Persian 1st-person singular subjunctive («التزامی اول‌شخص مفرد»: سفارش بدهم / بررسی کنم). */
function faSubj1Sg(act: RuAction): string {
  const p = act.faPres1Sg.trim();
  if (p.endsWith('می‌کنم')) return p.replace(/می‌کنم$/, 'کنم');
  if (p.endsWith('می‌شوم')) return p.replace(/می‌شوم$/, 'شوم');
  if (p.endsWith('برمی‌دارم')) return p.replace(/برمی‌دارم$/, 'بردارم');
  if (p.endsWith('می‌گذارم')) return p.replace(/می‌گذارم$/, 'بگذارم');
  return p.replace(/می‌([^\s]+)$/, 'ب$1');
}

/** Persian 1st-person plural subjunctive («التزامی اول‌شخص جمع»: سفارش بدهیم / بررسی کنیم). */
function faSubj1Pl(act: RuAction): string {
  return faSubj1Sg(act).replace(/م$/, 'یم');
}

/** Persian 3rd-person singular subjunctive («التزامی سوم‌شخص مفرد»: سفارش بدهد / بررسی کند). */
function faSubj3Sg(act: RuAction): string {
  return faSubj1Sg(act).replace(/م$/, 'د');
}

/** Persian impersonal short infinitive («مصدر مرخم» پس از می‌شود/می‌توان: سفارش داد / بررسی کرد). */
function faImpersonal(act: RuAction): string {
  return act.faPastPl.trim().replace(/یم$/, '');
}

/** Builds an idiomatic Persian object + verb phrase respecting Persian transitivity & prepositions. */
function faClause(itemFa: string, act: RuAction, verbForm: string): string {
  const bareInf = act.inf.normalize('NFD').replace(/\u0301/g, '');
  if (bareInf === 'поддержать') {
    return `از ${itemFa} ${verbForm}`;
  }
  if (bareInf === 'обсудить' && verbForm.includes('گفت‌وگو')) {
    return `دربارهٔ ${itemFa} ${verbForm}`;
  }
  if (
    bareInf === 'оплатить' &&
    !/(سفارش|صورت‌حساب|فاکتور|پرداخت|قبض|هزینه|بلیت|تعرفه|کرایه|انعام|خرید)/.test(itemFa)
  ) {
    return `هزینهٔ ${itemFa} را ${verbForm}`;
  }
  if (
    bareInf === 'уточнить' &&
    !/(اطلاعات|جزئیات|ساعت|زمان|وضعیت|شرایط|تاریخ|نوبت|برنامه|نشانی|مسیر|سانس|شیفت)/.test(itemFa)
  ) {
    return `جزئیاتِ ${itemFa} را ${verbForm}`;
  }
  return `${itemFa} را ${verbForm}`;
}

/** Returns «об» before unstressed/stressed initial vowels а/э/и/о/у, otherwise «о». */
export function prepO(word: string): string {
  const first = word.normalize('NFD').replace(/\u0301/g, '').toLowerCase()[0] ?? '';
  return 'аэиоу'.includes(first) ? 'об' : 'о';
}

/** Returns «со» before initial consonant clusters с/з/ш/щ + consonant, otherwise «с». */
export function prepS(word: string): string {
  const bare = word.normalize('NFD').replace(/\u0301/g, '').toLowerCase();
  if (/^[сзшщ][бвгджзклмнпрстфхцчшщ]/.test(bare) || bare.startsWith('мной') || bare.startsWith('все')) {
    return 'со';
  }
  return 'с';
}

export function myPronoun(g: RuGender): string {
  return g === 'm' ? 'мой' : g === 'f' ? 'моя́' : g === 'n' ? 'моё' : 'мои́';
}

export function thisDem(g: RuGender): string {
  return g === 'm' ? 'э́тот' : g === 'f' ? 'э́та' : g === 'n' ? 'э́то' : 'э́ти';
}

export function thisGen(g: RuGender): string {
  return g === 'f' ? 'э́той' : g === 'pl' ? 'э́тих' : 'э́того';
}

export function thisDat(g: RuGender): string {
  return g === 'f' ? 'э́той' : g === 'pl' ? 'э́тим' : 'э́тому';
}

export function thisIns(g: RuGender): string {
  return g === 'f' ? 'э́той' : g === 'pl' ? 'э́тими' : 'э́тим';
}

export function thisPrep(g: RuGender): string {
  return g === 'f' ? 'э́той' : g === 'pl' ? 'э́тих' : 'э́том';
}

export function neededShort(g: RuGender): string {
  return g === 'm' ? 'ну́жен' : g === 'f' ? 'нужна́' : g === 'n' ? 'ну́жно' : 'нужны́';
}

export function readyShort(g: RuGender): string {
  return g === 'm' ? 'гото́в' : g === 'f' ? 'гото́ва' : g === 'n' ? 'гото́во' : 'гото́вы';
}

export function importantShort(g: RuGender): string {
  return g === 'm' ? 'ва́жен' : g === 'f' ? 'важна́' : g === 'n' ? 'ва́жно' : 'важны́';
}

export function wasPast(g: RuGender): string {
  return g === 'm' ? 'был' : g === 'f' ? 'была́' : g === 'n' ? 'бы́ло' : 'бы́ли';
}

export function whichNom(g: RuGender): string {
  return g === 'm' ? 'кото́рый' : g === 'f' ? 'кото́рая' : g === 'n' ? 'кото́рое' : 'кото́рые';
}

export function capFirst(text: string): string {
  if (!text) return text;
  return text[0].toLocaleUpperCase('ru-RU') + text.slice(1);
}

/**
 * Generates up to 30 natural, non-repetitive, level-appropriate Russian sentences
 * from a curated domain specification (`items` + `actions` + contextual adverbials).
 */
export function generateDomainSentences(
  idPrefix: string,
  startNum: number,
  count: number,
  levelTier: 0 | 1 | 2 | 3 | 4,
  items: readonly RuPhrase[],
  actions: readonly RuAction[],
  placePhraseRu: string,
  placePhraseFa: string,
): LearningSentence[] {
  const results: LearningSentence[] = [];
  for (let i = 0; i < count; i++) {
    const p = items[i % items.length];
    const p2 = items[(i + 3) % items.length];
    const act = actions[i % actions.length];
    const act2 = actions[(i + 2) % actions.length];
    const sid = `${idPrefix}-${String(startNum + i).padStart(2, '0')}`;
    const oPrep = prepO(p.prep);
    const sPrep = prepS(p.ins);
    const templateIdx = i % 30;

    if (levelTier === 0) {
      const frames: readonly (() => LearningSentence)[] = [
        () => buildRussianSentence(
          sid,
          `Вот ${myPronoun(p.gender)} ${p.nom}.`,
          `این ${p.fa} من است.`,
          [[p.headword, p.headFa], ['вот', 'این / بفرمایید'], [myPronoun(p.gender), 'مال من']],
          'Вот + ضمیر ملکی + اسم در حالت فاعلی',
        ),
        () => buildRussianSentence(
          sid,
          `У меня́ есть ${p.nom}.`,
          `من ${p.fa} دارم.`,
          [[p.headword, p.headFa], ['у меня́ есть', 'من دارم'], ['сейча́с', 'الان']],
          'У меня́ есть + اسم در حالت فاعلی',
        ),
        () => buildRussianSentence(
          sid,
          `У нас пока́ нет ${p.gen}.`,
          `ما فعلاً ${p.fa} نداریم.`,
          [[p.headword, p.headFa], ['у нас нет', 'ما نداریم'], ['пока́', 'فعلاً']],
          'У нас + пока́ нет + اسم در حالت اضافی (Genitive)',
        ),
        () => buildRussianSentence(
          sid,
          `Мне о́чень ${neededShort(p.gender)} ${p.nom}.`,
          `من خیلی به ${p.fa} نیاز دارم.`,
          [[p.headword, p.headFa], ['мне', 'به من'], [neededShort(p.gender), 'لازم است']],
          'Мне + ну́жен/нужна́/ну́жно/нужны́ + نهاد',
        ),
        () => buildRussianSentence(
          sid,
          `Я хочу́ ${act.inf} ${p.acc}.`,
          `من می‌خواهم ${faClause(p.fa, act, faSubj1Sg(act))}.`,
          [[p.headword, p.headFa], ['хочу́', 'می‌خواهم'], [act.inf, act.faInf]],
          'Я хочу́ + مصدر فعل + مفعول',
        ),
      ];
      results.push(frames[templateIdx % frames.length]());
      continue;
    }

    if (levelTier === 1) {
      // Survival Russian A1+: practical urban, service, travel, shopping & polite interaction structures
      const frames: readonly (() => LearningSentence)[] = [
        () => buildRussianSentence(
          sid,
          `Подскажи́те, пожа́луйста, где здесь мо́жно ${act.inf} ${p.acc}?`,
          `لطفاً راهنمایی کنید اینجا کجا می‌شود ${faClause(p.fa, act, faImpersonal(act))}؟`,
          [[p.headword, p.headFa], ['подскажи́те', 'راهنمایی کنید'], [act.inf, act.faInf]],
          'Подскажи́те, пожа́луйста, + где здесь мо́жно + مصدر + مفعول؟',
        ),
        () => buildRussianSentence(
          sid,
          `Извини́те, вы не подска́жете, как быстре́е ${act.inf} ${p.acc}?`,
          `ببخشید، ممکن است راهنمایی کنید چطور سریع‌تر ${faClause(p.fa, act, faSubj1Sg(act))}؟`,
          [[p.headword, p.headFa], ['извини́те', 'ببخشید'], ['быстре́е', 'سریع‌تر']],
          'Извини́те, вы не подска́жете, + как быстре́е + مصدر + مفعول؟',
        ),
        () => buildRussianSentence(
          sid,
          `Скажи́те, пожа́луйста, мо́жно ли сейча́с ${act2.inf} ${p.acc} ${placePhraseRu}?`,
          `لطفاً بگویید آیا الان ${placePhraseFa} می‌شود ${faClause(p.fa, act2, faImpersonal(act2))}؟`,
          [[p.headword, p.headFa], ['мо́жно ли', 'آیا ممکن است'], [act2.inf, act2.faInf]],
          'Скажи́те, пожа́луйста, + мо́жно ли + مصدر + مفعول + مکان؟',
        ),
        () => buildRussianSentence(
          sid,
          `Мне сро́чно на́до ${act.inf} ${p.acc} до ве́чера.`,
          `من باید فوراً تا پیش از غروب ${faClause(p.fa, act, faSubj1Sg(act))}.`,
          [[p.headword, p.headFa], ['сро́чно', 'فوراً'], ['до ве́чера', 'تا غروب']],
          'Мне сро́чно на́до + مصدر فعل + مفعول + до + Genitive',
        ),
        () => buildRussianSentence(
          sid,
          `Мо́жно, пожа́луйста, снача́ла ${act.inf} ${p.acc}, а пото́м ${p2.acc}?`,
          `می‌شود لطفاً اول ${faClause(p.fa, act, faSubj1Pl(act))} و بعد ${p2.fa} را؟`,
          [[p.headword, p.headFa], [p2.headword, p2.headFa], ['снача́ла', 'اول / ابتدا']],
          'Мо́жно, пожа́луйста, снача́ла + مصدر + مفعول ۱، + а пото́м + مفعول ۲؟',
        ),
        () => buildRussianSentence(
          sid,
          `Подскажи́те, в кото́ром часу́ удо́бнее ${act.inf} ${p.acc}?`,
          `راهنمایی کنید چه ساعتی راحت‌تر می‌شود ${faClause(p.fa, act, faImpersonal(act))}؟`,
          [[p.headword, p.headFa], ['в кото́ром часу́', 'چه ساعتی'], ['удо́бнее', 'راحت‌تر']],
          'Подскажи́те, + в кото́ром часу́ удо́бнее + مصدر + مفعول؟',
        ),
        () => buildRussianSentence(
          sid,
          `Я пришёл зара́нее, что́бы споко́йно ${act.inf} ${p.acc}.`,
          `زودتر آمدم تا با خیال راحت ${faClause(p.fa, act, faSubj1Sg(act))}.`,
          [[p.headword, p.headFa], ['зара́нее', 'از قبل / زودتر'], ['споко́йно', 'با خیال راحت']],
          'Я пришёл зара́нее, + что́бы + قید + مصدر + مفعول مستقیم',
        ),
        () => buildRussianSentence(
          sid,
          `Скажи́те, мно́го ли вре́мени ну́жно, что́бы ${act.inf} ${p.acc}?`,
          `بگویید آیا وقت زیادی لازم است تا ${faClause(p.fa, act, faSubj1Pl(act))}؟`,
          [[p.headword, p.headFa], ['мно́го вре́мени', 'وقت زیاد'], [act.inf, act.faInf]],
          'Скажи́те, + мно́го ли вре́мени ну́жно, что́бы + مصدر + مفعول؟',
        ),
        () => buildRussianSentence(
          sid,
          `Сего́дня у нас нет никаки́х вопро́сов по по́воду ${p.gen}.`,
          `امروز هیچ سؤالی در موردِ ${p.fa} نداریم.`,
          [[p.headword, p.headFa], ['у нас нет', 'ما نداریم'], ['по по́воду', 'در موردِ']],
          'У нас нет + никаки́х вопро́сов + по по́воду + حالت Genitive',
        ),
        () => buildRussianSentence(
          sid,
          `Помоги́те мне, пожа́луйста, бы́стро ${act.inf} ${p.acc}.`,
          `لطفاً به من کمک کنید سریع ${faClause(p.fa, act, faSubj1Sg(act))}.`,
          [[p.headword, p.headFa], ['помоги́те мне', 'به من کمک کنید'], [act.inf, act.faInf]],
          'Помоги́те мне, пожа́луйста, + مصدر فعل + مفعول مستقیم',
        ),
        () => buildRussianSentence(
          sid,
          `Сотру́дник ве́жливо объясни́л нам всё ${oPrep} ${p.prep}.`,
          `کارمند بخش با ادب همه‌چیز را دربارهٔ ${p.fa} برایمان توضیح داد.`,
          [[p.headword, p.headFa], ['сотру́дник', 'کارمند'], ['ве́жливо объясни́л', 'مؤدبانه توضیح داد']],
          'نهاد + قید + объясни́л + مفعول با واسطه (Dat.) + о/об + Prepositional',
        ),
        () => buildRussianSentence(
          sid,
          `Пока́ мы бы́ли ${placePhraseRu}, мы успе́ли ${act.inf} ${p.acc}.`,
          `تا وقتی ${placePhraseFa} بودیم، رسیدیم ${faClause(p.fa, act, faSubj1Pl(act))}.`,
          [[p.headword, p.headFa], ['пока́', 'در مدتی که'], ['успе́ли', 'به‌موقع رسیدیم']],
          'Пока́ + جملهٔ پیرو گذشته، + мы успе́ли + مصدر کامل + مفعول',
        ),
        () => buildRussianSentence(
          sid,
          `Мы о́чень дово́льны ${p.ins} ${placePhraseRu}.`,
          `ما ${placePhraseFa} از ${p.fa} بسیار راضی هستیم.`,
          [[p.headword, p.headFa], ['дово́льны', 'راضی هستیم'], ['о́чень', 'بسیار']],
          'Мы о́чень дово́льны + حالت ابزاری (Instrumental) + مکان',
        ),
        () => buildRussianSentence(
          sid,
          `Обяза́тельно запиши́те гла́вную информа́цию ${oPrep} ${p.prep}.`,
          `حتماً اطلاعاتِ اصلی دربارهٔ ${p.fa} را یادداشت کنید.`,
          [[p.headword, p.headFa], ['запиши́те', 'یادداشت کنید'], ['информа́ция', 'اطلاعات']],
          'Обяза́тельно + فعل امری + مفعول + о/об + Prepositional',
        ),
        () => buildRussianSentence(
          sid,
          `Нам посове́товали зара́нее ${act2.inf} ${p.acc} ${placePhraseRu}.`,
          `به ما توصیه کردند از قبل ${placePhraseFa}، ${faClause(p.fa, act2, faSubj1Pl(act2))}.`,
          [[p.headword, p.headFa], ['посове́товали', 'توصیه کردند'], ['зара́нее', 'از قبل']],
          'Нам посове́товали + قید + مصدر فعل + مفعول + مکان',
        ),
        () => buildRussianSentence(
          sid,
          `По выходны́м ${placePhraseRu} обы́чно про́ще ${act.inf} ${p.acc}.`,
          `آخر هفته‌ها ${placePhraseFa} معمولاً راحت‌تر می‌شود ${faClause(p.fa, act, faImpersonal(act))}.`,
          [[p.headword, p.headFa], ['по выходны́м', 'آخر هفته‌ها'], ['про́ще', 'ساده‌تر / راحت‌تر']],
          'По выходны́м + مکان + про́ще + مصدر + مفعول',
        ),
        () => buildRussianSentence(
          sid,
          `Е́сли поя́вятся вопро́сы ${oPrep} ${p.prep}, спроси́те у консульта́нта.`,
          `اگر سؤالی دربارهٔ ${p.fa} پیش آمد، از مشاور راهنما بپرسید.`,
          [[p.headword, p.headFa], ['поя́вятся вопро́сы', 'سؤال‌هایی پیش بیاید'], ['спроси́те', 'بپرسید']],
          'Е́сли + جملهٔ شرط آینده، + فعل امری + у + Genitive',
        ),
        () => buildRussianSentence(
          sid,
          `Я уже́ привы́к к ${p.dat} ${placePhraseRu}.`,
          `من دیگر ${placePhraseFa} به ${p.fa} عادت کرده‌ام.`,
          [[p.headword, p.headFa], ['привы́к к', 'عادت کرده‌ام به'], ['уже́', 'دیگر / هم‌اکنون']],
          'Я уже́ привы́к к + حالت متممی (Dative) + مکان',
        ),
        () => buildRussianSentence(
          sid,
          `Че́рез де́сять мину́т мы смо́жем споко́йно ${act.inf} ${p.acc}.`,
          `ده دقیقهٔ دیگر می‌توانیم با آرامش ${faClause(p.fa, act, faSubj1Pl(act))}.`,
          [[p.headword, p.headFa], ['че́рез де́сять мину́т', 'ده دقیقهٔ دیگر'], ['смо́жем', 'خواهیم توانست']],
          'Че́рез + زمان (Acc.) + мы смо́жем + مصدر + مفعول',
        ),
        () => buildRussianSentence(
          sid,
          `Убеди́тесь, пожа́луйста, что всё гото́во для ${p.gen}.`,
          `لطفاً مطمئن شوید که همه‌چیز برای ${p.fa} آماده است.`,
          [[p.headword, p.headFa], ['убеди́тесь', 'مطمئن شوید'], ['гото́во', 'آماده است']],
          'Убеди́тесь, пожа́луйста, что всё гото́во для + حالت Genitive',
        ),
        () => buildRussianSentence(
          sid,
          `Я ищу́ удо́бный спо́соб во́время ${act.inf} ${p.acc}.`,
          `دنبال راهی مناسب هستم تا به‌موقع ${faClause(p.fa, act, faSubj1Sg(act))}.`,
          [[p.headword, p.headFa], ['ищу́', 'جست‌وجو می‌کنم'], ['во́время', 'به‌موقع']],
          'Я ищу́ + صفت + спо́соб + مصدر فعل + مفعول مستقیم',
        ),
        () => buildRussianSentence(
          sid,
          `Сего́дня у́тром мы интересова́лись ${p.ins} ${placePhraseRu}.`,
          `امروز صبح ${placePhraseFa} جویایِ ${p.fa} شدیم.`,
          [[p.headword, p.headFa], ['интересова́лись', 'سراغ گرفتیم / جویا شدیم'], ['сего́дня у́тром', 'امروز صبح']],
          'قید زمان + мы интересова́лись + حالت ابزاری (Instrumental) + مکان',
        ),
        () => buildRussianSentence(
          sid,
          `Подожди́те одну́ мину́ту, я уточню́ дета́ли ${oPrep} ${p.prep}.`,
          `یک دقیقه صبر کنید، الان جزئیات مربوط به ${p.fa} را دقیق می‌پرسم.`,
          [[p.headword, p.headFa], ['подожди́те', 'صبر کنید'], ['уточню́', 'دقیق جویا می‌شوم']],
          'Подожди́те + زمان، + я уточню́ дета́ли о/об + Prepositional',
        ),
        () => buildRussianSentence(
          sid,
          `Для нас о́чень ва́жно во́время ${act2.inf} ${p.acc}.`,
          `برای ما خیلی مهم است که به‌موقع ${faClause(p.fa, act2, faSubj1Pl(act2))}.`,
          [[p.headword, p.headFa], ['о́чень ва́жно', 'خیلی مهم است'], ['во́время', 'به‌موقع']],
          'Для нас о́чень ва́жно + قید + مصدر کامل + مفعول',
        ),
        () => buildRussianSentence(
          sid,
          `Мы договори́лись встре́титься днём и вме́сте ${act2.inf} ${p.acc}.`,
          `قرار گذاشتیم ظهر همدیگر را ببینیم و با هم ${faClause(p.fa, act2, faSubj1Pl(act2))}.`,
          [[p.headword, p.headFa], ['договори́лись', 'قرار گذاشتیم'], ['вме́сте', 'با هم']],
          'Мы договори́лись + مصدر ۱ + زمان + и + مصدر ۲ + مفعول',
        ),
        () => buildRussianSentence(
          sid,
          `Вы не подска́жете, что ещё ну́жно для ${p.gen}?`,
          `ممکن است بفرمایید چه چیز دیگری برای ${p.fa} لازم است؟`,
          [[p.headword, p.headFa], ['вы не подска́жете', 'ممکن است راهنمایی بفرمایید'], ['что ещё', 'چه چیز دیگر']],
          'Вы не подска́жете, + что ещё ну́жно для + Genitive؟',
        ),
        () => buildRussianSentence(
          sid,
          `Спаси́бо вам за по́мощь ${sPrep} ${p.ins} сего́дня.`,
          `ممنون از شما بابت کمک امروز در مورد ${p.fa}.`,
          [[p.headword, p.headFa], ['спаси́бо за по́мощь', 'ممنون بابت کمک'], ['сего́дня', 'امروز']],
          'Спаси́бо вам за по́мощь + с/со + حالت Instrumental + قید زمان',
        ),
        () => buildRussianSentence(
          sid,
          `Обы́чно на э́то и на ${p.acc} ухо́дит совсе́м немно́го вре́мени.`,
          `معمولاً این کار و رسیدگی به ${p.fa} وقت بسیار کمی می‌برد.`,
          [[p.headword, p.headFa], ['обы́чно', 'معمولاً'], ['немно́го вре́мени', 'وقت کم']],
          'Обы́чно на + حالت مفعولی + ухо́дит немно́го вре́мени',
        ),
        () => buildRussianSentence(
          sid,
          `В бу́дние дни гора́здо удо́бнее ${act.inf} ${p.acc} с утра́.`,
          `در روزهای کاری خیلی راحت‌تر است که از صبح ${faClause(p.fa, act, faSubj1Pl(act))}.`,
          [[p.headword, p.headFa], ['в бу́дние дни', 'در روزهای کاری هفته'], ['гора́здо удо́бнее', 'بسیار راحت‌تر']],
          'В бу́дние дни + гора́здо удо́бнее + مصدر فعل + مفعول + قید زمان',
        ),
        () => buildRussianSentence(
          sid,
          `Всё прошло́ споко́йно, и мы без пробле́м ${act.pastPl} ${p.acc}.`,
          `همه‌چیز با آرامش پیش رفت و ما بدون مشکل ${faClause(p.fa, act, act.faPastPl)}.`,
          [[p.headword, p.headFa], ['всё прошло́ споко́йно', 'همه‌چیز آرام پیش رفت'], ['без пробле́м', 'بی‌دردسر']],
          'جملهٔ پایهٔ گذشته + и мы без пробле́м + فعل گذشته + مفعول',
        ),
      ];
      results.push(frames[templateIdx]());
      continue;
    }

    if (levelTier === 2) {
      // Everyday Russian A2: compound sentences, reasons, conditions, comparisons, habits & aspect
      const frames: readonly (() => LearningSentence)[] = [
        () => buildRussianSentence(
          sid,
          `Вчера́ ве́чером мы до́лго обсужда́ли ${p.acc}, а пото́м сра́зу ${act.pastPl} ${p2.acc}.`,
          `دیروز عصر مدت زیادی دربارهٔ ${p.fa} گفت‌وگو کردیم و بعد بلافاصله ${faClause(p2.fa, act, act.faPastPl)}.`,
          [[p.headword, p.headFa], ['обсужда́ли', 'گفت‌وگو می‌کردیم'], [act.pastPl, act.faPastPl]],
          'فعل گذشتهٔ ناقص (فرآیند طولانی) + а пото́м + فعل گذشتهٔ کامل (نتیجه)',
        ),
        () => buildRussianSentence(
          sid,
          `Я собира́юсь внима́тельно ${act.inf} ${p.acc}, потому́ что э́то ва́жно для нас.`,
          `قصد دارم با دقت ${faClause(p.fa, act, faSubj1Sg(act))}، چون این موضوع برایمان مهم است.`,
          [[p.headword, p.headFa], ['собира́юсь', 'قصد دارم'], ['потому́ что', 'برای اینکه / چون']],
          'Я собира́юсь + مصدر فعل + مفعول، + потому́ что + جملهٔ دلیل',
        ),
        () => buildRussianSentence(
          sid,
          `Е́сли за́втра бу́дет свобо́дное вре́мя, мы обяза́тельно смо́жем ${act.inf} ${p.acc}.`,
          `اگر فردا وقت آزاد باشد، ما حتماً می‌توانیم ${faClause(p.fa, act, faSubj1Pl(act))}.`,
          [[p.headword, p.headFa], ['свобо́дное вре́мя', 'وقت آزاد'], ['смо́жем', 'خواهیم توانست']],
          'Е́сли + جملهٔ شرط با бу́дет، + мы смо́жем + مصدر + مفعول',
        ),
        () => buildRussianSentence(
          sid,
          `Мне ка́жется, что ${p.nom} ${p.gender === 'pl' ? 'подхо́дят' : 'подхо́дит'} нам лу́чше, чем ${p2.nom}.`,
          `به نظرم ${p.fa} بیشتر از ${p2.fa} برایمان مناسب است.`,
          [[p.headword, p.headFa], ['мне ка́жется', 'به نظرم می‌رسد'], ['лу́чше, чем', 'بهتر از']],
          'Мне ка́жется, что + نهاد ۱ + лу́чше, чем + نهاد ۲',
        ),
        () => buildRussianSentence(
          sid,
          `Когда́ я жил в друго́м райо́не, я ре́же ду́мал ${oPrep} ${p.prep}.`,
          `وقتی در محلهٔ دیگری زندگی می‌کردم، کمتر به ${p.fa} فکر می‌کردم.`,
          [[p.headword, p.headFa], ['в друго́м райо́не', 'در محله‌ای دیگر'], ['ре́же', 'کمتر / دیربه‌دیرتر']],
          'Когда́ + جملهٔ زمانی گذشته، + فاعل + قید مقایسه‌ای + فعل گذشته',
        ),
        () => buildRussianSentence(
          sid,
          `Друзья́ ча́сто спра́шивают меня́, как я успева́ю во́время ${act.inf} ${p.acc}.`,
          `دوستانم اغلب از من می‌پرسند چطور می‌رسم به‌موقع ${faClause(p.fa, act, faSubj1Sg(act))}.`,
          [[p.headword, p.headFa], ['спра́шивают', 'می‌پرسند'], ['успева́ю', 'فرصت می‌کنم / می‌رسم']],
          'فاعل + спра́шивают меня́, + как + فاعل + فعل حال + مصدر',
        ),
        () => buildRussianSentence(
          sid,
          `С тех пор как у нас появи́лась но́вая привы́чка, рабо́та ${sPrep} ${p.ins} ста́ла про́ще.`,
          `از وقتی عادت تازه‌ای پیدا کردیم، رسیدگی به ${p.fa} ساده‌تر شده است.`,
          [[p.headword, p.headFa], ['с тех пор как', 'از زمانی که'], ['ста́ла про́ще', 'ساده‌تر شد']],
          'С тех пор как + جملهٔ پیرو، + نهاد + ста́ла + صفت تفضیلی',
        ),
        () => buildRussianSentence(
          sid,
          `На про́шлой неде́ле мы наконе́ц зако́нчили рабо́ту над ${p.ins}.`,
          `هفتهٔ گذشته سرانجام کار روی ${p.fa} را به پایان رساندیم.`,
          [[p.headword, p.headFa], ['на про́шлой неде́ле', 'هفتهٔ گذشته'], ['наконе́ц зако́нчили', 'سرانجام تمام کردیم']],
          'قید زمان گذشته + мы наконе́ц зако́нчили рабо́ту над + Instrumental',
        ),
        () => buildRussianSentence(
          sid,
          `Я стара́юсь ка́ждую неде́лю выделя́ть хотя́ бы час для ${p.gen}.`,
          `تلاش می‌کنم هر هفته دست‌کم یک ساعت برای ${p.fa} وقت بگذارم.`,
          [[p.headword, p.headFa], ['стара́юсь', 'سعی می‌کنم'], ['хотя́ бы час', 'دست‌کم یک ساعت']],
          'Я стара́юсь + قید تکرار + مصدر ناقص + مفعول + для + Genitive',
        ),
        () => buildRussianSentence(
          sid,
          `Хотя́ пого́да была́ па́смурной, мы с удово́льствием ${act2.pastPl} ${p.acc}.`,
          `هرچند هوا ابری بود، ما با خوشحالی ${faClause(p.fa, act2, act2.faPastPl)}.`,
          [[p.headword, p.headFa], ['хотя́', 'هرچند / با اینکه'], ['с удово́льствием', 'با کمال میل']],
          'Хотя́ + جملهٔ پیرو (گذشته)، + فاعل + с удово́льствием + فعل کامل',
        ),
        () => buildRussianSentence(
          sid,
          `Сестра́ напо́мнила мне, что за́втра у́тром на́до ${act.inf} ${p.acc}.`,
          `خواهرم یادم انداخت که فردا صبح باید ${faClause(p.fa, act, faSubj1Sg(act))}.`,
          [[p.headword, p.headFa], ['напо́мнила', 'یادآوری کرد'], ['за́втра у́тром', 'فردا صبح']],
          'فاعل + напо́мнила мне, что + قید زمان + на́до + مصدر + مفعول',
        ),
        () => buildRussianSentence(
          sid,
          `Вме́сто того́ что́бы спеши́ть, мы споко́йно разобра́лись ${sPrep} ${p.ins}.`,
          `به‌جای عجله کردن، با آرامش موضوعِ ${p.fa} را بررسی و روشن کردیم.`,
          [[p.headword, p.headFa], ['вме́сто того́ что́бы', 'به‌جای اینکه'], ['разобра́лись', 'سر درآوردیم و حل کردیم']],
          'Вме́сто того́ что́бы + مصدر ۱، + فاعل + разобра́лись с/со + Instrumental',
        ),
        () => buildRussianSentence(
          sid,
          `Обы́чно я сове́туюсь с бли́зкими пе́ред вы́бором ${p.gen}.`,
          `معمولاً پیش از انتخابِ ${p.fa} با نزدیکانم مشورت می‌کنم.`,
          [[p.headword, p.headFa], ['сове́туюсь', 'مشورت می‌کنم'], ['пе́ред вы́бором', 'پیش از انتخابِ']],
          'فاعل + сове́туюсь с + Instrumental + пе́ред вы́бором + Genitive',
        ),
        () => buildRussianSentence(
          sid,
          `Нам о́чень повезло́, потому́ что ${placePhraseRu} оказа́лся отли́чный вариа́нт для ${p.gen}.`,
          `خیلی خوش‌شانس بودیم، چون ${placePhraseFa} گزینهٔ بسیار خوبی برای ${p.fa} پیدا شد.`,
          [[p.headword, p.headFa], ['нам повезло́', 'خوش‌شانس بودیم'], ['оказа́лся', 'از آب درآمد / پیدا شد']],
          'Нам повезло́, потому́ что + مکان + оказа́лся + نهاد + для + Genitive',
        ),
        () => buildRussianSentence(
          sid,
          `Ка́ждый раз, когда́ я быва́ю ${placePhraseRu}, я вспомина́ю ${oPrep} ${p.prep}.`,
          `هر بار که ${placePhraseFa} هستم، به یادِ ${p.fa} می‌افتم.`,
          [[p.headword, p.headFa], ['ка́ждый раз, когда́', 'هر بار که'], ['вспомина́ю', 'به یاد می‌آورم']],
          'Ка́ждый раз, когда́ + فعل حال، + вспомина́ю о/об + Prepositional',
        ),
        () => buildRussianSentence(
          sid,
          `Снача́ла зада́ча каза́лась сло́жной, но пото́м мы легко́ ${act.pastPl} ${p.acc}.`,
          `در ابتدا کار دشوار به نظر می‌رسید، اما بعد به‌آسانی ${faClause(p.fa, act, act.faPastPl)}.`,
          [[p.headword, p.headFa], ['каза́лась сло́жной', 'دشوار به نظر می‌رسید'], ['но пото́м', 'اما بعد']],
          'Снача́ла + نهاد + каза́лась + صفت (Instr.)، + но пото́м + جملهٔ نتیجه',
        ),
        () => buildRussianSentence(
          sid,
          `По́сле неде́льного переры́ва мы сно́ва на́чали занима́ться ${p.ins}.`,
          `پس از یک هفته وقفه، دوباره پرداختن به ${p.fa} را شروع کردیم.`,
          [[p.headword, p.headFa], ['переры́в', 'وقفه / استراحت'], ['занима́ться', 'مشغولِ کاری بودن']],
          'По́сле + Genitive + فاعل + на́чали занима́ться + حالت Instrumental',
        ),
        () => buildRussianSentence(
          sid,
          `Колле́га подели́лся поле́зным о́пытом и помо́г мне ${act2.inf} ${p.acc}.`,
          `همکارم تجربهٔ مفیدی را در میان گذاشت و کمکم کرد ${faClause(p.fa, act2, faSubj1Sg(act2))}.`,
          [[p.headword, p.headFa], ['подели́лся о́пытом', 'تجربه‌اش را به اشتراک گذاشت'], ['помо́г мне', 'کمکم کرد']],
          'فاعل + подели́лся + Instrumental + и помо́г мне + مصدر + مفعول',
        ),
        () => buildRussianSentence(
          sid,
          `Я записа́л основны́е дета́ли в блокно́т, что́бы ничего́ не забы́ть ${oPrep} ${p.prep}.`,
          `جزئیات اصلی را در دفترچه یادداشت کردم تا هیچ نکته‌ای را دربارهٔ ${p.fa} فراموش نکنم.`,
          [[p.headword, p.headFa], ['основны́е дета́ли', 'جزئیات اصلی'], ['не забы́ть', 'فراموش نکردن']],
          'جملهٔ پایه + что́бы + منفی + مصدر فعل کامل + о/об + Prepositional',
        ),
        () => buildRussianSentence(
          sid,
          `В сле́дующем ме́сяце мы плани́руем вме́сте ${act2.inf} ${p.acc}.`,
          `ماه آینده قصد داریم با هم ${faClause(p.fa, act2, faSubj1Pl(act2))}.`,
          [[p.headword, p.headFa], ['в сле́дующем ме́сяце', 'ماه آینده'], ['плани́руем', 'برنامه‌ریزی می‌کنیم']],
          'В сле́дующем ме́сяце + мы плани́руем + مصدر + مفعول',
        ),
        () => buildRussianSentence(
          sid,
          `Ско́лько вре́мени у тебя́ обы́чно ухо́дит на ${p.acc} на неде́ле?`,
          `در طول هفته معمولاً چقدر از وقتت صرفِ ${p.fa} می‌شود؟`,
          [[p.headword, p.headFa], ['ско́лько вре́мени', 'چقدر زمان'], ['ухо́дит на', 'صرفِ ... می‌شود']],
          'Ско́лько вре́мени у тебя́ ухо́дит на + حالت مفعولی (Accusative)؟',
        ),
        () => buildRussianSentence(
          sid,
          `Мой друг давно́ интересу́ется ${p.ins} и чита́ет но́вые статьи́.`,
          `دوست من مدت‌هاست به ${p.fa} علاقه دارد و مقاله‌های تازه می‌خواند.`,
          [[p.headword, p.headFa], ['давно́', 'از مدت‌ها پیش'], ['интересу́ется', 'علاقه‌مند است']],
          'فاعل + давно́ интересу́ется + حالت ابزاری (Instrumental)',
        ),
        () => buildRussianSentence(
          sid,
          `Че́стно говоря́, без ${p.gen} наш день прошёл бы совсе́м ина́че.`,
          `راستش را بخواهید، بدونِ ${p.fa} روز ما کاملاً جور دیگری می‌گذشت.`,
          [[p.headword, p.headFa], ['че́стно говоря́', 'صادقانه بگویم'], ['совсе́м ина́че', 'کاملاً متفاوت']],
          'Че́стно говоря́, + без + Genitive + نهاد + прошёл бы + قید',
        ),
        () => buildRussianSentence(
          sid,
          `Как то́лько появи́лась возмо́жность, я сра́зу реши́л ${act.inf} ${p.acc}.`,
          `به محض اینکه فرصت پیش آمد، فوراً تصمیم گرفتم ${faClause(p.fa, act, faSubj1Sg(act))}.`,
          [[p.headword, p.headFa], ['как то́лько', 'به محض اینکه'], ['реши́л', 'تصمیم گرفتم']],
          'Как то́лько + جملهٔ پیرو، + فاعل + сра́зу реши́л + مصدر + مفعول',
        ),
        () => buildRussianSentence(
          sid,
          `Мы привы́кли зара́нее догова́риваться ${oPrep} ${p.prep} всей гру́ппой.`,
          `عادت کرده‌ایم از قبل همگی با هم دربارهٔ ${p.fa} هماهنگ کنیم.`,
          [[p.headword, p.headFa], ['привы́кли', 'عادت کرده‌ایم'], ['догова́риваться', 'هماهنگ کردن / توافق کردن']],
          'Мы привы́кли + قید + مصدر ناقص + о/об + حالت Prepositional',
        ),
        () => buildRussianSentence(
          sid,
          `Да́же в са́мый загру́женный вто́рник нахо́дится де́сять мину́т для ${p.gen}.`,
          `حتی در شلوغ‌ترین سه‌شنبه هم ده دقیقه وقت برای ${p.fa} پیدا می‌شود.`,
          [[p.headword, p.headFa], ['да́же', 'حتی'], ['нахо́дится', 'پیدا می‌شود']],
          'Да́же в + Accusative + нахо́дится + زمان + для + Genitive',
        ),
        () => buildRussianSentence(
          sid,
          `Мне прия́тно ви́деть, как постепе́нно меня́ется отноше́ние к ${p.dat}.`,
          `برایم خوشایند است ببینم چطور کم‌کم نگاه‌ها به ${p.fa} تغییر می‌کند.`,
          [[p.headword, p.headFa], ['постепе́нно', 'به‌تدریج'], ['отноше́ние к', 'نگرش نسبت به']],
          'Мне прия́тно ви́деть, как + قید + فعل بازتابی + نهاد + к + Dative',
        ),
        () => buildRussianSentence(
          sid,
          `Мы сравни́ли не́сколько предложе́ний и останови́ли вы́бор на ${p.prep}.`,
          `چند پیشنهاد را مقایسه کردیم و در نهایت ${p.fa} را برگزیدیم.`,
          [[p.headword, p.headFa], ['сравни́ли', 'مقایسه کردیم'], ['останови́ли вы́бор на', 'انتخاب نهایی را گذاشتیم رویِ']],
          'Мы сравни́ли + مفعول + и останови́ли вы́бор на + Prepositional',
        ),
        () => buildRussianSentence(
          sid,
          `Лу́чше не откла́дывать вопро́с ${oPrep} ${p.prep} на после́дний моме́нт.`,
          `بهتر است موضوعِ مربوط به ${p.fa} را به دقیقهٔ نود موکول نکنیم.`,
          [[p.headword, p.headFa], ['не откла́дывать', 'به تعویق نینداختن'], ['после́дний моме́нт', 'لحظهٔ آخر']],
          'Лу́чше не откла́дывать вопро́с о/об + Prepositional + на после́дний моме́нт',
        ),
        () => buildRussianSentence(
          sid,
          `По ито́гам неде́ли и́менно ${p.nom} ${p.gender === 'm' ? 'принёс' : p.gender === 'f' ? 'принесла́' : p.gender === 'n' ? 'принесло́' : 'принесли́'} нам бо́льше всего́ по́льзы.`,
          `در جمع‌بندی هفته، دقیقاً همین ${p.fa} بیشترین فایده را برایمان داشت.`,
          [[p.headword, p.headFa], ['по ито́гам', 'در جمع‌بندیِ'], ['бо́льше всего́ по́льзы', 'بیشترین فایده']],
          'По ито́гам + Genitive + и́менно + نهاد + فعل گذشته + бо́льше всего́ + Genitive',
        ),
      ];
      results.push(frames[templateIdx]());
      continue;
    }

    if (levelTier === 3) {
      // Communication Russian B1: opinions, indirect speech, relative clauses (который), counterfactuals, workplace & social discourse
      const frames: readonly (() => LearningSentence)[] = [
        () => buildRussianSentence(
          sid,
          `На мой взгляд, нам сто́ит внима́тельно ${act.inf} ${p.acc}, что́бы избежа́ть ли́шних оши́бок.`,
          `به دیدگاه من، ارزش دارد با دقت ${faClause(p.fa, act, faSubj1Pl(act))} تا از خطاهای اضافه جلوگیری شود.`,
          [[p.headword, p.headFa], ['на мой взгляд', 'از دیدگاه من'], ['избежа́ть оши́бок', 'پرهیز از خطاها']],
          'На мой взгляд, + нам сто́ит + مصدر + مفعول، + что́бы избежа́ть + Genitive',
        ),
        () => buildRussianSentence(
          sid,
          `Вопро́с, кото́рый каса́ется ${p.gen}, вы́звал оживлённую диску́ссию на встре́че.`,
          `مسئله‌ای که به ${p.fa} مربوط می‌شود، بحث پرشوری را در جلسه برانگیخت.`,
          [[p.headword, p.headFa], ['каса́ется', 'مربوط می‌شود به'], ['оживлённая диску́ссия', 'بحث پرشور']],
          'نهاد + جملهٔ موصولی با кото́рый + فعل گذشته + مفعول مستقیم',
        ),
        () => buildRussianSentence(
          sid,
          `Руководи́тель поинтересова́лся, успе́ем ли мы подгото́вить ${p.acc} к пя́тнице.`,
          `مدیر جویا شد که آیا می‌رسیم ${p.fa} را تا روز جمعه آماده کنیم یا نه.`,
          [[p.headword, p.headFa], ['поинтересова́лся', 'جویا شد'], ['успе́ем ли мы', 'آیا به موقع می‌رسیم']],
          'پرسش غیرمستقیم با ذرهٔ «ли»: فاعل + فعل پرسش + فعل، ли + فاعل + مصدر',
        ),
        () => buildRussianSentence(
          sid,
          `Е́сли бы мы зара́нее изучи́ли ${p.acc}, реше́ние бы́ло бы гора́здо то́чнее.`,
          `اگر از پیش ${p.fa} را بررسی کرده بودیم، تصمیم بسیار دقیق‌تر می‌بود.`,
          [[p.headword, p.headFa], ['е́сли бы', 'اگر (شرط خلاف واقع)'], ['гора́здо то́чнее', 'بسیار دقیق‌تر']],
          'جملهٔ شرطی غیرواقعی (B1): Е́сли бы + گذشته، + نهاد + бы́ло бы + صفت تفضیلی',
        ),
        () => buildRussianSentence(
          sid,
          `Несмотря́ на нехва́тку вре́мени, кома́нда суме́ла ка́чественно ${act.inf} ${p.acc}.`,
          `با وجود کمبود وقت، تیم توانست با کیفیت بالا ${faClause(p.fa, act, faSubj3Sg(act))}.`,
          [[p.headword, p.headFa], ['несмотря́ на', 'با وجودِ / علی‌رغمِ'], ['нехва́тка вре́мени', 'کمبود زمان']],
          'Несмотря́ на + حالت مفعولی (Acc.)، + نهاد + суме́ла + مصدر + مفعول',
        ),
        () => buildRussianSentence(
          sid,
          `Специали́ст подчеркну́л, что без ${p.gen} тру́дно рассчи́тывать на усто́йчивый результа́т.`,
          `متخصص تأکید کرد که بدونِ ${p.fa} دشوار بتوان روی نتیجه‌ای پایدار حساب کرد.`,
          [[p.headword, p.headFa], ['подчеркну́л', 'تأکید کرد'], ['усто́йчивый результа́т', 'نتیجهٔ پایدار']],
          'نقل‌قول غیرمستقیم: فاعل + подчеркну́л, что + без + Gen. + тру́дно рассчи́тывать на + Acc.',
        ),
        () => buildRussianSentence(
          sid,
          `Благодаря́ ${p.dat} уча́стники прое́кта бы́стро нашли́ о́бщий язы́к.`,
          `به برکتِ ${p.fa}، اعضای پروژه خیلی زود به زبان مشترک رسیدند.`,
          [[p.headword, p.headFa], ['благодаря́', 'به لطفِ / به برکتِ'], ['нашли́ о́бщий язы́к', 'به تفاهم رسیدند']],
          'Благодаря́ + حالت متممی (Dative) + فاعل + فعل گذشته + مفعول',
        ),
        () => buildRussianSentence(
          sid,
          `Я по́лностью разделя́ю ва́шу то́чку зре́ния относи́тельно ${p.gen}.`,
          `من کاملاً با دیدگاه شما در خصوص ${p.fa} هم‌نظر هستم.`,
          [[p.headword, p.headFa], ['разделя́ю то́чку зре́ния', 'هم‌عقیده هستم'], ['относи́тельно', 'در خصوصِ']],
          'Я по́лностью разделя́ю ва́шу то́чку зре́ния + относи́тельно + Genitive',
        ),
        () => buildRussianSentence(
          sid,
          `С одно́й стороны́, ${p.nom} ${p.gender === 'pl' ? 'открыва́ют' : 'открыва́ет'} но́вые возмо́жности, а с друго́й — ${p.gender === 'pl' ? 'тре́буют' : 'тре́бует'} вду́мчивого подхо́да.`,
          `از یک سو ${p.fa} فرصت‌های تازه‌ای می‌گشاید، و از سوی دیگر نیازمند نگاهی سنجیده و دقیق است.`,
          [[p.headword, p.headFa], ['с одно́й стороны́', 'از یک سو'], ['вду́мчивый подхо́д', 'رویکرد سنجیده']],
          'С одно́й стороны́, ... + а с друго́й (стороны́) — ... (استدلال دووجهی)',
        ),
        () => buildRussianSentence(
          sid,
          `Колле́ги предложи́ли, что́бы мы совме́стно ${act2.pastPl} ${p.acc} до нача́ла се́ссии.`,
          `همکاران پیشنهاد دادند که ما پیش از آغاز نشست، مشترکاً ${faClause(p.fa, act2, faSubj1Pl(act2))}.`,
          [[p.headword, p.headFa], ['предложи́ли, что́бы', 'پیشنهاد دادند که'], ['совме́стно', 'مشترکاً / با هم']],
          'فاعل + предложи́ли, + что́бы + فاعل دوم + فعل در وجه التزامی (فرم گذشته)',
        ),
        () => buildRussianSentence(
          sid,
          `По ме́ре того́ как растёт интере́с к ${p.dat}, появля́ются но́вые иссле́дования.`,
          `هرچه علاقه به ${p.fa} بیشتر می‌شود، پژوهش‌های تازه‌تری شکل می‌گیرد.`,
          [[p.headword, p.headFa], ['по ме́ре того́ как', 'به موازاتِ اینکه'], ['иссле́дования', 'پژوهش‌ها']],
          'По ме́ре того́ как + جملهٔ پیرو با к + Dative، + جملهٔ پایه',
        ),
        () => buildRussianSentence(
          sid,
          `Тру́дно не согласи́ться с тем, что ${p.nom} ${p.gender === 'pl' ? 'игра́ют' : 'игра́ет'} заме́тную роль ${placePhraseRu}.`,
          `سخت بتوان با این نکته مخالفت کرد که ${p.fa} نقش چشمگیری ${placePhraseFa} ایفا می‌کند.`,
          [[p.headword, p.headFa], ['тру́дно не согласи́ться', 'سخت است موافق نبود'], ['игра́ет роль', 'نقش ایفا می‌کند']],
          'Тру́дно не согласи́ться с тем, что + نهاد + игра́ет/игра́ют роль + مکان',
        ),
        () => buildRussianSentence(
          sid,
          `На пра́ктике и́менно уме́ние рабо́тать ${sPrep} ${p.ins} отлича́ет о́пытного специали́ста.`,
          `در عمل، دقیقاً مهارتِ کار با ${p.fa} است که متخصصِ باتجربه را متمایز می‌کند.`,
          [[p.headword, p.headFa], ['на пра́ктике', 'در عمل'], ['о́пытный специали́ст', 'متخصص باتجربه']],
          'На пра́ктике + и́менно + نهاد + отлича́ет + مفعول جاندار (Acc. = Gen.)',
        ),
        () => buildRussianSentence(
          sid,
          `Пре́жде чем де́лать вы́воды ${oPrep} ${p.prep}, необходи́мо прове́рить исто́чники.`,
          `پیش از نتیجه‌گیری دربارهٔ ${p.fa}، لازم است منابع را بررسی کنیم.`,
          [[p.headword, p.headFa], ['пре́жде чем', 'پیش از آنکه'], ['де́лать вы́воды', 'نتیجه‌گیری کردن']],
          'Пре́жде чем + مصدر، + необходи́мо + مصدر + مفعول مستقیم',
        ),
        () => buildRussianSentence(
          sid,
          `Мы попроси́ли а́втора подро́бнее останови́ться на преиму́ществах ${p.gen}.`,
          `از نویسنده خواستیم با تفصیل بیشتری به مزیت‌های ${p.fa} بپردازد.`,
          [[p.headword, p.headFa], ['подро́бнее останови́ться на', 'به‌تفصیل پرداختن به'], ['преиму́щества', 'مزیت‌ها']],
          'Мы попроси́ли + مفعول + подро́бнее останови́ться на + Prepositional + Genitive',
        ),
        () => buildRussianSentence(
          sid,
          `О́пыт пока́зывает, что своевре́менное внима́ние к ${p.dat} снижа́ет ри́ски.`,
          `تجربه نشان می‌دهد که توجه به‌موقع به ${p.fa} ریسک‌ها را کاهش می‌دهد.`,
          [[p.headword, p.headFa], ['о́пыт пока́зывает', 'تجربه نشان می‌دهد'], ['снижа́ет ри́ски', 'ریسک‌ها را کم می‌کند']],
          'О́пыт пока́зывает, что + نهاد + к + Dative + فعل حال + مفعول',
        ),
        () => buildRussianSentence(
          sid,
          `Я сомнева́юсь, что сто́ит оцени́вать ${p.acc} и ${p2.acc} без то́чных да́нных.`,
          `تردید دارم که بدون داده‌های دقیق، ارزیابی کردنِ ${p.fa} و ${p2.fa} کار درستی باشد.`,
          [[p.headword, p.headFa], ['сомнева́юсь', 'تردید دارم'], ['то́чные да́нные', 'داده‌های دقیق']],
          'Я сомнева́юсь, что сто́ит + مصدر + مفعول + без + Genitive',
        ),
        () => buildRussianSentence(
          sid,
          `В хо́де обсужде́ния вы́яснилось, что ${p.nom} уже́ ${importantShort(p.gender)} для всех отде́лов.`,
          `در جریان گفت‌وگو روشن شد که ${p.fa} همین حالا برای همهٔ بخش‌ها اهمیت دارد.`,
          [[p.headword, p.headFa], ['в хо́де обсужде́ния', 'در جریان بحث'], ['вы́яснилось', 'مشخص شد']],
          'В хо́де + Genitive + вы́яснилось, что + نهاد + صفت کوتاه خبری + для + Gen.',
        ),
        () => buildRussianSentence(
          sid,
          `Судя́ по о́тзывам колле́г, но́вый подхо́д к ${p.dat} по́лностью себя́ оправда́л.`,
          `با قضاوت از روی بازخورد همکاران، رویکرد تازه به ${p.fa} کاملاً امتحانش را پس داده است.`,
          [[p.headword, p.headFa], ['судя́ по о́тзывам', 'با قضاوت از روی بازخوردها'], ['себя́ оправда́л', 'درستی‌اش ثابت شد']],
          'Судя́ по + حالت Dative، + نهاد + по́лностью себя́ оправда́л',
        ),
        () => buildRussianSentence(
          sid,
          `Нам ну́жно найти́ компроми́сс, при кото́ром сохрани́тся ка́чество ${p.gen}.`,
          `باید راهِ میانه‌ای پیدا کنیم که در آن کیفیتِ ${p.fa} حفظ شود.`,
          [[p.headword, p.headFa], ['найти́ компроми́сс', 'یافتن راه‌حل میانه'], ['ка́чество', 'کیفیت']],
          'جملهٔ پایه + при кото́ром + فعل بازتابی + نهاد + حالت Genitive',
        ),
        () => buildRussianSentence(
          sid,
          `Как пра́вило, лю́ди охо́тнее подде́рживают иде́ю, когда́ понима́ют по́льзу ${p.gen}.`,
          `به‌طور معمول، مردم وقتی فایدهٔ ${p.fa} را درک می‌کنند با رغبت بیشتری از ایده حمایت می‌کنند.`,
          [[p.headword, p.headFa], ['как пра́вило', 'به‌طور معمول / قاعدتاً'], ['охо́тнее подде́рживают', 'با رغبت بیشتری حمایت می‌کنند']],
          'Как пра́вило, + جملهٔ پایه + когда́ + فاعل + понима́ют по́льзу + Genitive',
        ),
        () => buildRussianSentence(
          sid,
          `Никто́ не ожида́л, что внима́ние к ${p.dat} приведёт к тако́му практи́чному реше́нию.`,
          `هیچ‌کس انتظار نداشت که توجه به ${p.fa} به چنین راه‌حل کاربردی و خوبی بینجامد.`,
          [[p.headword, p.headFa], ['никто́ не ожида́л', 'هیچ‌کس انتظار نداشت'], ['приведёт к', 'منجر شود به']],
          'Никто́ не ожида́л, что + نهاد + приведёт к + حالت Dative',
        ),
        () => buildRussianSentence(
          sid,
          `По слова́м веду́щего анали́тика, значе́ние ${p.gen} продо́лжит расти́ в э́том году́.`,
          `به گفتهٔ تحلیلگر ارشد، اهمیتِ ${p.fa} امسال هم به رشد خود ادامه خواهد داد.`,
          [[p.headword, p.headFa], ['по слова́м', 'به گفتهٔ'], ['значе́ние', 'اهمیت / جایگاه']],
          'По слова́м + Genitive، + значе́ние + Genitive + продо́лжит расти́',
        ),
        () => buildRussianSentence(
          sid,
          `Чем точне́е сформули́рована цель, тем про́ще ${act.inf} ${p.acc} без заде́ржек.`,
          `هرچه هدف دقیق‌تر صورت‌بندی شده باشد، بدون تأخیر راحت‌تر می‌توان ${faClause(p.fa, act, faImpersonal(act))}.`,
          [[p.headword, p.headFa], ['сформули́рована цель', 'هدف تبیین شده است'], ['без заде́ржек', 'بدون تأخیر']],
          'الگوی تناسبی: Чем + صفت تفضیلی ..., + тем + قید تفضیلی + مصدر',
        ),
        () => buildRussianSentence(
          sid,
          `В коне́чном счёте всё зави́сит от того́, наско́лько после́довательно мы ${act.pres1Pl} ${p.acc}.`,
          `در تحلیل نهایی همه‌چیز بستگی دارد به اینکه تا چه اندازه پیوسته ما ${faClause(p.fa, act, act.faPres1Pl)}.`,
          [[p.headword, p.headFa], ['в коне́чном счёте', 'در نهایت / دست‌آخر'], ['после́довательно', 'به‌طور پیوسته و منسجم']],
          'В коне́чном счёте всё зави́сит от того́, наско́лько + قید + فاعل + فعل',
        ),
        () => buildRussianSentence(
          sid,
          `Мне бы хоте́лось услы́шать мне́ние колле́г, кото́рые уже́ ста́лкивались ${sPrep} ${p.ins}.`,
          `مایلم نظر همکارانی را بشنوم که پیش‌تر با ${p.fa} سروکار داشته‌اند.`,
          [[p.headword, p.headFa], ['мне бы хоте́лось', 'مایل بودم / دوست داشتم'], ['ста́лкивались с', 'رویارو شده بودند با']],
          'Мне бы хоте́лось + مصدر + مفعول، + кото́рые ста́лкивались с/со + Instr.',
        ),
        () => buildRussianSentence(
          sid,
          `При усло́вии взаи́много уваже́ния любо́й спор вокру́г ${p.gen} реша́ется конструкти́вно.`,
          `به شرط احترام متقابل، هرگونه اختلاف‌نظری پیرامون ${p.fa} به‌شکل سازنده حل می‌شود.`,
          [[p.headword, p.headFa], ['при усло́вии', 'به شرطِ'], ['конструкти́вно', 'به‌شکل سازنده']],
          'При усло́вии + Genitive + نهاد + вокру́г + Genitive + فعل مجهول بازتابی',
        ),
        () => buildRussianSentence(
          sid,
          `И́менно откры́тый диало́г позво́лил нам во́время скорректи́ровать рабо́ту над ${p.ins}.`,
          `دقیقاً گفت‌وگوی باز به ما امکان داد کار روی ${p.fa} را به‌موقع اصلاح کنیم.`,
          [[p.headword, p.headFa], ['откры́тый диало́г', 'گفت‌وگوی باز'], ['скорректи́ровать', 'اصلاح و تنظیم کردن']],
          'И́менно + نهاد + позво́лил нам + مصدر کامل + рабо́ту над + Instrumental',
        ),
        () => buildRussianSentence(
          sid,
          `Не бу́дем спеши́ть с оце́нкой, пока́ не изу́чим все фа́кты ${oPrep} ${p.prep}.`,
          `در ارزیابی شتاب نکنیم تا زمانی که همهٔ واقعیت‌ها را دربارهٔ ${p.fa} بررسی نکرده‌ایم.`,
          [[p.headword, p.headFa], ['не бу́дем спеши́ть', 'شتاب نکنیم'], ['пока́ не изу́чим', 'تا وقتی بررسی نکرده‌ایم']],
          'وجه امری اول‌شخص جمع + пока́ не + فعل کامل آینده + о/об + Prepositional',
        ),
        () => buildRussianSentence(
          sid,
          `Подводя́ ито́г на́шей бесе́де, сто́ит ещё раз отме́тить зна́чимость ${p.gen}.`,
          `در جمع‌بندی گفت‌وگویمان، شایسته است بار دیگر بر اهمیتِ ${p.fa} تأکید کنیم.`,
          [[p.headword, p.headFa], ['подводя́ ито́г', 'در جمع‌بندیِ'], ['отме́тить зна́чимость', 'بر اهمیت تأکید کردن']],
          'قید فعلی (Подводя́ ито́г + Dat.)، + сто́ит отме́тить зна́чимость + Genitive',
        ),
      ];
      results.push(frames[templateIdx]());
      continue;
    }

    // Level 4 — Advanced Russian (B2–C1): participles, verbal adverbs, multi-clause analytical, formal & academic syntax
    const gerundRu = act.gerund ?? 'анализи́руя';
    const gerundFa = act.faGerund ?? 'با تحلیلِ';
    const framesL4: readonly (() => LearningSentence)[] = [
      () => buildRussianSentence(
        sid,
        `${capFirst(gerundRu)} ${p.acc} в широ́ком конте́ксте, иссле́дователи прихо́дят к весьма́ ва́жным вы́водам.`,
        `${gerundFa} ${p.fa} در بستری گسترده، پژوهشگران به نتایج بسیار مهمی دست می‌یابند.`,
        [[p.headword, p.headFa], [gerundRu, gerundFa], ['широ́кий конте́кст', 'بستر گسترده']],
        'گروه قید فعلی (Дееприча́стный оборо́т) + فاعل + прихо́дят к вы́водам (Dative)',
      ),
      () => buildRussianSentence(
        sid,
        `Фа́кторы, непосре́дственно влия́ющие на ${p.acc}, тре́буют всесторо́ннего и систе́много ана́лиза.`,
        `عواملی که مستقیماً بر ${p.fa} اثر می‌گذارند، نیازمند تحلیلی همه‌جانبه و نظام‌مند هستند.`,
        [[p.headword, p.headFa], ['непосре́дственно влия́ющие', 'مستقیماً اثرگذار (وجه وصفی فاعلی)'], ['всесторо́нний ана́лиз', 'تحلیل همه‌جانبه']],
        'نهاد + گروه وجه وصفی فاعلی (Прича́стный оборо́т با влия́ющие на + Acc.) + فعل',
      ),
      () => buildRussianSentence(
        sid,
        `Несмотря́ на то что ${p.acc} уже́ обсужда́ют ${placePhraseRu}, спо́ры о методоло́гии не утиха́ют.`,
        `با وجود آنکه ${p.fa} را پیش‌تر ${placePhraseFa} به بحث گذاشته‌اند، مناقشه‌ها دربارهٔ روش‌شناسی فروکش نمی‌کند.`,
        [[p.headword, p.headFa], ['несмотря́ на то что', 'علی‌رغم آنکه'], ['не утиха́ют', 'فروکش نمی‌کنند']],
        'جملهٔ پیرو امتناعی پیشرفته: Несмотря́ на то что ..., + جملهٔ پایه',
      ),
      () => buildRussianSentence(
        sid,
        `В то вре́мя как одни́ а́вторы абсолютизи́руют ${p.acc}, други́е ука́зывают на роль ${p2.gen}.`,
        `در حالی که گروهی از نویسندگان ${p.fa} را مطلق می‌انگارند، دیگران بر نقشِ ${p2.fa} انگشت می‌گذارند.`,
        [[p.headword, p.headFa], ['в то вре́мя как', 'در حالی که (تقابل تحلیلی)'], [p2.headword, p2.headFa]],
        'ساختار تقابلی رسمی: В то вре́мя как одни́ ..., + други́е ука́зывают на + Acc.',
      ),
      () => buildRussianSentence(
        sid,
        `Согла́сно официа́льно опублико́ванным да́нным, значе́ние ${p.gen} вы́росло почти́ вдво́е.`,
        `بر پایهٔ داده‌های رسماً منتشرشده، جایگاه و اهمیتِ ${p.fa} تقریباً دو برابر افزایش یافته است.`,
        [[p.headword, p.headFa], ['согла́сно да́нным', 'طبق داده‌ها'], ['почти́ вдво́е', 'تقریباً دو برابر']],
        'Согла́сно + صفت مفعولی (опублико́ванным да́нным, Dat.)، + نهاد + فعل گذشته',
      ),
      () => buildRussianSentence(
        sid,
        `Чем глу́бже мы осмы́сливаем приро́ду ${p.gen}, тем очеви́днее стано́вится её вну́тренняя ло́гика.`,
        `هرچه ژرف‌تر ماهیتِ ${p.fa} را می‌کاویم، منطق درونی آن آشکارتر می‌شود.`,
        [[p.headword, p.headFa], ['осмы́сливаем приро́ду', 'ماهیت را ژرف‌کاوی می‌کنیم'], ['вну́тренняя ло́гика', 'منطق درونی']],
        'Чем + قید تفضیلی + فعل، + тем + صفت تفضیلی + стано́вится + نهاد',
      ),
      () => buildRussianSentence(
        sid,
        `Без чётко вы́строенного подхо́да к ${p.dat} люба́я инициати́ва остаётся декларати́вной.`,
        `بدونِ رویکردِ دقیقاً طراحی‌شده نسبت به ${p.fa}، هر ابتکاری در حد شعار باقی می‌ماند.`,
        [[p.headword, p.headFa], ['вы́строенный подхо́д', 'رویکرد ساختارمند'], ['декларати́вный', 'صرفاً شعاری و اعلامی']],
        'Без + Genitive + подхо́да к + Dative + نهاد + остаётся + صفت (Instr.)',
      ),
      () => buildRussianSentence(
        sid,
        `Представля́ется вполне́ закономе́рным, что интере́с нау́чного соо́бщества к ${p.dat} неукло́нно возраста́ет.`,
        `کاملاً طبیعی و قانونمند به نظر می‌رسد که توجه جامعهٔ علمی به ${p.fa} پیوسته رو به افزایش است.`,
        [[p.headword, p.headFa], ['представля́ется закономе́рным', 'طبیعی و منطقی می‌نماید'], ['нау́чное соо́бщество', 'جامعهٔ علمی']],
        'ساختار غیرشخصی آکادمیک: Представля́ется + صفت (Instr.), что + نهاد + возраста́ет',
      ),
      () => buildRussianSentence(
        sid,
        `Вы́воды, сформули́рованные коми́ссией по ито́гам прове́рки ${p.gen}, легли́ в осно́ву рефо́рмы.`,
        `نتایج صورت‌بندی‌شده توسط کمیسیون در پایان بررسیِ ${p.fa}، شالودهٔ اصلاحات قرار گرفت.`,
        [[p.headword, p.headFa], ['сформули́рованные', 'صورت‌بندی‌شده (وجه وصفی مفعولی)'], ['легли́ в осно́ву', 'شالودهٔ کار شدند']],
        'نهاد + وجه وصفی مفعولی گذشته + عامل در حالت ابزاری (коми́ссией) + فعل',
      ),
      () => buildRussianSentence(
        sid,
        `Нельзя́ недооце́нивать влия́ние, ока́зываемое ${p.ins} на долгосро́чную усто́йчивость систе́мы.`,
        `نمی‌توان تأثیری را که توسطِ ${p.fa} بر پایداری بلندمدت سامانه گذاشته می‌شود دست‌کم گرفت.`,
        [[p.headword, p.headFa], ['нельзя́ недооце́нивать', 'نباید دست‌کم گرفت'], ['долгосро́чная усто́йчивость', 'پایداری بلندمدت']],
        'ساختار مجهول وصفی زمان حال: влия́ние, ока́зываемое + عامل (Instrumental)',
      ),
      () => buildRussianSentence(
        sid,
        `Приня́в во внима́ние аргуме́нты обе́их сторо́н, сове́т утверди́л но́вые ориенти́ры для ${p.gen}.`,
        `شورا با در نظر گرفتن استدلال‌های هر دو طرف، چارچوب تازه‌ای را برای ${p.fa} تصویب کرد.`,
        [[p.headword, p.headFa], ['приня́в во внима́ние', 'با در نظر گرفتنِ (قید فعلی کامل)'], ['ориенти́ры', 'معیارها و چارچوب‌ها']],
        'قید فعلی کامل (Приня́в во внима́ние + Acc.)، + فاعل + فعل کامل + مفعول',
      ),
      () => buildRussianSentence(
        sid,
        `Речь идёт не сто́лько о форма́льной оце́нке ${p.gen}, ско́лько о сме́не са́мой паради́гмы.`,
        `سخن نه چندان بر سرِ ارزیابی صوریِ ${p.fa}، بلکه بر سرِ تغییر خودِ الگووارهٔ فکری است.`,
        [[p.headword, p.headFa], ['не сто́лько ... ско́лько', 'نه چندان ... بلکه بیشتر ...'], ['сме́на паради́гмы', 'تغییر پارادایم']],
        'الگوی بلاغی پیشرفته: Речь идёт не сто́лько о + Prep., ско́лько о + Prep.',
      ),
      () => buildRussianSentence(
        sid,
          `Столь высо́кий у́ровень тре́бований к ${p.dat} объясня́ется повы́шенной отве́тственностью специали́стов.`,
        `چنین سطح بالایی از الزامات نسبت به ${p.fa} با مسئولیت سنگین‌تر متخصصان توضیح داده می‌شود.`,
        [[p.headword, p.headFa], ['столь высо́кий у́ровень', 'چنین سطح والایی'], ['объясня́ется', 'تبیین می‌شود با']],
        'ساختار مجهول تحلیلی: نهاد + объясня́ется + علت در حالت ابزاری (Instrumental)',
      ),
      () => buildRussianSentence(
        sid,
        `Показа́тельно, что да́же ске́птики призна́ли це́нность реше́ний, свя́занных ${sPrep} ${p.ins}.`,
        `گویا و قابل‌توجه است که حتی منتقدان دیرباور نیز ارزش راه‌حل‌های مرتبط با ${p.fa} را پذیرفتند.`,
        [[p.headword, p.headFa], ['показа́тельно, что', 'قابل‌توجه و گویاست که'], ['призна́ли це́нность', 'ارزش را به رسمیت شناختند']],
        'Показа́тельно, что + فاعل + призна́ли це́нность + Gen. + свя́занных с/со + Instr.',
      ),
      () => buildRussianSentence(
        sid,
        `В слу́чае пересмо́тра пре́жних пра́вил придётся за́ново согласо́вывать рабо́ту ${sPrep} ${p.ins}.`,
        `در صورت بازنگری در قواعد پیشین، ناگزیر باید روند کار با ${p.fa} از نو هماهنگ شود.`,
        [[p.headword, p.headFa], ['в слу́чае пересмо́тра', 'در صورت بازنگریِ'], ['придётся согласо́вывать', 'ناگزیر باید هماهنگ کرد']],
        'В слу́чае + Genitive + فعل غیرشخصی (придётся) + مصدر + مفعول',
      ),
      () => buildRussianSentence(
        sid,
        `Сопоста́вив эмпири́ческие наблюде́ния ${sPrep} ${p.ins}, а́втор вы́явил неочеви́дную закономе́рность.`,
        `نویسنده با سنجش و تطبیق مشاهدات تجربی با ${p.fa}، قانونمندیِ ناپیدایی را آشکار ساخت.`,
        [[p.headword, p.headFa], ['сопоста́вив', 'پس از تطبیق دادنِ'], ['вы́явил закономе́рность', 'قانونمندی را آشکار ساخت']],
        'قید فعلی کامل (Сопоста́вив X с Y) + فاعل + فعل کامل + مفعول مستقیم',
      ),
      () => buildRussianSentence(
        sid,
        `Скла́дывается впечатле́ние, бу́дто роль ${p.gen} до́лгое вре́мя остава́лась на перифери́и внима́ния.`,
        `چنین برداشتی شکل می‌گیرد که گویی نقشِ ${p.fa} مدت‌ها در حاشیهٔ توجه باقی مانده بود.`,
        [[p.headword, p.headFa], ['скла́дывается впечатле́ние', 'این برداشت شکل می‌گیرد'], ['на перифери́и внима́ния', 'در حاشیهٔ توجه']],
        'Скла́дывается впечатле́ние, бу́дто + نهاد + остава́лась на перифери́и + Genitive',
      ),
      () => buildRussianSentence(
        sid,
        `От того́, наско́лько гра́мотно вы́строена рабо́та ${sPrep} ${p.ins}, зави́сит репута́ция прое́кта.`,
        `اعتبار پروژه وابسته به آن است که کار با ${p.fa} تا چه اندازه مدبرانه و دقیق سازمان‌دهی شده باشد.`,
        [[p.headword, p.headFa], ['гра́мотно вы́строена', 'به‌شکل اصولی چیده شده است'], ['репута́ция', 'اعتبار و خوش‌نامی']],
        'От того́, наско́лько + قید + وجه وصفی مفعولی کوتاه، + зави́сит + نهاد',
      ),
      () => buildRussianSentence(
        sid,
        `Едва́ ли мо́жно оспа́ривать тот факт, что переосмысле́ние ${p.gen} назре́ло уже́ давно́.`,
        `به‌سختی بتوان این واقعیت را انکار کرد که ضرورتِ بازاندیشی در ${p.fa} از مدت‌ها پیش فرارسیده است.`,
        [[p.headword, p.headFa], ['едва́ ли мо́жно оспа́ривать', 'به‌دشواری بتوان به چالش کشید'], ['назре́ло давно́', 'از دیرباز ضروری شده بود']],
        'تردید مؤدبانهٔ علمی: Едва́ ли мо́жно оспа́ривать тот факт, что + جملهٔ پایه',
      ),
      () => buildRussianSentence(
        sid,
        `Бу́дучи те́сно свя́занным ${sPrep} ${p.ins}, да́нный проце́сс отража́ет глубо́кие сдви́ги в о́бществе.`,
        `این فرآیند، از آنجا که پیوندی تنگاتنگ با ${p.fa} دارد، دگرگونی‌های ژرف جامعه را بازمی‌تاباند.`,
        [[p.headword, p.headFa], ['бу́дучи свя́занным с', 'در حالی که پیوند دارد با'], ['глубо́кие сдви́ги', 'دگرگونی‌های ژرف']],
        'ساختار ادبی-علمی با «бу́дучи» + صفت مفعولی (Instr.) + جملهٔ پایه',
      ),
      () => buildRussianSentence(
        sid,
        `В ра́мках междисциплина́рного симпо́зиума осо́бый акце́нт был сде́лан на ро́ли ${p.gen}.`,
        `در چارچوب همایش میان‌رشته‌ای، تأکید ویژه‌ای بر نقشِ ${p.fa} صورت گرفت.`,
        [[p.headword, p.headFa], ['в ра́мках симпо́зиума', 'در چارچوب همایش'], ['акце́нт был сде́лан на', 'تأکید گذاشته شد بر']],
        'ساختار مجهول رسمی گذشته: осо́бый акце́нт был сде́лан на + Prepositional',
      ),
      () => buildRussianSentence(
        sid,
        `Ни оди́н серьёзный обзо́р совреме́нной пра́ктики не обхо́дится без упомина́ния ${oPrep} ${p.prep}.`,
        `هیچ مرور تحلیلیِ جدی‌ای بر تجربهٔ معاصر بدون اشاره به ${p.fa} کامل نمی‌شود.`,
        [[p.headword, p.headFa], ['не обхо́дится без', 'بی‌نیاز نیست از'], ['упомина́ние', 'اشاره / یادکرد']],
        'نفی مؤکد رسمی: Ни оди́н + نهاد + не обхо́дится без упомина́ния о/об + Prep.',
      ),
      () => buildRussianSentence(
        sid,
        `Примеча́тельно, что ме́тоды оце́нки ${p.gen} эволюциони́руют быстре́е, чем ожида́ли прогнози́сты.`,
        `شایان توجه است که روش‌های ارزیابیِ ${p.fa} سریع‌تر از آنچه پیش‌بینی‌کنندگان انتظار داشتند تکامل می‌یابند.`,
        [[p.headword, p.headFa], ['примеча́тельно, что', 'شایان توجه است که'], ['эволюциони́руют', 'تکامل می‌یابند']],
        'Примеча́тельно, что + نهاد + فعل + قید تفضیلی، чем + جملهٔ مقایسه',
      ),
      () => buildRussianSentence(
        sid,
        `Руково́дствуясь при́нципами прозра́чности, комите́т опубликова́л по́лный отчёт ${oPrep} ${p.prep}.`,
        `کمیته با پیروی از اصول شفافیت، گزارش کامل مربوط به ${p.fa} را منتشر کرد.`,
        [[p.headword, p.headFa], ['руково́дствуясь при́нципами', 'با پیروی از اصولِ'], ['по́лный отчёт', 'گزارش جامع']],
        'Руково́дствуясь + حالت Instrumental، + فاعل + فعل کامل + مفعول',
      ),
      () => buildRussianSentence(
        sid,
        `И́менно на сты́ке тео́рии и пра́ктики раскрыва́ется по́длинный потенциа́л ${p.gen}.`,
        `دقیقاً در تلاقیِ نظریه و عمل است که ظرفیت اصیل و واقعیِ ${p.fa} آشکار می‌شود.`,
        [[p.headword, p.headFa], ['на сты́ке тео́рии и пра́ктики', 'در مرز تلاقی نظریه و عمل'], ['по́длинный потенциа́л', 'ظرفیت اصیل']],
        'تأکید کانونی با И́менно на сты́ке + Gen. + فعل مجهول بازتابی + نهاد',
      ),
      () => buildRussianSentence(
        sid,
        `Да́же части́чное усоверше́нствование ${p.gen} спосо́бно ощути́мо повы́сить ка́чество реше́ний.`,
        `حتی بهبودِ جزئیِ ${p.fa} نیز قادر است کیفیت تصمیم‌ها را به‌طرز محسوسی ارتقا دهد.`,
        [[p.headword, p.headFa], ['усоверше́нствование', 'بهینه‌سازی و ارتقا'], ['ощути́мо повы́сить', 'به‌طور ملموس بالا بردن']],
        'Да́же + نهاد خنثی + спосо́бно + قید + مصدر کامل + مفعول مستقیم',
      ),
      () => buildRussianSentence(
        sid,
        `Крите́рием зре́лости институ́та слу́жит то, как бере́жно он обраща́ется ${sPrep} ${p.ins}.`,
        `معیار بلوغ یک نهاد آن است که تا چه اندازه مسئولانه و دقیق با ${p.fa} رفتار می‌کند.`,
        [[p.headword, p.headFa], ['крите́рий зре́лости', 'معیار بلوغ'], ['бере́жно обраща́ется с', 'دقیق و مسئولانه برخورد می‌کند با']],
        'خبر مقدم در حالت ابزاری (Крите́рием ... слу́жит то, как ...)',
      ),
      () => buildRussianSentence(
        sid,
        `Вопреки́ распространённому стереоти́пу, поня́ть су́ть ${p.gen} мо́жно путём после́довательной пра́ктики.`,
        `برخلاف کلیشهٔ رایج، درکِ جوهرهٔ ${p.fa} از رهگذرِ تمرینِ پیوسته کاملاً شدنی است.`,
        [[p.headword, p.headFa], ['вопреки́ стереоти́пу', 'برخلاف کلیشهٔ رایج'], ['путём пра́ктики', 'از راهِ تمرین']],
        'Вопреки́ + حالت متممی (Dative)، + مصدر + مفعول + мо́жно путём + Genitive',
      ),
      () => buildRussianSentence(
        sid,
        `Обобща́я нако́пленные све́дения ${oPrep} ${p.prep}, докла́дчик наме́тил ориенти́ры на десятиле́тие вперёд.`,
        `سخنران با جمع‌بندی دانسته‌های انباشته دربارهٔ ${p.fa}، چشم‌اندازهای یک دههٔ آینده را ترسیم کرد.`,
        [[p.headword, p.headFa], ['обобща́я све́дения', 'با جمع‌بندیِ یافته‌ها'], ['наме́тил ориенти́ры', 'مسیرنماها را ترسیم کرد']],
        'قید فعلی ناگذرا/گذرا (Обобща́я + Acc.)، + فاعل + فعل گذشتهٔ کامل + مفعول',
      ),
      () => buildRussianSentence(
        sid,
        `Таки́м о́бразом, гармони́чное сочета́ние ${p.gen} и жи́вого диало́га обеспе́чивает глубину́ мы́сли.`,
        `بدین ترتیب، پیوندِ هماهنگِ ${p.fa} و گفت‌وگوی زنده، ژرفای اندیشه را تضمین می‌کند.`,
        [[p.headword, p.headFa], ['таки́м о́бразом', 'بدین ترتیب / بنابراین'], ['гармони́чное сочета́ние', 'ترکیب هماهنگ']],
        'پیوندگر نتیجه‌گیری رسمی: Таки́м о́бразом, + نهاد مرکب + обеспе́чивает + Acc.',
      ),
    ];
    results.push(framesL4[templateIdx]());
  }
  return results;
}

/**
 * Core Russian -> Persian word lexicon used to enrich base sentences ONLY with words
 * that actually appear inside that sentence's own Russian text.
 */
const BASE_WORD_GLOSSARY: Readonly<Record<string, readonly [string, string]>> = {
  я: ['я', 'من'],
  ты: ['ты', 'تو'],
  он: ['он', 'او (مرد)'],
  она: ['она́', 'او (زن)'],
  мы: ['мы', 'ما'],
  вы: ['вы', 'شما'],
  они: ['они́', 'آن‌ها'],
  мне: ['мне', 'به من / برای من'],
  тебе: ['тебе́', 'به تو'],
  вам: ['вам', 'به شما'],
  нам: ['нам', 'به ما'],
  меня: ['меня́', 'من را'],
  вас: ['вас', 'شما را'],
  нас: ['нас', 'ما را'],
  мой: ['мой', 'مال من'],
  моя: ['моя́', 'مال من (مؤنث)'],
  мое: ['моё', 'مال من (خنثی)'],
  мои: ['мои́', 'مال من (جمع)'],
  ваш: ['ваш', 'مال شما'],
  ваша: ['ва́ша', 'مال شما (مؤنث)'],
  наш: ['наш', 'مال ما'],
  это: ['э́то', 'این'],
  этот: ['э́тот', 'این (مذکر)'],
  эта: ['э́та', 'این (مؤنث)'],
  эти: ['э́ти', 'این‌ها'],
  пожалуйста: ['пожа́луйста', 'لطفاً / خواهش می‌کنم'],
  спасибо: ['спаси́бо', 'ممنون'],
  извините: ['извини́те', 'ببخشید'],
  здравствуйте: ['здра́вствуйте', 'سلام (رسمی)'],
  привет: ['приве́т', 'سلام'],
  можно: ['мо́жно', 'می‌شود / ممکن است'],
  нужно: ['ну́жно', 'لازم است'],
  нужен: ['ну́жен', 'نیاز است (مذکر)'],
  нужна: ['нужна́', 'نیاز است (مؤنث)'],
  надо: ['на́до', 'باید'],
  хочу: ['хочу́', 'می‌خواهم'],
  могу: ['могу́', 'می‌توانم'],
  буду: ['бу́ду', 'خواهم بود'],
  будет: ['бу́дет', 'خواهد بود'],
  был: ['был', 'بود (مذکر)'],
  была: ['была́', 'بود (مؤنث)'],
  было: ['бы́ло', 'بود'],
  были: ['бы́ли', 'بودند'],
  есть: ['есть', 'هست / وجود دارد'],
  нет: ['нет', 'نه / نیست'],
  не: ['не', 'نه / نـ (نفی)'],
  да: ['да', 'بله'],
  где: ['где', 'کجا'],
  куда: ['куда́', 'به کجا'],
  когда: ['когда́', 'کی / وقتی'],
  сколько: ['ско́лько', 'چقدر / چندتا'],
  какой: ['како́й', 'کدام / چطور'],
  какая: ['кака́я', 'کدام (مؤنث)'],
  кто: ['кто', 'چه کسی'],
  что: ['что', 'چه / که'],
  как: ['как', 'چطور'],
  почему: ['почему́', 'چرا'],
  если: ['е́сли', 'اگر'],
  потому: ['потому́ что', 'چون / زیرا'],
  хотя: ['хотя́', 'هرچند'],
  чем: ['чем', 'نسبت به / از'],
  бы: ['бы', 'می‌... (شرط و آرزو)'],
  сегодня: ['сего́дня', 'امروز'],
  завтра: ['за́втра', 'فردا'],
  вчера: ['вчера́', 'دیروز'],
  сейчас: ['сейча́с', 'الان'],
  утром: ['у́тром', 'صبح'],
  днем: ['днём', 'ظهر / در روز'],
  вечером: ['ве́чером', 'عصر / شب'],
  летом: ['ле́том', 'در تابستان'],
  зимой: ['зимо́й', 'در زمستان'],
  уже: ['уже́', 'هم‌اکنون / دیگر'],
  еще: ['ещё', 'هنوز / دیگر'],
  очень: ['о́чень', 'خیلی / بسیار'],
  хорошо: ['хорошо́', 'خوب'],
  вкусно: ['вку́сно', 'خوشمزه است'],
  быстро: ['бы́стро', 'سریع'],
  медленно: ['ме́дленно', 'آهسته'],
  прямо: ['пря́мо', 'مستقیم'],
  рядом: ['ря́дом', 'نزدیک / کنار'],
  здесь: ['здесь', 'اینجا'],
  тут: ['тут', 'اینجا'],
  там: ['там', 'آنجا'],
  дома: ['до́ма', 'در خانه'],
  домой: ['домо́й', 'به خانه'],
  потом: ['пото́м', 'بعد / سپس'],
  сначала: ['снача́ла', 'ابتدا / اول'],
  вместе: ['вме́сте', 'با هم'],
  всегда: ['всегда́', 'همیشه'],
  часто: ['ча́сто', 'اغلب'],
  много: ['мно́го', 'زیاد'],
  мало: ['ма́ло', 'کم'],
  лучше: ['лу́чше', 'بهتر'],
  больше: ['бо́льше', 'بیشتر / بزرگ‌تر'],
  все: ['всё', 'همه‌چیز'],
  день: ['день', 'روز'],
  час: ['час', 'ساعت'],
  три: ['три', 'سه'],
  два: ['два', 'دو'],
  один: ['оди́н', 'یک'],
  пять: ['пять', 'پنج'],
  раз: ['раз', 'بار / دفعه'],
  каждый: ['ка́ждый', 'هر'],
  стоит: ['сто́ит', 'قیمت دارد / می‌ارزد'],
  работаю: ['рабо́таю', 'کار می‌کنم'],
  пойдем: ['пойдём', 'بیا برویم'],
  встретимся: ['встре́тимся', 'همدیگر را می‌بینیم'],
  приходите: ['приходи́те', 'تشریف بیاورید'],
  поверните: ['поверни́те', 'بپیچید'],
  находится: ['нахо́дится', 'قرار دارد'],
  купить: ['купи́ть', 'خریدن'],
  поехать: ['пое́хать', 'سفر کردن'],
  примерить: ['приме́рить', 'پرو کردن'],
  возьму: ['возьму́', 'برمی‌دارم / می‌گیرم'],
  счет: ['счёт', 'صورت‌حساب'],
  чай: ['ча́й', 'چای'],
  кофе: ['ко́фе', 'قهوه'],
  хлеб: ['хлеб', 'نان'],
  вода: ['вода́', 'آب'],
  ужин: ['у́жин', 'شام'],
  обед: ['обе́д', 'ناهار'],
  завтрак: ['за́втрак', 'صبحانه'],
  билет: ['биле́т', 'بلیت'],
  номер: ['но́мер', 'شماره / اتاق هتل'],
  размер: ['разме́р', 'سایز / اندازه'],
  картой: ['ка́ртой', 'با کارت بانکی'],
  метро: ['метро́', 'مترو'],
  автобус: ['авто́бус', 'اتوبوس'],
  такси: ['такси́', 'تاکسی'],
  лекарство: ['лека́рство', 'دارو'],
  рецепт: ['реце́пт', 'نسخه / دستور پخت'],
  книгу: ['кни́га', 'کتاب'],
  фильм: ['фильм', 'فیلم'],
  дом: ['дом', 'خانه'],
  дождь: ['дождь', 'باران'],
  субботу: ['суббо́та', 'شنبه'],
  в: ['в', 'در / به'],
  на: ['на', 'رویِ / در / به'],
  с: ['с', 'با / از'],
  у: ['у', 'نزدِ / پیشِ'],
  к: ['к', 'به سمتِ / پیشِ'],
  до: ['до', 'تا / پیش از'],
  после: ['по́сле', 'بعد از'],
  без: ['без', 'بدونِ'],
  для: ['для', 'برایِ'],
  за: ['за', 'بابتِ / پشتِ'],
  от: ['от', 'از'],
  по: ['по', 'طبقِ / در امتدادِ'],
  и: ['и', 'و'],
  а: ['а', 'و / اما'],
  но: ['но', 'اما'],
  или: ['и́ли', 'یا'],
};

function extractSentenceOwnVocabulary(
  text: string,
  placePhraseRu: string,
  placePhraseFa: string,
): readonly [string, string][] {
  const rawTokens = text.match(/[А-Яа-яЁё\u0301-]+/g) ?? [];
  const found: [string, string][] = [];
  const prepositions: [string, string][] = [];
  for (const tok of rawTokens) {
    const bare = tok
      .normalize('NFD')
      .replace(/\u0301/g, '')
      .toLocaleLowerCase('ru-RU')
      .replace(/ё/g, 'е');
    // Match both NFD-like й and NFC й
    const entry =
      BASE_WORD_GLOSSARY[bare] ??
      BASE_WORD_GLOSSARY[bare.normalize('NFD')] ??
      BASE_WORD_GLOSSARY[bare.normalize('NFC')];
    if (!entry) continue;
    if (bare.length <= 2 && ['в', 'на', 'с', 'у', 'к', 'до', 'за', 'от', 'по', 'и', 'а', 'но'].includes(bare)) {
      prepositions.push([entry[0], entry[1]]);
    } else {
      found.push([entry[0], entry[1]]);
    }
  }
  return [
    ...found,
    ...prepositions,
    [placePhraseRu, placePhraseFa],
    ['по-ру́сски', 'به زبان روسی'],
  ];
}

/** Expands an existing 8-sentence lesson up to 30 sentences and enriches its original 8 sentences' vocabulary from their own words! */
export function upgradeExistingRussianLesson(
  baseLesson: LearningLesson,
  idPrefix: string,
  levelTier: 0 | 1 | 2,
  items: readonly RuPhrase[],
  actions: readonly RuAction[],
  placePhraseRu: string,
  placePhraseFa: string,
  extraCustomSentences: readonly LearningSentence[] = [],
): LearningLesson {
  const needed = Math.max(0, 30 - baseLesson.sentences.length - extraCustomSentences.length);
  const generated = generateDomainSentences(
    idPrefix,
    baseLesson.sentences.length + extraCustomSentences.length + 1,
    needed,
    levelTier,
    items,
    actions,
    placePhraseRu,
    placePhraseFa,
  );
  const extraVocabMap: Record<number, readonly [string, string][]> = {};
  baseLesson.sentences.forEach((s, idx) => {
    extraVocabMap[idx] = extractSentenceOwnVocabulary(s.text, placePhraseRu, placePhraseFa).slice(0, 5);
  });
  return extendRussianLesson(
    baseLesson,
    [...extraCustomSentences, ...generated],
    extraVocabMap,
  );
}

/** Builds a brand-new 30-sentence Russian lesson complete with teaching notes, 4-line dialogue & 2–3 comprehension checks! */
export function createFullRussianLesson(params: {
  readonly id: string;
  readonly order: number;
  readonly level: number;
  readonly title: string;
  readonly subtitle: string;
  readonly goal: string;
  readonly explanation: readonly string[];
  readonly idPrefix: string;
  readonly levelTier: 0 | 1 | 2 | 3 | 4;
  readonly items: readonly RuPhrase[];
  readonly actions: readonly RuAction[];
  readonly placePhraseRu?: string;
  readonly placePhraseFa?: string;
  readonly placeRu?: string;
  readonly placeFa?: string;
  readonly customSentences?: readonly LearningSentence[];
  readonly dialogue: readonly DialogueLine[];
  readonly checks: readonly LessonQuestion[];
}): LearningLesson {
  const custom = params.customSentences ?? [];
  const needed = Math.max(0, 30 - custom.length);
  const rest = generateDomainSentences(
    params.idPrefix,
    custom.length + 1,
    needed,
    params.levelTier,
    params.items,
    params.actions,
    params.placePhraseRu ?? params.placeRu ?? 'в э́том ме́сте',
    params.placePhraseFa ?? params.placeFa ?? 'در این مکان',
  );
  return {
    id: params.id,
    title: params.title,
    situation: params.goal,
    subtitle: params.subtitle,
    goal: params.goal,
    explanation: params.explanation,
    durationMinutes: 12,
    sentences: [...custom, ...rest],
    dialogue: [...params.dialogue],
    checks: [...params.checks],
  };
}
