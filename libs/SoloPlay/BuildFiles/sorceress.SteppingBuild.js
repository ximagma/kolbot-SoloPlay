/**
*  @filename    Sorceress.SteppingBuild.js
*  @author      theBGuy
*  @desc        Blizzard build for after respecOne and before respecOneB - respecs at 65
*
*/

let build = {
	caster: true,
	skillstab: sdk.skills.tabs.Cold,
	wantedskills: [sdk.skills.Blizzard, sdk.skills.GlacialSpike, sdk.skills.ColdMastery],
	usefulskills: [sdk.skills.IceBlast, sdk.skills.Warmth, sdk.skills.StaticField],
	usefulStats: [sdk.stats.PassiveColdPierce, sdk.stats.PassiveColdMastery],
	mercDiff: sdk.difficulty.Nightmare,
	mercAct: 2,
	mercAuraWanted: "Holy Freeze",
	classicStats: [
		["energy", 60], ["vitality", 40], ["strength", 55],
		["energy", 80], ["vitality", 80], ["strength", 80],
		["energy", 100], ["vitality", "all"]
	],
	expansionStats: [
		["energy", 69], ["strength", 48], ["vitality", 165],
		["strength", 61], ["vitality", 200], ["strength", 100],
		["vitality", 252], ["dexterity", "block"], ["vitality", "all"]
	],
	classicSkills: [
		// Total skills at respec = 27
		[sdk.skills.Warmth, 1], 		// points left 26
		[sdk.skills.FrozenArmor, 1], 	// points left 25
		[sdk.skills.StaticField, 6], 	// points left 19
		[sdk.skills.Teleport, 4], 		// points left 14
		[sdk.skills.Blizzard, 3], 		// points left 7
		[sdk.skills.IceBlast, 8], 		// points left 0
		[sdk.skills.ColdMastery, 1, false],
		[sdk.skills.FrozenOrb, 1, false],
		[sdk.skills.Blizzard, 20, false],
		[sdk.skills.IceBlast, 20, false],
		[sdk.skills.ColdMastery, 5],
		[sdk.skills.GlacialSpike, 20, false],
	],
	expansionSkills: [
		// Total skills at respec = 25 
		[sdk.skills.Warmth, 1], 		// points left 24
		[sdk.skills.FrozenArmor, 1], 	// points left 23
		[sdk.skills.StaticField, 1], 	// points left 22
		[sdk.skills.Teleport, 4], 		// points left 17
		[sdk.skills.Blizzard, 1], 		// points left 12
		[sdk.skills.IceBlast, 15], 		// points left 0
		[sdk.skills.ColdMastery, 1, false],
		[sdk.skills.FrozenOrb, 1, false],
		[sdk.skills.Blizzard, 20, false],
		[sdk.skills.IceBlast, 20, false],
		[sdk.skills.ColdMastery, 5],
		[sdk.skills.GlacialSpike, 20, false],
	],
	stats: undefined,
	skills: undefined,

	active: function () {
		return me.charlvl > Config.respecOne && me.charlvl < Config.respecOneB && me.getSkill(sdk.skills.Blizzard, 0) && !me.getSkill(sdk.skills.Nova, 0) && !me.getSkill(sdk.skills.FireMastery, 0);
	},
};

// Has to be set after its loaded
build.stats = me.classic ? build.classicStats : build.expansionStats;
build.skills = me.classic ? build.classicSkills : build.classicSkills;
