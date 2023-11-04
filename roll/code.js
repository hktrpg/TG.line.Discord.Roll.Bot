"use strict";
const variables = {};
const axios = require('axios');
const { SlashCommandBuilder } = require('discord.js');
const gameName = function () {
    return '【.code [語言] [指令]】'
}
const gameType = function () {
    return 'funny:code:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^\.code$/i,second: null
    }]
}
const getHelpMessage = function () {
    return `【.code】 [語言] [指令]
使用piston Api
格式: .code [語言] 
[指令]

現支援: js java
`
}
const initialize = function () {
    return variables;
}

const rollDiceCommand = async function ({
    inputStr,
    mainMsg,
    groupid,
    userid,
    userrole,
    botname,
    displayname,
    channelid,
    displaynameDiscord,
    membercount
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]) || !mainMsg[1]: {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }

        case /^java/i.test(mainMsg[1] || ''): {
            const code = inputStr.replace(/\.code\s+java\s?/i, '');
            const java = new Java(code);
            const result = await java.run();
            rply.text = result.run.output;
            return rply;
        }

        case /^js/i.test(mainMsg[1] || ''): {
            const code = inputStr.replace(/\.code\s+js\s?/i, '');
            const js = new JS(code);
            const result = await js.run();
            rply.text = result.run.output;
            return rply;
        }

        default: {
            break;
        }
    }
}

class Piston {
    constructor() {
        this.url = "https://emkc.org/api/v2/piston/execute";
        this.args = [];
        this.stdin = '';
        this.compile_timeout = 10000;
        this.run_timeout = 3000;
        this.compile_memory_limit = -1;
        this.run_memory_limit = -1;

    }
    async run() {
        try {
            const response = await axios.post(this.url, {
                language: this.language,
                version: this.version,
                files: [
                    {
                        name: this.name,
                        content: this.code
                    }
                ],
                args: this.args,
                stdin: this.stdin,
                compile_timeout: this.compile_timeout,
                run_timeout: this.run_timeout,
                compile_memory_limit: this.compile_memory_limit,
                run_memory_limit: this.run_memory_limit
            });
            return response.data;
        }
        catch (error) {
            console.error(error);
            return "error";
        }
    }
}


class JS extends Piston {
    constructor(code) {
        super();
        this.code = code;
        this.language = "javascript";
        this.name = "temp.js";
        this.version = "18.15.0";
    }
}

class Java extends Piston {
    constructor(code) {
        super();
        this.name = "main.java";
        this.code = (code.includes("class ")) ? code : `
        import java.util.*;
public class main {
  public static void main(String[] args) {
   ${code}
  }
}`;
        this.language = "java";
        this.version = "15.0.2";
    }
}

const discordCommand = []
module.exports = {
    rollDiceCommand,
    initialize,
    getHelpMessage,
    prefixs,
    gameType,
    gameName,
    discordCommand
};

/**

[{
    "language": "matl",
    "version": "22.5.0",
    "aliases": []
}, {
    "language": "matl",
    "version": "22.7.4",
    "aliases": []
}, {
    "language": "bash",
    "version": "5.2.0",
    "aliases": ["sh"]
}, {
    "language": "befunge93",
    "version": "0.2.0",
    "aliases": ["b93"]
}, {
    "language": "bqn",
    "version": "1.0.0",
    "aliases": []
}, {
    "language": "brachylog",
    "version": "1.0.0",
    "aliases": []
}, {
    "language": "brainfuck",
    "version": "2.7.3",
    "aliases": ["bf"]
}, {
    "language": "cjam",
    "version": "0.6.5",
    "aliases": []
}, {
    "language": "clojure",
    "version": "1.10.3",
    "aliases": ["clojure", "clj"]
}, {
    "language": "cobol",
    "version": "3.1.2",
    "aliases": ["cob"]
}, {
    "language": "coffeescript",
    "version": "2.5.1",
    "aliases": ["coffeescript", "coffee"]
}, {
    "language": "cow",
    "version": "1.0.0",
    "aliases": ["cow"]
}, {
    "language": "crystal",
    "version": "0.36.1",
    "aliases": ["crystal", "cr"]
}, {
    "language": "dart",
    "version": "2.19.6",
    "aliases": []
}, {
    "language": "dash",
    "version": "0.5.11",
    "aliases": ["dash"]
}, {
    "language": "typescript",
    "version": "1.32.3",
    "aliases": ["deno", "deno-ts"],
    "runtime": "deno"
}, {
    "language": "javascript",
    "version": "1.32.3",
    "aliases": ["deno-js"],
    "runtime": "deno"
}, {
    "language": "basic.net",
    "version": "5.0.201",
    "aliases": ["basic", "visual-basic", "visual-basic.net", "vb", "vb.net", "vb-dotnet", "dotnet-vb", "basic-dotnet", "dotnet-basic"],
    "runtime": "dotnet"
}, {
    "language": "fsharp.net",
    "version": "5.0.201",
    "aliases": ["fsharp", "fs", "f#", "fs.net", "f#.net", "fsharp-dotnet", "fs-dotnet", "f#-dotnet", "dotnet-fsharp", "dotnet-fs", "dotnet-fs"],
    "runtime": "dotnet"
}, {
    "language": "csharp.net",
    "version": "5.0.201",
    "aliases": ["csharp", "c#", "cs", "c#.net", "cs.net", "c#-dotnet", "cs-dotnet", "csharp-dotnet", "dotnet-c#", "dotnet-cs", "dotnet-csharp"],
    "runtime": "dotnet"
}, {
    "language": "fsi",
    "version": "5.0.201",
    "aliases": ["fsx", "fsharp-interactive", "f#-interactive", "dotnet-fsi", "fsi-dotnet", "fsi.net"],
    "runtime": "dotnet"
}, {
    "language": "dragon",
    "version": "1.9.8",
    "aliases": []
}, {
    "language": "elixir",
    "version": "1.11.3",
    "aliases": ["elixir", "exs"]
}, {
    "language": "emacs",
    "version": "27.1.0",
    "aliases": ["emacs", "el", "elisp"]
}, {
    "language": "emojicode",
    "version": "1.0.2",
    "aliases": ["emojic"]
}, {
    "language": "erlang",
    "version": "23.0.0",
    "aliases": ["erlang", "erl", "escript"]
}, {
    "language": "file",
    "version": "0.0.1",
    "aliases": ["executable", "elf", "binary"]
}, {
    "language": "forte",
    "version": "1.0.0",
    "aliases": ["forter"]
}, {
    "language": "forth",
    "version": "0.7.3",
    "aliases": ["gforth"]
}, {
    "language": "freebasic",
    "version": "1.9.0",
    "aliases": ["bas", "fbc", "basic", "qbasic", "quickbasic"]
}, {
    "language": "awk",
    "version": "5.1.0",
    "aliases": ["gawk"],
    "runtime": "gawk"
}, {
    "language": "c",
    "version": "10.2.0",
    "aliases": ["gcc"],
    "runtime": "gcc"
}, {
    "language": "c++",
    "version": "10.2.0",
    "aliases": ["cpp", "g++"],
    "runtime": "gcc"
}, {
    "language": "d",
    "version": "10.2.0",
    "aliases": ["gdc"],
    "runtime": "gcc"
}, {
    "language": "fortran",
    "version": "10.2.0",
    "aliases": ["fortran", "f90"],
    "runtime": "gcc"
}, {
    "language": "go",
    "version": "1.16.2",
    "aliases": ["go", "golang"]
}, {
    "language": "golfscript",
    "version": "1.0.0",
    "aliases": ["golfscript"]
}, {
    "language": "groovy",
    "version": "3.0.7",
    "aliases": ["groovy", "gvy"]
}, {
    "language": "haskell",
    "version": "9.0.1",
    "aliases": ["haskell", "hs"]
}, {
    "language": "husk",
    "version": "1.0.0",
    "aliases": []
}, {
    "language": "iverilog",
    "version": "11.0.0",
    "aliases": ["verilog", "vvp"]
}, {
    "language": "japt",
    "version": "2.0.0",
    "aliases": ["japt"]
}, {
    "language": "java",
    "version": "15.0.2",
    "aliases": []
}, {
    "language": "jelly",
    "version": "0.1.31",
    "aliases": []
}, {
    "language": "julia",
    "version": "1.8.5",
    "aliases": ["jl"]
}, {
    "language": "kotlin",
    "version": "1.8.20",
    "aliases": ["kt"]
}, {
    "language": "lisp",
    "version": "2.1.2",
    "aliases": ["lisp", "cl", "sbcl", "commonlisp"]
}, {
    "language": "llvm_ir",
    "version": "12.0.1",
    "aliases": ["llvm", "llvm-ir", "ll"]
}, {
    "language": "lolcode",
    "version": "0.11.2",
    "aliases": ["lol", "lci"]
}, {
    "language": "lua",
    "version": "5.4.4",
    "aliases": []
}, {
    "language": "csharp",
    "version": "6.12.0",
    "aliases": ["mono", "mono-csharp", "mono-c#", "mono-cs", "c#", "cs"],
    "runtime": "mono"
}, {
    "language": "basic",
    "version": "6.12.0",
    "aliases": ["vb", "mono-vb", "mono-basic", "visual-basic", "visual basic"],
    "runtime": "mono"
}, {
    "language": "nasm",
    "version": "2.15.5",
    "aliases": ["asm", "nasm32"],
    "runtime": "nasm"
}, {
    "language": "nasm64",
    "version": "2.15.5",
    "aliases": ["asm64"],
    "runtime": "nasm"
}, {
    "language": "nim",
    "version": "1.6.2",
    "aliases": []
}, {
    "language": "javascript",
    "version": "18.15.0",
    "aliases": ["node-javascript", "node-js", "javascript", "js"],
    "runtime": "node"
}, {
    "language": "ocaml",
    "version": "4.12.0",
    "aliases": ["ocaml", "ml"]
}, {
    "language": "octave",
    "version": "8.1.0",
    "aliases": ["matlab", "m"]
}, {
    "language": "osabie",
    "version": "1.0.1",
    "aliases": ["osabie", "05AB1E", "usable"]
}, {
    "language": "paradoc",
    "version": "0.6.0",
    "aliases": ["paradoc"]
}, {
    "language": "pascal",
    "version": "3.2.2",
    "aliases": ["freepascal", "pp", "pas"]
}, {
    "language": "perl",
    "version": "5.36.0",
    "aliases": ["pl"]
}, {
    "language": "php",
    "version": "8.2.3",
    "aliases": []
}, {
    "language": "ponylang",
    "version": "0.39.0",
    "aliases": ["pony", "ponyc"]
}, {
    "language": "prolog",
    "version": "8.2.4",
    "aliases": ["prolog", "plg"]
}, {
    "language": "pure",
    "version": "0.68.0",
    "aliases": []
}, {
    "language": "powershell",
    "version": "7.1.4",
    "aliases": ["ps", "pwsh", "ps1"],
    "runtime": "pwsh"
}, {
    "language": "pyth",
    "version": "1.0.0",
    "aliases": ["pyth"]
}, {
    "language": "python2",
    "version": "2.7.18",
    "aliases": ["py2", "python2"]
}, {
    "language": "python",
    "version": "3.10.0",
    "aliases": ["py", "py3", "python3", "python3.10"]
}, {
    "language": "racket",
    "version": "8.3.0",
    "aliases": ["rkt"]
}, {
    "language": "raku",
    "version": "6.100.0",
    "aliases": ["raku", "rakudo", "perl6", "p6", "pl6"]
}, {
    "language": "retina",
    "version": "1.2.0",
    "aliases": ["ret"]
}, {
    "language": "rockstar",
    "version": "1.0.0",
    "aliases": ["rock", "rocky"]
}, {
    "language": "rscript",
    "version": "4.1.1",
    "aliases": ["r"]
}, {
    "language": "ruby",
    "version": "3.0.1",
    "aliases": ["ruby3", "rb"]
}, {
    "language": "rust",
    "version": "1.68.2",
    "aliases": ["rs"]
}, {
    "language": "samarium",
    "version": "0.3.1",
    "aliases": ["sm"]
}, {
    "language": "scala",
    "version": "3.2.2",
    "aliases": ["sc"]
}, {
    "language": "smalltalk",
    "version": "3.2.3",
    "aliases": ["st"]
}, {
    "language": "sqlite3",
    "version": "3.36.0",
    "aliases": ["sqlite", "sql"]
}, {
    "language": "swift",
    "version": "5.3.3",
    "aliases": ["swift"]
}, {
    "language": "typescript",
    "version": "5.0.3",
    "aliases": ["ts", "node-ts", "tsc", "typescript5", "ts5"]
}, {
    "language": "vlang",
    "version": "0.3.3",
    "aliases": ["v"]
}, {
    "language": "vyxal",
    "version": "2.4.1",
    "aliases": []
}, {
    "language": "yeethon",
    "version": "3.10.0",
    "aliases": ["yeethon3"]
}, {
    "language": "zig",
    "version": "0.10.1",
    "aliases": []
}]
*/
