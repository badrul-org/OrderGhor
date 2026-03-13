import { create } from 'zustand';
import { db, getSettings } from '../db/database';
import type { AppSettings, LicenseType } from '../types';
import { validateActivationCode } from '../utils/parseOrder';

interface SettingsState {
  settings: AppSettings | null;
  language: 'bn' | 'en';
  loaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  setLanguage: (lang: 'bn' | 'en') => void;
  activateCode: (code: string) => Promise<boolean>;
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
    const licenseType = validateActivationCode(code) as LicenseType | null;
    if (!licenseType) return false;

    const { settings } = get();
    if (!settings?.id) return false;

    const updates = {
      activationCode: code,
      licenseType,
      activatedAt: new Date(),
    };
    await db.settings.update(settings.id, updates);
    set({ settings: { ...settings, ...updates } });
    return true;
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
