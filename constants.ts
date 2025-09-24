import { LanguageOption } from './types';

export const LANGUAGES: LanguageOption[] = [
    { code: 'en-US', name: 'English', voiceName: 'Google US English' },
    { code: 'ta-IN', name: 'Tamil', voiceName: 'Google தமிழ்' },
    { code: 'hi-IN', name: 'Hindi', voiceName: 'Google हिन्दी' },
    { code: 'kn-IN', name: 'Kannada', voiceName: 'Google ಕನ್ನಡ' },
    { code: 'te-IN', name: 'Telugu', voiceName: 'Google తెలుగు' },
    { code: 'ur-IN', name: 'Urdu', voiceName: 'Google اردو' },
    { code: 'bn-IN', name: 'Bengali', voiceName: 'Google বাংলা' },
    { code: 'ml-IN', name: 'Malayalam', voiceName: 'Google മലയാളം' },
    { code: 'pa-IN', name: 'Punjabi', voiceName: 'Google ਪੰਜਾਬੀ' },
    { code: 'gu-IN', name: 'Gujarati', voiceName: 'Google ગુજરાતી' },
    { code: 'or-IN', name: 'Odia', voiceName: 'Google ଓଡ଼ିଆ' },
];

export const DISTRICTS: string[] = ["Chennai", "Kanchipuram", "Madurai", "Thiruvallur", "Ariyalur"];

export const BOT_NAME = 'Ingres';