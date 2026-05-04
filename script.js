/**
 * FARZOON BOT - SMART HANDLER
 */

// ================== STATE (CONTEXT MEMORY) ==================
let userContext = {
    lastIntent: null,
    lastTopic: null,
    userType: 'curious', // curious, volunteer, confused
    explanationMode: null, // quick, detailed
    awaitingClarification: false,
    pendingAction: null
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

function detectIntentsInSegment(segment) {
    // 1. Bot Identity (CRITICAL PRIORITY)
    if (segment.includes("فرزون") && (segment.split(' ').includes("مين") || segment.split(' ').includes("انت"))) {
        return [{ type: 'BOT_IDENTITY' }];
    }

    // 2. Smart Assumptions
    if (segment === "معارض" || segment === "المعارض") return [{ type: 'MAARED_SHORT' }];
    if (segment === "كساء" || segment === "الكساء") return [{ type: 'KESAA_SHORT' }];

    // 3. Clarification Handling
    if (userContext.awaitingClarification) {
        if (segment.includes("كساء")) return [{ type: 'KNOWLEDGE', key: '👕 يعني ايه كساء؟' }];
        if (segment.includes("معارض")) return [{ type: 'KNOWLEDGE', key: '🛍️ المعارض يعني ايه؟' }];
    }

    // 4. Resala Info
    if (segment.includes("رسالة") && (segment.split(' ').includes("ايه") || segment.split(' ').includes("مين") || segment.includes("تعرف"))) {
        return [{ type: 'RESALA_INFO' }];
    }

    // 5. Specific Roles
    const roleIntents = [
        { key: "👤 مسؤول فرزاوي", keywords: ['مسؤول فرزاوي', 'مسئول فرزاوي', 'مين فرزاوي', 'بتاع فرزاوي', 'مين مسئول فرزاوي'] },
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
    if (intentSynonyms.schedule.some(kw => segment.includes(kw))) return [{ type: 'KNOWLEDGE', key: '⏰ مواعيد الفرز' }];

    // 8. General Intents
    if (intentSynonyms.farzawi.some(kw => segment.includes(kw))) return [{ type: 'FARZAWI' }];
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

function getResponse(text) {
    const normalizedText = normalize(text);

    // --- EARLY RETURNS (HIGHEST PRIORITY) ---
    if (normalizedText.includes("رساله")) {
        if (typeof removeLoading === 'function') removeLoading();
        userContext.lastTopic = 'resala';
        return "بص يا سيدي 👇<br>• رسالة بدأت سنة 1999 كنشاط طلابي<br>• بقت جمعية خيرية رسمية سنة 2000<br>• دلوقتي ليها أكتر من 60 فرع<br>• وأكتر من 200 ألف متطوع<br>• بتقدم خدمات كتير جداً (أيتام، قوافل طبية، كساء، وغيرها)<br><br>تحب تعرف تفاصيل أكتر عن أنشطة رسالة؟ 👀";
    }
    
    // --- PENDING ACTION SYSTEM ---
    if (userContext.pendingAction) {
        const isConfirm = intentSynonyms.social.some(kw => normalizedText === kw || normalizedText.split(' ').includes(kw));
        const isNeg = isNegative(normalizedText);
        
        const action = userContext.pendingAction;
        userContext.pendingAction = null; // Clear immediately
        
        if (isConfirm) {
            if (action === 'explain_flow') {
                if (typeof removeLoading === 'function') removeLoading();
                userContext.lastTopic = 'sorting';
                return "بص يا نجم، الهدوم الممتازة بتروح (كساء) وتتوزع مجاناً، واللي حالتها كويسة بتروح (معارض) وتتباع رمزي، والمقطعة بتروح (تالف) عشان تتعاد تدويرها 😎";
            }
        } else if (isNeg) {
            if (typeof removeLoading === 'function') removeLoading();
            const randomPickLocal = (arr) => arr[Math.floor(Math.random() * arr.length)];
            return randomPickLocal([
                "تمام 👌 تحب نكمل في ايه؟",
                "اشطا 👍 طب تحب تعرف عن ايه تاني؟",
                "براحتك 😄 قولّي نروح لأنهي موضوع؟"
            ]);
        }
    }
    // -----------------------------

    // --- SINGLE INTENT DETECTION ---
    const matchedIntents = detectIntentsInSegment(normalizedText);
    const intent = matchedIntents[0];

    userContext.awaitingClarification = false; // reset by default

    let finalResponse = "";
    const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    let needsFollowUp = false;

    if (intent) {
        switch (intent.type) {
            case 'BOT_IDENTITY':
                finalResponse = "أنا فرزون 🤖 مساعدك الذكي هنا عشان أساعدك تعرف كل حاجة عن الفرز في جمعية رسالة بشكل بسيط وسريع 😎";
                userContext.lastTopic = 'start';
                break;

            case 'GREETING':
                finalResponse = "أهلاً بيك يا غالي! نورتنا 🌟<br>تحب تعرف عن الفرز ولا تشارك معانا؟ 👀";
                userContext.lastIntent = 'greeting';
                userContext.lastTopic = 'start';
                break;

            case 'LEARN':
                finalResponse = "تحب الشرح بسرعة ولا بالتفصيل؟ 👀";
                userContext.lastIntent = 'learn';
                userContext.lastTopic = 'learning_mode';
                userContext.userType = 'curious';
                break;

            case 'VOLUNTEER':
                finalResponse = "عاش يا بطل! 💪 المكان منور بيك.<br>مواعيدنا كل يوم من 11 لـ 6 ماعدا الجمعة.<br>تحب تعرف أكتر عن اللجان والمسؤولين ولا المواعيد؟";
                userContext.lastIntent = 'volunteer';
                userContext.lastTopic = 'volunteer';
                userContext.userType = 'volunteer';
                break;

            case 'MODE_QUICK':
            case 'MODE_DETAILED':
                userContext.explanationMode = intent.type === 'MODE_QUICK' ? 'quick' : 'detailed';
                userContext.lastTopic = 'sorting_explained';
                
                if (userContext.explanationMode === 'quick') {
                    finalResponse = "الفرز بنقسم فيه الهدوم 3 أنواع: (كساء، معارض، وتالف).<br>تحب تعرف الهدوم دي بتروح فين؟ 👀";
                    userContext.pendingAction = 'explain_flow';
                } else {
                    finalResponse = "بص يا سيدي:<br>بنستلم الشكاير، وكل حتة بنشوف حالتها:<br>لو ممتازة ⬅️ بتبقى كساء للأسر.<br>لو كويسة ⬅️ بتبقى معارض بأسعار رمزية.<br>لو مقطعة ⬅️ بتبقى تالف للتدوير.<br>💡 أهم حاجة: الفلوس بترجع للجمعية عشان نجيب بيها هدوم تاني.<br>تحب تعرف تفاصيل أكتر عن كل نوع؟ 👀";
                }
                break;

            case 'MAARED_SHORT':
                finalResponse = "تقصد عايز تعرف المعارض ايه ولا بتروح فين؟ 👀";
                userContext.awaitingClarification = true;
                userContext.lastTopic = 'maared_clarify';
                break;

            case 'KESAA_SHORT':
                finalResponse = "تقصد عايز تعرف الكساء ايه ولا بيتوزع ازاي؟ 👀";
                userContext.awaitingClarification = true;
                userContext.lastTopic = 'kesaa_clarify';
                break;

            case 'RESCUE':
                finalResponse = "ولا يهمك يا بطل! 💡<br>دي أهم الحاجات اللي ممكن تسألني فيها:";
                userContext.lastTopic = 'rescue';
                break;

            case 'FLOW':
                if (normalizedText.includes('كويس') || normalizedText.includes('نضيف') || userContext.lastTopic === 'kesaa') {
                    finalResponse = "الهدوم الكويسة 👌 بتروح للكساء<br>وده بيتوزع مجانًا على الأسر المستحقة مرتين في السنة 💙";
                    userContext.lastTopic = 'kesaa';
                } else if (normalizedText.includes('معارض') || userContext.lastTopic === 'maared' || userContext.lastTopic === 'maared_clarify') {
                    finalResponse = "المعارض بتروح لقرى محتاجة<br>وبتتباع بأسعار رمزية عشان نحافظ على كرامة الناس 💪";
                    userContext.lastTopic = 'maared';
                } else if (userContext.lastTopic === 'sorting' || userContext.lastTopic === 'categories' || userContext.lastTopic === 'sorting_explained') {
                    finalResponse = "بص يا نجم، الهدوم الممتازة بتروح (كساء) وتتوزع مجاناً، واللي حالتها كويسة بتروح (معارض) وتتباع رمزي، والمقطعة بتروح (تالف) عشان تتعاد تدويرها 😎";
                    userContext.lastTopic = 'sorting';
                } else {
                    finalResponse = "تقصد الكساء ولا المعارض؟ 👀";
                    userContext.awaitingClarification = true;
                    userContext.lastTopic = 'clarify_flow';
                }
                break;

            case 'OPINION':
                finalResponse = randomPick([
                    "بص يا معلم 😎<br>الفرز من أحلى اللجان بصراحة، شغل مفيد وجو حلو والناس فيه زي الفل 👌<br>بس في الآخر جرب بنفسك وشوف أنت ترتاح فين 💪",
                    "الفرز جامد والله 🔥<br>بس برضه كل لجنة ليها جوها، انزل وجرب وانت اللي هتحكم 😉"
                ]);
                userContext.lastTopic = 'opinion';
                break;

            case 'CATEGORIES_GENERAL':
                finalResponse = "احنا بنقسم الهدوم لـ 3 حاجات (كساء، معارض، تالف).<br>المعارض فيها: حريمي، رجالي، اطفال، احذية، شنط، ومفروشات...<br>تحب تعرف الهدوم دي بتروح فين؟ 👀";
                userContext.lastTopic = 'categories';
                userContext.pendingAction = 'explain_flow';
                break;

            case 'CATEGORIES_HAREMY':
                finalResponse = "الحريمي يا سيدي هو أي لبس بناتي أو حريمي بينزل المعارض 👗<br>بنعزله لوحده عشان يتفرز ويتجهز صح 👌";
                userContext.lastTopic = 'categories';
                break;

            case 'CATEGORIES_WINTER':
                finalResponse = "سؤال حلو! الشتوي بيطلع في الصيف عشان بيتم تخزينه للموسم بتاعه ❄️<br>بنجهزه ونعينه عشان اول ما الشتا يدخل يكون جاهز يتوزع في المعارض أو الكساء 💪";
                userContext.lastTopic = 'categories';
                break;

            case 'FARZAWI':
                finalResponse = "فرزاوي واقفة مؤقتًا لحد ما أبطالنا يخلصوا امتحاناتهم 💪🔥";
                userContext.lastTopic = 'events';
                break;

            case 'SOCIAL':
                finalResponse = randomPick([
                    "حبيبي 👌 تحب نكمل في ايه؟",
                    "تسلم يا غالي ❤️ في حاجة تانية اقدر اساعدك فيها؟"
                ]);
                break;

            case 'ALL_ROLES':
                finalResponse = getAllRolesText();
                userContext.lastTopic = 'roles';
                break;

            case 'CLARIFY_ROLE':
                if (userContext.lastTopic === 'roles') {
                    finalResponse = getAllRolesText();
                } else {
                    finalResponse = "تحب تعرف مسؤول مين؟ ولا أقولك كلهم مرة واحدة؟ 👀";
                    userContext.awaitingClarification = true;
                }
                userContext.lastTopic = 'roles';
                break;

            case 'KNOWLEDGE':
                finalResponse = knowledgeBase[intent.key];
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

            case 'FALLBACK':
                break; // Fallback will be handled at the very end
        }
    }

    if (!finalResponse || !intent || intent.type === 'FALLBACK') {
        if (typeof removeLoading === 'function') removeLoading();
        userContext.userType = 'confused';
        userContext.lastTopic = 'start';
        return "مش واضحلي أوي 🤔<br>تحب تعرف عن الفرز ولا تشارك معانا؟ 👀";
    }

    // Append auto follow-up only once at the end
    if (needsFollowUp) {
        finalResponse += "<br><br>تحب تعرف الهدوم دي بتروح فين؟ 👀";
        userContext.pendingAction = 'explain_flow';
    }

    return finalResponse;
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
        <img src="./img/final-look.png" alt="فرزون" class="msg-avatar-img" onerror="this.src='./img/farzoon.png'; this.onerror=null;">
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

        // Init UI & First Message
        initSuggestions();
        setTimeout(() => {
            showLoading();
            setTimeout(() => {
                removeLoading();
                addMessage("أهلاً بيك في فرزون 🤖<br>تحب تعرف عن الفرز ولا تشارك معانا؟ 👀", 'bot');
                userContext.lastTopic = 'start';
                updateSuggestions();
            }, 1200);
        }, 500);
    }, 1500);

    // Options Menu Logic
    const optionsBtn = document.getElementById('options-btn');
    const optionsMenu = document.getElementById('options-menu');
    const aboutBtn = document.getElementById('about-farzoon-btn');

    if (optionsBtn) {
        optionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            optionsMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', () => {
            if (!optionsMenu.classList.contains('hidden')) optionsMenu.classList.add('hidden');
        });

        aboutBtn.addEventListener('click', () => {
            optionsMenu.classList.add('hidden');
            addMessage("🤖 تعريف عن فرزون", 'user');
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
            suggestionKeys = ["عايز أعرف", "عايز أشارك", "🔍 مش عارف تسأل ايه؟"];
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

    function handleSend(text) {
        text = text.trim();
        if (text === '') return;

        userInput.value = '';
        userInput.style.height = 'auto'; // Reset textarea height
        sendBtn.disabled = true;
        userInput.focus();

        addMessage(text, 'user');

        // FAST INPUT PROTECTION
        removeLoading();
        showLoading();
        const delay = Math.floor(Math.random() * 800) + 800; // Snappier response

        setTimeout(() => {
            removeLoading();
            const botReply = getResponse(text);
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
            avatarHtml = `<img src="./img/final-look.png" alt="فرزون" class="msg-avatar-img" onerror="this.src='./img/farzoon.png'; this.onerror=null;">`;
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
