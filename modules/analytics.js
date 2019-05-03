// Load `*.js` under roll directory as properties
//  i.e., `User.js` will become `exports['User']` or `exports.User`
require('fs').readdirSync('./roll/').forEach(function (file) {
	if (file.match(/\.js$/) !== null && file !== 'index.js' && file !== 'demo.js') {
		var name = file.replace('.js', '');
		exports[name] = require('../roll/' + file);
	}
});
try {

	//用來呼叫骰組,新增骰組的話,要寫條件式到下面呼叫 
	//格式是 exports.骰組檔案名字.function名
	function parseInput(inputStr, groupid, userid) {
		//console.log('InputStr: ' + inputStr);
		_isNaN = function (obj) {
			return isNaN(parseInt(obj));
		}

		let msgSplitor = (/\S+/ig);
		let mainMsg = inputStr.match(msgSplitor); //定義輸入字串
		let trigger = mainMsg[0].toString().toLowerCase(); //指定啟動詞在第一個詞&把大階強制轉成細階
		let result = {
			text: '',
			type: 'text'
		};
		//在下面位置開始分析trigger
		Object.keys(exports).forEach(v => {
			//0 = 不存在
			//1 = 符合
			//2 = 不符合
			//以下是分析每組rolling prefixs的資料
			//以每次同步檢查第一第二個 
			//例如第一組是 cc  第二組是 80 
			//那條件式就是 /^cc$/i 和/^\d+$/
			if (!mainMsg[1]) mainMsg[1] = '';
			let checkmainMsg0 = 0;
			let checkmainMsg1 = 0;
			let findprefixs = 0;
			if (exports[v].prefixs()[0] && exports[v].prefixs()[0]) {
				for (i = 0; i <= exports[v].prefixs().length - 1; i = i + 2) {
					checkmainMsg0 = 0;
					checkmainMsg1 = 0;
					if (exports[v].prefixs()[i] && exports[v].prefixs()[i]) {
						checkmainMsg0 = 2;
						if (exports[v].prefixs()[i + 1] && exports[v].prefixs()[i + 1]) {
							checkmainMsg1 = 2;
						}
						if (exports[v].prefixs()[i] && exports[v].prefixs()[i].test(mainMsg[0])) {
							checkmainMsg0 = 1;
						}
						if (exports[v].prefixs()[i + 1] && exports[v].prefixs()[i + 1].test(mainMsg[1])) {
							checkmainMsg1 = 1;
						}
						if (checkmainMsg0 <= 1 && checkmainMsg1 <= 1 && checkmainMsg0 + checkmainMsg1 >= 1) {
							findprefixs = 1;
							i = 99999;
						}
					}
				}
			}


			//console.log('exports[v].initialize().save: ', exports[v].initialize().save)
			/*
			if (exports[v].initialize().save) {
				console.log('exports[v].initialize().save ',exports[v].initialize())
				exports[v].initialize().findOne({
						groupid: groupid
					})
					.then((guild) => {
						console.log('find!!!! ', guild);
					})
					.catch((err) => {
						console.log(err);
						// TODO: Add Embedded message here.
	
					});
			}
	*/
			/*if (exports[v].initialize().save) {
				var findLike = exports[v].initialize().save.find(function (item, index, array) {
					return item.groupid === groupid; // 取得陣列 like === '蘿蔔泥'
				});
				console.log('find', findLike);
			}*/
			if (findprefixs == 1) {
				console.log('trigger: ', trigger, ' v: ', v)
				let temp = exports[v].rollDiceCommand(inputStr, mainMsg, groupid, userid)
				if (temp)
					Object.keys(temp).forEach(v => {
						result[v] = temp[v]
					})
			}

			//對比mongoose資料
			if (process.env.mongoURL) {
				if (exports[v].initialize().save && exports[v].initialize().save[0].blockfunction && exports[v].initialize().save[0].blockfunction[0] && exports[v].initialize().save[0].blockfunction.length > 0) {
					for (var i = 0; i < exports[v].initialize().save.length; i++) {
						//console.log('exports[v].initialize().save: ', new RegExp(exports[v].initialize().save[i].blockfunction.join("|"), "i"))
						//console.log('ABC', (new RegExp(exports[v].initialize().save[i].blockfunction.join("|"), "i")).test(mainMsg[0]))
						//console.log('CDE', exports[v].initialize().save[i].groupid == groupid)
						if ((new RegExp(exports[v].initialize().save[i].blockfunction.join("|"), "i")).test(mainMsg[0]) && exports[v].initialize().save[i].groupid == groupid && exports[v].initialize().save[i].blockfunction.length > 0) {
							//findprefixs = 1;
							console.log('Done?')
							result.text = '';
						}
						//if( exports[v].initialize().save[i].groupid==groupid &&)
					}
				}
			}
		})







		if (result && result.text) {
			console.log('inputStr: ', inputStr)
			return result
		}

		//if (trigger.match(/(^ccrt$)/) != null) return exports.coc.ccrt();
		//if (trigger.match(/(^ccsu$)/) != null) return exports.coc.ccsu();
		//普通ROLL擲骰判定在此	
		//if (inputStr.toLowerCase().match(/^\d+\s+\d+d\d+/) != null || inputStr.toLowerCase().match(/^\d+d\d+/) != null) return exports.rollbase.nomalDiceRoller(inputStr, mainMsg[0], mainMsg[1], mainMsg[2]);

		//xBy>A 指令開始於此
		//	if (trigger.match(/^(\d+)(b)(\d+)$/i) != null) return exports.advroll.xBy(trigger, mainMsg[1], mainMsg[2]);
		//xUy 指令開始於此	
		//	if (trigger.match(/^(\d+)(u)(\d+)$/i) != null && isNaN(mainMsg[1]) == false) return exports.advroll.xUy(trigger, mainMsg[1], mainMsg[2], mainMsg[3]);
		/*
				if (trigger.match(/^ccb$|^cc$|^ccn[1-2]$|^cc[1-2]$|^dp$|^成長檢定$|^幕間成長$/) != null && mainMsg[1] <= 1000) { //ccb指令開始於此
					if (trigger == 'ccb' && mainMsg[1] <= 99) return exports.coc.coc6(mainMsg[1], mainMsg[2]);
		
				if (trigger.match(/^ccb$|^cc$|^ccn[1-2]$|^cc[1-2]$|^dp$|^成長檢定$|^幕間成長$/) != null && mainMsg[1] <= 1000) { //ccb指令開始於此
					if (trigger == 'ccb' && mainMsg[1] <= 99) return exports.coc.coc6(mainMsg[1], mainMsg[2]);
		
					//DevelopmentPhase幕間成長指令開始於此
					if ((trigger == 'dp' || trigger == '成長檢定' || trigger == '幕間成長') && mainMsg[1] <= 1000) return exports.coc.DevelopmentPhase(mainMsg[1], mainMsg[2]);
					//cc指令開始於此
					if (trigger == 'cc' && mainMsg[1] <= 1000) return exports.coc.coc7(mainMsg[1], mainMsg[2]);
					//獎懲骰設定於此	
					if (trigger == 'cc1' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '1', mainMsg[2]);
					if (trigger == 'cc2' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '2', mainMsg[2]);
					if (trigger == 'ccn1' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '-1', mainMsg[2]);
					if (trigger == 'ccn2' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '-2', mainMsg[2]);
				}
		
				if (trigger.match(/(^cc7版創角$|^cc七版創角$)/) != null && mainMsg[1] != NaN) return exports.coc.build7char(mainMsg[1]);
		
				if (trigger.match(/(^cc6版創角$|^cc六版創角$)/) != null && mainMsg[1] != NaN) return exports.coc.build6char(mainMsg[1]);
		
				if (trigger.match(/^coc7角色背景$/) != null) return exports.coc.PcBG();
		
		
					//DevelopmentPhase幕間成長指令開始於此
					if ((trigger == 'dp' || trigger == '成長檢定' || trigger == '幕間成長') && mainMsg[1] <= 1000) return exports.coc.DevelopmentPhase(mainMsg[1], mainMsg[2]);
					//cc指令開始於此
					if (trigger == 'cc' && mainMsg[1] <= 1000) return exports.coc.coc7(mainMsg[1], mainMsg[2]);
					//獎懲骰設定於此	
					if (trigger == 'cc1' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '1', mainMsg[2]);
					if (trigger == 'cc2' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '2', mainMsg[2]);
					if (trigger == 'ccn1' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '-1', mainMsg[2]);
					if (trigger == 'ccn2' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '-2', mainMsg[2]);
				}
		
				if (trigger.match(/^ccb$|^cc$|^ccn[1-2]$|^cc[1-2]$|^dp$|^成長檢定$|^幕間成長$/) != null && mainMsg[1] <= 1000) { //ccb指令開始於此
					if (trigger == 'ccb' && mainMsg[1] <= 99) return exports.coc.coc6(mainMsg[1], mainMsg[2]);
		
					//DevelopmentPhase幕間成長指令開始於此
					if ((trigger == 'dp' || trigger == '成長檢定' || trigger == '幕間成長') && mainMsg[1] <= 1000) return exports.coc.DevelopmentPhase(mainMsg[1], mainMsg[2]);
					//cc指令開始於此
					if (trigger == 'cc' && mainMsg[1] <= 1000) return exports.coc.coc7(mainMsg[1], mainMsg[2]);
					//獎懲骰設定於此	
					if (trigger == 'cc1' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '1', mainMsg[2]);
					if (trigger == 'cc2' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '2', mainMsg[2]);
					if (trigger == 'ccn1' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '-1', mainMsg[2]);
					if (trigger == 'ccn2' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '-2', mainMsg[2]);
				}
		
				if (trigger.match(/(^cc7版創角$|^cc七版創角$)/) != null && mainMsg[1] != NaN) return exports.coc.build7char(mainMsg[1]);
		
				if (trigger.match(/(^cc6版創角$|^cc六版創角$)/) != null && mainMsg[1] != NaN) return exports.coc.build6char(mainMsg[1]);
		
				if (trigger.match(/^coc7角色背景$/) != null) return exports.coc.PcBG();
		
		
				if (trigger.match(/(^cc7版創角$|^cc七版創角$)/) != null && mainMsg[1] != NaN) return exports.coc.build7char(mainMsg[1]);
		
				if (trigger.match(/^ccb$|^cc$|^ccn[1-2]$|^cc[1-2]$|^dp$|^成長檢定$|^幕間成長$/) != null && mainMsg[1] <= 1000) { //ccb指令開始於此
					if (trigger == 'ccb' && mainMsg[1] <= 99) return exports.coc.coc6(mainMsg[1], mainMsg[2]);
		
					//DevelopmentPhase幕間成長指令開始於此
					if ((trigger == 'dp' || trigger == '成長檢定' || trigger == '幕間成長') && mainMsg[1] <= 1000) return exports.coc.DevelopmentPhase(mainMsg[1], mainMsg[2]);
					//cc指令開始於此
					if (trigger == 'cc' && mainMsg[1] <= 1000) return exports.coc.coc7(mainMsg[1], mainMsg[2]);
					//獎懲骰設定於此	
					if (trigger == 'cc1' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '1', mainMsg[2]);
					if (trigger == 'cc2' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '2', mainMsg[2]);
					if (trigger == 'ccn1' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '-1', mainMsg[2]);
					if (trigger == 'ccn2' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '-2', mainMsg[2]);
				}
		
				if (trigger.match(/(^cc7版創角$|^cc七版創角$)/) != null && mainMsg[1] != NaN) return exports.coc.build7char(mainMsg[1]);
		
				if (trigger.match(/(^cc6版創角$|^cc六版創角$)/) != null && mainMsg[1] != NaN) return exports.coc.build6char(mainMsg[1]);
		
				if (trigger.match(/^coc7角色背景$/) != null) return exports.coc.PcBG();
		
		
				if (trigger.match(/(^cc6版創角$|^cc六版創角$)/) != null && mainMsg[1] != NaN) return exports.coc.build6char(mainMsg[1]);
		
				if (trigger.match(/^ccb$|^cc$|^ccn[1-2]$|^cc[1-2]$|^dp$|^成長檢定$|^幕間成長$/) != null && mainMsg[1] <= 1000) { //ccb指令開始於此
					if (trigger == 'ccb' && mainMsg[1] <= 99) return exports.coc.coc6(mainMsg[1], mainMsg[2]);
		
					//DevelopmentPhase幕間成長指令開始於此
					if ((trigger == 'dp' || trigger == '成長檢定' || trigger == '幕間成長') && mainMsg[1] <= 1000) return exports.coc.DevelopmentPhase(mainMsg[1], mainMsg[2]);
					//cc指令開始於此
					if (trigger == 'cc' && mainMsg[1] <= 1000) return exports.coc.coc7(mainMsg[1], mainMsg[2]);
					//獎懲骰設定於此	
					if (trigger == 'cc1' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '1', mainMsg[2]);
					if (trigger == 'cc2' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '2', mainMsg[2]);
					if (trigger == 'ccn1' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '-1', mainMsg[2]);
					if (trigger == 'ccn2' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '-2', mainMsg[2]);
				}
		
				if (trigger.match(/(^cc7版創角$|^cc七版創角$)/) != null && mainMsg[1] != NaN) return exports.coc.build7char(mainMsg[1]);
		
				if (trigger.match(/(^cc6版創角$|^cc六版創角$)/) != null && mainMsg[1] != NaN) return exports.coc.build6char(mainMsg[1]);
		
				if (trigger.match(/^coc7角色背景$/) != null) return exports.coc.PcBG();
		
		
				if (trigger.match(/^coc7角色背景$/) != null) return exports.coc.PcBG();
		
				if (trigger.match(/^ccb$|^cc$|^ccn[1-2]$|^cc[1-2]$|^dp$|^成長檢定$|^幕間成長$/) != null && mainMsg[1] <= 1000) { //ccb指令開始於此
					if (trigger == 'ccb' && mainMsg[1] <= 99) return exports.coc.coc6(mainMsg[1], mainMsg[2]);
		
					//DevelopmentPhase幕間成長指令開始於此
					if ((trigger == 'dp' || trigger == '成長檢定' || trigger == '幕間成長') && mainMsg[1] <= 1000) return exports.coc.DevelopmentPhase(mainMsg[1], mainMsg[2]);
					//cc指令開始於此
					if (trigger == 'cc' && mainMsg[1] <= 1000) return exports.coc.coc7(mainMsg[1], mainMsg[2]);
					//獎懲骰設定於此	
					if (trigger == 'cc1' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '1', mainMsg[2]);
					if (trigger == 'cc2' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '2', mainMsg[2]);
					if (trigger == 'ccn1' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '-1', mainMsg[2]);
					if (trigger == 'ccn2' && mainMsg[1] <= 1000) return exports.coc.coc7bp(mainMsg[1], '-2', mainMsg[2]);
				}
		
				if (trigger.match(/(^cc7版創角$|^cc七版創角$)/) != null && mainMsg[1] != NaN) return exports.coc.build7char(mainMsg[1]);
		
				if (trigger.match(/(^cc6版創角$|^cc六版創角$)/) != null && mainMsg[1] != NaN) return exports.coc.build6char(mainMsg[1]);
		
				if (trigger.match(/^coc7角色背景$/) != null) return exports.coc.PcBG();
		
		
		
		//		if (trigger.match(/^bothelp$|^bot幫助$|^\/start$/) != null) return exports.help.Help();
	
		//nc指令開始於此 來自Rainsting/TarotLineBot 
		//if (trigger.match(/^[1-4]n[c|a][+|-][1-99]$|^[1-4]n[c|a]$/) != null) return exports.nc.nechronica(trigger, mainMsg[1]);
	
		//依戀
		//if (trigger.match(/(^nm$)/) != null) return exports.nc.nechronica_mirenn(mainMsg[1]);
	
	
		//wod 指令開始於此
		//	if (trigger.match(/^(\d+)(wd|wod)(\d|)((\+|-)(\d+)|)$/i) != null) return exports.wod.wod(trigger, mainMsg[1]);
	
		//Dx3 指令開始於此
		//	if (trigger.match(/^(\d+)(dx)(\d|)(((\+|-)(\d+)|)((\+|-)(\d+)|))$/i) != null) return exports.dx3.dx(trigger);
	
		//SW 指令開始於此
		//	if (trigger.match(/^(kk)0*([0-9][0-9]?|100)(((\+|-)(\d+)|)((\+|-)(\d+)|))(|\@(\d+))(|\$(\d+))(|\$\+(\d+))(|gf)$/i) != null) return exports.sw.sw(trigger);
	
	
		//Fisher–Yates shuffle
		//SortIt 指令開始於此
		//		if (trigger.match(/排序/) != null && mainMsg.length >= 3) return exports.funny.SortIt(inputStr, mainMsg);
		//if (trigger.match(/^d66$/) != null) return exports.advroll.d66(mainMsg[1]);
		//if (trigger.match(/^d66s$/) != null) return exports.advroll.d66s(mainMsg[1]);
	
	
		//choice 指令開始於此
		//	if (trigger.match(/choice|隨機|選項|選1/) != null && mainMsg.length >= 3) return exports.funny.choice(inputStr, mainMsg);
	
		//tarot 指令
		
		if (trigger.match(/tarot|塔羅牌|塔羅/) != null) {
			if (trigger.match(/^單張|^每日|^daily/) != null) return exports.funny.NomalDrawTarot(mainMsg[1], mainMsg[2]); //預設抽 79 張
			if (trigger.match(/^時間|^time/) != null) return exports.funny.MultiDrawTarot(mainMsg[1], mainMsg[2], 1);
			if (trigger.match(/^大十字|^cross/) != null) return exports.funny.MultiDrawTarot(mainMsg[1], mainMsg[2], 2);
		}
		
	
		//FLAG指令開始於此
		//		if (trigger.match(/立flag|死亡flag/) != null) return exports.funny.BStyleFlagSCRIPTS();
	
		//鴨霸獸指令開始於此
		//		if (trigger.match(/鴨霸獸/) != null) return exports.funny.randomReply();
		//		if (trigger.match(/運勢/) != null) return exports.funny.randomLuck(mainMsg); //占卜運氣		
	
	
	
		猜拳指令
	if (trigger.match(/猜拳/) != null) {
		return RockPaperScissors(inputStr, mainMsg[1]);
	}
	*/


	}

} catch (e) {
	console.log('error: ' + e)
}

module.exports = {
	parseInput: parseInput
};