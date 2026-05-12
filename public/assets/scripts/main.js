/**
 * FARZOON BOT - SMART HANDLER
 */

// ================== THEME INITIALIZATION ==================
// Executed immediately to prevent flash of wrong theme
const savedTheme = localStorage.getItem('farzon_theme');
if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
}

// ================== STATE (CONTEXT MEMORY) ==================
let userContext = {
    lastIntent: null,
    lastTopic: null,
    userType: 'curious', // curious, volunteer, confused
    explanationMode: null, // quick, detailed
    awaitingClarification: false,
    pendingAction: null,
    hasSeenConversionPrompt: false,
    lastQuestionHint: null
};

// ================== SYNONYMS SYSTEM ==================
const intentSynonyms = {
    learn: ["عايز اعرف", "عاوز اعرف", "اعرف", "معلومات", "اشرحلي", "فاهمني", "شرح"],
    volunteer: ["عايز اشارك", "عاوز اشارك", "اشارك", "تطوع", "انزل", "اجي ازاي", "مشاركه"],
    quick: ["بسرعه", "مختصر", "سريع", "هات من الاخر", "الخلاصه", "خلاصه"],
    detailed: ["بالتفصيل", "تفاصيل", "شرح كامل", "كل حاجه", "بالظبط"],
    rescue: ["مش عارف", "مش عارف اسال ايه", "اساعدك ازاي", "ايه الاسئله", "مساعده", "help"],
    flow: ["بتروح فين", "بتتوزع", "بعد الفرز", "بيحصل فيها ايه", "الهدوم الكويسه", "الهدوم الكويسة"],
    farzawi: ["فرزاوي"],
    opinion: ["كويس", "حلو", "وحش", "ولا لا", "احسن"],
    all_roles: ["مسؤولين اللجنه", "مسئولين اللجنه", "تيم الفرز", "فريق الفرز", "الناس بتاعت الفرز", "كلهم", "كله", "الكل", "المسؤولين كلهم", "عاوزهم كلهم", "المسؤولين", "تيم", "التيم", "فريق", "الفريق", "الناس اللي ماسكة"],
    generic_roles: ["مسؤول", "مسئول", "مين ماسك", "مين رئيس", "اللجنه", "مين"],
    schedule: ["ميعاد", "امتي", "امتى", "مواعيد", "بيبدأ", "شغالين", "الساعه", "ايام ايه", "بتفتحوا"],
    categories: ["تصنيفات", "تقسيم", "بتقسموا", "المعارض فيها ايه", "انواع الهدوم"],
    categories_haremy: ["حريمي"],
    categories_winter: ["شتوي"],
    sorting: ["فرز", "هدوم", "تصنيف", "الفرز"],
    social: ["تمام", "حلو", "اوكي", "جاهز", "يلا", "اه", "ايوه", "ياريت", "ماشي"],
    greeting: ["اهلا", "سلام", "هاي", "مرحبا", "صباح", "مسا", "عامل ايه", "اخبارك", "ازيك", "كيفك"]
};

// ================== KNOWLEDGE BASE ==================
const knowledgeBase = {
    "📦 الفرز بيعمل ايه؟": "بص يا نجم 😎 الفرز باختصار إن الهدوم بتيجي في شكاير، وإحنا بنصنفها لـ 3 أنواع (كساء، معارض، تالف) عشان كل حاجة تروح مكانها الصح ✌️",
    "👕 يعني ايه كساء؟": "👕 **الكساء**:\nدي الهدوم اللي جودتها ممتازة وشبه الجديدة. بنوزعها **مجاناً** مرتين في السنة على الأسر عشان نفرحهم في المناسبات 🌟",
    "🛍️ المعارض يعني ايه؟": "🛍️ **المعارض**:\nدي هدوم حالتها كويسة بس اتلبست قبل كده. بنعمل بيها معارض بأسعار رمزية جداً عشان نحافظ على كرامة الناس.\n💡 **أهم حاجة**: الفلوس دي بترجع للجمعية عشان نشتري بيها هدوم جديدة للأسر 👌",
    "♻️ التالف بيعمل ايه؟": "♻️ **التالف**:\nدي الهدوم المقطعة. بنبيعها لعمال بيستفيدوا من (الزراير والسوست)، والباقي بيروح مصانع تدوير لخيوط.\n💡 **أهم حاجة**: مفيش حاجة عندنا بتترمي، والعائد بيرجع يفيدنا تاني! 😎",

    "👤 مسؤول فرزاوي": "مسؤول فرزاوي هو مروان 🎯",
    "👤 مسؤول الفرز": "مسؤول اللجنة (الفرز) هو معاذ 👌",
    "📱 مسؤول الميديا": "مسؤول الميديا هو علي 🎬",
    "🏢 مسؤول الباك يارد": "مسؤول الباك يارد هي هاجر 🏢",
    "🤝 مسؤول HR": "مسؤول الـ HR هو ايمان\nونائب المسؤول هو ريماس 🤝",
    "🏢 مسؤول المشاريع": "مسؤول المشاريع هي أميرة 💼",
    "🏢 مسؤول المخازن": "مسؤول المخازن هو يس 📦",

    "⏰ مواعيد الفرز": "خدها مني على السريع 👇\nإحنا موجودين كل يوم من 11 الصبح لـ 6 المغرب، **ماعدا يوم الجمعة**.\nمكانا فين؟ في الباك يارد ياريس 📍",

    "🤖 انت مين؟": "أنا فرزون 🤖 صاحبك ومساعدك الذكي اللي هنا يجاوبك على أي حاجة تخص الفرز في رسالة 😎",
    "⚙️ بتعمل ايه؟": "مهمتي أوفر عليك وقتك! أي حاجة عايز تعرفها عن المواعيد، المسؤولين، أو نظام الفرز... أنا موجود أقولهالك في ثانية ⚡"
};

// ================== INTENT SYSTEM ==================

function normalize(text) {
    return text
        .trim()
        .toLowerCase()
        // Remove diacritics
        .replace(/[\u064B-\u065F]/g, '')
        .replace(/[؟?!.,]/g, '')
        .replace(/\s+/g, ' ')
        // Normalize Arabic letters
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        // Remove extra repeated letters
        .replace(/(.)\1{2,}/g, '$1')
        // Typo tolerance
        .replace(/الفرر+ز/g, 'الفرز')
        .replace(/الميدبا/g, 'الميديا');
}

function detectIntentsInSegment(segment, fullText) {
    // 1. Bot Identity (CRITICAL PRIORITY)
    if (segment.includes("فرزون") && (segment.split(' ').includes("مين") || segment.split(' ').includes("انت"))) {
        return [{ type: 'BOT_IDENTITY' }];
    }

    // 2. Smart Assumptions (Removed MAARED_SHORT and KESAA_SHORT to prioritize primary intents)

    // 2.5 Unknown Topic Intercept
    const defKeywords = ["يعني ايه", "يعني اية", "ايه هو", "اية هو", "تعرف ايه", "تعرف اية", "تعريف"];
    const isDef = defKeywords.some(kw => segment.includes(kw)) || 
        ( (segment.trim().startsWith("ايه ") || segment.trim().startsWith("اية ") || segment.trim().startsWith("تعرف ")) 
          && !["مواعيد", "ميعاد", "رايك", "رأيك", "مين", "مسؤول", "مسئول", "اخبار", "بكام", "سعر", "بتعمل"].some(w => segment.includes(w)) );

    if (isDef) {
        const knownDefs = ["كساء", "معارض", "معرض", "تالف", "فرز", "رساله", "رسالة"];
        const hasKnownDef = knownDefs.some(kw => segment.includes(kw));
        
        if (!hasKnownDef) {
            if (fullText && fullText.includes("فرزاوي")) {
                return [{ type: 'FARZAWI_DEFINITION' }];
            }
            return [{ type: 'UNKNOWN_TOPIC' }];
        }
    }

    // 3. Clarification Handling
    if (userContext.awaitingClarification) {
        if (segment.includes("كساء")) return [{ type: 'KNOWLEDGE', key: '👕 يعني ايه كساء؟' }];
        if (segment.includes("معارض")) return [{ type: 'KNOWLEDGE', key: '🛍️ المعارض يعني ايه؟' }];
    }

    // 4. Resala Info
    if (segment.includes("رساله") || segment.includes("رسالة")) {
        return [{ type: 'RESALA_INFO' }];
    }

    // 4.5 Farzawi specific handling
    if (segment.includes("فرزاوي")) {
        const words = segment.split(' ');
        const isResp = ["مسؤول", "مسئول", "مين"].some(w => words.includes(w)) || segment.includes("مسؤول") || segment.includes("مسئول");
        const isEvent = ["امتى", "امتي", "فيه", "هتحصل", "ميعاد", "مواعيد", "شغالين", "بتفتحوا"].some(w => segment.includes(w));
        const isDefLocal = ["يعني ايه", "يعني اية", "تعريف", "يعني"].some(w => segment.includes(w)) || 
                           (["ايه", "اية"].some(w => segment.includes(w)) && !isEvent && !isResp);

        let matched = [];
        if (isResp) matched.push({ type: 'KNOWLEDGE', key: '👤 مسؤول فرزاوي' });
        if (isEvent) matched.push({ type: 'FARZAWI_EVENT' });
        if (isDefLocal) matched.push({ type: 'FARZAWI_DEFINITION' });

        if (matched.length > 0) return matched;
    }

    // 5. Specific Roles
    const roleIntents = [
        { key: "👤 مسؤول الفرز", keywords: ['مسؤول الفرز', 'مسئول الفرز', 'مسؤول اللجنه', 'مسئول اللجنه', 'مسؤول اللجنة', 'مسئول اللجنة', 'مين في الفرز', 'رئيس الفرز', 'بتاع الفرز'] },
        { key: "📱 مسؤول الميديا", keywords: ['ميديا', 'الميديا', 'تصوير'] },
        { key: "🏢 مسؤول الباك يارد", keywords: ['باك يارد', 'باكيارد'] },
        { key: "🤝 مسؤول HR", keywords: ['hr', 'اتش ار', 'ايمان', 'ريماس'] },
        { key: "🏢 مسؤول المشاريع", keywords: ['مشاريع', 'المشاريع', 'اميره'] },
        { key: "🏢 مسؤول المخازن", keywords: ['مخازن', 'المخازن', 'يس'] }
    ];
    for (let intent of roleIntents) {
        if (intent.keywords.some(kw => {
            if (kw === 'يس' || kw === 'hr') return segment.split(' ').includes(kw);
            return segment.includes(kw);
        })) {
            return [{ type: 'KNOWLEDGE', key: intent.key }];
        }
    }

    // 5.5 Schedule Intent
    if (intentSynonyms.schedule.some(kw => segment.includes(kw))) return [{ type: 'KNOWLEDGE', key: '⏰ مواعيد الفرز' }];

    // 6. Specific Sorting Knowledge (Non-roles)
    const sortingIntents = [
        { key: "🤖 انت مين؟", keywords: ['انت مين', 'اسمك', 'عرفني بنفسك', 'مين فرزون', 'من انت'] },
        { key: "⚙️ بتعمل ايه؟", keywords: ['بتعمل ايه', 'فائدتك', 'مهمتك', 'وظيفتك', 'بتساعد ازاي'] },
        { key: "📦 الفرز بيعمل ايه؟", keywords: ['الفرز بيعمل ايه', 'يعني ايه فرز', 'الفرز عباره عن', 'شرح الفرز', 'الفرز'] },
        { key: "👕 يعني ايه كساء؟", keywords: ['كساء', 'الكساء', 'يعني ايه كساء', 'تفاصيل الكساء', 'ملابس الكساء'] },
        { key: "🛍️ المعارض يعني ايه؟", keywords: ['معارض', 'معرض', 'المعارض', 'شرح المعارض', 'يعني ايه معرض'] },
        { key: "♻️ التالف بيعمل ايه؟", keywords: ['تالف', 'التالف', 'اعاده تدوير', 'تدوير', 'زراير'] }
    ];
    for (let intent of sortingIntents) {
        if (intent.keywords.some(kw => segment.includes(kw))) {
            return [{ type: 'KNOWLEDGE', key: intent.key }];
        }
    }

    // 7. Action Intents
    if (intentSynonyms.rescue.some(kw => segment.includes(kw))) return [{ type: 'RESCUE' }];
    if (intentSynonyms.learn.some(kw => segment.includes(kw))) return [{ type: 'LEARN' }];
    if (intentSynonyms.volunteer.some(kw => segment.includes(kw))) return [{ type: 'VOLUNTEER' }];
    if (intentSynonyms.quick.some(kw => segment.includes(kw))) return [{ type: 'MODE_QUICK' }];
    if (intentSynonyms.detailed.some(kw => segment.includes(kw))) return [{ type: 'MODE_DETAILED' }];
    if (intentSynonyms.flow.some(kw => segment.includes(kw))) return [{ type: 'FLOW' }];
    
    if (intentSynonyms.categories.some(kw => segment.includes(kw))) return [{ type: 'CATEGORIES_GENERAL' }];
    if (intentSynonyms.categories_haremy.some(kw => segment.includes(kw))) return [{ type: 'CATEGORIES_HAREMY' }];
    if (intentSynonyms.categories_winter.some(kw => segment.includes(kw))) return [{ type: 'CATEGORIES_WINTER' }];

    // 8. General Intents
    if (intentSynonyms.farzawi.some(kw => segment.includes(kw))) return [{ type: 'FARZAWI_EVENT' }];
    if (intentSynonyms.opinion.some(kw => segment.includes(kw)) || segment.split(' ').includes('ولا')) return [{ type: 'OPINION' }];
    if (intentSynonyms.all_roles.some(kw => segment.includes(kw))) return [{ type: 'ALL_ROLES' }];
    if (intentSynonyms.generic_roles.some(kw => segment.split(' ').includes(kw))) return [{ type: 'CLARIFY_ROLE' }];
    if (intentSynonyms.greeting.some(kw => segment.includes(kw))) return [{ type: 'GREETING' }];
    if (intentSynonyms.social.some(kw => segment === kw || segment.split(' ').includes(kw))) return [{ type: 'SOCIAL' }];

    // 9. Fallback
    return [{ type: 'FALLBACK' }];
}

function isNegative(normalizedText) {
    const exactMatches = ["لا", "لأ", "مش", "مش دلوقتي", "مش عايز", "no", "شكرا", "لا شكرا", "بلاش"];
    if (exactMatches.includes(normalizedText)) return true;
    if (normalizedText.includes("مش دلوقتي") || normalizedText.includes("مش عايز") || normalizedText.includes("لا شكرا")) return true;
    if (normalizedText.startsWith("لا ") || normalizedText.startsWith("مش ")) return true;
    if (normalizedText.split(' ').includes("no")) return true;
    return false;
}

function handleMessage(text) {
    console.log("INPUT:", text);

    // 1) Normalize input
    const normalizedText = normalize(text);

    // 1.5) Handle late confirmation
    const isConfirmGlobal = intentSynonyms.social.some(kw => normalizedText === kw || normalizedText.split(' ').includes(kw));
    if (!userContext.pendingAction && userContext.lastQuestionHint && isConfirmGlobal) {
        userContext.pendingAction = userContext.lastQuestionHint;
        userContext.lastQuestionHint = null; // Auto clear after use
    }

    // 2) Handle pending actions (if any)
    if (userContext.pendingAction) {
        const isConfirm = intentSynonyms.social.some(kw => normalizedText === kw || normalizedText.split(' ').includes(kw));
        const isNeg = isNegative(normalizedText);
        
        const action = userContext.pendingAction;
        userContext.pendingAction = null; // Clear immediately
        
        // Save for late confirmation unless it's being confirmed right now
        if (!isConfirm) {
            userContext.lastQuestionHint = action;
        } else {
            userContext.lastQuestionHint = null;
        }
        
        if (isConfirm) {
            if (action === 'explain_flow') {
                userContext.lastTopic = 'sorting';
                const response = "بص يا نجم، الهدوم الممتازة بتروح (كساء) وتتوزع مجاناً، واللي حالتها كويسة بتروح (معارض) وتتباع رمزي، والمقطعة بتروح (تالف) عشان تتعاد تدويرها 😎";
                console.log("FINAL RESPONSE:", response);
                return response;
            } else if (action === 'conversion_prompt') {
                const response = `
<div class="join-groups-inline">
    <div class="join-groups-header">
        <strong class="join-groups-title">حلو جدًا 👌</strong><br>
        <span class="join-groups-subtitle">دي الأماكن اللي بنتجمع فيها 👇</span>
    </div>
    <div class="join-groups-buttons">
        <a href="https://chat.whatsapp.com/EHUJW4jJTTREjOtdOpUUjp" target="_blank" class="social-btn whatsapp-btn-new">
            <svg class="social-icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.073.043.423-.101.827z"/>
            </svg>
            <span>جروب الواتساب</span>
        </a>
        <a href="https://www.facebook.com/groups/755347481564802/?ref=share&mibextid=NSMWBT" target="_blank" class="social-btn facebook-btn-new">
            <svg class="social-icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
            </svg>
            <span>جروب الفيسبوك</span>
        </a>
    </div>
</div>
`;
                userContext.lastTopic = 'conversion_success';
                console.log("FINAL RESPONSE:", response);
                return response;
            }
        } else if (isNeg) {
            if (action === 'conversion_prompt') {
                const response = "تمام ولا يهمك 👌<br>تحب تعرف أكتر عن الفرز الأول؟";
                userContext.lastTopic = 'start';
                console.log("FINAL RESPONSE:", response);
                return response;
            }
            const randomPickLocal = (arr) => arr[Math.floor(Math.random() * arr.length)];
            const response = randomPickLocal([
                "تمام 👌 تحب نكمل في ايه؟",
                "اشطا 👍 طب تحب تعرف عن ايه تاني؟",
                "براحتك 😄 قولّي نروح لأنهي موضوع؟"
            ]);
            console.log("FINAL RESPONSE:", response);
            return response;
        }
    }

    // 3) Detect intent
    const segments = normalizedText.split(/\s+و\s*|،|,/g).map(s => s.trim()).filter(s => s.length > 0);
    if (segments.length === 0) segments.push(normalizedText);

    let allIntents = [];
    for (const segment of segments) {
        const matchedIntents = detectIntentsInSegment(segment, normalizedText);
        if (matchedIntents && matchedIntents.length > 0) {
            for (const intent of matchedIntents) {
                if (intent.type !== 'FALLBACK') {
                    allIntents.push(intent);
                }
            }
        }
    }

    // Remove duplicates
    const uniqueIntentsMap = new Map();
    for (const intent of allIntents) {
        const uniqueKey = intent.type + (intent.key ? '_' + intent.key : '');
        if (!uniqueIntentsMap.has(uniqueKey)) {
            uniqueIntentsMap.set(uniqueKey, intent);
        }
    }
    const uniqueIntents = Array.from(uniqueIntentsMap.values());

    // Order logically: Concepts -> Roles -> Schedule -> Others
    const intentOrder = {
        'RESALA_INFO': 1,
        'KNOWLEDGE_🛍️ المعارض يعني ايه؟': 10,
        'KNOWLEDGE_👕 يعني ايه كساء؟': 11,
        'KNOWLEDGE_📦 الفرز بيعمل ايه؟': 12,
        'KNOWLEDGE_♻️ التالف بيعمل ايه؟': 13,
        'CATEGORIES_GENERAL': 14,
        'CATEGORIES_HAREMY': 15,
        'CATEGORIES_WINTER': 16,
        'FLOW': 17,
        'KNOWLEDGE_👤 مسؤول الفرز': 20,
        'KNOWLEDGE_👤 مسؤول فرزاوي': 21,
        'KNOWLEDGE_📱 مسؤول الميديا': 22,
        'KNOWLEDGE_🏢 مسؤول الباك يارد': 23,
        'KNOWLEDGE_🤝 مسؤول HR': 24,
        'KNOWLEDGE_🏢 مسؤول المشاريع': 25,
        'KNOWLEDGE_🏢 مسؤول المخازن': 26,
        'FARZAWI_EVENT': 28,
        'FARZAWI_DEFINITION': 28.5,
        'ALL_ROLES': 29,
        'KNOWLEDGE_⏰ مواعيد الفرز': 30,
        'UNKNOWN_TOPIC': 40
    };
    function getIntentScore(intent) {
        const key = intent.type === 'KNOWLEDGE' ? `KNOWLEDGE_${intent.key}` : intent.type;
        return intentOrder[key] || 50;
    }
    uniqueIntents.sort((a, b) => getIntentScore(a) - getIntentScore(b));

    console.log("INTENTS:", uniqueIntents);

    userContext.awaitingClarification = false; // reset by default

    let finalResponses = [];
    const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    let needsFollowUp = false;

    // 4) If intents found → return combined response immediately
    if (uniqueIntents.length > 0) {
        for (const intent of uniqueIntents) {
            let res = "";
            switch (intent.type) {
                case 'RESALA_INFO':
                    res = "بص يا سيدي 👇<br>رسالة من أكبر الجمعيات الخيرية في مصر بتقدم خدمات كتير جداً، بس من أهم الأنشطة دي هي (الفرز) 👕<br><br>وده اللي احنا مهتمين بيه هنا.. تحب أشرحلك الفرز بيتم إزاي؟ 👀";
                    userContext.lastTopic = 'resala';
                    userContext.pendingAction = 'explain_flow';
                    break;

                case 'BOT_IDENTITY':
                    res = "أنا فرزون 🤖 مساعدك الذكي هنا عشان أساعدك تعرف كل حاجة عن الفرز في جمعية رسالة بشكل بسيط وسريع 😎";
                    userContext.lastTopic = 'start';
                    break;

                case 'GREETING':
                    res = "أهلاً بيك 👋<br>تحب تفهم الفرز بيتم إزاي ولا تعرف دورك فيه؟ 👀";
                    userContext.lastIntent = 'greeting';
                    userContext.lastTopic = 'start';
                    break;

                case 'LEARN':
                    res = "تحب الشرح بسرعة ولا بالتفصيل؟ 👀";
                    userContext.lastIntent = 'learn';
                    userContext.lastTopic = 'learning_mode';
                    userContext.userType = 'curious';
                    break;

                case 'VOLUNTEER':
                    res = "عاش يا فرزاوي! 💪 المكان منور بيك.<br>مواعيدنا كل يوم من 11 لـ 6 ماعدا الجمعة.<br>تحب تعرف أكتر عن اللجان والمسؤولين ولا المواعيد؟";
                    userContext.lastIntent = 'volunteer';
                    userContext.lastTopic = 'volunteer';
                    userContext.userType = 'volunteer';
                    break;

                case 'MODE_QUICK':
                case 'MODE_DETAILED':
                    userContext.explanationMode = intent.type === 'MODE_QUICK' ? 'quick' : 'detailed';
                    userContext.lastTopic = 'sorting_explained';
                    
                    if (userContext.explanationMode === 'quick') {
                        res = "الفرز بنقسم فيه الهدوم 3 أنواع: (كساء، معارض، وتالف).<br>تحب تعرف الهدوم دي بتروح فين؟ 👀";
                        userContext.pendingAction = 'explain_flow';
                    } else {
                        res = "بص يا سيدي:<br>بنستلم الشكاير، وكل حتة بنشوف حالتها:<br>لو ممتازة ⬅️ بتبقى كساء للأسر.<br>لو كويسة ⬅️ بتبقى معارض بأسعار رمزية.<br>لو مقطعة ⬅️ بتبقى تالف للتدوير.<br>💡 أهم حاجة: الفلوس بترجع للجمعية عشان نجيب بيها هدوم تاني.<br>تحب تعرف تفاصيل أكتر عن كل نوع؟ 👀";
                    }
                    break;

                case 'RESCUE':
                    res = "ولا يهمك يا فرزاوي! 💡<br>دي أهم الحاجات اللي ممكن تسألني فيها:";
                    userContext.lastTopic = 'rescue';
                    break;

                case 'FLOW':
                    if (normalizedText.includes('كويس') || normalizedText.includes('نضيف') || userContext.lastTopic === 'kesaa') {
                        res = "الهدوم الكويسة 👌 بتروح للكساء<br>وده بيتوزع مجانًا على الأسر المستحقة مرتين في السنة 💙";
                        userContext.lastTopic = 'kesaa';
                    } else if (normalizedText.includes('معارض') || userContext.lastTopic === 'maared' || userContext.lastTopic === 'maared_clarify') {
                        res = "المعارض بتروح لقرى محتاجة<br>وبتتباع بأسعار رمزية عشان نحافظ على كرامة الناس 💪";
                        userContext.lastTopic = 'maared';
                    } else if (userContext.lastTopic === 'sorting' || userContext.lastTopic === 'categories' || userContext.lastTopic === 'sorting_explained') {
                        res = "بص يا نجم، الهدوم الممتازة بتروح (كساء) وتتوزع مجاناً، واللي حالتها كويسة بتروح (معارض) وتتباع رمزي، والمقطعة بتروح (تالف) عشان تتعاد تدويرها 😎";
                        userContext.lastTopic = 'sorting';
                    } else {
                        res = "تقصد الكساء ولا المعارض؟ 👀";
                        userContext.awaitingClarification = true;
                        userContext.lastTopic = 'clarify_flow';
                    }
                    break;

                case 'OPINION':
                    res = randomPick([
                        "بص يا معلم 😎<br>الفرز من أحلى اللجان بصراحة، شغل مفيد وجو حلو والناس فيه زي الفل 👌<br>بس في الآخر جرب بنفسك وشوف أنت ترتاح فين 💪",
                        "الفرز جامد والله 🔥<br>بس برضه كل لجنة ليها جوها، انزل وجرب وانت اللي هتحكم 😉"
                    ]);
                    userContext.lastTopic = 'opinion';
                    break;

                case 'CATEGORIES_GENERAL':
                    res = "احنا بنقسم الهدوم لـ 3 حاجات (كساء، معارض، تالف).<br>المعارض فيها: حريمي، رجالي، اطفال، احذية، شنط، ومفروشات...<br>تحب تعرف الهدوم دي بتروح فين؟ 👀";
                    userContext.lastTopic = 'categories';
                    userContext.pendingAction = 'explain_flow';
                    break;

                case 'CATEGORIES_HAREMY':
                    res = "الحريمي يا سيدي هو أي لبس بناتي أو حريمي بينزل المعارض 👗<br>بنعزله لوحده عشان يتفرز ويتجهز صح 👌";
                    userContext.lastTopic = 'categories';
                    break;

                case 'CATEGORIES_WINTER':
                    res = "سؤال حلو! الشتوي بيطلع في الصيف عشان بيتم تخزينه للموسم بتاعه ❄️<br>بنجهزه ونعينه عشان اول ما الشتا يدخل يكون جاهز يتوزع في المعارض أو الكساء 💪";
                    userContext.lastTopic = 'categories';
                    break;

                case 'FARZAWI_EVENT':
                    res = "حالياً فرزاوي واقفة شوية وهترجع بعد الامتحانات 💪🔥";
                    userContext.lastTopic = 'events';
                    break;

                case 'FARZAWI_DEFINITION':
                    res = "فرزاوي هي حملة بتقوم بيها لجنة الفرز 👕<br>بتكون يوم الجمعة وبتبقى يوم تجمع كبير لكل متطوعين الفرز 💪🔥<br><br>وبيكون فيه فعاليات كتير خلال اليوم 👀";
                    userContext.lastTopic = 'events';
                    break;

                case 'SOCIAL':
                    res = randomPick([
                        "حبيبي 👌 تحب نكمل في ايه؟",
                        "تسلم يا غالي ❤️ في حاجة تانية اقدر اساعدك فيها؟"
                    ]);
                    break;

                case 'ALL_ROLES':
                    res = getAllRolesText();
                    userContext.lastTopic = 'roles';
                    break;

                case 'CLARIFY_ROLE':
                    if (userContext.lastTopic === 'roles') {
                        res = getAllRolesText();
                    } else {
                        res = "تحب تعرف مسؤول مين؟ ولا أقولك كلهم مرة واحدة؟ 👀";
                        userContext.awaitingClarification = true;
                    }
                    userContext.lastTopic = 'roles';
                    break;

                case 'KNOWLEDGE':
                    res = knowledgeBase[intent.key];
                    if (intent.key.includes('مواعيد')) userContext.lastTopic = 'schedule';
                    else if (intent.key.includes('مسؤول')) userContext.lastTopic = 'roles';
                    else if (intent.key.includes('كساء')) userContext.lastTopic = 'kesaa';
                    else if (intent.key.includes('المعارض')) userContext.lastTopic = 'maared';
                    else userContext.lastTopic = 'sorting';
                    
                    // Track if we need to append the follow-up question
                    if (intent.key.includes('الفرز بيعمل ايه') || intent.key.includes('يعني ايه كساء') || intent.key.includes('المعارض يعني ايه') || intent.key.includes('التالف بيعمل ايه')) {
                        needsFollowUp = true;
                    }
                    break;
                    
                case 'UNKNOWN_TOPIC':
                    res = "المعلومة دي مش عندي حالياً 🤔<br>تقدر تسأل حد من المسؤولين وهيساعدك أكتر 💪";
                    userContext.lastTopic = 'start';
                    break;
            }
            if (res) finalResponses.push(res);
        }

        if (finalResponses.length > 0) {
            let finalResponseText = "";
            if (finalResponses.length === 1) {
                finalResponseText = finalResponses[0];
            } else {
                const cleanedResponses = finalResponses.map(r => {
                    return r.replace(/بص يا سيدي 👇<br>/g, '')
                            .replace(/بص يا معلم 😎<br>/g, '')
                            .replace(/^بص يا نجم، /g, '')
                            .replace(/^خدها مني على السريع 👇\n/g, '')
                            .replace(/بص يا سيدي:<br>/g, '')
                            .replace(/<br><br>وده اللي احنا مهتمين بيه هنا.. تحب أشرحلك الفرز بيتم إزاي؟ 👀/g, '')
                            .replace(/<br>تحب تعرف الهدوم دي بتروح فين؟ 👀/g, '')
                            .replace(/<br>تحب تعرف تفاصيل أكتر عن كل نوع؟ 👀/g, '')
                            .trim();
                });
                finalResponseText = "بص يا معلم 👇<br><br>" + cleanedResponses.map(r => "• " + r).join("<br><br>");
            }

            // Append auto follow-up only once at the end
            if (needsFollowUp) {
                if (!userContext.hasSeenConversionPrompt) {
                    finalResponseText += "<br><br>على فكرة في ناس كتير بتيجي تجرب معانا أول مرة وبتحب الموضوع جدًا 👕🔥<br>تحب تبقى معاهم المرة الجاية؟ 👀";
                    userContext.pendingAction = 'conversion_prompt';
                    userContext.hasSeenConversionPrompt = true;
                    userContext.lastTopic = 'conversion_prompt';
                } else {
                    finalResponseText += "<br><br>تحب تعرف الهدوم دي بتروح فين؟ 👀";
                    userContext.pendingAction = 'explain_flow';
                }
            }

            console.log("FINAL RESPONSE:", finalResponseText);
            return finalResponseText;
        }
    }

    // 5) If no intent → fallback
    userContext.userType = 'confused';
    userContext.lastTopic = 'start';
    const fallbackResponse = "مش واضحلي أوي 🤔<br>تحب تعرف عن الفرز ولا تشارك معانا؟ 👀";
    console.log("FINAL RESPONSE:", fallbackResponse);
    return fallbackResponse;
}

function getAllRolesText() {
    return "مسؤولين اللجنة 👇<br><br>" +
        "• الفرز: معاذ<br>" +
        "• الميديا: علي<br>" +
        "• المشاريع: أميرة<br>" +
        "• الباك يارد: هاجر<br>" +
        "• HR: ايمان<br>" +
        "• نائب HR: ريماس<br>" +
        "• المخازن: يس<br>" +
        "• فرزاوي: مروان";
}

// ================== UI HANDLER ==================

let isLoading = false;

function showLoading() {
    if (isLoading) return;
    isLoading = true;

    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const typingDiv = document.createElement('div');
    typingDiv.id = 'loading';
    typingDiv.className = 'typing-indicator-wrapper';
    typingDiv.innerHTML = `
        <img src="./assets/images/chatbot-avatar.png" alt="فرزون" class="msg-avatar-img" onerror="this.src='./assets/images/chatbot-avatar.png'; this.onerror=null;">
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
}

function removeLoading() {
    const loader = document.getElementById('loading');
    if (loader) {
        loader.remove();
    }
    isLoading = false;
}

document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const loadingScreen = document.getElementById('loading-screen');

    // Loading Screen Logic
    setTimeout(() => {
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => loadingScreen.remove(), 500); // Remove from DOM after transition
        }

        // Render daily mood status
        if (typeof DailyMood !== 'undefined') {
            DailyMood.render();
        }

        // Init achievements system
        if (typeof Achievements !== 'undefined') {
            Achievements.init();
        }

        // Init UI & First Message
        initSuggestions();
        setTimeout(() => {
            showLoading();
            setTimeout(() => {
                removeLoading();
                addMessage("أهلاً بيك 👋<br>تحب تفهم الفرز بيتم إزاي ولا تعرف دورك فيه؟ 👀", 'bot');
                userContext.lastTopic = 'start';
                updateSuggestions();
            }, 1200);
        }, 500);
    }, 1500);

    // ================== SIDEBAR & THEME LOGIC ==================
    const optionsBtn = document.getElementById('options-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    
    // Menu Buttons
    const menuHome = document.getElementById('menu-home');
    const menuGame = document.getElementById('menu-game');
    const menuTheme = document.getElementById('menu-theme');
    const menuReset = document.getElementById('menu-reset');
    const menuAbout = document.getElementById('menu-about');
    const themeIcon = document.getElementById('theme-icon');

    // Initialize Theme Icon
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
        if (themeIcon) themeIcon.innerText = '☀️';
    }

    function closeSidebar() {
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    }

    if (optionsBtn && sidebarOverlay && closeSidebarBtn) {
        optionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebarOverlay.classList.add('active');
        });

        closeSidebarBtn.addEventListener('click', closeSidebar);
        
        // Click outside to close
        sidebarOverlay.addEventListener('click', (e) => {
            if (e.target === sidebarOverlay) closeSidebar();
        });
    }

    if (menuHome) menuHome.addEventListener('click', closeSidebar);

    if (menuGame) {
        menuGame.addEventListener('click', () => {
            closeSidebar();
            if (window.openGameOverlay) {
                window.openGameOverlay();
            } else {
                addMessage("الميزة دي لسه بتتحمل 🤔", 'bot');
            }
        });
    }

    // Achievements Gallery
    const menuAchievements = document.getElementById('menu-achievements');
    if (menuAchievements) {
        menuAchievements.addEventListener('click', () => {
            closeSidebar();
            if (typeof Achievements !== 'undefined' && Achievements.openGallery) {
                Achievements.openGallery();
            }
        });
    }

    if (menuTheme) {
        menuTheme.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('farzon_theme', 'light');
                if (themeIcon) themeIcon.innerText = '🌙';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('farzon_theme', 'dark');
                if (themeIcon) themeIcon.innerText = '☀️';
            }
        });
    }

    if (menuReset) {
        menuReset.addEventListener('click', () => {
            // Confirm before reset just in case
            if (confirm("متأكد إنك عايز تمسح ذاكرة المحادثة؟")) {
                localStorage.removeItem('farzon_session');
                window.location.reload();
            }
        });
    }

    if (menuAbout) {
        menuAbout.addEventListener('click', () => {
            closeSidebar();
            addMessage("ℹ️ عن فرزون", 'user');
            showLoading();
            setTimeout(() => {
                removeLoading();
                addMessage(knowledgeBase["🤖 انت مين؟"], 'bot');
            }, 1000);
        });
    }

    // Input Event Listeners
    userInput.focus();
    sendBtn.addEventListener('click', () => handleSend(userInput.value));
    
    // Auto-resize and validation
    userInput.addEventListener('input', () => {
        sendBtn.disabled = userInput.value.trim() === '';
        
        // Auto resize textarea
        userInput.style.height = 'auto';
        userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
    });

    // Handle Enter key for Mobile vs Desktop
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const isMobile = window.innerWidth <= 768 || /Mobi|Android|iPhone/i.test(navigator.userAgent);
            
            if (isMobile) {
                // On mobile: Let Enter create a new line (default behavior)
                // Do not send, only the send button sends
                return;
            } else {
                // On desktop: Shift+Enter creates a new line, Enter sends
                if (!e.shiftKey) {
                    e.preventDefault(); // Prevent default new line
                    handleSend(userInput.value);
                }
            }
        }
    });

    function updateSuggestions() {
        const quickSuggestions = document.getElementById('quick-suggestions');
        if (!quickSuggestions) return;
        quickSuggestions.innerHTML = '';

        let suggestionKeys = [];
        const topic = userContext.lastTopic;
        
        if (topic === 'start') {
            suggestionKeys = ["الفرز بيعمل ايه", "عايز أشارك", "🔍 مش عارف تسأل ايه؟"];
        } else if (topic === 'conversion_prompt') {
            suggestionKeys = ["اه 👌", "مش دلوقتي"];
        } else if (topic === 'conversion_success') {
            suggestionKeys = ["📦 الفرز بيعمل ايه؟", "⏰ مواعيد الفرز", "👥 كل المسؤولين"];
        } else if (topic === 'learning_mode') {
            suggestionKeys = ["بسرعة", "بالتفصيل"];
        } else if (topic === 'volunteer') {
            suggestionKeys = ["⏰ مواعيد الفرز", "👥 كل المسؤولين", "📦 الفرز بيعمل ايه؟"];
        } else if (topic === 'sorting_explained' || topic === 'categories' || topic === 'sorting') {
            suggestionKeys = ["يعني ايه كساء؟", "المعارض بتروح فين؟", "التالف بيتعمل بيه ايه؟", "🔍 مش عارف تسأل ايه؟"];
        } else if (topic === 'maared_clarify') {
            suggestionKeys = ["المعارض ايه؟", "المعارض بتروح فين؟"];
        } else if (topic === 'kesaa_clarify') {
            suggestionKeys = ["الكساء ايه؟", "الكساء بيتوزع ازاي؟"];
        } else if (topic === 'roles') {
            suggestionKeys = ["📱 مسؤول الميديا", "👥 كل المسؤولين", "🔍 مش عارف تسأل ايه؟"];
        } else if (topic === 'schedule' || topic === 'events') {
            suggestionKeys = ["⏰ مواعيد الفرز", "🎯 فرزاوي امتى", "🔍 مش عارف تسأل ايه؟"];
        } else if (topic === 'resala') {
            suggestionKeys = ["📦 الفرز بيعمل ايه؟", "👕 يعني ايه كساء؟", "🛍️ المعارض يعني ايه؟"];
        } else if (topic === 'rescue') {
            suggestionKeys = ["📦 الفرز بيعمل ايه؟", "⏰ مواعيد الفرز", "👥 كل المسؤولين"];
        } else {
            suggestionKeys = ["📦 الفرز بيعمل ايه؟", "⏰ مواعيد الفرز", "👥 كل المسؤولين", "🔍 مش عارف تسأل ايه؟"];
        }

        suggestionKeys.forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'chip';
            btn.innerText = key;
            btn.addEventListener('click', () => {
                const cleanText = key.replace(/[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}]/gu, '').replace(/[؟?]/g, '').trim();
                handleSend(cleanText);
            });
            quickSuggestions.appendChild(btn);
        });
    }

    function initSuggestions() {
        // Will be updated dynamically after bot messages
    }

    // Get or create a persistent session ID for the user
    let sessionId = localStorage.getItem('farzon_session');
    if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        localStorage.setItem('farzon_session', sessionId);
    }

    async function getBackendReply(message) {
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message, sessionId })
        });
        const data = await response.json();
        return data; // Return full object {reply, topic}
    }

    async function handleSend(text) {
        text = text.trim();
        if (text === '') return;

        userInput.value = '';
        userInput.style.height = 'auto'; // Reset textarea height
        sendBtn.disabled = true;
        userInput.focus();

        addMessage(text, 'user');

        // Track message for achievements
        if (typeof Achievements !== 'undefined') {
            Achievements.track('message');
        }

        // FAST INPUT PROTECTION
        if (isLoading) removeLoading();
        showLoading();
        const delay = Math.floor(Math.random() * 800) + 800; // Snappier response

        // Initiate backend fetch immediately (non-blocking)
        const fetchPromise = getBackendReply(text).catch(err => {
            console.error("Backend error:", err);
            return null;
        });

        setTimeout(async () => {
            let botReply;
            const backendData = await fetchPromise;
                
            // if backend gives valid response → use it and update topic
            if (backendData && backendData.reply && backendData.reply.trim() !== "") {
                botReply = backendData.reply;
                if (backendData.topic) {
                    userContext.lastTopic = backendData.topic;
                }
            } else {
                // fallback to old logic
                botReply = handleMessage(text);
            }

            // Fake typing personality — occasional hesitation effect
            if (typeof FakeTyping !== 'undefined' && FakeTyping.shouldUse(botReply)) {
                await FakeTyping.execute(showLoading, removeLoading);
            } else {
                removeLoading();
            }

            addMessage(formatText(botReply), 'bot');
            updateSuggestions();
        }, delay);
    }

    function formatText(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    function addMessage(htmlContent, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        let avatarHtml = '';
        if (sender === 'bot') {
            avatarHtml = `<img src="./assets/images/chatbot-avatar.png" alt="فرزون" class="msg-avatar-img" onerror="this.src='./assets/images/chatbot-avatar.png'; this.onerror=null;">`;
        }

        const timeString = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

        messageDiv.innerHTML = `
            ${avatarHtml}
            <div class="message-body">
                <div class="message-content">${htmlContent}</div>
                <div class="message-time">${timeString}</div>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    function scrollToBottom() {
        chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
    }
});
