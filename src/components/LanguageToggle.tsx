import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'en' ? 'it' : 'en')}
      className="w-9 h-9 font-semibold text-xs uppercase"
    >
      {language === 'en' ? 'IT' : 'EN'}
    </Button>
  );
}
