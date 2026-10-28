#!/usr/bin/env bash
set -euo pipefail

# Supabase does not support global npm installation. Use an existing native
# binary when available; otherwise npx downloads/runs the supported local CLI.
if command -v supabase >/dev/null 2>&1; then
  SUPABASE=(supabase)
else
  SUPABASE=(npx --yes supabase)
fi

if ! "${SUPABASE[@]}" projects list >/dev/null 2>&1; then
  echo "Supabase login is required. A browser window will open once."
  "${SUPABASE[@]}" login
fi

if ! "${SUPABASE[@]}" status >/dev/null 2>&1 && [ ! -f supabase/.temp/project-ref ]; then
  echo "This folder is not linked to the online Supabase project yet."
  echo "Run: npx supabase link --project-ref YOUR_PROJECT_REF"
  echo "The project ref is the first part of your Supabase URL: https://PROJECT_REF.supabase.co"
  exit 1
fi

echo "Applying the idempotent production database migration..."
"${SUPABASE[@]}" db push

echo "Deploying authenticated Edge Functions..."
for fn in emma-chat speech-evaluate human-chat-assist; do
  "${SUPABASE[@]}" functions deploy "$fn"
done
# Database webhooks authenticate with CHAT_WEBHOOK_SECRET instead of a user JWT.
"${SUPABASE[@]}" functions deploy chat-push --no-verify-jwt
# The lesson narrator is called from the app without a learner login and only
# accepts a capped lesson sentence, so it runs without JWT verification.
"${SUPABASE[@]}" functions deploy narration-tts --no-verify-jwt

echo "Production backend setup finished."
echo
echo "Lesson narrator (optional human-sounding female voice for EN/DE/RU):"
echo "  npx supabase secrets set OPENAI_API_KEY=sk-..."
echo "The app never falls back to device speech; configure CDN or the Edge Function before release."
echo "For batch generation: npm run narration:manifest then npm run narration:generate."
echo
echo "For push delivery while the app is closed, set a strong webhook secret:"
echo "  npx supabase secrets set CHAT_WEBHOOK_SECRET=YOUR_RANDOM_SECRET"
echo "Then create two Supabase Database Webhooks targeting /functions/v1/chat-push:"
echo "  public.messages / INSERT and public.learning_contacts / INSERT"
echo "Add request header: x-chat-webhook-secret: YOUR_RANDOM_SECRET"
echo
echo "Remaining manual step (dashboard only, cannot be done from SQL):"
echo "  Supabase > Authentication > Providers > Anonymous Sign-Ins = ON"
echo "Without it the app cannot create an identity, so invite codes and chat stay disabled."
