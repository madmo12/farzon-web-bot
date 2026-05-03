/**
 * FARZOON BOT - SMART HANDLER
 */

// ================== STATE (CONTEXT MEMORY) ==================
let userContext = {
    lastIntent: null
};

// ================== KNOWLEDGE BASE ==================
const knowledgeBase = {
    "📦 الفرز بيعمل ايه؟": "بص يا نجم 😎 الفرز باختصار إن الهدوم بتيجي في شكاير، وإحنا بنصنفها لـ 3 أنواع (كساء، معارض، تالف) عشان كل حاجة تروح مكانها الصح ✌️",
    "👕 يعني ايه كساء؟": "👕 **الكساء**:\nدي الهدوم اللي جودتها ممتازة وشبه الجديدة. بنوزعها **مجاناً** مرتين في السنة على الأسر عشان نفرحهم في المناسبات 🌟",
    "🛍️ المعارض يعني ايه؟": "🛍️ **المعارض**:\nدي هدوم حالتها كويسة بس اتلبست قبل كده. بنعمل بيها معارض بأسعار رمزية جداً عشان نحافظ على كرامة الناس.\n💡 الفلوس دي بترجع للجمعية عشان نشتري بيها هدوم جديدة للأسر 👌",
    "♻️ التالف بيعمل ايه؟": "♻️ **التالف**:\nدي الهدوم المقطعة. بنبيعها لعمال بيستفيدوا من (الزراير والسوست)، والباقي بيروح مصانع تدوير لخيوط.\n💡 يعني مفيش حاجة عندنا بتترمي، والعائد بيرجع يفيدنا تاني! 😎",
    
    "👤 مسؤول الفرز": "بطل الفرز؟ ده معاذ 📦💪",
    "📱 مسؤول الميديا": "مسؤول الميديا؟ ده علي 🎬🔥",
    "🏢 مسؤول الباك يارد": "اللي ماسكة الباك يارد؟ دي هاجر 🏢👌",
    "🤝 مسؤول HR": "مسؤول الـ HR؟ دي ايمان 🤝 وريماس بتساعدها كنائب 🌟",
    "🏢 مسؤول المشاريع": "اللي ماسكة المشاريع؟ دي أميرة ",
    "🏢 مسؤول المخازن": "بطل المخازن؟ ده يس 📦🫡",
    
    "⏰ مواعيد الفرز": "خدها مني على السريع 👇\nإحنا موجودين كل يوم من 11 الصبح لـ 6 المغرب، **ماعدا يوم الجمعة**.\nمكانا فين؟ في الباك يارد ياريس 📍",
    
    "🤖 انت مين؟": "أنا فرزون 🤖 صاحبك ومساعدك الذكي اللي هنا يجاوبك على أي حاجة تخص الفرز في رسالة 😎",
    "⚙️ بتعمل ايه؟": "مهمتي أوفر عليك وقتك! أي حاجة عايز تعرفها عن المواعيد، المسؤولين، أو نظام الفرز... أنا موجود أقولهالك في ثانية ⚡"
};

// ================== INTENT SYSTEM ==================

function normalize(text) {
    return text
        .trim()
        .toLowerCase()
        .replace(/[؟?!.,]/g, '')
        .replace(/\s+/g, ' ')
        // Normalize Arabic letters
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        // Typo tolerance
        .replace(/الفرر+ز/g, 'الفرز')
        .replace(/الميدبا/g, 'الميديا');
}

function detectIntent(normalizedInput) {
    // Priority 1: Farzawi
    if (normalizedInput.includes('فرزاوي')) {
        return { type: 'FARZAWI' };
    }

    // Priority 2: All Roles
    const allRoles = ['مسؤولين اللجنه', 'مسئولين اللجنه', 'تيم الفرز', 'فريق الفرز', 'الناس بتاعت الفرز', 'كلهم', 'كله', 'الكل', 'المسؤولين كلهم', 'عاوزهم كلهم'];
    if (allRoles.some(kw => normalizedInput.includes(kw))) {
        return { type: 'ALL_ROLES' };
    }

    // Priority 3: SPECIFIC ROLES (Must be checked before generic "مسؤول" check)
    const roleIntents = [
        { key: "👤 مسؤول الفرز", keywords: ['مسؤول الفرز', 'مسئول الفرز', 'مين في الفرز', 'رئيس الفرز', 'بتاع الفرز'] },
        { key: "📱 مسؤول الميديا", keywords: ['ميديا', 'الميديا', 'تصوير'] },
        { key: "🏢 مسؤول الباك يارد", keywords: ['باك يارد', 'باكيارد'] },
        { key: "🤝 مسؤول HR", keywords: ['hr', 'اتش ار', 'ايمان', 'ريماس'] },
        { key: "🏢 مسؤول المشاريع", keywords: ['مشاريع', 'المشاريع', 'اميره'] },
        { key: "🏢 مسؤول المخازن", keywords: ['مخازن', 'المخازن', 'يس'] }
    ];
    for (let intent of roleIntents) {
        if (intent.keywords.some(kw => normalizedInput.includes(kw))) return { type: 'KNOWLEDGE', key: intent.key };
    }

    // Priority 4: Generic Clarification
    const genericRoleKeywords = ['مسؤول', 'مسئول', 'مين ماسك', 'مين رئيس', 'المسؤولين', 'اللجنه'];
    if (genericRoleKeywords.some(kw => normalizedInput.includes(kw))) {
        return { type: 'CLARIFY_ROLE' };
    }

    // Priority 5: Schedule
    const scheduleKeywords = ['مواعيد', 'امتي', 'شغالين', 'الساعه', 'ايام ايه', 'بتفتحوا'];
    if (scheduleKeywords.some(kw => normalizedInput.includes(kw))) {
        return { type: 'KNOWLEDGE', key: '⏰ مواعيد الفرز' };
    }

    // Priority 6: Sorting Knowledge
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

    // Priority 7: Greeting
    const howAreYou = ['عامل ايه', 'اخبارك', 'ازيك', 'كيفك'];
    if (howAreYou.some(kw => normalizedInput.includes(kw))) return { type: 'GREETING_HOW_ARE_YOU' };
    
    const hello = ['اهلا', 'سلام', 'هاي', 'مرحبا', 'صباح', 'مسا'];
    if (hello.some(kw => normalizedInput.includes(kw))) return { type: 'GREETING_HELLO' };

    // Priority 8: Follow-up
    const followUpWords = ['تمام', 'جاهز', 'يلا', 'اوكي', 'اه', 'ايوه', 'ياريت', 'ماشي'];
    // Strict match to avoid false positives (either exact match or explicitly contains standalone word)
    if (followUpWords.some(kw => normalizedInput === kw || normalizedInput.split(' ').includes(kw))) {
        return { type: 'FOLLOW_UP' };
    }

    // Priority 9: Fallback
    return { type: 'FALLBACK' };
}

function getResponse(text) {
    const normalizedText = normalize(text);
    const intent = detectIntent(normalizedText);

    let finalResponse = "";

    switch (intent.type) {
        case 'FARZAWI':
            finalResponse = "فرزاوي واقفة مؤقتًا دلوقتي لحد ما أبطالنا يخلصوا امتحاناتهم 💪🔥";
            userContext.lastIntent = 'farzawi';
            break;

        case 'GREETING_HOW_ARE_YOU':
            finalResponse = "زي الفل يا معلم 😎 وانت عامل ايه؟ جاهز نخش في الفرز؟ 💪";
            userContext.lastIntent = 'greeting';
            break;

        case 'GREETING_HELLO':
            finalResponse = "أهلاً بيك يا غالي! نورتنا 🌟 تحب تسأل عن الفرز أو المسؤولين؟";
            userContext.lastIntent = 'greeting';
            break;

        case 'FOLLOW_UP':
            if (userContext.lastIntent === 'greeting') {
                finalResponse = "حلو الكلام 👌 تعالى نبدأ بقى<br>تحب تعرف عن الفرز ولا المسؤولين؟";
            } else if (userContext.lastIntent === 'roles_list_prompt') {
                finalResponse = getAllRolesText();
            } else {
                finalResponse = "حبيبي يا غالي 🫡 محتاج حاجة تانية؟";
            }
            userContext.lastIntent = 'follow_up';
            break;

        case 'ALL_ROLES':
            finalResponse = getAllRolesText();
            userContext.lastIntent = 'roles';
            break;

        case 'CLARIFY_ROLE':
            finalResponse = "تحب تعرف مسؤول مين؟ ولا أقولك كلهم مرة واحدة؟ 👀";
            userContext.lastIntent = 'roles_list_prompt';
            break;

        case 'KNOWLEDGE':
            finalResponse = knowledgeBase[intent.key];
            userContext.lastIntent = 'knowledge';
            break;

        case 'FALLBACK':
        default:
            finalResponse = "مش واضحلي أوي 🤔<br>جرب تسأل عن الفرز، المسؤولين، أو المواعيد 👇";
            userContext.lastIntent = 'fallback';
            break;
    }

    return finalResponse;
}

function getAllRolesText() {
    return "بص يا نجم 😎 دي لستة بكل المسؤولين 👇:<br><br>" +
           knowledgeBase["👤 مسؤول الفرز"] + "<br>" +
           knowledgeBase["📱 مسؤول الميديا"] + "<br>" +
           knowledgeBase["🏢 مسؤول المشاريع"] + "<br>" +
           knowledgeBase["🏢 مسؤول الباك يارد"] + "<br>" +
           knowledgeBase["🤝 مسؤول HR"].replace(/\n/g, '<br>') + "<br>" +
           knowledgeBase["🏢 مسؤول المخازن"] + "<br>" +
           "ومسؤول **فرزاوي**؟ ده مروان 🎉";
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
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend(userInput.value);
    });

    userInput.addEventListener('input', () => {
        sendBtn.disabled = userInput.value.trim() === '';
    });

    function initSuggestions() {
        const suggestionKeys = ["📦 الفرز بيعمل ايه؟", "⏰ مواعيد الفرز", "👕 يعني ايه كساء؟", "📱 مسؤول الميديا"];
        const quickSuggestions = document.getElementById('quick-suggestions');
        if (!quickSuggestions) return;
        quickSuggestions.innerHTML = '';

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

    function handleSend(text) {
        text = text.trim();
        if (text === '') return;

        userInput.value = '';
        sendBtn.disabled = true;
        userInput.focus();

        addMessage(text, 'user');

        const typingIndicator = showTypingIndicator();
        const delay = Math.floor(Math.random() * 800) + 800; // Snappier response
        
        setTimeout(() => {
            typingIndicator.remove();
            const botReply = getResponse(text);
            addMessage(formatText(botReply), 'bot');
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
