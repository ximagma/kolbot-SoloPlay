/**
*  @filename    MiscOverrides.js
*  @author      theBGuy
*  @credit      isid0re (get/use Well idea)
*  @desc        miscellaneous functions, socketing/imbuing
*
*/

!isIncluded("common/Misc.js") && include("common/Misc.js");

Misc.townEnabled = true;

Misc.townCheck = function () {
	if (!Town.canTpToTown()) return false;
	
	let potion, check;
	let needhp = true;
	let needmp = true;

	if (Config.TownCheck && !me.inTown) {
		try {
			if (me.charlvl > 2 && me.gold > 1000) {
				for (let i = 0; i < 4; i += 1) {
					if (Config.MinColumn[i] <= 0) {
						continue;
					}
					
					if (Config.BeltColumn[i] === "hp") {
						potion = me.getItem(-1, 2); // belt item

						if (potion) {
							do {
								if (potion.code.includes("hp")) {
									needhp = false;

									break;
								}
							} while (potion.getNext());
						}

						if (needhp) {
							print("We need healing potions");

							check = true;
						}
					}

					if (Config.BeltColumn[i] === "mp") {
						potion = me.getItem(-1, 2); // belt item

						if (potion) {
							do {
								if (potion.code.includes("mp")) {
									needmp = false;

									break;
								}
							} while (potion.getNext());
						}

						if (needmp) {
							print("We need mana potions");

							check = true;
						}
					}
				}
			}

			if (Config.OpenChests.Enabled && Town.needKeys()) {
				check = true;
			}
		} catch (e) {
			check = false;
		}
	}

	if (check) {
		Messaging.sendToScript("libs/SoloPlay/Threads/TownChicken.js", "townCheck");
		print("BroadCasted townCheck");
		delay(500);

		return true;
	}

	return false;
};

Misc.openChests = function (range = 15) {
	let unitList = [];
	let containers = [
		"chest", "loose rock", "hidden stash", "loose boulder", "corpseonstick", "casket", "armorstand", "weaponrack",
		"holeanim", "roguecorpse", "corpse", "tomb2", "tomb3", "chest3",
		"skeleton", "guardcorpse", "sarcophagus", "object2", "cocoon", "hollow log", "hungskeleton",
		"bonechest", "woodchestl", "woodchestr",
		"burialchestr", "burialchestl", "chestl", "chestr", "groundtomb", "tomb3l", "tomb1l",
		"deadperson", "deadperson2", "groundtombl", "casket"
	];

	if (Config.OpenChests.Types.some((el) => el.toLowerCase() === "all")) {
		containers = [
			"chest", "loose rock", "hidden stash", "loose boulder", "corpseonstick", "casket", "armorstand", "weaponrack",
			"barrel", "holeanim", "tomb2", "tomb3", "roguecorpse", "ratnest", "corpse", "goo pile", "largeurn", "urn", "chest3",
			"jug", "skeleton", "guardcorpse", "sarcophagus", "object2", "cocoon", "basket", "stash", "hollow log", "hungskeleton",
			"pillar", "skullpile", "skull pile", "jar3", "jar2", "jar1", "bonechest", "woodchestl", "woodchestr", "barrel wilderness",
			"burialchestr", "burialchestl", "explodingchest", "chestl", "chestr", "groundtomb", "icecavejar1", "icecavejar2", "icecavejar3",
			"icecavejar4", "deadperson", "deadperson2", "evilurn", "tomb1l", "tomb3l", "groundtombl"
		];
	}

	unitList = getUnits(2).filter(function (chest) {
		return chest.name && chest.mode === 0 && chest.distance <= range &&
		(containers.includes(chest.name.toLowerCase()) || (chest.name.toLowerCase() === "evilurn" && me.baal));
	});

	while (unitList.length > 0) {
		unitList.sort(Sort.units);
		let unit = unitList.shift();

		if (unit && (Pather.useTeleport() || !checkCollision(me, unit, 0x5)) && this.openChest(unit)) {
			Pickit.pickItems();
		}
	}

	return true;
};

Misc.getWell = function (unit) {
	if (!unit || unit.mode === 2) return false;

	for (let i = 0; i < 3; i++) {
		if (Skill.useTK(unit) && i < 2) {
			unit.distance > 21 && Pather.moveNearUnit(unit, 20);
			checkCollision(me, unit, 0x4) && Attack.getIntoPosition(unit, 20, 0x4);
			Skill.cast(sdk.skills.Telekinesis, 0, unit);
		} else {
			if (unit.distance < 4 || Pather.moveToUnit(unit, 3, 0)) {
				Misc.click(0, 0, unit);
			}
		}

		if (Misc.poll(() => unit.mode, 1000, 50)) {
			return true;
		} else {
			Packet.flash(me.gid);
		}
	}

	return false;
};

Misc.useWell = function (range = 15) {
	let unitList = [];

	// I'm in perfect health, don't need this shit
	if (me.hpPercent >= 95 && me.mpPercent >= 95 && me.staminaPercent >= 50
		&& [sdk.states.Frozen, sdk.states.Poison, sdk.states.AmplifyDamage, sdk.states.Decrepify].every((states) => !me.getState(states))) {
		return true;
	}

	unitList = getUnits(sdk.unittype.Object, "well").filter(function (well) {
		return well.distance < range && well.mode !== 2;
	});

	while (unitList.length > 0) {
		unitList.sort(Sort.units);
		let unit = unitList.shift();

		if (unit && (Pather.useTeleport() || !checkCollision(me, unit, 0x5))) {
			this.getWell(unit);
		}
	}

	return true;
};

Misc.getExpShrine = function (shrineLocs = []) {
	if (me.getState(137)) return true;

	for (let get = 0; get < shrineLocs.length; get++) {
		if (shrineLocs[get] === 2) {
			Pather.journeyTo(shrineLocs[get]);
		} else {
			Pather.checkWP(shrineLocs[get], true) ? Pather.useWaypoint(shrineLocs[get]) : Pather.getWP(shrineLocs[get]);
		}

		Precast.doPrecast(true);
		Misc.getShrinesInArea(shrineLocs[get], 15, true);

		if (me.getState(137)) {
			break;
		}

		!me.inTown && Town.goToTown();
	}

	return true;
};

Misc.unsocketItem = function (item) {
	if (me.classic || !me.getItem(sdk.items.quest.Cube) || !item) return false;
	// Item doesn't have anything socketed
	if (item.getItemsEx().length === 0) return true;

	let hel = me.getItem(sdk.items.runes.Hel, 0);
	if (!hel) return false;

	let scroll = Runewords.getScroll();
	let bodyLoc;
	let {classid, quality} = item;
	item.isEquipped && (bodyLoc = item.bodylocation);

	// failed to get scroll or open stash most likely means we're stuck somewhere in town, so it's better to return false
	if (!scroll || !Town.openStash() || !Cubing.emptyCube()) return false;

	try {
		// failed to move any of the items to the cube
		if (!Storage.Cube.MoveTo(item) || !Storage.Cube.MoveTo(hel) || !Storage.Cube.MoveTo(scroll)) throw 'Failed to move items to cube';

		// probably only happens on server crash
		if (!Cubing.openCube()) throw 'Failed to open cube';

		myPrint("ÿc4Removing sockets from: ÿc0" + item.fname.split("\n").reverse().join(" ").replace(/ÿc[0-9!"+<;.*]/, ""));
		transmute();
		delay(500);
		// unsocketing an item causes loss of reference, so re-find our item
		item = me.findItem(classid, -1, sdk.storage.Cube);
		!!item && bodyLoc && item.equip(bodyLoc);

		// can't pull the item out = no space = fail
		if (!Cubing.emptyCube()) throw 'Failed to empty cube';
	} catch (e) {
		console.debug(e);
	} finally {
		// lost the item, so relocate it
		!item && (item = me.findItem(classid, -1, -1, quality));
		// In case error was thrown before hitting above re-equip statement
		bodyLoc && !item.isEquipped && item.equip(bodyLoc);
		// No bodyloc so move back to stash
		!bodyLoc && !item.isInStash && Storage.Stash.MoveTo(item);
		getUIFlag(sdk.uiflags.Cube) && me.cancel();
	}

	return item.getItemsEx().length === 0;
};

Misc.checkItemsForSocketing = function () {
	if (me.classic || !me.getQuest(sdk.quest.id.SiegeOnHarrogath, 1)) return false;

	let items = me.getItemsEx()
		.filter(item => item.getStat(sdk.stats.NumSockets) === 0 && getBaseStat("items", item.classid, "gemsockets") > 0)
		.sort((a, b) => NTIP.GetTier(b) - NTIP.GetTier(a));

	for (let i = 0; i < items.length; i++) {
		let curr = Config.socketables.find(({ classid }) => items[i].classid === classid);
		if (curr && curr.condition(items[i]) && curr.useSocketQuest) {
			return items[i];
		}
	}

	return false;
};

Misc.checkItemsForImbueing = function () {
	if (!me.getQuest(sdk.quest.id.ToolsoftheTrade, 1)) return false;

	let items = me.getItemsEx().filter(item => item.getStat(sdk.stats.NumSockets) === 0 && (item.normal || item.superior));

	for (let i = 0; i < items.length; i++) {
		if (Config.imbueables.some(item => item.name === items[i].classid && Item.canEquip(items[i]))) {
			return items[i];
		}
	}

	return false;
};

Misc.addSocketablesToItem = function (item, runes = []) {
	if (!item || item.getStat(sdk.stats.NumSockets) === 0) return false;
	let preSockets = item.getItemsEx().length;
	let original = preSockets;
	let bodyLoc;

	if (item.isEquipped) {
		bodyLoc = item.bodylocation;

		if (!Storage.Inventory.CanFit(item)) {
			Town.sortInventory();

			if (!Storage.Inventory.CanFit(item) && !Storage.Inventory.MoveTo(item)) {
				print("ÿc8AddSocketableToItemÿc0 :: No space to get item back");
				return false;
			}
		} else {
			if (!Storage.Inventory.MoveTo(item)) return false;
		}
	}

	if (!Town.openStash()) return false;

	for (let i = 0; i < runes.length; i++) {
		let rune = runes[i];
		if (!rune.toCursor()) return false;

		for (let i = 0; i < 3; i += 1) {
			sendPacket(1, 0x28, 4, rune.gid, 4, item.gid);
			let tick = getTickCount();

			while (getTickCount() - tick < 2000) {
				if (!me.itemoncursor) {
					delay(300);

					break;
				}

				delay(10);
			}

			if (item.getItemsEx().length > preSockets) {
				D2Bot.printToConsole("Added socketable: " + rune.fname + " to " + item.fname, 6);
				Misc.logItem("Added " + rune.name + " to: ", item);
				preSockets++;
			}
		}
	}

	bodyLoc && Item.equip(item, bodyLoc);

	return item.getItemsEx().length > original;
};

Misc.getSocketables = function (item, itemInfo) {
	if (!item) return false;
	let itemtype;
	let gemType;
	let runeType;
	let multiple = [];
	let temp = [];
	let itemSocketInfo = item.getItemsEx();
	let preSockets = itemSocketInfo.length;
	let allowTemp = (!!itemInfo && !!itemInfo.temp && itemInfo.temp.length > 0 && (preSockets === 0 || preSockets > 0 && itemSocketInfo.some(el => !itemInfo.socketWith.includes(el.classid))));
	let sockets = item.getStat(sdk.stats.NumSockets);
	let openSockets = sockets - preSockets;
	let {classid, quality} = item;
	let socketables = me.getItemsEx()
		.filter(item => [sdk.itemtype.Jewel, sdk.itemtype.Rune].includes(item.itemType) || (item.itemType >= sdk.itemtype.Amethyst && item.itemType <= sdk.itemtype.Skull));

	if (!socketables || (!allowTemp && openSockets === 0)) return false;

	function highestGemAvailable (gem, checkList = []) {
		if (!gem) return false;

		// filter out all items that aren't the gem type we are looking for
		// then sort the highest classid (better gems first)
		let myItems = me.getItemsEx()
			.filter(item => item.itemType === gem.itemType)
			.sort((a, b) => b.classid - a.classid);

		for (let i = 0; i < myItems.length; i++) {
			if (!checkList.includes(myItems[i])) {
				return true;
			}
		}

		return false;
	}

	if (!itemInfo || (!!itemInfo && itemInfo.socketWith.length === 0)) {
		itemtype = item.getItemType();
		if (!itemtype) return false;
		gemType = ["Helmet", "Armor"].includes(itemtype) ? "Ruby" : itemtype === "Shield" ? "Diamond" : itemtype === "Weapon" && !Check.currentBuild().caster ? "Skull" : "";

		// Tir rune in normal, Io rune otherwise and Shael's if assassin
		!gemType && (runeType = me.normal ? "Tir" : me.assassin ? "Shael" : "Io");

		// TODO: Use Jewels
		// would need to score them and way to compare to runes/gems by what itemtype we are looking at
		// then keep upgrading until we actually are ready to insert in the item
	}

	for (let i = 0; i < socketables.length; i++) {
		if (!!itemInfo && itemInfo.socketWith.length > 0) {
			// In case we are trying to use different runes, check if item already has current rune inserted
			// or if its already in the muliple list. If it is, remove that socketables classid from the list of wanted classids
			if (itemInfo.socketWith.length > 1
				&& (itemSocketInfo.some(el => el.classid === socketables[i].classid) || multiple.some(el => el.classid === socketables[i].classid))) {
				itemInfo.socketWith.remove(socketables[i].classid);
			}

			if (itemInfo.socketWith.includes(socketables[i].classid) && !multiple.includes(socketables[i])) {
				if (multiple.length < sockets) {
					multiple.push(socketables[i]);
				}
			}

			if (allowTemp && itemInfo.temp.includes(socketables[i].classid) && !temp.includes(socketables[i])) {
				if (temp.length < sockets) {
					temp.push(socketables[i]);
				}
			}
		} else {
			// If itemtype was matched with a gemType
			if (gemType) {
				// current item matches wanted gemType
				if (socketables[i].itemType === sdk.itemtype[gemType]) {
					// is the highest gem of that type
					if (highestGemAvailable(socketables[i], multiple)) {
						if (multiple.length < sockets) {
							multiple.push(socketables[i]);
						}
					}
				}
			} else if (runeType) {
				if (socketables[i].classid === sdk.items.runes[runeType] && !multiple.includes(socketables[i])) {
					if (multiple.length < sockets) {
						multiple.push(socketables[i]);
					}
				}
			}
		}

		if (multiple.length === sockets) {
			break;
		}
	}

	if (allowTemp) {
		// we have all our wanted socketables
		if (multiple.length === sockets) {
			// Failed to remove temp socketables
			if (!Misc.unsocketItem(item)) return false;
			// relocate our item as unsocketing it causes loss of reference
			item = me.findItem(classid, -1, -1, quality);
			openSockets = sockets;
		} else {
			if (temp.length > 0) {
				// use temp socketables
				multiple = temp.slice(0);
			} else if (item.getItemsEx().some((el) => itemInfo.temp.includes(el.classid))) {
				return false;
			}
		}
	}
	
	if (multiple.length > 0) {
		multiple.length > openSockets && (multiple.length = openSockets);
		if (openSockets === 0) return false;
		// check to ensure I am a high enough level to use wanted socketables
		for (let i = 0; i < multiple.length; i++) {
			if (me.charlvl < multiple[i].lvlreq) {
				print("ÿc8Kolbot-SoloPlayÿc0: Not high enough level for " + multiple[i].fname);
				return false;
			}
		}

		if (Misc.addSocketablesToItem(item, multiple)) {
			delay(250 + me.ping);
		} else {
			print("ÿc8Kolbot-SoloPlayÿc0: Failed to add socketable to " + item.fname);
		}

		return item.getItemsEx().length === sockets || item.getItemsEx().length > preSockets;
	}

	return false;
};

Misc.checkSocketables = function () {
	let items = me.getItemsEx()
		.filter(item => item.getStat(sdk.stats.NumSockets) > 0 && AutoEquip.hasTier(item) && item.quality > sdk.itemquality.Superior)
		.sort((a, b) => NTIP.GetTier(b) - NTIP.GetTier(a));

	if (!items) return;

	for (let i = 0; i < items.length; i++) {
		let sockets = items[i].getStat(sdk.stats.NumSockets);

		switch (items[i].quality) {
		case sdk.itemquality.Magic:
		case sdk.itemquality.Rare:
		case sdk.itemquality.Crafted:
			// no need to check anything else if already socketed
			if (items[i].getItemsEx().length === sockets) {
				continue;
			}
			// Any magic, rare, or crafted item with open sockets
			if (items[i].isEquipped && [1, 3, 4, 5].includes(items[i].bodylocation)) {
				Misc.getSocketables(items[i]);
			}

			break;
		case sdk.itemquality.Set:
		case sdk.itemquality.Unique:
			{
				let curr = Config.socketables.find(({ classid }) => items[i].classid === classid);

				// item is already socketed and we don't use temp socketables on this item
				if ((!curr || (curr && !curr.temp)) && items[i].getItemsEx().length === sockets) {
					continue;
				}

				if (curr && curr.condition(items[i])) {
					Misc.getSocketables(items[i], curr);
				} else if (items[i].isEquipped) {
					Misc.getSocketables(items[i]);
				}
			}

			break;
		default:
			break;
		}
	}
};

// Log kept item stats in the manager.
Misc.logItem = function (action, unit, keptLine) {
	if (!this.useItemLog || unit === undefined || !unit) return false;

	if (!Config.LogKeys && ["pk1", "pk2", "pk3"].includes(unit.code)) return false;
	if (!Config.LogOrgans && ["dhn", "bey", "mbr"].includes(unit.code)) return false;
	if (!Config.LogLowRunes && ["r01", "r02", "r03", "r04", "r05", "r06", "r07", "r08", "r09", "r10", "r11", "r12", "r13", "r14"].includes(unit.code)) return false;
	if (!Config.LogMiddleRunes && ["r15", "r16", "r17", "r18", "r19", "r20", "r21", "r22", "r23"].includes(unit.code)) return false;
	if (!Config.LogHighRunes && ["r24", "r25", "r26", "r27", "r28", "r29", "r30", "r31", "r32", "r33"].includes(unit.code)) return false;
	if (!Config.LogLowGems && ["gcv", "gcy", "gcb", "gcg", "gcr", "gcw", "skc", "gfv", "gfy", "gfb", "gfg", "gfr", "gfw", "skf", "gsv", "gsy", "gsb", "gsg", "gsr", "gsw", "sku"].includes(unit.code)) return false;
	if (!Config.LogHighGems && ["gzv", "gly", "glb", "glg", "glr", "glw", "skl", "gpv", "gpy", "gpb", "gpg", "gpr", "gpw", "skz"].includes(unit.code)) return false;

	for (let i = 0; i < Config.SkipLogging.length; i++) {
		if (Config.SkipLogging[i] === unit.classid || Config.SkipLogging[i] === unit.code) return false;
	}

	if (!unit.fname) return false;

	let lastArea, code, desc, sock, itemObj,
		color = -1,
		name = unit.fname.split("\n").reverse().join(" ").replace(/ÿc[0-9!"+<:;.*]|\/|\\/g, "").trim();

	desc = this.getItemDesc(unit);
	color = unit.getColor();

	if (action.match("kept", "i")) {
		lastArea = DataFile.getStats().lastArea;
		lastArea && (desc += ("\n\\xffc0Area: " + lastArea));
	}

	let mercCheck = action.match("Merc");

	if (!action.match("kept", "i") && !action.match("Shopped") && AutoEquip.hasTier(unit)) {
		if (!mercCheck) {
			NTIP.GetCharmTier(unit) > 0 && (desc += ("\n\\xffc0Autoequip charm tier: " + NTIP.GetCharmTier(unit)));
			NTIP.GetTier(unit) > 0 && (desc += ("\n\\xffc0Autoequip char tier: " + NTIP.GetTier(unit)));
		} else {
			desc += ("\n\\xffc0Autoequip merc tier: " + NTIP.GetMercTier(unit));
		}
	}

	if (unit.getFlag(0x10)) {
		switch (unit.quality) {
		case 5: // Set
			switch (unit.classid) {
			case 27: // Angelic sabre
				code = "inv9sbu";

				break;
			case 74: // Arctic short war bow
				code = "invswbu";

				break;
			case 308: // Berserker's helm
				code = "invhlmu";

				break;
			case 330: // Civerb's large shield
				code = "invlrgu";

				break;
			case 31: // Cleglaw's long sword
			case 227: // Szabi's cryptic sword
				code = "invlsdu";

				break;
			case 329: // Cleglaw's small shield
				code = "invsmlu";

				break;
			case 328: // Hsaru's buckler
				code = "invbucu";

				break;
			case 306: // Infernal cap / Sander's cap
				code = "invcapu";

				break;
			case 30: // Isenhart's broad sword
				code = "invbsdu";

				break;
			case 309: // Isenhart's full helm
				code = "invfhlu";

				break;
			case 333: // Isenhart's gothic shield
				code = "invgtsu";

				break;
			case 326: // Milabrega's ancient armor
			case 442: // Immortal King's sacred armor
				code = "invaaru";

				break;
			case 331: // Milabrega's kite shield
				code = "invkitu";

				break;
			case 332: // Sigon's tower shield
				code = "invtowu";

				break;
			case 325: // Tancred's full plate mail
				code = "invfulu";

				break;
			case 3: // Tancred's military pick
				code = "invmpiu";

				break;
			case 113: // Aldur's jagged star
				code = "invmstu";

				break;
			case 234: // Bul-Kathos' colossus blade
				code = "invgsdu";

				break;
			case 372: // Grizwold's ornate plate
				code = "invxaru";

				break;
			case 366: // Heaven's cuirass
			case 215: // Heaven's reinforced mace
			case 449: // Heaven's ward
			case 426: // Heaven's spired helm
				code = "inv" + unit.code + "s";

				break;
			case 357: // Hwanin's grand crown
				code = "invxrnu";

				break;
			case 195: // Nalya's scissors suwayyah
				code = "invskru";

				break;
			case 395: // Nalya's grim helm
			case 465: // Trang-Oul's bone visage
				code = "invbhmu";

				break;
			case 261: // Naj's elder staff
				code = "invcstu";

				break;
			case 375: // Orphan's round shield
				code = "invxmlu";

				break;
			case 12: // Sander's bone wand
				code = "invbwnu";

				break;
			}

			break;
		case 7: // Unique
			for (let i = 0; i < 401; i += 1) {
				if (unit.code === getBaseStat(17, i, 4).trim() && unit.fname.split("\n").reverse()[0].indexOf(getLocaleString(getBaseStat(17, i, 2))) > -1) {
					code = getBaseStat(17, i, "invfile");

					break;
				}
			}

			break;
		}
	}

	if (!code) {
		// Tiara/Diadem
		code = ["ci2", "ci3"].indexOf(unit.code) > -1 ? unit.code : getBaseStat(0, unit.classid, 'normcode') || unit.code;
		code = code.replace(" ", "");

		if ([10, 12, 58, 82, 83, 84].indexOf(unit.itemType) > -1) {
			code += (unit.gfx + 1);
		}
	}

	sock = unit.getItem();

	if (sock) {
		do {
			if (sock.itemType === 58) {
				desc += "\n\n";
				desc += this.getItemDesc(sock);
			}
		} while (sock.getNext());
	}

	keptLine && (desc += ("\n\\xffc0Line: " + keptLine));
	desc += "$" + (unit.getFlag(0x400000) ? ":eth" : "");

	itemObj = {
		title: action + " " + name,
		description: desc,
		image: code,
		textColor: unit.quality,
		itemColor: color,
		header: "",
		sockets: this.getItemSockets(unit)
	};

	D2Bot.printToItemLog(itemObj);

	return true;
};

Misc.shapeShift = function (mode) {
	let skill, state;

	switch (mode.toString().toLowerCase()) {
	case "0":
		return false;
	case "1":
	case "werewolf":
		state = 139;
		skill = 223;

		break;
	case "2":
	case "werebear":
		state = 140;
		skill = 228;

		break;
	default:
		throw new Error("shapeShift: Invalid parameter");
	}

	if (me.getState(state)) return true;

	let slot = me.weaponswitch;
	me.switchWeapons(Precast.getBetterSlot(skill));

	for (let i = 0; i < 3; i += 1) {
		Skill.cast(skill, 0);
		let tick = getTickCount();

		while (getTickCount() - tick < 2000) {
			if (me.getState(state)) {
				delay(250);
				me.weaponswitch !== slot && me.switchWeapons(0);

				return true;
			}

			delay(10);
		}
	}

	me.weaponswitch !== slot && me.switchWeapons(0);

	return false;
};

Misc.errorReport = function (error, script) {
	let i, date, dateString, msg, oogmsg, filemsg, source, stack,
		stackLog = "";

	date = new Date();
	dateString = "[" + new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, -5).replace(/-/g, '/').replace('T', ' ') + "]";

	if (typeof error === "string") {
		msg = error;
		oogmsg = error.replace(/ÿc[0-9!"+<:;.*]/gi, "");
		filemsg = dateString + " <" + me.profile + "> " + error.replace(/ÿc[0-9!"+<:;.*]/gi, "") + "\n";
	} else {
		source = error.fileName.substring(error.fileName.lastIndexOf("\\") + 1, error.fileName.length);
		msg = "ÿc1Error in ÿc0" + script + " ÿc1(" + source + " line ÿc1" + error.lineNumber + "): ÿc1" + error.message;
		oogmsg = " Error in " + script + " (" + source + " #" + error.lineNumber + ") " + error.message + " (Area: " + Pather.getAreaName(me.area) + ", Ping:" + me.ping + ", Game: " + me.gamename + ")";
		filemsg = dateString + " <" + me.profile + "> " + msg.replace(/ÿc[0-9!"+<:;.*]/gi, "") + "\n";

		if (error.hasOwnProperty("stack")) {
			stack = error.stack;

			if (stack) {
				stack = stack.split("\n");

				if (stack && typeof stack === "object") {
					stack.reverse();
				}

				for (i = 0; i < stack.length; i += 1) {
					if (stack[i]) {
						stackLog += stack[i].substr(0, stack[i].indexOf("@") + 1) + stack[i].substr(stack[i].lastIndexOf("\\") + 1, stack[i].length - 1);

						if (i < stack.length - 1) {
							stackLog += ", ";
						}
					}
				}
			}
		}

		if (stackLog) {
			filemsg += "Stack: " + stackLog + "\n";
		}
	}

	if (this.errorConsolePrint) {
		D2Bot.printToConsole(oogmsg, 10);
	}

	showConsole();
	print(msg);
	this.fileAction("logs/ScriptErrorLog.txt", 2, filemsg);
	takeScreenshot();
	delay(500);
};

Misc.updateRecursively = function (oldObj, newObj, path) {
	if (path === void 0) { path = []; }
	Object.keys(newObj).forEach(function (key) {
		if (typeof newObj[key] === 'function') return; // skip
		if (typeof newObj[key] !== 'object') {
			if (!oldObj.hasOwnProperty(key) || oldObj[key] !== newObj[key]) {
				oldObj[key] = newObj[key];
			}
		} else if (Array.isArray(newObj[key]) && !newObj[key].some(k => typeof k === "object")) {
			// copy array (shallow copy)
			if (oldObj[key] === undefined || !oldObj[key].equals(newObj[key])) {
				oldObj[key] = newObj[key].slice(0);
			}
		} else {
			if (typeof oldObj[key] !== 'object') {
				oldObj[key] = {};
			}
			path.push(key);
			Misc.updateRecursively(oldObj[key], newObj[key], path);
		}
	});
};

Misc.recursiveSearch = function (o, n, changed) {
	if (changed === void 0) { changed = {}; }
	Object.keys(n).forEach(function (key) {
		if (typeof n[key] === 'function') return; // skip
		if (typeof n[key] !== 'object') {
			if (!o.hasOwnProperty(key) || o[key] !== n[key]) {
				changed[key] = n[key];
			}
		} else {
			if (typeof changed[key] !== 'object' || !changed[key]) {
				changed[key] = {};
			}
			Misc.recursiveSearch((o === null || o === void 0 ? void 0 : o[key]) || {}, (n === null || n === void 0 ? void 0 : n[key]) || {}, changed[key]);
			if (!Object.keys(changed[key]).length) {
				delete changed[key];
			}
		}
	});
	return changed;
};
