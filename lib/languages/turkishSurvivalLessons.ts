import type { LearningLesson } from './types';
import { trLesson, trSentence } from './turkishLessonKit';

/**
 * هشت درس موقعیتیِ موجود در مسیر A1 Survival؛ ترتیب نهایی در turkish.ts است.
 * موضوع‌های جدید در turkishSurvivalLessonsB.ts افزوده شده‌اند.
 */
export const TURKISH_SURVIVAL_LESSONS: readonly LearningLesson[] = [
  trLesson(
    'tr-l2-cafe',
    'سفارش در کافه',
    'در کافه می‌نشینید، نوشیدنی سفارش می‌دهید، شیرینی می‌خواهید و صورت‌حساب می‌گیرید.',
    [
      trSentence('tr2-01', 'Bir kahve alabilir miyim?', 'می‌توانم یک قهوه بگیرم؟', 'بیر کاهوِه آلابیلیر می‌ییم', 'alabilir miyim', 'می‌توانم بگیرم؟', 'فعل + -abilir + miyim = می‌توانم ...؟'),
      trSentence('tr2-02', 'Ne içmek istersiniz?', 'چه می‌نوشید؟', 'نِه ایچمِک ایستِرسینیز', 'içmek', 'نوشیدن', 'ne + مصدر + istersiniz = چه میل دارید؟'),
      trSentence('tr2-03', 'Ben çay istiyorum.', 'من چای می‌خواهم.', 'بِن چای ایستییوروم', 'istemek', 'خواستن', 'ben + چیز + istiyorum = من ... می‌خواهم'),
      trSentence('tr2-04', 'Şekersiz olsun.', 'بی‌شکر باشد.', 'شِکِرسیز اولسون', 'şekersiz', 'بی‌شکر', 'صفت + olsun = ... باشد'),
      trSentence('tr2-05', 'Bir bardak su, lütfen.', 'یک لیوان آب، لطفاً.', 'بیر بارداق سو، لوتفِن', 'bardak', 'لیوان', 'bir bardak su = یک لیوان آب'),
      trSentence('tr2-06', 'Hesap, lütfen.', 'صورت‌حساب، لطفاً.', 'حِساپ، لوتفِن', 'hesap', 'صورت‌حساب', 'hesap, lütfen = صورت‌حساب لطفاً'),
      trSentence('tr2-07', 'Ne kadar?', 'چقدر شد؟', 'نِه کادار', 'ne kadar', 'چه‌قدر', 'ne kadar = چقدر'),
      trSentence('tr2-08', 'Afiyet olsun!', 'نوش جان!', 'آفی‌یِت اولسون', 'afiyet olsun', 'نوش جان', 'afiyet olsun = نوش جان'),
    ],
    [
      { speaker: 'گارسون', text: 'Hoş geldiniz! Ne içmek istersiniz?', fa: 'خوش آمدید! چه می‌نوشید؟' },
      { speaker: 'مریم', text: 'Bir kahve alabilir miyim?', fa: 'می‌توانم یک قهوه بگیرم؟' },
      { speaker: 'گارسون', text: 'Tabii. Şekerli mi?', fa: 'البته. با شکر؟' },
      { speaker: 'مریم', text: 'Şekersiz olsun, lütfen.', fa: 'بی‌شکر باشد، لطفاً.' },
      { speaker: 'مریم', text: 'Hesap, lütfen. Ne kadar?', fa: 'صورت‌حساب لطفاً. چقدر شد؟' },
    ],
    [
      {
        promptFa: 'برای سفارش مؤدبانه («می‌توانم ... بگیرم؟») کدام ساختار درست است؟',
        choices: ['Bir kahve alabilir miyim?', 'Bir kahve istiyorsun.', 'Bir kahve nerede?'],
        correctIndex: 0,
        explanationFa: 'al- + -abilir + miyim همان «می‌توانم بگیرم؟» است.',
      },
      {
        promptFa: '«بی‌شکر» در ترکی چه می‌شود؟',
        choices: ['Şekerli', 'Şekersiz', 'Sütlü'],
        correctIndex: 1,
        explanationFa: 'پسوند -siz/-sız یعنی «بدون»: şekersiz = بی‌شکر.',
      },
    ],
    'پسوند -abil/-ebil یعنی «توانستن»: al-abil-ir-im (می‌توانم بگیرم). برای درخواست مؤدبانه در کافه و رستوران همین الگو را با miyim/misiniz سؤال کنید.',
  ),

  trLesson(
    'tr-l2-restaurant',
    'در رستوران و سفارش غذا',
    'منو می‌خواهید، پیشنهاد می‌پرسید، غذای بدون گوشت سفارش می‌دهید و صورت‌حساب می‌گیرید.',
    [
      trSentence('tr2-09', 'Menüyü görebilir miyim?', 'می‌توانم منو را ببینم؟', 'مِنویو گورِبیلیر می‌ییم', 'menü', 'منو', 'menü + -yü (مفعول) = منو را'),
      trSentence('tr2-10', 'Ne tavsiye edersiniz?', 'چه پیشنهاد می‌کنید؟', 'نِه تاوْسیه اِدِرسینیز', 'tavsiye etmek', 'پیشنهاد کردن', 'ne tavsiye edersiniz = چه پیشنهاد می‌کنید؟'),
      trSentence('tr2-11', 'Ben tavuk istiyorum.', 'من مرغ می‌خواهم.', 'بِن تاووق ایستییوروم', 'tavuk', 'مرغ', 'ben + tavuk + istiyorum'),
      trSentence('tr2-12', 'Et yemiyorum.', 'گوشت نمی‌خورم.', 'اِت یِمییوروم', 'et', 'گوشت', 'ye- + -mi- + -yor- + -um = نمی‌خورم'),
      trSentence('tr2-13', 'Acı mı?', 'تند است؟', 'آجی می', 'acı', 'تند', 'صفت + mı? = آیا ... است؟'),
      trSentence('tr2-14', 'Çok lezzetli!', 'خیلی خوشمزه است!', 'چوک لِزّتلی', 'lezzetli', 'خوشمزه', 'çok lezzetli = خیلی خوشمزه'),
      trSentence('tr2-15', 'Bir şişe su, lütfen.', 'یک بطری آب، لطفاً.', 'بیر شیشِه سو، لوتفِن', 'şişe', 'بطری', 'bir şişe su = یک بطری آب'),
      trSentence('tr2-16', 'Hesabı alabilir miyim?', 'می‌توانم صورت‌حساب بگیرم؟', 'حِسابی آلابیلیر می‌ییم', 'hesap', 'صورت‌حساب', 'hesab-ı (مفعولِ hesap) + alabilir miyim'),
    ],
    [
      { speaker: 'مریم', text: 'Menüyü görebilir miyim?', fa: 'می‌توانم منو را ببینم؟' },
      { speaker: 'پیشخدمت', text: 'Buyurun. Ne tavsiye edersiniz derseniz, bugün çorba çok güzel.', fa: 'بفرمایید. اگر پیشنهاد می‌خواهید، امروز سوپ خیلی خوب است.' },
      { speaker: 'مریم', text: 'Ben tavuk istiyorum. Acı mı?', fa: 'من مرغ می‌خواهم. تند است؟' },
      { speaker: 'پیشخدمت', text: 'Hayır, acı değil. Afiyet olsun!', fa: 'نه، تند نیست. نوش جان!' },
      { speaker: 'مریم', text: 'Çok lezzetli! Hesabı alabilir miyim?', fa: 'خیلی خوشمزه است! می‌توانم صورت‌حساب بگیرم؟' },
    ],
    [
      {
        promptFa: 'برای گفتن «گوشت نمی‌خورم» کدام جمله درست است؟',
        choices: ['Et yiyorum.', 'Et yemiyorum.', 'Et istiyorum.'],
        correctIndex: 1,
        explanationFa: 'ye-miyor-um یعنی «نمی‌خورم»؛ yiyorum یعنی «می‌خورم».',
      },
      {
        promptFa: 'می‌خواهید بدانید غذا تند است یا نه؛ چه می‌پرسید؟',
        choices: ['Acı mı?', 'Ne kadar?', 'Nerede?'],
        correctIndex: 0,
        explanationFa: 'Acı mı? یعنی «تند است؟».',
      },
    ],
    'برای پرسش بله/نه صفت یا اسم را با ذرهٔ mı/mi/mu/mü سؤال کنید: Acı mı? (تند است؟) ، Lezzetli mi? (خوشمزه است؟). در گفتار روزمره «çok lezzetli» یا «çok güzel» برای تعریف غذا کافی است.',
  ),

  trLesson(
    'tr-l2-shopping',
    'خرید کردن',
    'در فروشگاه قیمت می‌پرسید، سایز می‌خواهید، پرو می‌کنید و پرداخت می‌کنید.',
    [
      trSentence('tr2-17', 'Bunun fiyatı ne kadar?', 'قیمت این چقدر است؟', 'بونون فییاتی نِه کادار', 'fiyat', 'قیمت', 'bunun fiyatı = قیمت این'),
      trSentence('tr2-18', 'Daha büyük beden var mı?', 'سایز بزرگ‌تر دارید؟', 'داها بویوک بِلِن وار می', 'beden', 'سایز', 'daha büyük = بزرگ‌تر'),
      trSentence('tr2-19', 'Deneyebilir miyim?', 'می‌توانم پرو کنم؟', 'دِنِیِبیلیر می‌ییم', 'denemek', 'امتحان کردن / پرو کردن', 'dene- + -yebilir + miyim'),
      trSentence('tr2-20', 'Bu çok pahalı.', 'این خیلی گران است.', 'بو چوک پاحالی', 'pahalı', 'گران', 'pahalı = گران'),
      trSentence('tr2-21', 'İndirim var mı?', 'تخفیف دارید؟', 'ایندی‌ریم وار می', 'indirim', 'تخفیف', 'indirim var mı = تخفیف هست؟'),
      trSentence('tr2-22', 'Ben bunu alıyorum.', 'این را می‌خرم.', 'بِن بونو آلییوروم', 'almak', 'خریدن / گرفتن', 'bunu = این را (مفعول)'),
      trSentence('tr2-23', 'Kartla ödeyebilir miyim?', 'می‌توانم با کارت پرداخت کنم؟', 'کارتلا اودی‌یِبیلیر می‌ییم', 'kart', 'کارت', 'kart + -la = با کارت'),
      trSentence('tr2-24', 'Fiş, lütfen.', 'فاکتور، لطفاً.', 'فیش، لوتفِن', 'fiş', 'فاکتور', 'fiş = فاکتور خرید'),
    ],
    [
      { speaker: 'مریم', text: 'Bunun fiyatı ne kadar?', fa: 'قیمت این چقدر است؟' },
      { speaker: 'فروشنده', text: 'İki yüz lira.', fa: 'دویست لیر.' },
      { speaker: 'مریم', text: 'Çok pahalı. İndirim var mı?', fa: 'خیلی گران است. تخفیف دارید؟' },
      { speaker: 'فروشنده', text: 'Evet, yüz elli lira olur.', fa: 'بله، صد و پنجاه لیر می‌شود.' },
      { speaker: 'مریم', text: 'Tamam, bunu alıyorum. Kartla ödeyebilir miyim?', fa: 'باشه، این را می‌خرم. با کارت می‌شود؟' },
    ],
    [
      {
        promptFa: 'برای پرسیدن قیمت کدام جمله درست است؟',
        choices: ['Bunun fiyatı ne kadar?', 'Bunu nerede?', 'Bunu alıyorum.'],
        correctIndex: 0,
        explanationFa: 'Bunun fiyatı ne kadar? یعنی «قیمت این چقدر است؟».',
      },
      {
        promptFa: 'می‌خواهید لباس را پرو کنید؛ چه می‌گویید؟',
        choices: ['Deneyebilir miyim?', 'Alabilir miyim?', 'Ödeyebilir miyim?'],
        correctIndex: 0,
        explanationFa: 'denemek یعنی امتحان/پرو کردن؛ deneyebilir miyim = می‌توانم پرو کنم؟',
      },
    ],
    'مفعول مستقیم (که به «را» در فارسی نزدیک است) با پسوند -i/-ı/-u/-ü ساخته می‌شود: bunu alıyorum (این را می‌خرم). اگر مفعول مشخص نباشد پسوند نمی‌گیرد: ekmek alıyorum (نان می‌خرم).',
  ),

  trLesson(
    'tr-l2-directions',
    'آدرس و مسیر',
    'در شهر گم شده‌اید و می‌خواهید به مترو، موزه یا داروخانه برسید.',
    [
      trSentence('tr2-25', 'Metro nerede?', 'مترو کجاست؟', 'مِترو نِرِدِه', 'metro', 'مترو', 'مکان + nerede = ... کجاست'),
      trSentence('tr2-26', 'Müzeye nasıl gidebilirim?', 'چطور می‌توانم به موزه بروم؟', 'موزِیِه ناصِل گیدِبیلیریم', 'gitmek', 'رفتن', 'müze + -ye (به) + nasıl gidebilirim'),
      trSentence('tr2-27', 'Düz gidin.', 'مستقیم بروید.', 'دوز گیدین', 'düz', 'مستقیم', 'düz gitmek = مستقیم رفتن'),
      trSentence('tr2-28', 'Sağa dönün.', 'به راست بپیچید.', 'ساآ دونون', 'sağ', 'راست', 'sağ + -a = به راست'),
      trSentence('tr2-29', 'Sola dönün.', 'به چپ بپیچید.', 'سولا دونون', 'sol', 'چپ', 'sol + -a = به چپ'),
      trSentence('tr2-30', 'Yakın mı?', 'نزدیک است؟', 'یاقین می', 'yakın', 'نزدیک', 'yakın = نزدیک'),
      trSentence('tr2-31', 'Hayır, uzak.', 'نه، دور است.', 'هایِر، اوزاق', 'uzak', 'دور', 'uzak = دور'),
      trSentence('tr2-32', 'Eczane arıyorum.', 'داروخانه می‌گردم.', 'اِجزانه آرییوروم', 'aramak', 'جست‌وجو کردن', 'ara- + -yor- + -um = می‌گردم'),
    ],
    [
      { speaker: 'گردشگر', text: 'Affedersiniz, metro nerede?', fa: 'ببخشید، مترو کجاست؟' },
      { speaker: 'رهگذر', text: 'Düz gidin, sonra sağa dönün.', fa: 'مستقیم بروید، بعد به راست بپیچید.' },
      { speaker: 'گردشگر', text: 'Yakın mı?', fa: 'نزدیک است؟' },
      { speaker: 'رهگذر', text: 'Evet, beş dakika.', fa: 'بله، پنج دقیقه.' },
      { speaker: 'گردشگر', text: 'Teşekkür ederim!', fa: 'ممنونم!' },
    ],
    [
      {
        promptFa: 'راهنمایی «به چپ بپیچید» کدام است؟',
        choices: ['Sağa dönün.', 'Sola dönün.', 'Düz gidin.'],
        correctIndex: 1,
        explanationFa: 'sol چپ است؛ sola dönün یعنی «به چپ بپیچید».',
      },
      {
        promptFa: '«نزدیک است؟» چگونه پرسیده می‌شود؟',
        choices: ['Uzak mı?', 'Yakın mı?', 'Nerede?'],
        correctIndex: 1,
        explanationFa: 'yakın = نزدیک، uzak = دور.',
      },
    ],
    'جهت‌ها با پسوند «به» می‌آیند: sağ-a (به راست)، sol-a (به چپ). برای پرسیدن مسیر «... nasıl gidebilirim?» امن‌ترین جمله است: Metroya nasıl gidebilirim?',
  ),

  trLesson(
    'tr-l2-time',
    'ساعت، روز و قرار',
    'می‌خواهید ساعت را بپرسید، بگویید قرار چه ساعتی است و روز را مشخص کنید.',
    [
      trSentence('tr2-33', 'Saat kaç?', 'ساعت چند است؟', 'ساعت کاچ', 'saat kaç', 'ساعت چند', 'saat kaç? = ساعت چند است؟'),
      trSentence('tr2-34', 'Saat üç.', 'ساعت سه است.', 'ساعت اوچ', 'üç', 'سه', 'saat + عدد = ساعت ...'),
      trSentence('tr2-35', 'Şimdi saat beş.', 'الان ساعت پنج است.', 'شیمدی ساعت بِش', 'şimdi', 'الان', 'şimdi = الان'),
      trSentence('tr2-36', 'Saat kaçta?', 'ساعت چند؟ (قرار)', 'ساعت کاچتا', 'kaçta', 'در چه ساعتی', 'saat kaçta? = ساعت چند؟'),
      trSentence('tr2-37', 'Ders dokuzda başlıyor.', 'کلاس ساعت نه شروع می‌شود.', 'دِرس دوکوزدا باشلییور', 'başlamak', 'شروع شدن', 'dokuz + -da = ساعت نه'),
      trSentence('tr2-38', 'Bugün çok güzel bir gün.', 'امروز روز خیلی خوبی است.', 'بوگون چوک گوزل بیر گون', 'bugün', 'امروز', 'bugün = امروز'),
      trSentence('tr2-39', 'Yarın görüşürüz.', 'فردا می‌بینمت.', 'یارین گوروشوروز', 'yarın', 'فردا', 'yarın = فردا'),
      trSentence('tr2-40', 'Birazdan geliyorum.', 'کمی بعد می‌آیم.', 'بیرازدان گِلییوروم', 'birazdan', 'کمی بعد', 'biraz + -dan = بعد از کمی'),
    ],
    [
      { speaker: 'مریم', text: 'Affedersiniz, saat kaç?', fa: 'ببخشید، ساعت چند است؟' },
      { speaker: 'رهگذر', text: 'Şimdi saat beş.', fa: 'الان ساعت پنج است.' },
      { speaker: 'مریم', text: 'Ders saat kaçta başlıyor?', fa: 'کلاس ساعت چند شروع می‌شود؟' },
      { speaker: 'رهگذر', text: 'Altıda başlıyor.', fa: 'ساعت شش شروع می‌شود.' },
      { speaker: 'مریم', text: 'Teşekkürler, yarın görüşürüz!', fa: 'ممنون، فردا می‌بینمت!' },
    ],
    [
      {
        promptFa: 'برای پرسیدن «ساعت چند است؟» کدام جمله درست است؟',
        choices: ['Saat kaçta?', 'Saat kaç?', 'Bugün mü?'],
        correctIndex: 1,
        explanationFa: 'Saat kaç? یعنی «ساعت چند است؟»؛ saat kaçta برای «ساعتِ قرار».',
      },
      {
        promptFa: 'واژهٔ «فردا» کدام است؟',
        choices: ['bugün', 'yarın', 'dün'],
        correctIndex: 1,
        explanationFa: 'yarın = فردا، bugün = امروز، dün = دیروز.',
      },
    ],
    'برای ساعتِ قرار پسوند -da/-de به عدد می‌چسبد: dokuz-da (ساعت نه)، beş-te (ساعت پنج). اگر عدد به صامت بی‌واک ختم شود، -da به -ta تبدیل می‌شود: üç-te.',
  ),

  trLesson(
    'tr-l2-transport',
    'تاکسی، اتوبوس و مسیر',
    'تاکسی می‌گیرید، آدرس می‌دهید، بلیت می‌خرید و می‌خواهید پیاده شوید.',
    [
      trSentence('tr2-41', 'Bu otobüs havalimanına gidiyor mu?', 'این اتوبوس به فرودگاه می‌رود؟', 'بو اوتوبوس هاوالیمانینا گیدییور مو', 'havalimanı', 'فرودگاه', 'havalimanı + -na = به فرودگاه'),
      trSentence('tr2-42', 'Bir bilet, lütfen.', 'یک بلیت، لطفاً.', 'بیر بیلِت، لوتفِن', 'bilet', 'بلیت', 'bir bilet = یک بلیت'),
      trSentence('tr2-43', 'Taksi çağırabilir misiniz?', 'می‌توانید تاکسی صدا کنید؟', 'تاکسی چاآرابیلیر میسینیز', 'çağırmak', 'صدا زدن', 'çağır- + -abilir + misiniz'),
      trSentence('tr2-44', 'Beni bu adrese götürün.', 'مرا به این آدرس ببرید.', 'بِنی بو آدرِسِه گوتورون', 'götürmek', 'بردن', 'beni = مرا'),
      trSentence('tr2-45', 'Burada durabilir misiniz?', 'می‌توانید اینجا بایستید؟', 'بورادا دورابیلیر میسینیز', 'durmak', 'ایستادن', 'burada = اینجا'),
      trSentence('tr2-46', 'Ne kadar sürer?', 'چقدر طول می‌کشد؟', 'نِه کادار سورِر', 'sürmek', 'طول کشیدن', 'ne kadar sürer = چقدر طول می‌کشد'),
      trSentence('tr2-47', 'Trafik var.', 'ترافیک است.', 'ترافیک وار', 'trafik', 'ترافیک', 'var = هست'),
      trSentence('tr2-48', 'İnecek var!', 'یک نفر پیاده می‌شود!', 'اینجِجِک وار', 'inmek', 'پیاده شدن', 'inecek var = کسی می‌خواهد پیاده شود'),
    ],
    [
      { speaker: 'مسافر', text: 'Merhaba, beni bu adrese götürün, lütfen.', fa: 'سلام، مرا به این آدرس ببرید، لطفاً.' },
      { speaker: 'راننده', text: 'Tamam. Trafik var, biraz sürer.', fa: 'باشه. ترافیک است، کمی طول می‌کشد.' },
      { speaker: 'مسافر', text: 'Ne kadar sürer?', fa: 'چقدر طول می‌کشد؟' },
      { speaker: 'راننده', text: 'Yirmi dakika.', fa: 'بیست دقیقه.' },
      { speaker: 'مسافر', text: 'Burada durabilir misiniz?', fa: 'می‌توانید اینجا بایستید؟' },
    ],
    [
      {
        promptFa: 'برای گفتن «مرا به این آدرس ببرید» کدام جمله درست است؟',
        choices: ['Beni bu adrese götürün.', 'Bu adres nerede?', 'Bir bilet lütfen.'],
        correctIndex: 0,
        explanationFa: 'beni = مرا، götürün = ببرید.',
      },
      {
        promptFa: 'واژهٔ «trafik» چه معنایی دارد؟',
        choices: ['بلیت', 'ترافیک', 'آدرس'],
        correctIndex: 1,
        explanationFa: 'trafik یعنی ترافیک؛ bilet بلیت و adres آدرس است.',
      },
    ],
    'در اتوبوس‌های استانبول برای اعلام پیاده شدن «İnecek var!» می‌گویند. برای مقصد هم ساختار «... -a/-e gitmek» را به کار ببرید: havalimanına gidiyorum (به فرودگاه می‌روم).',
  ),

  trLesson(
    'tr-l2-hotel',
    'هتل و اقامت',
    'رزرو دارید، اتاق می‌خواهید، صبحانه و کلید می‌پرسید و ساعت تخلیه را می‌دانید.',
    [
      trSentence('tr2-49', 'Rezervasyonum var.', 'رزرو دارم.', 'رِزِرواسیونوم وار', 'rezervasyon', 'رزرو', 'rezervasyon + -um = رزروِ من'),
      trSentence('tr2-50', 'Bir gece kalacağım.', 'یک شب می‌مانم.', 'بیر گِجِه کالاجاآم', 'gece', 'شب', 'bir gece = یک شب'),
      trSentence('tr2-51', 'Tek kişilik oda var mı?', 'اتاق یک‌نفره دارید؟', 'تِک کیشیلیک اودا وار می', 'oda', 'اتاق', 'tek kişilik = یک‌نفره'),
      trSentence('tr2-52', 'Kahvaltı dahil mi?', 'صبحانه شامل است؟', 'کاه‌والتی داخیل می', 'kahvaltı', 'صبحانه', 'dahil = شامل'),
      trSentence('tr2-53', 'Anahtar, lütfen.', 'کلید، لطفاً.', 'آناهتار، لوتفِن', 'anahtar', 'کلید', 'anahtar = کلید'),
      trSentence('tr2-54', 'Asansör nerede?', 'آسانسور کجاست؟', 'آسانسور نِرِدِه', 'asansör', 'آسانسور', 'asansör nerede = آسانسور کجاست'),
      trSentence('tr2-55', 'Odaya çıkabilir miyim?', 'می‌توانم به اتاق بروم؟', 'اودایا چیکابیلیر می‌ییم', 'çıkmak', 'بالا رفتن', 'oda + -ya = به اتاق'),
      trSentence('tr2-56', 'Çıkış saat kaçta?', 'ساعت تخلیه چه زمانی است؟', 'چیکیش ساعت کاچتا', 'çıkış', 'خروج', 'çıkış saati = ساعت خروج'),
    ],
    [
      { speaker: 'مریم', text: 'Merhaba, rezervasyonum var.', fa: 'سلام، رزرو دارم.' },
      { speaker: 'پذیرش', text: 'Adınız nedir?', fa: 'اسمتان چیست؟' },
      { speaker: 'مریم', text: 'Meryem Ahmadi. Kahvaltı dahil mi?', fa: 'مریم احمدی. صبحانه شامل است؟' },
      { speaker: 'پذیرش', text: 'Evet, sabah yedide.', fa: 'بله، صبح ساعت هفت.' },
      { speaker: 'مریم', text: 'Teşekkürler. Asansör nerede?', fa: 'ممنون. آسانسور کجاست؟' },
    ],
    [
      {
        promptFa: 'برای گفتن «رزرو دارم» چه می‌گویید؟',
        choices: ['Rezervasyonum var.', 'Bir gece kalacağım.', 'Oda nerede?'],
        correctIndex: 0,
        explanationFa: 'rezervasyon + -um + var = رزرو دارم.',
      },
      {
        promptFa: '«صبحانه شامل است؟» چگونه پرسیده می‌شود؟',
        choices: ['Kahvaltı dahil mi?', 'Anahtar nerede?', 'Çıkış saat kaçta?'],
        correctIndex: 0,
        explanationFa: 'kahvaltı = صبحانه، dahil = شامل.',
      },
    ],
    'پسوند مالکیت برای «من» -im/-ım/-um/-üm است: rezervasyon → rezervasyonum (رزروِ من). برای «شما» -iniz: rezervasyonunuz.',
  ),

  trLesson(
    'tr-l2-health',
    'سلامتی و کمک فوری',
    'حال‌تان خوب نیست، درد دارید، دارو می‌خواهید یا در موقعیت اورژانسی هستید.',
    [
      trSentence('tr2-57', 'Kendimi iyi hissetmiyorum.', 'حالم خوب نیست.', 'کِندیمی ایّی حیص‌اِتمییوروم', 'hissetmek', 'احساس کردن', 'kendimi iyi hissetmiyorum = حالم خوب نیست'),
      trSentence('tr2-58', 'Başım ağrıyor.', 'سرم درد می‌کند.', 'باشیم آغرییور', 'ağrımak', 'درد کردن', 'baş + -ım = سرم'),
      trSentence('tr2-59', 'Ateşim var.', 'تب دارم.', 'آتِشیم وار', 'ateş', 'تب', 'ateş + -im + var = تب دارم'),
      trSentence('tr2-60', 'Bir ağrı kesici alabilir miyim?', 'می‌توانم یک مسکن بگیرم؟', 'بیر آغری کِسیجی آلابیلیر می‌ییم', 'ağrı kesici', 'مسکن', 'ağrı kesici = دردگیر / مسکن'),
      trSentence('tr2-61', 'Doktora gitmeliyim.', 'باید به پزشک بروم.', 'دوکتورا گیتمِلیییم', 'gitmek', 'رفتن', 'git- + -meli + -yim = باید بروم'),
      trSentence('tr2-62', 'Ambulans çağırın!', 'آمبولانس خبر کنید!', 'آمبولانس چاآرین', 'ambulans', 'آمبولانس', 'çağırın = صدا کنید'),
      trSentence('tr2-63', 'Bana yardım edin!', 'به من کمک کنید!', 'بانا یاردیم اِدین', 'yardım etmek', 'کمک کردن', 'bana = به من'),
      trSentence('tr2-64', 'Ne oldu?', 'چه شد؟', 'نِه اولدو', 'olmak', 'شدن', 'ne oldu = چه شد'),
    ],
    [
      { speaker: 'مریم', text: 'Kendimi iyi hissetmiyorum. Başım ağrıyor.', fa: 'حالم خوب نیست. سرم درد می‌کند.' },
      { speaker: 'داروساز', text: 'Ateşiniz var mı?', fa: 'تب دارید؟' },
      { speaker: 'مریم', text: 'Evet, biraz. Bir ağrı kesici alabilir miyim?', fa: 'بله، کمی. می‌توانم مسکن بگیرم؟' },
      { speaker: 'داروساز', text: 'Tabii. Günde iki kere için.', fa: 'البته. روزی دو بار بخورید.' },
      { speaker: 'مریم', text: 'Teşekkür ederim, doktora gitmeliyim.', fa: 'ممنون، باید به دکتر بروم.' },
    ],
    [
      {
        promptFa: 'برای گفتن «حالم خوب نیست» کدام جمله مناسب است؟',
        choices: ['Kendimi iyi hissetmiyorum.', 'Çok lezzetli.', 'Yarın görüşürüz.'],
        correctIndex: 0,
        explanationFa: 'kendimi iyi hissetmiyorum یعنی «خوب احساس نمی‌کنم / حالم خوب نیست».',
      },
      {
        promptFa: 'در موقعیت خطر برای درخواست کمک چه می‌گویید؟',
        choices: ['Bana yardım edin!', 'Hesap lütfen.', 'Ne kadar?'],
        correctIndex: 0,
        explanationFa: 'Bana yardım edin یعنی «به من کمک کنید!».',
      },
    ],
    '«Ağrıyor» (درد می‌کند) با عضو + پسوند مالکیت می‌آید: başım ağrıyor (سرم درد می‌کند)، karnım ağrıyor (دلم درد می‌کند). برای اجبار و باید، پسوند -meli/-malı را به ریشهٔ فعل بچسبانید: gitmeliyim (باید بروم).',
  ),
];
