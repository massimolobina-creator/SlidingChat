
import React, { useState } from 'react';
import { UserSettings } from '../types';
const logoImg = '/logo.png';

interface IntroScreenProps {
  initialSettings: UserSettings;
  onComplete: (settings: Partial<UserSettings>) => void;
}

const LANGUAGES = [
  { code: 'English', label: 'English', flag: '🇬🇧' },
  { code: 'Italian', label: 'Italiano', flag: '🇮🇹' },
  { code: 'Spanish', label: 'Español', flag: '🇪🇸' },
  { code: 'French', label: 'Français', flag: '🇫🇷' },
  { code: 'German', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'Portuguese', label: 'Português', flag: '🇵🇹' },
  { code: 'Chinese', label: '中文', flag: '🇨🇳' },
  { code: 'Japanese', label: '日本語', flag: '🇯🇵' },
  { code: 'Russian', label: 'Русский', flag: '🇷🇺' },
  { code: 'Arabic', label: 'العربية', flag: '🇸🇦' },
  { code: 'Hindi', label: 'हिन्दी', flag: '🇮🇳' },
];

const TEXTS: Record<string, any> = {
  English: {
    title: "SlidingChat",
    subtitle: "Connect securely, globally.",
    legal: "Legal & Privacy",
    legalNote: "For your privacy, your location will be approximate (shifted by ~500m).",
    age: "I confirm I am over 16 years old.",
    privacyUS: "I accept the Terms and US Privacy Policy.",
    privacyEU: "I accept the Terms and EU Privacy Policy.",
    next: "Next",
    nickname: "Choose a Nickname",
    placeholder: "e.g. TurboTraveler",
    start: "Start Sliding",
    back: "Back",
    selectLang: "Select Language"
  },
  Italian: {
    title: "SlidingChat",
    subtitle: "Connettiti in sicurezza, ovunque.",
    legal: "Legale e Privacy",
    legalNote: "Per la tua privacy, la posizione sarà approssimativa (sfalsata di ~500m).",
    age: "Confermo di avere più di 16 anni.",
    privacyUS: "Accetto i Termini e la Privacy Policy USA.",
    privacyEU: "Accetto i Termini e la Privacy Policy UE.",
    next: "Avanti",
    nickname: "Scegli un Nickname",
    placeholder: "es. ViaggiatoreTurbo",
    start: "Inizia a Slidare",
    back: "Indietro",
    selectLang: "Seleziona Lingua"
  },
  Spanish: {
    title: "SlidingChat",
    subtitle: "Conéctate de forma segura.",
    legal: "Legal y Privacidad",
    legalNote: "Por privacidad, su ubicación será aproximada (desplazada ~500m).",
    age: "Confirmo que tengo más de 16 años.",
    privacyUS: "Acepto los Términos y Política EE.UU.",
    privacyEU: "Acepto los Términos y Política UE.",
    next: "Siguiente",
    nickname: "Elige un Apodo",
    placeholder: "ej. ViajeroTurbo",
    start: "Empezar",
    back: "Atrás",
    selectLang: "Seleccionar Idioma"
  },
  French: {
    title: "SlidingChat",
    subtitle: "Connexion sécurisée mondiale.",
    legal: "Légal & Confidentialité",
    legalNote: "Pour votre vie privée, votre position sera approximative (~500m).",
    age: "Je confirme avoir plus de 16 ans.",
    privacyUS: "J'accepte les conditions (US).",
    privacyEU: "J'accepte les conditions (UE).",
    next: "Suivant",
    nickname: "Choisissez un Pseudo",
    placeholder: "ex. VoyageurTurbo",
    start: "Commencer",
    back: "Retour",
    selectLang: "Choisir la langue"
  },
  German: {
    title: "SlidingChat",
    subtitle: "Sicher weltweit verbinden.",
    legal: "Rechtliches & Datenschutz",
    legalNote: "Zum Schutz Ihrer Privatsphäre ist Ihr Standort ungefähr (~500m).",
    age: "Ich bin über 16 Jahre alt.",
    privacyUS: "Akzeptiere US-Richtlinien.",
    privacyEU: "Akzeptiere EU-Richtlinien.",
    next: "Weiter",
    nickname: "Wähle einen Spitznamen",
    placeholder: "z.B. TurboReisender",
    start: "Starten",
    back: "Zurück",
    selectLang: "Sprache wählen"
  },
  Portuguese: {
    title: "SlidingChat",
    subtitle: "Conexão segura global.",
    legal: "Legal e Privacidade",
    legalNote: "Sua localização será aproximada (~500m) para segurança.",
    age: "Confirmo ter mais de 16 anos.",
    privacyUS: "Aceito Termos e Política EUA.",
    privacyEU: "Aceito Termos e Política UE.",
    next: "Próximo",
    nickname: "Escolha um Apelido",
    placeholder: "ex. ViajanteTurbo",
    start: "Começar",
    back: "Voltar",
    selectLang: "Selecionar Idioma"
  },
  Chinese: {
    title: "SlidingChat",
    subtitle: "全球安全连接。",
    legal: "法律与隐私",
    legalNote: "为了您的隐私，您的位置将是近似值（偏移约500米）。",
    age: "我确认已年满16岁。",
    privacyUS: "我接受条款和美国隐私政策。",
    privacyEU: "我接受条款和欧盟隐私政策。",
    next: "下一步",
    nickname: "选择昵称",
    placeholder: "例如：极速旅行者",
    start: "开始",
    back: "返回",
    selectLang: "选择语言"
  },
  Japanese: {
    title: "SlidingChat",
    subtitle: "世界中と安全につながる。",
    legal: "法的およびプライバシー",
    legalNote: "プライバシー保護のため、位置情報は概算（約500mのずれ）になります。",
    age: "16歳以上であることを確認します。",
    privacyUS: "利用規約と米国プライバシーポリシーに同意します。",
    privacyEU: "利用規約とEUプライバシーポリシーに同意します。",
    next: "次へ",
    nickname: "ニックネームを選択",
    placeholder: "例: ターボトラベラー",
    start: "開始",
    back: "戻る",
    selectLang: "言語を選択"
  },
  Russian: {
    title: "SlidingChat",
    subtitle: "Безопасное общение.",
    legal: "Правовая информация",
    legalNote: "Для конфиденциальности ваше местоположение будет приблизительным (~500м).",
    age: "Мне больше 16 лет.",
    privacyUS: "Принимаю условия (США).",
    privacyEU: "Принимаю условия (ЕС).",
    next: "Далее",
    nickname: "Выберите никнейм",
    placeholder: "например, ТурбоПутник",
    start: "Начать",
    back: "Назад",
    selectLang: "Выберите язык"
  },
  Arabic: {
    title: "SlidingChat",
    subtitle: "تواصل بأمان عالمياً.",
    legal: "قانوني وخصوصية",
    legalNote: "لخصوصيتك، سيكون موقعك تقريبيًا (إزاحة ~500 متر).",
    age: "أؤكد أن عمري أكثر من 16 عامًا.",
    privacyUS: "أوافق على الشروط وسياسة الخصوصية الأمريكية.",
    privacyEU: "أوافق على الشروط وسياسة الخصوصية الأوروبية.",
    next: "التالي",
    nickname: "اختر لقبًا",
    placeholder: "مثال: المسافر السريع",
    start: "ابدأ",
    back: "رجوع",
    selectLang: "اختر اللغة"
  },
  Hindi: {
    title: "SlidingChat",
    subtitle: "सुरक्षित रूप से जुड़ें।",
    legal: "कानूनी और गोपनीयता",
    legalNote: "आपकी गोपनीयता के लिए, स्थान अनुमानित होगा (~500m का अंतर)।",
    age: "मैं पुष्टि करता हूं कि मैं 16 वर्ष से अधिक हूं।",
    privacyUS: "मैं शर्तें और यूएस गोपनीयता नीति स्वीकार करता हूं।",
    privacyEU: "मैं शर्तें और ईयू गोपनीयता नीति स्वीकार करता हूं।",
    next: "अगला",
    nickname: "एक उपनाम चुनें",
    placeholder: "उदाहरण: टर्बो यात्री",
    start: "शुरू करें",
    back: "वापस",
    selectLang: "भाषा चुनें"
  }
};

export const IntroScreen: React.FC<IntroScreenProps> = ({ initialSettings, onComplete }) => {
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState(initialSettings.language || 'English');
  const [ageChecked, setAgeChecked] = useState(false);
  const [privacyUS, setPrivacyUS] = useState(false);
  const [privacyEU, setPrivacyEU] = useState(false);
  const [nickname, setNickname] = useState(initialSettings.nickname || '');

  const t = TEXTS[language] || TEXTS['English'];

  const canProceedStep2 = ageChecked && privacyUS && privacyEU;
  const canProceedStep3 = nickname.trim().length > 2;

  const handleFinish = () => {
    onComplete({
      nickname,
      language,
      isOnline: true,
      setupComplete: true,
      theme: 'turquoise',
      notificationsEnabled: true,
      blockedUsers: []
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-turquoise-400 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden transition-all duration-500 ease-in-out">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 mb-3 flex items-center justify-center bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                <img 
                    src={logoImg} 
                    alt="SlidingChat Logo" 
                    className="w-full h-full object-cover p-1 rounded-3xl"
                    referrerPolicy="no-referrer"
                />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
            <p className="text-gray-500 text-sm">{t.subtitle}</p>
        </div>

        {/* Step 1: Language Selection */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-center font-semibold text-gray-700 mb-4">{t.selectLang}</h3>
            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {LANGUAGES.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                            language === lang.code 
                            ? 'border-turquoise-500 bg-turquoise-50 text-turquoise-800 shadow-md transform scale-105' 
                            : 'border-gray-100 hover:border-turquoise-200 text-gray-600'
                        }`}
                    >
                        <span className="text-xl">{lang.flag}</span>
                        <span className="font-medium text-sm">{lang.label}</span>
                    </button>
                ))}
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full mt-6 py-3 rounded-xl font-bold text-white bg-turquoise-500 hover:bg-turquoise-600 transition-all shadow-md transform hover:scale-[1.02]"
            >
              {t.next}
            </button>
          </div>
        )}

        {/* Step 2: Legal Checks */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
             <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                {t.legal}
              </h3>
              <p className="text-xs text-blue-600 mb-4 leading-tight">{t.legalNote}</p>
              
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                    <div className={`mt-0.5 min-w-[1.5rem] h-6 rounded border-2 flex items-center justify-center transition-colors ${ageChecked ? 'bg-turquoise-500 border-turquoise-500' : 'border-gray-300 bg-white'}`}>
                        {ageChecked && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <input type="checkbox" checked={ageChecked} onChange={(e) => setAgeChecked(e.target.checked)} className="hidden" />
                    <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">{t.age}</span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group select-none">
                     <div className={`mt-0.5 min-w-[1.5rem] h-6 rounded border-2 flex items-center justify-center transition-colors ${privacyUS ? 'bg-turquoise-500 border-turquoise-500' : 'border-gray-300 bg-white'}`}>
                        {privacyUS && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <input type="checkbox" checked={privacyUS} onChange={(e) => setPrivacyUS(e.target.checked)} className="hidden" />
                    <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">{t.privacyUS}</span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group select-none">
                     <div className={`mt-0.5 min-w-[1.5rem] h-6 rounded border-2 flex items-center justify-center transition-colors ${privacyEU ? 'bg-turquoise-500 border-turquoise-500' : 'border-gray-300 bg-white'}`}>
                        {privacyEU && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <input type="checkbox" checked={privacyEU} onChange={(e) => setPrivacyEU(e.target.checked)} className="hidden" />
                    <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">{t.privacyEU}</span>
                </label>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md ${
                canProceedStep2 
                ? 'bg-turquoise-500 hover:bg-turquoise-600 transform hover:scale-[1.02]' 
                : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {t.next}
            </button>
            <button 
                onClick={() => setStep(1)}
                className="w-full text-center text-gray-400 text-sm hover:text-turquoise-600 transition-colors"
            >
                {t.back}
            </button>
          </div>
        )}

        {/* Step 3: Nickname */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t.nickname}</label>
              <div className="relative">
                  <input 
                    type="text" 
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder={t.placeholder}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-turquoise-500 outline-none transition-all bg-gray-50 text-lg"
                    autoFocus
                  />
                  <div className="absolute right-4 top-4 text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
              </div>
            </div>

            <button
              onClick={handleFinish}
              disabled={!canProceedStep3}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                canProceedStep3
                ? 'bg-gradient-to-r from-turquoise-500 to-blue-500 hover:from-turquoise-600 hover:to-blue-600 transform hover:scale-[1.02]' 
                : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {t.start}
            </button>
            
            <button 
                onClick={() => setStep(2)}
                className="w-full text-center text-gray-400 text-sm hover:text-turquoise-600 transition-colors"
            >
                {t.back}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
