// Multilingual translations for Smart Bin Interface
export type Language = "en" | "hi" | "ta" | "bn";

export interface Translations {
    // Language names
    languageName: string;

    // Idle Screen
    welcome: string;
    tapToStart: string;
    binStatus: string;
    operational: string;
    full: string;
    maintenance: string;
    fillLevel: string;

    // Scan Screen
    scanQRCode: string;
    positionQR: string;
    scanning: string;
    skipScan: string;
    continueAsGuest: string;

    // Deposit Screen
    depositInProgress: string;
    placeItem: string;
    analyzing: string;
    itemDetected: string;
    processingDeposit: string;

    // Complete Screen
    thankYou: string;
    depositComplete: string;
    pointsEarned: string;
    points: string;
    itemType: string;
    estimatedWeight: string;
    environmentalImpact: string;
    co2Saved: string;
    returnHome: string;

    // Status Messages
    binFull: string;
    binFullMessage: string;
    maintenanceRequired: string;
    maintenanceMessage: string;
    notifyMaintenance: string;

    // Common
    cancel: string;
    back: string;
    close: string;
    loading: string;
}

export const translations: Record<Language, Translations> = {
    en: {
        languageName: "English",

        // Idle Screen
        welcome: "Welcome to Smart E-Waste Bin",
        tapToStart: "Tap anywhere to start",
        binStatus: "Bin Status",
        operational: "Operational",
        full: "Full",
        maintenance: "Maintenance Required",
        fillLevel: "Fill Level",

        // Scan Screen
        scanQRCode: "Scan Your QR Code",
        positionQR: "Position your QR code in front of the camera",
        scanning: "Scanning...",
        skipScan: "Skip",
        continueAsGuest: "Continue as Guest",

        // Deposit Screen
        depositInProgress: "Deposit in Progress",
        placeItem: "Place your e-waste item in the bin",
        analyzing: "Analyzing item...",
        itemDetected: "Item Detected!",
        processingDeposit: "Processing deposit...",

        // Complete Screen
        thankYou: "Thank You!",
        depositComplete: "Your deposit is complete",
        pointsEarned: "Points Earned",
        points: "points",
        itemType: "Item Type",
        estimatedWeight: "Estimated Weight",
        environmentalImpact: "Environmental Impact",
        co2Saved: "CO₂ Saved",
        returnHome: "Return to Home",

        // Status Messages
        binFull: "Bin is Full",
        binFullMessage: "This bin has reached maximum capacity. Please find another nearby bin.",
        maintenanceRequired: "Maintenance Required",
        maintenanceMessage: "This bin is temporarily offline for maintenance. We apologize for the inconvenience.",
        notifyMaintenance: "Notify Maintenance Team",

        // Common
        cancel: "Cancel",
        back: "Back",
        close: "Close",
        loading: "Loading...",
    },

    hi: {
        languageName: "हिंदी",

        // Idle Screen
        welcome: "स्मार्ट ई-वेस्ट बिन में आपका स्वागत है",
        tapToStart: "शुरू करने के लिए कहीं भी टैप करें",
        binStatus: "बिन की स्थिति",
        operational: "चालू",
        full: "भरा हुआ",
        maintenance: "रखरखाव आवश्यक",
        fillLevel: "भराव स्तर",

        // Scan Screen
        scanQRCode: "अपना QR कोड स्कैन करें",
        positionQR: "अपना QR कोड कैमरे के सामने रखें",
        scanning: "स्कैन हो रहा है...",
        skipScan: "छोड़ें",
        continueAsGuest: "अतिथि के रूप में जारी रखें",

        // Deposit Screen
        depositInProgress: "जमा प्रक्रिया जारी है",
        placeItem: "अपना ई-वेस्ट आइटम बिन में रखें",
        analyzing: "आइटम का विश्लेषण हो रहा है...",
        itemDetected: "आइटम मिल गया!",
        processingDeposit: "जमा प्रक्रिया हो रही है...",

        // Complete Screen
        thankYou: "धन्यवाद!",
        depositComplete: "आपकी जमा प्रक्रिया पूर्ण हुई",
        pointsEarned: "अर्जित अंक",
        points: "अंक",
        itemType: "आइटम का प्रकार",
        estimatedWeight: "अनुमानित वजन",
        environmentalImpact: "पर्यावरणीय प्रभाव",
        co2Saved: "CO₂ बचाया गया",
        returnHome: "होम पर वापस जाएं",

        // Status Messages
        binFull: "बिन भरा हुआ है",
        binFullMessage: "यह बिन अधिकतम क्षमता पर पहुंच गया है। कृपया पास का दूसरा बिन खोजें।",
        maintenanceRequired: "रखरखाव आवश्यक",
        maintenanceMessage: "यह बिन रखरखाव के लिए अस्थायी रूप से ऑफ़लाइन है। असुविधा के लिए खेद है।",
        notifyMaintenance: "रखरखाव टीम को सूचित करें",

        // Common
        cancel: "रद्द करें",
        back: "वापस",
        close: "बंद करें",
        loading: "लोड हो रहा है...",
    },

    ta: {
        languageName: "தமிழ்",

        // Idle Screen
        welcome: "ஸ்மார்ட் மின்-கழிவு தொட்டிக்கு வரவேற்கிறோம்",
        tapToStart: "தொடங்க எங்கும் தட்டவும்",
        binStatus: "தொட்டி நிலை",
        operational: "செயல்பாட்டில்",
        full: "நிரம்பிவிட்டது",
        maintenance: "பராமரிப்பு தேவை",
        fillLevel: "நிரப்பு நிலை",

        // Scan Screen
        scanQRCode: "உங்கள் QR குறியீட்டை ஸ்கேன் செய்யவும்",
        positionQR: "உங்கள் QR குறியீட்டை கேமரா முன் வைக்கவும்",
        scanning: "ஸ்கேன் செய்கிறது...",
        skipScan: "தவிர்",
        continueAsGuest: "விருந்தினராக தொடரவும்",

        // Deposit Screen
        depositInProgress: "வைப்பு நடைபெறுகிறது",
        placeItem: "உங்கள் மின்-கழிவு பொருளை தொட்டியில் வைக்கவும்",
        analyzing: "பொருளை பகுப்பாய்வு செய்கிறது...",
        itemDetected: "பொருள் கண்டறியப்பட்டது!",
        processingDeposit: "வைப்பு செயலாக்கப்படுகிறது...",

        // Complete Screen
        thankYou: "நன்றி!",
        depositComplete: "உங்கள் வைப்பு முடிந்தது",
        pointsEarned: "பெற்ற புள்ளிகள்",
        points: "புள்ளிகள்",
        itemType: "பொருள் வகை",
        estimatedWeight: "மதிப்பிடப்பட்ட எடை",
        environmentalImpact: "சுற்றுச்சூழல் தாக்கம்",
        co2Saved: "CO₂ சேமிக்கப்பட்டது",
        returnHome: "முகப்புக்கு திரும்பு",

        // Status Messages
        binFull: "தொட்டி நிரம்பிவிட்டது",
        binFullMessage: "இந்த தொட்டி அதிகபட்ச கொள்ளளவை அடைந்துவிட்டது. அருகிலுள்ள மற்றொரு தொட்டியைக் கண்டறியவும்.",
        maintenanceRequired: "பராமரிப்பு தேவை",
        maintenanceMessage: "இந்த தொட்டி பராமரிப்புக்காக தற்காலிகமாக ஆஃப்லைனில் உள்ளது. அசௌகரியத்திற்கு வருந்துகிறோம்.",
        notifyMaintenance: "பராமரிப்பு குழுவை அறிவிக்கவும்",

        // Common
        cancel: "ரத்து செய்",
        back: "பின்னால்",
        close: "மூடு",
        loading: "ஏற்றுகிறது...",
    },

    bn: {
        languageName: "বাংলা",

        // Idle Screen
        welcome: "স্মার্ট ই-বর্জ্য বিনে স্বাগতম",
        tapToStart: "শুরু করতে যেকোনো জায়গায় ট্যাপ করুন",
        binStatus: "বিনের অবস্থা",
        operational: "চালু আছে",
        full: "পূর্ণ",
        maintenance: "রক্ষণাবেক্ষণ প্রয়োজন",
        fillLevel: "ভরাট স্তর",

        // Scan Screen
        scanQRCode: "আপনার QR কোড স্ক্যান করুন",
        positionQR: "আপনার QR কোড ক্যামেরার সামনে রাখুন",
        scanning: "স্ক্যান হচ্ছে...",
        skipScan: "এড়িয়ে যান",
        continueAsGuest: "অতিথি হিসাবে চালিয়ে যান",

        // Deposit Screen
        depositInProgress: "জমা প্রক্রিয়া চলছে",
        placeItem: "আপনার ই-বর্জ্য আইটেম বিনে রাখুন",
        analyzing: "আইটেম বিশ্লেষণ হচ্ছে...",
        itemDetected: "আইটেম সনাক্ত হয়েছে!",
        processingDeposit: "জমা প্রক্রিয়া হচ্ছে...",

        // Complete Screen
        thankYou: "ধন্যবাদ!",
        depositComplete: "আপনার জমা সম্পূর্ণ হয়েছে",
        pointsEarned: "অর্জিত পয়েন্ট",
        points: "পয়েন্ট",
        itemType: "আইটেমের ধরন",
        estimatedWeight: "আনুমানিক ওজন",
        environmentalImpact: "পরিবেশগত প্রভাব",
        co2Saved: "CO₂ সংরক্ষিত",
        returnHome: "হোমে ফিরে যান",

        // Status Messages
        binFull: "বিন পূর্ণ",
        binFullMessage: "এই বিন সর্বোচ্চ ক্ষমতায় পৌঁছেছে। অনুগ্রহ করে কাছাকাছি অন্য বিন খুঁজুন।",
        maintenanceRequired: "রক্ষণাবেক্ষণ প্রয়োজন",
        maintenanceMessage: "এই বিন রক্ষণাবেক্ষণের জন্য সাময়িকভাবে অফলাইন। অসুবিধার জন্য দুঃখিত।",
        notifyMaintenance: "রক্ষণাবেক্ষণ দলকে জানান",

        // Common
        cancel: "বাতিল",
        back: "পিছনে",
        close: "বন্ধ করুন",
        loading: "লোড হচ্ছে...",
    },
};

export const languageOptions: { code: Language; name: string; flag: string }[] = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "hi", name: "हिंदी", flag: "🇮🇳" },
    { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
    { code: "bn", name: "বাংলা", flag: "🇮🇳" },
];
