/*
*	@filename	Overlay.js
*	@author		theBGuy
*	@desc		overlay thread for Kolbot-SoloPlay
*	@credits 	Adpist for first gen Overlay, isid0re for styleing, timer, and tracker, laz for his manual play, dzik for his hookHandler, securitycat, kolton libs
*/

if (!isIncluded("SoloPlay/Tools/Developer.js")) {
	include("SoloPlay/Tools/Developer.js");
}

if (!isIncluded("SoloPlay/Tools/Tracker.js")) {
	include("SoloPlay/Tools/Tracker.js");
}

var Overlay = {
	resfixX: me.screensize ? 0 : -100,
	resfixY: me.screensize ? 0 : -120,
	questX: 12,
	questY: 302,
	dashboardX: 410,
	dashboardY: 470,
	timerX: 700,
	timerY: 75,
	text: {
		hooks: [],
		enabled: true,

		clock: function (name) {
			var GameTracker = Developer.readObj(Tracker.GTPath),
				PrettyTotal = Developer.formatTime(GameTracker.Total + Developer.Timer(GameTracker.LastSave)),
				PrettyIG = Developer.formatTime(GameTracker.InGame + Developer.Timer(GameTracker.LastSave));

			switch (name) {
			case "Total":
				return PrettyTotal;
			case "InGame":
				return PrettyIG;
			case "OOG":
				return Developer.formatTime(GameTracker.OOG);
			case "InGameTimer":
				return " (" + new Date(getTickCount() - me.gamestarttime).toISOString().slice(11, -5) + ")";
			}

			return true;
		},

		check: function () {
			if (!this.enabled) {
				this.flush();

				return;
			}

			// Double check in case still got here before being ready
			if (!me.gameReady && !me.ingame && !me.area) {
				return;
			}

			if (!this.getHook("dashboard")) {
				this.add("dashboard");
			}

			if (!this.getHook("dashboardframe")) {
				this.add("dashboardframe");
			}

			if (!this.getHook("credits")) {
				this.add("credits");
			} else {
				this.getHook("credits").hook.text = "Kolbot-SoloPlay by ÿc0 theBGuy" + "ÿc4  Realm: ÿc0" + (me.realm ? me.realm : "SP");
			}

			if (!this.getHook("times")) {
				this.add("times");
			} else {
				this.getHook("times").hook.text = "Total: ÿc0" + this.clock("Total") + "ÿc4 InGame: ÿc0" + this.clock("InGame") + "ÿc4 OOG: ÿc0" + this.clock("OOG");
			}

			if (Developer.showInGameTimer) {
				if (!this.getHook("timerboard")) {
					this.add("timerboard");
				}

				if (!this.getHook("timerframe")) {
					this.add("timerframe");
				}

				if (!this.getHook("InGameTimer")) {
					this.add("InGameTimer");
				} else {
					this.getHook("InGameTimer").hook.text = "In Game Timer: ÿc0" + this.clock("InGameTimer");
				}
			}

			if (!this.getHook("level")) {
				this.add("level");
			} else {
				this.getHook("level").hook.text = "Name: ÿc0" + me.name + "ÿc4  Diff: ÿc0" + Difficulty[me.diff] + "ÿc4  Level: ÿc0" + me.charlvl;
			}

		},

		add: function (name) {
			switch (name) {
			case "dashboard":
				this.hooks.push({
					name: "dashboard",
					hook: new Box(Overlay.dashboardX + Overlay.resfixX, Overlay.dashboardY + Overlay.resfixY, 370, 80, 0x0, 1, 2)
				});

				break;
			case "dashboardframe":
				this.hooks.push({
					name: "dashboardframe",
					hook: new Frame(Overlay.dashboardX + Overlay.resfixX, Overlay.dashboardY + Overlay.resfixY, 370, 80, 2)
				});

				break;
			case "credits":
				this.hooks.push({
					name: "credits",
					hook: new Text("Kolbot-SoloPlay by ÿc0 theBGuy" + "ÿc4  Realm: ÿc0" + (me.realm ? me.realm : "SP"), Overlay.dashboardX + Overlay.resfixX, Overlay.dashboardY + Overlay.resfixY + 15, 4, 13, 2)
				});

				break;

			case "level":
				this.hooks.push({
					name: "level",
					hook: new Text("Name: ÿc0" + me.name + "ÿc4  Diff: ÿc0" + Difficulty[me.diff] + "ÿc4  Level: ÿc0" + me.charlvl, Overlay.dashboardX + Overlay.resfixX, Overlay.dashboardY + Overlay.resfixY + 30, 4, 13, 2)
				});

				break;
			case "times":
				this.hooks.push({
					name: "times",
					hook: new Text("Total: ÿc0" + this.clock("Total") + "ÿc4 InGame: ÿc0" + this.clock("InGame") + "ÿc4 OOG: ÿc0" + this.clock("OOG"), Overlay.dashboardX + Overlay.resfixX, Overlay.dashboardY + Overlay.resfixY + 75, 4, 13, 2)
				});

				break;
			case "timerboard":
				this.hooks.push({
					name: "timerboard",
					hook: new Box(Overlay.timerX + Overlay.resfixX, Overlay.timerY + Overlay.resfixY + 8 * (Number(!!me.diff) + Number(!!me.gamepassword) + Number(!!me.gametype) + Number(!!me.gamename)), 187, 30, 0x0, 1, 2)
				});

				break;
			case "timerframe":
				this.hooks.push({
					name: "timerframe",
					hook: new Frame(Overlay.timerX + Overlay.resfixX, Overlay.timerY + Overlay.resfixY + 8 * (Number(!!me.diff) + Number(!!me.gamepassword) + Number(!!me.gametype) + Number(!!me.gamename)), 187, 30, 2)
				});

				break;
			case "InGameTimer":
				this.hooks.push({
					name: "InGameTimer",
					hook: new Text("In Game Timer: ÿc0" + this.clock("InGameTimer"), Overlay.timerX + Overlay.resfixX + 1, Overlay.timerY + Overlay.resfixY + 20 + 8 * (Number(!!me.diff) + Number(!!me.gamepassword) + Number(!!me.gametype) + Number(!!me.gamename)), 4, 13, 2)
				});

				break;
			}
		},

		getHook: function (name) {
			var i;

			for (i = 0; i < this.hooks.length; i += 1) {
				if (this.hooks[i].name === name) {
					return this.hooks[i];
				}
			}

			return false;
		},

		flush: function () {
			while (this.hooks.length) {
				this.hooks.shift().hook.remove();
			}
		}
	},

	quests: {
		hooks: [],
		enabled: true,

		getRes: function () {
			var penalty = [[0, 20, 50], [0, 40, 100]][me.gametype][me.diff];

			// Double check in case still got here before being ready
			if (!me.gameReady || !me.ingame || !me.area) {
				return "";
			}

			let textLine = "FR: ÿc1" + (me.getStat(39) - penalty) + "ÿc4   CR: ÿc3" + (me.getStat(43) - penalty) + "ÿc4   LR: ÿc9" + (me.getStat(41) - penalty) + "ÿc4   PR: ÿc2" + (me.getStat(45) - penalty);

			return textLine;
		},

		getStats: function () {
			// Double check in case still got here before being ready
			if (!me.gameReady || !me.ingame || !me.area) {
				return "";
			}

			let textLine = "MF: ÿc8" + me.getStat(80) + "ÿc4   FHR: ÿc8" + (me.getStat(99) - Config.FHR) + "ÿc4   FBR: ÿc8" + (me.getStat(102) - Config.FBR) + "ÿc4   FCR: ÿc8" + (me.getStat(105) - Config.FCR)
				+ "ÿc4   IAS: ÿc8" + (me.getStat(93) - Config.IAS);

			return textLine;
		},

		check: function () {
			if (!this.enabled) {
				this.flush();

				return;
			}

			if (!me.gameReady || !me.ingame || !me.area || me.dead) {
				this.flush();

				return;
			}

			if (!this.getHook("resistances")) {
				this.add("resistances");
			} else {
				this.getHook("resistances").hook.text = this.getRes();
			}

			if (!this.getHook("stats")) {
				this.add("stats");
			} else {
				this.getHook("stats").hook.text = this.getStats();
			}		

			switch (me.act) {
			case 1:
				if (!this.getHook("questbox")) {
					this.add("questbox");
				}

				if (!this.getHook("questframe")) {
					this.add("questframe");
				}

				if (!this.getHook("questheader")) {
					this.add("questheader");
				} else {
					this.getHook("questheader").hook.text = "Quests in Act: ÿc0" + me.act;
				}

				if (!this.getHook("Den")) {
					this.add("Den");
				} else {
					this.getHook("Den").hook.text = "Den: " + (me.getQuest(1, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("BloodRaven")) {
					this.add("BloodRaven");
				} else {
					this.getHook("BloodRaven").hook.text = "Blood Raven: " + (me.getQuest(2, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("Tristram")) {
					this.add("Tristram");
				} else {
					this.getHook("Tristram").hook.text = "Tristram: " + (me.getQuest(4, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("Countess")) {
					this.add("Countess");
				} else {
					this.getHook("Countess").hook.text = "Countess: " + (me.getQuest(5, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("Smith")) {
					this.add("Smith");
				} else {
					this.getHook("Smith").hook.text = "Smith: " + (me.getQuest(3, 0) || me.getQuest(3, 1) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("Andariel")) {
					this.add("Andariel");
				} else {
					this.getHook("Andariel").hook.text = "Andariel: " + (me.getQuest(6, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}


				break;
			case 2:
				if (!this.getHook("questbox")) {
					this.add("questbox");
				}

				if (!this.getHook("questframe")) {
					this.add("questframe");
				}

				if (!this.getHook("questheader")) {
					this.add("questheader");
				} else {
					this.getHook("questheader").hook.text = "Quests in Act: ÿc0" + me.act;
				}

				if (!this.getHook("Cube")) {
					this.add("Cube");
				} else {
					this.getHook("Cube").hook.text = "Horadric Cube: " + (me.getItem(553) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("Radament")) {
					this.add("Radament");
				} else {
					this.getHook("Radament").hook.text = "Radament: " + (me.getQuest(9, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("HoradricStaff")) {
					this.add("HoradricStaff");
				} else {
					this.getHook("HoradricStaff").hook.text = "Horadric Staff: " + (me.getQuest(10, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("Amulet")) {
					this.add("Amulet");
				} else {
					this.getHook("Amulet").hook.text = "Amulet: " + (me.getQuest(11, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("Summoner")) {
					this.add("Summoner");
				} else {
					this.getHook("Summoner").hook.text = "Summoner: " + (me.getQuest(13, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("Duriel")) {
					this.add("Duriel");
				} else {
					this.getHook("Duriel").hook.text = "Duriel: " + (me.getQuest(14, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				break;
			case 3:
				if (!this.getHook("questbox")) {
					this.add("questbox");
				}

				if (!this.getHook("questframe")) {
					this.add("questframe");
				}

				if (!this.getHook("questheader")) {
					this.add("questheader");
				} else {
					this.getHook("questheader").hook.text = "Quests in Act: ÿc0" + me.act;
				}

				if (!this.getHook("GoldenBird")) {
					this.add("GoldenBird");
				} else {
					this.getHook("GoldenBird").hook.text = "Golden Bird: " + (me.getQuest(20, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("Khalim'sWill")) {
					this.add("Khalim'sWill");
				} else {
					this.getHook("Khalim'sWill").hook.text = "Khalim's Will: " + (me.getQuest(18, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("LamEsen")) {
					this.add("LamEsen");
				} else {
					this.getHook("LamEsen").hook.text = "LamEsen: " + (me.getQuest(17, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("Travincal")) {
					this.add("Travincal");
				} else {
					this.getHook("Travincal").hook.text = "Travincal: " + (me.getQuest(21, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("Mephisto")) {
					this.add("Mephisto");
				} else {
					this.getHook("Mephisto").hook.text = "Mephisto: " + (me.getQuest(22, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				break;
			case 4:
				if (!this.getHook("questbox")) {
					this.add("questbox");
				}

				if (!this.getHook("questframe")) {
					this.add("questframe");
				}

				if (!this.getHook("questheader")) {
					this.add("questheader");
				} else {
					this.getHook("questheader").hook.text = "Quests in Act: ÿc0" + me.act;
				}

				if (!this.getHook("Izual")) {
					this.add("Izual");
				} else {
					this.getHook("Izual").hook.text = "Izual: " + (me.getQuest(25, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("HellForge")) {
					this.add("HellForge");
				} else {
					this.getHook("HellForge").hook.text = "HellForge: " + (me.getQuest(27, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("Diablo")) {
					this.add("Diablo");
				} else {
					this.getHook("Diablo").hook.text = "Diablo: " + (me.getQuest(26, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				break;
			case 5:
				if (!this.getHook("questbox")) {
					this.add("questbox");
				}

				if (!this.getHook("questframe")) {
					this.add("questframe");
				}

				if (!this.getHook("questheader")) {
					this.add("questheader");
				} else {
					this.getHook("questheader").hook.text = "Quests in Act: ÿc0" + me.act;
				}

				if (!this.getHook("Shenk")) {
					this.add("Shenk");
				} else {
					this.getHook("Shenk").hook.text = "Shenk: " + ((me.getQuest(35, 0) || me.getQuest(35, 1)) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("Barbies")) {
					this.add("Barbies");
				} else {
					this.getHook("Barbies").hook.text = "Barbies: " + (me.getQuest(36, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("Anya")) {
					this.add("Anya");
				} else {
					this.getHook("Anya").hook.text = "Anya: " + (me.getQuest(37, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("Ancients")) {
					this.add("Ancients");
				} else {
					this.getHook("Ancients").hook.text = "Ancients: " + (me.getQuest(39, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				if (!this.getHook("Baal")) {
					this.add("Baal");
				} else {
					this.getHook("Baal").hook.text = "Baal: " + (me.getQuest(40, 0) ? "ÿc2Complete" : "ÿc1Incomplete");
				}

				break;
			}
		},

		add: function (name) {
			switch (name) {
			case "resistances":
				this.hooks.push({
					name: "resistances",
					hook: new Text(
						this.getRes(), Overlay.dashboardX + Overlay.resfixX, Overlay.dashboardY + Overlay.resfixY + 45, 4, 13, 2)
				});

				break;
			case "stats":
				this.hooks.push({
					name: "stats",
					hook: new Text(
						this.getStats(), Overlay.dashboardX + Overlay.resfixX, Overlay.dashboardY + Overlay.resfixY + 60, 4, 13, 2)
				});

				break;
			case "questbox":
				this.hooks.push({
					name: "questbox",
					hook: new Box (Overlay.questX - 8, Overlay.questY + Overlay.resfixY - 17, 190, 10 + [0, 105, 90, 90, 60, 90][me.act], 0x0, 1, 0)
				});

				break;
			case "questframe":
				this.hooks.push({
					name: "questframe",
					hook: new Frame(Overlay.questX - 8, Overlay.questY + Overlay.resfixY - 17, 190, 10 + [0, 105, 90, 90, 60, 90][me.act], 0)
				});

				break;
			case "questheader":
				this.hooks.push({
					name: "questheader",
					hook: new Text("Quests in Act: ÿc0" + me.act, Overlay.questX, Overlay.questY + Overlay.resfixY, 4, 13, 0)
				});

				break;
			case "Den":
				this.hooks.push({
					name: "Den",
					hook: new Text("Den: " + (me.getQuest(1, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 15, 4, 13, 0)
				});

				break;
			case "BloodRaven":
				this.hooks.push({
					name: "BloodRaven",
					hook: new Text("Blood Raven: " + (me.getQuest(2, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 30, 4, 13, 0)
				});

				break;
			case "Tristram":
				this.hooks.push({
					name: "Tristram",
					hook: new Text("Tristram: " + (me.getQuest(4, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 45, 4, 13, 0)
				});

				break;
			case "Countess":
				this.hooks.push({
					name: "Countess",
					hook: new Text("Countess: " + (me.getQuest(5, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 60, 4, 13, 0)
				});

				break;
			case "Smith":
				this.hooks.push({
					name: "Smith",
					hook: new Text("Smith: " + (me.getQuest(3, 0) || me.getQuest(3, 1) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 75, 4, 13, 0)
				});

				break;
			case "Andariel":
				this.hooks.push({
					name: "Andariel",
					hook: new Text("Andariel: " + (me.getQuest(6, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 90, 4, 13, 0)
				});

				break;
			case "Radament":
				this.hooks.push({
					name: "Radament",
					hook: new Text("Radament: " + (me.getQuest(9, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 15, 4, 13, 0)
				});

				break;
			case "HoradricStaff":
				this.hooks.push({
					name: "HoradricStaff",
					hook: new Text("Horadric Staff: " + (me.getQuest(10, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 30, 4, 13, 0)
				});

				break;
			case "Amulet":
				this.hooks.push({
					name: "Amulet",
					hook: new Text("Amulet: " + (me.getQuest(11, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 45, 4, 13, 0)
				});

				break;
			case "Summoner":
				this.hooks.push({
					name: "Summoner",
					hook: new Text("Summoner: " + (me.getQuest(13, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 60, 4, 13, 0)
				});

				break;
			case "Duriel":
				this.hooks.push({
					name: "Duriel",
					hook: new Text("Duriel: " + (me.getQuest(14, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 75, 4, 13, 0)
				});

				break;
			case "GoldenBird":
				this.hooks.push({
					name: "GoldenBird",
					hook: new Text("Golden Bird: " + (me.getQuest(20, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 15, 4, 13, 0)
				});

				break;
			case "Khalim'sWill":
				this.hooks.push({
					name: "Khalim'sWill",
					hook: new Text("Khalim's Will: " + (me.getQuest(18, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 30, 4, 13, 0)
				});

				break;
			case "LamEsen":
				this.hooks.push({
					name: "LamEsen",
					hook: new Text("LamEsen: " + (me.getQuest(17, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 45, 4, 13, 0)
				});

				break;
			case "Travincal":
				this.hooks.push({
					name: "Travincal",
					hook: new Text("Travincal: " + (me.getQuest(21, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 60, 4, 13, 0)
				});

				break;
			case "Mephisto":
				this.hooks.push({
					name: "Mephisto",
					hook: new Text("Mephisto: " + (me.getQuest(22, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 75, 4, 13, 0)
				});

				break;
			case "Izual":
				this.hooks.push({
					name: "Izual",
					hook: new Text("Izual: " + (me.getQuest(25, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 15, 4, 13, 0)
				});

				break;
			case "HellForge":
				this.hooks.push({
					name: "HellForge",
					hook: new Text("HellForge: " + (me.getQuest(27, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 30, 4, 13, 0)
				});

				break;
			case "Diablo":
				this.hooks.push({
					name: "Diablo",
					hook: new Text("Diablo: " + (me.getQuest(26, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 45, 4, 13, 0)
				});

				break;
			case "Shenk":
				this.hooks.push({
					name: "Shenk",
					hook: new Text("Shenk: " + ((me.getQuest(35, 0) || me.getQuest(35, 1)) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 15, 4, 13, 0)
				});

				break;
			case "Barbies":
				this.hooks.push({
					name: "Barbies",
					hook: new Text("Barbies: " + (me.getQuest(36, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 30, 4, 13, 0)
				});

				break;
			case "Anya":
				this.hooks.push({
					name: "Anya",
					hook: new Text("Anya: " + (me.getQuest(37, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 45, 4, 13, 0)
				});

				break;
			case "Ancients":
				this.hooks.push({
					name: "Ancients",
					hook: new Text("Ancients: " + (me.getQuest(39, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 60, 4, 13, 0)
				});

				break;
			case "Baal":
				this.hooks.push({
					name: "Baal",
					hook: new Text("Baal: " + (me.getQuest(26, 0) ? "ÿc2Complete" : "ÿc1Incomplete"), Overlay.questX, Overlay.questY + Overlay.resfixY + 75, 4, 13, 0)
				});

				break;
			}
		},

		getHook: function (name) {
			var i;

			while (!me.gameReady || !me.ingame || !me.area) {
				delay(500 + me.ping);
			}

			for (i = 0; i < this.hooks.length; i += 1) {
				if (this.hooks[i].name === name) {
					return this.hooks[i];
				}
			}

			return false;
		},

		flush: function () {
			while (this.hooks.length) {
				this.hooks.shift().hook.remove();
			}
		}
	},

	update: function (msg = false) {
		function status () {
			let hide = [0x01, 0x02, 0x03, 0x04, 0x05, 0x09, 0x0C, 0x0F, 0x18, 0x19, 0x1A, 0x21, 0x24];

			// from commit eb818af SoloLeveling
			if (!me.gameReady || !me.ingame || !me.area || me.dead) {
				Overlay.Disable(true);
			} else {
				while (!me.gameReady) {
					delay(100);
				}
			
				for (let flag = 0; flag < hide.length; flag++) {
					if (getUIFlag(hide[flag])) {
						while (getUIFlag(hide[flag])) {
							Overlay.text.flush();
							Overlay.quests.flush();
							delay(100);
						}

						break;
					} else {
						Overlay.text.enabled = true;
					}
				}

			}

			Overlay.text.check();

			if (Overlay.quests.enabled) {
				Overlay.quests.check();
			} else {
				Overlay.quests.flush();
			}

		}

		return msg ? true : (me.gameReady && me.ingame && !me.dead) ? status() : false;
	},

	Disable: function (all) {
		me.overhead("Disable");

		if (!!all) {
			me.overhead("Disable All");
			Overlay.text.flush();
			Overlay.quests.flush();
			Overlay.text.enabled = false;
			Overlay.quests.enabled = false;
		} else {
			Overlay.quests.flush();
			Overlay.quests.enabled = false;
			print(Overlay.quests.enabled);
		}

		delay(100);

		return true;
	},

	flush: function () {
		Overlay.quests.flush();

		return true;
	},
};