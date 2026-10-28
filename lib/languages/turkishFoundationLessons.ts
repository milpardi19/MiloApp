import type { LearningLesson } from './types';
import { trLesson, trSentence } from './turkishLessonKit';

/**
 * ده درس نخستِ مجموعهٔ اولیهٔ A1؛ جایگاه و ترتیب جاری هر درس در turkish.ts تعیین می‌شود.
 * شناسه‌ها و محتوای درس‌ها ثابت مانده‌اند تا پیشرفت قبلی زبان‌آموز حفظ شود.
 */
export const TURKISH_FOUNDATION_LESSONS_A: readonly LearningLesson[] = [
  trLesson(
    'tr-l1-01-greetings',
    'سلام و احوال‌پرسی',
    'کسی را می‌بینید و می‌خواهید سلام کنید، حالش را بپرسید و اسمتان را بگویید.',
    [
      trSentence('tr1-01', 'Merhaba!', 'سلام!', 'مِرهابا', 'merhaba', 'سلام', 'Merhaba! = سلام (در هر ساعتی از روز)'),
      trSentence('tr1-02', 'Günaydın.', 'صبح بخیر.', 'گون‌آیدِن', 'günaydın', 'صبح بخیر', 'gün (روز) + aydın (روشن) = صبح بخیر'),
      trSentence('tr1-03', 'İyi akşamlar.', 'عصر بخیر.', 'ایّی آکشاملار', 'akşam', 'عصر', 'iyi + اسم + -ler/-lar = ... بخیر'),
      trSentence('tr1-04', 'Nasılsın?', 'چطوری؟', 'ناصِلسِن', 'nasıl', 'چطور', 'nasıl + پسوند شخصی -sın = چطوری؟'),
      trSentence('tr1-05', 'İyiyim, teşekkürler.', 'خوبم، ممنون.', 'ایّی‌ییم، تشکّورلَر', 'teşekkürler', 'ممنون', 'iyi + y (میانجی) + -im = خوبم'),
      trSentence('tr1-06', 'Sen nasılsın?', 'تو چطوری؟', 'سِن ناصِلسِن', 'sen', 'تو', 'sen + nasıl + -sın = تو چطوری؟'),
      trSentence('tr1-07', 'Adın ne?', 'اسمت چیست؟', 'آدِن نِه', 'ad', 'اسم', 'ad + -ın (مالکیت «ـَت») + ne = اسمت چیست؟'),
      trSentence('tr1-08', 'Benim adım Meryem.', 'اسم من مریم است.', 'بِنیم آدِم مِریِم', 'benim', 'مالِ من', 'benim + ad + -ım = اسم من'),
    ],
    [
      { speaker: 'علی', text: 'Merhaba! Nasılsın?', fa: 'سلام! چطوری؟' },
      { speaker: 'مریم', text: 'İyiyim, teşekkürler. Sen nasılsın?', fa: 'خوبم، ممنون. تو چطوری؟' },
      { speaker: 'علی', text: 'Ben de iyiyim. Adın ne?', fa: 'من هم خوبم. اسمت چیست؟' },
      { speaker: 'مریم', text: 'Benim adım Meryem. Senin adın ne?', fa: 'اسم من مریم است. اسم تو چیست؟' },
    ],
    [
      {
        promptFa: 'برای سلام کردن در هر ساعتی از روز کدام واژه مناسب است؟',
        choices: ['Günaydın', 'Merhaba', 'İyi geceler'],
        correctIndex: 1,
        explanationFa: 'Merhaba در هر ساعتی درست است؛ Günaydın فقط صبح و İyi geceler شب بخیر است.',
      },
      {
        promptFa: 'کدام جمله یعنی «اسم من علی است»؟',
        choices: ['Adın ne?', 'Benim adım Ali.', 'Sen nasılsın?'],
        correctIndex: 1,
        explanationFa: 'Benim adım Ali یعنی «اسم من علی است».',
      },
    ],
    'در ترکی معمولاً ضمیر را می‌شود حذف کرد، چون شخص از پسوند فعل پیدا است: (Ben) iyiyim = خوبم. پسوند «ـیم» یعنی «هستم»، «ـسِن» یعنی «هستی».',
  ),

  trLesson(
    'tr-l1-02-introduce',
    'معرفی خود و دیگران',
    'دوست یا همکارتان را به کسی معرفی می‌کنید و می‌پرسید او کیست.',
    [
      trSentence('tr1-09', 'Bu benim arkadaşım.', 'این دوست من است.', 'بو بِنیم آرکاداشِم', 'arkadaş', 'دوست', 'bu + benim + اسم + -ım = این ... من است'),
      trSentence('tr1-10', 'Onun adı Ali.', 'اسم او علی است.', 'اونون آدی علی', 'onun', 'مالِ او', 'onun + ad + -ı = اسم او'),
      trSentence('tr1-11', 'O benim komşum.', 'او همسایهٔ من است.', 'او بِنیم کُمشوم', 'komşu', 'همسایه', 'komşu + -m = همسایه‌ام'),
      trSentence('tr1-12', 'O kim?', 'او کیست؟', 'او کیم', 'kim', 'کی', 'O kim? = او کیست؟'),
      trSentence('tr1-13', 'Tanıştığımıza memnun oldum.', 'از آشنایی با شما خوشوقتم.', 'تانیشتیییمیزا مِمون اولدوم', 'tanışmak', 'آشنا شدن', 'tanıştığımıza memnun oldum = از آشنایی خوشوقتم'),
      trSentence('tr1-14', 'Ben de memnun oldum.', 'من هم خوشوقتم.', 'بِن دِه مِمون اولدوم', 'ben de', 'من هم', 'ben de = من هم'),
      trSentence('tr1-15', 'Sizi tanıştırayım.', 'شما را معرفی کنم.', 'سیزی تانیشتیراییم', 'tanıştırmak', 'معرفی کردن', 'sizi = شما را (مفعول)'),
      trSentence('tr1-16', 'Bu benim iş arkadaşım.', 'این همکار من است.', 'بو بِنیم ایش آرکاداشِم', 'iş arkadaşı', 'همکار', 'iş (کار) + arkadaş (دوست) = همکار'),
    ],
    [
      { speaker: 'مریم', text: 'Merhaba, bu benim arkadaşım Ali.', fa: 'سلام، این دوست من علی است.' },
      { speaker: 'کارمند', text: 'Memnun oldum. Siz kimsiniz?', fa: 'خوشوقتم. شما کی هستید؟' },
      { speaker: 'علی', text: 'Ben Ali. Sizi tanıştırayım: bu da iş arkadaşım Hasan.', fa: 'من علی هستم. شما را معرفی کنم: این هم همکار من حسن است.' },
      { speaker: 'کارمند', text: 'Tanıştığımıza memnun oldum.', fa: 'از آشنایی با شما خوشوقتم.' },
      { speaker: 'علی', text: 'Ben de memnun oldum.', fa: 'من هم خوشوقتم.' },
    ],
    [
      {
        promptFa: 'برای پرسیدن «او کیست؟» کدام جمله درست است؟',
        choices: ['O kim?', 'O nerede?', 'Adın ne?'],
        correctIndex: 0,
        explanationFa: 'O kim? یعنی «او کیست؟»؛ O nerede? یعنی «او کجاست؟».',
      },
      {
        promptFa: 'کدام جمله یعنی «این دوست من است»؟',
        choices: ['Bu benim arkadaşım.', 'O benim komşum.', 'Sizi tanıştırayım.'],
        correctIndex: 0,
        explanationFa: 'bu + benim + arkadaş + -ım = این دوست من است.',
      },
    ],
    'برای معرفی، الگوی «Bu benim + اسم + پسوند مالکیت» را حفظ کنید: arkadaşım (دوستم)، komşum (همسایه‌ام)، iş arkadaşım (همکارم). «Memnun oldum» پاسخ استاندارد آشنایی است.',
  ),

  trLesson(
    'tr-l1-03-pronouns',
    'ضمایر شخصی در جمله',
    'شش ضمیر شخصی را می‌شناسید و می‌بینید هر کدام با کدام پسوند فعل یا اسم می‌آید.',
    [
      trSentence('tr1-17', 'Ben Ali’yim.', 'من علی هستم.', 'بِن علی‌ییم', 'ben', 'من', 'ben + اسم + -yim = من ... هستم'),
      trSentence('tr1-18', 'Sen Ayşe misin?', 'تو عایشه هستی؟', 'سِن عایشه میسین', 'sen', 'تو', 'sen + اسم + mi + -sin = تو ... هستی؟'),
      trSentence('tr1-19', 'O nerede?', 'او کجاست؟', 'او نِرِدِه', 'o', 'او', 'o = او (زن یا مرد)'),
      trSentence('tr1-20', 'Biz öğrenciyiz.', 'ما دانش‌آموزیم.', 'بیز اویْرِنجی‌ییز', 'biz', 'ما', 'biz + اسم + -yiz = ما ... هستیم'),
      trSentence('tr1-21', 'Siz öğretmen misiniz?', 'شما معلم هستید؟', 'سیز اویْرِتمِن میسینیز', 'siz', 'شما', 'siz + اسم + mi + -siniz = شما ... هستید؟'),
      trSentence('tr1-22', 'Onlar arkadaş.', 'آن‌ها دوست هستند.', 'اونلار آرکاداش', 'onlar', 'آن‌ها', 'onlar + اسم (بدون پسوند) = آن‌ها ... هستند'),
      trSentence('tr1-23', 'Bu benim, o senin.', 'این مال من است، آن مال تو.', 'بو بِنیم، او سِنین', 'senin', 'مالِ تو', 'benim / senin = مال من / مال تو'),
      trSentence('tr1-24', 'Siz nasılsınız?', 'شما چطورید؟', 'سیز ناصِلسینیز', 'nasılsınız', 'چطورید', 'nasıl + -sınız = چطورید (شما)'),
    ],
    [
      { speaker: 'معلم', text: 'Merhaba, ben Ayşe. Siz kimsiniz?', fa: 'سلام، من عایشه هستم. شما کی هستید؟' },
      { speaker: 'مریم', text: 'Ben Meryem, o da Ali. Biz öğrenciyiz.', fa: 'من مریم‌ام، او هم علی. ما دانش‌آموزیم.' },
      { speaker: 'معلم', text: 'Siz nasılsınız?', fa: 'شما چطورید؟' },
      { speaker: 'علی', text: 'İyiyiz, teşekkürler. Onlar da öğrenci mi?', fa: 'خوبیم، ممنون. آن‌ها هم دانش‌آموزند؟' },
      { speaker: 'معلم', text: 'Evet, onlar da öğrenci.', fa: 'بله، آن‌ها هم دانش‌آموزند.' },
    ],
    [
      {
        promptFa: 'کدام ضمیر برای «ما» است؟',
        choices: ['siz', 'biz', 'onlar'],
        correctIndex: 1,
        explanationFa: 'biz = ما، siz = شما، onlar = آن‌ها.',
      },
      {
        promptFa: 'کدام جمله درست است؟',
        choices: ['Biz öğrenciyiz.', 'Biz öğrencisin.', 'Biz öğrenciyim.'],
        correctIndex: 0,
        explanationFa: 'برای «ما» پسوند -yiz/-iz می‌آید: biz öğrenciyiz.',
      },
    ],
    'شش ضمیر: ben (من)، sen (تو)، o (او)، biz (ما)، siz (شما)، onlar (آن‌ها). ترکی جنسیت دستوری ندارد؛ «o» هم برای زن است و هم مرد. در گفتار روزمره ضمیر اغلب حذف می‌شود، چون پسوند شخصی گویاست.',
  ),

  trLesson(
    'tr-l1-04-nominal-sentences',
    'جمله‌های اسمی ساده با پسوندهای شخصی',
    'می‌گویید چه کسی هستید، کجا هستید و حال‌تان چگونه است؛ بدون نیاز به فعل «بودن».',
    [
      trSentence('tr1-25', 'Ben öğrenciyim.', 'من دانش‌آموزم.', 'بِن اویْرِنجی‌ییم', 'öğrenci', 'دانش‌آموز / دانشجو', 'اسم + y + -im = من ... هستم'),
      trSentence('tr1-26', 'Sen öğretmensin.', 'تو معلمی.', 'سِن اویْرِتمِنسین', 'öğretmen', 'معلم', 'اسم + -sin = تو ... هستی'),
      trSentence('tr1-27', 'O doktor.', 'او پزشک است.', 'او دوکتور', 'doktor', 'پزشک', 'برای سوم‌شخص مفرد پسوند نمی‌آید'),
      trSentence('tr1-28', 'Biz hazırız.', 'ما آماده‌ایم.', 'بیز هازیریز', 'hazır', 'آماده', 'صفت + -ız = ما ... هستیم'),
      trSentence('tr1-29', 'Ben yorgunum.', 'من خسته‌ام.', 'بِن یورگونوم', 'yorgun', 'خسته', 'صفت + -um = من ... هستم'),
      trSentence('tr1-30', 'Sen haklısın.', 'حق با توست.', 'سِن هاکلیسین', 'haklı', 'حق‌به‌جانب', 'haklı + -sın = حق با توست'),
      trSentence('tr1-31', 'Onlar evde.', 'آن‌ها در خانه‌اند.', 'اونلار اِودِه', 'ev', 'خانه', 'ev + -de = در خانه'),
      trSentence('tr1-32', 'Siz hazır mısınız?', 'شما آماده‌اید؟', 'سیز هازیر میسینیز', 'mısınız', 'آیا هستید', 'صفت + mı + -sınız = آیا ... هستید؟'),
    ],
    [
      { speaker: 'معلم', text: 'Merhaba, ben Ayşe. Siz öğrenci misiniz?', fa: 'سلام، من عایشه هستم. شما دانش‌آموز هستید؟' },
      { speaker: 'دانش‌آموز', text: 'Evet, ben öğrenciyim. O da öğrenci.', fa: 'بله، من دانش‌آموزم. او هم دانش‌آموز است.' },
      { speaker: 'معلم', text: 'Neredesiniz?', fa: 'کجا هستید؟' },
      { speaker: 'دانش‌آموز', text: 'Biz sınıftayız ve hazırız.', fa: 'ما در کلاس هستیم و آماده‌ایم.' },
    ],
    [
      {
        promptFa: 'کدام جمله درست است؟',
        choices: ['Ben öğrenci.', 'Ben öğrenciyim.', 'Ben öğrencisin.'],
        correctIndex: 1,
        explanationFa: 'برای «من» پسوند -yim می‌آید: ben öğrenciyim.',
      },
      {
        promptFa: '«ما آماده‌ایم» کدام است؟',
        choices: ['Biz hazırız.', 'Biz hazırsın.', 'Biz hazır.'],
        correctIndex: 0,
        explanationFa: 'برای «ما» پسوند -ız/-iz می‌آید: biz hazırız.',
      },
    ],
    'ترکی فعل «بودن» مستقل ندارد؛ پسوند شخصی به اسم یا صفت می‌چسبد: iyi + yim، yorgun + um، hazır + ız. اگر واژه به واکه ختم شود یک «y» میانجی می‌آید (öğrenci-y-im). برای پرسش، ذرهٔ mı/mi/mu/mü پیش از پسوند شخصی می‌آید: hazır mı-sınız?',
  ),

  trLesson(
    'tr-l1-05-nationality',
    'ملیت، زبان و محل زندگی',
    'می‌گویید اهل کجایید، کجا زندگی می‌کنید و چه زبانی می‌دانید.',
    [
      trSentence('tr1-33', 'Nerelisiniz?', 'اهل کجا هستید؟', 'نِرِلیسینیز', 'nere', 'کجا', 'nere + -li (اهلِ) + -siniz = اهل کجا هستید؟'),
      trSentence('tr1-34', 'Ben İranlıyım.', 'من ایرانی هستم.', 'بِن ایرانلی‌ییم', 'İranlı', 'ایرانی', 'نام کشور + -lı/-li = اهل آن کشور'),
      trSentence('tr1-35', 'Ben Tahranlıyım.', 'من اهل تهرانی هستم.', 'بِن تِهرانلی‌ییم', 'Tahran', 'تهران', 'شهر + -lı = اهل آن شهر'),
      trSentence('tr1-36', 'Nerede yaşıyorsun?', 'کجا زندگی می‌کنی؟', 'نِرِدِه یاشاییورسون', 'yaşamak', 'زندگی کردن', 'nerede + yaşamak = کجا زندگی کردن'),
      trSentence('tr1-37', 'İstanbul’da yaşıyorum.', 'در استانبول زندگی می‌کنم.', 'ایستانبولدا یاشاییوروم', 'yaşamak', 'زندگی کردن', 'İstanbul + -da = در استانبول'),
      trSentence('tr1-38', 'Türkiye’de yaşıyorum.', 'در ترکیه زندگی می‌کنم.', 'تورکی‌یِده یاشاییوروم', 'Türkiye', 'ترکیه', 'Türkiye + -de = در ترکیه'),
      trSentence('tr1-39', 'Benim ana dilim Farsça.', 'زبان مادری من فارسی است.', 'بِنیم آنا دیلیم فارسچا', 'ana dili', 'زبان مادری', 'ana dili + -m = زبان مادری‌ام'),
      trSentence('tr1-40', 'Biraz Türkçe biliyorum.', 'کمی ترکی می‌دانم.', 'بیراز تورکچه بیلییوروم', 'biraz', 'کمی', 'biraz = کمی'),
    ],
    [
      { speaker: 'میزبان', text: 'Nerelisiniz?', fa: 'اهل کجا هستید؟' },
      { speaker: 'مریم', text: 'Ben İranlıyım, Tahranlıyım.', fa: 'من ایرانی هستم، اهل تهران.' },
      { speaker: 'میزبان', text: 'Şimdi nerede yaşıyorsunuz?', fa: 'الان کجا زندگی می‌کنید؟' },
      { speaker: 'مریم', text: 'İstanbul’da yaşıyorum. Biraz Türkçe biliyorum.', fa: 'در استانبول زندگی می‌کنم. کمی ترکی می‌دانم.' },
      { speaker: 'میزبان', text: 'Çok güzel! Ana diliniz Farsça mı?', fa: 'خیلی خوب! زبان مادری‌تان فارسی است؟' },
    ],
    [
      {
        promptFa: 'برای پرسیدن «اهل کجایی؟» کدام جمله درست است؟',
        choices: ['Nerelisin?', 'Nerede yaşıyorsun?', 'Ne zaman?'],
        correctIndex: 0,
        explanationFa: 'Nerelisin یعنی «اهل کجایی؟»؛ Nerede yaşıyorsun یعنی «کجا زندگی می‌کنی؟».',
      },
      {
        promptFa: '«در ترکیه زندگی می‌کنم» کدام است؟',
        choices: ['Türkiye’de yaşıyorum.', 'Türkiye’ye gidiyorum.', 'Türkçe biliyorum.'],
        correctIndex: 0,
        explanationFa: 'Türkiye + -de = در ترکیه؛ -ye یعنی «به».',
      },
    ],
    'نام کشور + پسوند -lı/-li/-lu/-lü ملیت می‌سازد: İran → İranlı، Türkiye → Türk. برای «در ...» پسوند -da/-de (و -ta/-te بعد از صامت بی‌واک) به کار می‌رود: İstanbul’da، Türkiye’de، Tahran’da.',
  ),

  trLesson(
    'tr-l1-06-present-continuous',
    'جمله‌های فعلی ساده در زمان حال استمراری',
    'می‌گویید همین حالا چه می‌کنید و از دیگری می‌پرسید چه می‌کند.',
    [
      trSentence('tr1-41', 'Ben gidiyorum.', 'من می‌روم.', 'بِن گیدییوروم', 'gitmek', 'رفتن', 'git- + -iyor- + -um = می‌روم'),
      trSentence('tr1-42', 'Sen geliyorsun.', 'تو می‌آیی.', 'سِن گِلییورسون', 'gelmek', 'آمدن', 'gel- + -iyor- + -sun = می‌آیی'),
      trSentence('tr1-43', 'O okuyor.', 'او می‌خواند.', 'او اوکویور', 'okumak', 'خواندن', 'oku- + -yor = می‌خواند'),
      trSentence('tr1-44', 'Biz yemek yiyoruz.', 'ما غذا می‌خوریم.', 'بیز یِمِک یییوروز', 'yemek yemek', 'غذا خوردن', 'yemek yemek = غذا خوردن'),
      trSentence('tr1-45', 'Siz çay içiyorsunuz.', 'شما چای می‌نوشید.', 'سیز چای ایچییورسونوز', 'içmek', 'نوشیدن', 'iç- + -iyor- + -sunuz'),
      trSentence('tr1-46', 'Onlar konuşuyorlar.', 'آن‌ها صحبت می‌کنند.', 'اونلار کونوشویورلار', 'konuşmak', 'صحبت کردن', 'konuş- + -uyor- + -lar'),
      trSentence('tr1-47', 'Ne okuyorsun?', 'چه می‌خوانی؟', 'نِه اوکویورسون', 'ne', 'چه', 'ne + فعل + -yor-sun = چه ... می‌کنی؟'),
      trSentence('tr1-48', 'Türkçe çalışıyorum.', 'ترکی تمرین می‌کنم.', 'تورکچه چالیشییوروم', 'çalışmak', 'کار/تمرین کردن', 'çalış- + -ıyor- + -um'),
    ],
    [
      { speaker: 'علی', text: 'Merhaba, ne okuyorsun?', fa: 'سلام، چه می‌خوانی؟' },
      { speaker: 'مریم', text: 'Türkçe çalışıyorum. Sen ne yapıyorsun?', fa: 'ترکی تمرین می‌کنم. تو چه می‌کنی؟' },
      { speaker: 'علی', text: 'Ben çay içiyorum ve seni bekliyorum.', fa: 'من چای می‌نوشم و منتظرت هستم.' },
      { speaker: 'مریم', text: 'Tamam, ben geliyorum.', fa: 'باشه، من می‌آیم.' },
    ],
    [
      {
        promptFa: 'زمان حال استمراری با کدام پسوند ساخته می‌شود؟',
        choices: ['-yor', '-dı', '-acak'],
        correctIndex: 0,
        explanationFa: 'پسوند -yor زمان حال استمراری است: gidiyorum (می‌روم).',
      },
      {
        promptFa: '«شما چای می‌نوشید» کدام است؟',
        choices: ['Siz çay içiyorsunuz.', 'Siz çay içiyorum.', 'Siz çay içiyor.'],
        correctIndex: 0,
        explanationFa: 'برای «شما» پسوند -sunuz/-sınız می‌آید.',
      },
    ],
    'ساخت زمان حال استمراری: ریشهٔ فعل + -(ı/i/u/ü)yor + پسوند شخصی. اگر ریشه به واکه ختم شود میانجی «-y-» می‌آید: oku → okuyorum، bekle → bekliyorum. این زمان برای کاری است که همین حالا در جریان است.',
  ),

  trLesson(
    'tr-l1-07-questions',
    'پرسش‌های ساده و پاسخ به آن‌ها',
    'دنبال چیز، شخص، جا، زمان، دلیل و انتخاب هستید و پاسخ کوتاه می‌دهید.',
    [
      trSentence('tr1-49', 'Bu ne?', 'این چیست؟', 'بو نِه', 'ne', 'چه', 'ne = چه / چیست'),
      trSentence('tr1-50', 'Bu kim?', 'این کیست؟', 'بو کیم', 'bu', 'این', 'bu = این'),
      trSentence('tr1-51', 'Tuvalet nerede?', 'دستشویی کجاست؟', 'تووالِت نِرِدِه', 'nerede', 'کجا', 'مکان + nerede? = ... کجاست؟'),
      trSentence('tr1-52', 'Ne zaman açılıyor?', 'چه ساعتی باز می‌شود؟', 'نِه زامان آچیلییور', 'ne zaman', 'چه وقت', 'ne zaman = چه وقت'),
      trSentence('tr1-53', 'Neden geç kaldın?', 'چرا دیر کردی؟', 'نِدِن گِچ کالدین', 'neden', 'چرا', 'neden = چرا'),
      trSentence('tr1-54', 'Bu nasıl çalışıyor?', 'این چطور کار می‌کند؟', 'بو ناصِل چالیشییور', 'nasıl', 'چگونه', 'nasıl = چگونه'),
      trSentence('tr1-55', 'Kaç para?', 'چند است؟', 'کاچ پارا', 'para', 'پول', 'kaç para = چند پول'),
      trSentence('tr1-56', 'Hangisi daha ucuz?', 'کدام‌یک ارزان‌تر است؟', 'هانگیسی داها اوجوز', 'hangisi', 'کدام‌یک', 'hangisi = کدام‌یک'),
    ],
    [
      { speaker: 'گردشگر', text: 'Affedersiniz, tuvalet nerede?', fa: 'ببخشید، دستشویی کجاست؟' },
      { speaker: 'فروشنده', text: 'Arkada, sağda.', fa: 'عقب، سمت راست.' },
      { speaker: 'گردشگر', text: 'Ne zaman kapanıyor?', fa: 'چه ساعتی بسته می‌شود؟' },
      { speaker: 'فروشنده', text: 'Saat dokuzda.', fa: 'ساعت نه.' },
    ],
    [
      {
        promptFa: 'برای پرسیدن مکان («کجاست؟») از کدام واژه استفاده می‌کنید؟',
        choices: ['ne zaman', 'nerede', 'neden'],
        correctIndex: 1,
        explanationFa: 'nerede یعنی «کجا»؛ ne zaman «چه وقت» و neden «چرا» است.',
      },
      {
        promptFa: 'کدام پرسش برای انتخاب بین دو چیز است؟',
        choices: ['Hangisi?', 'Kim?', 'Kaç para?'],
        correctIndex: 0,
        explanationFa: 'Hangisi یعنی «کدام‌یک»؛ با daha می‌توان مقایسه کرد: Hangisi daha ucuz?',
      },
    ],
    'واژهٔ پرسش در ترکی معمولاً اول جمله می‌آید: Ne zaman açılıyor? برای پرسش بله/نه، ذرهٔ پرسشی mı/mi/mu/mü به پایان جمله می‌چسبد: Öğrenci misin? (دانش‌آموزی؟) پاسخ کوتاه هم کافی است: Evet (بله) / Hayır (نه).',
  ),

  trLesson(
    'tr-l1-08-negative',
    'جمله‌های منفی',
    'می‌گویید چیزی را نمی‌فهمید یا انجام نمی‌دهید و مؤدبانه درخواست تکرار می‌کنید.',
    [
      trSentence('tr1-57', 'Anlamıyorum.', 'نمی‌فهمم.', 'آنلامییوروم', 'anlamak', 'فهمیدن', 'anla- + -mı- + -yor- + -um = نمی‌فهمم'),
      trSentence('tr1-58', 'Bilmiyorum.', 'نمی‌دانم.', 'بیلمییوروم', 'bilmek', 'دانستن', 'bil- + -mi- + -yor- + -um'),
      trSentence('tr1-59', 'Türkçe konuşmuyorum.', 'ترکی صحبت نمی‌کنم.', 'تورکچه کونوشمییوروم', 'konuşmak', 'صحبت کردن', 'konuş- + -mu- + -yor- + -um'),
      trSentence('tr1-60', 'İngilizce bilmiyorum.', 'انگلیسی نمی‌دانم.', 'اینگلیزجه بیلمییوروم', 'İngilizce', 'انگلیسی', 'bil- + -mi- + -yor- + -um'),
      trSentence('tr1-61', 'Hiç anlamıyorum.', 'هیچ نمی‌فهمم.', 'هیچ آنلامییوروم', 'hiç', 'هیچ', 'hiç = هیچ (تأکید نفی)'),
      trSentence('tr1-62', 'Bu doğru değil.', 'این درست نیست.', 'بو دوغرو دِییل', 'doğru', 'درست', 'değil = نیست'),
      trSentence('tr1-63', 'Lütfen yavaş konuşun.', 'لطفاً آهسته صحبت کنید.', 'لوتفِن یاواش کونوشون', 'yavaş', 'آهسته', 'yavaş = آهسته'),
      trSentence('tr1-64', 'Tekrar eder misiniz?', 'تکرار می‌کنید؟', 'تِکرار اِدِر میسینیز', 'tekrar etmek', 'تکرار کردن', 'tekrar eder misiniz = دوباره می‌گویید؟'),
    ],
    [
      { speaker: 'مریم', text: 'Affedersiniz, anlamıyorum.', fa: 'ببخشید، نمی‌فهمم.' },
      { speaker: 'کارمند', text: 'İngilizce biliyor musunuz?', fa: 'انگلیسی می‌دانید؟' },
      { speaker: 'مریم', text: 'Hayır, İngilizce bilmiyorum. Lütfen yavaş konuşun.', fa: 'نه، انگلیسی نمی‌دانم. لطفاً آهسته صحبت کنید.' },
      { speaker: 'کارمند', text: 'Tabii, tekrar ederim.', fa: 'البته، تکرار می‌کنم.' },
    ],
    [
      {
        promptFa: '«نمی‌فهمم» در ترکی کدام است؟',
        choices: ['Anlamıyorum.', 'Bilmiyorum.', 'Konuşmuyorum.'],
        correctIndex: 0,
        explanationFa: 'Anlamıyorum یعنی «نمی‌فهمم»؛ bilmiyorum یعنی «نمی‌دانم».',
      },
      {
        promptFa: 'برای درخواست «آهسته‌تر صحبت کنید» چه می‌گویید؟',
        choices: ['Tekrar eder misiniz?', 'Lütfen yavaş konuşun.', 'Bu doğru değil.'],
        correctIndex: 1,
        explanationFa: 'Lütfen yavaş konuşun یعنی «لطفاً آهسته صحبت کنید».',
      },
    ],
    'نفی در زمان حالِ جاری با میانجی -mı-/-mi-/-mu-/-mü- ساخته می‌شود: anlı-yor-um → anla-mı-yor-um. «değil» برای نفی اسم و صفت است: doğru değil (درست نیست). نفی پرسش بله/نه هم با «Hayır» پاسخ می‌گیرد.',
  ),

  trLesson(
    'tr-l1-09-numbers-age',
    'اعداد، سن و اطلاعات شخصی',
    'تعداد و قیمت می‌پرسید، سن و شمارهٔ تلفن را می‌گویید و اطلاعات شخصی می‌دهید.',
    [
      trSentence('tr1-65', 'Bir kahve, lütfen.', 'یک قهوه، لطفاً.', 'بیر کاهوِه، لوتفِن', 'bir', 'یک', 'عدد + اسم + lütfen = سفارش'),
      trSentence('tr1-66', 'İki bilet, lütfen.', 'دو بلیت لطفاً.', 'ایکی بیلِت، لوتفِن', 'iki', 'دو', 'در ترکی بعد از عدد اسم جمع نمی‌شود'),
      trSentence('tr1-67', 'Kaç tane?', 'چند تا؟', 'کاچ تانِه', 'tane', 'دانه / واحد شمارش', 'kaç tane = چند تا'),
      trSentence('tr1-68', 'Bu kaç lira?', 'این چند لیر است؟', 'بو کاچ لیرا', 'lira', 'لیر', 'bu kaç lira? = این چند است؟'),
      trSentence('tr1-69', 'Yüz lira.', 'صد لیر.', 'یوز لیرا', 'yüz', 'صد', 'yüz = صد'),
      trSentence('tr1-70', 'Kaç yaşındasın?', 'چند سالت است؟', 'کاچ یاشِنداسِن', 'yaş', 'سن', 'kaç yaşında + -sın = چند سالت است؟'),
      trSentence('tr1-71', 'Ben otuz yaşındayım.', 'من سی سال دارم.', 'بِن اوتوز یاشِنداییِم', 'otuz', 'سی', 'عدد + yaşında + -yım = ... سال دارم'),
      trSentence('tr1-72', 'Telefon numaran ne?', 'شمارهٔ تلفنت چیست؟', 'تِلِفون نوماران نِه', 'telefon numarası', 'شمارهٔ تلفن', 'numaran = شماره‌ات'),
    ],
    [
      { speaker: 'فروشنده', text: 'Buyurun, kaç tane?', fa: 'بفرمایید، چند تا؟' },
      { speaker: 'مریم', text: 'İki tane, lütfen. Bu kaç lira?', fa: 'دو تا، لطفاً. این چند لیر است؟' },
      { speaker: 'فروشنده', text: 'Yüz lira.', fa: 'صد لیر.' },
      { speaker: 'کارمند', text: 'Kaç yaşındasınız?', fa: 'چند سالتان است؟' },
      { speaker: 'مریم', text: 'Otuz yaşındayım. Telefon numaram: sıfır beş yüz…', fa: 'سی سال دارم. شمارهٔ تلفنم: صفر پنج صد…' },
    ],
    [
      {
        promptFa: 'در ترکی «دو بلیت» درست کدام است؟',
        choices: ['İki biletler', 'İki bilet', 'İkiler bilet'],
        correctIndex: 1,
        explanationFa: 'بعد از عدد، اسم مفرد می‌آید: iki bilet.',
      },
      {
        promptFa: '«چند سالت است؟» چگونه پرسیده می‌شود؟',
        choices: ['Kaç yaşındasın?', 'Kaç tane?', 'Kaç para?'],
        correctIndex: 0,
        explanationFa: 'Kaç yaşındasın = چند سالت است؟',
      },
    ],
    'اعداد پایه: bir ۱، iki ۲، üç ۳، dört ۴، beş ۵، altı ۶، yedi ۷، sekiz ۸، dokuz ۹، on ۱۰، yirmi ۲۰، otuz ۳۰، kırk ۴۰، elli ۵۰، yüz ۱۰۰. عدد پیش از اسم می‌آید و اسم مفرد می‌ماند. برای سن: «عدد + yaşında + پسوند شخصی».',
  ),

  trLesson(
    'tr-l1-10-family',
    'مالکیت و خانواده',
    'اعضای خانواده را معرفی می‌کنید و می‌گویید چه چیزی مال کیست.',
    [
      trSentence('tr1-73', 'Bu benim annem.', 'این مادرم است.', 'بو بِنیم آنِم', 'anne', 'مادر', 'anne + -m = مادرم'),
      trSentence('tr1-74', 'Onun adı Fatma.', 'اسم او فاطمه است.', 'اونون آدی فاطمه', 'onun', 'مالِ او', 'onun + ad + -ı = اسم او'),
      trSentence('tr1-75', 'Babam öğretmen.', 'پدرم معلم است.', 'بابام اویْرِتمِن', 'baba', 'پدر', 'baba + -m = پدرم'),
      trSentence('tr1-76', 'Bir kız kardeşim var.', 'یک خواهر دارم.', 'بیر کیز کاردِشیم وار', 'kız kardeş', 'خواهر', 'var = هست / دارم'),
      trSentence('tr1-77', 'İki erkek kardeşim var.', 'دو برادر دارم.', 'ایکی اِرکِک کاردِشیم وار', 'erkek kardeş', 'برادر', 'erkek = مرد، kız = دختر'),
      trSentence('tr1-78', 'Ailem kalabalık.', 'خانواده‌ام پرجمعیت است.', 'آیِلِم کالابالیک', 'aile', 'خانواده', 'aile + -m = خانواده‌ام'),
      trSentence('tr1-79', 'Bu senin mi?', 'این مال توست؟', 'بو سِنین می', 'senin', 'مالِ تو', 'senin = مال تو'),
      trSentence('tr1-80', 'Hayır, o benim değil.', 'نه، آن مال من نیست.', 'هایِر، او بِنیم دِییل', 'benim değil', 'مال من نیست', 'değil = نیست'),
    ],
    [
      { speaker: 'مریم', text: 'Bu benim annem. Onun adı Fatma.', fa: 'این مادرم است. اسم او فاطمه است.' },
      { speaker: 'علی', text: 'Memnun oldum. Bu telefon senin mi?', fa: 'خوشوقتم. این تلفن مال توست؟' },
      { speaker: 'مریم', text: 'Hayır, o benim değil. Babamın.', fa: 'نه، مال من نیست. مال پدرم است.' },
      { speaker: 'علی', text: 'Ailen kalabalık mı?', fa: 'خانواده‌ات پرجمعیت است؟' },
      { speaker: 'مریم', text: 'Evet, bir kız kardeşim ve iki erkek kardeşim var.', fa: 'بله، یک خواهر و دو برادر دارم.' },
    ],
    [
      {
        promptFa: 'کدام جمله یعنی «یک خواهر دارم»؟',
        choices: ['Bir kız kardeşim var.', 'Bir kız kardeşim yok.', 'Kız kardeşim nerede?'],
        correctIndex: 0,
        explanationFa: 'kız kardeş + -im + var = خواهر دارم؛ yok یعنی «نیست/ندارم».',
      },
      {
        promptFa: '«این مال توست؟» کدام است؟',
        choices: ['Bu senin mi?', 'Bu benim mi?', 'Bu kimin?'],
        correctIndex: 0,
        explanationFa: 'senin = مال تو؛ benim = مال من؛ kimin = مال کی.',
      },
    ],
    'پسوند مالکیت برای «من» -im/-ım/-um/-üm است: anne → annem، baba → babam، aile → ailem. برای «مالِ کسی بودن» از benim/senin/onun/bizim/sizin/onların استفاده کنید: benim değil (مال من نیست).',
  ),
];
