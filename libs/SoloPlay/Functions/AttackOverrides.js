/**
*  @filename    AttackOverrides.js
*  @author      theBGuy
*  @credit      jaenster, isid0re (for killTarget func)
*  @desc        Attack.js fixes and related functions
*
*/

!isIncluded("common/Attack.js") && include("common/Attack.js");

let Coords_1 = require("../Modules/Coords");

Attack.stopClear = false;
Attack.mainBosses = [sdk.monsters.Andariel, sdk.monsters.Duriel, sdk.monsters.Mephisto, sdk.monsters.Diablo, sdk.monsters.Baal];
Attack.bossesAndMiniBosses = [
	sdk.monsters.Andariel, sdk.monsters.Duriel, sdk.monsters.Mephisto, sdk.monsters.Diablo, sdk.monsters.Baal,
	sdk.monsters.Radament, sdk.monsters.Summoner, sdk.monsters.Izual, sdk.monsters.BloodRaven, sdk.monsters.Griswold,
	sdk.monsters.Hephasto, sdk.monsters.KorlictheProtector, sdk.monsters.TalictheDefender, sdk.monsters.MadawctheGuardian
];

Attack.init = function () {
	if (Config.Wereform) {
		include("common/Attacks/wereform.js");
	} else if (Config.CustomClassAttack && FileTools.exists('libs/common/Attacks/' + Config.CustomClassAttack + '.js')) {
		print('Loading custom attack file');
		include('common/Attacks/' + Config.CustomClassAttack + '.js');
	} else {
		if (!include("SoloPlay/Functions/ClassAttackOverrides/" + sdk.charclass.nameOf(me.classid) + "Attacks.js")) {
			print(sdk.colors.Red + "Failed to include: " + "SoloPlay/Functions/ClassAttackOverrides/" + this.classes[me.classid] + "Attacks.js");
			print(sdk.colors.Blue + "Loading default attacks instead");
			include("common/Attacks/" + sdk.charclass.nameOf(me.classid) + ".js");
		}
	}

	if (Config.AttackSkill[1] < 0 || Config.AttackSkill[3] < 0) {
		showConsole();
		print("ÿc1Bad attack config. Don't expect your bot to attack.");
	}

	this.getPrimarySlot();
	Skill.init();

	if (me.expansion) {
		Precast.checkCTA();
		this.checkInfinity();
		this.checkAuradin();
		this.getCurrentChargedSkillIds(true);
	}
};

Attack.getLowerResistPercent = function () {
	let calc = function (level) { return Math.floor(Math.min(25 + (45 * ((110 * level) / (level + 6)) / 100), 70));};
	if (me.expansion && CharData.skillData.chargedSkillsOnSwitch.some(chargeSkill => chargeSkill.skill === sdk.skills.LowerResist)) {
		return calc(CharData.skillData.chargedSkillsOnSwitch.find(chargeSkill => chargeSkill.skill === sdk.skills.LowerResist).level);
	}
	if (me.getSkill(sdk.skills.LowerResist, 1)) {
		return calc(me.getSkill(sdk.skills.LowerResist, 1));
	}
	return 0;
};

Attack.checkResist = function (unit = undefined, val = -1, maxres = 100) {
	if (!unit || !unit.type || unit.type === sdk.unittype.Player) return true;

	let damageType = typeof val === "number" ? this.getSkillElement(val) : val;
	let addLowerRes = !!(me.getSkill(sdk.skills.LowerResist, 1) || CharData.skillData.chargedSkillsOnSwitch.some(chargeSkill => chargeSkill.skill === sdk.skills.LowerResist)) && unit.curseable;

	// Static handler
	if (val === sdk.skills.StaticField && this.getResist(unit, damageType) < 100) {
		return unit.hpPercent > Config.CastStatic;
	}

	// TODO: sometimes unit is out of range of conviction so need to check that
	// baal in throne room doesn't have getState
	if (this.infinity && ["fire", "lightning", "cold"].includes(damageType) && unit.getState) {
		if (!unit.getState(sdk.states.Conviction)) {
			if (addLowerRes && !unit.getState(sdk.states.LowerResist) && ((unit.spectype & 0x7) || me.necromancer)) {
				let lowerResPercent = this.getLowerResistPercent();
				return (this.getResist(unit, damageType) - (Math.floor((lowerResPercent + 85) / 5))) < 100;
			}
			return this.getResist(unit, damageType) < 117;
		}

		return this.getResist(unit, damageType) < maxres;
	}

	if (this.auradin && ["physical", "fire", "cold", "lightning"].includes(damageType) && me.getState(sdk.states.Conviction) && unit.getState) {
		let valid = false;

		// our main dps is not physical despite using zeal
		if (damageType === "physical") return true;

		if (!unit.getState(sdk.states.Conviction)) {
			return (this.getResist(unit, damageType) - (this.getConvictionPercent() / 5) < 100);
		}

		// check unit's fire resistance
		if (me.getState(sdk.states.HolyFire)) {
			valid = this.getResist(unit, "fire") < maxres;
		}

		// check unit's light resistance but only if the above check failed
		if (me.getState(sdk.states.HolyShock) && !valid) {
			valid = this.getResist(unit, "lightning") < maxres;
		}

		// TODO: maybe if still invalid at this point check physical resistance? Although if we are an auradin our physcial dps is low

		return valid;
	}

	if (addLowerRes && ["fire", "lightning", "cold", "poison"].includes(damageType) && unit.getState) {
		let lowerResPercent = this.getLowerResistPercent();
		if (!unit.getState(sdk.states.LowerResist) && ((unit.isSpecial && me.gold > 500000) || me.necromancer)) {
			return (this.getResist(unit, damageType) - (Math.floor(lowerResPercent / 5)) < 100);
		}
	}

	return this.getResist(unit, damageType) < maxres;
};

// Maybe make this a prototype and use game data to also check if should attack not just can based on effort?
Attack.canAttack = function (unit = undefined) {
	if (!unit) return false;
	if (unit.type === sdk.unittype.Monster) {
		// Unique/Champion
		if (unit.spectype & 0x7) {
			if (Attack.checkResist(unit, this.getSkillElement(Config.AttackSkill[1])) || Attack.checkResist(unit, this.getSkillElement(Config.AttackSkill[2]))) {
				return true;
			}
		} else {
			if (Attack.checkResist(unit, this.getSkillElement(Config.AttackSkill[3])) || Attack.checkResist(unit, this.getSkillElement(Config.AttackSkill[4]))) {
				return true;
			}
		}

		if (Config.AttackSkill.length === 7) {
			return Attack.checkResist(unit, this.getSkillElement(Config.AttackSkill[5])) || Attack.checkResist(unit, this.getSkillElement(Config.AttackSkill[6]));
		}
	}

	return false;
};

Attack.openChests = function (range = 10, x = undefined, y = undefined) {
	if (!Config.OpenChests.Enabled) return false;
	x === undefined && (x = me.x);
	y === undefined && (y = me.y);

	if (me.getMobCount(range) > 1) return false;

	let list = [],
		ids = ["chest", "chest3", "weaponrack", "armorstand"];

	let unit = getUnit(2);

	if (unit) {
		do {
			if (unit.name && getDistance(unit, x, y) <= range
				&& ids.includes(unit.name.toLowerCase())
				&& unit.getMobCount(10) === 0) {
				list.push(copyUnit(unit));
			}
		} while (unit.getNext());
	}

	while (list.length) {
		list.sort(Sort.units);

		if (Misc.openChest(list.shift())) {
			Pickit.pickItems();
		}
	}

	return true;
};

// this might be depreciated now 
Attack.killTarget = function (name = undefined) {
	if (!name) return false;

	typeof name === "string" && (name = name.toLowerCase());
	let target = (typeof name === "object" ? name : Misc.poll(() => getUnit(1, name), 2000, 100));

	let attackCount = 0;

	if (!target) {
		console.warn("ÿc8KillTargetÿc0 :: " + name + " not found. Performing Attack.Clear(25)");
		return (Attack.clear(25) && Pickit.pickItems());
	}

	// exit if target is immune
	if (target && !Attack.canAttack(target)) {
		console.warn("ÿc8KillTargetÿc0 :: Attack failed. " + target.name + " is immune.");
		return true;
	}

	let gid = target.gid;

	// think doing this might be safer for non-teleporters, alot of the time they end up either stuck in recursive node action <-> clear loop
	// or try to bull their way through mobs to the boss and instead should try to clear to them but without the loop
	if (!Pather.canTeleport()) {
		return Attack.clear(15, 0, target);
	}

	while (attackCount < Config.MaxAttackCount) {
		if (Misc.townCheck()) {
			if (!target || !copyUnit(target).x) {
				target = Misc.poll(() => getUnit(sdk.unittype.Monster, name), 1500, 60);
			}
		}

		// Check if unit got invalidated, happens if necro raises a skeleton from the boss's corpse.
		if (!target || !copyUnit(target).x) {
			target = getUnit(1, -1, -1, gid);

			if (!target) {
				break;
			}
		}

		Config.Dodge && me.hpPercent <= Config.DodgeHP && this.deploy(target, Config.DodgeRange, 5, 9);
		attackCount > 0 && attackCount % 15 === 0 && Skill.getRange(Config.AttackSkill[1]) < 4 && Packet.flash(me.gid);

		if (!ClassAttack.doAttack(target, attackCount % 15 === 0)) {
			Packet.flash(me.gid);
		}

		me.overhead("KillTarget: " + target.name + " health " + target.hpPercent + " % left");

		attackCount += 1;

		if (!target.attackable) {
			break;
		}
	}

	ClassAttack.afterAttack();

	if (!target || !target.attackable) {
		Pickit.pickItems();
	}

	return true;
};

Attack.clearLocations = function (list = []) {
	for (let x = 0; x < list.length; x++) {
		Attack.clear(20);
		Pather.moveTo(list[x][0], list[x][1]);
		Attack.clear(20);
		Pickit.pickItems();
	}

	return true;
};

Attack.clearPos = function (x = undefined, y = undefined, range = 15, pickit = true) {
	while (!me.gameReady) {
		delay(40);
	}

	if (typeof (range) !== "number") throw new Error("Attack.clear: range must be a number.");
	if (Config.AttackSkill[1] < 0 || Config.AttackSkill[3] < 0 || Attack.stopClear || !x || !y) return false;

	let i, start, coord, skillCheck, secAttack,
		retry = 0,
		monsterList = [],
		gidAttack = [],
		attackCount = 0;

	let target = getUnit(1);

	if (target) {
		do {
			if (target.attackable && !this.skipCheck(target) && this.canAttack(target)) {
				// Speed optimization - don't go through monster list until there's at least one within clear range
				if (!start && getDistance(target, x, y) <= range && (Pather.useTeleport() || !checkCollision(me, target, 0x5))) {
					start = true;
				}

				monsterList.push(copyUnit(target));
			}
		} while (target.getNext());
	}

	while (start && monsterList.length > 0 && attackCount < 300) {
		if (me.dead || Attack.stopClear) return false;

		monsterList.sort(this.sortMonsters);
		target = copyUnit(monsterList[0]);

		if ([29, 30, 31].indexOf(me.area) > -1 && me.amazon && me.hell) {
			if ([11, 12, 13, 14].indexOf(target.classid) > -1) {
				Attack.stopClear = true;
			}
		}

		if (target.x !== undefined
			&& (getDistance(target, x, y) <= range || (this.getScarinessLevel(target) > 7 && getDistance(me, target) <= range)) && target.attackable) {
			Config.Dodge && me.hpPercent <= Config.DodgeHP && this.deploy(target, Config.DodgeRange, 5, 9);

			Misc.townCheck(true);
			let result = ClassAttack.doAttack(target, attackCount % 15 === 0);

			if (result) {
				retry = 0;

				if (result === 2) {
					monsterList.shift();
					continue;
				}

				for (i = 0; i < gidAttack.length; i += 1) {
					if (gidAttack[i].gid === target.gid) {
						break;
					}
				}

				if (i === gidAttack.length) {
					gidAttack.push({gid: target.gid, attacks: 0, name: target.name});
				}

				gidAttack[i].attacks += 1;
				attackCount += 1;
				secAttack = me.barbarian ? ((target.spectype & 0x7) ? 2 : 4) : 5;

				if (Config.AttackSkill[secAttack] > -1 && (!Attack.checkResist(target, Config.AttackSkill[(target.spectype & 0x7) ? 1 : 3]) ||
						(me.paladin && Config.AttackSkill[(target.spectype & 0x7) ? 1 : 3] === 112 && !ClassAttack.getHammerPosition(target)))) {
					skillCheck = Config.AttackSkill[secAttack];
				} else {
					skillCheck = Config.AttackSkill[(target.spectype & 0x7) ? 1 : 3];
				}

				// Desync/bad position handler
				switch (skillCheck) {
				case sdk.skills.BlessedHammer:
					// Tele in random direction with Blessed Hammer
					if (gidAttack[i].attacks > 0 && gidAttack[i].attacks % ((target.spectype & 0x7) ? 4 : 2) === 0) {
						coord = CollMap.getRandCoordinate(me.x, -1, 1, me.y, -1, 1, 5);
						Pather.moveTo(coord.x, coord.y);
					}

					break;
				default:
					// Flash with melee skills
					if (gidAttack[i].attacks > 0 && gidAttack[i].attacks % ((target.spectype & 0x7) ? 15 : 5) === 0 && Skill.getRange(skillCheck) < 4) {
						Packet.flash(me.gid);
					}

					break;
				}

				// Skip non-unique monsters after 15 attacks, except in Throne of Destruction
				if (me.area !== sdk.areas.ThroneofDestruction && !(target.spectype & 0x7) && gidAttack[i].attacks > 15) {
					print("ÿc1Skipping " + target.name + " " + target.gid + " " + gidAttack[i].attacks);
					monsterList.shift();
				}

				if (target.mode === 0 || target.mode === 12 || Config.FastPick === 2) {
					Pickit.fastPick();
				}
			} else {
				if (retry++ > 3) {
					monsterList.shift();
					retry = 0;
				}

				Packet.flash(me.gid);
			}
		} else {
			monsterList.shift();
		}
	}

	ClassAttack.afterAttack(pickit);
	pickit && this.openChests(range, x, y);
	attackCount > 0 && pickit && Pickit.pickItems();

	return true;
};

Attack.buildMonsterList = function (skipBlocked = false) {
	let monster, monList = [];
	skipBlocked === true && (skipBlocked = 0x4);
	monster = getUnit(1);

	if (monster) {
		do {
			if (monster.attackable) {
				monList.push(copyUnit(monster));
			}
		} while (monster.getNext());
	}

	return skipBlocked === 0x4 ? monList.filter(mob => !checkCollision(me, mob, skipBlocked)) : monList;
};

Attack.getMobCountAtPosition = function (x, y, range, filter = false, debug = true) {
	let list = [],
		count = 0,
		ignored = [243];

	list = this.buildMonsterList(true);
	filter && (list = list.filter(mob => mob.spectype === 0));
	list.sort(Sort.units);
	debug = Developer.debugging.pathing;

	for (let i = 0; i < list.length; i++) {
		if (ignored.indexOf(list[i].classid) === -1 && list[i].attackable && getDistance(x, y, list[i].x, list[i].y) <= range) {
			count += 1;
		}
	}

	debug && console.log(sdk.colors.Yellow + "getMobCountAtPosition :: " + sdk.colors.White + count + " monsters at x: " + x + " y: " + y);

	return count;
};

// Clear an entire area based on settings
Attack.clearLevelEx = function (givenSettings = {}) {
	// credit @jaenstr
	let settings = Object.assign({}, {
		spectype: Config.ClearType,
		quitWhen: () => {}
	}, givenSettings);

	let result, myRoom, previousArea, rooms = [];
	let room = getRoom();
	let currentArea = getArea().id;

	if (!room) return false;

	function RoomSort(a, b) {
		return getDistance(myRoom[0], myRoom[1], a[0], a[1]) - getDistance(myRoom[0], myRoom[1], b[0], b[1]);
	}

	do {
		rooms.push([room.x * 5 + room.xsize / 2, room.y * 5 + room.ysize / 2]);
	} while (room.getNext());

	while (rooms.length > 0) {
		// get the first room + initialize myRoom var
		!myRoom && (room = getRoom(me.x, me.y));

		if (room) {
			// use previous room to calculate distance
			if (room instanceof Array) {
				myRoom = [room[0], room[1]];
			} else {
				// create a new room to calculate distance (first room, done only once)
				myRoom = [room.x * 5 + room.xsize / 2, room.y * 5 + room.ysize / 2];
			}
		}

		rooms.sort(RoomSort);
		room = rooms.shift();
		result = Pather.getNearestWalkable(room[0], room[1], 18, 3);

		if (result) {
			Pather.moveTo(result[0], result[1], 3, settings.spectype);
			previousArea = result;

			if (settings.quitWhen()) return true;
			if (!this.clear(40, settings.spectype)) {
				break;
			}
		} else if (currentArea !== getArea().id) {
			// Make sure bot does not get stuck in different area.
			Pather.moveTo(previousArea[0], previousArea[1], 3, settings.spectype);
		}
	}

	return true;
};

// Clear an entire area until area is done or level is reached
Attack.clearLevelUntilLevel = function (charlvl = undefined, spectype = 0) {
	let room, result, rooms, myRoom, currentArea, previousArea;
	!charlvl && (charlvl = me.charlvl + 1);

	function RoomSort(a, b) {
		return getDistance(myRoom[0], myRoom[1], a[0], a[1]) - getDistance(myRoom[0], myRoom[1], b[0], b[1]);
	}

	room = getRoom();

	if (!room) return false;

	rooms = [];
	currentArea = getArea().id;

	do {
		rooms.push([room.x * 5 + room.xsize / 2, room.y * 5 + room.ysize / 2]);
	} while (room.getNext());

	myPrint("Starting Clear until level My level: " + me.charlvl + " wanted level: " + charlvl);

	while (rooms.length > 0) {
		// get the first room + initialize myRoom var
		if (!myRoom) {
			room = getRoom(me.x, me.y);
		}

		if (room) {
			if (room instanceof Array) { // use previous room to calculate distance
				myRoom = [room[0], room[1]];
			} else { // create a new room to calculate distance (first room, done only once)
				myRoom = [room.x * 5 + room.xsize / 2, room.y * 5 + room.ysize / 2];
			}
		}

		rooms.sort(RoomSort);
		room = rooms.shift();
		result = Pather.getNearestWalkable(room[0], room[1], 18, 3);

		if (result) {
			Pather.moveTo(result[0], result[1], 3, spectype);
			previousArea = result;

			if (Attack.stopClear) {
				Attack.stopClear = false;	// Reset value
				return true;
			}

			if (me.charlvl >= charlvl) {
				myPrint("Clear until level requirment met. My level: " + me.charlvl + " wanted level: " + charlvl);
				return true;
			}

			if (!this.clear(40, spectype)) {
				break;
			}
		} else if (currentArea !== getArea().id) {
			// Make sure bot does not get stuck in different area.
			Pather.moveTo(previousArea[0], previousArea[1], 3, spectype);
		}
	}

	return true;
};

// Clear monsters in a section based on range and spectype or clear monsters around a boss monster
// probably going to change to passing an object
// accepts object for bossId or classid, gid sometimes works depends if the gid is > 999
// should stop clearing after boss is killed if we are using bossid
Attack.clear = function (range = 25, spectype = 0, bossId = false, sortfunc = undefined, pickit = true) {
	while (!me.gameReady) {
		delay(40);
	}

	if (typeof (range) !== "number") throw new Error("Attack.clear: range must be a number.");
	if (Config.AttackSkill[1] < 0 || Config.AttackSkill[3] < 0 || Attack.stopClear) return false;
	!sortfunc && (sortfunc = this.sortMonsters);

	let i, boss, orgx, orgy, start, skillCheck,
		retry = 0,
		gidAttack = [],
		attackCount = 0;

	if (bossId) {
		boss = Misc.poll(function () {
			switch (true) {
			case typeof bossId === "object":
				return bossId;
			case ((typeof bossId === "number" && bossId > 999)):
				return getUnit(1, -1, -1, bossId);
			default:
				return getUnit(1, bossId);
			}
		}, 2000, 100);

		if (!boss) {
			console.warn("Attack.clear: " + bossId + " not found");
			return Attack.clear(10);
		}

		({orgx, orgy} = {orgx: boss.x, orgy: boss.y});
		Config.MFLeader && !!bossId && Pather.makePortal() && say("clear " + bossId);
	} else {
		({orgx, orgy} = {orgx: me.x, orgy: me.y});
	}

	let monsterList = [];
	let target = getUnit(1);

	if (target) {
		do {
			if ((!spectype || (target.spectype & spectype)) && target.attackable && !this.skipCheck(target)) {
				// Speed optimization - don't go through monster list until there's at least one within clear range
				if (!start && getDistance(target, orgx, orgy) <= range && (Pather.canTeleport() || !checkCollision(me, target, 0x1))) {
					start = true;
				}

				monsterList.push(copyUnit(target));
			}
		} while (target.getNext());
	}

	while (start && monsterList.length > 0 && attackCount < 300) {
		if (boss) {
			({orgx, orgy} = {orgx: boss.x, orgy: boss.y});
		}

		if (me.dead || Attack.stopClear) return false;

		monsterList.sort(sortfunc);
		target = copyUnit(monsterList[0]);

		if (target.x !== undefined
			&& (getDistance(target, orgx, orgy) <= range || (this.getScarinessLevel(target) > 7 && getDistance(me, target) <= range)) && target.attackable) {
			Config.Dodge && me.hpPercent <= Config.DodgeHP && this.deploy(target, Config.DodgeRange, 5, 9);
			Misc.townCheck(true);
			let result = ClassAttack.doAttack(target, attackCount % 15 === 0);

			if (result) {
				retry = 0;

				if (result === 2) {
					monsterList.shift();
					continue;
				}

				for (i = 0; i < gidAttack.length; i += 1) {
					if (gidAttack[i].gid === target.gid) {
						break;
					}
				}

				if (i === gidAttack.length) {
					gidAttack.push({gid: target.gid, attacks: 0, name: target.name});
				}

				gidAttack[i].attacks += 1;
				attackCount += 1;
				let secAttack = me.barbarian ? ((target.spectype & 0x7) ? 2 : 4) : 5;

				if (Config.AttackSkill[secAttack] > -1 && (!Attack.checkResist(target, Config.AttackSkill[(target.spectype & 0x7) ? 1 : 3]) ||
						(me.paladin && Config.AttackSkill[(target.spectype & 0x7) ? 1 : 3] === sdk.skills.BlessedHammer && !ClassAttack.getHammerPosition(target)))) {
					skillCheck = Config.AttackSkill[secAttack];
				} else {
					skillCheck = Config.AttackSkill[(target.spectype & 0x7) ? 1 : 3];
				}

				// Desync/bad position handler
				switch (skillCheck) {
				case sdk.skills.BlessedHammer:
					// Tele in random direction with Blessed Hammer
					if (gidAttack[i].attacks > 0 && gidAttack[i].attacks % ((target.spectype & 0x7) ? 4 : 2) === 0) {
						let coord = CollMap.getRandCoordinate(me.x, -1, 1, me.y, -1, 1, 5);
						Pather.moveTo(coord.x, coord.y);
					}

					break;
				default:
					// Flash with melee skills
					if (gidAttack[i].attacks > 0 && gidAttack[i].attacks % ((target.spectype & 0x7) ? 15 : 5) === 0 && Skill.getRange(skillCheck) < 4) {
						Packet.flash(me.gid);
					}

					break;
				}

				// Skip non-unique monsters after 15 attacks, except in Throne of Destruction
				if (me.area !== sdk.areas.ThroneofDestruction && !(target.spectype & 0x7) && gidAttack[i].attacks > 15) {
					print("ÿc1Skipping " + target.name + " " + target.gid + " " + gidAttack[i].attacks);
					monsterList.shift();
				}

				if (target.mode === 0 || target.mode === 12 || Config.FastPick === 2) {
					Pickit.fastPick();
				}
			} else {
				if (Coords_1.isBlockedBetween(me, target)) {
					print("ÿc1Skipping " + target.name + " because they are blocked. Collision: " + Coords_1.getCollisionBetweenCoords(me.x, me.y, target.x, target.y).toString(16));
					monsterList.shift();
					retry = 0;
				}

				if (retry++ > 3) {
					monsterList.shift();
					retry = 0;
				}

				Packet.flash(me.gid);
			}
		} else {
			monsterList.shift();
		}
	}

	ClassAttack.afterAttack(pickit);
	this.openChests(range, orgx, orgy);
	attackCount > 0 && pickit && Pickit.pickItems();

	return true;
};

Attack.clearEx = function (givenSettings) {
	while (!me.gameReady) {
		delay(40);
	}

	let settings = Object.assign({}, {
		allowTeleport: true,
		allowTown: true,
		allowPicking: true,
		range: 25,
		bossId: false,
		spectype: 0,
		sortfunc: () => {}
	}, givenSettings);

	if (typeof (settings.range) !== "number") { throw new Error("Attack.clear: range must be a number."); }
	if (Config.AttackSkill[1] < 0 || Config.AttackSkill[3] < 0 || Attack.stopClear) return false;
	!settings.sortfunc && (settings.sortfunc = this.sortMonsters);

	let i, boss, orgx, orgy, target, result, monsterList, start, coord, skillCheck, secAttack,
		retry = 0,
		gidAttack = [],
		attackCount = 0;

	if (settings.bossId) {
		for (i = 0; !boss && i < 5; i++) {
			boss = settings.bossId > 999 ? getUnit(sdk.unittype.Monster, -1, -1, settings.bossId) : getUnit(sdk.unittype.Monster, settings.bossId);
			delay(200);
		}

		if (!boss) {
			print("Attack.clear: " + bossId + " not found");

			orgx = me.x;
			orgy = me.y;
		} else {
			orgx = boss.x;
			orgy = boss.y;
		}
	} else {
		orgx = me.x;
		orgy = me.y;
	}

	monsterList = [];
	target = getUnit(1);

	if (target) {
		do {
			if ((!settings.spectype || (target.spectype & settings.spectype)) && target.attackable && !this.skipCheck(target)) {
				// Speed optimization - don't go through monster list until there's at least one within clear range
				if (!start && getDistance(target, orgx, orgy) <= range && (Pather.canTeleport() || !checkCollision(me, target, 0x5))) {
					start = true;
				}

				monsterList.push(copyUnit(target));
			}
		} while (target.getNext());
	}

	while (start && monsterList.length > 0 && attackCount < 300) {
		if (boss) {
			orgx = boss.x;
			orgy = boss.y;
		}

		if (me.dead || Attack.stopClear) return false;

		monsterList.sort(sortfunc);
		target = copyUnit(monsterList[0]);

		if (target.x !== undefined && (getDistance(target, orgx, orgy) <= range || (this.getScarinessLevel(target) > 7 && target.distance <= settings.range)) && target.attackable) {
			if (Config.Dodge && me.hpPercent <= Config.DodgeHP) {
				this.deploy(target, Config.DodgeRange, 5, 9);
			}

			settings.allowTown && Misc.townCheck(true);
			result = ClassAttack.doAttack(target, attackCount % 15 === 0);

			if (result) {
				retry = 0;

				if (result === 2) {
					monsterList.shift();
					continue;
				}

				for (i = 0; i < gidAttack.length; i++) {
					if (gidAttack[i].gid === target.gid) {
						break;
					}
				}

				if (i === gidAttack.length) {
					gidAttack.push({gid: target.gid, attacks: 0, name: target.name});
				}

				gidAttack[i].attacks += 1;
				attackCount += 1;
				secAttack = me.barbarian ? ((target.spectype & 0x7) ? 2 : 4) : 5;

				if (Config.AttackSkill[secAttack] > -1 && (!Attack.checkResist(target, Config.AttackSkill[(target.spectype & 0x7) ? 1 : 3]) ||
						(me.paladin && Config.AttackSkill[(target.spectype & 0x7) ? 1 : 3] === sdk.skills.BlessedHammer && !ClassAttack.getHammerPosition(target)))) {
					skillCheck = Config.AttackSkill[secAttack];
				} else {
					skillCheck = Config.AttackSkill[(target.spectype & 0x7) ? 1 : 3];
				}

				// Desync/bad position handler
				switch (skillCheck) {
				case sdk.skills.BlessedHammer:
					// Tele in random direction with Blessed Hammer
					if (gidAttack[i].attacks > 0 && gidAttack[i].attacks % ((target.spectype & 0x7) ? 4 : 2) === 0) {
						coord = CollMap.getRandCoordinate(me.x, -1, 1, me.y, -1, 1, 5);
						Pather.moveTo(coord.x, coord.y);
					}

					break;
				default:
					// Flash with melee skills
					if (gidAttack[i].attacks > 0 && gidAttack[i].attacks % ((target.spectype & 0x7) ? 15 : 5) === 0 && Skill.getRange(skillCheck) < 4) {
						Packet.flash(me.gid);
					}

					break;
				}

				// Skip non-unique monsters after 15 attacks, except in Throne of Destruction
				if (me.area !== sdk.areas.ThroneofDestruction && !(target.spectype & 0x7) && gidAttack[i].attacks > 15) {
					print("ÿc1Skipping " + target.name + " " + target.gid + " " + gidAttack[i].attacks);
					monsterList.shift();
				}

				if (target.mode === 0 || target.mode === 12 || Config.FastPick === 2) {
					Pickit.fastPick();
				}
			} else {
				if (Coords_1.isBlockedBetween(me, target)) {
					print("ÿc1Skipping " + target.name + " because they are blocked. Collision: " + Coords_1.getCollisionBetweenCoords(me.x, me.y, target.x, target.y).toString(16));
					monsterList.shift();
					retry = 0;
				}

				if (retry++ > 3) {
					monsterList.shift();
					retry = 0;
				}

				Packet.flash(me.gid);
			}
		} else {
			monsterList.shift();
		}
	}

	ClassAttack.afterAttack(settings.allowPicking);
	settings.allowPicking && this.openChests(range, orgx, orgy);
	attackCount > 0 && settings.allowPicking && Pickit.pickItems();

	return true;
};

// Take a array of coords - path and clear
// pick parameter is range of items to pick
// From legacy sonic
Attack.clearCoordList = function (list, pick) {
	for (let node of list) {
		Attack.clear(node.radius);
		Pather.moveTo(node.x, node.y);
		Attack.clear(node.radius);
		pick && Pickit.pickItems(pick);
	}
};

// maybe store the copyUnit of the item or at least gid so we don't need to iterate through all our items to find the one with the charged skill when we need it
Attack.getCurrentChargedSkillIds = function (init = false) {
	let currentChargedSkills = [];
	let chargedSkillsOnSwitch = [];

	// Item must be equipped, or a charm in inventory
	me.getItemsEx(-1)
		.filter(item => item && (item.isEquipped && !item.rare || (item.isInInventory && [sdk.itemtype.SmallCharm, sdk.itemtype.MediumCharm, sdk.itemtype.LargeCharm].includes(item.itemType))))
		.forEach(function (item) {
			let stats = item.getStat(-2);

			if (stats.hasOwnProperty(204)) {
				if (stats[204] instanceof Array) {
					for (let i = 0; i < stats[204].length; i += 1) {
						if (stats[204][i] !== undefined) {
							// add to total list
							if (stats[204][i].charges > 0 && !currentChargedSkills.includes(stats[204][i].skill)) {
								currentChargedSkills.push(stats[204][i].skill);
							}

							// add to switch only list for use with swtich casting
							if (stats[204][i].charges > 0 && !chargedSkillsOnSwitch.some(chargeSkill => chargeSkill.skill === stats[204][i].skill) && item.isOnSwap) {
								chargedSkillsOnSwitch.push({skill: stats[204][i].skill, level: stats[204][i].level});
							}
						}
					}
				} else {
					// add to total list
					if (stats[204].charges > 0 && !currentChargedSkills.includes(stats[204].skill)) {
						currentChargedSkills.push(stats[204].skill);
					}

					// add to switch only list for use with swtich casting
					if (stats[204].charges > 0 && !chargedSkillsOnSwitch.some(chargeSkill => chargeSkill.skill === stats[204].skill) && item.isOnSwap) {
						chargedSkillsOnSwitch.push({skill: stats[204].skill, level: stats[204].skill});
					}
				}
			}
		});

	// only update other threads if this isn't being called from Attack.init
	if (CharData.skillData.currentChargedSkills.length > 0 || init) {
		switch (true) {
		case !currentChargedSkills.equals(CharData.skillData.currentChargedSkills):
		case Object.keys(Misc.recursiveSearch(chargedSkillsOnSwitch, CharData.skillData.chargedSkillsOnSwitch)).length > 0:
			CharData.skillData.init(currentChargedSkills, chargedSkillsOnSwitch);
			!init && CharData.skillData.update();
			break;
		}
	}

	return true;
};

Attack.getItemCharges = function (skillId = undefined) {
	if (!skillId) return false;

	let chargedItems = [], validCharge = function (itemCharge) {
		return itemCharge.skill === skillId && itemCharge.charges > 1;
	};

	// Item must equipped, or a charm in inventory
	me.getItemsEx(-1)
		.filter(item => item && (item.isEquipped && !item.rare || (item.isInInventory && [sdk.itemtype.SmallCharm, sdk.itemtype.MediumCharm, sdk.itemtype.LargeCharm].includes(item.itemType))))
		.forEach(function (item) {
			let stats = item.getStat(-2);

			if (stats.hasOwnProperty(204)) {
				if (stats[204] instanceof Array) {
					stats = stats[204].filter(validCharge);
					stats.length && chargedItems.push({
						charge: stats.first(),
						item: item
					});
				} else {
					if (stats[204].skill === skillId && stats[204].charges > 1) {
						chargedItems.push({
							charge: stats[204].charges,
							item: item
						});
					}
				}
			}
		});

	return !!(chargedItems.length > 0);
};

Attack.castCharges = function (skillId = undefined, unit = undefined) {
	if (!skillId || !unit || !Skill.wereFormCheck(skillId) || (me.inTown && !Skill.townSkill(skillId))) {
		return false;
	}

	me.castChargedSkill(skillId, unit);
	me.weaponswitch === 1 && me.switchWeapons(0);

	return true;
};

Attack.switchCastCharges = function (skillId = undefined, unit = undefined) {
	if (!skillId || !unit || !Skill.wereFormCheck(skillId) || (me.inTown && !Skill.townSkill(skillId))) {
		return false;
	}

	me.castSwitchChargedSkill(skillId, unit);
	me.weaponswitch === 1 && me.switchWeapons(0);

	return true;
};

Attack.dollAvoid = function (unit = undefined) {
	if (!unit) return false;
	let distance = 14;

	for (let i = 0; i < 2 * Math.PI; i += Math.PI / 6) {
		let cx = Math.round(Math.cos(i) * distance);
		let cy = Math.round(Math.sin(i) * distance);

		if (Attack.validSpot(unit.x + cx, unit.y + cy)) {
			return Pather.moveTo(unit.x + cx, unit.y + cy);
		}
	}

	return false;
};

// Its the inverse of spotOnDistance, its a spot going in the direction of the spot
Attack.inverseSpotDistance = function (spot, distance, otherSpot) {
	otherSpot === undefined && (otherSpot = me);
	let x = otherSpot.x, y = otherSpot.y, area = otherSpot.area;
	let nodes = getPath(area, x, y, spot.x, spot.y, 2, 5);
	return nodes && nodes.find((node) => node.distance > distance) || { x: x, y: y };
};

Attack.shouldDodge = function (coord, monster) {
	return !!monster && getUnits(3)
		// for every missle that isnt from our merc
		.filter(missile => missile && monster && monster.gid === missile.owner)
		// if any
		.some(missile => {
			let xoff = Math.abs(coord.x - missile.targetx),
				yoff = Math.abs(coord.y - missile.targety),
				xdist = Math.abs(coord.x - missile.x),
				ydist = Math.abs(coord.y - missile.y);

			// If missile wants to hit is and is close to us
			return xoff < 7 && yoff < 7 && xdist < 13 && ydist < 13;
		});
};

Attack.pwnDury = function () {
	let duriel = Misc.poll(() => getUnit(1, sdk.monsters.Duriel));

	if (!duriel) return false;
	Attack.stopClear = true;
	let saveSpots = [
		{ x: 22648, y: 15688 },
		{ x: 22624, y: 15725 },
	];

	while (!duriel.dead) {
		//ToDo; figure out static
		if (duriel.getState(sdk.states.Frozen) && duriel.distance < 7 || duriel.distance < 12) {
			let safeSpot = saveSpots.sort((a, b) => getDistance(duriel, b) - getDistance(duriel, a))[0];
			Pather.teleportTo(safeSpot.x, safeSpot.y);
		}
		ClassAttack.doAttack(duriel, true);
	}

	Attack.stopClear = false;
	return true;
};

Attack.pwnMeph = function () {
	// TODO: fill out
};

// Credit @Jaenster - modified by me(theBGuy) for other classes
Attack.pwnDia = function () {
	// Can't farcast if our skill main attack isn't meant for it
	if ((!me.sorceress && !me.necromancer && !me.assassin)
		|| (["Poison", "Summon"].includes(SetUp.currentBuild))
		|| (Skill.getRange(Config.AttackSkill[1]) < 10)) {
		return false;
	}

	let calculateSpots = function (center, skillRange) {
		let coords = [];
		for (let i = 0; i < 360; i++) {
			coords.push({
				x: Math.floor(center.x + skillRange * Math.cos(i) + 0.5),
				y: Math.floor(center.y + skillRange * Math.sin(i) + 0.5),
			});
		}
		return coords.filter(function (e, i, s) { return s.indexOf(e) === i; }) // only unique spots
			.filter(function (el) { return Attack.validSpot(el.x, el.y); });
	};

	let checkMobs = function () {
		let mobs = getUnits(1).filter(function(el) {
			return !!el && el.attackable && el.classid !== sdk.monsters.Diablo && el.distance < 20;
		});
		return mobs;
	};

	let getDiablo = function () {
		let check = checkMobs();
		!!check && Attack.clearList(check);
		return getUnit(sdk.unittype.Monster, sdk.monsters.Diablo);
	};
	{
		let nearSpot = Pather.spotOnDistance({ x: 7792, y: 5292 }, 35, {returnSpotOnError: false});
		Pather.moveToUnit(nearSpot);
	}

	let dia = Misc.poll(getDiablo, 15e3, 30);

	if (!dia) {
		// Move to Star
		Pather.moveTo(7788, 5292, 3, 30);
		dia = Misc.poll(getDiablo, 15e3, 30);
	}

	if (!dia) {
		print("No diablo");
		return false;
	}

	let tick = getTickCount();
	let lastPosition = { x: 7791, y: 5293 };
	let minRange, minDist, maxRange, maxDist;
	let manaTP, manaSK, manaStatic, rangeStatic;

	// set values
	switch (me.classid) {
	case sdk.charclass.Sorceress:
		manaTP = Skill.getManaCost(sdk.skills.Teleport);
		manaSK = Skill.getManaCost(Config.AttackSkill[1]);
		manaStatic = Skill.getManaCost(sdk.skills.StaticField);
		rangeStatic = Skill.getRange(sdk.skills.StaticField);

		switch (Config.AttackSkill[1]) {
		case sdk.skills.FrozenOrb:
			minDist = 15;
			maxDist = 20;
			minRange = 10;
			maxRange = 20;

			break;
		case sdk.skills.Lightning:
			minDist = 20;
			maxDist = 25;
			minRange = 18;
			maxRange = 25;

			break;
		case sdk.skills.Blizzard:
		case sdk.skills.Meteor:
			minDist = 40;
			maxDist = 45;
			minRange = 15;
			maxRange = 58;

			break;
		}

		break;
	case sdk.charclass.Necromancer:
		minDist = 35;
		maxDist = 40;
		minRange = 15;
		maxRange = 50;

		break;
	case sdk.charclass.Assassin:
		minDist = 25;
		maxDist = 30;
		minRange = 15;
		maxRange = 30;

		break;
	}
	
	let shouldWalk = function (spot) {
		if (!Pather.canTeleport()) return true;
		return (spot.distance < 10 || me.gold < 10000 || me.mpPercent < 50);
	};

	Attack.stopClear = true;

	do {
		// give up in 10 minutes
		if (getTickCount() - tick > 60 * 1000 * 10) {
			break;
		}

		while ((dia = getDiablo())) {
			if (dia.dead) {
				me.overhead("Diablo's dead");
				break;
			}

			if (getDistance(me, dia) < minDist || getDistance(me, dia) > maxDist || getTickCount() - tick > 25e3) {
				let spot = calculateSpots(dia, ((minRange + maxRange) / 2))
					.filter((loc) => getDistance(me, loc) > minRange && getDistance(me, loc) < maxRange /*todo, in neighbour room*/)
					.filter(function (loc) {
						let collision = getCollision(me.area, loc.x, loc.y);
						// noinspection JSBitwiseOperatorUsage
						let isLava = !!(collision & Coords_1.BlockBits.IsOnFloor);
						// this spot is on lava, fuck this
						if (isLava) return false;
						// noinspection JSBitwiseOperatorUsage
						return !(collision & (Coords_1.BlockBits.BlockWall));
					})
					.sort((a, b) => getDistance(me, a) - getDistance(me, b))
					.first();
				tick = getTickCount();
				if (spot !== undefined) {
					shouldWalk(spot) ? Pather.walkTo(spot.x, spot.y) : Pather.moveTo(spot.x, spot.y, 15, false);
				}
			}

			if (me.sorceress && me.mp < manaSK + manaTP) {
				me.overhead('Dont attack, save mana for teleport');
				delay(10);
				continue;
			}

			if (me.necromancer || me.assassin) {
				me.overhead("FarCasting: Diablo's health " + dia.hpPercent + " % left");
				ClassAttack.farCast(dia);
			} else {
				// If we got enough mana to teleport close to diablo, static the bitch, and jump back
				let diabloMissiles = getUnits(3).filter(function (unit) { let _a; return ((_a = unit.getParent()) === null || _a === void 0 ? void 0 : _a.gid) === dia.gid; });
				print('Diablo missiles: ' + diabloMissiles.length);
				print('Diablo mode:' + dia.mode);
				me.overhead('Dia life ' + (~~(dia.hp / 128 * 100)).toString() + '%');
				if (me.mp > manaStatic + manaTP + manaTP && diabloMissiles.length < 3 && ![4, 5, 7, 8, 9, 10, 11].includes(dia.mode) && dia.hpPercent > Config.CastStatic) {
					let x = me.x, y = me.y;
					// Find a spot close to Diablo
					let spot = Pather.spotOnDistance(dia, rangeStatic * (2 / 3), {returnSpotOnError: false});
					Pather.moveTo(spot.x, spot.y);
					Skill.cast(sdk.skills.StaticField);
					// Walk randomly away from diablo
					let randFn = function (v) { return function () { return v + rand(0, 20) - 10; }; };
					let rX = randFn(x), rY = randFn(y);
					[
						Attack.inverseSpotDistance({ x: x, y: y }, 3),
						Attack.inverseSpotDistance({ x: rX(), y: rY() }, 5),
						Attack.inverseSpotDistance({ x: rX(), y: rY() }, 7),
						Attack.inverseSpotDistance({ x: rX(), y: rY() }, 10),
					].forEach(function (_a) {
						let x = _a.x, y = _a.y;
						return Misc.click(0, 0, x, y);
					});
					Pather.moveTo(x, y);
				}
				Skill.cast(Config.AttackSkill[1], 0, dia);

				if (!!dia && !checkCollision(me, dia, Coords_1.Collision.BLOCK_MISSILE) && Skill.getRange(Config.AttackSkill[2]) > 15) {
					Skill.cast(Config.AttackSkill[2], 0, dia);
				}
			}
		}

		if (dia && dia.dead) {
			break;
		}

		if (!dia) {
			let path = getPath(me.area, me.x, me.y, lastPosition.x, lastPosition.y, 1, 5);

			// failed to make a path from me to the old spot
			if (!path) {
				break;
			}

			// walk close to old node, if we dont find dia continue
			if (!path.some(function (node) {
				Pather.walkTo(node.x, node.y);
				return getDiablo();
			})) {
				break;
			}
		}
	} while (true);

	!!dia ? Pather.moveTo(dia) : Pather.moveTo(7774, 5305);
	Pickit.pickItems();
	Pather.moveTo(7792, 5291);	// Move back to star
	Pickit.pickItems();
	Attack.stopClear = false;

	return dia;
};

Attack.deploy = function (unit, distance = 10, spread = 5, range = 9) {
	if (arguments.length < 4) throw new Error("deploy: Not enough arguments supplied");

	function sortGrid(a, b) {
		return getDistance(b.x, b.y, unit.x, unit.y) - getDistance(a.x, a.y, unit.x, unit.y);
	}

	let grid, index, currCount;
	let monList = [];
	let count = 999;

	monList = this.buildMonsterList();
	monList.sort(Sort.units);

	if (this.getMonsterCount(me.x, me.y, 15, monList) === 0) return true;

	CollMap.getNearbyRooms(unit.x, unit.y);
	grid = this.buildGrid(unit.x - distance, unit.x + distance, unit.y - distance, unit.y + distance, spread);

	if (!grid.length) return false;
	grid.sort(sortGrid);

	for (let i = 0; i < grid.length; i += 1) {
		if (!(CollMap.getColl(grid[i].x, grid[i].y, true) & 0x1) && !CollMap.checkColl(unit, {x: grid[i].x, y: grid[i].y}, 0x4)) {
			currCount = this.getMonsterCount(grid[i].x, grid[i].y, range, monList);

			if (currCount < count) {
				index = i;
				count = currCount;
			}

			if (currCount === 0) {
				break;
			}
		}
	}

	return typeof index === "number" ? Pather.moveTo(grid[index].x, grid[index].y, 0) : false;
};

Attack.getIntoPosition = function (unit = false, distance = 0, coll = 0, walk = false, force = false) {
	if (!unit || !unit.x || !unit.y) return false;
	let useTele = Pather.useTeleport();
	walk === true && (walk = 1);

	if (distance < 4 && (!unit.hasOwnProperty("mode") || (unit.mode !== 0 && unit.mode !== 12))) {
		// we are actually able to walk to where we want to go, hopefully prevent wall hugging
		if (walk && (unit.distance < 8 || !CollMap.checkColl(me, unit, 0x5 | 0x400 | 0x1000))) {
			Pather.walkTo(unit.x, unit.y, 3);
		} else {
			// don't clear while trying to reposition
			Pather.moveToEx(unit.x, unit.y, {clearSettings: {allowClearing: !useTele, range: useTele ? 10 : 5}});
		}

		return !CollMap.checkColl(me, unit, coll);
	}

	let cx, cy, currCount, count = 999, potentialSpot = {x: undefined, y: undefined};
	let coords = [];
	let fullDistance = distance;
	let name = unit.hasOwnProperty("name") ? unit.name : "";
	let angle = Math.round(Math.atan2(me.y - unit.y, me.x - unit.x) * 180 / Math.PI);
	let angles = [0, 15, -15, 30, -30, 45, -45, 60, -60, 75, -75, 90, -90, 135, -135, 180];

	let caster = (force && !me.inTown);

	//let t = getTickCount();

	for (let n = 0; n < 3; n += 1) {
		if (n > 0) {
			distance -= Math.floor(fullDistance / 3 - 1);
		}

		for (let i = 0; i < angles.length; i += 1) {
			cx = Math.round((Math.cos((angle + angles[i]) * Math.PI / 180)) * distance + unit.x);
			cy = Math.round((Math.sin((angle + angles[i]) * Math.PI / 180)) * distance + unit.y);

			if (Pather.checkSpot(cx, cy, 0x1, false)) {
				coords.push({x: cx, y: cy});
			}
		}

		if (coords.length > 0) {
			coords.sort(Sort.units);
			
			// If one of the valid positions is a position I am at already - and we aren't trying to force a new spot
			if (!force) {
				for (let i = 0; i < coords.length; i += 1) {
					if ((getDistance(me, coords[i].x, coords[i].y) < 1
						&& !CollMap.checkColl(unit, {x: coords[i].x, y: coords[i].y}, 0x5 | 0x400 | 0x1000, 1))
						|| (getDistance(me, coords[i].x, coords[i].y) <= 5 && me.getMobCount(6) > 2)) {
						return true;
					}
				}
			}

			for (let i = 0; i < coords.length; i += 1) {
				// Valid position found - no collision between the spot and the unit
				if (!CollMap.checkColl({x: coords[i].x, y: coords[i].y}, unit, coll, 1)) {
					currCount = coords[i].mobCount(7);

					// this might be a valid spot but also check the mob count at that node
					if (caster) {
						potentialSpot.x !== undefined && (potentialSpot = {x: coords[i].x, y: coords[i].y});

						if (currCount < count) {
							count = currCount;
							potentialSpot = {x: coords[i].x, y: coords[i].y};
							Developer.debugging.pathing	&& print(sdk.colors.Blue + "CheckedSpot" + sdk.colors.Yellow + ": x: " + coords[i].x + " y: " + coords[i].y + " mob amount: " + sdk.colors.NeonGreen + count);
						}

						if (currCount !== 0) {
							Developer.debugging.pathing	&& print(sdk.colors.Red + "Not Zero, check next: currCount: " + sdk.colors.NeonGreen + " " + currCount);
							continue;
						}
					}

					// I am already in my optimal position
					if (coords[i].distance < 3) return true;

					// we are actually able to walk to where we want to go, hopefully prevent wall hugging
					if (walk && (coords[i].distance < 6 || !CollMap.checkColl(me, unit, 0x5 | 0x400 | 0x1000))) {
						Pather.walkTo(coords[i].x, coords[i].y, 2);
					} else {
						Pather.moveToEx(coords[i].x, coords[i].y, {clearSettings: {allowClearing: !useTele, range: useTele ? 10 : 5, retry: 3}});
					}

					Developer.debugging.pathing && print(sdk.colors.Purple + "SecondCheck :: " + sdk.colors.Yellow + "Moving to: x: " + coords[i].x + " y: " + coords[i].y + " mob amount: " + sdk.colors.NeonGreen + currCount);

					return true;
				}
			}
		}
	}

	if (caster && potentialSpot.x !== undefined) {
		if (potentialSpot.distance < 3) return true;
		if (Pather.useTeleport()) {
			Pather.teleportTo(potentialSpot.x, potentialSpot.y);
		} else {
			switch (walk) {
			case 1:
				Pather.walkTo(potentialSpot.x, potentialSpot.y, 2);

				break;
			case 2:
				if (potentialSpot.distance < 6 && !CollMap.checkColl(me, potentialSpot, 0x5)) {
					Pather.walkTo(potentialSpot.x, potentialSpot.y, 2);
				} else {
					Pather.moveTo(potentialSpot.x, potentialSpot.y, 1);
				}

				break;
			default:
				Pather.moveTo(potentialSpot.x, potentialSpot.y, 1);

				break;
			}
		}

		Developer.debugging.pathing && print(sdk.colors.Orange + "DefaultCheck :: " + sdk.colors.Yellow + "Moving to: x: " + potentialSpot.x + " y: " + potentialSpot.y + " mob amount: " + sdk.colors.NeonGreen + count);

		return true;
	}

	!!name && print("ÿc4Attackÿc0: No valid positions for: " + name);

	return false;
};

Attack.castableSpot = function (x = undefined, y = undefined) {
	// Just in case
	if (!me.area || !x || !y) return false;

	let result;

	try { // Treat thrown errors as invalid spot
		result = getCollision(me.area, x, y);
	} catch (e) {
		return false;
	}

	return !(result === undefined || !!(result & Coords_1.BlockBits.Casting) || !!(result & Coords_1.Collision.BLOCK_MISSILE) || (result & 0x400) || (result & 0x1));
};

// hotfix for now, bugged with flying mobs (specters, ghosts, ect) apparently underneath them doesn't register as ground? so it fails the needFloor test
// despite there being floor there. so for now check if its an area that doesn't have floor in some spots
// better fix would be passing unit directly in instead of x and y, but that is going to need more changes all over
Attack.validSpot = function (x, y, skill = -1) {
	// Just in case
	if (!me.area || !x || !y) return false;
	// for now this just returns true and we leave getting into position to the actual class attack files
	if (Skill.missileSkills.includes(skill)) return true;

	let result;
	let nonFloorAreas = [sdk.areas.ArcaneSanctuary, sdk.areas.RiverofFlame, sdk.areas.ChaosSanctuary, sdk.areas.Abaddon, sdk.areas.PitofAcheron, sdk.areas.InfernalPit];

	// Treat thrown errors as invalid spot
	try {
		result = getCollision(me.area, x, y);
	} catch (e) {
		return false;
	}

	if (result === undefined) return false;

	switch (true) {
	case Skill.needFloor.includes(skill) && nonFloorAreas.includes(me.area):
		let isFloor = !!(result & (0 | 0x1000));
		// this spot is not on the floor (lava (river/chaos, space (arcane), ect))
		if (!isFloor) {
			return false;
		}

		return !(result & 0x1); // outside lava area in abaddon returns coll 1
	default:
		// Avoid non-walkable spots, objects - this preserves the orignal function and also physical attack skills will get here
		if ((result & 0x1) || (result & 0x400)) return false;

		break;
	}

	return true;
};
