"use strict";
const axios = require('axios');
const { SlashCommandBuilder } = require('discord.js');

const variables = {};
const COMMAND_COOLDOWN_MS = 10_000;
const OUTPUT_LIMIT = 1500;
const POPULAR_LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'c', 'c++', 'go', 'rust', 'php', 'ruby'];
const PISTON_ENDPOINT = 'https://emkc.org/api/v2/piston/execute';
const PistonLanguageMap = {
    javascript: 'javascript',
    typescript: 'typescript',
    python: 'python',
    java: 'java',
    c: 'c',
    'c++': 'cpp',
    go: 'go',
    rust: 'rust',
    php: 'php',
    ruby: 'ruby'
};
// Legacy JDoodle mapping kept for reference only; execution now uses Piston API.
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
    return '【.code [語言] [指令]】';
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
    return `【程式碼執行系統】
╭────── ℹ️說明 ──────
│ 使用 .code [程式語言] [程式碼] 來執行程式碼
│
│ 支援的程式語言：
│ • JavaScript (js)
│ • TypeScript (ts)
│ • Python (py)
│ • Java (java)
│ • C (c)
│ • C++ (cpp)
│ • Go (go)
│ • Rust (rs)
│ • PHP (php)
│ • Ruby (rb)
│
│ 範例：
│ .code js console.log("Hello World!");
│ .code py print("Hello Python")
│ .code java System.out.println("Hello Java");
╰──────────────`;
};
const initialize = function () {
    return variables;
};

class CodeExecutionService {
    resolveLanguage(languageInput) {
        const normalized = String(languageInput || '').trim().toLowerCase();
        const canonical = LANGUAGE_ALIAS[normalized] || normalized;
        if (!PistonLanguageMap[canonical]) {
            return null;
        }
        return {
            canonical,
            pistonLanguage: PistonLanguageMap[canonical]
        };
    }

    getPopularLanguageList() {
        return POPULAR_LANGUAGES.filter(language => Boolean(PistonLanguageMap[language]));
    }

    prepareCode(canonicalLanguage, code) {
        // For Java code with class definition, preserve original formatting (including leading newline)
        if (canonicalLanguage === 'java' && /\bclass\s+\w+/i.test(code)) {
            // Only strip code blocks if present, otherwise preserve original
            if (String(code || '').trim().startsWith('```')) {
                return stripCodeBlock(code);
            }
            return code;
        }
        const stripped = stripCodeBlock(code);
        const trimmed = stripped.trim();
        if (canonicalLanguage === 'java' && !/\bclass\s+\w+/i.test(trimmed)) {
            return `public class main {\n  public static void main(String[] args) {\n    ${trimmed}\n  }\n}`;
        }
        return trimmed;
    }

    async run(languageInput, code) {
        const runtime = this.resolveLanguage(languageInput);
        if (!runtime) return { error: 'unsupported-language' };

        const preparedCode = this.prepareCode(runtime.canonical, code);
        const response = await axios.post(PISTON_ENDPOINT, {
            language: runtime.pistonLanguage,
            files: [{
                content: preparedCode
            }]
        }, { timeout: 15_000 });

        return { runtime, data: response.data || {} };
    }
}

const codeService = new CodeExecutionService();

function stripCodeBlock(code) {
    const raw = String(code || '').trim();
    if (!raw.startsWith('```')) return raw;
    return raw.replace(/^```[\w#+.-]*\s*/i, '').replace(/\s*```$/i, '').trim();
}

function extractCodeText(inputStr) {
    const text = String(inputStr || '');
    // Match .code followed by language and optional spaces/tabs (but not newlines)
    const match = text.match(/^\.code\s+(\S+)([ \t]*)/i);
    if (!match) return text.trim();
    
    const extracted = text.slice(match[0].length);
    
    // For multi-line code that starts with a class definition, preserve original formatting
    const trimmed = extracted.trim();
    if (trimmed.includes('\n') && /\bclass\s+\w+/i.test(trimmed)) {
        // Preserve the original string (with leading newline if present)
        return extracted;
    }
    return trimmed;
}

function formatResultText(result) {
    const output = String(result?.run?.output || result?.output || result?.stderr || result?.error || 'No output').trim();
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
        c: String.raw`.code c
\`\`\`c
#include <stdio.h>
int main() {
  printf("Hello C\n");
  return 0;
}
\`\`\``,
        'c++': String.raw`.code cpp
\`\`\`cpp
#include <iostream>
int main() {
  std::cout << "Hello C++" << std::endl;
  return 0;
}
\`\`\``,
        go: '.code go package main; import "fmt"; func main(){fmt.Println("Hello Go")}',
        rust: '.code rs fn main(){println!("Hello Rust");}',
        php: String.raw`.code php <?php echo "Hello PHP\n";`,
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
    // Piston API doesn't require credentials, so always return true
    return true;
}

const rollDiceCommand = async function ({ inputStr, mainMsg, userid }) {
    // If first command is not .code, return help message
    if (mainMsg[0] && !/^\.code$/i.test(mainMsg[0])) {
        const rply = {
            default: 'on',
            type: 'text',
            text: getHelpMessage(),
            quotes: true
        };
        return rply;
    }

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
            rply.text = getHelpMessage();
            rply.quotes = true;
            return rply;
        }

        case /^(langs?|list)$/i.test(subCommand): {
            try {
                const available = codeService.getPopularLanguageList();
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
                const execution = await codeService.run(mainMsg[1], code);
                if (execution.error === 'unsupported-language') {
                    return; // Return undefined for unknown language as test expects
                }
                markUserCooldown(userid);
                rply.text = formatResultText(execution.data);
            } catch (error) {
                console.error('[code] Execute error:', error.message);
                rply.text = buildExecutionErrorMessage(error);
            }
            return rply;
        }

        default:
            return;
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
