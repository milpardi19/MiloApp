import type { LearningLesson } from './types';
import { trLesson, trSentence } from './turkishLessonKit';

/**
 * سطح ارتباط (Communication, B1) — بیان منسجم تجربه، توصیه، شرط و هماهنگی.
 */
export const TURKISH_COMMUNICATION_LESSONS: readonly LearningLesson[] = [
  trLesson(
    'tr-l4-experience',
    'روایت تجربه',
    'تجربه‌ای از سفر یا زندگی را کوتاه و منسجم تعریف می‌کنید.',
    [
      trSentence('tr4-01', 'Geçen yıl Türkiye\'ye gittim.', 'سال گذشته به ترکیه رفتم.', 'گِچِن ییل تورکی‌یِه گیتیم', 'geçen yıl', 'سال گذشته', 'geçen yıl = سال گذشته'),
      trSentence('tr4-02', 'Orada üç ay kaldım.', 'آن‌جا سه ماه ماندم.', 'اورادا اوچ آی کالدیم', 'kalmak', 'ماندن', 'üç ay = سه ماه'),
      trSentence('tr4-03', 'İlk başta zordu.', 'در ابتدا سخت بود.', 'ایلک باشتا زوردو', 'zor', 'سخت', 'ilk başta = در ابتدا'),
      trSentence('tr4-04', 'Sonra alıştım.', 'بعد عادت کردم.', 'سونرا آلیشتیم', 'alışmak', 'عادت کردن', 'sonra = بعد'),
      trSentence('tr4-05', 'Birçok arkadaş edindim.', 'دوستان زیادی پیدا کردم.', 'بیرچوک آرکاداش اِدین‌دیم', 'arkadaş edinmek', 'دوست پیدا کردن', 'birçok = بسیاری'),
      trSentence('tr4-06', 'Bu deneyim bana çok şey öğretti.', 'این تجربه چیزهای زیادی به من یاد داد.', 'بو دِنِییم بانا چوک شِی اویْرِتتی', 'deneyim', 'تجربه', 'bana = به من'),
      trSentence('tr4-07', 'Keşke daha önce başlasaydım.', 'ای کاش زودتر شروع کرده بودم.', 'کِشکه داها اونجه باشلاسایدیم', 'keşke', 'ای کاش', 'keşke + گذشتهٔ شرطی = افسوس'),
      trSentence('tr4-08', 'Şimdi daha iyi konuşuyorum.', 'الان بهتر صحبت می‌کنم.', 'شیمدی داها ایّی کونوشویوروم', 'konuşmak', 'صحبت کردن', 'daha iyi = بهتر'),
    ],
    [
      { speaker: 'مریم', text: 'Geçen yıl Türkiye\'ye gittim.', fa: 'سال گذشته به ترکیه رفتم.' },
      { speaker: 'علی', text: 'Ne kadar kaldın?', fa: 'چقدر ماندی؟' },
      { speaker: 'مریم', text: 'Üç ay kaldım. İlk başta zordu, sonra alıştım.', fa: 'سه ماه ماندم. اولش سخت بود، بعد عادت کردم.' },
      { speaker: 'علی', text: 'Türkçen çok iyi!', fa: 'ترکی‌ات خیلی خوب است!' },
      { speaker: 'مریم', text: 'Teşekkürler. Bu deneyim bana çok şey öğretti.', fa: 'ممنون. این تجربه چیزهای زیادی به من یاد داد.' },
    ],
    [
      {
        promptFa: 'برای گفتن «سال گذشته» کدام عبارت درست است؟',
        choices: ['geçen yıl', 'gelecek yıl', 'bu yıl'],
        correctIndex: 0,
        explanationFa: 'geçen yıl = سال گذشته؛ gelecek yıl = سال آینده.',
      },
      {
        promptFa: 'واژهٔ «keşke» چه حالتی را بیان می‌کند؟',
        choices: ['قطعیت', 'افسوس و آرزو', 'پرسش'],
        correctIndex: 1,
        explanationFa: 'keşke = ای کاش؛ برای آرزو یا افسوس دربارهٔ گذشته.',
      },
    ],
    'روایت منسجم با نشانه‌های ترتیب ساخته می‌شود: önce (اول)، sonra (بعد)، sonunda (در پایان)، ilk başta (در ابتدا). زمان گذشتهٔ ساده برای رویدادها و «-dı» برای توصیف حالت کافی است.',
  ),

  trLesson(
    'tr-l4-advice',
    'توصیه، خواهش و اجازه',
    'به کسی توصیه می‌کنید، درخواست مؤدبانه می‌کنید و اجازه می‌گیرید.',
    [
      trSentence('tr4-09', 'Bence bir doktora görünmelisin.', 'به نظر من باید به پزشک مراجعه کنی.', 'بِنجِه بیر دوکتورا گورونمِلیسین', 'görünmek', 'مراجعه کردن', 'görün- + -meli + -sin = باید مراجعه کنی'),
      trSentence('tr4-10', 'Sigara içmemelisin.', 'نباید سیگار بکشی.', 'سیگارا ایچمِمِلیسین', 'sigara', 'سیگار', 'iç- + -me- + -meli + -sin = نباید بکشی'),
      trSentence('tr4-11', 'Bana yardım eder misin?', 'به من کمک می‌کنی؟', 'بانا یاردیم اِدِر میسین', 'yardım etmek', 'کمک کردن', 'eder misin = می‌کنی؟'),
      trSentence('tr4-12', 'Mümkünse yarın buluşalım.', 'اگر ممکن است فردا همدیگر را ببینیم.', 'مومکونسه یارین بولو شالیم', 'buluşmak', 'دیدار کردن', 'buluş-alım = بیایید دیدار کنیم'),
      trSentence('tr4-13', 'Senden bir ricam var.', 'از تو یک خواهش دارم.', 'سِندِن بیر ریجام وار', 'rica', 'خواهش', 'rica = خواهش'),
      trSentence('tr4-14', 'Sakın geç kalma.', 'حواست باشد دیر نکنی.', 'ساکین گِچ کالما', 'sakın', 'زنهار / حواست باشد', 'sakın + منفی = هشدار'),
      trSentence('tr4-15', 'Rahat ol, endişelenme.', 'راحت باش، نگران نباش.', 'راحات اول، اِندی‌شِلِنمِه', 'endişelenmek', 'نگران شدن', 'endişelenme = نگران نشو'),
      trSentence('tr4-16', 'Bu konuda ne yapmalıyım?', 'در این باره چه باید بکنم؟', 'بو کونودا نِه یاپمالییم', 'konu', 'موضوع', 'ne yapmalıyım = چه باید بکنم'),
    ],
    [
      { speaker: 'مریم', text: 'Başım ağrıyor. Bu konuda ne yapmalıyım?', fa: 'سرم درد می‌کند. در این باره چه باید بکنم؟' },
      { speaker: 'علی', text: 'Bence bir doktora görünmelisin. Sigara içmemelisin.', fa: 'به نظر من باید به پزشک مراجعه کنی. نباید سیگار بکشی.' },
      { speaker: 'مریم', text: 'Haklısın. Senden bir ricam var: yarın benimle gelir misin?', fa: 'حق با توست. از تو یک خواهش دارم: فردا با من می‌آیی؟' },
      { speaker: 'علی', text: 'Tabii, rahat ol!', fa: 'البته، راحت باش!' },
    ],
    [
      {
        promptFa: 'پسوند «باید» در ترکی کدام است؟',
        choices: ['-meli/-malı', '-yor', '-ecek'],
        correctIndex: 0,
        explanationFa: 'gitmeliyim = باید بروم، yapmalısın = باید انجام دهی.',
      },
      {
        promptFa: 'برای درخواست مؤدبانه («می‌کنی؟») کدام ساختار درست است؟',
        choices: ['Yardım eder misin?', 'Yardım ediyorum.', 'Yardım etmelisin.'],
        correctIndex: 0,
        explanationFa: 'eder misin = «می‌کنی؟» با ذرهٔ پرسشی.',
      },
    ],
    'با -meli/-malı باید و اجبار بیان می‌شود؛ نفی آن با -me/-ma پیش از پسوند ساخته می‌شود: içmemelisin (نباید بنوشی). «sakın» هشدار دوستانه می‌سازد: sakın geç kalma.',
  ),

  trLesson(
    'tr-l4-plans',
    'شرط، برنامه و تصمیم',
    'برنامه‌های مشترک می‌چینید، شرط می‌گذارید و برای آینده تصمیم می‌گیرید.',
    [
      trSentence('tr4-17', 'Eğer yağmur yağmazsa, parka gideriz.', 'اگر باران نبارد، به پارک می‌رویم.', 'اِیِر یاغمور یاغمازسا، پارکا گیدِریز', 'eğer', 'اگر', 'eğer + شرط + نتیجه'),
      trSentence('tr4-18', 'Vaktim olsaydı gelirdim.', 'اگر وقت داشتم می‌آمدم.', 'واک‌تیم اولسایدی گِلیردیم', 'vakit', 'وقت', 'olsaydı + gelirdim = شرط خلاف واقع'),
      trSentence('tr4-19', 'Keşke daha çok çalışsaydım.', 'ای کاش بیشتر کار کرده بودم.', 'کِشکه داها چوک چالیشسایدیم', 'çalışmak', 'کار کردن', 'keşke + -saydı + -m = افسوس گذشته'),
      trSentence('tr4-20', 'Hava güzelse yürüyüşe çıkarız.', 'اگر هوا خوب باشد پیاده‌روی می‌رویم.', 'هَوا گوزِلسِه یورویوشه چیکاریز', 'güzel', 'خوب / زیبا', '-se/-sa = اگر'),
      trSentence('tr4-21', 'Planımız değişebilir.', 'برنامه‌مان می‌تواند تغییر کند.', 'پلانیمیز دِییشِبیلیر', 'değişmek', 'تغییر کردن', 'değiş- + -ebilir = ممکن است تغییر کند'),
      trSentence('tr4-22', 'Sana haber veririm.', 'به تو خبر می‌دهم.', 'سانا هابِر وِریریم', 'haber vermek', 'خبر دادن', 'haber veririm = خبر می‌دهم'),
      trSentence('tr4-23', 'Hazır olduğunda bana söyle.', 'وقتی آماده شدی به من بگو.', 'هازیر اولدوغوندا بانا سویله', 'söylemek', 'گفتن', '-dığunda = وقتی که'),
      trSentence('tr4-24', 'Birlikte karar verelim.', 'با هم تصمیم بگیریم.', 'بیرلیکتِه کارار وِرِلیم', 'karar vermek', 'تصمیم گرفتن', '-alım/-elim = بیایید ...'),
    ],
    [
      { speaker: 'علی', text: 'Yarın ne yapalım?', fa: 'فردا چه کنیم؟' },
      { speaker: 'مریم', text: 'Hava güzelse yürüyüşe çıkarız.', fa: 'اگر هوا خوب باشد پیاده‌روی می‌رویم.' },
      { speaker: 'علی', text: 'Eğer yağmur yağarsa?', fa: 'اگر باران ببارد؟' },
      { speaker: 'مریم', text: 'O zaman evde kalırız. Sana haber veririm.', fa: 'آن وقت خانه می‌مانیم. به تو خبر می‌دهم.' },
      { speaker: 'علی', text: 'Tamam, birlikte karar verelim.', fa: 'باشه، با هم تصمیم بگیریم.' },
    ],
    [
      {
        promptFa: 'برای بیان شرط («اگر») کدام ساختار رایج است؟',
        choices: ['-se/-sa', '-yor', '-meli'],
        correctIndex: 0,
        explanationFa: 'hava güzelse = اگر هوا خوب باشد.',
      },
      {
        promptFa: '«ای کاش بیشتر کار کرده بودم» کدام است؟',
        choices: ['Keşke daha çok çalışsaydım.', 'Daha çok çalışacağım.', 'Daha çok çalışıyorum.'],
        correctIndex: 0,
        explanationFa: 'keşke + گذشتهٔ شرطی افسوس دربارهٔ گذشته می‌سازد.',
      },
    ],
    'شرط واقعی: -(y)se/-sa + نتیجه (hava güzelse çıkarız). شرط خلاف واقع در گذشته: -saydı/-seydi + -dı (olsaydı gelirdim). پیشنهاد مشترک با -alım/-elim ساخته می‌شود: gidelim (برویم).',
  ),

  trLesson(
    'tr-l4-phone',
    'تلفن، پیام و قرار',
    'تماس تلفنی می‌گیرید، وقت می‌گیرید و قرار را جابه‌جا می‌کنید.',
    [
      trSentence('tr4-25', 'Alo, beni duyuyor musunuz?', 'الو، صدایم را می‌شنوید؟', 'آلو، بِنی دویویور موسونوز', 'duymak', 'شنیدن', 'duy-uyor-mu-sunuz = می‌شنوید؟'),
      trSentence('tr4-26', 'Sesiniz gelmiyor.', 'صدایتان نمی‌آید.', 'سِسینیز گِلمییور', 'ses', 'صدا', 'gelmiyor = نمی‌آید'),
      trSentence('tr4-27', 'Sizi arayabilir miyim?', 'می‌توانم به شما زنگ بزنم؟', 'سیزی آرایابیلیر می‌ییم', 'aramak', 'زنگ زدن', 'sizi aramak = به شما زنگ زدن'),
      trSentence('tr4-28', 'Yarın için randevu alabilir miyim?', 'می‌توانم برای فردا وقت بگیرم؟', 'یارین ایچین راندِوو آلابیلیر می‌ییم', 'randevu', 'وقت / قرار', 'randevu almak = وقت گرفتن'),
      trSentence('tr4-29', 'Saat kaçta uygun?', 'چه ساعتی مناسب است؟', 'ساعت کاچتا اویگون', 'uygun', 'مناسب', 'uygun = مناسب'),
      trSentence('tr4-30', 'Toplantıyı erteleyebilir miyiz?', 'می‌توانیم جلسه را عقب بیندازیم؟', 'توپلانتی‌یی اِرتِلِیِبیلیر می‌ییز', 'ertelemek', 'عقب انداختن', 'ertele- + -yebilir + miyiz'),
      trSentence('tr4-31', 'Biraz geç kalacağım.', 'کمی دیر می‌رسم.', 'بیراز گِچ کالاجاآم', 'geç kalmak', 'دیر شدن', 'kal- + -acak + -ım'),
      trSentence('tr4-32', 'Mesajınızı aldım.', 'پیامتان را دریافت کردم.', 'مِساجینیزین آل‌دیم', 'mesaj', 'پیام', 'mesaj + -ınız + -ı = پیامتان را'),
    ],
    [
      { speaker: 'مریم', text: 'Alo, iyi günler. Randevu alabilir miyim?', fa: 'الو، روز بخیر. می‌توانم وقت بگیرم؟' },
      { speaker: 'منشی', text: 'Tabii. Hangi gün uygun?', fa: 'البته. چه روزی مناسب است؟' },
      { speaker: 'مریم', text: 'Yarın için, saat kaçta uygun?', fa: 'برای فردا، چه ساعتی مناسب است؟' },
      { speaker: 'منشی', text: 'Saat on birde.', fa: 'ساعت یازده.' },
      { speaker: 'مریم', text: 'Tamam. Biraz geç kalabilirim, haber veririm.', fa: 'باشه. ممکن است کمی دیر برسم، خبر می‌دهم.' },
    ],
    [
      {
        promptFa: '«می‌توانم وقت بگیرم؟» کدام است؟',
        choices: ['Randevu alabilir miyim?', 'Randevu nerede?', 'Randevum var.'],
        correctIndex: 0,
        explanationFa: 'randevu almak = وقت گرفتن.',
      },
      {
        promptFa: 'برای جابه‌جا کردن قرار («عقب انداختن») کدام فعل است؟',
        choices: ['ertelemek', 'aramak', 'almak'],
        correctIndex: 0,
        explanationFa: 'ertelemek = عقب انداختن؛ aramak = زنگ زدن.',
      },
    ],
    'در تماس رسمی با «siz» صحبت کنید: duyuyor musunuz، arayabilir miyim. برای توافق روی زمان «saat kaçta uygun?» کوتاه‌ترین راه است؛ پاسخ هم با پسوند -da/-de می‌آید: on birde (ساعت یازده).',
  ),
];
