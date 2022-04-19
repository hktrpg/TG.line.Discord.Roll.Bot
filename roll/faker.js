"use strict";
const variables = {};
const { SlashCommandBuilder } = require('@discordjs/builders');
const { faker } = require('@faker-js/faker');
const gameName = function () {
    return `【Faker】產生虛假但合理的人物資料`
}
//https://fakerjs.dev/
const gameType = function () {
    return 'tool:faker:hktrpg'
}
const prefixs = function () {
    //[mainMSG[0]的prefixs,mainMSG[1]的prefixs,   <---這裡是一對  
    //mainMSG[0]的prefixs,mainMSG[1]的prefixs  ]  <---這裡是一對
    //如前面是 /^1$/ig, 後面是/^1D100$/ig, 即 prefixs 變成 1 1D100 
    ///^(?=.*he)(?!.*da).*$/ig
    return [{
        first: /^\.faker$/i,
        second: null
    }]
}
const getHelpMessage = function () {
    return `【Faker】角色產生器
用於進行測試或是產生一個角色
可用變數:
數字 2-10 產生多少個角色 
男/女 male/female
中/美/德/日(預設)/法/俄/韓/英/非/捷克/阿拉伯/希臘/印度/西班牙/希伯來/意大利/烏克蘭/越南
Chinese/us/German/japan/French/Russian/Korean/English/Afrikaans/Czech/Arabic/Greek/India/Spanish/Hebrew/Italian/Ukrainian/Vietnamese
Card 除了名字外會顯示 名片資料 如城市 街道 電話 相片 公司 EMAIL`
}
const initialize = function () {
    return variables;
}

const rollDiceCommand = async function ({
    mainMsg,
    inputStr
}) {
    let rply = {
        default: 'on',
        type: 'text',
        text: ''
    };
    switch (true) {
        case /^help$/i.test(mainMsg[1]): {
            rply.text = this.getHelpMessage();
            rply.quotes = true;
            return rply;
        }
        default: {
            rply.text = handlingFaker(inputStr)
            return rply;
        }
    }
}

function handlingFaker(inputStr) {
    const times = inputStr.match(/\d+/) || 1;
    const gender = (inputStr.match(/男/i) && 'male') || (inputStr.match(/女/i) && 'female') || (inputStr.match(/female/i) && 'female') || (inputStr.match(/male/i) && 'male') || 'female';
    const localization = handlingLocalization(inputStr);
    const card = (inputStr.match(/card/i) && true);
    faker.setLocale(localization);
    if (card) {
        let data = '';
        for (let index = 0; index < times; index++) {
            data += `${nonCardFakerName(gender)}\n`
            data += `${faker.address.city()}\n`
            data += `${faker.phone.phoneFormats()}\n`
            data += `${faker.company.bs()}\n`
            data += `${faker.internet.email()}\n`
            data += `${faker.image.avatar()}\n\n`
        }
        return data;
    } else {
        let name = '';
        for (let index = 0; index < times; index++) {
            name += `${nonCardFakerName(gender)}\n`
        }
        return name;
    }

}
function nonCardFakerName(gender) {
    faker.setLocale('ja');
    return ` ${faker.name.findName()} ${faker.name.findName()}`
}


function handlingLocalization(inputStr) {
    return (inputStr.match(/Chinese|中/i) && 'zh_TW') || (inputStr.match(/us|美/i) && 'en_US') || (inputStr.match(/German|德/i) && 'de') || (inputStr.match(/japan|日/i) && 'ja') || (inputStr.match(/French|法/i) && 'fr') || (inputStr.match(/Russian|俄/i) && 'ru') || (inputStr.match(/Korean|韓/i) && 'ko') || (inputStr.match(/english|中/i) && 'zh_TW') || (inputStr.match(/English|英/i) && 'en') || (inputStr.match(/Afrikaans|非/i) && 'af_ZA') || (inputStr.match(/Czech|捷克/i) && 'cz') || (inputStr.match(/Arabic|阿拉伯/i) && 'ar') || (inputStr.match(/Greek|希臘/i) && 'el') || (inputStr.match(/India|印度/i) && 'en_IND') || (inputStr.match(/Spanish|西班牙/i) && 'es') || (inputStr.match(/Hebrew|希伯來/i) && 'he') || (inputStr.match(/Italian|意大利/i) && 'it') || (inputStr.match(/Ukrainian|烏克蘭/i) && 'uk') || (inputStr.match(/Vietnamese|越南/i) && 'vi') || 'ja';

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