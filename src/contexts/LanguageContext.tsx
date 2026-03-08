import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type Language = 'en' | 'it';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    'nav.dashboard': 'Dashboard',
    'nav.submissions': 'Submissions',
    'nav.organizations': 'Organizations',
    'nav.users': 'Users',
    'nav.newSubmission': 'New Submission',
    'nav.mySubmissions': 'My Submissions',
    'nav.profile': 'Profile',
    'nav.navigation': 'Navigation',
    'nav.commandCenter': 'Command Center',
    'nav.supplierPortal': 'Supplier Portal',
    // Auth
    'auth.welcomeBack': 'Welcome back',
    'auth.createAccount': 'Create account',
    'auth.signIn': 'Sign In',
    'auth.signingIn': 'Signing in...',
    'auth.creatingAccount': 'Creating account...',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullName': 'Full Name',
    'auth.forgotPassword': 'Forgot your password?',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.createOne': 'Create one',
    'auth.signInLink': 'Sign in',
    'auth.orContinue': 'Or continue with',
    'auth.selectRole': 'Select your role and create an account',
    'auth.signInContinue': 'Sign in to continue',
    'auth.supplier': 'Supplier',
    'auth.manager': 'ESG Manager',
    'auth.supplierDesc': 'Submit energy data & upload invoices',
    'auth.managerDesc': 'Review submissions & approve data',
    // Wizard
    'wizard.howSubmit': 'How would you like to submit?',
    'wizard.chooseMethod': 'Choose manual entry or let our AI extract data from your invoices',
    'wizard.manualEntry': 'Manual Entry',
    'wizard.manualDesc': 'Type in your electricity, gas, fuel, and waste consumption values directly',
    'wizard.smartUpload': 'Smart Upload',
    'wizard.smartDesc': 'Upload an invoice or bill and our AI will automatically extract the energy data',
    'wizard.recommended': 'Recommended',
    'wizard.getStarted': 'Get started',
    'wizard.uploadDoc': 'Upload document',
    // Common
    'common.logout': 'Logout',
    'common.approve': 'Approve',
    'common.requestRevision': 'Request Revision',
    'common.cancel': 'Cancel',
    'common.submit': 'Submit',
    'common.loading': 'Loading...',
    // Branding
    'brand.title': 'Enterprise ESG Data Platform',
    'brand.subtitle': 'AI-powered data extraction with immutable audit trails. Compliance made simple for CSRD & EUDR regulations.',
    'brand.feature1': 'AI-Powered Document Extraction',
    'brand.feature2': 'Immutable Blockchain Audit Trail',
    'brand.feature3': 'CSRD & EUDR Compliance Ready',
  },
  it: {
    // Nav
    'nav.dashboard': 'Pannello',
    'nav.submissions': 'Invii',
    'nav.organizations': 'Organizzazioni',
    'nav.users': 'Utenti',
    'nav.newSubmission': 'Nuovo Invio',
    'nav.mySubmissions': 'I Miei Invii',
    'nav.profile': 'Profilo',
    'nav.navigation': 'Navigazione',
    'nav.commandCenter': 'Centro di Comando',
    'nav.supplierPortal': 'Portale Fornitore',
    // Auth
    'auth.welcomeBack': 'Bentornato',
    'auth.createAccount': 'Crea account',
    'auth.signIn': 'Accedi',
    'auth.signingIn': 'Accesso in corso...',
    'auth.creatingAccount': 'Creazione account...',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullName': 'Nome completo',
    'auth.forgotPassword': 'Hai dimenticato la password?',
    'auth.noAccount': 'Non hai un account?',
    'auth.hasAccount': 'Hai già un account?',
    'auth.createOne': 'Creane uno',
    'auth.signInLink': 'Accedi',
    'auth.orContinue': 'Oppure continua con',
    'auth.selectRole': 'Seleziona il tuo ruolo e crea un account',
    'auth.signInContinue': 'Accedi per continuare',
    'auth.supplier': 'Fornitore',
    'auth.manager': 'Manager ESG',
    'auth.supplierDesc': 'Invia dati energetici e carica fatture',
    'auth.managerDesc': 'Rivedi invii e approva dati',
    // Wizard
    'wizard.howSubmit': 'Come vuoi inviare i dati?',
    'wizard.chooseMethod': 'Scegli l\'inserimento manuale o lascia che la nostra IA estragga i dati dalle tue fatture',
    'wizard.manualEntry': 'Inserimento Manuale',
    'wizard.manualDesc': 'Inserisci i valori di elettricità, gas, carburante e rifiuti direttamente',
    'wizard.smartUpload': 'Caricamento Smart',
    'wizard.smartDesc': 'Carica una fattura e la nostra IA estrarrà automaticamente i dati energetici',
    'wizard.recommended': 'Consigliato',
    'wizard.getStarted': 'Inizia',
    'wizard.uploadDoc': 'Carica documento',
    // Common
    'common.logout': 'Esci',
    'common.approve': 'Approva',
    'common.requestRevision': 'Richiedi Revisione',
    'common.cancel': 'Annulla',
    'common.submit': 'Invia',
    'common.loading': 'Caricamento...',
    // Branding
    'brand.title': 'Piattaforma Dati ESG Aziendale',
    'brand.subtitle': 'Estrazione dati con IA e tracciabilità immutabile. Conformità semplificata per CSRD e EUDR.',
    'brand.feature1': 'Estrazione Documenti con IA',
    'brand.feature2': 'Tracciabilità Blockchain Immutabile',
    'brand.feature3': 'Conformità CSRD e EUDR',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved === 'it' ? 'it' : 'en') as Language;
  });

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app-language', lang);
  }, []);

  const t = useCallback((key: string) => {
    return translations[language][key] ?? key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
