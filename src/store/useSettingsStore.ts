import { create } from 'zustand';
import { db, getSettings } from '../db/database';
import type { AppSettings, LicenseType } from '../types';
import { validateActivationCode } from '../utils/parseOrder';
import { supabase } from '../lib/supabase';

export interface ActivateResult {
  success: boolean;
  error?: string;
  offline?: boolean;
}

interface SettingsState {
  settings: AppSettings | null;
  language: 'bn' | 'en';
  loaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  setLanguage: (lang: 'bn' | 'en') => void;
  activateCode: (code: string) => Promise<ActivateResult>;
  syncLicenseFromProfile: () => Promise<void>;
  canCreateOrder: () => boolean;
  incrementTrialUsage: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  language: 'bn',
  loaded: false,

  loadSettings: async () => {
    const settings = await getSettings();
    set({ settings, language: settings.language, loaded: true });
  },

  updateSettings: async (updates) => {
    const { settings } = get();
    if (!settings?.id) return;
    await db.settings.update(settings.id, updates);
    set({ settings: { ...settings, ...updates } });
  },

  setLanguage: (lang) => {
    set({ language: lang });
    const { settings } = get();
    if (settings?.id) {
      db.settings.update(settings.id, { language: lang });
    }
  },

  activateCode: async (code) => {
    const result = await validateActivationCode(code);

    if (!result.valid || !result.licenseType) {
      return {
        success: false,
        error: result.error || 'Invalid code',
        offline: result.offline,
      };
    }

    const { settings } = get();
    if (!settings?.id) {
      return { success: false, error: 'Settings not loaded' };
    }

    const updates = {
      activationCode: code.trim().toUpperCase(),
      licenseType: result.licenseType as LicenseType,
      activatedAt: new Date(),
    };
    await db.settings.update(settings.id, updates);
    set({ settings: { ...settings, ...updates } });
    return { success: true };
  },

  syncLicenseFromProfile: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('license_type')
        .eq('id', session.user.id)
        .single();

      if (profile?.license_type && profile.license_type !== 'trial') {
        const { settings } = get();
        if (settings?.id && settings.licenseType !== profile.license_type) {
          const updates = {
            licenseType: profile.license_type as LicenseType,
            activatedAt: new Date(),
          };
          await db.settings.update(settings.id, updates);
          set({ settings: { ...settings, ...updates } });
        }
      }
    } catch {
      // Silently fail — offline or not logged in
    }
  },

  canCreateOrder: () => {
    const { settings } = get();
    if (!settings) return false;
    if (settings.licenseType !== 'trial') return true;
    return settings.trialOrdersUsed < settings.trialMaxOrders;
  },

  incrementTrialUsage: async () => {
    const { settings } = get();
    if (!settings?.id || settings.licenseType !== 'trial') return;
    const newCount = settings.trialOrdersUsed + 1;
    await db.settings.update(settings.id, { trialOrdersUsed: newCount });
    set({ settings: { ...settings, trialOrdersUsed: newCount } });
  },
}));
