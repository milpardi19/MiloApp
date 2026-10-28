# راه‌اندازی اعلان چت و پشتیبانی Milo (Supabase + Expo)

این راهنما برای تغییرات همین مخزن است. ارسال اعلان فقط در سرور انجام می‌شود:

`تریگرهای Postgres ← chat_push_queue ← Database Webhook ← Edge Function chat-push ← Expo Push`

اپ هنگام بازبودن صرفاً بنر بی‌صدا و شمارندهٔ تب را به‌روزرسانی می‌کند؛ زنده‌بودن اپِ فرستنده برای ارسال لازم نیست.

## ۱) اجرای SQL در داشبورد

1. در Supabase به **SQL Editor → New query** بروید.
2. محتوای کامل `supabase/SETUP-COPY-PASTE-ONCE.sql` را اجرا کنید (اگر جداول پایه هنوز ساخته نشده‌اند).
3. محتوای کامل `supabase/SETUP-CHAT-PUSH-ONCE.sql` را در یک Query دیگر اجرا کنید.
   - این بسته، migrationهای فعلی مدیر/پروفایل/توکن/گفتگوی پشتیبانی و صف اعلان را به‌ترتیب اجرا می‌کند.
   - برای پروژه‌ای که migrationهای فعلی را قبلاً اجرا کرده، بسته برای اجرای دوباره آماده شده است.
   - اگر اجرای قبلی خطای `42P13` داد و گفت نوع خروجی `admin_registered_users()` قابل تغییر نیست، نسخهٔ تازهٔ همین فایل حالا آن تابع را داخل تراکنش بازسازی می‌کند؛ دستور `DROP FUNCTION ... CASCADE` را جداگانه اجرا نکنید.
   - این بسته جدول‌های `education_admins`, `app_user_profiles`, `chat_push_tokens`, `support_requests` و `chat_push_queue` را می‌سازد؛ جدول‌های پایهٔ `conversations`, `conversation_members`, `learning_contacts`, `messages`, `profiles` و `learning_progress` باید از قبل وجود داشته باشند. اگر یکی از جدول‌های پایه نباشد، SQL عمداً با خطای روشن متوقف می‌شود.
4. حساب مدیر را طبق `docs/EDUCATION-ADMIN.md` در `education_admins` ثبت کنید و مدیریت آموزشی را در صورت نیاز فعال کنید.

جدول تازهٔ `support_requests` برای وضعیت `open`/`resolved` هر گفتگوی خصوصی مدیر و زبان‌آموز است. صف `chat_push_queue` فقط شناسهٔ رویداد، گیرنده، عنوان و متن عمومی/نام فرستنده را نگه می‌دارد؛ متن کامل پیام هرگز در صف یا اعلان کپی نمی‌شود.

## ۲) استقرار Edge Function

این دستور را خودتان در ترمینال اجرا کنید؛ در این جلسه اجرا نشده است:

```bash
supabase functions deploy chat-push --no-verify-jwt --project-ref doagwkssxtxseuavrxnr
```

`--no-verify-jwt` لازم است چون Database Webhook با سرِرشتهٔ اختصاصی `CHAT_WEBHOOK_SECRET` اعتبارسنجی می‌شود، نه با JWT کاربر.

## ۳) Secretهای Supabase

یک مقدار تصادفی فقط برای همین پروژه بسازید؛ آن را در Git، اپ یا چت نگذارید:

```bash
openssl rand -hex 32
supabase secrets set CHAT_WEBHOOK_SECRET='<مقدار-تصادفی-بالا>' --project-ref doagwkssxtxseuavrxnr
```

همان مقدار را در تنظیم Headerهای دو Database Webhook پایین وارد کنید. Secret لازمِ مختص این تابع فقط `CHAT_WEBHOOK_SECRET` است.

Supabase معمولاً `SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY` را به Edge Function تزریق می‌کند؛ این‌ها را در اپ یا مخزن قرار ندهید. اگر در تنظیمات پروژه به‌صورت خودکار موجود نبودند، فقط در **Supabase Edge Function Secrets** تنظیمشان کنید. `EXPO_ACCESS_TOKEN` برای این جریان لازم نیست. کلید داخل `config/supabase.public.json` همان anon key عمومی اپ است و نباید با service-role جایگزین شود.

## ۴) ساخت Database Webhookها

از **Database → Webhooks → Create a new webhook** دو مورد بسازید. برای هر دو:

- Method: `POST`
- URL: `https://doagwkssxtxseuavrxnr.supabase.co/functions/v1/chat-push`
- Header: `Content-Type: application/json`
- Header: `x-chat-webhook-secret: <همان CHAT_WEBHOOK_SECRET>`

Webhook اول:

- Table: `public.chat_push_queue`
- Event: فقط `INSERT`
- Name پیشنهادی: `chat-push-queue-insert`

Webhook دوم:

- Table: `public.chat_push_tokens`
- Event: فقط `INSERT`
- Name پیشنهادی: `chat-push-new-device`
- این مورد صفی را که پیش از ثبت اولین توکن منتظر مانده، هنگام ثبت توکن بیدار می‌کند.

Webhook را روی `UPDATE` جدول توکن نگذارید؛ اپ وضعیت foreground را به‌روزرسانی می‌کند و نباید برای هر heartbeat تابع را صدا بزند.

## ۵) زمان‌بندی retry و رسیدهای Expo

برای retry صف‌های موقت و پاک‌کردن توکن‌هایی که رسید `DeviceNotRegistered` می‌دهند، از **Database → Extensions** افزونه‌های `pg_cron` و `pg_net` را فعال کنید. سپس در SQL Editor این زمان‌بندی را یک‌بار اجرا کنید؛ مقدار placeholder را با همان secret جایگزین کنید:

```sql
select cron.schedule(
  'milo-chat-push-maintenance',
  '*/15 * * * *',
  $$
    select net.http_post(
      url := 'https://doagwkssxtxseuavrxnr.supabase.co/functions/v1/chat-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-chat-webhook-secret', 'REPLACE_WITH_CHAT_WEBHOOK_SECRET'
      ),
      body := jsonb_build_object('type', 'CRON')
    );
  $$
);
```

اگر این زمان‌بندی را دوباره می‌سازید، ابتدا job قبلی با همین نام را از **Database → Cron Jobs** حذف کنید تا دو job هم‌زمان نداشته باشید.

## ۶) تحویل آفلاین و جلوگیری از تکرار

- هر پیام/رویداد با شناسهٔ پایدار در `chat_push_queue.event_key` یکتا می‌شود. Webhook تکراری همان صف را دوباره نمی‌سازد؛ وضعیت `submitted` و ticketهای Expo هم دوباره ارسال نمی‌شوند.
- هر ارسال با `ttl` هفت‌روزه به Expo سپرده می‌شود. اگر دستگاه اینترنت نداشته باشد، Expo/FCM/APNs اعلان را نگه می‌دارند و تا اتصال بعدی به گوشی تحویل نمی‌دهند؛ تابع برای همان رویداد مرتباً اعلان تازه نمی‌سازد. ردیف صف برای dedupe و پیگیری باقی می‌ماند.
- اگر Expo رسید `DeviceNotRegistered` بدهد، توکن از `chat_push_tokens` حذف می‌شود. Job دوره‌ای، رسیدها و retryهای موقت را بررسی می‌کند.
- وقتی اپ جلوی چشم است، پل از بنر درون‌برنامه‌ای و شمارندهٔ تب مکالمه استفاده می‌کند. کانال `milo-chat-quiet` بی‌صدا/بی‌لرزش است؛ در پس‌زمینه کانال موجود `milo-chat` با صدا و لرزش استفاده می‌شود.

## ۷) EAS و مجوز Android

- `EAS_PROJECT_ID` در `app.config.js` خوانده می‌شود و برای گرفتن Expo push token لازم است. این مورد **GitHub Actions variable** است، نه Supabase secret. اگر متغیر تنظیم نشده باشد، APK نباید ساخته شود؛ چون بدون آن ثبت Expo token انجام نمی‌شود و اعلان به هیچ گوشی نمی‌رسد.
- فایل `app.json` از قبل مجوز `POST_NOTIFICATIONS` و کانال پیش‌فرض `milo-chat` را دارد. در Android 13+، اپ یک توضیح فارسی نشان می‌دهد و درخواست سیستم را حداکثر یک‌بار می‌فرستد. اگر کاربر رد کرد، باید بعداً مجوز را از تنظیمات Android روشن کند.
- برای آزمایش واقعی، اعلان اپ و کانال **پیام‌ها و درخواست‌های چت** را در تنظیمات Android روشن نگه دارید و هر دو دستگاه را با نسخه‌ای بسازید که همان EAS Project ID را دارد.
