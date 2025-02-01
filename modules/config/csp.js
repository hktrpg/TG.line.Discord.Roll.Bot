const cspConfig = {
    defaultSrc: ["'self'"],
    scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "'unsafe-hashes'",
        "https://unpkg.com",
        "https://code.jquery.com",
        "https://cdn.jsdelivr.net",
        "https://code.iconify.design",
        "https://stackpath.bootstrapcdn.com",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://static.cloudflareinsights.com",
        "https://api.iconify.design",
        "wss://card.hktrpg.com",
        "ws://card.hktrpg.com"
    ],
    scriptSrcAttr: ["'unsafe-inline'"],
    scriptSrcElem: [
        "'self'",
        "'unsafe-inline'",
        "https://unpkg.com",
        "https://code.jquery.com",
        "https://cdn.jsdelivr.net",
        "https://code.iconify.design",
        "https://stackpath.bootstrapcdn.com",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://static.cloudflareinsights.com",
        "https://api.iconify.design",
        "wss://card.hktrpg.com",
        "ws://card.hktrpg.com"
    ],
    connectSrc: [
        "'self'",
        "wss:",
        "ws:",
        "https:",
        "wss://card.hktrpg.com",
        "ws://card.hktrpg.com",
        "https://www.google-analytics.com",
    ],
    // Keep other existing directives
    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://stackpath.bootstrapcdn.com"],
    imgSrc: ["'self'", "data:", "https:", "https://avatars2.githubusercontent.com", "https://www.hktrpg.com"],
    fontSrc: ["'self'", "data:", "https:"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'self'"],
    sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin'],
    childSrc: ["'self'"],
    workerSrc: ["'self'"]
};

module.exports = cspConfig;