import type { LearningLesson } from './types';
import { trLesson, trSentence } from './turkishLessonKit';

/**
 * محتوای اولیهٔ درس‌های ۱۱ تا ۲۰ مسیر A1؛ جایگاه فعلی هر درس در turkish.ts تعیین می‌شود.
 * درس‌های ۱۱ تا ۱۴ در Foundation مانده‌اند و درس‌های ۱۵ تا ۲۰ در Survival به‌عنوان
 * موضوع اصلی یا محتوای تکمیلی حفظ شده‌اند؛ متن آموزشی آن‌ها تغییر نکرده است.
 */
export const TURKISH_FOUNDATION_LESSONS_B: readonly LearningLesson[] = [
  trLesson(
    'tr-l1-11-nouns-plural',
    'اسم‌ها، جمع و پسوندهای ملکی',
    'اسم‌ها را جمع می‌بندید و با پسوند ملکی می‌گویید چیزی مال چه کسی است.',
    [
      trSentence('tr1-81', 'Kitap masada.', 'کتاب روی میز است.', 'کیتاپ ماسادا', 'kitap', 'کتاب', 'kitap = کتاب (مفرد)'),
      trSentence('tr1-82', 'Kitaplar masada.', 'کتاب‌ها روی میز هستند.', 'کیتاپلار ماسادا', 'kitaplar', 'کتاب‌ها', 'اسم + -ler/-lar = جمع'),
      trSentence('tr1-83', 'Evler çok güzel.', 'خانه‌ها خیلی قشنگ‌اند.', 'اِولِر چوک گوزِل', 'ev', 'خانه', 'ev + -ler = خانه‌ها'),
      trSentence('tr1-84', 'Benim kitabım.', 'کتاب من.', 'بِنیم کیتابِم', 'kitabım', 'کتابم', 'kitap + -ım = کتابم (p → b)'),
      trSentence('tr1-85', 'Senin araban.', 'ماشین تو.', 'سِنین آرابان', 'araba', 'ماشین', 'araba + -n = ماشینت'),
      trSentence('tr1-86', 'Onun evi.', 'خانهٔ او.', 'اونون اِوی', 'evi', 'خانه‌اش', 'ev + -i = خانه‌اش'),
      trSentence('tr1-87', 'Bizim okulumuz.', 'مدرسهٔ ما.', 'بیزیم اوکولوموز', 'okul', 'مدرسه', 'okul + -umuz = مدرسه‌مان'),
      trSentence('tr1-88', 'Onların bahçesi.', 'باغ آن‌ها.', 'اونلارین باهچِسی', 'bahçe', 'باغ', 'bahçe + -si = باغشان'),
    ],
    [
      { speaker: 'علی', text: 'Bu kitaplar senin mi?', fa: 'این کتاب‌ها مال تو هستند؟' },
      { speaker: 'مریم', text: 'Hayır, benim kitabım burada.', fa: 'نه، کتاب من اینجاست.' },
      { speaker: 'علی', text: 'O zaman onlar kimin?', fa: 'پس آن‌ها مال کیست؟' },
      { speaker: 'مریم', text: 'Onlar bizim okulumuzun kitapları.', fa: 'آن‌ها کتاب‌های مدرسهٔ ما هستند.' },
    ],
    [
      {
        promptFa: 'جمع «kitap» کدام است؟',
        choices: ['kitapım', 'kitaplar', 'kitabı'],
        correctIndex: 1,
        explanationFa: 'پسوند جمع -ler/-lar است: kitap → kitaplar.',
      },
      {
        promptFa: '«خانهٔ او» در ترکی چه می‌شود؟',
        choices: ['onun evi', 'benim evim', 'bizim ev'],
        correctIndex: 0,
        explanationFa: 'onun + ev + -i = خانهٔ او.',
      },
    ],
    'جمع با -ler/-lar ساخته می‌شود و پسوند ملکی به آن می‌چسبد: kitap-lar-ım (کتاب‌هایم). پسوند ملکی: -m (من)، -n (تو)، -i/-si (او)، -imiz (ما)، -iniz (شما)، -leri (آن‌ها). اگر اسم به واکه ختم شود میانجی «-s-» می‌آید: bahçe → bahçesi.',
  ),

  trLesson(
    'tr-l1-12-describing',
    'توصیف اشخاص، اشیا و مکان‌ها',
    'قد و قیافه، اندازه و ویژگی اشیا و حال‌وهوای مکان‌ها را توصیف می‌کنید.',
    [
      trSentence('tr1-89', 'Kardeşim uzun ve zayıf.', 'خواهر/برادرم بلندقد و لاغر است.', 'کاردِشیم اوزون وِه زاییف', 'uzun', 'بلند', 'uzun ve zayıf = بلند و لاغر'),
      trSentence('tr1-90', 'Bu ev büyük ve yeni.', 'این خانه بزرگ و نو است.', 'بو اِو بویوک وِه یِنی', 'büyük', 'بزرگ', 'büyük = بزرگ'),
      trSentence('tr1-91', 'Oda çok temiz.', 'اتاق خیلی تمیز است.', 'اودا چوک تِمیز', 'temiz', 'تمیز', 'temiz = تمیز'),
      trSentence('tr1-92', 'Sokak kalabalık.', 'خیابان شلوغ است.', 'سوکاک کالابالیک', 'sokak', 'خیابان', 'sokak = خیابان'),
      trSentence('tr1-93', 'Bu çanta ağır.', 'این کیف سنگین است.', 'بو چانتا آغیر', 'ağır', 'سنگین', 'ağır = سنگین'),
      trSentence('tr1-94', 'Araba eski.', 'ماشین کهنه است.', 'آرابا اِسکی', 'eski', 'کهنه / قدیمی', 'eski = کهنه'),
      trSentence('tr1-95', 'Öğretmen çok kibar.', 'معلم خیلی مؤدب است.', 'اویْرِتمِن چوک کیبار', 'kibar', 'مؤدب', 'kibar = مؤدب'),
      trSentence('tr1-96', 'Hava güzel.', 'هوا خوب است.', 'هَوا گوزِل', 'hava', 'هوا', 'hava = هوا'),
    ],
    [
      { speaker: 'مریم', text: 'Bu ev nasıl?', fa: 'این خانه چطور است؟' },
      { speaker: 'علی', text: 'Büyük ve yeni, ama mutfak küçük.', fa: 'بزرگ و نو است، ولی آشپزخانه کوچک است.' },
      { speaker: 'مریم', text: 'Sokak kalabalık mı?', fa: 'خیابان شلوغ است؟' },
      { speaker: 'علی', text: 'Hayır, çok sakin. Hava da güzel.', fa: 'نه، خیلی آرام است. هوا هم خوب است.' },
    ],
    [
      {
        promptFa: 'برای توصیف قد کدام واژه به کار می‌رود؟',
        choices: ['uzun', 'eski', 'temiz'],
        correctIndex: 0,
        explanationFa: 'uzun = بلند؛ eski = کهنه؛ temiz = تمیز.',
      },
      {
        promptFa: '«این کیف سنگین است» کدام است؟',
        choices: ['Bu çanta ağır.', 'Bu çanta hafif.', 'Bu çanta yeni.'],
        correctIndex: 0,
        explanationFa: 'ağır = سنگین؛ hafif = سبک.',
      },
    ],
    'در ترکی صفت پیش از اسم می‌آید و هرگز جمع بسته نمی‌شود: büyük evler (خانه‌های بزرگ). برای پرسیدن ویژگی، «nasıl?» (چطور؟) کافی است: Ev nasıl? — Ev büyük.',
  ),

  trLesson(
    'tr-l1-13-needs',
    'بیان نیازها، خواسته‌ها و علایق',
    'می‌گویید به چه چیزی نیاز دارید، چه می‌خواهید و چه چیزی را دوست دارید.',
    [
      trSentence('tr1-97', 'Suya ihtiyacım var.', 'به آب نیاز دارم.', 'سویا ایحتییاجیم وار', 'ihtiyaç', 'نیاز', 'su + -ya + ihtiyacım var'),
      trSentence('tr1-98', 'Biraz dinlenmek istiyorum.', 'می‌خواهم کمی استراحت کنم.', 'بیراز دینلِنمِک ایستییوروم', 'dinlenmek', 'استراحت کردن', 'مصدر + istiyorum = می‌خواهم ...'),
      trSentence('tr1-99', 'Bir bardak çay istiyorum.', 'یک لیوان چای می‌خواهم.', 'بیر بارداق چای ایستییوروم', 'bardak', 'لیوان', 'bir bardak çay = یک لیوان چای'),
      trSentence('tr1-100', 'Futbol oynamayı seviyorum.', 'فوتبال بازی کردن را دوست دارم.', 'فوت‌بال اوینامایی سِوی‌یوروم', 'sevmek', 'دوست داشتن', 'مصدر + -mayı + seviyorum'),
      trSentence('tr1-101', 'Kitap okumak istiyorum.', 'می‌خواهم کتاب بخوانم.', 'کیتاپ اوکومک ایستییوروم', 'okumak', 'خواندن', 'okumak istiyorum = می‌خواهم بخوانم'),
      trSentence('tr1-102', 'Yardıma ihtiyacım var.', 'به کمک نیاز دارم.', 'یاردیما ایحتییاجیم وار', 'yardım', 'کمک', 'yardım + -a = به کمک'),
      trSentence('tr1-103', 'Sen ne istiyorsun?', 'تو چه می‌خواهی؟', 'سِن نِه ایستییورسون', 'istemek', 'خواستن', 'ne + istiyorsun = چه می‌خواهی'),
      trSentence('tr1-104', 'Çok açım.', 'خیلی گرسنه‌ام.', 'چوک آجیم', 'aç', 'گرسنه', 'aç + -ım = گرسنه‌ام'),
    ],
    [
      { speaker: 'علی', text: 'Sen ne istiyorsun?', fa: 'تو چه می‌خواهی؟' },
      { speaker: 'مریم', text: 'Bir bardak çay istiyorum. Çok yorgunum.', fa: 'یک لیوان چای می‌خواهم. خیلی خسته‌ام.' },
      { speaker: 'علی', text: 'Biraz dinlenmek ister misin?', fa: 'می‌خواهی کمی استراحت کنی؟' },
      { speaker: 'مریم', text: 'Evet, suya da ihtiyacım var.', fa: 'بله، به آب هم نیاز دارم.' },
    ],
    [
      {
        promptFa: '«به کمک نیاز دارم» کدام است؟',
        choices: ['Yardıma ihtiyacım var.', 'Yardım istiyorum değil.', 'Yardım ediyorum.'],
        correctIndex: 0,
        explanationFa: 'yardım + -a + ihtiyacım var = به کمک نیاز دارم.',
      },
      {
        promptFa: '«فوتبال بازی کردن را دوست دارم» چه می‌شود؟',
        choices: ['Futbol oynamayı seviyorum.', 'Futbol oynuyorum.', 'Futbol istiyorum.'],
        correctIndex: 0,
        explanationFa: 'مصدر + -mayı + seviyorum یعنی «... کردن را دوست دارم».',
      },
    ],
    'دو ساختار پرکاربرد: «مصدر + istiyorum» (می‌خواهم ...) و «مصدر + -mayı/-meyi seviyorum» (دوست دارم ...). برای نیاز: «اسم + -a/-e + ihtiyacım var» یا کوتاه‌تر «... lazım».',
  ),

  trLesson(
    'tr-l1-14-location',
    'مکان، جهت و موقعیت مکانی',
    'می‌گویید چیزی کجاست، روی میز است یا داخل کیف، و مسیر را نشان می‌دهید.',
    [
      trSentence('tr1-105', 'Kitap nerede?', 'کتاب کجاست؟', 'کیتاپ نِرِدِه', 'nerede', 'کجا', 'nerede = کجا'),
      trSentence('tr1-106', 'Masanın üstünde.', 'روی میز است.', 'ماسانین اوستونده', 'üstünde', 'روی', 'masa + -nın + üstünde = روی میز'),
      trSentence('tr1-107', 'Anahtar çantanın içinde.', 'کلید داخل کیف است.', 'آناهتار چانتانین ایچینده', 'içinde', 'داخل', 'içinde = داخل'),
      trSentence('tr1-108', 'Banka okulun yanında.', 'بانک کنار مدرسه است.', 'بانکا اوکولون یانیندا', 'yanında', 'کنار', 'yanında = کنار'),
      trSentence('tr1-109', 'Tuvalet sağda.', 'دستشویی سمت راست است.', 'تووالِت ساآدا', 'sağda', 'سمت راست', 'sağ + -da = سمت راست'),
      trSentence('tr1-110', 'Market karşıda.', 'سوپرمارکت روبه‌رو است.', 'مارکِت کارشیدا', 'karşıda', 'روبه‌رو', 'karşı + -da = روبه‌رو'),
      trSentence('tr1-111', 'Solda bir kafe var.', 'سمت چپ یک کافه هست.', 'سولدا بیر کافه وار', 'solda', 'سمت چپ', 'sol + -da = سمت چپ'),
      trSentence('tr1-112', 'Yukarıda, ikinci katta.', 'بالا، طبقهٔ دوم.', 'یوکاریدا، ایکینجی کاتتا', 'kat', 'طبقه', 'ikinci kat = طبقهٔ دوم'),
    ],
    [
      { speaker: 'مریم', text: 'Affedersiniz, anahtar nerede?', fa: 'ببخشید، کلید کجاست؟' },
      { speaker: 'کارمند', text: 'Masanın üstünde.', fa: 'روی میز است.' },
      { speaker: 'مریم', text: 'Peki, banka yakın mı?', fa: 'خب، بانک نزدیک است؟' },
      { speaker: 'کارمند', text: 'Evet, okulun yanında, solda.', fa: 'بله، کنار مدرسه، سمت چپ.' },
    ],
    [
      {
        promptFa: '«روی میز» کدام است؟',
        choices: ['masanın üstünde', 'masanın içinde', 'masanın yanında'],
        correctIndex: 0,
        explanationFa: 'üstünde = روی؛ içinde = داخل؛ yanında = کنار.',
      },
      {
        promptFa: '«سمت راست» در ترکی چه می‌شود؟',
        choices: ['solda', 'sağda', 'karşıda'],
        correctIndex: 1,
        explanationFa: 'sağda = سمت راست؛ solda = سمت چپ؛ karşıda = روبه‌رو.',
      },
    ],
    'برای موقعیت، اسم + «-in/-ın» + üstünde (روی)، içinde (داخل)، yanında (کنار)، altında (زیر) می‌آید: masanın altında (زیر میز). جهت‌های ساده با -da/-de: sağda، solda، karşıda، yukarıda، aşağıda.',
  ),

  trLesson(
    'tr-l1-15-time',
    'زمان، روزها و برنامهٔ روزانه',
    'روزهای هفته، ساعت و کارهای روزانه را می‌گویید.',
    [
      trSentence('tr1-113', 'Bugün pazartesi.', 'امروز دوشنبه است.', 'بوگون پازارتِسی', 'pazartesi', 'دوشنبه', 'gün = روز؛ bugün = امروز'),
      trSentence('tr1-114', 'Yarın salı.', 'فردا سه‌شنبه است.', 'یارین سالی', 'salı', 'سه‌شنبه', 'yarın = فردا'),
      trSentence('tr1-115', 'Saat yedi.', 'ساعت هفت است.', 'ساعت یِدی', 'saat', 'ساعت', 'saat + عدد = ساعت ...'),
      trSentence('tr1-116', 'Sabah yedide kalkıyorum.', 'صبح ساعت هفت بیدار می‌شوم.', 'ساباح یِدیدِه کالکییوروم', 'kalkmak', 'بلند شدن', 'yedi + -de = ساعت هفت'),
      trSentence('tr1-117', 'Sekizde kahvaltı yapıyorum.', 'ساعت هشت صبحانه می‌خورم.', 'سِکیزدِه کاه‌والتی یاپییوروم', 'kahvaltı', 'صبحانه', 'kahvaltı yapmak = صبحانه خوردن'),
      trSentence('tr1-118', 'Akşam eve gidiyorum.', 'عصر به خانه می‌روم.', 'آکشام اِوِه گیدییوروم', 'akşam', 'عصر', 'eve = به خانه'),
      trSentence('tr1-119', 'Gece erken yatıyorum.', 'شب زود می‌خوابم.', 'گِجِه اِرکِن یاتییوروم', 'yatmak', 'خوابیدن', 'erken = زود'),
      trSentence('tr1-120', 'Beş dakika sonra.', 'پنج دقیقه بعد.', 'بِش داکیکا سونرا', 'sonra', 'بعد', 'مدت + sonra = ... بعد'),
    ],
    [
      { speaker: 'علی', text: 'Bugün günlerden ne?', fa: 'امروز چه روزی است؟' },
      { speaker: 'مریم', text: 'Bugün pazartesi. Saat yedi.', fa: 'امروز دوشنبه است. ساعت هفت.' },
      { speaker: 'علی', text: 'Kaçta kalkıyorsun?', fa: 'ساعت چند بیدار می‌شوی؟' },
      { speaker: 'مریم', text: 'Sabah yedide kalkıyorum, sekizde kahvaltı yapıyorum.', fa: 'صبح ساعت هفت بیدار می‌شوم، ساعت هشت صبحانه می‌خورم.' },
      { speaker: 'علی', text: 'Beş dakika sonra görüşürüz.', fa: 'پنج دقیقه بعد می‌بینمت.' },
    ],
    [
      {
        promptFa: 'واژهٔ «فردا» کدام است؟',
        choices: ['bugün', 'yarın', 'dün'],
        correctIndex: 1,
        explanationFa: 'yarın = فردا، bugün = امروز، dün = دیروز.',
      },
      {
        promptFa: 'برای گفتن «ساعت هفت» (در/ساعتِ) کدام درست است؟',
        choices: ['yedi', 'yedide', 'yediler'],
        correctIndex: 1,
        explanationFa: 'پسوند -de/-da به عدد می‌چسبد: yedide.',
      },
    ],
    'روزهای هفته: pazartesi، salı، çarşamba، perşembe، cuma، cumartesi، pazar. برای ساعتِ رویداد، پسوند -da/-de به عدد اضافه می‌شود (yedide، sekizde، dokuzda) و بعد از صامت بی‌واک به -ta/-te تبدیل می‌شود: üçte.',
  ),

  trLesson(
    'tr-l1-16-ability-request',
    'توانایی، درخواست و اجازه',
    'می‌گویید چه کاری را می‌توانید انجام دهید، مؤدبانه درخواست می‌کنید و اجازه می‌گیرید.',
    [
      trSentence('tr1-121', 'Lütfen.', 'لطفاً.', 'لوتفِن', 'lütfen', 'لطفاً', 'lütfen = لطفاً (آغاز یا پایان درخواست)'),
      trSentence('tr1-122', 'Çok teşekkür ederim.', 'خیلی ممنونم.', 'چوک تشکّور اِدِریم', 'teşekkür etmek', 'تشکر کردن', 'çok teşekkür ederim = خیلی ممنونم'),
      trSentence('tr1-123', 'Bir şey değil.', 'خواهش می‌کنم / قابلی نداشت.', 'بیر شِی دِییل', 'bir şey değil', 'چیزی نیست', 'bir şey değil = پاسخ تشکر'),
      trSentence('tr1-124', 'Özür dilerim.', 'عذر می‌خواهم.', 'اوزور دیلِریم', 'özür dilemek', 'عذرخواهی کردن', 'özür dilerim = عذر می‌خواهم'),
      trSentence('tr1-125', 'Affedersiniz.', 'ببخشید (خطاب مؤدبانه).', 'آففِدِرسینیز', 'affetmek', 'بخشیدن', 'affedersiniz = ببخشید (شما)'),
      trSentence('tr1-126', 'Türkçe konuşabilir miyim?', 'می‌توانم ترکی صحبت کنم؟', 'تورکچه کونوشابیلیر می‌ییم', 'konuşabilmek', 'توانستن صحبت کردن', 'فعل + -abilir + miyim = می‌توانم ...؟'),
      trSentence('tr1-127', 'Burada sigara içebilir miyim?', 'می‌توانم اینجا سیگار بکشم؟', 'بورادا سیگارا ایچِبیلیر می‌ییم', 'sigara içmek', 'سیگار کشیدن', 'burada = اینجا'),
      trSentence('tr1-128', 'Yardım edebilir misiniz?', 'می‌توانید کمک کنید؟', 'یاردیم اِدِبیلیر میسینیز', 'yardım etmek', 'کمک کردن', 'eder + -ebilir + misiniz = می‌توانید ...؟'),
    ],
    [
      { speaker: 'مریم', text: 'Affedersiniz, yardım edebilir misiniz?', fa: 'ببخشید، می‌توانید کمک کنید؟' },
      { speaker: 'گارسون', text: 'Tabii, buyurun.', fa: 'البته، بفرمایید.' },
      { speaker: 'مریم', text: 'Burada sigara içebilir miyim?', fa: 'می‌توانم اینجا سیگار بکشم؟' },
      { speaker: 'گارسون', text: 'Maalesef hayır. Özür dilerim.', fa: 'متأسفانه نه. عذر می‌خواهم.' },
      { speaker: 'مریم', text: 'Sorun değil, teşekkür ederim.', fa: 'مشکلی نیست، ممنونم.' },
    ],
    [
      {
        promptFa: '«می‌توانم ... کنم؟» با کدام ساختار ساخته می‌شود؟',
        choices: ['فعل + -abilir/-ebilir + miyim', 'فعل + -dı', 'فعل + -meli'],
        correctIndex: 0,
        explanationFa: 'konuş-abilir-miyim = می‌توانم صحبت کنم؟',
      },
      {
        promptFa: 'وقتی کسی از شما تشکر می‌کند چه می‌گویید؟',
        choices: ['Lütfen.', 'Bir şey değil.', 'Evet.'],
        correctIndex: 1,
        explanationFa: 'Bir şey değil یعنی «قابلی نداشت / خواهش می‌کنم».',
      },
    ],
    'برای توانایی و اجازه، پسوند -abil/-ebil به ریشهٔ فعل می‌چسبد و بعد ذرهٔ پرسشی و پسوند شخصی می‌آید: konuş-abil-ir miyim? / iç-ebil-ir miyim? ادب کلامی همراه آن: lütfen، affedersiniz، özür dilerim، teşekkür ederim.',
  ),

  trLesson(
    'tr-l1-17-motion',
    'فعل‌های حرکتی پایه و بیان مسیر',
    'می‌گویید به کجا می‌روید، از کجا می‌آیید و بالا یا پایین می‌روید.',
    [
      trSentence('tr1-129', 'Okula gidiyorum.', 'به مدرسه می‌روم.', 'اوکولا گیدییوروم', 'gitmek', 'رفتن', 'okul + -a = به مدرسه'),
      trSentence('tr1-130', 'İşe gidiyor.', 'به سر کار می‌رود.', 'ایشه گیدییور', 'iş', 'کار', 'iş + -e = به کار'),
      trSentence('tr1-131', 'Pazara gidiyoruz.', 'به بازار می‌رویم.', 'پازارا گیدییوروز', 'pazar', 'بازار', 'pazar + -a = به بازار'),
      trSentence('tr1-132', 'Buradan geliyorum.', 'از اینجا می‌آیم.', 'بورادان گِلییوروم', 'buradan', 'از اینجا', '-dan/-den = از'),
      trSentence('tr1-133', 'Evden çıkıyorum.', 'از خانه بیرون می‌روم.', 'اِودِن چیکییوروم', 'çıkmak', 'بیرون رفتن / بالا رفتن', 'ev + -den = از خانه'),
      trSentence('tr1-134', 'Yukarı çıkıyorum.', 'بالا می‌روم.', 'یوکاری چیکییوروم', 'yukarı', 'بالا', 'yukarı = بالا'),
      trSentence('tr1-135', 'Aşağı iniyorum.', 'پایین می‌روم.', 'آشاآ ایینییوروم', 'inmek', 'پایین آمدن / پیاده شدن', 'aşağı = پایین'),
      trSentence('tr1-136', 'İçeri girin.', 'داخل شوید.', 'ایچِری گیرین', 'girmek', 'وارد شدن', 'içeri girin = داخل شوید'),
    ],
    [
      { speaker: 'علی', text: 'Nereye gidiyorsun?', fa: 'کجا می‌روی؟' },
      { speaker: 'مریم', text: 'Okula gidiyorum. Sen nereden geliyorsun?', fa: 'به مدرسه می‌روم. تو از کجا می‌آیی؟' },
      { speaker: 'علی', text: 'Evden geliyorum. Önce pazara gittim.', fa: 'از خانه می‌آیم. اول به بازار رفتم.' },
      { speaker: 'مریم', text: 'Asansör bozuk, yukarı çıkıyor musun?', fa: 'آسانسور خراب است، بالا می‌روی؟' },
      { speaker: 'علی', text: 'Evet, merdivenle çıkıyorum.', fa: 'بله، با پله بالا می‌روم.' },
    ],
    [
      {
        promptFa: '«به مدرسه می‌روم» کدام است؟',
        choices: ['Okula gidiyorum.', 'Okuldan geliyorum.', 'Okulda çalışıyorum.'],
        correctIndex: 0,
        explanationFa: 'okul + -a = به مدرسه؛ -dan یعنی «از».',
      },
      {
        promptFa: 'پسوند «از» در ترکی کدام است؟',
        choices: ['-da/-de', '-a/-e', '-dan/-den'],
        correctIndex: 2,
        explanationFa: '-dan/-den یعنی «از»: evden (از خانه).',
      },
    ],
    'سه پسوند مسیر را جدا نگه دارید: -a/-e (به)، -da/-de (در)، -dan/-den (از). افعال حرکتی پرکاربرد: gitmek (رفتن)، gelmek (آمدن)، çıkmak (بیرون/بالا رفتن)، inmek (پایین آمدن)، girmek (وارد شدن).',
  ),

  trLesson(
    'tr-l1-18-past',
    'جمله‌های ساده در زمان گذشته',
    'می‌گویید دیروز کجا بودید و چه کاری کردید.',
    [
      trSentence('tr1-137', 'Dün evdeydim.', 'دیروز خانه بودم.', 'دون اِودِیدیم', 'dün', 'دیروز', 'evde + y + -dim = خانه بودم'),
      trSentence('tr1-138', 'Dün çok yorgundum.', 'دیروز خیلی خسته بودم.', 'دون چوک یورگوندوم', 'yorgun', 'خسته', 'yorgun + -dum = خسته بودم'),
      trSentence('tr1-139', 'Kahvaltı yaptım.', 'صبحانه خوردم.', 'کاه‌والتی یاپتیم', 'yapmak', 'انجام دادن', 'yap- + -tı- + -m = کردم'),
      trSentence('tr1-140', 'Bir kitap okudum.', 'یک کتاب خواندم.', 'بیر کیتاپ اوکودوم', 'okumak', 'خواندن', 'oku- + -du- + -m = خواندم'),
      trSentence('tr1-141', 'Arkadaşıma gittim.', 'به دیدن دوستم رفتم.', 'آرکاداشیتما گیتیم', 'arkadaş', 'دوست', 'arkadaşım + -a = به دوستم'),
      trSentence('tr1-142', 'Sinemaya gittik.', 'به سینما رفتیم.', 'سینِمایا گیتیک', 'sinema', 'سینما', 'git- + -ti- + -k = رفتیم'),
      trSentence('tr1-143', 'O bize geldi.', 'او به خانهٔ ما آمد.', 'او بیزِه گِلدی', 'bize', 'به ما', 'gel- + -di = آمد'),
      trSentence('tr1-144', 'Çok güzeldi.', 'خیلی خوب بود.', 'چوک گوزِلدی', 'güzeldi', 'خوب بود', 'güzel + -di = خوب بود'),
    ],
    [
      { speaker: 'علی', text: 'Dün ne yaptın?', fa: 'دیروز چه کار کردی؟' },
      { speaker: 'مریم', text: 'Dün evdeydim. Bir kitap okudum.', fa: 'دیروز خانه بودم. یک کتاب خواندم.' },
      { speaker: 'علی', text: 'Ben arkadaşıma gittim, sonra sinemaya gittik.', fa: 'من به دیدن دوستم رفتم، بعد به سینما رفتیم.' },
      { speaker: 'مریم', text: 'Film nasıldı?', fa: 'فیلم چطور بود؟' },
      { speaker: 'علی', text: 'Çok güzeldi!', fa: 'خیلی خوب بود!' },
    ],
    [
      {
        promptFa: '«دیروز خانه بودم» کدام است؟',
        choices: ['Dün evdeyim.', 'Dün evdeydim.', 'Dün evde olacağım.'],
        correctIndex: 1,
        explanationFa: 'evde + y + -dim = خانه بودم (گذشته).',
      },
      {
        promptFa: '«یک کتاب خواندم» چه می‌شود؟',
        choices: ['Bir kitap okudum.', 'Bir kitap okuyorum.', 'Bir kitap okuyacağım.'],
        correctIndex: 0,
        explanationFa: 'oku- + -du- + -m = خواندم.',
      },
    ],
    'پسوند گذشته -di/-dı/-du/-dü با هماهنگی واکه‌ها می‌آید: gel-dim، git-tim، oku-dum، yap-tım. برای «بود» اسم یا صفت هم -dı می‌گیرد: güzel-di، evde-y-dim. بعد از صامت بی‌واک، -di به -ti تبدیل می‌شود: git-ti.',
  ),

  trLesson(
    'tr-l1-19-future',
    'بیان قصد و برنامهٔ آینده',
    'می‌گویید فردا و آخر هفته چه خواهید کرد و قرار می‌گذارید.',
    [
      trSentence('tr1-145', 'Yarın erken kalkacağım.', 'فردا زود بیدار خواهم شد.', 'یارین اِرکِن کالکاجاآم', 'kalkmak', 'بلند شدن', 'kalk- + -acağ- + -ım = بیدار خواهم شد'),
      trSentence('tr1-146', 'Hafta sonu dinleneceğim.', 'آخر هفته استراحت خواهم کرد.', 'هافتا سونو دینلِنجِییم', 'hafta sonu', 'آخر هفته', 'dinlen- + -eceğ- + -im'),
      trSentence('tr1-147', 'Yazın tatile gideceğiz.', 'تابستان به تعطیلات خواهیم رفت.', 'یازین تاتیله گیدِجِییز', 'tatil', 'تعطیلات', 'gidecek + -iz = خواهیم رفت'),
      trSentence('tr1-148', 'Sana yardım edeceğim.', 'به تو کمک خواهم کرد.', 'سانا یاردیم اِدِجِییم', 'etmek', 'کردن', 'edecek + -im = خواهم کرد'),
      trSentence('tr1-149', 'Bir kahve içeceğim.', 'یک قهوه خواهم نوشید.', 'بیر کاهوِه ایچِجِییم', 'içmek', 'نوشیدن', 'iç- + -eceğ- + -im'),
      trSentence('tr1-150', 'Bu akşam ne yapacaksın?', 'امشب چه خواهی کرد؟', 'بو آکشام نِه یاپاجاکسین', 'bu akşam', 'امشب', 'yap-acak-sın = خواهی کرد'),
      trSentence('tr1-151', 'Saat sekizde buluşacağız.', 'ساعت هشت همدیگر را خواهیم دید.', 'ساعت سِکیزدِه بولوشاجاآیز', 'buluşmak', 'قرار گذاشتن / دیدار کردن', 'buluş-acak-ız'),
      trSentence('tr1-152', 'Belki yarın gelirim.', 'شاید فردا بیایم.', 'بِلکی یارین گِلیریم', 'belki', 'شاید', 'belki = شاید'),
    ],
    [
      { speaker: 'مریم', text: 'Yarın ne yapacaksın?', fa: 'فردا چه خواهی کرد؟' },
      { speaker: 'علی', text: 'Yarın erken kalkacağım ve çalışacağım.', fa: 'فردا زود بیدار می‌شوم و کار می‌کنم.' },
      { speaker: 'مریم', text: 'Hafta sonu tatile gideceğiz. Gelir misin?', fa: 'آخر هفته به تعطیلات می‌رویم. می‌آیی؟' },
      { speaker: 'علی', text: 'Belki gelirim. Saat kaçta buluşacağız?', fa: 'شاید بیایم. ساعت چند همدیگر را می‌بینیم؟' },
      { speaker: 'مریم', text: 'Saat sekizde buluşacağız.', fa: 'ساعت هشت همدیگر را می‌بینیم.' },
    ],
    [
      {
        promptFa: '«فردا زود بیدار خواهم شد» کدام است؟',
        choices: ['Yarın erken kalktım.', 'Yarın erken kalkacağım.', 'Yarın erken kalkıyorum.'],
        correctIndex: 1,
        explanationFa: 'پسوند -acak/-ecek آینده را می‌سازد.',
      },
      {
        promptFa: 'واژهٔ «belki» چه معنایی دارد؟',
        choices: ['حتماً', 'شاید', 'هرگز'],
        correctIndex: 1,
        explanationFa: 'belki = شاید.',
      },
    ],
    'آینده با -acak/-ecek ساخته می‌شود و «k» پیش از پسوند شخصی به «ğ» تبدیل می‌شود: yap-acak-ım → yapacağım، gidecek-iz → gideceğiz. برای قصد نزدیک، زمان سادهٔ -r (gelirim = می‌آیم) طبیعی‌تر است.',
  ),

  trLesson(
    'tr-l1-20-conjunctions',
    'اتصال دو جمله ساده با حروف ربط پایه',
    'دو جملهٔ کوتاه را با «و»، «ولی»، «چون»، «بنابراین» و «یا» به هم وصل می‌کنید.',
    [
      trSentence('tr1-153', 'Çay içiyorum ve kitap okuyorum.', 'چای می‌نوشم و کتاب می‌خوانم.', 'چای ایچییوروم وِه کیتاپ اوکویوروم', 've', 'و', 've = و (اتصال دو جمله)'),
      trSentence('tr1-154', 'Ev büyük ama eski.', 'خانه بزرگ است ولی کهنه.', 'اِو بویوک آما اِسکی', 'ama', 'ولی', 'ama = ولی'),
      trSentence('tr1-155', 'Gelmiyorum çünkü yorgunum.', 'نمی‌آیم چون خسته‌ام.', 'گِلمییوروم چونکو یورگونوم', 'çünkü', 'چون', 'çünkü = چون'),
      trSentence('tr1-156', 'Önce kahvaltı, sonra iş.', 'اول صبحانه، بعد کار.', 'اونجه کاه‌والتی، سونرا ایش', 'önce', 'اول', 'önce ... sonra ... = اول ... بعد ...'),
      trSentence('tr1-157', 'Yemek yedim, ondan sonra çıktım.', 'غذا خوردم، بعد از آن بیرون رفتم.', 'یِمِک یِدیم، اوندان سونرا چیکتیم', 'ondan sonra', 'بعد از آن', 'ondan sonra = بعد از آن'),
      trSentence('tr1-158', 'Hem Türkçe hem İngilizce konuşuyorum.', 'هم ترکی هم انگلیسی صحبت می‌کنم.', 'هِم تورکچه هِم اینگلیزجه کونوشویوروم', 'hem ... hem', 'هم ... هم', 'hem A hem B = هم الف هم ب'),
      trSentence('tr1-159', 'Çok çalışıyorum, bu yüzden iyiyim.', 'خیلی کار می‌کنم، به همین دلیل خوبم.', 'چوک چالیشییوروم، بو یوزدِن ایّی‌ییم', 'bu yüzden', 'به همین دلیل', 'bu yüzden = به همین دلیل'),
      trSentence('tr1-160', 'Sen gel veya ben geleyim.', 'تو بیا یا من بیایم.', 'سِن گِل وِیا بِن گِلِییم', 'veya', 'یا', 'veya = یا'),
    ],
    [
      { speaker: 'علی', text: 'Yarın ne yapıyorsun?', fa: 'فردا چه می‌کنی؟' },
      { speaker: 'مریم', text: 'Önce kahvaltı, sonra iş. Çok çalışıyorum çünkü sınav var.', fa: 'اول صبحانه، بعد کار. خیلی کار می‌کنم چون امتحان دارم.' },
      { speaker: 'علی', text: 'Ben de çalışıyorum ama akşam boşum.', fa: 'من هم کار می‌کنم ولی عصر آزادم.' },
      { speaker: 'مریم', text: 'O zaman akşam çay içelim ve konuşalım.', fa: 'پس عصر چای بنوشیم و صحبت کنیم.' },
      { speaker: 'علی', text: 'Harika! Sen gel veya ben geleyim.', fa: 'عالی! تو بیا یا من بیایم.' },
    ],
    [
      {
        promptFa: 'کدام حرف ربط معنی «ولی» می‌دهد؟',
        choices: ['ve', 'ama', 'çünkü'],
        correctIndex: 1,
        explanationFa: 'ama = ولی؛ ve = و؛ çünkü = چون.',
      },
      {
        promptFa: '«نمی‌آیم چون خسته‌ام» کدام است؟',
        choices: ['Gelmiyorum çünkü yorgunum.', 'Geliyorum ve yorgunum.', 'Gelmiyorum ama yorgunum.'],
        correctIndex: 0,
        explanationFa: 'çünkü دلیل را بیان می‌کند: چون خسته‌ام.',
      },
    ],
    'حروف ربط پایه: ve (و)، ama (ولی)، çünkü (چون)، veya (یا)، hem ... hem ... (هم ... هم ...)، bu yüzden (به همین دلیل). برای ترتیب رویدادها: önce (اول)، sonra (بعد)، ondan sonra (بعد از آن)، sonunda (در پایان).',
  ),
];
