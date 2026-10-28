import type { LearningLesson } from './types';
import { trLesson, trSentence } from './turkishLessonKit';

/**
 * ده درس تکمیلی A1 Survival برای موضوع‌هایی که در فهرست قبلی پوشش نداشتند.
 * هر درس به مجموعهٔ قبلی افزوده می‌شود و هیچ‌یک از درس‌های موجود را جایگزین نمی‌کند.
 */
export const TURKISH_SURVIVAL_LESSONS_B: readonly LearningLesson[] = [
  trLesson(
    'tr-survival-01-social-introduction',
    'معرفی خود در موقعیت‌های اجتماعی',
    'در یک دورهمی یا گردهمایی تازه با دیگران آشنا می‌شوید و گفت‌وگو را آغاز می‌کنید.',
    [
      trSentence('tr5-01', 'Bu etkinliğe ilk kez katılıyorum.', 'برای نخستین بار در این برنامه شرکت می‌کنم.', 'بو اِتکینلییِه ایلک کِز کاتیلییوروم', 'etkinlik', 'برنامه / رویداد', 'ilk kez + فعل = برای نخستین بار ...'),
      trSentence('tr5-02', 'Ben Meryem, Deniz’in üniversiteden arkadaşıyım.', 'من مریم هستم، دوست دنیز از دانشگاه.', 'بِن مِریِم، دِنیزین اونیوِرسیتِدِن آرکاداشیییم', 'üniversiteden', 'از دانشگاه', 'اسم + -den/-dan = از ...'),
      trSentence('tr5-03', 'Siz de Deniz’i tanıyor musunuz?', 'شما هم دنیز را می‌شناسید؟', 'سیز دِه دِنیزی تانییور موسونوز', 'tanımak', 'شناختن', 'فعل + -yor + mu + پسوند شخصی = آیا ...؟'),
      trSentence('tr5-04', 'Bu akşam tek başıma geldim.', 'امشب تنها آمدم.', 'بو آکشام تِک باشیما گِلدیم', 'tek başıma', 'تنها', 'tek başıma = به‌تنهایی'),
      trSentence('tr5-05', 'Yeni bir işte çalışmaya başladım.', 'کار در یک محل کار جدید را شروع کردم.', 'یِنی بیر ایشتِه چالیشمایا باشلادیم', 'başlamak', 'شروع کردن', 'فعل + -maya/-meye başlamak = شروع به ... کردن'),
      trSentence('tr5-06', 'Bu mahallede yeniyim.', 'در این محله تازه‌وارد هستم.', 'بو ماهالِلِدِه یِنیییم', 'mahalle', 'محله', 'مکان + -de/-da = در ...؛ yeni + -yim = تازه‌وارد هستم'),
      trSentence('tr5-07', 'Bu etkinlikte kimi tanıyorsunuz?', 'در این برنامه چه کسی را می‌شناسید؟', 'بو اِتکینلیکتِه کیمی تانییورسونوز', 'kimi', 'چه کسی را', 'kimi = چه کسی را (مفعول)'),
      trSentence('tr5-08', 'Sohbetiniz için teşekkür ederim.', 'از گفت‌وگویتان ممنونم.', 'سوهبِتینیز ایچین تشکّور اِدِریم', 'sohbet', 'گفت‌وگو', 'اسم + için = برای / بابت ...'),
    ],
    [
      { speaker: 'مریم', text: 'Bu etkinliğe ilk kez katılıyorum. Siz de Deniz’i tanıyor musunuz?', fa: 'برای نخستین بار در این برنامه شرکت می‌کنم. شما هم دنیز را می‌شناسید؟' },
      { speaker: 'علی', text: 'Evet, aynı üniversitede okuduk. Ben Ali.', fa: 'بله، در یک دانشگاه درس خواندیم. من علی هستم.' },
      { speaker: 'مریم', text: 'Memnun oldum. Bu akşam tek başıma geldim.', fa: 'خوشوقتم. امشب تنها آمدم.' },
      { speaker: 'علی', text: 'Ben de birkaç arkadaşımı tanıştırayım.', fa: 'من هم چند نفر از دوستانم را معرفی کنم.' },
      { speaker: 'مریم', text: 'Sohbetiniz için teşekkür ederim.', fa: 'از گفت‌وگویتان ممنونم.' },
    ],
    [
      {
        promptFa: '«برای نخستین بار در این برنامه شرکت می‌کنم» کدام است؟',
        choices: ['Bu etkinliğe ilk kez katılıyorum.', 'Bu etkinlikten erken çıkıyorum.', 'Bu etkinlik çok kısa.'],
        correctIndex: 0,
        explanationFa: 'ilk kez katılıyorum یعنی «برای نخستین بار شرکت می‌کنم».',
      },
      {
        promptFa: 'کدام پسوند معمولاً معنی «از» می‌دهد؟',
        choices: ['-de/-da', '-den/-dan', '-e/-a'],
        correctIndex: 1,
        explanationFa: 'دانشگاه + -den می‌شود üniversiteden؛ یعنی «از دانشگاه».',
      },
    ],
    'برای آشنایی در جمع، نام و رابطه‌تان را کوتاه بگویید و با پرسش ساده گفت‌وگو را ادامه دهید. پسوند -den/-dan مبدأ یا خاستگاه را می‌رساند؛ örnek: üniversiteden (از دانشگاه).',
  ),

  trLesson(
    'tr-survival-02-travel-tourism',
    'سفر و اطلاعات گردشگری',
    'در سفر دربارهٔ دیدنی‌ها، ساعت بازدید، راهنمای تور و خدمات گردشگری سؤال می‌کنید.',
    [
      trSentence('tr5-09', 'Şehrin tarihi merkezi hangi yönde?', 'مرکز تاریخی شهر در کدام سمت است؟', 'شِهرین تاریخی مِرکِزی هانگی یونده', 'tarihi merkez', 'مرکز تاریخی', 'جهت + -de/-da = در ...'),
      trSentence('tr5-10', 'Bu müze pazartesi günleri kapalı.', 'این موزه دوشنبه‌ها تعطیل است.', 'بو موزِه پازارتِسی گونلِری کاپالی', 'kapalı', 'بسته / تعطیل', 'اسم + -lı/-li = دارای حالت ...'),
      trSentence('tr5-11', 'Giriş ücreti öğrenci için daha ucuz.', 'هزینهٔ ورودی برای دانشجو ارزان‌تر است.', 'گیریش اوجرِتی اویرِنجی ایچین داها اوجوز', 'giriş ücreti', 'هزینهٔ ورودی', 'kişi + için = برای ...'),
      trSentence('tr5-12', 'Rehberli tur saat ikide başlıyor.', 'تور همراه راهنما ساعت دو شروع می‌شود.', 'رِهبِرلی تور ساعت ایکیدِه باشلییور', 'rehberli tur', 'تور با راهنما', 'ساعت + -de/-da = در ساعت ...'),
      trSentence('tr5-13', 'Yakında eski bir cami var mı?', 'نزدیک اینجا مسجد قدیمی هست؟', 'یاکیندا اِسکی بیر جامی وار می', 'cami', 'مسجد', 'var mı? = آیا ... هست؟'),
      trSentence('tr5-14', 'Bu meydanda fotoğraf çekebilirsiniz.', 'در این میدان می‌توانید عکس بگیرید.', 'بو مِیداندا فوتوغراف چِکِبیلی‌رسینیز', 'meydan', 'میدان', 'فعل + -ebilir = می‌توانید ...'),
      trSentence('tr5-15', 'Kıyı boyunca yürüyüş yolu var.', 'در امتداد ساحل مسیر پیاده‌روی وجود دارد.', 'کییی بویونجا یورویوش یولو وار', 'boyunca', 'در امتداد', 'اسم + boyunca = در امتداد ...'),
      trSentence('tr5-16', 'Şehir turu için nereden bilgi alabilirim?', 'برای گشت شهری از کجا می‌توانم اطلاعات بگیرم؟', 'شِهیر تورو ایچین نِرِدِن بیلگی آلابیلیرم', 'bilgi almak', 'اطلاعات گرفتن', 'nereden + فعل توانستن = از کجا می‌توانم ...؟'),
    ],
    [
      { speaker: 'گردشگر', text: 'Şehir turu için nereden bilgi alabilirim?', fa: 'برای گشت شهری از کجا می‌توانم اطلاعات بگیرم؟' },
      { speaker: 'کارمند', text: 'Danışma masası girişin yanında.', fa: 'میز اطلاعات کنار ورودی است.' },
      { speaker: 'گردشگر', text: 'Rehberli tur saat kaçta başlıyor?', fa: 'تور همراه راهنما چه ساعتی شروع می‌شود؟' },
      { speaker: 'کارمند', text: 'Saat ikide başlıyor. Bu müze pazartesi günleri kapalı.', fa: 'ساعت دو شروع می‌شود. این موزه دوشنبه‌ها تعطیل است.' },
      { speaker: 'گردشگر', text: 'Teşekkürler, önce meydana gideceğim.', fa: 'ممنون، اول به میدان می‌روم.' },
    ],
    [
      {
        promptFa: '«تور همراه راهنما» کدام است؟',
        choices: ['rehberli tur', 'giriş ücreti', 'tarihi merkez'],
        correctIndex: 0,
        explanationFa: 'rehber = راهنما و rehberli tur = تور همراه راهنما.',
      },
      {
        promptFa: 'برای پرسیدن «از کجا؟» کدام واژه مناسب است؟',
        choices: ['nerede', 'nereden', 'nereye'],
        correctIndex: 1,
        explanationFa: 'nereden یعنی «از کجا؟»؛ nerede یعنی «کجا؟» و nereye یعنی «به کجا؟».',
      },
    ],
    'در گردشگری، دربارهٔ مسیر، ساعت بازدید، هزینه و خدمات سؤال کنید. «nerede» مکان ثابت، «nereye» مقصد و «nereden» مبدأ را می‌پرسد. برای توانایی یا اجازهٔ مؤدبانه می‌توانید از -abilir/-ebilir استفاده کنید.',
  ),

  trLesson(
    'tr-survival-03-tickets-departures',
    'خرید بلیت و پرسیدن ساعت حرکت',
    'برای سفر بلیت می‌خرید، زمان و سکوی حرکت را می‌پرسید و وضعیت تأخیر را می‌فهمید.',
    [
      trSentence('tr5-17', 'İzmir’e bir tren bileti istiyorum.', 'یک بلیت قطار به ازمیر می‌خواهم.', 'ایزمیرِه بیر تِرِن بیلِتی ایستییوروم', 'tren bileti', 'بلیت قطار', 'مقصد + -e/-a = به ...'),
      trSentence('tr5-18', 'Gidiş-dönüş bileti alabilir miyim?', 'می‌توانم بلیت رفت‌وبرگشت بگیرم؟', 'گیدیش دونوش بیلِتی آلابیلیر می‌ییم', 'gidiş-dönüş', 'رفت‌وبرگشت', 'gidiş-dönüş bileti = بلیت رفت‌وبرگشت؛ alabilir miyim? = می‌توانم بگیرم؟'),
      trSentence('tr5-19', 'Tren saat kaçta kalkıyor?', 'قطار ساعت چند حرکت می‌کند؟', 'تِرِن ساعت کاچتا کالکییور', 'kalkmak', 'حرکت کردن / راه افتادن', 'ساعت + -ta/-te = در ساعت ...'),
      trSentence('tr5-20', 'Tren hangi perondan kalkıyor?', 'قطار از کدام سکو حرکت می‌کند؟', 'تِرِن هانگی پِرون‌دان کالکییور', 'peron', 'سکو', 'مبدأ + -dan/-den = از ...'),
      trSentence('tr5-21', 'Pencere kenarında iki koltuk var mı?', 'دو صندلی کنار پنجره هست؟', 'پِنجِرِه کِنارِندا ایکی کولتوق وار می', 'koltuk', 'صندلی', 'مکان + -da/-de = در ...؛ var mı? = هست؟'),
      trSentence('tr5-22', 'Biletin toplam fiyatı kaç lira?', 'قیمت کل بلیت چند لیر است؟', 'بیلِتین توپلام فی‌یاتی کاچ لیرا', 'fiyat', 'قیمت', 'اسم + -in و اسم + -ı = ترکیب مالکیت؛ toplam fiyat = قیمت کل'),
      trSentence('tr5-23', 'Tren on dakika gecikecek.', 'قطار ده دقیقه تأخیر خواهد داشت.', 'تِرِن اون داکیکا گِجیکِجِک', 'gecikmek', 'تأخیر داشتن', 'فعل + -ecek/-acak = آینده'),
      trSentence('tr5-24', 'Biletimi kontrol eder misiniz?', 'بلیت مرا بررسی می‌کنید؟', 'بیلِتیمی کونترول اِدِر میسینیز', 'kontrol etmek', 'بررسی کردن', 'فعل + -er misiniz? = مؤدبانه می‌کنید؟'),
    ],
    [
      { speaker: 'مسافر', text: 'İzmir’e bir tren bileti istiyorum.', fa: 'یک بلیت قطار به ازمیر می‌خواهم.' },
      { speaker: 'کارمند', text: 'Tek yön mü, gidiş dönüş mü?', fa: 'یک‌طرفه یا رفت‌وبرگشت؟' },
      { speaker: 'مسافر', text: 'Gidiş-dönüş bileti alabilir miyim? Tren saat kaçta kalkıyor?', fa: 'می‌توانم بلیت رفت‌وبرگشت بگیرم؟ قطار ساعت چند حرکت می‌کند؟' },
      { speaker: 'کارمند', text: 'Saat dörtte kalkıyor, üçüncü perondan.', fa: 'ساعت چهار از سکوی سوم حرکت می‌کند.' },
      { speaker: 'مسافر', text: 'Teşekkürler. Biletimi kontrol eder misiniz?', fa: 'ممنون. بلیتم را بررسی می‌کنید؟' },
    ],
    [
      {
        promptFa: 'برای پرسیدن ساعت حرکت قطار کدام جمله درست است؟',
        choices: ['Tren saat kaçta kalkıyor?', 'Tren hangi şehirde?', 'Tren ne kadar büyük?'],
        correctIndex: 0,
        explanationFa: 'saat kaçta = ساعت چند؛ kalkıyor = حرکت می‌کند.',
      },
      {
        promptFa: '«بلیت رفت‌وبرگشت» چه می‌شود؟',
        choices: ['gidiş-dönüş bileti', 'tren peronu', 'pencere kenarı'],
        correctIndex: 0,
        explanationFa: 'gidiş dönüş یعنی رفت‌وبرگشت.',
      },
    ],
    'برای حرکت از kalkmak استفاده کنید: Tren saat dörtte kalkıyor (قطار ساعت چهار حرکت می‌کند). پسوند -ta/-te زمان را مشخص می‌کند؛ پسوند -dan/-den مبدأ را نشان می‌دهد: üçüncü perondan (از سکوی سوم).',
  ),

  trLesson(
    'tr-survival-04-market-conversation',
    'مکالمه در فروشگاه و بازار',
    'در بازار یا فروشگاه دربارهٔ تازگی کالا، مقدار، بسته‌بندی و پرداخت صحبت می‌کنید.',
    [
      trSentence('tr5-25', 'Pazarda taze domates arıyorum.', 'در بازار دنبال گوجه‌فرنگی تازه می‌گردم.', 'پازاردا تازِه دوماتِس آرییوروم', 'taze', 'تازه', 'مکان + -da/-de = در ...'),
      trSentence('tr5-26', 'Bir kilo elma alabilir miyim?', 'می‌توانم یک کیلو سیب بگیرم؟', 'بیر کیلو اِلما آلابیلیر می‌ییم', 'bir kilo', 'یک کیلو', 'مقدار + اسم کالا'),
      trSentence('tr5-27', 'Bunlar yerli ürünler mi?', 'این‌ها محصولات محلی هستند؟', 'بونلار یِرلی اورونلِر می', 'yerli', 'محلی', 'اسم + -ler/-lar = جمع؛ پرسش بله/خیر با mı/mi/mu/mü'),
      trSentence('tr5-28', 'Yarım kilo yeterli.', 'نیم کیلو کافی است.', 'یاریم کیلو یِتِرلی', 'yarım', 'نیم', 'yarım kilo = نیم کیلو'),
      trSentence('tr5-29', 'Başka renkleri de var mı?', 'رنگ‌های دیگری هم دارد؟', 'باشکا رِنکلِری دِه وار می', 'başka', 'دیگر', 'başka + اسم = اسمِ دیگر'),
      trSentence('tr5-30', 'Hepsini bu torbaya koyar mısınız?', 'همه را در این کیسه می‌گذارید؟', 'هِپسینی بو توربایا کویار میسینیز', 'torba', 'کیسه', 'مفعول + -ı/-i و مقصد + -a/-e'),
      trSentence('tr5-31', 'Nakit ödeyeceğim.', 'نقدی پرداخت می‌کنم.', 'ناکیت اودِیِجِییم', 'nakit', 'نقد', 'فعل + -ecek/-acak = آینده'),
      trSentence('tr5-32', 'Tezgâhın yanında sıra var mı?', 'کنار غرفه صف هست؟', 'تِزگاهین یانیندا سیرا وار می', 'tezgâh', 'پیشخوان / غرفه', 'اسم + yanında = کنارِ ...'),
    ],
    [
      { speaker: 'مشتری', text: 'Pazarda taze domates arıyorum. Bir kilo alabilir miyim?', fa: 'در بازار دنبال گوجه‌فرنگی تازه می‌گردم. می‌توانم یک کیلو بگیرم؟' },
      { speaker: 'فروشنده', text: 'Tabii. Bunlar bugün geldi.', fa: 'البته. این‌ها امروز رسیده‌اند.' },
      { speaker: 'مشتری', text: 'Yarım kilo yeterli. Hepsini bu torbaya koyar mısınız?', fa: 'نیم کیلو کافی است. همه را در این کیسه می‌گذارید؟' },
      { speaker: 'فروشنده', text: 'Elbette. Başka bir şey ister misiniz?', fa: 'حتماً. چیز دیگری می‌خواهید؟' },
      { speaker: 'مشتری', text: 'Hayır, nakit ödeyeceğim.', fa: 'نه، نقدی پرداخت می‌کنم.' },
    ],
    [
      {
        promptFa: 'برای درخواست مقدار «نیم کیلو» کدام عبارت درست است؟',
        choices: ['yarım kilo', 'bir litre', 'iki tane'],
        correctIndex: 0,
        explanationFa: 'yarım یعنی نیم و kilo یعنی کیلو.',
      },
      {
        promptFa: '«نقدی پرداخت می‌کنم» کدام است؟',
        choices: ['Nakit ödeyeceğim.', 'Kartımı arıyorum.', 'Torbayı açıyorum.'],
        correctIndex: 0,
        explanationFa: 'nakit = نقد؛ ödeyeceğim = پرداخت خواهم کرد / می‌کنم.',
      },
    ],
    'برای خرید روزمره مقدار را با واحد بگویید: yarım kilo (نیم کیلو)، bir litre (یک لیتر). درخواست مؤدبانه با -ar/-er mısınız ساخته می‌شود؛ koyar mısınız? یعنی «می‌گذارید؟».',
  ),

  trLesson(
    'tr-survival-05-help-and-problems',
    'درخواست کمک و بیان مشکل',
    'وقتی گم می‌شوید، وسیله‌ای را جا می‌گذارید یا برای حل مشکلی کمک لازم دارید، روشن و مؤدبانه درخواست می‌کنید.',
    [
      trSentence('tr5-33', 'Yolumu kaybettim.', 'راهم را گم کرده‌ام.', 'یولومو کایبِتیم', 'yolunu kaybetmek', 'راه را گم کردن', 'مفعول + -u/-ü kaybetmek = چیزی را گم کردن'),
      trSentence('tr5-34', 'Telefonumun şarjı bitti.', 'شارژ تلفنم تمام شد.', 'تِلِفونومون شارژی بیتّی', 'şarj', 'شارژ', 'اسم + -un/-ün = مالکیت؛ bitmek = تمام شدن'),
      trSentence('tr5-35', 'Çantamı otobüste unuttum.', 'کیفم را در اتوبوس جا گذاشتم.', 'چانتامی اوتوبوس‌تِه اونوتّوم', 'unutmak', 'فراموش کردن / جا گذاشتن', 'مکان + -te/-ta = در ...'),
      trSentence('tr5-36', 'Bu sorunu nasıl çözebilirim?', 'چطور می‌توانم این مشکل را حل کنم؟', 'بو سورونو ناصیل چوزِبیلیریم', 'sorun', 'مشکل', 'فعل + -ebilir = می‌توانم ...'),
      trSentence('tr5-37', 'Bana biraz yardımcı olur musunuz?', 'کمی به من کمک می‌کنید؟', 'بانا بیرآز یاردیمجی اولور موسونوز', 'yardımcı olmak', 'کمک کردن', 'olur musunuz? = می‌شوید؟ (درخواست مؤدبانه)'),
      trSentence('tr5-38', 'Lütfen güvenlik görevlisini çağırın.', 'لطفاً مأمور حراست را صدا کنید.', 'لوتفِن گووِنلیک گورِولیسینی چاغیرین', 'güvenlik görevlisi', 'مأمور حراست', 'فعل امر مؤدبانه با -ın/-in'),
      trSentence('tr5-39', 'Kayıp eşya bürosu nerede?', 'بخش اشیای گمشده کجاست؟', 'کایِپ اِشیا بورو‌سو نِرِده', 'kayıp eşya', 'اشیای گمشده', 'nerede? = کجاست؟'),
      trSentence('tr5-40', 'Bir dakika bekler misiniz?', 'یک دقیقه صبر می‌کنید؟', 'بیر داکیکا بِکلِر میسینیز', 'beklemek', 'صبر کردن', 'فعل + -er misiniz? = مؤدبانه می‌کنید؟'),
    ],
    [
      { speaker: 'مریم', text: 'Affedersiniz, çantamı otobüste unuttum.', fa: 'ببخشید، کیفم را در اتوبوس جا گذاشتم.' },
      { speaker: 'کارمند', text: 'Ne zaman fark ettiniz?', fa: 'چه زمانی متوجه شدید؟' },
      { speaker: 'مریم', text: 'Az önce. Kayıp eşya bürosu nerede?', fa: 'همین چند لحظه پیش. بخش اشیای گمشده کجاست؟' },
      { speaker: 'کارمند', text: 'Girişin yanında. Bir dakika bekler misiniz?', fa: 'کنار ورودی است. یک دقیقه صبر می‌کنید؟' },
      { speaker: 'مریم', text: 'Tabii, çok teşekkür ederim.', fa: 'حتماً، خیلی ممنونم.' },
    ],
    [
      {
        promptFa: 'برای گفتن «کیفم را در اتوبوس جا گذاشتم» کدام جمله درست است؟',
        choices: ['Çantamı otobüste unuttum.', 'Çantamı pazardan aldım.', 'Çantam otobüse gidiyor.'],
        correctIndex: 0,
        explanationFa: 'çantamı = کیفم را؛ otobüste = در اتوبوس؛ unuttum = جا گذاشتم.',
      },
      {
        promptFa: 'کدام جمله درخواست مؤدبانهٔ کمک است؟',
        choices: ['Bana biraz yardımcı olur musunuz?', 'Yardım nerede?', 'Ben yardım değilim.'],
        correctIndex: 0,
        explanationFa: 'olur musunuz? پرسش مؤدبانه‌ای برای درخواست کمک است.',
      },
    ],
    'برای شرح مشکل، اول اتفاق را با گذشتهٔ ساده بیان کنید: unuttum (جا گذاشتم). سپس درخواست را مؤدبانه بسازید: yardımcı olur musunuz? (کمک می‌کنید؟). اگر خطر فوری وجود دارد از کارکنان محل یا خدمات امدادی کمک بخواهید.',
  ),

  trLesson(
    'tr-survival-06-work-and-school',
    'مکالمه‌های ساده در محل کار و تحصیل',
    'در محیط کار یا کلاس دربارهٔ ساعت شروع، محل جلسه، تکلیف و برنامهٔ روزانه صحبت می‌کنید.',
    [
      trSentence('tr5-41', 'İşe sabah dokuzda başlıyorum.', 'صبح ساعت نه کارم را شروع می‌کنم.', 'ایشِه ساباح دوقوزدا باشلییوروم', 'işe başlamak', 'کار را شروع کردن', 'زمان + -da/-de = در ساعت ...'),
      trSentence('tr5-42', 'Toplantı hangi odada?', 'جلسه در کدام اتاق است؟', 'توپلانتی هانگی اودادا', 'toplantı', 'جلسه', 'hangi + اسم + -da/-de = در کدام ...؟'),
      trSentence('tr5-43', 'Ders programını nereden bulabilirim?', 'برنامهٔ کلاس را از کجا می‌توانم پیدا کنم؟', 'دِرس پروگرامینِ نِرِدِن بولابیلیرم', 'ders programı', 'برنامهٔ درسی', 'nereden bulabilirim? = از کجا می‌توانم پیدا کنم؟'),
      trSentence('tr5-44', 'Ödevimi evde unuttum.', 'تکلیفم را در خانه جا گذاشتم.', 'اودِویمی اِودِه اونوتّوم', 'ödev', 'تکلیف', 'اسم + -im = مال من؛ -i = مفعول'),
      trSentence('tr5-45', 'Bu formu bugün doldurmam gerekiyor.', 'باید امروز این فرم را پر کنم.', 'بو فورمو بوگون دولدورمام گِرِکییور', 'form', 'فرم', 'فعل مصدر + gerekiyor = لازم است انجام دهم'),
      trSentence('tr5-46', 'Müdürle kısa bir görüşme yapacağım.', 'یک گفت‌وگوی کوتاه با مدیر خواهم داشت.', 'مودورلِه کیسا بیر گوروشمِه یاپاجاغیم', 'görüşme', 'گفت‌وگو / جلسه', 'با شخص + -le/-la؛ فعل + -acak/-ecek = آینده'),
      trSentence('tr5-47', 'İş arkadaşım bugün izinli.', 'همکارم امروز مرخصی است.', 'ایش آرکاداشیم بوگون ایزینلی', 'izinli', 'مرخصی / دارای اجازه', 'اسم + -li/-lı = دارای ...'),
      trSentence('tr5-48', 'Dersten sonra kütüphanede çalışacağım.', 'بعد از کلاس در کتابخانه درس خواهم خواند.', 'دِرستِن سونرا کوتوهانِدِه چالیشاجاغیم', 'kütüphane', 'کتابخانه', 'بعد از + اسم؛ آیندهٔ فعل با -acak/-ecek'),
    ],
    [
      { speaker: 'دانشجو', text: 'Ders programını nereden bulabilirim?', fa: 'برنامهٔ کلاس را از کجا می‌توانم پیدا کنم؟' },
      { speaker: 'همکار', text: 'Okulun internet sayfasında var.', fa: 'در صفحهٔ اینترنتی مدرسه هست.' },
      { speaker: 'دانشجو', text: 'Bugünkü toplantı hangi odada?', fa: 'جلسهٔ امروز در کدام اتاق است؟' },
      { speaker: 'همکار', text: 'İkinci katta, toplantı odasında.', fa: 'طبقهٔ دوم، در اتاق جلسه.' },
      { speaker: 'دانشجو', text: 'Teşekkürler. Dersten sonra kütüphanede çalışacağım.', fa: 'ممنون. بعد از کلاس در کتابخانه درس می‌خوانم.' },
    ],
    [
      {
        promptFa: '«تکلیفم را در خانه جا گذاشتم» کدام است؟',
        choices: ['Ödevimi evde unuttum.', 'Ödevimi sınıfta yazıyorum.', 'Ödevimi yarın alacağım.'],
        correctIndex: 0,
        explanationFa: 'ödevimi = تکلیفم را؛ evde = در خانه؛ unuttum = جا گذاشتم.',
      },
      {
        promptFa: 'برای گفتن «باید فرم را پر کنم» کدام ساختار درست است؟',
        choices: ['formu doldurmam gerekiyor', 'formu dolduruyorum mu', 'formu doldurmakta'],
        correctIndex: 0,
        explanationFa: 'مصدر + پسوند شخصی + gerekiyor بیانگر ضرورت است.',
      },
    ],
    'در محیط کار و تحصیل، برای برنامه و مکان از کجا/کدام سؤال کنید: nereden (از کجا)، hangi odada (در کدام اتاق). ضرورت با «مصدر + پسوند شخصی + gerekiyor» می‌آید: doldurmam gerekiyor (باید پر کنم).',
  ),

  trLesson(
    'tr-survival-07-weather',
    'صحبت دربارهٔ آب‌وهوا',
    'وضعیت فعلی و پیش‌بینی هوا را می‌پرسید و برای باران، باد یا سرما برنامه‌ریزی می‌کنید.',
    [
      trSentence('tr5-49', 'Bugün hava güneşli.', 'امروز هوا آفتابی است.', 'بوگون هَوا گونِشلی', 'güneşli', 'آفتابی', 'اسم + -li/-lı = دارای ...'),
      trSentence('tr5-50', 'Yarın yağmur yağacak mı?', 'فردا باران خواهد بارید؟', 'یارین یاغمور یاغاجاک می', 'yağmur', 'باران', 'فعل آیندهٔ -acak/-ecek + پرسش mı/mi'),
      trSentence('tr5-51', 'Dışarıda çok rüzgâr var.', 'بیرون باد زیادی می‌آید.', 'دیشاریدا چوک روزگار وار', 'rüzgâr', 'باد', 'مکان + -da/-de = در ...'),
      trSentence('tr5-52', 'Yanıma bir şemsiye alacağım.', 'یک چتر همراهم برمی‌دارم.', 'یانیمِه بیر شِمسییِه آلاجاغیم', 'şemsiye', 'چتر', 'مقصد/همراه + -a/-e؛ آینده با -acak/-ecek'),
      trSentence('tr5-53', 'Hava soğuk, montumu giyiyorum.', 'هوا سرد است، کتم را می‌پوشم.', 'هَوا سوغوک، مونتومو گیییوروم', 'mont', 'کت', 'مفعول + -ı/-i؛ giy-iyor = می‌پوشم'),
      trSentence('tr5-54', 'Akşam sıcaklık on derece olacak.', 'عصر دما ده درجه خواهد بود.', 'آکشام سیجاکلیک اون دِرِجِه اولاجاک', 'sıcaklık', 'دما', 'اسم + -lık/-lik = حالت یا مفهوم؛ آینده با olacak'),
      trSentence('tr5-55', 'Kar ne zaman yağacak?', 'برف چه زمانی خواهد بارید؟', 'کار نِه زامان یاغاجاک', 'kar', 'برف', 'ne zaman = چه زمانی؛ فعل yağmak در آیندهٔ ساده'),
      trSentence('tr5-56', 'Hafta sonu hava açık olacak.', 'آخر هفته هوا صاف خواهد بود.', 'هافتا سونو هَوا آچیک اولاجاک', 'açık', 'صاف / باز', 'sıfat + olacak = ... خواهد بود'),
    ],
    [
      { speaker: 'علی', text: 'Yarın yağmur yağacak mı?', fa: 'فردا باران خواهد بارید؟' },
      { speaker: 'مریم', text: 'Sabah güneşli olacak ama akşam rüzgâr çıkacak.', fa: 'صبح آفتابی خواهد بود، اما عصر باد می‌آید.' },
      { speaker: 'علی', text: 'O zaman yanıma bir şemsiye alacağım.', fa: 'پس یک چتر همراهم برمی‌دارم.' },
      { speaker: 'مریم', text: 'İyi fikir. Hava akşam çok soğuk olacak.', fa: 'فکر خوبی است. عصر هوا خیلی سرد خواهد بود.' },
      { speaker: 'علی', text: 'Montumu da giyerim.', fa: 'کتم را هم می‌پوشم.' },
    ],
    [
      {
        promptFa: '«آفتابی» به ترکی چه می‌شود؟',
        choices: ['güneşli', 'rüzgârlı', 'yağmurlu'],
        correctIndex: 0,
        explanationFa: 'güneş = خورشید؛ güneşli = آفتابی.',
      },
      {
        promptFa: 'برای پیش‌بینی آینده کدام پسوند به کار می‌رود؟',
        choices: ['-acak/-ecek', '-yor', '-miş'],
        correctIndex: 0,
        explanationFa: 'yağacak و olacak با -acak/-ecek آینده را بیان می‌کنند.',
      },
    ],
    'برای وضعیت هوا از ساختارهای کوتاه استفاده کنید: hava güneşli (هوا آفتابی است)، rüzgâr var (باد هست). پیش‌بینی آینده معمولاً با -acak/-ecek ساخته می‌شود و پرسش بله/خیر با mı/mi/mu/mü می‌آید.',
  ),

  trLesson(
    'tr-survival-08-phone-and-messages',
    'تماس تلفنی و پیام‌های کوتاه',
    'در تماس کوتاه زمان مناسب را می‌پرسید، پیام می‌فرستید و قرار یا نشانی را هماهنگ می‌کنید.',
    [
      trSentence('tr5-57', 'Şu anda konuşabilir misiniz?', 'الان می‌توانید صحبت کنید؟', 'شو آندا کونوشابیلیر میسینیز', 'şu anda', 'در حال حاضر', 'فعل توانستن + پرسش مؤدبانه'),
      trSentence('tr5-58', 'Sizi biraz sonra arayacağım.', 'کمی بعد به شما زنگ می‌زنم.', 'سیزی بیرآز سونرا آرایاجاغیم', 'aramak', 'تماس گرفتن', 'مفعول + aramak؛ آینده با -acak/-ecek'),
      trSentence('tr5-59', 'Mesajınızı şimdi gördüm.', 'پیامتان را همین حالا دیدم.', 'مِساجینیزی شیمدی گوردوم', 'mesaj', 'پیام', 'اسم + مالکیت + حالت مفعولی -ı/-i'),
      trSentence('tr5-60', 'Toplantı saatini bana yazar mısınız?', 'ساعت جلسه را برایم می‌نویسید؟', 'توپلانتی ساعتینی بانا یازار میسینیز', 'yazmak', 'نوشتن', 'فعل + -ar mısınız? = درخواست مؤدبانه'),
      trSentence('tr5-61', 'Telefonum sessizdeydi, aramanızı duymadım.', 'تلفنم بی‌صدا بود، تماستان را نشنیدم.', 'تِلِفونوم سِس‌سیزدِی، آرَمانیزی دوی‌مادیم', 'sessiz', 'بی‌صدا', 'گذشتهٔ اسمی؛ فعل منفی گذشته با -madım/-medim'),
      trSentence('tr5-62', 'Bana konum gönderir misin?', 'موقعیت مکانی را برایم می‌فرستی؟', 'بانا کونوم گوندِریر میسین', 'konum', 'موقعیت مکانی', 'فعل عادت/درخواست + misin?'),
      trSentence('tr5-63', 'Bir dakika içinde seni arayacağım.', 'تا یک دقیقهٔ دیگر به تو زنگ می‌زنم.', 'بیر داکیکا ایچینده سِنی آرایاجاغیم', 'içinde', 'در مدت / ظرف', 'مدت + içinde = در عرض ...؛ فعل آینده با -acak/-ecek'),
      trSentence('tr5-64', 'Lütfen adresi kısa mesajla gönderin.', 'لطفاً نشانی را با پیامک بفرستید.', 'لوتفِن آدرِسی کیسا مِساجلا گوندِرین', 'kısa mesaj', 'پیامک', 'وسیله + -la/-le = با ...'),
    ],
    [
      { speaker: 'علی', text: 'Şu anda konuşabilir misin?', fa: 'الان می‌توانی صحبت کنی؟' },
      { speaker: 'مریم', text: 'Toplantıdayım. Mesajını gördüm.', fa: 'در جلسه‌ام. پیامت را دیدم.' },
      { speaker: 'علی', text: 'Bana konum gönderir misin?', fa: 'موقعیت مکانی را برایم می‌فرستی؟' },
      { speaker: 'مریم', text: 'Tabii, adresi kısa mesajla gönderiyorum.', fa: 'حتماً، نشانی را با پیامک می‌فرستم.' },
      { speaker: 'علی', text: 'Teşekkürler. Bir dakika içinde seni arayacağım.', fa: 'ممنون. تا یک دقیقهٔ دیگر به تو زنگ می‌زنم.' },
    ],
    [
      {
        promptFa: 'برای درخواست «موقعیت را برایم می‌فرستی؟» کدام جمله درست است؟',
        choices: ['Bana konum gönderir misin?', 'Bana konumda mısın?', 'Konumum çok kısa.'],
        correctIndex: 0,
        explanationFa: 'konum gönderir misin? یعنی «موقعیت را می‌فرستی؟».',
      },
      {
        promptFa: '«با پیامک» در ترکی چه می‌شود؟',
        choices: ['kısa mesajla', 'bir dakika içinde', 'şu anda'],
        correctIndex: 0,
        explanationFa: 'پسوند -la/-le معنی «با» می‌دهد: kısa mesajla = با پیامک.',
      },
    ],
    'در تماس و پیام کوتاه، فعل‌های روزمره را به کار ببرید: aramak (زنگ زدن)، yazmak (نوشتن)، göndermek (فرستادن). برای درخواست مؤدبانه از -ar/-er mısınız، و برای زمان مشخص از şu anda (الان) یا biraz sonra (کمی بعد) استفاده کنید.',
  ),

  trLesson(
    'tr-survival-09-invitations',
    'دعوت‌کردن، پذیرفتن و ردکردن دعوت',
    'برای دیدار یا جشن کسی را دعوت می‌کنید، پاسخ مثبت یا منفی می‌دهید و زمان دیگری پیشنهاد می‌کنید.',
    [
      trSentence('tr5-65', 'Cumartesi akşamı bize gelir misin?', 'شنبه‌شب به خانهٔ ما می‌آیی؟', 'جومارتِسی آکشامی بیزِه گِلیر میسین', 'cumartesi akşamı', 'شنبه‌شب', 'مقصد + -e/-a؛ gelir misin? = می‌آیی؟'),
      trSentence('tr5-66', 'Doğum günümü evde kutlayacağım.', 'تولدِم را در خانه جشن می‌گیرم.', 'دوغوم گونومو اِودِه کوت‌لایاجاغیم', 'doğum günü', 'تولد', 'مفعول + -ı/-i؛ آینده با -acak/-ecek'),
      trSentence('tr5-67', 'Davetin için çok teşekkür ederim.', 'برای دعوتت خیلی ممنونم.', 'داوِتین ایچین چوک تشکّور اِدِریم', 'davet', 'دعوت', 'اسم + مالکیت؛ için = برای / بابت'),
      trSentence('tr5-68', 'Memnuniyetle gelirim.', 'با کمال میل می‌آیم.', 'مِمنونی‌یِتلِه گِلیرم', 'memnuniyetle', 'با کمال میل', 'حالت قیدی با -le/-la = با ...'),
      trSentence('tr5-69', 'Maalesef o akşam müsait değilim.', 'متأسفانه آن شب وقت ندارم.', 'ماعالِسِف او آکشام موساییت دِییلیم', 'müsait', 'آزاد / وقت‌دار', 'صفت + değilim = نیستم'),
      trSentence('tr5-70', 'Pazar günü buluşsak olur mu?', 'اگر یکشنبه همدیگر را ببینیم اشکالی دارد؟', 'پازار گونو بولوشساک اولور مو', 'buluşmak', 'دیدار کردن', '-sak/-sek + olur mu? = اگر ... کنیم، می‌شود؟'),
      trSentence('tr5-71', 'Yanımda bir arkadaş getirebilir miyim?', 'می‌توانم یک دوست را همراهم بیاورم؟', 'یانیمدا بیر آرکاداش گِتیرِبیلیر می‌ییم', 'getirmek', 'آوردن', 'فعل توانستن + پرسش اجازه'),
      trSentence('tr5-72', 'Saat yedide orada olurum.', 'ساعت هفت آنجا خواهم بود.', 'ساعت یِدیدِه اورادا اولوروم', 'orada', 'آنجا', 'زمان + -de/-da؛ orada = آنجا'),
    ],
    [
      { speaker: 'مریم', text: 'Cumartesi akşamı bize gelir misin?', fa: 'شنبه‌شب به خانهٔ ما می‌آیی؟' },
      { speaker: 'علی', text: 'Davetin için teşekkür ederim. Memnuniyetle gelirim.', fa: 'برای دعوتت ممنونم. با کمال میل می‌آیم.' },
      { speaker: 'مریم', text: 'Saat yedide başlayacağız.', fa: 'ساعت هفت شروع می‌کنیم.' },
      { speaker: 'علی', text: 'Yanımda bir arkadaş getirebilir miyim?', fa: 'می‌توانم یک دوست را همراهم بیاورم؟' },
      { speaker: 'مریم', text: 'Tabii, görüşürüz!', fa: 'حتماً، می‌بینمت!' },
    ],
    [
      {
        promptFa: 'برای پذیرفتن دعوت با اشتیاق کدام عبارت درست است؟',
        choices: ['Memnuniyetle gelirim.', 'Maalesef müsait değilim.', 'Davet ne zaman?'],
        correctIndex: 0,
        explanationFa: 'memnuniyetle gelirim یعنی «با کمال میل می‌آیم».',
      },
      {
        promptFa: 'کدام عبارت برای رد مؤدبانهٔ دعوت مناسب است؟',
        choices: ['Maalesef o akşam müsait değilim.', 'Ben orada oluyorum.', 'Davetin çok güzel.'],
        correctIndex: 0,
        explanationFa: 'maalesef (متأسفانه) + müsait değilim (وقت ندارم) پاسخ مؤدبانه‌ای است.',
      },
    ],
    'دعوت ساده با پرسش ساخته می‌شود: gelir misin? (می‌آیی؟). پاسخ مثبت: memnuniyetle (با کمال میل). برای رد محترمانه، اول maalesef (متأسفانه) بگویید و اگر ممکن است زمان جایگزین پیشنهاد کنید.',
  ),

  trLesson(
    'tr-survival-10-ability-and-inability',
    'بیان توانایی و ناتوانی',
    'می‌گویید چه کاری را بلد هستید یا از عهده‌اش برمی‌آیید و چه کاری برایتان ممکن نیست.',
    [
      trSentence('tr5-73', 'Biraz Türkçe konuşabiliyorum.', 'می‌توانم کمی ترکی صحبت کنم.', 'بیرآز تورکچه کونوشابیلییوروم', 'konuşabilmek', 'توانستنِ صحبت کردن', 'ریشه + -abil/-ebil + زمان حال = توانستن'),
      trSentence('tr5-74', 'Bu kelimeyi okuyabiliyorum.', 'می‌توانم این واژه را بخوانم.', 'بو کِلیمِیی اوکویابیلییوروم', 'okuyabilmek', 'توانستنِ خواندن', 'فعل + -yabil/-yebil = توانستن'),
      trSentence('tr5-75', 'Bisiklet sürebiliyor musun?', 'می‌توانی دوچرخه‌سواری کنی؟', 'بیسیکلِت سورِبیلیور موسون', 'bisiklet sürmek', 'دوچرخه‌سواری کردن', 'توانستن + mi/mı = آیا می‌توانی؟'),
      trSentence('tr5-76', 'Ben yüzemiyorum.', 'من نمی‌توانم شنا کنم.', 'بِن یوزِمییوروم', 'yüzememek', 'نتوانستنِ شنا کردن', 'فعل توانستن + منفی -me/-ma'),
      trSentence('tr5-77', 'Kardeşim piyano çalabiliyor.', 'خواهر/برادرم می‌تواند پیانو بنوازد.', 'کاردِشیم پیانو چالابیلیور', 'piyano çalmak', 'پیانو نواختن', 'فعل + -abil/-ebil = توانایی'),
      trSentence('tr5-78', 'Bu kapıyı tek başıma açamıyorum.', 'نمی‌توانم این در را به‌تنهایی باز کنم.', 'بو کاپییی تِک باشیما آچامییوروم', 'açamamak', 'نتوانستنِ باز کردن', 'ریشه + -a/-e + منفی حال استمراری'),
      trSentence('tr5-79', 'Bugün uzun süre kalamam.', 'امروز نمی‌توانم مدت زیادی بمانم.', 'بوگون اوزون سورِه کالامام', 'kalabilmek', 'توانستنِ ماندن', 'فعل توانستن در منفی گسترده: -amam/-emem'),
      trSentence('tr5-80', 'Birlikte daha hızlı yürüyebiliriz.', 'می‌توانیم با هم سریع‌تر راه برویم.', 'بیرلیکتِه داها هیزلی یورویِبیلیریز', 'yürüyebilmek', 'توانستنِ راه رفتن', 'فعل + -ebilir + پسوند جمع = می‌توانیم'),
    ],
    [
      { speaker: 'علی', text: 'Bisiklet sürebiliyor musun?', fa: 'می‌توانی دوچرخه‌سواری کنی؟' },
      { speaker: 'مریم', text: 'Evet, ama bugün uzun süre süremem.', fa: 'بله، اما امروز نمی‌توانم مدت زیادی دوچرخه‌سواری کنم.' },
      { speaker: 'علی', text: 'Yüzebiliyor musun?', fa: 'می‌توانی شنا کنی؟' },
      { speaker: 'مریم', text: 'Hayır, yüzemiyorum. Ama birlikte daha hızlı yürüyebiliriz.', fa: 'نه، نمی‌توانم شنا کنم. اما می‌توانیم با هم سریع‌تر راه برویم.' },
      { speaker: 'علی', text: 'Tamam, o zaman yürüyelim.', fa: 'باشه، پس پیاده برویم.' },
    ],
    [
      {
        promptFa: 'برای بیان توانایی «می‌توانم بخوانم» کدام پسوند به کار می‌رود؟',
        choices: ['-abil/-ebil', '-malı/-meli', '-miş'],
        correctIndex: 0,
        explanationFa: 'oku-y-abil-iyorum یعنی «می‌توانم بخوانم».',
      },
      {
        promptFa: '«من نمی‌توانم شنا کنم» کدام است؟',
        choices: ['Ben yüzemiyorum.', 'Ben yüzüyorum.', 'Ben yüzmeyi seviyorum.'],
        correctIndex: 0,
        explanationFa: 'yüzemiyorum = نمی‌توانم شنا کنم؛ yüzüyorum = دارم شنا می‌کنم.',
      },
    ],
    'توانایی با -abil/-ebil ساخته می‌شود: okuyabiliyorum (می‌توانم بخوانم). برای ناتوانی، فعل توانستن را منفی کنید: yüzemiyorum (نمی‌توانم شنا کنم)، açamıyorum (نمی‌توانم باز کنم). این ساختار را از درخواست مؤدبانه و اجازه‌گرفتن جدا کنید.',
  ),
];
