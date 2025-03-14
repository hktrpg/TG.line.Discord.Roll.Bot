const cspConfig = {
    defaultSrc: ["'self'"],
    scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://unpkg.com",
        "https://code.jquery.com",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "https://code.iconify.design",
        "https://stackpath.bootstrapcdn.com",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://static.cloudflareinsights.com",
        "https://api.iconify.design",
        "https://html2canvas.hertzen.com",
        "https://cdn.jsdelivr.net",
        "wss://rollbot.hktrpg.com",
        "ws://rollbot.hktrpg.com",
        "wss://card.hktrpg.com",
        "ws://card.hktrpg.com"
    ],
    scriptSrcAttr: ["'unsafe-inline'"],
    scriptSrcElem: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://unpkg.com",
        "https://html2canvas.hertzen.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "https://code.jquery.com",
        "https://code.iconify.design",
        "https://stackpath.bootstrapcdn.com",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://static.cloudflareinsights.com",
        "https://api.iconify.design",
        "https://rollbot.hktrpg.com",
        "wss://card.hktrpg.com",
        "ws://card.hktrpg.com"
    ],
    connectSrc: [
        "'self'",
        "wss:",
        "ws:",
        "https:",
        "https://html2canvas.hertzen.com",
        "wss://rollbot.hktrpg.com",
        "ws://rollbot.hktrpg.com",
        "wss://card.hktrpg.com",
        "ws://card.hktrpg.com",
        "https://www.google-analytics.com",
        "https://rollbot.hktrpg.com",
        "https://card.hktrpg.com",
        "https://static.cloudflareinsights.com"
    ],
    styleSrc: ["'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://stackpath.bootstrapcdn.com",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com"],
    styleSrcElem: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://stackpath.bootstrapcdn.com",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com"
    ],
    imgSrc: ["'self'", "data:", "https:", "https://avatars2.githubusercontent.com", "https://www.hktrpg.com"],
    fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
    ],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'self'"],
    sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin',
        'allow-downloads', 'allow-modals', 'allow-popups', 'allow-popups-to-escape-sandbox', 'allow-presentation'],
    childSrc: ["'self'"],
    workerSrc: ["'self'"]
};

module.exports = cspConfig;