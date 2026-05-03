/**
 * FARZOON BOT - SMART HANDLER
 */

// ================== STATE (CONTEXT MEMORY) ==================
let userContext = {
    lastIntent: null,
    lastTopic: null
};

// ================== SYNONYMS SYSTEM ==================
const intentSynonyms = {
    flow: ["بتروح فين", "بتتوزع", "بعد الفرز", "بيحصل فيها ايه", "الهدوم الكويسه", "الهدوم الكويسة"],
    farzawi: ["فرزاوي"],
    opinion: ["كويس", "حلو", "وحش", "ولا لا", "احسن"],
    all_roles: ["مسؤولين اللجنه", "مسئولين اللجنه", "تيم الفرز", "فريق الفرز", "الناس بتاعت الفرز", "كلهم", "كله", "الكل", "المسؤولين كلهم", "عاوزهم كلهم", "المسؤولين"],
    generic_roles: ["مسؤول", "مسئول", "مين ماسك", "مين رئيس", "اللجنه", "تيم", "فريق", "مين"],
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
    "🛍️ المعارض يعني ايه؟": "🛍️ **المعارض**:\nدي هدوم حالتها كويسة بس اتلبست قبل كده. بنعمل بيها معارض بأسعار رمزية جداً عشان نحافظ على كرامة الناس.\n💡 الفلوس دي بترجع للجمعية عشان نشتري بيها هدوم جديدة للأسر 👌",
    "♻️ التالف بيعمل ايه؟": "♻️ **التالف**:\nدي الهدوم المقطعة. بنبيعها لعمال بيستفيدوا من (الزراير والسوست)، والباقي بيروح مصانع تدوير لخيوط.\n💡 يعني مفيش حاجة عندنا بتترمي، والعائد بيرجع يفيدنا تاني! 😎",

    "👤 مسؤول فرزاوي": "مسؤول فرزاوي هو مروان 🎯",
    "👤 مسؤول الفرز": "مسؤول الفرز هو معاذ 👌",
    "📱 مسؤول الميديا": "مسؤول الميديا هو علي 🎬",
    "🏢 مسؤول الباك يارد": "مسؤول الباك يارد هي هاجر 🏢",
    "🤝 مسؤول HR": "مسؤول الـ HR هي ايمان\nومعاها ريماس كنائب مسؤول 🤝",
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

function detectIntent(normalizedInput) {
    // Priority 1: FLOW (Highest priority to block wrong matching)
    if (intentSynonyms.flow.some(kw => normalizedInput.includes(kw))) return { type: 'FLOW' };

    // Priority 2: SPECIFIC ROLES
    const roleIntents = [
        { key: "👤 مسؤول فرزاوي", keywords: ['مسؤول فرزاوي', 'مسئول فرزاوي', 'مين فرزاوي', 'بتاع فرزاوي', 'مين مسئول فرزاوي'] },
        { key: "👤 مسؤول الفرز", keywords: ['مسؤول الفرز', 'مسئول الفرز', 'مين في الفرز', 'رئيس الفرز', 'بتاع الفرز'] },
        { key: "📱 مسؤول الميديا", keywords: ['ميديا', 'الميديا', 'تصوير'] },
        { key: "🏢 مسؤول الباك يارد", keywords: ['باك يارد', 'باكيارد'] },
        { key: "🤝 مسؤول HR", keywords: ['hr', 'اتش ار', 'ايمان', 'ريماس'] },
        { key: "🏢 مسؤول المشاريع", keywords: ['مشاريع', 'المشاريع', 'اميره'] },
        { key: "🏢 مسؤول المخازن", keywords: ['مخازن', 'المخازن', 'يس'] }
    ];
    for (let intent of roleIntents) {
        if (intent.keywords.some(kw => {
            // Prevent partial substring matching for short names (e.g. "يس" matching inside "كويسه")
            if (kw === 'يس' || kw === 'hr') return normalizedInput.split(' ').includes(kw);
            return normalizedInput.includes(kw);
        })) return { type: 'KNOWLEDGE', key: intent.key };
    }

    if (intentSynonyms.farzawi.some(kw => normalizedInput.includes(kw))) return { type: 'FARZAWI' };

    if (intentSynonyms.opinion.some(kw => normalizedInput.includes(kw)) || normalizedInput.split(' ').includes('ولا')) return { type: 'OPINION' };

    if (intentSynonyms.all_roles.some(kw => normalizedInput.includes(kw))) return { type: 'ALL_ROLES' };
    
    if (intentSynonyms.generic_roles.some(kw => normalizedInput.split(' ').includes(kw))) return { type: 'CLARIFY_ROLE' };

    if (intentSynonyms.schedule.some(kw => normalizedInput.includes(kw))) return { type: 'KNOWLEDGE', key: '⏰ مواعيد الفرز' };

    if (intentSynonyms.categories.some(kw => normalizedInput.includes(kw))) return { type: 'CATEGORIES_GENERAL' };
    if (intentSynonyms.categories_haremy.some(kw => normalizedInput.includes(kw))) return { type: 'CATEGORIES_HAREMY' };
    if (intentSynonyms.categories_winter.some(kw => normalizedInput.includes(kw))) return { type: 'CATEGORIES_WINTER' };

    // Sorting Knowledge
    const sortingIntents = [
        { key: "🤖 انت مين؟", keywords: ['انت مين', 'اسمك', 'عرفني بنفسك', 'مين فرزون', 'من انت'] },
        { key: "⚙️ بتعمل ايه؟", keywords: ['بتعمل ايه', 'فائدتك', 'مهمتك', 'وظيفتك', 'بتساعد ازاي'] },
        { key: "📦 الفرز بيعمل ايه؟", keywords: ['الفرز بيعمل ايه', 'يعني ايه فرز', 'الفرز عباره عن', 'شرح الفرز', 'الفرز'] },
        { key: "👕 يعني ايه كساء؟", keywords: ['كساء', 'الكساء', 'يعني ايه كساء', 'تفاصيل الكساء', 'ملابس الكساء'] },
        { key: "🛍️ المعارض يعني ايه؟", keywords: ['معارض', 'معرض', 'المعارض', 'شرح المعارض', 'يعني ايه معرض'] },
        { key: "♻️ التالف بيعمل ايه؟", keywords: ['تالف', 'التالف', 'اعاده تدوير', 'تدوير', 'زراير'] }
    ];
    for (let intent of sortingIntents) {
        if (intent.keywords.some(kw => normalizedInput.includes(kw))) return { type: 'KNOWLEDGE', key: intent.key };
    }

    if (intentSynonyms.greeting.some(kw => normalizedInput.includes(kw))) return { type: 'GREETING' };

    if (intentSynonyms.social.some(kw => normalizedInput === kw || normalizedInput.split(' ').includes(kw))) return { type: 'SOCIAL' };

    return { type: 'FALLBACK' };
}

function getResponse(text) {
    const normalizedText = normalize(text);
    const intent = detectIntent(normalizedText);

    let finalResponse = "";
    const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    switch (intent.type) {
        case 'FLOW':
            if (normalizedText.includes('كويس') || normalizedText.includes('نضيف') || userContext.lastTopic === 'kesaa') {
                finalResponse = "الهدوم الكويسة 👌 بتروح للكساء<br>وده بيتوزع مجانًا على الأسر المستحقة مرتين في السنة 💙";
                userContext.lastTopic = 'kesaa';
            } else if (normalizedText.includes('معارض') || userContext.lastTopic === 'maared') {
                finalResponse = "المعارض بتروح لقرى محتاجة<br>وبتتباع بأسعار رمزية عشان نحافظ على كرامة الناس 💪";
                userContext.lastTopic = 'maared';
            } else if (userContext.lastTopic === 'sorting' || userContext.lastTopic === 'categories') {
                finalResponse = "بص يا نجم، الهدوم الممتازة بتروح (كساء) وتتوزع مجاناً، واللي حالتها كويسة بتروح (معارض) وتتباع رمزي، والمقطعة بتروح (تالف) عشان تتعاد تدويرها 😎";
                userContext.lastTopic = 'sorting';
            } else {
                finalResponse = "تقصد الكساء ولا المعارض؟ 👀";
                userContext.lastIntent = 'clarify_flow';
            }
            break;

        case 'OPINION':
            finalResponse = randomPick([
                "بص يا معلم 😎<br>الفرز من أحلى اللجان بصراحة، شغل مفيد وجو حلو والناس فيه زي الفل 👌<br>بس في الآخر جرب بنفسك وشوف أنت ترتاح فين 💪",
                "الفرز جامد والله 🔥<br>بس برضه كل لجنة ليها جوها، انزل وجرب وانت اللي هتحكم 😉"
            ]);
            userContext.lastIntent = 'opinion';
            userContext.lastTopic = 'sorting';
            break;

        case 'CATEGORIES_GENERAL':
            finalResponse = "بص يا معلم 👌<br>احنا بنقسم الهدوم لـ 3 حاجات:<br><br>1️⃣ كساء<br>2️⃣ معارض<br>3️⃣ تالف<br><br>طيب المعارض فيها ايه؟ 👇<br><br>• حريمي<br>• رجالي<br>• اطفال<br>• احذية<br>• شنط<br>• مفروشات<br>• بدل<br>• عرايس<br>• مدارس<br>• تالف جينز<br>• زيادات<br>• شتوي (ده بيبقى موجود في الصيف)<br>• طرح<br>• مواليد<br><br>يعني كل حاجة ليها تصنيف عشان توصل صح للي محتاجها 💪";
            userContext.lastIntent = 'categories';
            userContext.lastTopic = 'categories';
            break;

        case 'CATEGORIES_HAREMY':
            finalResponse = "الحريمي يا سيدي هو أي لبس بناتي أو حريمي بينزل المعارض 👗<br>بنعزله لوحده عشان يتفرز ويتجهز صح 👌";
            userContext.lastIntent = 'categories_haremy';
            userContext.lastTopic = 'categories';
            break;

        case 'CATEGORIES_WINTER':
            finalResponse = "سؤال حلو! الشتوي بيطلع في الصيف عشان بيتم تخزينه للموسم بتاعه ❄️<br>بنجهزه ونعينه عشان اول ما الشتا يدخل يكون جاهز يتوزع في المعارض أو الكساء 💪";
            userContext.lastIntent = 'categories_winter';
            userContext.lastTopic = 'categories';
            break;

        case 'FARZAWI':
            finalResponse = "فرزاوي واقفة مؤقتًا لحد ما أبطالنا يخلصوا امتحاناتهم 💪🔥";
            userContext.lastIntent = 'farzawi';
            userContext.lastTopic = 'events';
            break;

        case 'GREETING':
            finalResponse = randomPick([
                "زي الفل يا معلم 😎 وانت عامل ايه؟ جاهز نخش في الفرز؟ 💪",
                "أهلاً بيك يا غالي! نورتنا 🌟 تحب تسأل عن الفرز أو المسؤولين؟",
                "تمام وزي العسل 👌 تحب نتكلم في ايه؟"
            ]);
            userContext.lastIntent = 'greeting';
            userContext.lastTopic = 'general';
            break;

        case 'SOCIAL':
            finalResponse = randomPick([
                "حبيبي 👌 تحب نكمل في ايه؟",
                "تسلم يا غالي ❤️ في حاجة تانية اقدر اساعدك فيها؟",
                "يا سيدي تمام وزي الفل 😎 اسألني لو محتاج حاجة كمان!"
            ]);
            userContext.lastIntent = 'social';
            break;

        case 'ALL_ROLES':
            finalResponse = getAllRolesText();
            userContext.lastIntent = 'roles';
            userContext.lastTopic = 'roles';
            break;

        case 'CLARIFY_ROLE':
            if (userContext.lastTopic === 'roles') {
                finalResponse = getAllRolesText();
            } else {
                finalResponse = "تحب تعرف مسؤول مين؟ ولا أقولك كلهم مرة واحدة؟ 👀";
            }
            userContext.lastIntent = 'roles_list_prompt';
            userContext.lastTopic = 'roles';
            break;

        case 'KNOWLEDGE':
            finalResponse = knowledgeBase[intent.key];
            userContext.lastIntent = 'knowledge';
            if (intent.key.includes('مواعيد')) userContext.lastTopic = 'schedule';
            else if (intent.key.includes('مسؤول')) userContext.lastTopic = 'roles';
            else if (intent.key.includes('كساء')) userContext.lastTopic = 'kesaa';
            else if (intent.key.includes('المعارض')) userContext.lastTopic = 'maared';
            else userContext.lastTopic = 'sorting';
            break;

        case 'FALLBACK':
        default:
            finalResponse = randomPick([
                "مش واضحلي أوي 🤔<br>جرب تسأل عن الفرز، المسؤولين، أو المواعيد 👇",
                "معلش مفهمتش قصدك اوي 😅<br>ممكن توضح أكتر؟",
                "امممم.. مش متأكد. بس ممكن تسألني عن مواعيدنا أو أنواع الفرز! 💡"
            ]);
            userContext.lastIntent = 'fallback';
            break;
    }

    return finalResponse;
}

function getAllRolesText() {
    return "مسؤولين اللجنة 👇<br><br>" +
        "• الفرز: معاذ<br>" +
        "• الميديا: علي<br>" +
        "• المشاريع: أميرة<br>" +
        "• الباك يارد: هاجر<br>" +
        "• HR: ايمان (ومعاها ريماس)<br>" +
        "• المخازن: يس<br>" +
        "• فرزاوي: مروان";
}


// ================== UI HANDLER ==================

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
            const typing = showTypingIndicator();
            setTimeout(() => {
                typing.remove();
                addMessage("أهلاً بيك في فرزون 🤖<br>اسأل براحتك أو اختار من اللي تحت 👇", 'bot');
            }, 1200);
        }, 500);
    }, 1500); // Wait 1.5s to show loader for UX

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
            const typingIndicator = showTypingIndicator();
            setTimeout(() => {
                typingIndicator.remove();
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
        
        if (topic === 'sorting' || topic === 'categories') {
            suggestionKeys = ["👕 يعني ايه كساء؟", "🛍️ المعارض يعني ايه؟", "♻️ التالف بيعمل ايه؟", "💡 مش عارف تسأل ايه؟"];
        } else if (topic === 'roles') {
            suggestionKeys = ["📱 مسؤول الميديا", "👥 كل المسؤولين", "💡 مش عارف تسأل ايه؟"];
        } else if (topic === 'schedule' || topic === 'events') {
            suggestionKeys = ["⏰ مواعيد الفرز", "🎯 فرزاوي امتى", "💡 مش عارف تسأل ايه؟"];
        } else {
            suggestionKeys = ["📦 الفرز بيعمل ايه؟", "⏰ مواعيد الفرز", "👥 كل المسؤولين", "💡 مش عارف تسأل ايه؟"];
        }

        suggestionKeys.forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'chip';
            btn.innerText = key;
            btn.addEventListener('click', () => {
                if (key === "💡 مش عارف تسأل ايه؟") {
                    showHelpSuggestions();
                } else if (key === "👥 كل المسؤولين") {
                    handleSend("مين المسؤولين");
                } else {
                    const cleanText = key.replace(/[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}]/gu, '').replace(/[؟?]/g, '').trim();
                    handleSend(cleanText);
                }
            });
            quickSuggestions.appendChild(btn);
        });
    }

    function showHelpSuggestions() {
        const quickSuggestions = document.getElementById('quick-suggestions');
        if (!quickSuggestions) return;
        quickSuggestions.innerHTML = '';
        const suggestionKeys = ["⏰ مواعيد الفرز", "📱 مين مسؤول الميديا", "🎯 فرزاوي امتى", "📦 الفرز بيعمل ايه؟"];
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
        updateSuggestions();
    }

    function handleSend(text) {
        text = text.trim();
        if (text === '') return;

        userInput.value = '';
        userInput.style.height = 'auto'; // Reset textarea height
        sendBtn.disabled = true;
        userInput.focus();

        addMessage(text, 'user');

        const typingIndicator = showTypingIndicator();
        const delay = Math.floor(Math.random() * 800) + 800; // Snappier response

        setTimeout(() => {
            typingIndicator.remove();
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

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
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
        scrollToBottom();
        return typingDiv;
    }

    function scrollToBottom() {
        // Smooth scroll to latest message
        chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
    }
});
