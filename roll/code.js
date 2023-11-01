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
        first: /^\.code$/i
    }]
}
const getHelpMessage = function () {
    return `【.code】 [語言] [指令]
使用piston Api
格式: .code [語言] 
[指令]
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
        /** 
        case /^js/i.test(mainMsg[1] || ''): {
            const code = inputStr.replace(/\.code\s+js\s?/i, '');
            const js = new JS(code);
            const result = await js.run();
            rply.text = result.run.output;
            return rply;
        }
        */
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
            console.log("response", response);
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
        this.language = "js";
        this.name = "main.js";
        this.version = "14.16.0";
        console.log(this.code);
    }
}
class Java extends Piston {
    constructor(code) {
        super();
        this.name = "main.java";
        this.code = `
public class main {
  public static void main(String[] args) {
   ${code}
  }
}`;
        this.language = "java";
        this.version = "15.0.2";
        console.log(this.code);
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