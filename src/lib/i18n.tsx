import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Locale = 'en' | 'ne';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    'nav.home': 'Home',
    'nav.packages': 'Packages',
    'nav.homestays': 'Homestays',
    'nav.videos': 'Videos',
    'nav.blogs': 'Blogs',
    'nav.about': 'About Us',
    'nav.contact': 'Contact',
    'nav.signIn': 'Sign In',
    'nav.signUp': 'Sign Up',
    'footer.listHomestay': 'List your Homestay',
    'footer.addListing': 'Add a listing',
    'footer.bePartner': 'Be our partner',
    'footer.subscribe': 'Subscribe',
    'footer.newsletter': 'Subscribe to Our Newsletter',
    'footer.newsletterDesc': 'Get the latest homestay deals and travel tips delivered to your inbox',
    'footer.company': 'Company',
    'footer.explore': 'Explore',
    'footer.support': 'Support',
    'footer.legal': 'Legal',
    'footer.aboutUs': 'About Us',
    'footer.ourTeam': 'Our Team',
    'footer.careers': 'Careers',
    'footer.press': 'Press',
    'footer.allHomestays': 'All Homestays',
    'footer.travelPackages': 'Travel Packages',
    'footer.destinations': 'Destinations',
    'footer.experiences': 'Experiences',
    'footer.helpCenter': 'Help Center',
    'footer.safety': 'Safety Information',
    'footer.cancellation': 'Cancellation Policy',
    'footer.faqs': 'FAQs',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.cookies': 'Cookie Policy',
  },
  ne: {
    'nav.home': 'गृहपृष्ठ',
    'nav.packages': 'प्याकेज',
    'nav.homestays': 'होमस्टे',
    'nav.videos': 'भिडियो',
    'nav.blogs': 'ब्लग',
    'nav.about': 'हाम्रो बारे',
    'nav.contact': 'सम्पर्क',
    'nav.signIn': 'साइन इन',
    'nav.signUp': 'साइन अप',
    'footer.listHomestay': 'आफ्नो होमस्टे सूचीबद्ध गर्नुहोस्',
    'footer.addListing': 'सूची थप्नुहोस्',
    'footer.bePartner': 'हाम्रा साझेदार बन्नुहोस्',
    'footer.subscribe': 'सदस्यता लिनुहोस्',
    'footer.newsletter': 'हाम्रो न्युजलेटरको सदस्यता लिनुहोस्',
    'footer.newsletterDesc': 'न्युजलेटरमा होमस्टे डिल र यात्रा सुझाव प्राप्त गर्नुहोस्',
    'footer.company': 'कम्पनी',
    'footer.explore': 'अन्वेषण गर्नुहोस्',
    'footer.support': 'सहयोग',
    'footer.legal': 'कानूनी',
    'footer.aboutUs': 'हाम्रो बारे',
    'footer.ourTeam': 'हाम्रो टोली',
    'footer.careers': 'क्यारियर',
    'footer.press': 'प्रेस',
    'footer.allHomestays': 'सबै होमस्टे',
    'footer.travelPackages': 'यात्रा प्याकेज',
    'footer.destinations': 'गन्तव्यहरू',
    'footer.experiences': 'अनुभवहरू',
    'footer.helpCenter': 'सहयोग केन्द्र',
    'footer.safety': 'सुरक्षा जानकारी',
    'footer.cancellation': 'रद्दगर्ने नीति',
    'footer.faqs': 'प्रश्नहरू',
    'footer.privacy': 'गोपनीयता नीति',
    'footer.terms': 'सेवाका सर्तहरू',
    'footer.cookies': 'कुकी नीति',
  },
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem('nepali_homestays_locale');
    return (stored === 'ne' ? 'ne' : 'en') as Locale;
  });

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem('nepali_homestays_locale', next);
  }, []);

  const t = useCallback(
    (key: string) => {
      return translations[locale][key] ?? translations.en[key] ?? key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: 'en' as Locale,
      setLocale: (_: Locale) => {},
      t: (key: string) => translations.en[key] ?? key,
    };
  }
  return ctx;
}
