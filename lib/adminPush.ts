import { adminClient } from './educationAdmin';
import { registerChatPushTokenForUser } from './chatNotifications';

/** Registers the manager's device using the separate manager auth session. */
export async function registerAdminPushToken(): Promise<void> {
  try {
    const client = adminClient();
    const { data: sessionData } = await client.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return;
    await registerChatPushTokenForUser(userId, client);
  } catch {
    // Push is best effort; the management panel remains usable without it.
  }
}
