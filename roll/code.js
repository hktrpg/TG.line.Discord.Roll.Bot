"use strict";
const axios = require('axios');
const { SlashCommandBuilder } = require('discord.js');

const variables = {};
const COMMAND_COOLDOWN_MS = 10_000;
const OUTPUT_LIMIT = 1500;
const JDOODLE_ENDPOINT = process.env.JDOODLE_ENDPOINT;
const JDOODLE_CLIENT_ID = process.env.JDOODLE_CLIENT_ID;
const JDOODLE_CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET;
const POPULAR_LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'c', 'c++', 'go', 'rust', 'php', 'ruby'];
const JDoodleLanguageMap = {
    javascript: { language: 'nodejs', versionIndex: process.env.JDOODLE_VERSION_NODEJS || '4' },
    typescript: { language: 'typescript', versionIndex: process.env.JDOODLE_VERSION_TYPESCRIPT || '4' },
    python: { language: 'python3', versionIndex: process.env.JDOODLE_VERSION_PYTHON || '4' },
    java: { language: 'java', versionIndex: process.env.JDOODLE_VERSION_JAVA || '4' },
    c: { language: 'c', versionIndex: process.env.JDOODLE_VERSION_C || '5' },
    'c++': { language: 'cpp17', versionIndex: process.env.JDOODLE_VERSION_CPP || '0' },
    go: { language: 'go', versionIndex: process.env.JDOODLE_VERSION_GO || '4' },
    rust: { language: 'rust', versionIndex: process.env.JDOODLE_VERSION_RUST || '4' },
    php: { language: 'php', versionIndex: process.env.JDOODLE_VERSION_PHP || '4' },
    ruby: { language: 'ruby', versionIndex: process.env.JDOODLE_VERSION_RUBY || '4' }
};
const LANGUAGE_ALIAS = {
    js: 'javascript',
    nodejs: 'javascript',
    ts: 'typescript',
    py: 'python',
    python3: 'python',
    cpp: 'c++',
    cxx: 'c++',
    cc: 'c++',
    cpp17: 'c++',
    golang: 'go',
    rs: 'rust',
    rb: 'ruby'
};
const userCooldown = new Map();

const gameName = function () {
    return '[.code lang code]';
};
const gameType = function () {
    return 'funny:code:hktrpg';
};
const prefixs = function () {
    return [{
        first: /^\.code$/i,
        second: null
    }];
};
const getHelpMessage = function () {
    return [
        'HKTRPG',
        '[Code Playground - JDoodle]',
        'Usage:',
        '.code list',
        '.code <lang> <code>',
        '',
        'Examples:',
        '.code py print("Hello")',
        '.code cpp #include <iostream> ...',
        '',
        'Popular languages:',
        'javascript, typescript, python, java, c, c++, go, rust, php, ruby',
        '',
        'Required env:',
        'JDOODLE_CLIENT_ID, JDOODLE_CLIENT_SECRET, JDOODLE_ENDPOINT'
    ].join('\n');
};
const initialize = function () {
    return variables;
};

class JDoodleService {
    resolveLanguage(languageInput) {
        const normalized = String(languageInput || '').trim().toLowerCase();
        const canonical = LANGUAGE_ALIAS[normalized] || normalized;
        if (!JDoodleLanguageMap[canonical]) {
            return null;
        }
        return {
            canonical,
            ...JDoodleLanguageMap[canonical]
        };
    }

    getPopularLanguageList() {
        return POPULAR_LANGUAGES.filter(language => Boolean(JDoodleLanguageMap[language]));
    }

    prepareCode(canonicalLanguage, code) {
        const trimmed = stripCodeBlock(code).trim();
        if (canonicalLanguage === 'java' && !/\bclass\s+\w+/i.test(trimmed)) {
            return `public class Main {\n  public static void main(String[] args) {\n    ${trimmed}\n  }\n}`;
        }
        return trimmed;
    }

    async run(languageInput, code) {
        if (!JDOODLE_CLIENT_ID || !JDOODLE_CLIENT_SECRET) {
            return { error: 'missing-jdoodle-credentials' };
        }

        const runtime = this.resolveLanguage(languageInput);
        if (!runtime) return { error: 'unsupported-language' };

        const preparedCode = this.prepareCode(runtime.canonical, code);
        const response = await axios.post(JDOODLE_ENDPOINT, {
            clientId: JDOODLE_CLIENT_ID,
            clientSecret: JDOODLE_CLIENT_SECRET,
            script: preparedCode,
            language: runtime.language,
            versionIndex: runtime.versionIndex,
            stdin: ''
        }, { timeout: 15_000 });

        return { runtime, data: response.data || {} };
    }
}

const jdoodleService = new JDoodleService();

function stripCodeBlock(code) {
    const raw = String(code || '').trim();
    if (!raw.startsWith('```')) return raw;
    return raw.replace(/^```[\w#+.-]*\s*/i, '').replace(/\s*```$/i, '').trim();
}

function extractCodeText(inputStr) {
    const text = String(inputStr || '');
    const pattern = /^\.code\s+\S+\s*/i;
    return text.replace(pattern, '').trim();
}

function formatResultText(result) {
    const output = String(result?.output || result?.stderr || result?.error || 'No output').trim();
    if (output.length <= OUTPUT_LIMIT) return output;
    return `${output.slice(0, OUTPUT_LIMIT)}\n...(truncated)`;
}

function formatLanguageExamples(languages) {
    const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const examples = {
        javascript: '.code js console.log("Hello JS");',
        typescript: '.code ts const n:number = 7; console.log(n);',
        python: '.code py print("Hello Python")',
        java: '.code java System.out.println("Hello Java");',
        c: '.code c\n```c\n#include <stdio.h>\nint main() {\n  printf("Hello C\\n");\n  return 0;\n}\n```',
        'c++': '.code cpp\n```cpp\n#include <iostream>\nint main() {\n  std::cout << "Hello C++" << std::endl;\n  return 0;\n}\n```',
        go: '.code go package main; import "fmt"; func main(){fmt.Println("Hello Go")}',
        rust: '.code rs fn main(){println!("Hello Rust");}',
        php: '.code php <?php echo "Hello PHP\\n";',
        ruby: '.code rb puts "Hello Ruby"'
    };

    return languages
        .map((language, index) => `${numberEmojis[index] || `${index + 1}.`} ${language}\n${examples[language] || `.code ${language} ...`}`)
        .join('\n\n');
}

function buildExecutionErrorMessage(error) {
    const status = error?.response?.status;
    if (status === 401) {
        return 'JDoodle request rejected (401). Check JDOODLE_CLIENT_ID/JDOODLE_CLIENT_SECRET.';
    }
    if (status === 403) {
        return 'JDoodle request rejected (403). Account or quota may be restricted.';
    }
    if (status === 429) {
        return 'JDoodle rate limit reached (429). Please try again later.';
    }
    if (status) {
        return `Execution failed (HTTP ${status}), try again later.`;
    }
    return 'Execution failed, try again later.';
}

function checkUserCooldown(userid) {
    if (!userid) return null;
    const now = Date.now();
    const previous = userCooldown.get(userid) || 0;
    const waitMs = previous + COMMAND_COOLDOWN_MS - now;
    if (waitMs > 0) return Math.ceil(waitMs / 1000);
    return null;
}
function markUserCooldown(userid) {
    if (!userid) return;
    userCooldown.set(userid, Date.now());
}

function isCodeServiceEnabled() {
    return Boolean(
        String(JDOODLE_CLIENT_ID || '').trim() &&
        String(JDOODLE_CLIENT_SECRET || '').trim() &&
        String(JDOODLE_ENDPOINT || '').trim()
    );
}

const rollDiceCommand = async function ({ inputStr, mainMsg, userid }) {
    const rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    const subCommand = (mainMsg[1] || '').toLowerCase();

    if (!isCodeServiceEnabled()) {
        rply.text = 'Code playground is not enabled. Please set JDOODLE_CLIENT_ID, JDOODLE_CLIENT_SECRET and JDOODLE_ENDPOINT.';
        return rply;
    }

    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }

        case /^(langs?|list)$/i.test(subCommand): {
            try {
                const available = jdoodleService.getPopularLanguageList();
                rply.text = available.length > 0
                    ? [
                        '[Popular Languages + Examples]',
                        formatLanguageExamples(available)
                    ].join('\n')
                    : 'Cannot fetch language list now, try again later.';
            } catch (error) {
                console.error('[code] Language list error:', error.message);
                rply.text = buildExecutionErrorMessage(error);
            }
            return rply;
        }

        case /^\S/.test(mainMsg[1] || ''): {
            const waitSeconds = checkUserCooldown(userid);
            if (waitSeconds) {
                rply.text = `Please wait ${waitSeconds}s before next run.`;
                return rply;
            }

            const code = extractCodeText(inputStr);
            if (!code) {
                rply.text = 'Please provide code content.';
                return rply;
            }

            try {
                const execution = await jdoodleService.run(mainMsg[1], code);
                if (execution.error === 'missing-jdoodle-credentials') {
                    rply.text = 'Missing JDoodle credentials. Set JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET.';
                    return rply;
                }
                if (execution.error === 'unsupported-language') {
                    rply.text = 'Unsupported language. Use .code langs';
                    return rply;
                }
                markUserCooldown(userid);
                rply.text = `[${execution.runtime.canonical}]\n${formatResultText(execution.data)}`;
            } catch (error) {
                console.error('[code] JDoodle execute error:', error.message);
                rply.text = buildExecutionErrorMessage(error);
            }
            return rply;
        }

        default:
            return rply;
    }
};

const discordCommand = [
    {
        data: new SlashCommandBuilder()
            .setName('code')
            .setDescription('Run code with JDoodle playground')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('list')
                    .setDescription('Show popular language list and examples'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('run')
                    .setDescription('Run code')
                    .addStringOption(option =>
                        option.setName('lang')
                            .setDescription('Choose a language')
                            .addChoices(
                                { name: 'JavaScript (js)', value: 'js' },
                                { name: 'TypeScript (ts)', value: 'ts' },
                                { name: 'Python (py)', value: 'py' },
                                { name: 'Java', value: 'java' },
                                { name: 'C', value: 'c' },
                                { name: 'C++ (cpp)', value: 'cpp' },
                                { name: 'Go', value: 'go' },
                                { name: 'Rust (rs)', value: 'rs' },
                                { name: 'PHP', value: 'php' },
                                { name: 'Ruby (rb)', value: 'rb' }
                            )
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName('content')
                            .setDescription('Code content to execute')
                            .setRequired(true))),
        async execute(interaction) {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'list') {
                return '.code list';
            }
            if (subcommand === 'run') {
                const lang = interaction.options.getString('lang') || '';
                const content = interaction.options.getString('content') || '';
                return `.code ${lang} ${content}`;
            }
            return '.code';
        }
    }
];
const webCommand = false;
module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand,
    webCommand
};
