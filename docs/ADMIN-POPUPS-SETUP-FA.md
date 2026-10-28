# راهنمای پنل ادمین ۱۰۰٪ واقعی و پاپ‌آپ زنده در اپ اصلی

این سیستم امکان ارسال آنی پاپ‌آپ از **Milo Admin App** به **اپ اصلی (انگلیسی/آلمانی/روسی)** و **نسخهٔ ترکی (انگلیسی/آلمانی/ترکی)** را با آمار واقعی بازدید و کلیک فراهم می‌کند. حالت نمایشی (Demo) به طور کامل از پنل مدیریت حذف شده است.

## ۱. فعال‌سازی یک‌مرحله‌ای در Supabase (فقط با مرورگر)

1. وارد داشبورد پروژه در **Supabase → SQL Editor → New query** شوید.
2. محتوای فایل `supabase/SETUP-ADMIN-POPUPS-ONCE.sql` را کامل کپی و **Run** کنید (یا در داخل خود اپ ادمین روی دکمهٔ **«کپی کامل کد SQL نصب پاپ‌آپ»** کلیک کنید).
3. اطمینان حاصل کنید که سوئیچ مدیریتی سرور فعال و حساب ادمین ثبت شده باشد:

```sql
UPDATE public.education_feature_settings SET management_enabled = true WHERE id = true;

INSERT INTO public.education_admins (user_id, display_name)
SELECT id, 'مدیر اصلی'
FROM auth.users
WHERE lower(email) = lower('YOUR_ADMIN_EMAIL')
ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name;
```

## ۲. امکانات استودیوی پاپ‌آپ در اپ ادمین

- **ارسال آنی (Realtime):** با فشردن «انتشار و ارسال آنی»، پاپ‌آپ از طریق Supabase Realtime (`postgres_changes` + `broadcast`) در کمتر از یک ثانیه روی اپ‌های باز نمایش داده می‌شود و در دیتابیس برای مراجعان بعدی هم باقی می‌ماند.
- **هدف‌گیری دقیق:**
  - **همگانی:** نمایش برای تمام کاربران (حتی بدون لاگین) با امکان انتخاب **هر دو اپ**، **فقط اپ اصلی (EN/DE/RU)** یا **فقط اپ ترکی (EN/DE/TR)**.
  - **کاربر خاص:** ارسال پیام یا اعلان اختصاصی به یک کاربر ثبت‌شدهٔ مشخص (`target_user_id`).
- **حالت‌های نمایش:**
  - `یک‌بار برای هر کاربر` (`once`) — با قابلیت «ارسال مجدد به همه» در صورت نیاز.
  - `هر بار باز شدن اپ` (`every_launch`)
  - `اجباری بدون دکمه بستن` (`persistent_blocking`) — که با غیرفعال‌سازی توسط مدیر بلافاصله از صفحهٔ کاربر بسته می‌شود.
- **دکمهٔ اقدام هوشمند (CTA):** هدایت مستقیم به مسیرهای داخلی اپ (`/languages`, `/lang`, `/learn/de`, `/learn/ru`, `/learn/tr`, `/placement`, `/review`, `/conversations`) یا لینک‌های امن بیرونی `https://...`.
- **آمار زنده و واقعی:** ثبت یکتای بازدید (`unique_impressions`)، کل دفعات نمایش (`total_impressions`)، کلیک روی دکمه (`unique_clicks` و نرخ کلیک `CTR%`) و بستن پاپ‌آپ (`unique_dismissals`) با ضدتقلب سمت سرور.

## ۳. تست خودکار امنیتی پایگاه‌داده

```bash
npm run validate:admin
npm run validate:admin-popups
npm run typecheck
```
