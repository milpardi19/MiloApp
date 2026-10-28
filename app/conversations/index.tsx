import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import Bot from 'lucide-react-native/dist/esm/icons/bot';
import ChevronLeft from 'lucide-react-native/dist/esm/icons/chevron-left';
import MessageCircle from 'lucide-react-native/dist/esm/icons/message-circle';
import Mic2 from 'lucide-react-native/dist/esm/icons/mic-vocal';
import Plus from 'lucide-react-native/dist/esm/icons/plus';
import QrCode from 'lucide-react-native/dist/esm/icons/qr-code';
import ShieldCheck from 'lucide-react-native/dist/esm/icons/shield-check';
import Sparkles from 'lucide-react-native/dist/esm/icons/sparkles';
import Trash2 from 'lucide-react-native/dist/esm/icons/trash-2';
import UserRound from 'lucide-react-native/dist/esm/icons/user-round';
import { AppBottomNav } from '@/components/AppBottomNav';
import { PageNavigation } from '@/components/PageNavigation';
import { LuxuryPalette, LuxuryShadows } from '@/components/luxuryTheme';
import {
  deleteConversationForMe,
  ensureSupportConversation,
  listRealContacts,
  type RealContact,
} from '@/lib/conversations';
import { readableSupabaseError } from '@/lib/errors';
import { FEATURES } from '@/lib/features';
import { isSupabaseConfigured } from '@/lib/pairing';
import { SupabaseSetupNotice } from '@/components/SupabaseSetupNotice';
import { Typography } from '@/lib/theme';

export default function ConversationsHome() {
  const router = useRouter();
  const [contacts, setContacts] = useState<RealContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);

  const configured = isSupabaseConfigured();
  const [openingSupport, setOpeningSupport] = useState(false);

  const openSupport = () => {
    if (openingSupport) return;
    setOpeningSupport(true);
    ensureSupportConversation()
      .then(conversationId =>
        router.push({
          pathname: '/conversations/human/[conversationId]',
          params: { conversationId, name: 'پشتیبانی Milo' },
        } as never),
      )
      .catch(cause => setContactsError(readableSupabaseError(cause)))
      .finally(() => setOpeningSupport(false));
  };

  const confirmDelete = (contact: RealContact) => {
    Alert.alert(
      'حذف مخاطب و گفتگو',
      `گفتگو با «${contact.displayName}» از این دستگاه حذف شود؟ این کار پیام‌ها را برای مخاطب مقابل حذف نمی‌کند.`,
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'حذف برای من',
          style: 'destructive',
          onPress: () => {
            setDeletingConversationId(contact.conversationId);
            void deleteConversationForMe(contact.conversationId)
              .then(() => {
                setContacts(current =>
                  current.filter(item => item.conversationId !== contact.conversationId),
                );
                setContactsError(null);
              })
              .catch(cause => setContactsError(readableSupabaseError(cause)))
              .finally(() => setDeletingConversationId(null));
          },
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      if (!configured) {
        setLoadingContacts(false);
        setContactsError(null);
        return;
      }
      let active = true;
      setLoadingContacts(true);
      listRealContacts()
        .then(rows => {
          if (!active) return;
          setContacts(rows);
          setContactsError(null);
        })
        .catch(cause => {
          if (active) setContactsError(readableSupabaseError(cause));
        })
        .finally(() => {
          if (active) setLoadingContacts(false);
        });
      return () => {
        active = false;
      };
    }, [configured]),
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={LuxuryPalette.heroGradient}
        start={{ x: 0.95, y: 0 }}
        end={{ x: 0.05, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <PageNavigation tone="dark" backFallback="/languages" />
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>استودیو مکالمه</Text>
            <Text style={styles.title}>مکالمه</Text>
            <Text style={styles.subtitle}>تمرین واقعی، خصوصی و بدون استرس</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {configured && FEATURES.learnerLogin && (
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.supportBanner, pressed && styles.pressed]}
              disabled={openingSupport}
              onPress={openSupport}
            >
              <View style={styles.supportIconWrap}>
                <MessageCircle size={18} color={LuxuryPalette.primary} />
              </View>
              <Text style={styles.supportBannerText}>
                {openingSupport ? 'در حال باز کردن...' : 'گفتگو با پشتیبانی Milo'}
              </Text>
              <ChevronLeft size={18} color={LuxuryPalette.primaryDeep} />
            </Pressable>
          )}

          <Text style={styles.sectionLabel}>مربی هوشمند شما</Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.emmaCard, pressed && styles.pressed]}
            onPress={() => router.push('/conversations/emma' as never)}
          >
            <View style={styles.avatarWrap}>
              <LinearGradient
                colors={['#0D214F', '#1E4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emmaAvatar}
              >
                <Text style={styles.avatarEmoji}>👩🏻‍🏫</Text>
              </LinearGradient>
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.contactText}>
              <View style={styles.nameRow}>
                <Text style={styles.contactName}>Emma</Text>
                <View style={styles.aiBadge}>
                  <Bot size={12} color={LuxuryPalette.gold} />
                  <Text style={styles.aiBadgeText}>مربی هوش مصنوعی</Text>
                </View>
              </View>
              <Text style={styles.contactDesc}>همیشه آماده برای تمرین جمله‌های درس شما</Text>
              <View style={styles.capabilities}>
                <Text style={styles.capability}>اصلاح خصوصی</Text>
                <Text style={styles.capability}>پیشنهاد پاسخ</Text>
                <Text style={styles.capability}>مکالمه صوتی</Text>
              </View>
            </View>
            <ChevronLeft size={21} color={LuxuryPalette.primary} />
          </Pressable>

          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>مخاطبان واقعی</Text>
            <Text style={styles.sectionHint}>دعوت و تأیید دوطرفه</Text>
          </View>

          {!configured ? <SupabaseSetupNotice /> : null}

          {loadingContacts ? (
            <View style={styles.loadingContacts}>
              <ActivityIndicator color={LuxuryPalette.primary} />
              <Text style={styles.loadingText}>در حال دریافت مخاطبان…</Text>
            </View>
          ) : contacts.length ? (
            <View style={styles.contactsList}>
              {contacts.map(contact => (
                <Pressable
                  key={contact.id}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.contactCard, pressed && styles.pressed]}
                  onPress={() =>
                    router.push({
                      pathname: '/conversations/human/[conversationId]',
                      params: { conversationId: contact.conversationId, name: contact.displayName },
                    } as never)
                  }
                >
                  <View style={styles.realAvatar}>
                    <Text style={styles.realAvatarText}>{contact.avatarEmoji}</Text>
                  </View>
                  <View style={styles.realContactText}>
                    <Text style={styles.realContactName}>{contact.displayName}</Text>
                    <Text style={styles.realContactStatus}>مخاطب واقعی · {contact.englishLevel}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`حذف مخاطب و گفتگو با ${contact.displayName}`}
                    hitSlop={8}
                    style={styles.deleteContact}
                    disabled={deletingConversationId === contact.conversationId}
                    onPress={event => {
                      event.stopPropagation();
                      confirmDelete(contact);
                    }}
                  >
                    {deletingConversationId === contact.conversationId ? (
                      <ActivityIndicator size="small" color={LuxuryPalette.rose} />
                    ) : (
                      <Trash2 size={17} color={LuxuryPalette.rose} />
                    )}
                  </Pressable>
                  <ChevronLeft size={20} color={LuxuryPalette.inkMuted} />
                </Pressable>
              ))}
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.addAnother, pressed && styles.pressed]}
                onPress={() => router.push('/conversations/invite' as never)}
              >
                <Plus size={17} color={LuxuryPalette.primary} />
                <Text style={styles.addAnotherText}>افزودن مخاطب دیگر</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptyContacts}>
              <View style={styles.peopleIcon}>
                <UserRound size={28} color={LuxuryPalette.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {contactsError ? 'دریافت مخاطبان انجام نشد' : 'هنوز مخاطبی اضافه نکرده‌اید'}
              </Text>
              <Text style={styles.emptyDesc}>
                {contactsError || 'دوست یا هم‌تمرینی خود را با کد دعوت اضافه کنید و در محیطی خصوصی گفتگو کنید.'}
              </Text>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.inviteButton, pressed && styles.pressed]}
                onPress={() => router.push('/conversations/invite' as never)}
              >
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.inviteText}>افزودن مخاطب واقعی</Text>
              </Pressable>
              <View style={styles.inviteMethods}>
                <View style={styles.method}>
                  <QrCode size={15} color={LuxuryPalette.inkMuted} />
                  <Text style={styles.methodText}>کد دعوت</Text>
                </View>
                <View style={styles.method}>
                  <ShieldCheck size={15} color={LuxuryPalette.inkMuted} />
                  <Text style={styles.methodText}>ارتباط خصوصی</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.assistCard}>
            <Sparkles size={20} color={LuxuryPalette.gold} />
            <View style={styles.assistText}>
              <Text style={styles.assistTitle}>کمک هوشمند کنار گفتگوی واقعی</Text>
              <Text style={styles.assistDesc}>
                قبل از ارسال، ترجمه، اصلاح جمله و پیشنهاد پاسخ فقط برای شما نمایش داده می‌شود.
              </Text>
            </View>
          </View>

          <View style={styles.modeRow}>
            <View style={styles.modeCard}>
              <MessageCircle size={20} color={LuxuryPalette.emerald} />
              <Text style={styles.modeTitle}>پیام متنی</Text>
              <Text style={styles.modeDesc}>با اصلاح اختیاری</Text>
            </View>
            <View style={styles.modeCard}>
              <Mic2 size={20} color={LuxuryPalette.primary} />
              <Text style={styles.modeTitle}>پیام صوتی</Text>
              <Text style={styles.modeDesc}>تمرین تلفظ طبیعی</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <AppBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LuxuryPalette.canvas },
  header: {
    width: '100%',
    paddingTop: 18,
    paddingBottom: 20,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    ...LuxuryShadows.soft,
  },
  headerTop: {
    width: '100%',
    maxWidth: 840,
    alignSelf: 'center',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: { flex: 1, alignItems: 'flex-end', gap: 2 },
  headerEyebrow: {
    fontFamily: Typography.fontFamily,
    fontSize: 11,
    fontWeight: '800',
    color: LuxuryPalette.goldLight,
    writingDirection: 'rtl',
  },
  title: {
    fontFamily: Typography.fontFamily,
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.84)',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  content: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 118 },
  container: { width: '100%', maxWidth: 840, alignSelf: 'center', gap: 14 },
  supportBanner: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: LuxuryPalette.surface,
    borderWidth: 1,
    borderColor: LuxuryPalette.border,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    ...LuxuryShadows.soft,
  },
  supportIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: LuxuryPalette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportBannerText: {
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: 13.5,
    fontWeight: '800',
    color: LuxuryPalette.primaryDeep,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionLabel: {
    fontFamily: Typography.fontFamily,
    fontSize: 16,
    fontWeight: '900',
    color: LuxuryPalette.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionRow: {
    marginTop: 6,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHint: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: LuxuryPalette.inkMuted,
    writingDirection: 'rtl',
  },
  emmaCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: LuxuryPalette.surface,
    borderWidth: 1,
    borderColor: LuxuryPalette.border,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 14,
    ...LuxuryShadows.card,
  },
  avatarWrap: { position: 'relative' },
  emmaAvatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 30 },
  onlineDot: {
    position: 'absolute',
    left: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: LuxuryPalette.emerald,
    borderWidth: 2.5,
    borderColor: LuxuryPalette.surface,
  },
  contactText: { flex: 1, alignItems: 'flex-end' },
  nameRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  contactName: {
    fontFamily: Typography.latinFontFamily,
    fontSize: 19,
    fontWeight: '900',
    color: LuxuryPalette.ink,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  aiBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: LuxuryPalette.goldSoft,
    borderWidth: 1,
    borderColor: '#EFE0BA',
  },
  aiBadgeText: {
    fontFamily: Typography.fontFamily,
    fontSize: 10.5,
    fontWeight: '800',
    color: LuxuryPalette.gold,
    writingDirection: 'rtl',
  },
  contactDesc: {
    fontFamily: Typography.fontFamily,
    fontSize: 13,
    color: LuxuryPalette.inkSoft,
    textAlign: 'right',
    lineHeight: 21,
    marginTop: 4,
    writingDirection: 'rtl',
  },
  capabilities: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  capability: {
    fontFamily: Typography.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: LuxuryPalette.primaryDeep,
    backgroundColor: LuxuryPalette.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    writingDirection: 'rtl',
  },
  loadingContacts: {
    minHeight: 110,
    borderRadius: 22,
    backgroundColor: LuxuryPalette.surface,
    borderWidth: 1,
    borderColor: LuxuryPalette.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: Typography.fontFamily,
    fontSize: 12.5,
    color: LuxuryPalette.inkMuted,
    writingDirection: 'rtl',
  },
  contactsList: { gap: 10 },
  contactCard: {
    minHeight: 74,
    borderRadius: 20,
    backgroundColor: LuxuryPalette.surface,
    borderWidth: 1,
    borderColor: LuxuryPalette.border,
    padding: 15,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    ...LuxuryShadows.soft,
  },
  realAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: LuxuryPalette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  realAvatarText: { fontSize: 24 },
  realContactText: { flex: 1, alignItems: 'flex-end' },
  realContactName: {
    fontFamily: Typography.fontFamily,
    fontSize: 15,
    fontWeight: '800',
    color: LuxuryPalette.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  realContactStatus: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: LuxuryPalette.emerald,
    textAlign: 'right',
    marginTop: 3,
    writingDirection: 'rtl',
  },
  deleteContact: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LuxuryPalette.roseSoft,
  },
  addAnother: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LuxuryPalette.border,
    backgroundColor: LuxuryPalette.surface,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addAnotherText: {
    fontFamily: Typography.fontFamily,
    fontSize: 13.5,
    fontWeight: '800',
    color: LuxuryPalette.primaryDeep,
    writingDirection: 'rtl',
  },
  emptyContacts: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: LuxuryPalette.surface,
    borderWidth: 1,
    borderColor: LuxuryPalette.border,
    alignItems: 'center',
    ...LuxuryShadows.soft,
  },
  peopleIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: LuxuryPalette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 17,
    fontWeight: '900',
    color: LuxuryPalette.ink,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  emptyDesc: {
    fontFamily: Typography.fontFamily,
    fontSize: 13,
    color: LuxuryPalette.inkMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 6,
    writingDirection: 'rtl',
  },
  inviteButton: {
    minHeight: 50,
    marginTop: 18,
    paddingHorizontal: 22,
    borderRadius: 15,
    backgroundColor: LuxuryPalette.primary,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inviteText: {
    fontFamily: Typography.fontFamily,
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    writingDirection: 'rtl',
  },
  inviteMethods: { flexDirection: 'row-reverse', gap: 16, marginTop: 14 },
  method: { flexDirection: 'row-reverse', gap: 5, alignItems: 'center' },
  methodText: {
    fontFamily: Typography.fontFamily,
    fontSize: 11.5,
    fontWeight: '600',
    color: LuxuryPalette.inkMuted,
    writingDirection: 'rtl',
  },
  assistCard: {
    display: 'none',
    borderRadius: 18,
    padding: 16,
    backgroundColor: LuxuryPalette.goldSoft,
    borderWidth: 1,
    borderColor: '#EFE0BA',
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
  },
  assistText: { flex: 1 },
  assistTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 13.5,
    fontWeight: '800',
    color: LuxuryPalette.gold,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  assistDesc: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
    color: LuxuryPalette.inkSoft,
    textAlign: 'right',
    lineHeight: 20,
    marginTop: 3,
    writingDirection: 'rtl',
  },
  modeRow: { display: 'none', flexDirection: 'row-reverse', gap: 10 },
  modeCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: LuxuryPalette.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: LuxuryPalette.border,
    alignItems: 'center',
    gap: 5,
  },
  modeTitle: {
    fontFamily: Typography.fontFamily,
    fontSize: 13.5,
    fontWeight: '800',
    color: LuxuryPalette.ink,
    writingDirection: 'rtl',
  },
  modeDesc: {
    fontFamily: Typography.fontFamily,
    fontSize: 11.5,
    color: LuxuryPalette.inkMuted,
    writingDirection: 'rtl',
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
});
