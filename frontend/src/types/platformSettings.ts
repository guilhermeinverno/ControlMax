export interface PlatformSettings {
  platformName: string;
  supportPhone: string;
  supportEmail: string;
  logoUrl: string;
  slogan: string;
  currency: string;
  defaultMonthlyInterest: number;
  defaultLateFeePercentage: number;
  allowRefinance: boolean;
  maxCreditLimit: number;
  enableInsurance: boolean;
  enableFinance: boolean;
  enableMap: boolean;
  enableWhatsAppAlerts: boolean;
  maintenanceMode: boolean;
  operatingHoursStart: string;
  operatingHoursEnd: string;
  bannerMessage: string;
  requireDeviceVerification: boolean;
  allowOfflineSync: boolean;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: 'ControlMax',
  supportPhone: '+5511999999999',
  supportEmail: 'suporte@controlmax.com',
  logoUrl: '',
  slogan: 'Gestión Inteligente de Cobranzas y Microcréditos',
  currency: 'COP',
  defaultMonthlyInterest: 20,
  defaultLateFeePercentage: 5,
  allowRefinance: true,
  maxCreditLimit: 10000000,
  enableInsurance: true,
  enableFinance: true,
  enableMap: true,
  enableWhatsAppAlerts: true,
  maintenanceMode: false,
  operatingHoursStart: '06:00',
  operatingHoursEnd: '21:00',
  bannerMessage: '¡Bienvenidos al panel unificado de ControlMax!',
  requireDeviceVerification: false,
  allowOfflineSync: true,
};

function pickString(data: Record<string, unknown>, key: keyof PlatformSettings, fallback: string): string {
  const value = data[key];
  return typeof value === 'string' && value ? value : fallback;
}

function pickNumber(data: Record<string, unknown>, key: keyof PlatformSettings, fallback: number): number {
  return data[key] !== undefined ? Number(data[key]) : fallback;
}

function pickBoolean(data: Record<string, unknown>, key: keyof PlatformSettings, fallback: boolean): boolean {
  return data[key] !== undefined ? Boolean(data[key]) : fallback;
}

export function mapPlatformSettingsFromFirestore(data: Record<string, unknown>): PlatformSettings {
  const defaults = DEFAULT_PLATFORM_SETTINGS;
  return {
    platformName: pickString(data, 'platformName', defaults.platformName),
    supportPhone: pickString(data, 'supportPhone', defaults.supportPhone),
    supportEmail: pickString(data, 'supportEmail', defaults.supportEmail),
    logoUrl: pickString(data, 'logoUrl', defaults.logoUrl),
    slogan: pickString(data, 'slogan', defaults.slogan),
    currency: pickString(data, 'currency', defaults.currency),
    defaultMonthlyInterest: pickNumber(data, 'defaultMonthlyInterest', defaults.defaultMonthlyInterest),
    defaultLateFeePercentage: pickNumber(data, 'defaultLateFeePercentage', defaults.defaultLateFeePercentage),
    allowRefinance: pickBoolean(data, 'allowRefinance', defaults.allowRefinance),
    maxCreditLimit: pickNumber(data, 'maxCreditLimit', defaults.maxCreditLimit),
    enableInsurance: pickBoolean(data, 'enableInsurance', defaults.enableInsurance),
    enableFinance: pickBoolean(data, 'enableFinance', defaults.enableFinance),
    enableMap: pickBoolean(data, 'enableMap', defaults.enableMap),
    enableWhatsAppAlerts: pickBoolean(data, 'enableWhatsAppAlerts', defaults.enableWhatsAppAlerts),
    maintenanceMode: pickBoolean(data, 'maintenanceMode', defaults.maintenanceMode),
    operatingHoursStart: pickString(data, 'operatingHoursStart', defaults.operatingHoursStart),
    operatingHoursEnd: pickString(data, 'operatingHoursEnd', defaults.operatingHoursEnd),
    bannerMessage: pickString(data, 'bannerMessage', defaults.bannerMessage),
    requireDeviceVerification: pickBoolean(
      data,
      'requireDeviceVerification',
      defaults.requireDeviceVerification
    ),
    allowOfflineSync: pickBoolean(data, 'allowOfflineSync', defaults.allowOfflineSync),
  };
}
