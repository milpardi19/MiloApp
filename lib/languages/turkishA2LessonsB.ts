import type { LearningLesson } from './types';
import { trLesson, trSentence } from './turkishLessonKit';

/**
 * سطح ۲ — ترکی A2. درس‌های ۱۳ تا ۲۴ از برنامهٔ ۲۴موضوعی.
 *
 *  ۱۳ خرید، قیمت، تخفیف و چانه‌زنی        ۱۴ سفارش غذا و ارتباط در رستوران
 *  ۱۵ رزرو هتل و مکالمات سفر              ۱۶ مشکلات جسمی و مراجعه به پزشک
 *  ۱۷ تحصیل، شغل و محیط کار               ۱۸ بیان دلیل و نتیجه
 *  ۱۹ شرط‌های ساده                        ۲۰ موافقت، مخالفت و نظر شخصی
 *  ۲۱ بیان تجربه با ساختارهای ساده         ۲۲ اتصال جمله‌ها با حروف ربط متنوع‌تر
 *  ۲۳ پرسش‌های چندبخشی                    ۲۴ تعریف یک اتفاق در چند جملهٔ مرتبط
 */
export const TURKISH_A2_LESSONS_B: readonly LearningLesson[] = [
  trLesson(
    'tr-l2-13-bargaining',
    'خرید، قیمت، تخفیف و چانه‌زنی',
    'در فروشگاه قیمت می‌پرسید، تخفیف می‌خواهید و دربارهٔ فاکتور و گارانتی حرف می‌زنید.',
    [
      trSentence('tr3-97', 'Bunun indirimli fiyatı ne kadar?', 'قیمت با تخفیفش چقدر است؟', 'بونون ایندی‌ریملی فییاتی نِه کادار', 'indirimli', 'با تخفیف', 'indirim = تخفیف'),
      trSentence('tr3-98', 'Yüzde yirmi indirim var mı?', 'بیست درصد تخفیف دارد؟', 'یوزده ییرمی ایندی‌ریم وار می', 'yüzde', 'درصد', 'yüzde + عدد = ... درصد'),
      trSentence('tr3-99', 'Biraz daha uygun olur mu?', 'کمی مناسب‌تر نمی‌شود؟', 'بیراز داها اویگون اولور مو', 'uygun', 'مناسب', 'olur mu = می‌شود؟'),
      trSentence('tr3-100', 'Peşin ödersem indirim yapar mısınız?', 'اگر نقدی پرداخت کنم تخفیف می‌دهید؟', 'پِشین اودِرسِم ایندی‌ریم یاپار میسینیز', 'peşin', 'نقدی', '-sem = اگر ... کنم'),
      trSentence('tr3-101', 'Bu ürünün başka rengi var mı?', 'رنگ دیگری از این محصول دارید؟', 'بو اورونون باشکا رِنگی وار می', 'ürün', 'محصول', 'başka = دیگر'),
      trSentence('tr3-102', 'Fişi ve garanti belgesini alabilir miyim?', 'می‌توانم فاکتور و برگهٔ گارانتی را بگیرم؟', 'فیشی وِه گارانتی بِلگِسینی آلابیلیر می‌ییم', 'garanti', 'گارانتی', 'belge = برگه'),
      trSentence('tr3-103', 'Maalesef bu son fiyatımız.', 'متأسفانه این آخرین قیمت ماست.', 'ماآلِسِف بو سون فییاتیمیز', 'maalesef', 'متأسفانه', 'son = آخرین'),
      trSentence('tr3-104', 'Tamam, o zaman bunu alıyorum.', 'باشه، پس این را می‌خرم.', 'تامام، او زمان بونو آلییوروم', 'almak', 'خریدن', 'bunu = این را'),
    ],
    [
      { speaker: 'مریم', text: 'Bunun indirimli fiyatı ne kadar?', fa: 'قیمت با تخفیفش چقدر است؟' },
      { speaker: 'فروشنده', text: 'İki yüz elli lira, yüzde yirmi indirimli.', fa: 'دویست و پنجاه لیر، با بیست درصد تخفیف.' },
      { speaker: 'مریم', text: 'Biraz daha uygun olur mu? Peşin ödersem?', fa: 'کمی مناسب‌تر نمی‌شود؟ اگر نقدی بدهم؟' },
      { speaker: 'فروشنده', text: 'Maalesef bu son fiyatımız.', fa: 'متأسفانه این آخرین قیمت ماست.' },
      { speaker: 'مریم', text: 'Peki, fişi ve garanti belgesini alabilir miyim?', fa: 'خب، می‌توانم فاکتور و برگهٔ گارانتی را بگیرم؟' },
    ],
    [
      {
        promptFa: 'برای پرسیدن «تخفیف دارد؟» کدام جمله مناسب است؟',
        choices: ['İndirim var mı?', 'İndirim yapıyorum.', 'İndirimli aldım.'],
        correctIndex: 0,
        explanationFa: 'indirim var mı = تخفیف دارد؟',
      },
      {
        promptFa: '«اگر نقدی پرداخت کنم» کدام است؟',
        choices: ['Peşin ödersem', 'Peşin ödedim', 'Peşin ödeyeceğim'],
        correctIndex: 0,
        explanationFa: 'پسوند شرط -sem/-sam: öde-r-sem = اگر پرداخت کنم.',
      },
    ],
    'قیمت و تخفیف: fiyat، indirim، yüzde yirmi indirimli، son fiyat. چانه‌زنی مؤدبانه با «biraz daha uygun olur mu?» یا «peşin ödersem indirim yapar mısınız?». خرید تمام‌شده با «bunu alıyorum» و درخواست fiş و garanti belgesi.',
  ),

  trLesson(
    'tr-l2-14-restaurant',
    'سفارش غذا و ارتباط در رستوران',
    'میز می‌گیرید، منو می‌خواهید، سفارش می‌دهید و صورتحساب را جدا می‌کنید.',
    [
      trSentence('tr3-105', 'Pencerenin yanında yer var mı?', 'کنار پنجره جا هست؟', 'پِنجِرِنین یانیندا یِر وار می', 'yer', 'جا', 'pencere = پنجره'),
      trSentence('tr3-106', 'Menüyü bir daha alabilir miyim?', 'می‌توانم منو را دوباره بگیرم؟', 'مِنویو بیر داها آلابیلیر می‌ییم', 'menü', 'منو', 'bir daha = دوباره'),
      trSentence('tr3-107', 'Vejetaryen bir yemek önerir misiniz?', 'یک غذای گیاهی پیشنهاد می‌کنید؟', 'وِجِتاریِن بیر یِمِک اونِریر میسینیز', 'vejetaryen', 'گیاهی', 'önermek = پیشنهاد کردن'),
      trSentence('tr3-108', 'Ben ızgara tavuk ve salata alayım.', 'من مرغ کبابی و سالاد می‌گیرم.', 'بِن ایزگارا تاووق وِه سالاتا آلاییم', 'ızgara', 'کبابی', '-ayım = ... بگیرم'),
      trSentence('tr3-109', 'Az tuzlu olabilir mi?', 'می‌تواند کم‌نمک باشد؟', 'آز توزلو اولابیلیر می', 'tuzlu', 'شور', 'az = کم'),
      trSentence('tr3-110', 'Hesabı ayrı ayrı alabilir miyiz?', 'می‌توانیم صورت‌حساب را جدا جدا بگیریم؟', 'حِسابی آیری آیری آلابیلیر می‌ییز', 'ayrı', 'جدا', 'hesap = صورت‌حساب'),
      trSentence('tr3-111', 'Yemek gerçekten çok lezzetliydi.', 'غذا واقعاً خیلی خوشمزه بود.', 'یِمِک گِرچِکتِن چوک لِزّتلی‌دی', 'lezzetli', 'خوشمزه', 'gerçekten = واقعاً'),
      trSentence('tr3-112', 'Üstü kalsın, teşekkürler.', 'بقیه‌اش بماند (باقی پول برای شما)، ممنون.', 'اوستو کالسین، تشکّورلَر', 'üstü kalsın', 'بقیه‌اش مال شما', 'üst = باقی پول'),
    ],
    [
      { speaker: 'مریم', text: 'Pencerenin yanında yer var mı?', fa: 'کنار پنجره جا هست؟' },
      { speaker: 'گارسون', text: 'Evet, buyurun. Menüyü alabilir misiniz?', fa: 'بله، بفرمایید. منو را می‌گیرید؟' },
      { speaker: 'مریم', text: 'Vejetaryen bir yemek önerir misiniz?', fa: 'یک غذای گیاهی پیشنهاد می‌کنید؟' },
      { speaker: 'گارسون', text: 'Sebze çorbası ve ızgara sebze çok iyi.', fa: 'سوپ سبزیجات و سبزیجات کبابی خیلی خوب است.' },
      { speaker: 'مریم', text: 'Az tuzlu olabilir mi? Ve hesabı ayrı ayrı alabilir miyiz?', fa: 'می‌تواند کم‌نمک باشد؟ و می‌توانیم صورت‌حساب را جدا بگیریم؟' },
    ],
    [
      {
        promptFa: '«می‌توانیم صورت‌حساب را جدا بگیریم؟» کدام است؟',
        choices: ['Hesabı ayrı ayrı alabilir miyiz?', 'Hesap nerede?', 'Hesabı ödedim.'],
        correctIndex: 0,
        explanationFa: 'ayrı ayrı = جدا جدا.',
      },
      {
        promptFa: '«کم‌نمک» در ترکی چه می‌شود؟',
        choices: ['az tuzlu', 'çok tuzlu', 'tuzsuz değil'],
        correctIndex: 0,
        explanationFa: 'az = کم؛ az tuzlu = کم‌نمک؛ tuzsuz = بی‌نمک.',
      },
    ],
    'سفارش مؤدبانه: «... alayım» (من ... می‌گیرم) یا «... alabilir miyim?». برای تغییر غذا: «az tuzlu olabilir mi?»، «sosu ayrı olsun». پایان غذا: hesap، ayrı ayrı، üstü kalsın. تعریف غذا: «gerçekten çok lezzetliydi».',
  ),

  trLesson(
    'tr-l2-15-travel',
    'رزرو هتل و مکالمات سفر',
    'اتاق رزرو می‌کنید، از پرواز و چمدان می‌پرسید و مشکل سفر را حل می‌کنید.',
    [
      trSentence('tr3-113', 'İki kişilik bir oda rezervasyonu yapmak istiyorum.', 'می‌خواهم یک اتاق دو‌نفره رزرو کنم.', 'ایکی کیشیلیک بیر اودا رِزِرواسیونو یاپماک ایستییوروم', 'rezervasyon', 'رزرو', 'rezervasyon yapmak = رزرو کردن'),
      trSentence('tr3-114', 'Giriş ve çıkış tarihleri net mi?', 'تاریخ ورود و خروج مشخص است؟', 'گیریچ وِه چیکیش تاریخلِری نِت می', 'giriş', 'ورود', 'net = مشخص'),
      trSentence('tr3-115', 'Kahvaltı dahil mi, değil mi?', 'صبحانه شامل است یا نه؟', 'کاه‌والتی داخیل می، دِییل می', 'dahil', 'شامل', '... mi, değil mi؟'),
      trSentence('tr3-116', 'Uçuşumuz iki saat rötar yaptı.', 'پروازمان دو ساعت تأخیر داشت.', 'اوچوشوموز ایکی ساعت روُتار یاپتی', 'uçuş', 'پرواز', 'rötar yapmak = تأخیر داشتن'),
      trSentence('tr3-117', 'Havalimanından otele nasıl gidebilirim?', 'از فرودگاه چطور به هتل بروم؟', 'هاوالیمانیندان اوتِلِه ناصیل گیدِبیلیریم', 'havalimanı', 'فرودگاه', '-dan ... -e = از ... به ...'),
      trSentence('tr3-118', 'Valizim gelmedi, kayıp bagaj bürosu nerede?', 'چمدانم نیامد، دفتر بار گم‌شده کجاست؟', 'والیزیم گِلمِدی، کاییپ باگاج بوروسو نِرِدِه', 'valiz', 'چمدان', 'kayıp = گم‌شده'),
      trSentence('tr3-119', 'Erken çıkış yapabilir miyim?', 'می‌توانم زودتر تخلیه کنم؟', 'اِرکِن چیکیش یاپابیلیر می‌ییم', 'erken çıkış', 'تخلیهٔ زودتر', '-abilir miyim'),
      trSentence('tr3-120', 'Yolculuk çok rahat geçti, teşekkürler.', 'سفر خیلی راحت گذشت، ممنون.', 'یولجولوق چوک راحات گِچتی، تشکّورلَر', 'yolculuk', 'سفر', 'geçti = گذشت'),
    ],
    [
      { speaker: 'مریم', text: 'İki kişilik bir oda rezervasyonu yapmak istiyorum.', fa: 'می‌خواهم یک اتاق دو‌نفره رزرو کنم.' },
      { speaker: 'پذیرش', text: 'Tabii. Giriş ve çıkış tarihleri net mi?', fa: 'البته. تاریخ ورود و خروج مشخص است؟' },
      { speaker: 'مریم', text: 'On beş Mayıs giriş, on sekiz Mayıs çıkış. Kahvaltı dahil mi?', fa: 'ورود پانزدهم مه، خروج هجدهم مه. صبحانه شامل است؟' },
      { speaker: 'پذیرش', text: 'Evet, dahil. Havalimanından otele servis var.', fa: 'بله، شامل است. از فرودگاه به هتل سرویس هست.' },
      { speaker: 'مریم', text: 'Harika, teşekkürler. Erken çıkış yapabilir miyim?', fa: 'عالی، ممنون. می‌توانم زودتر تخلیه کنم؟' },
    ],
    [
      {
        promptFa: 'برای پرسیدن «صبحانه شامل است؟» کدام است؟',
        choices: ['Kahvaltı dahil mi?', 'Kahvaltı nerede?', 'Kahvaltı istiyorum.'],
        correctIndex: 0,
        explanationFa: 'dahil = شامل؛ dahil mi? = شامل است؟',
      },
      {
        promptFa: '«پرواز تأخیر داشت» کدام است؟',
        choices: ['Uçuş rötar yaptı.', 'Uçuş kalktı.', 'Uçuş iptal oldu.'],
        correctIndex: 0,
        explanationFa: 'rötar yapmak = تأخیر داشتن؛ iptal olmak = لغو شدن.',
      },
    ],
    'واژه‌های سفر: rezervasyon، giriş، çıkış، dahil، uçuş، rötar، valiz، kayıp bagaj، havalimanı. برای رزرو: «... rezervasyonu yapmak istiyorum». برای مسیر از فرودگاه: «Havalimanından ... -e nasıl gidebilirim?».',
  ),

  trLesson(
    'tr-l2-16-health',
    'بیان مشکلات جسمی و مراجعه به پزشک',
    'درد و علائم را می‌گویید، وقت دکتر می‌گیرید و دربارهٔ دارو می‌پرسید.',
    [
      trSentence('tr3-121', 'İki gündür boğazım ağrıyor.', 'دو روز است گلویم درد می‌کند.', 'ایکی گوندور بوغازیم آغرییور', 'boğaz', 'گلو', '-dür = مدت'),
      trSentence('tr3-122', 'Başım dönüyor ve midem bulanıyor.', 'سرم گیج می‌رود و حالم به هم می‌خورد.', 'باشیم دونویور وِه میدِم بولانییور', 'mide', 'معده', 'dönmek = چرخیدن'),
      trSentence('tr3-123', 'Ateşim otuz sekiz derece.', 'تبم سی و هشت درجه است.', 'آتِشیم اوتوز سِکیز دِرِجِه', 'ateş', 'تب', 'derece = درجه'),
      trSentence('tr3-124', 'Doktordan randevu almak istiyorum.', 'می‌خواهم از دکتر وقت بگیرم.', 'دوکتوردان راندِوو آلماک ایستییوروم', 'randevu', 'وقت / قرار', '-dan randevu almak'),
      trSentence('tr3-125', 'Reçeteyi eczaneye götürdüm.', 'نسخه را به داروخانه بردم.', 'رِچِتِیی اِجزانِیِه گوتوردوم', 'eczane', 'داروخانه', 'götürmek = بردن'),
      trSentence('tr3-126', 'Bu ilacı günde iki kez almalıyım.', 'باید این دارو را روزی دو بار بخورم.', 'بو ایلاجی گونده ایکی کِز آلمالیییم', 'ilaç', 'دارو', '-malıyım = باید'),
      trSentence('tr3-127', 'Alerjim var, başka bir ilaç var mı?', 'حساسیت دارم، داروی دیگری هست؟', 'آلِرژیم وار، باشکا بیر ایلاچ وار می', 'alerji', 'حساسیت', 'başka = دیگر'),
      trSentence('tr3-128', 'Kendimi daha iyi hissediyorum.', 'حالم بهتر است.', 'کِندیمی داها ایّی حیص‌اِدییوروم', 'hissetmek', 'احساس کردن', 'daha iyi'),
    ],
    [
      { speaker: 'مریم', text: 'İki gündür boğazım ağrıyor ve başım dönüyor.', fa: 'دو روز است گلویم درد می‌کند و سرم گیج می‌رود.' },
      { speaker: 'دکتر', text: 'Ateşiniz var mı?', fa: 'تب دارید؟' },
      { speaker: 'مریم', text: 'Evet, otuz sekiz derece.', fa: 'بله، سی و هشت درجه.' },
      { speaker: 'دکتر', text: 'Bu ilacı günde iki kez alın. Alerjiniz var mı?', fa: 'این دارو را روزی دو بار بخورید. حساسیت دارید؟' },
      { speaker: 'مریم', text: 'Evet, penisiline alerjim var.', fa: 'بله، به پنی‌سیلین حساسیت دارم.' },
      { speaker: 'دکتر', text: 'O zaman başka bir ilaç yazıyorum.', fa: 'پس داروی دیگری می‌نویسم.' },
    ],
    [
      {
        promptFa: '«دو روز است گلویم درد می‌کند» کدام است؟',
        choices: ['İki gündür boğazım ağrıyor.', 'İki gün boğazım ağrıdı.', 'İki gün sonra ağrıyacak.'],
        correctIndex: 0,
        explanationFa: '... gündür = ... روز است که ادامه دارد.',
      },
      {
        promptFa: '«حساسیت دارم» در ترکی چه می‌شود؟',
        choices: ['Alerjim var.', 'Ağrım var.', 'Ateşim var.'],
        correctIndex: 0,
        explanationFa: 'alerji = حساسیت؛ ağrı = درد؛ ateş = تب.',
      },
    ],
    'درد با عضو + پسوند ملکی + ağrıyor: boğazım، başım، karnım. مدت با «-dür/-dir»: iki gündür (دو روز است). دارو با «günde iki kez» و پسوند باید (-malıyım). حساسیت را همیشه بگویید: «... alerjim var».',
  ),

  trLesson(
    'tr-l2-17-work',
    'صحبت درباره تحصیل، شغل و محیط کار',
    'از رشتهٔ تحصیلی، کارآموزی، حقوق و همکاری در تیم می‌گویید.',
    [
      trSentence('tr3-129', 'Hangi bölümde okuyorsunuz?', 'در کدام رشته می‌خوانید؟', 'هانگی بولومده اوکویورسونوز', 'bölüm', 'رشته', 'okumak = خواندن'),
      trSentence('tr3-130', 'İşletme okuyorum, son sınıfım.', 'مدیریت می‌خوانم، سال آخر هستم.', 'ایشلِتمِه اوکویوروم، سون سینیفیم', 'işletme', 'مدیریت', 'son sınıf = سال آخر'),
      trSentence('tr3-131', 'Stajımı bir bankada yaptım.', 'کارآموزی‌ام را در یک بانک گذراندم.', 'استاجیمی بیر بانکادا یاپتیم', 'staj', 'کارآموزی', 'yapmak = انجام دادن'),
      trSentence('tr3-132', 'Maaş ve çalışma saatleri nasıl?', 'حقوق و ساعت کاری چطور است؟', 'ماآش وِه چالیشما ساآتلِری ناصیل', 'maaş', 'حقوق', 'çalışma saatleri = ساعت کاری'),
      trSentence('tr3-133', 'Evden çalışmayı tercih ediyorum.', 'کار از خانه را ترجیح می‌دهم.', 'اِودِن چالیشمایی تِرجیح اِدییوروم', 'tercih etmek', 'ترجیح دادن', 'evden = از خانه'),
      trSentence('tr3-134', 'Ekip arkadaşlarımla iyi anlaşıyorum.', 'با هم‌تیمی‌هایم خوب کنار می‌آیم.', 'اِکیپ آرکاداشلاریملا ایّی آنلاشییوروم', 'ekip', 'تیم', 'anlaşmak = کنار آمدن'),
      trSentence('tr3-135', 'Bu pozisyon için başvuru yaptım.', 'برای این موقعیت درخواست دادم.', 'بو پوزیسیون ایچین باشوورو یاپتیم', 'başvuru', 'درخواست', 'pozisyon = موقعیت شغلی'),
      trSentence('tr3-136', 'Kariyerimde ilerlemek istiyorum.', 'می‌خواهم در حرفه‌ام پیشرفت کنم.', 'کاریِریمده ایلِرلِمِک ایستییوروم', 'kariyer', 'حرفه', 'ilerlemek = پیشرفت کردن'),
    ],
    [
      { speaker: 'مصاحبه‌گر', text: 'Hangi bölümde okuyorsunuz?', fa: 'در کدام رشته می‌خوانید؟' },
      { speaker: 'مریم', text: 'İşletme okuyorum, son sınıfım. Stajımı bir bankada yaptım.', fa: 'مدیریت می‌خوانم، سال آخر هستم. کارآموزی‌ام را در یک بانک گذراندم.' },
      { speaker: 'مصاحبه‌گر', text: 'Neden bu pozisyona başvurdunuz?', fa: 'چرا برای این موقعیت درخواست دادید؟' },
      { speaker: 'مریم', text: 'Evden çalışmayı tercih ediyorum ve kariyerimde ilerlemek istiyorum.', fa: 'کار از خانه را ترجیح می‌دهم و می‌خواهم در حرفه‌ام پیشرفت کنم.' },
      { speaker: 'مصاحبه‌گر', text: 'Ekip çalışması sizin için önemli mi?', fa: 'کار تیمی برایتان مهم است؟' },
      { speaker: 'مریم', text: 'Evet, ekip arkadaşlarımla iyi anlaşıyorum.', fa: 'بله، با هم‌تیمی‌هایم خوب کنار می‌آیم.' },
    ],
    [
      {
        promptFa: '«سال آخر هستم» کدام است؟',
        choices: ['Son sınıfım.', 'İlk sınıfım.', 'Sınıftayım.'],
        correctIndex: 0,
        explanationFa: 'son sınıf = سال آخر؛ ilk sınıf = سال اول.',
      },
      {
        promptFa: '«درخواست دادم» در بافت کاری چه می‌شود؟',
        choices: ['Başvuru yaptım.', 'Başvuru yapıyorum.', 'Başvuru yapacağım.'],
        correctIndex: 0,
        explanationFa: 'başvuru yapmak = درخواست دادن (گذشته: yaptım).',
      },
    ],
    'واژه‌های کار و تحصیل: bölüm (رشته)، staj (کارآموزی)، maaş (حقوق)، ekip (تیم)، pozisyon، başvuru، kariyer. برای تجربه: «... yaptım» و برای ترجیح کاری: «-mayı tercih ediyorum». «anlaşmak» برای رابطهٔ کاری یعنی «کنار آمدن».',
  ),

  trLesson(
    'tr-l2-18-reason',
    'بیان دلیل و نتیجه',
    'دلیل کاری را توضیح می‌دهید و نتیجه‌اش را می‌گویید.',
    [
      trSentence('tr3-137', 'Trafik yüzünden toplantıya geç kaldım.', 'به‌خاطر ترافیک به جلسه دیر رسیدم.', 'ترافیک یوزوندِن توپلانتی‌یا گِچ کالدیم', 'yüzünden', 'به‌خاطر', 'geç kalmak = دیر رسیدن'),
      trSentence('tr3-138', 'Yağmur yağdığı için maçı iptal ettiler.', 'چون باران آمد مسابقه را لغو کردند.', 'یاغمور یاغدیغی ایچین ماچی ایپتال اِتتیلِر', 'iptal etmek', 'لغو کردن', '-diği için = چون'),
      trSentence('tr3-139', 'Çok yoruldum, bu yüzden erken yattım.', 'خیلی خسته شدم، برای همین زود خوابیدم.', 'چوک یورولدوم، بو یوزدِن اِرکِن یاتتیم', 'bu yüzden', 'به همین دلیل', 'yatmak = خوابیدن'),
      trSentence('tr3-140', 'Hem pahalı hem de gereksiz.', 'هم گران است هم غیرضروری.', 'هِم پاحالی هِم دِه گِرِکسِز', 'gereksiz', 'غیرضروری', 'hem ... hem de = هم ... هم'),
      trSentence('tr3-141', 'Bu nedenle başka bir yol seçtik.', 'به این دلیل راه دیگری انتخاب کردیم.', 'بو نِدِنله باشکا بیر یول سِچتیک', 'neden', 'دلیل', 'bu nedenle = به این دلیل'),
      trSentence('tr3-142', 'Sonuç olarak planı değiştirmedik.', 'در نتیجه برنامه را تغییر ندادیم.', 'سونوچ اولاراک پلانی دِییشتیرمِدیک', 'sonuç', 'نتیجه', 'sonuç olarak = در نتیجه'),
      trSentence('tr3-143', 'O kadar yorgundum ki hemen uyudum.', 'آن‌قدر خسته بودم که فوراً خوابم برد.', 'او کادار یورگوندوم کی هِمِن اویودوم', 'o kadar ... ki', 'آن‌قدر ... که', 'uyumak = خواب رفتن'),
      trSentence('tr3-144', 'Bu yüzden sana teşekkür etmek istiyorum.', 'به همین دلیل می‌خواهم از تو تشکر کنم.', 'بو یوزدِن سانا تشکّور اِتمِک ایستییوروم', 'teşekkür etmek', 'تشکر کردن', 'sana = به تو'),
    ],
    [
      { speaker: 'علی', text: 'Neden bu kadar geç kaldın?', fa: 'چرا این‌قدر دیر کردی؟' },
      { speaker: 'مریم', text: 'Trafik yüzünden. Otobüs yarım saat beklemedi.', fa: 'به‌خاطر ترافیک. اتوبوس نیم ساعت صبر نکرد.' },
      { speaker: 'علی', text: 'Toplantı iptal oldu mu?', fa: 'جلسه لغو شد؟' },
      { speaker: 'مریم', text: 'Evet, yağmur yağdığı için iptal ettiler.', fa: 'بله، چون باران آمد لغو کردند.' },
      { speaker: 'علی', text: 'O zaman bu yüzden erken çıktın.', fa: 'پس به همین دلیل زود بیرون زدی.' },
    ],
    [
      {
        promptFa: '«به‌خاطر ترافیک» کدام است؟',
        choices: ['Trafik yüzünden', 'Trafiğe', 'Trafikte'],
        correctIndex: 0,
        explanationFa: 'yüzünden = به‌خاطر؛ trafik yüzünden = به‌خاطر ترافیک.',
      },
      {
        promptFa: '«در نتیجه» کدام عبارت است؟',
        choices: ['Sonuç olarak', 'Örneğin', 'Kısacası'],
        correctIndex: 0,
        explanationFa: 'sonuç olarak = در نتیجه؛ örneğin = برای مثال.',
      },
    ],
    'دلیل را با «çünkü» (چون)، «-diği için» (چون که)، «yüzünden» (به‌خاطر) و «bu nedenle» بگویید و نتیجه را با «bu yüzden»، «sonuç olarak»، «o yüzden» جمع کنید. ساختار تأکیدی: «o kadar ... ki ...» (آن‌قدر ... که ...).',
  ),

  trLesson(
    'tr-l2-19-condition',
    'بیان شرط‌های ساده',
    'شرط واقعی و خیالی می‌سازید: اگر هوا خوب باشد، اگر پول داشتم.',
    [
      trSentence('tr3-145', 'Hava güzel olursa parka gideriz.', 'اگر هوا خوب باشد به پارک می‌رویم.', 'هَوا گوزل اولورسا پارکا گیدِریز', 'olursa', 'اگر باشد', '-orsa = اگر باشد'),
      trSentence('tr3-146', 'Vaktin varsa bize uğra.', 'اگر وقت داری سر به ما بزن.', 'واکتین وارسا بیزه اوغرا', 'uğramak', 'سر زدن', 'varsa = اگر هست'),
      trSentence('tr3-147', 'Erken çıkarsak trafiğe kalmayız.', 'اگر زود راه بیفتیم به ترافیک نمی‌خوریم.', 'اِرکِن چیکارساک ترافیکه کالماییز', '-sak', 'اگر ... کنیم', 'çıkmak = بیرون رفتن'),
      trSentence('tr3-148', 'Param olsaydı yeni bir telefon alırdım.', 'اگر پول داشتم یک تلفن جدید می‌خریدم.', 'پارام اولسایدی یِنی بیر تِلِفون آلیردیم', 'olsaydı', 'اگر داشت', 'alırdım = می‌خریدم'),
      trSentence('tr3-149', 'Yağmur yağarsa maç iptal olur.', 'اگر باران ببارد مسابقه لغو می‌شود.', 'یاغمور یاغارسا ماچ ایپتال اولور', 'iptal olmak', 'لغو شدن', 'yağarsa = اگر ببارد'),
      trSentence('tr3-150', 'İstersen sana yardım ederim.', 'اگر بخواهی به تو کمک می‌کنم.', 'ایستِرسِن سانا یاردیم اِدِریم', 'istemek', 'خواستن', 'istersen = اگر بخواهی'),
      trSentence('tr3-151', 'Ödevini yapmazsan öğretmen kızar.', 'اگر تکلیفت را نکنی معلم عصبانی می‌شود.', 'اودِوینی یاپمازسان اویْرِتمِن کیزار', 'ödev', 'تکلیف', 'kızmak = عصبانی شدن'),
      trSentence('tr3-152', 'Ne olursa olsun yanındayım.', 'هر چه پیش بیاید کنارت هستم.', 'نِه اولورسا اولسون یانینداییِم', 'ne olursa olsun', 'هر چه پیش بیاید', 'yanında = کنارت'),
    ],
    [
      { speaker: 'علی', text: 'Yarın ne yapıyoruz?', fa: 'فردا چه می‌کنیم؟' },
      { speaker: 'مریم', text: 'Hava güzel olursa parka gideriz.', fa: 'اگر هوا خوب باشد به پارک می‌رویم.' },
      { speaker: 'علی', text: 'Yağmur yağarsa?', fa: 'اگر باران ببارد؟' },
      { speaker: 'مریم', text: 'O zaman evde kalırız. Vaktin varsa bize uğra.', fa: 'آن وقت خانه می‌مانیم. اگر وقت داری سر به ما بزن.' },
      { speaker: 'علی', text: 'Tamam. Ne olursa olsun haber veririm.', fa: 'باشه. هر چه پیش بیاید خبر می‌دهم.' },
    ],
    [
      {
        promptFa: 'شرط واقعی («اگر ... باشد») با کدام پسوند ساخته می‌شود؟',
        choices: ['-sa/-se', '-mış', '-acak'],
        correctIndex: 0,
        explanationFa: 'güzel olursa = اگر خوب باشد؛ -sa/-se پسوند شرط است.',
      },
      {
        promptFa: '«اگر پول داشتم می‌خریدم» کدام است؟',
        choices: ['Param olsaydı alırdım.', 'Param varsa alırım.', 'Param olursa alacağım.'],
        correctIndex: 0,
        explanationFa: 'olsaydı + alırdım = شرط خیالی در گذشته/حال.',
      },
    ],
    'دو نوع شرط: واقعی با -sa/-se + زمان ساده (olursa gideriz) و خیالی با -saydı/-seydi + -rdı (olsaydı alırdım). «ne olursa olsun» یعنی «هر چه پیش بیاید» و جمله را قطعی می‌کند.',
  ),

  trLesson(
    'tr-l2-20-opinion',
    'بیان موافقت، مخالفت و نظر شخصی',
    'نظر خود را می‌گویید، موافقت یا مخالفت می‌کنید و دلیل می‌آورید.',
    [
      trSentence('tr3-153', 'Bence bu fikir kesinlikle doğru.', 'به نظر من این ایده قطعاً درست است.', 'بِنجِه بو فیکیر کِسینلیکله دوغرو', 'kesinlikle', 'قطعاً', 'bence = به نظر من'),
      trSentence('tr3-154', 'Sana tamamen katılıyorum.', 'کاملاً با تو موافقم.', 'سانا تامامِن کاتیلییوروم', 'tamamen', 'کاملاً', 'katılmak = موافقت کردن'),
      trSentence('tr3-155', 'Açıkçası ben aynı fikirde değilim.', 'رک بگویم من هم‌عقیده نیستم.', 'آچیکچاسی بِن اینی فیکیرده دِییلیم', 'aynı fikirde olmak', 'هم‌عقیده بودن', 'açıkçası = رک بگویم'),
      trSentence('tr3-156', 'Haklısın ama başka bir yönü de var.', 'حق با توست ولی جنبهٔ دیگری هم دارد.', 'هاکلیسین آما باشکا بیر یونو دِه وار', 'yön', 'جنبه', 'haklısın = حق با توست'),
      trSentence('tr3-157', 'Bana göre en iyi çözüm bu.', 'به نظر من بهترین راه‌حل این است.', 'بانا گورِه اِن ایّی چوزوم بو', 'çözüm', 'راه‌حل', 'bana göre = به نظر من'),
      trSentence('tr3-158', 'Bu konuda fikrimi değiştirdim.', 'در این باره نظرم را عوض کردم.', 'بو کونودا فیکریمی دِییشتیردیم', 'fikir', 'نظر', 'değiştirmek = عوض کردن'),
      trSentence('tr3-159', 'Kısmen katılıyorum, tam değil.', 'تا حدی موافقم، نه کاملاً.', 'کیسمن کاتیلییوروم، تام دِییل', 'kısmen', 'تا حدی', 'tam = کامل'),
      trSentence('tr3-160', 'Tartışalım, belki yanılıyorum.', 'بحث کنیم، شاید من اشتباه می‌کنم.', 'تارتیشالیم، بِلکی یانیلییوروم', 'tartışmak', 'بحث کردن', 'yanılmak = اشتباه کردن'),
    ],
    [
      { speaker: 'علی', text: 'Bu plan hakkında ne düşünüyorsun?', fa: 'دربارهٔ این برنامه چه فکر می‌کنی؟' },
      { speaker: 'مریم', text: 'Bence bu fikir kesinlikle doğru.', fa: 'به نظر من این ایده قطعاً درست است.' },
      { speaker: 'علی', text: 'Ama masrafı çok yüksek.', fa: 'ولی هزینه‌اش خیلی بالاست.' },
      { speaker: 'مریم', text: 'Haklısın ama başka bir yönü de var: uzun vadede kârlı.', fa: 'حق با توست ولی جنبهٔ دیگری هم دارد: در بلندمدت سودآور است.' },
      { speaker: 'علی', text: 'Kısmen katılıyorum, tam değil.', fa: 'تا حدی موافقم، نه کاملاً.' },
      { speaker: 'مریم', text: 'Tartışalım, belki ben yanılıyorum.', fa: 'بحث کنیم، شاید من اشتباه می‌کنم.' },
    ],
    [
      {
        promptFa: '«با تو موافقم» کدام است؟',
        choices: ['Sana katılıyorum.', 'Sana katılmıyorum.', 'Seni seviyorum.'],
        correctIndex: 0,
        explanationFa: 'katılmak = موافقت کردن؛ نفی آن katılmıyorum.',
      },
      {
        promptFa: 'مخالفت مؤدبانه کدام است؟',
        choices: ['Aynı fikirde değilim.', 'Yanlışsın!', 'Hiç anlamadım.'],
        correctIndex: 0,
        explanationFa: 'aynı fikirde değilim = هم‌عقیده نیستم (مؤدبانه).',
      },
    ],
    'برای نظر: bence، bana göre، açıkçası. برای موافقت: katılıyorum، haklısın، aynı fikirdeyim. برای مخالفت مؤدبانه: katılmıyorum، aynı fikirde değilim، kısmen katılıyorum. «... ama başka bir yönü de var» گفت‌وگو را نرم نگه می‌دارد.',
  ),

  trLesson(
    'tr-l2-21-experience',
    'بیان تجربه با ساختارهای ساده',
    'می‌گویید چه کاری را تا حالا انجام داده‌اید و چند بار.',
    [
      trSentence('tr3-161', 'Daha önce hiç ata binmedim.', 'قبلاً هرگز سوار اسب نشده‌ام.', 'داها اونجه هیچ آتا بینمِدیم', 'ata binmek', 'سوار اسب شدن', 'daha önce hiç ... -medim'),
      trSentence('tr3-162', 'Geçen yıl ilk kez uçağa bindim.', 'سال گذشته اولین بار سوار هواپیما شدم.', 'گِچِن ییل ایلک کِز اوچاآ بیندیم', 'uçak', 'هواپیما', 'ilk kez = اولین بار'),
      trSentence('tr3-163', 'Bu kitabı iki kez okudum.', 'این کتاب را دو بار خوانده‌ام.', 'بو کیتابی ایکی کِز اوکودوم', 'kez', 'بار', 'okudum = خوانده‌ام'),
      trSentence('tr3-164', 'Hiç böyle bir yemek yememiştim.', 'هیچ‌وقت چنین غذایی نخورده بودم.', 'هیچ بویله بیر یِمِک یِمِمیشتیم', 'böyle', 'چنین', '-memiştim = تا آن لحظه تجربه نکرده بودم'),
      trSentence('tr3-165', 'Onu en son üç yıl önce gördüm.', 'او را آخرین بار سه سال پیش دیدم.', 'اونو اِن سون اوچ ییل اونجه گوردوم', 'en son', 'آخرین بار', 'önce = پیش'),
      trSentence('tr3-166', 'Bu şehirde yaşamayı hiç denemedim.', 'زندگی در این شهر را هرگز امتحان نکرده‌ام.', 'بو شِهیرده یاشامایی هیچ دِنِمِدیم', 'denemek', 'امتحان کردن', 'denemedim = امتحان نکرده‌ام'),
      trSentence('tr3-167', 'Bir keresinde otobüsü kaçırmıştım.', 'یک بار اتوبوس را از دست داده بودم.', 'بیر کِرِسیندِه اوتوبوسو کاچیرمیشتیم', 'kaçırmak', 'از دست دادن', 'bir keresinde = یک بار'),
      trSentence('tr3-168', 'Bu deneyim bana çok şey kattı.', 'این تجربه چیزهای زیادی به من افزود.', 'بو دِنِییم بانا چوک شِی کاتتی', 'deneyim', 'تجربه', 'katmak = افزودن'),
    ],
    [
      { speaker: 'علی', text: 'Hiç ata bindin mi?', fa: 'تا حالا سوار اسب شده‌ای؟' },
      { speaker: 'مریم', text: 'Hayır, daha önce hiç ata binmedim.', fa: 'نه، قبلاً هرگز سوار اسب نشده‌ام.' },
      { speaker: 'علی', text: 'Uçağa bindin mi?', fa: 'سوار هواپیما شده‌ای؟' },
      { speaker: 'مریم', text: 'Evet, geçen yıl ilk kez bindim. Çok heyecanlıydı.', fa: 'بله، سال گذشته اولین بار سوار شدم. خیلی هیجان‌انگیز بود.' },
      { speaker: 'علی', text: 'Bir keresinde ben de otobüsü kaçırmıştım.', fa: 'یک بار من هم اتوبوس را از دست داده بودم.' },
    ],
    [
      {
        promptFa: '«هرگز امتحان نکرده‌ام» کدام است؟',
        choices: ['Hiç denemedim.', 'Hiç denemiyorum.', 'Hiç denemeyeceğim.'],
        correctIndex: 0,
        explanationFa: 'hiç + -dı منفی = تا حالا هرگز ... نکرده‌ام.',
      },
      {
        promptFa: '«دو بار» در ترکی چه می‌شود؟',
        choices: ['iki kez', 'iki kere değil', 'iki kere kez'],
        correctIndex: 0,
        explanationFa: 'kez = بار؛ «iki kez» و «iki kere» هر دو درست‌اند.',
      },
    ],
    'تجربهٔ زندگی با زمان گذشتهٔ ساده (-dı) و واژه‌های daha önce، hiç، ilk kez، iki kez، en son، bir keresinde بیان می‌شود. برای تجربه‌ای که پیش از لحظهٔ گذشته رخ داده بود، -mıştı به کار می‌رود: kaçırmıştım.',
  ),

  trLesson(
    'tr-l2-22-connectors',
    'اتصال جمله‌ها با حروف ربط متنوع‌تر',
    'دو یا چند جمله را با «هم ... هم»، «ولی»، «چون»، «برای مثال» و «خلاصه» به هم می‌بندید.',
    [
      trSentence('tr3-169', 'Hem çalışıyorum hem de okuyorum.', 'هم کار می‌کنم هم درس می‌خوانم.', 'هِم چالیشییوروم هِم دِه اوکویوروم', 'hem ... hem de', 'هم ... هم', 'hem A hem de B'),
      trSentence('tr3-170', 'Yorgunum ama yine de devam ediyorum.', 'خسته‌ام ولی با این حال ادامه می‌دهم.', 'یورگونوم آما یینی دِه دِوام اِدییوروم', 'yine de', 'با این حال', 'devam etmek = ادامه دادن'),
      trSentence('tr3-171', 'Hava soğuk olduğu için mont giydim.', 'چون هوا سرد بود کاپشن پوشیدم.', 'هَوا سوغوک اولدوغو ایچین مونت گیدیم', 'giymek', 'پوشیدن', 'olduğu için = چون بود'),
      trSentence('tr3-172', 'İster gel ister git, karar senin.', 'خواه بیا خواه برو، تصمیم با توست.', 'ایستِر گِل ایستِر گیت، کارار سِنین', 'ister ... ister', 'چه ... چه', 'karar = تصمیم'),
      trSentence('tr3-173', 'Sadece dinlenmek değil, aynı zamanda uyumak istiyorum.', 'نه فقط استراحت، بلکه خواب هم می‌خواهم.', 'سادِجِه دینلِنمِک دِییل، آینی زاماندا اویوماک ایستییوروم', 'aynı zamanda', 'همچنین', 'sadece ... değil, aynı zamanda'),
      trSentence('tr3-174', 'Her ne kadar zor olsa da deneyeceğim.', 'هر چقدر هم سخت باشد تلاش می‌کنم.', 'هَر نِه کادار زور اولسا دا دِنِیِجِییم', 'her ne kadar', 'هر چقدر هم که', '-sa da = حتی اگر'),
      trSentence('tr3-175', 'Örneğin, geçen hafta hiç çalışmadım.', 'برای مثال، هفتهٔ گذشته اصلاً کار نکردم.', 'اورنِیین، گِچِن هافتا هیچ چالیشمادیم', 'örneğin', 'برای مثال', 'geçen hafta = هفتهٔ گذشته'),
      trSentence('tr3-176', 'Kısacası, planı birlikte yapalım.', 'خلاصه، برنامه را با هم بچینیم.', 'کیساجاسی، پلانی بیرلیکتِه یاپالیم', 'kısacası', 'خلاصه', 'birlikte = با هم'),
    ],
    [
      { speaker: 'علی', text: 'Bu yıl çok yoğunsun.', fa: 'امسال خیلی سرت شلوغ است.' },
      { speaker: 'مریم', text: 'Hem çalışıyorum hem de okuyorum. Yorgunum ama yine de devam ediyorum.', fa: 'هم کار می‌کنم هم درس می‌خوانم. خسته‌ام ولی با این حال ادامه می‌دهم.' },
      { speaker: 'علی', text: 'Neden bu kadar yükleniyorsun?', fa: 'چرا این‌قدر به خودت فشار می‌آوری؟' },
      { speaker: 'مریم', text: 'Hava soğuk olduğu için evdeyim ama sadece dinlenmek değil, öğrenmek de istiyorum.', fa: 'چون هوا سرد است خانه‌ام ولی نه فقط استراحت، یاد گرفتن هم می‌خواهم.' },
      { speaker: 'علی', text: 'Kısacası, planı birlikte yapalım.', fa: 'خلاصه، برنامه را با هم بچینیم.' },
    ],
    [
      {
        promptFa: '«هم ... هم ...» کدام ساختار است؟',
        choices: ['hem ... hem de', 'ne ... ne', 'ister ... ister'],
        correctIndex: 0,
        explanationFa: 'hem çalışıyorum hem de okuyorum = هم کار می‌کنم هم درس می‌خوانم.',
      },
      {
        promptFa: '«برای مثال» کدام واژه است؟',
        choices: ['örneğin', 'kısacası', 'yine de'],
        correctIndex: 0,
        explanationFa: 'örneğin = برای مثال؛ kısacası = خلاصه.',
      },
    ],
    'حروف ربط A2: hem ... hem de (هم ... هم)، ama / fakat (ولی)، yine de (با این حال)، olduğu için (چون)، ister ... ister (چه ... چه)، sadece ... değil aynı zamanda (نه فقط ... بلکه)، her ne kadar ... olsa da (هر چقدر هم که)، örneğin، kısacası.',
  ),

  trLesson(
    'tr-l2-23-multi-questions',
    'پرسیدن و پاسخ‌دادن به پرسش‌های چندبخشی',
    'در یک گفت‌وگو چند چیز را با هم می‌پرسید: چه، کجا، چند، چرا و چطور.',
    [
      trSentence('tr3-177', 'Ne zaman, nerede ve saat kaçta buluşacağız?', 'کی، کجا و ساعت چند همدیگر را می‌بینیم؟', 'نِه زامان، نِرِدِه وِه ساعت کاچتا بولوشاجاآیز', 'buluşmak', 'دیدار کردن', 'سه پرسش در یک جمله'),
      trSentence('tr3-178', 'Kim geliyor, kaç kişi olacağız?', 'کی می‌آید، چند نفر می‌شویم؟', 'کیم گِلییور، کاچ کیشی اولاجاآیز', 'kişi', 'نفر', 'kaç = چند'),
      trSentence('tr3-179', 'Neden gelmedin, bir sorun mu oldu?', 'چرا نیامدی، مشکلی پیش آمد؟', 'نِدِن گِلمِدین، بیر سورون مو اولدو', 'sorun', 'مشکل', '... mu oldu = آیا ... شد'),
      trSentence('tr3-180', 'Hangi otobüs, saat kaçta kalkıyor?', 'کدام اتوبوس، ساعت چند حرکت می‌کند؟', 'هانگی اوتوبوس، ساعت کاچتا کالکییور', 'hangi', 'کدام', 'kalkmak = حرکت کردن'),
      trSentence('tr3-181', 'Nasıl gidilir, ne kadar sürer?', 'چطور می‌روند، چقدر طول می‌کشد؟', 'ناصیل گیدیلیر، نِه کادار سورِر', 'sürmek', 'طول کشیدن', 'gidilir = می‌روند (مجهول)'),
      trSentence('tr3-182', 'Kiminle geliyorsun, ne zaman dönüyorsun?', 'با کی می‌آیی، کی برمی‌گردی؟', 'کیمینله گِلییورسون، نِه زامان دونویورسون', 'kiminle', 'با کی', 'dönmek = برگشتن'),
      trSentence('tr3-183', 'Fiyatı ne kadar, taksit yapıyor musunuz?', 'قیمتش چقدر است، اقساط می‌کنید؟', 'فییاتی نِه کادار، تاکسید یاپییور موسونوز', 'taksit', 'قسط', 'yapmak = انجام دادن'),
      trSentence('tr3-184', 'Önce hangi soruyu soralım?', 'اول کدام پرسش را بپرسیم؟', 'اونجه هانگی سورویو سورالیم', 'sormak', 'پرسیدن', 'soralım = بپرسیم'),
    ],
    [
      { speaker: 'علی', text: 'Ne zaman, nerede ve saat kaçta buluşacağız?', fa: 'کی، کجا و ساعت چند همدیگر را می‌بینیم؟' },
      { speaker: 'مریم', text: 'Yarın kafede, saat altıda.', fa: 'فردا در کافه، ساعت شش.' },
      { speaker: 'علی', text: 'Kim geliyor, kaç kişi olacağız?', fa: 'کی می‌آید، چند نفر می‌شویم؟' },
      { speaker: 'مریم', text: 'Sen, ben ve Ayşe. Üç kişi olacağız.', fa: 'تو، من و عایشه. سه نفر می‌شویم.' },
      { speaker: 'علی', text: 'Nasıl gidilir, ne kadar sürer?', fa: 'چطور برویم، چقدر طول می‌کشد؟' },
      { speaker: 'مریم', text: 'Metroyla on beş dakika sürer.', fa: 'با مترو پانزده دقیقه طول می‌کشد.' },
    ],
    [
      {
        promptFa: 'پرسش «چند نفر؟» در ترکی چه می‌شود؟',
        choices: ['Kaç kişi?', 'Kaç para?', 'Kaç saat?'],
        correctIndex: 0,
        explanationFa: 'kişi = نفر؛ kaç kişi = چند نفر.',
      },
      {
        promptFa: '«با کی می‌آیی؟» کدام است؟',
        choices: ['Kiminle geliyorsun?', 'Nerede geliyorsun?', 'Neden geliyorsun?'],
        correctIndex: 0,
        explanationFa: 'kiminle = با کی؛ nerede = کجا؛ neden = چرا.',
      },
    ],
    'در پرسش چندبخشی، هر بخش را با «ve» (و) یا با آهنگ مکث جدا کنید: Ne zaman, nerede? پاسخ را به همان ترتیب بدهید تا گفت‌وگو روشن بماند. واژه‌های پرسش: ne، kim، nerede، ne zaman، kaç، hangi، nasıl، neden، kiminle.',
  ),

  trLesson(
    'tr-l2-24-story',
    'تعریف‌کردن یک اتفاق یا تجربه در چند جمله مرتبط',
    'یک اتفاق واقعی را در چند جملهٔ پشت‌سرهم و منظم تعریف می‌کنید.',
    [
      trSentence('tr3-185', 'Geçen cumartesi unutamayacağım bir gün yaşadım.', 'شنبهٔ گذشته روزی را گذراندم که فراموش نمی‌کنم.', 'گِچِن جومارتِسی اونوتامایاجاآم بیر گون یاشادیم', 'unutmak', 'فراموش کردن', 'unut-amayacağım = که فراموش نمی‌کنم'),
      trSentence('tr3-186', 'Sabah erken kalktım ve hazırlandım.', 'صبح زود بیدار شدم و آماده شدم.', 'ساباح اِرکِن کالکتیم وِه هازیرلاندیم', 'hazırlanmak', 'آماده شدن', '-landım = آماده شدم'),
      trSentence('tr3-187', 'Otobüse bindim, ama yanlış hatta binmişim.', 'سوار اتوبوس شدم، ولی به خط اشتباه سوار شده بودم.', 'اوتوبوسه بیندیم، آما یانلیش هاتتا بینمیشیم', 'yanlış', 'اشتباه', 'binmişim = ظاهراً سوار شده بودم'),
      trSentence('tr3-188', 'İndiğimde telefonumun şarjı bitmişti.', 'وقتی پیاده شدم شارژ تلفنم تمام شده بود.', 'ایندییمده تِلِفونومون شارژی بیت‌میشتی', 'şarj', 'شارژ', 'indiğimde = وقتی پیاده شدم'),
      trSentence('tr3-189', 'Neyse ki yanımda harita vardı.', 'خوشبختانه همراهم نقشه بود.', 'نِیسِه کی یانیمدا هاریتا واردی', 'neyse ki', 'خوشبختانه', 'vardı = بود'),
      trSentence('tr3-190', 'Bir bakkal açtı, bana doğru yolu gösterdi.', 'یک بقالی باز کرد و راه درست را به من نشان داد.', 'بیر باکال آچتی، بانا دوغرو یولو گوستِردی', 'bakkal', 'بقالی', 'göstermek = نشان دادن'),
      trSentence('tr3-191', 'Sonunda derse tam zamanında yetiştim.', 'در پایان سر کلاس دقیقاً به‌موقع رسیدم.', 'سونوندا دِرسِه تام زمانیندا یِتیشتیم', 'yetmek', 'به‌موقع رسیدن', 'sonunda = در پایان'),
      trSentence('tr3-192', 'O gün bana her zaman yedek şarj taşımayı öğretti.', 'آن روز به من یاد داد همیشه شارژر یدکی همراهم داشته باشم.', 'او گون بانا هَر زامان یِدِک شارژ تاشیمایی اویْرِتتی', 'yedek', 'یدکی', 'öğretmek = یاد دادن'),
    ],
    [
      { speaker: 'علی', text: 'Geçen cumartesi ne oldu?', fa: 'شنبهٔ گذشته چه شد؟' },
      { speaker: 'مریم', text: 'Geçen cumartesi unutamayacağım bir gün yaşadım.', fa: 'شنبهٔ گذشته روزی را گذراندم که فراموش نمی‌کنم.' },
      { speaker: 'علی', text: 'Anlat bakalım.', fa: 'تعریف کن ببینم.' },
      { speaker: 'مریم', text: 'Sabah erken kalktım, otobüse bindim ama yanlış hatta binmişim.', fa: 'صبح زود بیدار شدم، سوار اتوبوس شدم ولی به خط اشتباه سوار شده بودم.' },
      { speaker: 'علی', text: 'Sonra?', fa: 'بعد؟' },
      { speaker: 'مریم', text: 'İndiğimde şarjım bitmişti. Neyse ki bir bakkal yolu gösterdi ve derse yetiştim.', fa: 'وقتی پیاده شدم شارژم تمام شده بود. خوشبختانه یک بقالی راه را نشان داد و به کلاس رسیدم.' },
    ],
    [
      {
        promptFa: 'برای شروع تعریف یک اتفاق، کدام جمله مناسب است؟',
        choices: ['Geçen cumartesi bir gün yaşadım.', 'Yarın gideceğim.', 'Her gün çalışırım.'],
        correctIndex: 0,
        explanationFa: 'زمان گذشته + «geçen ...» شروع طبیعی یک روایت است.',
      },
      {
        promptFa: '«خوشبختانه» در ترکی چه می‌شود؟',
        choices: ['Neyse ki', 'Maalesef', 'Belki'],
        correctIndex: 0,
        explanationFa: 'neyse ki = خوشبختانه؛ maalesef = متأسفانه.',
      },
    ],
    'ساختار روایت: شروع (geçen ... bir gün), ترتیب رویدادها (önce، sonra، derken), نقطهٔ اوج (ama، neyse ki) و پایان (sonunda، o gün bana ... öğretti). زمان گذشتهٔ ساده برای رویدادها، -mıştı برای پیشینه و -dığımda برای هم‌زمانی به کار می‌رود.',
  ),
];
