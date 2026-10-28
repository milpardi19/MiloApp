import type { LearningLesson } from './types';
import { trLesson, trSentence } from './turkishLessonKit';

/**
 * سطح ۲ — ترکی A2 (دورهٔ گسترش). درس‌های ۱ تا ۱۲ از برنامهٔ ۲۴موضوعی.
 *
 *   ۱ معرفی کامل‌تر خود و دیگران        ۲ توصیف ظاهر، شخصیت و ویژگی‌ها
 *   ۳ عادت‌ها و فعالیت‌های روزمره        ۴ زمان، تاریخ و ترتیب رویدادها
 *   ۵ گذشته و تجربه‌های شخصی             ۶ برنامه‌ها و پیش‌بینی‌های آینده
 *   ۷ مقایسهٔ اشخاص، اشیا و مکان‌ها       ۸ ترجیحات، علایق و احساسات
 *   ۹ نیاز، اجبار و ضرورت               ۱۰ درخواست مؤدبانه و پیشنهاد
 *  ۱۱ توانایی، امکان و احتمال           ۱۲ مسیر، آدرس و موقعیت مکانی
 * ادامهٔ برنامه (۱۳ تا ۲۴) در turkishA2LessonsB.ts است.
 */
export const TURKISH_A2_LESSONS_A: readonly LearningLesson[] = [
  trLesson(
    'tr-l2-01-about-me',
    'معرفی کامل‌تر خود و دیگران',
    'خودتان را کامل معرفی می‌کنید: زادگاه، تحصیلات، شغل، وضعیت زندگی و سرگرمی‌ها.',
    [
      trSentence('tr3-01', 'Adım Meryem, yirmi sekiz yaşındayım.', 'اسمم مریم است، بیست‌وهشت سال دارم.', 'آدِم مِریِم، ییرمی سِکیز یاشِنداییِم', 'yaş', 'سن', 'ad + -ım و yaşında + -yım = معرفی خود'),
      trSentence('tr3-02', 'Tahran’da doğdum ama İstanbul’da büyüdüm.', 'در تهران به دنیا آمدم ولی در استانبول بزرگ شدم.', 'تِهرادا دوغدوم آما ایستانبولدا بویودوم', 'doğmak', 'به دنیا آمدن', 'doğ-du-m / büyü-dü-m = گذشتهٔ اول‌شخص'),
      trSentence('tr3-03', 'Üniversitede bilgisayar mühendisliği okudum.', 'در دانشگاه مهندسی کامپیوتر خواندم.', 'اونیوِرسیتِده بیلگیسایار موهندیسلییی اوکودوم', 'mühendislik', 'مهندسی', 'رشته + okumak = ... خواندن'),
      trSentence('tr3-04', 'Şu anda bir yazılım şirketinde çalışıyorum.', 'الان در یک شرکت نرم‌افزار کار می‌کنم.', 'شو آندا بیر یازیلیم شیرکِتینده چالیشییوروم', 'yazılım', 'نرم‌افزار', 'şirket + -(s)inde = در شرکت'),
      trSentence('tr3-05', 'Evli değilim, ailemle yaşıyorum.', 'متأهل نیستم، با خانواده‌ام زندگی می‌کنم.', 'اِولی دِییلیم، آیِلِمله یاشاییوروم', 'evli', 'متأهل', 'değilim = نیستم'),
      trSentence('tr3-06', 'Boş zamanlarımda yüzmeye gidiyorum.', 'در وقت‌های آزادم به شنا می‌روم.', 'بوش زمانلاریمدا یوزمِیِه گیدییوروم', 'boş zaman', 'وقت آزاد', 'zaman + -larım + -da = در وقت‌های من'),
      trSentence('tr3-07', 'Kendimi meraklı ve sabırlı biri olarak tanımlarım.', 'خودم را فردی کنجکاو و صبور توصیف می‌کنم.', 'کِندیمی مِراکلی وِه صابیرلی بیری اولاراق تانیملاریم', 'sabırlı', 'صبور', 'kendimi ... olarak tanımlarım'),
      trSentence('tr3-08', 'Sizi tanıdığıma çok memnun oldum.', 'از آشنایی با شما خیلی خوشوقتم.', 'سیزی تانیدیییما چوک مِمون اولدوم', 'tanımak', 'شناختن', 'tanı-dığıma memnun oldum'),
    ],
    [
      { speaker: 'کارمند', text: 'Kendinizden biraz bahseder misiniz?', fa: 'کمی از خودتان می‌گویید؟' },
      { speaker: 'مریم', text: 'Adım Meryem, yirmi sekiz yaşındayım. Tahran’da doğdum, İstanbul’da büyüdüm.', fa: 'اسمم مریم است، بیست‌وهشت سال دارم. در تهران به دنیا آمدم، در استانبول بزرگ شدم.' },
      { speaker: 'کارمند', text: 'Ne iş yapıyorsunuz?', fa: 'چه کاری می‌کنید؟' },
      { speaker: 'مریم', text: 'Bilgisayar mühendisiyim, bir yazılım şirketinde çalışıyorum.', fa: 'مهندس کامپیوتر هستم، در یک شرکت نرم‌افزار کار می‌کنم.' },
      { speaker: 'کارمند', text: 'Sizi tanıdığıma memnun oldum.', fa: 'از آشنایی با شما خوشوقتم.' },
    ],
    [
      {
        promptFa: 'برای گفتن «در تهران به دنیا آمدم» کدام جمله درست است؟',
        choices: ['Tahran’da doğdum.', 'Tahran’da büyüdüm.', 'Tahran’a gittim.'],
        correctIndex: 0,
        explanationFa: 'doğmak یعنی «به دنیا آمدن»؛ büyümek یعنی «بزرگ شدن».',
      },
      {
        promptFa: '«متأهل نیستم» کدام است؟',
        choices: ['Evli değilim.', 'Evliyim.', 'Evim yok.'],
        correctIndex: 0,
        explanationFa: 'evli = متأهل؛ evli değilim = متأهل نیستم.',
      },
    ],
    'برای معرفی کامل، سه لایه را با هم بگویید: هویت (adım, yaşım), پیشینه (doğdum, büyüdüm, okudum) و وضعیت فعلی (çalışıyorum, yaşıyorum). در همهٔ این جمله‌ها پسوند اول‌شخص (-m، -yım، -yorum) نقش «من» را می‌دهد؛ نیاز نیست همیشه «ben» بگویید.',
  ),

  trLesson(
    'tr-l2-02-appearance',
    'توصیف ظاهر، شخصیت و ویژگی‌های افراد',
    'ظاهر و اخلاق کسی را توصیف می‌کنید و می‌گویید چه ویژگی‌هایی دارد.',
    [
      trSentence('tr3-09', 'Kardeşim benden daha uzun.', 'خواهر/برادرم از من بلندتر است.', 'کاردِشیم بِندِن داها اوزون', 'uzun', 'بلند', '-den daha + صفت = مقایسه'),
      trSentence('tr3-10', 'Kıvırcık saçları ve kahverengi gözleri var.', 'موهای فرفری و چشمان قهوه‌ای دارد.', 'کیویرجیک ساچلاری وِه کاهوِرِنگی گوزلِری وار', 'kıvırcık', 'فرفری', '... var = دارد'),
      trSentence('tr3-11', 'Babam sessiz ama çok dürüst bir insan.', 'پدرم کم‌حرف ولی خیلی صادق است.', 'بابام سِس‌سیز آما چوک دوروست بیر اینسان', 'dürüst', 'صادق', 'صفت + bir insan = فردی ...'),
      trSentence('tr3-12', 'Arkadaşım her zaman neşeli ve konuşkan.', 'دوستم همیشه شاد و خوش‌صحبت است.', 'آرکاداشِم هَر زامان نِشِلی وِه کونوشکان', 'neşeli', 'شاد', 'her zaman = همیشه'),
      trSentence('tr3-13', 'Sakallı ve gözlüklü bir bey bekliyor.', 'آقایی ریش‌دار و عینکی منتظر است.', 'ساکاللی وِه گوزلوک‌لو بیر بِی بِکلییور', 'sakallı', 'ریش‌دار', 'اسم + -lı = دارندهٔ ...'),
      trSentence('tr3-14', 'Onun gibi sakin birini tanımadım.', 'کسی به آرامی او ندیده‌ام.', 'اونون گیبی ساکین بیرینی تانیمادیم', 'sakin', 'آرام', 'onun gibi = مثل او'),
      trSentence('tr3-15', 'Sesi çok yumuşak, hep gülümsüyor.', 'صدایش خیلی نرم است، همیشه لبخند می‌زند.', 'سِسی چوک یوموشاق، هِپ گولومسویور', 'gülümsemek', 'لبخند زدن', 'hep = همیشه'),
      trSentence('tr3-16', 'Dışarıdan soğuk görünüyor ama aslında çok sıcakkanlı.', 'از بیرون سرد به نظر می‌رسد ولی واقعاً خوش‌برخورد است.', 'دیشاریدان سوغوک گورونویور آما اصلِندا چوک سیجاق‌کانلی', 'sıcakkanlı', 'خوش‌برخورد', 'görünmek = به نظر رسیدن'),
    ],
    [
      { speaker: 'علی', text: 'Kardeşini tarif eder misin?', fa: 'خواهرت را توصیف می‌کنی؟' },
      { speaker: 'مریم', text: 'Benden biraz daha uzun, kıvırcık saçlı ve gözlüklü.', fa: 'کمی از من بلندتر است، موهای فرفری دارد و عینکی است.' },
      { speaker: 'علی', text: 'Nasıl bir insan?', fa: 'چه جور آدمی است؟' },
      { speaker: 'مریم', text: 'Çok neşeli ve konuşkan. Dışarıdan ciddi görünüyor ama çok sıcakkanlı.', fa: 'خیلی شاد و خوش‌صحبت است. از بیرون جدی به نظر می‌رسد ولی خیلی خوش‌برخورد است.' },
    ],
    [
      {
        promptFa: 'برای توصیف قد به‌صورت مقایسه‌ای کدام درست است؟',
        choices: ['Benden daha uzun.', 'Benden en uzun.', 'Ben kadar uzun değil.'],
        correctIndex: 0,
        explanationFa: 'مقایسه با «-den daha + صفت» ساخته می‌شود.',
      },
      {
        promptFa: '«ریش‌دار» در ترکی چه می‌شود؟',
        choices: ['sakallı', 'gözlüklü', 'saçlı'],
        correctIndex: 0,
        explanationFa: 'sakal = ریش؛ sakallı = ریش‌دار؛ gözlüklü = عینکی.',
      },
    ],
    'پسوند -lı/-li/-lu/-lü «دارندهٔ ...» می‌سازد: sakal → sakallı، gözlük → gözlüklü، kıvırcık saç → kıvırcık saçlı. برای اخلاق از صفت + bir insan استفاده کنید: sakin bir insan (آدمی آرام). «görünmek» یعنی «به نظر رسیدن»، نه «بودن».',
  ),

  trLesson(
    'tr-l2-03-habits',
    'بیان عادت‌ها و فعالیت‌های روزمره',
    'از کارهای همیشگی و برنامهٔ معمول روز و هفته می‌گویید.',
    [
      trSentence('tr3-17', 'Hafta içi her sabah yedide kalkarım.', 'روزهای هفته هر صبح ساعت هفت بیدار می‌شوم.', 'هافتا ایچی هَر ساباح یِدیدِه کالکاریم', 'hafta içi', 'روزهای هفته', 'فعل + -r/-ar = عادت'),
      trSentence('tr3-18', 'Genelde kahvaltıda peynir ve zeytin yerim.', 'معمولاً صبحانه پنیر و زیتون می‌خورم.', 'گِنِلدِه کاه‌والتی‌دا پِینیر وِه زِیتین یِریم', 'zeytin', 'زیتون', 'genelde = معمولاً'),
      trSentence('tr3-19', 'İşe metroyla giderim, akşam yürüyerek dönerim.', 'با مترو به کار می‌روم، عصر پیاده برمی‌گردم.', 'ایشه مِترویلا گیدِریم، آکشام یورویِرِک دونِریم', 'dönmek', 'برگشتن', '-yarak/-erek = با ... کردن'),
      trSentence('tr3-20', 'Haftada üç gün spor yaparım.', 'هفته‌ای سه روز ورزش می‌کنم.', 'هافتادا اوچ گون سپور یاپاریم', 'spor', 'ورزش', 'haftada = در هفته'),
      trSentence('tr3-21', 'Akşamları kitap okumayı severim.', 'عصرها کتاب خواندن را دوست دارم.', 'آکشاملاری کیتاپ اوکومایی سِوِریم', 'akşamları', 'عصرها', '-ları = ...ها'),
      trSentence('tr3-22', 'Hafta sonu genelde evde kalırım.', 'آخر هفته معمولاً خانه می‌مانم.', 'هافتا سونو گِنِلدِه اِودِه کالیریم', 'kalmak', 'ماندن', 'hafta sonu = آخر هفته'),
      trSentence('tr3-23', 'Hiç geç kalmam, hep erken çıkarım.', 'هیچ‌وقت دیر نمی‌کنم، همیشه زود راه می‌افتم.', 'هیچ گِچ کالمام، هِپ اِرکِن چیکاریم', 'geç kalmak', 'دیر شدن', 'hiç + فعل منفی = هیچ‌وقت'),
      trSentence('tr3-24', 'Alışverişi cumartesi günleri yaparım.', 'خرید را شنبه‌ها انجام می‌دهم.', 'آلیش‌وِریشی جومارتِسی گونلِری یاپاریم', 'alışveriş', 'خرید', 'günleri = روزها'),
    ],
    [
      { speaker: 'علی', text: 'Bir günün nasıl geçiyor?', fa: 'یک روزت چطور می‌گذرد؟' },
      { speaker: 'مریم', text: 'Hafta içi yedide kalkarım, sekizde metroya binerim.', fa: 'روزهای هفته ساعت هفت بیدار می‌شوم، ساعت هشت سوار مترو می‌شوم.' },
      { speaker: 'علی', text: 'Akşamları ne yaparsın?', fa: 'عصرها چه می‌کنی؟' },
      { speaker: 'مریم', text: 'Genelde kitap okurum. Haftada üç gün de spor yaparım.', fa: 'معمولاً کتاب می‌خوانم. هفته‌ای سه روز هم ورزش می‌کنم.' },
      { speaker: 'علی', text: 'Hafta sonu da çalışıyor musun?', fa: 'آخر هفته هم کار می‌کنی؟' },
      { speaker: 'مریم', text: 'Hayır, hafta sonu evde kalırım ve alışveriş yaparım.', fa: 'نه، آخر هفته خانه می‌مانم و خرید می‌کنم.' },
    ],
    [
      {
        promptFa: 'زمان حال ساده (عادت) با کدام پسوند ساخته می‌شود؟',
        choices: ['-r/-ar/-er', '-yor', '-dı'],
        correctIndex: 0,
        explanationFa: 'kalk-ar-ım، gid-er-im: پسوند -r/-ar/-er عادت را نشان می‌دهد.',
      },
      {
        promptFa: '«هفته‌ای سه روز» کدام است؟',
        choices: ['Haftada üç gün', 'Hafta üç gün', 'Üç gün hafta'],
        correctIndex: 0,
        explanationFa: 'hafta + -da = در هفته؛ haftada üç gün = هفته‌ای سه روز.',
      },
    ],
    'عادت‌ها با زمان سادهٔ -r/-ar/-er بیان می‌شوند و با قیدهای تکرار همراه‌اند: her gün (هر روز)، genelde (معمولاً)، haftada üç gün (هفته‌ای سه روز)، akşamları (عصرها). زمان جاری (-yor) برای «همین حالا» است، نه عادت.',
  ),

  trLesson(
    'tr-l2-04-dates',
    'بیان زمان، تاریخ و ترتیب رویدادها',
    'تاریخ، ساعت و ترتیب رویدادها را می‌گویید و می‌پرسید چندم ماه است.',
    [
      trSentence('tr3-25', 'Bugün ayın kaçı?', 'امروز چندم ماه است؟', 'بوگون آیین کاچی', 'ay', 'ماه', 'ayın kaçı = چندم ماه'),
      trSentence('tr3-26', 'Bugün on dokuz Ekim.', 'امروز نوزدهم اکتبر است.', 'بوگون اون دوکوز اِکیم', 'Ekim', 'اکتبر', 'روز + ماه = تاریخ'),
      trSentence('tr3-27', 'Bin dokuz yüz doksan beşte doğdum.', 'در هزار و نهصد و نود و پنج به دنیا آمدم.', 'بین دوکوز یوز دوکسان بِش‌تِه دوغدوم', 'doğmak', 'به دنیا آمدن', 'سال + -de = در سال'),
      trSentence('tr3-28', 'Önce kahve içtik, sonra yola çıktık.', 'اول قهوه خوردیم، بعد راه افتادیم.', 'اونجه کاهوِه ایچتیک، سونرا یولا چیکتیک', 'yola çıkmak', 'راه افتادن', 'önce ... sonra = اول ... بعد'),
      trSentence('tr3-29', 'Toplantı iki saat sürdü.', 'جلسه دو ساعت طول کشید.', 'توپلانتی ایکی ساعت سوردو', 'sürmek', 'طول کشیدن', 'süre = مدت'),
      trSentence('tr3-30', 'Saat üçte başlayıp beşte bitti.', 'ساعت سه شروع شد و پنج تمام شد.', 'ساعت اوچتِ باشلاییپ بِشتِ بیتی', 'bitmek', 'تمام شدن', '-p = و (پیوند دو فعل)'),
      trSentence('tr3-31', 'Her ayın ilk haftası çok yoğunum.', 'هفتهٔ اول هر ماه خیلی سرم شلوغ است.', 'هَر آیین ایلک هافتاسی چوک یوغونوم', 'ilk', 'اول', 'ayın ilk haftası = هفتهٔ اول ماه'),
      trSentence('tr3-32', 'O günden beri her yıl kutluyoruz.', 'از آن روز به بعد هر سال جشن می‌گیریم.', 'او گوندِن بِری هَر ییل کوتلویوروز', 'kutlamak', 'جشن گرفتن', '-den beri = از ... به بعد'),
    ],
    [
      { speaker: 'مریم', text: 'Affedersiniz, bugün ayın kaçı?', fa: 'ببخشید، امروز چندم ماه است؟' },
      { speaker: 'علی', text: 'On dokuz Ekim.', fa: 'نوزدهم اکتبر.' },
      { speaker: 'مریم', text: 'Toplantı ne zaman başlıyor?', fa: 'جلسه چه زمانی شروع می‌شود؟' },
      { speaker: 'علی', text: 'Saat üçte başlayıp beşte bitiyor.', fa: 'ساعت سه شروع می‌شود و پنج تمام می‌شود.' },
      { speaker: 'مریم', text: 'O günden beri program çok yoğun.', fa: 'از آن روز به بعد برنامه خیلی شلوغ است.' },
    ],
    [
      {
        promptFa: 'برای پرسیدن «چندم ماه است؟» کدام جمله درست است؟',
        choices: ['Bugün ayın kaçı?', 'Bugün saat kaç?', 'Bugün günlerden ne?'],
        correctIndex: 0,
        explanationFa: 'ayın kaçı = چندم ماه؛ saat kaç = ساعت چند؛ günlerden ne = چه روزی.',
      },
      {
        promptFa: '«اول ... بعد ...» کدام است؟',
        choices: ['önce ... sonra', 'hem ... hem', 'ne ... ne'],
        correctIndex: 0,
        explanationFa: 'önce = اول، sonra = بعد؛ ترتیب رویدادها را نشان می‌دهد.',
      },
    ],
    'تاریخ: روز + ماه (on dokuz Ekim) و سال با پسوند -de: 1995’te. برای ترتیب: önce (اول)، sonra (بعد)، ondan sonra (بعد از آن)، en sonunda (در پایان). فعل‌های پشت‌سرهم را با -p وصل کنید: başlayıp bitiyor (شروع می‌شود و تمام می‌شود).',
  ),

  trLesson(
    'tr-l2-05-past-experience',
    'صحبت درباره گذشته و تجربه‌های شخصی',
    'از سفر یا تجربهٔ گذشته‌تان تعریف می‌کنید و می‌گویید آن روزها چطور بود.',
    [
      trSentence('tr3-33', 'Geçen yaz Antalya’ya gittik.', 'تابستان گذشته به آنتالیا رفتیم.', 'گِچِن یاز آنتالیا گیتیک', 'geçen yaz', 'تابستان گذشته', 'git-ti-k = رفتیم'),
      trSentence('tr3-34', 'Orada çok güzel günler geçirdik.', 'آنجا روزهای خیلی خوبی گذراندیم.', 'اورادا چوک گوزل گونلِر گِچیردیک', 'geçirmek', 'گذراندن', 'geçir-dik = گذراندیم'),
      trSentence('tr3-35', 'Daha önce hiç denize girmemiştim.', 'قبلاً هرگز در دریا شنا نکرده بودم.', 'داها اونجه هیچ دِنیزه گیرمِمیشتیم', 'denize girmek', 'به دریا رفتن', '-mıştı = گذشتهٔ تجربی'),
      trSentence('tr3-36', 'İlk gün hava çok sıcaktı.', 'روز اول هوا خیلی گرم بود.', 'ایلک گون هَوا چوک سیجاقتی', 'sıcaktı', 'گرم بود', 'صفت + -tı = بود'),
      trSentence('tr3-37', 'Bir akşam tekne turuna çıktık.', 'یک شب به تور قایق رفتیم.', 'بیر آکشام تِکنِه تورونا چیکتیک', 'tekne', 'قایق', 'tur = تور'),
      trSentence('tr3-38', 'O gezide yeni arkadaşlar edindim.', 'در آن سفر دوستان تازه‌ای پیدا کردم.', 'او گِزیدِه یِنی آرکاداشلار اِدیندیم', 'gezi', 'سفر / گشت', 'edindim = پیدا کردم'),
      trSentence('tr3-39', 'Döndüğümüzde çok yorgunduk ama mutluyduk.', 'وقتی برگشتیم خیلی خسته بودیم ولی خوشحال بودیم.', 'دوندوغوموزدا چوک یورگوندوک آما موت‌لوی‌دوک', 'mutlu', 'خوشحال', '-dığımızda = وقتی که ...'),
      trSentence('tr3-40', 'Bu benim en güzel tatilimdi.', 'این بهترین تعطیلات من بود.', 'بو بِنیم اِن گوزل تاتیلیمدی', 'tatil', 'تعطیلات', 'en güzel ... -imdi'),
    ],
    [
      { speaker: 'علی', text: 'Yazın ne yaptın?', fa: 'تابستان چه کردی؟' },
      { speaker: 'مریم', text: 'Geçen yaz Antalya’ya gittik, çok güzel günler geçirdik.', fa: 'تابستان گذشته به آنتالیا رفتیم، روزهای خیلی خوبی گذراندیم.' },
      { speaker: 'علی', text: 'Daha önce oraya gitmiş miydin?', fa: 'قبلاً آنجا رفته بودی؟' },
      { speaker: 'مریم', text: 'Hayır, daha önce hiç denize girmemiştim.', fa: 'نه، قبلاً هرگز در دریا شنا نکرده بودم.' },
      { speaker: 'علی', text: 'Nasıl geçti?', fa: 'چطور گذشت؟' },
      { speaker: 'مریم', text: 'Döndüğümüzde çok yorgunduk ama çok mutluyduk.', fa: 'وقتی برگشتیم خیلی خسته بودیم ولی خیلی خوشحال بودیم.' },
    ],
    [
      {
        promptFa: '«قبلاً هرگز در دریا شنا نکرده بودم» کدام است؟',
        choices: ['Daha önce hiç denize girmemiştim.', 'Daha önce hiç denize girmedim.', 'Şimdi denize giriyorum.'],
        correctIndex: 0,
        explanationFa: '-mıştım تجربهٔ پیش از گذشته را نشان می‌دهد: girmemiştim.',
      },
      {
        promptFa: '«وقتی برگشتیم» چگونه گفته می‌شود؟',
        choices: ['Döndüğümüzde', 'Dönüyoruz', 'Döneceğiz'],
        correctIndex: 0,
        explanationFa: '-dığımızda یعنی «وقتی که ما ... کردیم».',
      },
    ],
    'برای تجربهٔ گذشته سه زمان را جدا کنید: -dı (رویداد کامل: gittik)، -mıştı (تجربهٔ پیش از آن لحظه: girmemiştim) و -dığımızda (هم‌زمانی: döndüğümüzde). قیدهای همراه: geçen yaz، daha önce، ilk gün، o gezide.',
  ),

  trLesson(
    'tr-l2-06-future-plans',
    'بیان برنامه‌ها و پیش‌بینی‌های آینده',
    'برنامهٔ آینده و حدس و پیش‌بینی خود را بیان می‌کنید.',
    [
      trSentence('tr3-41', 'Önümüzdeki hafta tatile çıkacağız.', 'هفتهٔ آینده به تعطیلات می‌رویم.', 'اونوموزدِکی هافتا تاتیله چیکاجاآیز', 'önümüzdeki', 'آیندهٔ / پیش‌رو', 'çık-acak-ız = خواهیم رفت'),
      trSentence('tr3-42', 'Sanırım yarın yağmur yağacak.', 'فکر می‌کنم فردا باران می‌بارد.', 'سانیریم یارین یاغمور یاغاجاک', 'sanırım', 'فکر می‌کنم', 'sanırım = به گمانم'),
      trSentence('tr3-43', 'Belki bu akşam dışarı çıkarız.', 'شاید امشب بیرون برویم.', 'بِلکی بو آکشام دیشاری چیکاریز', 'belki', 'شاید', '-arız = زمان ساده برای احتمال'),
      trSentence('tr3-44', 'Toplantı saat onda başlayacak.', 'جلسه ساعت ده شروع می‌شود.', 'توپلانتی ساعت اوندا باشلایاجاک', 'başlamak', 'شروع شدن', 'başla-yacak = شروع خواهد شد'),
      trSentence('tr3-45', 'Galiba işler bu yıl daha iyi gidecek.', 'گویا کارها امسال بهتر پیش می‌رود.', 'گالیبا ایشلِر بو ییل داها ایّی گیدِجِک', 'galiba', 'گویا', 'daha iyi = بهتر'),
      trSentence('tr3-46', 'Kesin değil, planı sonra kesinleştireceğiz.', 'قطعی نیست، برنامه را بعد قطعی می‌کنیم.', 'کِسین دِییل، پلانی سونرا کِسینلِشتیرِجِییز', 'kesinleştirmek', 'قطعی کردن', 'kesin = قطعی'),
      trSentence('tr3-47', 'Sınavdan sonra dinlenmeyi düşünüyorum.', 'بعد از امتحان قصد دارم استراحت کنم.', 'سیناودان سونرا دینلِنمِیی دوشونویوروم', 'düşünmek', 'فکر کردن', '-meyi düşünüyorum = قصد ... دارم'),
      trSentence('tr3-48', 'Umarım her şey yolunda gider.', 'امیدوارم همه‌چیز خوب پیش برود.', 'اوماریم هَر شِی یولوندا گیدِر', 'umarım', 'امیدوارم', 'yolunda gitmek = خوب پیش رفتن'),
    ],
    [
      { speaker: 'علی', text: 'Önümüzdeki hafta ne yapacaksınız?', fa: 'هفتهٔ آینده چه خواهید کرد؟' },
      { speaker: 'مریم', text: 'Tatile çıkacağız. Sanırım hava güzel olacak.', fa: 'به تعطیلات می‌رویم. فکر می‌کنم هوا خوب می‌شود.' },
      { speaker: 'علی', text: 'Kesin mi?', fa: 'قطعی است؟' },
      { speaker: 'مریم', text: 'Kesin değil, belki bir gün önce çıkarız.', fa: 'قطعی نیست، شاید یک روز زودتر راه بیفتیم.' },
      { speaker: 'علی', text: 'Umarım her şey yolunda gider.', fa: 'امیدوارم همه‌چیز خوب پیش برود.' },
    ],
    [
      {
        promptFa: 'کدام واژه «شاید» است؟',
        choices: ['belki', 'kesin', 'galiba'],
        correctIndex: 0,
        explanationFa: 'belki = شاید؛ kesin = قطعی؛ galiba = گویا.',
      },
      {
        promptFa: '«قصد دارم استراحت کنم» کدام است؟',
        choices: ['Dinlenmeyi düşünüyorum.', 'Dinleniyorum.', 'Dinlendim.'],
        correctIndex: 0,
        explanationFa: '-meyi düşünüyorum یعنی «قصد ... را دارم».',
      },
    ],
    'آیندهٔ قطعی‌تر با -acak/-ecek (gideceğiz)، پیش‌بینی و احتمال با زمان سادهٔ -r (çıkarız) یا واژه‌های sanırım، galiba، belki، muhtemelen. برای قصد: -meyi düşünüyorum. «Kesin» و «kesin değil» درجهٔ قطعیت را روشن می‌کنند.',
  ),

  trLesson(
    'tr-l2-07-comparing',
    'مقایسه اشخاص، اشیا و مکان‌ها',
    'دو یا چند چیز را از نظر قیمت، اندازه و کیفیت مقایسه می‌کنید.',
    [
      trSentence('tr3-49', 'Bu mağaza diğerinden daha ucuz.', 'این مغازه از آن یکی ارزان‌تر است.', 'بو ماغازا دییِرین‌دِن داها اوجوز', 'mağaza', 'مغازه', '-den daha + صفت'),
      trSentence('tr3-50', 'İstanbul Ankara’dan daha kalabalık.', 'استانبول از آنکارا شلوغ‌تر است.', 'ایستانبول آنکارادان داها کالابالیک', 'kalabalık', 'شلوغ', 'مقایسهٔ دو مکان'),
      trSentence('tr3-51', 'En sevdiğim mevsim ilkbahar.', 'فصل مورد علاقه‌ام بهار است.', 'اِن سِودییم مِوسیم ایلک‌باهار', 'mevsim', 'فصل', 'en + صفت = صفت‌ترین'),
      trSentence('tr3-52', 'Ben ablam kadar sabırlı değilim.', 'من به اندازهٔ خواهرم صبور نیستم.', 'بِن آبلام کادار صابیرلی دِییلیم', 'kadar', 'به اندازهٔ', 'kadar ... değil = به‌اندازهٔ ... نیست'),
      trSentence('tr3-53', 'Bu yol daha kısa ama daha yavaş.', 'این راه کوتاه‌تر است ولی کندتر.', 'بو یول داها کیسا آما داها یاواش', 'kısa', 'کوتاه', 'دو مقایسه در یک جمله'),
      trSentence('tr3-54', 'İkisi arasında bir fark yok.', 'بین آن دو فرقی نیست.', 'ایکیسی آراسیندا بیر فارک یوک', 'fark', 'تفاوت', 'arasında = بین'),
      trSentence('tr3-55', 'Araba tren kadar rahat değil.', 'ماشین به اندازهٔ قطار راحت نیست.', 'آرابا ترِن کادار راحات دِییل', 'rahat', 'راحت', 'kadar değil'),
      trSentence('tr3-56', 'Sonuçta ucuz olanı seçtik.', 'در نهایت ارزان‌تر را انتخاب کردیم.', 'سونوچتا اوجوز اولانی سِچتیک', 'seçmek', 'انتخاب کردن', 'olan = آن که ... است'),
    ],
    [
      { speaker: 'مریم', text: 'Hangisi daha ucuz, bu mağaza mı diğeri mi?', fa: 'کدام ارزان‌تر است، این مغازه یا آن یکی؟' },
      { speaker: 'علی', text: 'Bu mağaza diğerinden daha ucuz ama daha kalabalık.', fa: 'این مغازه از آن یکی ارزان‌تر است ولی شلوغ‌تر.' },
      { speaker: 'مریم', text: 'İstanbul Ankara’dan daha mı pahalı?', fa: 'استانبول از آنکارا گران‌تر است؟' },
      { speaker: 'علی', text: 'Evet, ama Ankara kadar kalabalık değil.', fa: 'بله، ولی به اندازهٔ آنکارا شلوغ نیست.' },
      { speaker: 'مریم', text: 'Sonuçta ucuz olanı seçtik.', fa: 'در نهایت ارزان‌تر را انتخاب کردیم.' },
    ],
    [
      {
        promptFa: '«به اندازهٔ ... نیست» با کدام ساختار ساخته می‌شود؟',
        choices: ['kadar ... değil', 'daha ... değil', 'en ... değil'],
        correctIndex: 0,
        explanationFa: 'ben ablam kadar sabırlı değilim = به اندازهٔ خواهرم صبور نیستم.',
      },
      {
        promptFa: 'برای صفت عالی («ترین») کدام واژه به کار می‌رود؟',
        choices: ['en', 'daha', 'kadar'],
        correctIndex: 0,
        explanationFa: 'en güzel = زیباترین؛ daha = -تر.',
      },
    ],
    'سه سطح مقایسه: daha + صفت (تر)، en + صفت (ترین) و kadar ... değil (به‌اندازهٔ ... نیست). برای گفتن «از ...» پسوند -den/-dan به شخص یا مکان می‌چسبد: senden، Ankara’dan. برای «بین آن دو»: ikisi arasında.',
  ),

  trLesson(
    'tr-l2-08-preferences',
    'بیان ترجیحات، علایق و احساسات',
    'می‌گویید چه چیزی را ترجیح می‌دهید، از چه خوشتان می‌آید و چه حسی دارید.',
    [
      trSentence('tr3-57', 'Ben çayı kahveye tercih ederim.', 'من چای را به قهوه ترجیح می‌دهم.', 'بِن چایی کاهوِیِه تِرجیح اِدِریم', 'tercih etmek', 'ترجیح دادن', '-i ... -e tercih ederim'),
      trSentence('tr3-58', 'Deniz kenarında oturmayı seviyorum.', 'نشستن کنار دریا را دوست دارم.', 'دِنیز کِناریندا اوتورمایی سِوی‌یوروم', 'deniz kenarı', 'کنار دریا', '-mayı seviyorum'),
      trSentence('tr3-59', 'Gürültülü yerlerden hiç hoşlanmam.', 'از جاهای شلوغ هیچ خوشم نمی‌آید.', 'گورولتولو یِرلِردِن هیچ هوشلانمام', 'gürültü', 'سر و صدا', '-den hoşlanmam = خوشم نمی‌آید'),
      trSentence('tr3-60', 'Bu müzik beni çok rahatlatıyor.', 'این موسیقی مرا خیلی آرام می‌کند.', 'بو موزیک بِنی چوک راحاتلاتییور', 'rahatlamak', 'آرام شدن', 'beni = مرا'),
      trSentence('tr3-61', 'Açıkçası bu fikir bana mantıklı gelmiyor.', 'رک بگویم این ایده به نظرم منطقی نمی‌آید.', 'آچیکچاسی بو فیکیر بانا مانتیکلی گِلمییور', 'mantıklı', 'منطقی', 'bana ... gelmiyor = به نظر من ... نیست'),
      trSentence('tr3-62', 'Senin yerinde olsam kabul ederdim.', 'اگر جای تو بودم قبول می‌کردم.', 'سِنین یِرین‌دِه اولسام کابول اِدِردیم', 'kabul etmek', 'قبول کردن', 'yerinde olsam = اگر جای تو بودم'),
      trSentence('tr3-63', 'Bu konuda kendimi biraz endişeli hissediyorum.', 'در این باره کمی نگرانم.', 'بو کونودا کِندیمی بیراز اِندی‌شِلی حیص‌اِدییوروم', 'endişeli', 'نگران', 'hissetmek = احساس کردن'),
      trSentence('tr3-64', 'Bence bu film izlemeye değer.', 'به نظر من این فیلم ارزش دیدن دارد.', 'بِنجِه بو فیلم ایزلِمِیِه دِیِر', 'değer', 'ارزش', '-meye değer = ارزش ... را دارد'),
    ],
    [
      { speaker: 'علی', text: 'Çay mı kahve mi?', fa: 'چای یا قهوه؟' },
      { speaker: 'مریم', text: 'Ben çayı kahveye tercih ederim.', fa: 'من چای را به قهوه ترجیح می‌دهم.' },
      { speaker: 'علی', text: 'Bu müzik hakkında ne düşünüyorsun?', fa: 'دربارهٔ این موسیقی چه فکر می‌کنی؟' },
      { speaker: 'مریم', text: 'Beni çok rahatlatıyor. Ama gürültülü yerlerden hiç hoşlanmam.', fa: 'مرا خیلی آرام می‌کند. ولی از جاهای شلوغ هیچ خوشم نمی‌آید.' },
      { speaker: 'علی', text: 'Bu filmi izlemeye değer mi?', fa: 'ارزش دیدن دارد؟' },
      { speaker: 'مریم', text: 'Bence değer, açıkçası ben çok sevdim.', fa: 'به نظر من دارد، رک بگویم من خیلی دوستش داشتم.' },
    ],
    [
      {
        promptFa: '«چای را به قهوه ترجیح می‌دهم» کدام است؟',
        choices: ['Çayı kahveye tercih ederim.', 'Çay ve kahve içerim.', 'Kahveyi çaya tercih ederim.'],
        correctIndex: 0,
        explanationFa: 'ترتیب «چیزی که ترجیح می‌دهیم» + -i، بعد «چیزی که کمتر» + -e.',
      },
      {
        promptFa: '«از ... خوشم نمی‌آید» با کدام ساختار است؟',
        choices: ['-den hoşlanmam', '-i sevmiyorum', '-e gidiyorum'],
        correctIndex: 0,
        explanationFa: 'gürültülü yerlerden hoşlanmam = از جاهای شلوغ خوشم نمی‌آید.',
      },
    ],
    'برای ترجیح «X-i Y-e tercih ederim»، برای علاقه «-mayı severim» یا «-den hoşlanırım» و برای احساس «kendimi ... hissediyorum». عبارت‌های نظر: bence، açıkçası، bana göre، senin yerinde olsam. «değer» در ساختار «-meye değer» یعنی «ارزش ... را دارد».',
  ),

  trLesson(
    'tr-l2-09-obligation',
    'بیان نیاز، اجبار و ضرورت',
    'می‌گویید چه کاری باید یا مجبورید انجام دهید و چه کاری لازم نیست.',
    [
      trSentence('tr3-65', 'Yarın erken kalkmam gerekiyor.', 'فردا باید زود بیدار شوم.', 'یارین اِرکِن کالکمام گِرِکییور', 'gerekmek', 'لازم بودن', '-mam gerekiyor = باید ... کنم'),
      trSentence('tr3-66', 'Bu formu bugün doldurmak zorundayım.', 'باید این فرم را امروز پر کنم.', 'بو فورمو بوگون دولدورماق زورونداییِم', 'zorunda', 'مجبور', '-mak zorundayım = مجبورم ...'),
      trSentence('tr3-67', 'Reçeteyi almadan ilaç vermiyorlar.', 'بدون نسخه دارو نمی‌دهند.', 'رِچِتِیی آلمادان ایلاچ وِرمییورلار', 'reçete', 'نسخه', '-madan = بدون ... کردن'),
      trSentence('tr3-68', 'Daha fazla beklememize gerek yok.', 'لازم نیست بیشتر صبر کنیم.', 'داها فازلا بِکلِمِمیزِه گِرِک یوک', 'beklemek', 'صبر کردن', 'gerek yok = لازم نیست'),
      trSentence('tr3-69', 'Odamı toplamam lazım, çok dağınık.', 'باید اتاقم را جمع کنم، خیلی به‌هم‌ریخته است.', 'اودامی توپلامام لازیم، چوک داآنیک', 'dağınık', 'به‌هم‌ریخته', 'lazım = لازم'),
      trSentence('tr3-70', 'Doktor sigara içmemem gerektiğini söyledi.', 'پزشک گفت نباید سیگار بکشم.', 'دوکتور سیگارا ایچمِمِم گِرِکتییینی سویلِدی', 'söylemek', 'گفتن', 'gerektiğini = که لازم است'),
      trSentence('tr3-71', 'Bu işi tek başıma yapamam.', 'نمی‌توانم این کار را تنها انجام دهم.', 'بو ایشی تِک باشیما یاپامام', 'tek başına', 'تنها', '-amam = نتوانستن'),
      trSentence('tr3-72', 'Acele etmeliyiz, tren kalkıyor.', 'باید عجله کنیم، قطار حرکت می‌کند.', 'آجِلِه اِتمِلیییز، ترِن کالکییور', 'acele etmek', 'عجله کردن', '-meli = باید'),
    ],
    [
      { speaker: 'الميرا', text: 'Yarın erken kalkmam gerekiyor mu?', fa: 'فردا باید زود بیدار شوم؟' },
      { speaker: 'مریم', text: 'Evet, toplantı dokuzda. Bu formu da doldurmak zorundayız.', fa: 'بله، جلسه ساعت نه است. باید این فرم را هم پر کنیم.' },
      { speaker: 'الميرا', text: 'Daha fazla beklememize gerek var mı?', fa: 'لازم است بیشتر صبر کنیم؟' },
      { speaker: 'مریم', text: 'Hayır, gerek yok. Ama odamı toplamam lazım.', fa: 'نه، لازم نیست. ولی باید اتاقم را جمع کنم.' },
      { speaker: 'الميرا', text: 'Acele etmeliyiz, geç kalıyoruz!', fa: 'باید عجله کنیم، داریم دیر می‌کنیم!' },
    ],
    [
      {
        promptFa: '«لازم نیست» کدام است؟',
        choices: ['gerek yok', 'gerek var', 'zorundayım'],
        correctIndex: 0,
        explanationFa: 'gerek yok = لازم نیست؛ gerek var = لازم است.',
      },
      {
        promptFa: '«باید عجله کنیم» کدام است؟',
        choices: ['Acele etmeliyiz.', 'Acele ediyoruz.', 'Acele ettik.'],
        correctIndex: 0,
        explanationFa: 'پسوند -meli/-malı باید و اجبار را می‌سازد: et-meli-yiz.',
      },
    ],
    'چهار راه برای باید و اجبار: -meli/-malı (باید)، -mam/-mem gerekiyor (لازم است که ...)، lazım (لازم)، -mak zorundayım (مجبورم). نفی‌اش با «gerek yok» یا «-meme gerek yok» می‌آید. «-madan/-meden» یعنی «بدون اینکه ... کند».',
  ),

  trLesson(
    'tr-l2-10-polite',
    'درخواست مؤدبانه و پیشنهاد دادن',
    'مؤدبانه درخواست می‌کنید، پیشنهاد می‌دهید و کسی را به کاری دعوت می‌کنید.',
    [
      trSentence('tr3-73', 'Müsait olduğunuzda beni arar mısınız?', 'وقتی فرصت داشتید به من زنگ می‌زنید؟', 'موساعیت اولدوغونوزدا بِنی آرار میسینیز', 'müsait', 'در دسترس / فرصت', '-duğunuzda = وقتی که شما ...'),
      trSentence('tr3-74', 'Bir dakikanızı alabilir miyim?', 'می‌توانم یک لحظه از وقتتان بگیرم؟', 'بیر داکیکانیری آلابیلیر می‌ییم', 'dakika', 'دقیقه', '-ınızı = ... شما را'),
      trSentence('tr3-75', 'Bize katılmak ister misiniz?', 'دوست دارید به ما بپیوندید؟', 'بیزه کاتیلماک ایستِر میسینیز', 'katılmak', 'پیوستن', 'ister misiniz = میل دارید؟'),
      trSentence('tr3-76', 'İsterseniz yarın buluşabiliriz.', 'اگر بخواهید فردا می‌توانیم ببینیم.', 'ایستِرسِن‌یز یارین بولوشابیلیریز', 'istemek', 'خواستن', '-abiliriz = می‌توانیم'),
      trSentence('tr3-77', 'Bir kahve içmeye ne dersin?', 'چطور است یک قهوه بنوشیم؟', 'بیر کاهوِه ایچمِیِه نِه دِرسین', 'ne dersin', 'چه می‌گویی', 'پیشنهاد با ne dersin'),
      trSentence('tr3-78', 'Yardım etmemi ister misiniz?', 'می‌خواهید کمک کنم؟', 'یاردیم اِتمِمی ایستِر میسینیز', 'yardım etmek', 'کمک کردن', '-memi = ... کردنِ من را'),
      trSentence('tr3-79', 'Rahatsız ettiysem özür dilerim.', 'اگر مزاحم شدم عذر می‌خواهم.', 'راحاتسیز اِتتییسِم اوزور دیلِریم', 'rahatsız etmek', 'مزاحم شدن', '-tiysem = اگر ... کردم'),
      trSentence('tr3-80', 'Lütfen biraz daha yavaş konuşabilir misiniz?', 'لطفاً می‌توانید کمی آهسته‌تر صحبت کنید؟', 'لوتفِن بیراز داها یاواش کونوشابیلیر میسینیز', 'yavaş', 'آهسته', 'daha yavaş = آهسته‌تر'),
    ],
    [
      { speaker: 'مریم', text: 'Müsait olduğunuzda beni arar mısınız?', fa: 'وقتی فرصت داشتید به من زنگ می‌زنید؟' },
      { speaker: 'کارمند', text: 'Tabii, öğleden sonra arayabilirim.', fa: 'البته، بعدازظهر می‌توانم زنگ بزنم.' },
      { speaker: 'مریم', text: 'Bir kahve içmeye ne dersiniz?', fa: 'چطور است یک قهوه بنوشیم؟' },
      { speaker: 'کارمند', text: 'Çok iyi olur, teşekkürler.', fa: 'خیلی خوب می‌شود، ممنون.' },
      { speaker: 'مریم', text: 'Rahatsız ettiysem özür dilerim.', fa: 'اگر مزاحم شدم عذر می‌خواهم.' },
    ],
    [
      {
        promptFa: 'برای پیشنهاد دوستانه («چطور است ...؟») کدام عبارت است؟',
        choices: ['ne dersin', 'ne zaman', 'ne kadar'],
        correctIndex: 0,
        explanationFa: 'Bir kahve içmeye ne dersin? = چطور است یک قهوه بنوشیم؟',
      },
      {
        promptFa: 'کدام درخواست مؤدبانه‌تر است؟',
        choices: ['Beni arar mısınız?', 'Beni ara!', 'Beni arıyorsun.'],
        correctIndex: 0,
        explanationFa: '«-ar mısınız?» با «siz» مؤدبانه‌ترین شکل درخواست است.',
      },
    ],
    'ادب در ترکی با «siz» (شما) و پرسش‌های نرم ساخته می‌شود: -ar mısınız?، -abilir misiniz?، ister misiniz? برای پیشنهاد: «ne dersin?» (دوستانه) و «ne dersiniz?» (رسمی). پیش از درخواست، «müsait olduğunuzda» یا «rahatsız ettiysem özür dilerim» فضا را نرم می‌کند.',
  ),

  trLesson(
    'tr-l2-11-possibility',
    'بیان توانایی، امکان و احتمال',
    'می‌گویید چه کاری را می‌توانید یا نمی‌توانید و چقدر احتمال دارد.',
    [
      trSentence('tr3-81', 'Türkçe konuşabiliyorum ama yazmakta zorlanıyorum.', 'می‌توانم ترکی صحبت کنم ولی در نوشتن مشکل دارم.', 'تورکچه کونوشابیلیروم آما یازماکتا زورلانییوروم', 'zorlanmak', 'مشکل داشتن', '-makta zorlanıyorum = در ... مشکل دارم'),
      trSentence('tr3-82', 'Bu akşam gelebilirim, emin değilim.', 'ممکن است امشب بیایم، مطمئن نیستم.', 'بو آکشام گِلِبیلیریم، اِمین دِییلیم', 'emin', 'مطمئن', '-ebilirim = ممکن است'),
      trSentence('tr3-83', 'Belki yarın hava düzelir.', 'شاید فردا هوا بهتر شود.', 'بِلکی یارین هَوا دوزِلیر', 'düzelmek', 'بهتر شدن', 'belki = شاید'),
      trSentence('tr3-84', 'Burada park etmek yasak olabilir.', 'ممکن است پارک کردن اینجا ممنوع باشد.', 'بورادا پارک اِتمِک یاساک اولابیلیر', 'yasak', 'ممنوع', 'olabilir = ممکن است'),
      trSentence('tr3-85', 'Muhtemelen toplantı uzayacak.', 'احتمالاً جلسه طول می‌کشد.', 'موحتِمِلِن توپلانتی اوزایاجاک', 'muhtemelen', 'احتمالاً', 'uzamak = طولانی شدن'),
      trSentence('tr3-86', 'Onu ikna edebilir miyim bilmiyorum.', 'نمی‌دانم می‌توانم قانعش کنم یا نه.', 'اونو ایکنا اِدِبیلیر می‌ییم بیلمییوروم', 'ikna etmek', 'قانع کردن', '-ebilir miyim'),
      trSentence('tr3-87', 'Bu kadarını yapmaya gücüm yetmez.', 'توان انجام این‌قدر را ندارم.', 'بو کادارینی یاپمایا گوجوم یِتمِز', 'güç', 'توان', 'yetmez = کافی نیست'),
      trSentence('tr3-88', 'Her şey mümkün, bekleyip göreceğiz.', 'همه‌چیز ممکن است، صبر می‌کنیم و می‌بینیم.', 'هَر شِی مومکون، بِکلِییپ گورجِییز', 'mümkün', 'ممکن', 'bekleyip = صبر کردن و'),
    ],
    [
      { speaker: 'علی', text: 'Bu akşam gelebilir misin?', fa: 'امشب می‌توانی بیایی؟' },
      { speaker: 'مریم', text: 'Belki gelebilirim, emin değilim.', fa: 'شاید بتوانم بیایم، مطمئن نیستم.' },
      { speaker: 'علی', text: 'Türkçe yazabiliyor musun?', fa: 'می‌توانی ترکی بنویسی؟' },
      { speaker: 'مریم', text: 'Konuşabiliyorum ama yazmakta zorlanıyorum.', fa: 'می‌توانم صحبت کنم ولی در نوشتن مشکل دارم.' },
      { speaker: 'علی', text: 'Merak etme, her şey mümkün.', fa: 'نگران نباش، همه‌چیز ممکن است.' },
    ],
    [
      {
        promptFa: '«ممکن است» با کدام ساختار بیان می‌شود؟',
        choices: ['olabilir', 'oldu', 'oluyor'],
        correctIndex: 0,
        explanationFa: 'olabilir = ممکن است؛ yasak olabilir = ممکن است ممنوع باشد.',
      },
      {
        promptFa: '«در نوشتن مشکل دارم» کدام است؟',
        choices: ['Yazmakta zorlanıyorum.', 'Yazmayı sevmiyorum.', 'Yazacağım.'],
        correctIndex: 0,
        explanationFa: '-makta zorlanmak = در ... مشکل داشتن.',
      },
    ],
    'توانایی با -abil/-ebil (konuş-abil-iyorum)، احتمال با olabilir، belki، muhtemelen، galiba بیان می‌شود. ناتوانی با -ama/-eme است: yapamam، gidemem. برای مهارت جزئی: «-makta zorlanıyorum» (در ... مشکل دارم).',
  ),

  trLesson(
    'tr-l2-12-directions',
    'توضیح مسیر، آدرس و موقعیت مکانی',
    'مسیر را توضیح می‌دهید، آدرس می‌پرسید و می‌گویید جایی کجاست.',
    [
      trSentence('tr3-89', 'Bu sokaktan düz devam edin.', 'از این خیابان مستقیم ادامه دهید.', 'بو سوکاکتان دوز دِوام اِدین', 'devam etmek', 'ادامه دادن', 'sokak + -tan = از خیابان'),
      trSentence('tr3-90', 'İkinci kavşaktan sola dönün.', 'از چهارراه دوم به چپ بپیچید.', 'ایکینجی کاوشاکتان سولا دونون', 'kavşak', 'چهارراه', 'ikinci = دوم'),
      trSentence('tr3-91', 'Eczane köşede, pastanenin karşısında.', 'داروخانه سر نبش، روبه‌روی قنادی است.', 'اِجزانه کوشِدِه، پاستانِنین کارشیسیندا', 'köşe', 'نبش', 'karşısında = روبه‌روی'),
      trSentence('tr3-92', 'Beş dakika yürürseniz oradasınız.', 'اگر پنج دقیقه پیاده بروید آنجا هستید.', 'بِش داکیکا یورورسِن‌یز اوراداسینیز', 'yürümek', 'پیاده رفتن', '-seniz = اگر ... کنید'),
      trSentence('tr3-93', 'Buranın adı ne? Haritada bulamıyorum.', 'اسم اینجا چیست؟ روی نقشه پیدا نمی‌کنم.', 'بورانین آدی نِه؟ هاریتادا بولامییوروم', 'harita', 'نقشه', 'bulamıyorum = پیدا نمی‌کنم'),
      trSentence('tr3-94', 'Metro istasyonu bu binanın arkasında.', 'ایستگاه مترو پشت این ساختمان است.', 'مِترو ایستاسیونو بو بینانین آرکاسیندا', 'bina', 'ساختمان', 'arkasında = پشت'),
      trSentence('tr3-95', 'En yakın otobüs durağı hangi tarafta?', 'نزدیک‌ترین ایستگاه اتوبوس کدام طرف است؟', 'اِن یاقین اوتوبوس دوراغی هانگی طرفتا', 'durak', 'ایستگاه', 'hangi taraf = کدام طرف'),
      trSentence('tr3-96', 'Yolu tarif ettiğiniz için teşekkürler.', 'ممنون که مسیر را توضیح دادید.', 'یولو تاریف اِتتییینیز ایچین تشکّورلَر', 'tarif etmek', 'توضیح دادن', '-diğiniz için = به‌خاطر اینکه'),
    ],
    [
      { speaker: 'مریم', text: 'Affedersiniz, eczane nerede?', fa: 'ببخشید، داروخانه کجاست؟' },
      { speaker: 'رهگذر', text: 'Bu sokaktan düz devam edin, ikinci kavşaktan sola dönün.', fa: 'از این خیابان مستقیم بروید، از چهارراه دوم به چپ بپیچید.' },
      { speaker: 'مریم', text: 'Uzak mı?', fa: 'دور است؟' },
      { speaker: 'رهگذر', text: 'Hayır, beş dakika yürürseniz oradasınız. Pastanenin karşısında.', fa: 'نه، اگر پنج دقیقه پیاده بروید آنجا هستید. روبه‌روی قنادی.' },
      { speaker: 'مریم', text: 'Çok teşekkürler, yolu tarif ettiğiniz için.', fa: 'خیلی ممنون که مسیر را توضیح دادید.' },
    ],
    [
      {
        promptFa: '«از چهارراه دوم به چپ بپیچید» کدام است؟',
        choices: ['İkinci kavşaktan sola dönün.', 'İkinci kavşaktan sağa dönün.', 'Düz devam edin.'],
        correctIndex: 0,
        explanationFa: 'kavşak = چهارراه؛ sola dönmek = به چپ پیچیدن.',
      },
      {
        promptFa: '«پشت ساختمان» کدام است؟',
        choices: ['binanın arkasında', 'binanın içinde', 'binanın üstünde'],
        correctIndex: 0,
        explanationFa: 'arkasında = پشت؛ içinde = داخل؛ üstünde = روی.',
      },
    ],
    'مسیر را مرحله‌به‌مرحله بگویید و فعل‌های امری مؤدبانه را با «siz» به کار ببرید: devam edin، dönün، girin. برای موقعیت: «اسم + -ın + üstünde/içinde/yanında/arkasında/karşısında». برای سؤال «کدام طرف؟» از «hangi tarafta?» استفاده کنید.',
  ),
];
