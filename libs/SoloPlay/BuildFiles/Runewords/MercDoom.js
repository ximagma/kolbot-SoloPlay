var Doom = [
	"[name] == HelRune # # [maxquantity] == 1",
	"[name] == OhmRune",
	"[name] == LoRune",
	"[name] == UmRune",
	"[name] == ChamRune",
];
NTIP.arrayLooping(Doom);

// Have Cham, Lo, and Ohm Rune before looking for normal base
if (me.getItem(sdk.runes.Cham) && me.getItem(sdk.runes.Lo) && me.getItem(sdk.runes.Ohm)) {
	if (!Check.haveBase("polearm", 5)) {
		NTIP.addLine("([name] == thresher || [name] == crypticaxe || [name] == greatpoleaxe || [name] == giantthresher) && [flag] == ethereal && [quality] == normal # [sockets] == 0 # [maxquantity] == 1");
	}

	NTIP.addLine("([name] == thresher || [name] == crypticaxe || [name] == greatpoleaxe || [name] == giantthresher) && [flag] == ethereal && [quality] >= normal && [quality] <= superior # [sockets] == 5 # [maxquantity] == 1");
} else {
	NTIP.addLine("([name] == thresher || [name] == crypticaxe || [name] == greatpoleaxe || [name] == giantthresher) && [flag] == ethereal && [quality] == superior # [enhanceddamage] >= 10 && [sockets] == 5 # [maxquantity] == 1");
}

// Cube to Cham
if (!me.getItem(sdk.runes.Cham)) {
	Config.Recipes.push([Recipe.Rune, "Mal Rune"]);
	Config.Recipes.push([Recipe.Rune, "Ist Rune"]);
	Config.Recipes.push([Recipe.Rune, "Gul Rune"]);
	Config.Recipes.push([Recipe.Rune, "Vex Rune"]);
	Config.Recipes.push([Recipe.Rune, "Ohm Rune"]);

	if (Check.haveItem("sword", "runeword", "Grief") && Check.haveItem("armor", "runeword", "Fortitude")) {
		Config.Recipes.push([Recipe.Rune, "Lo Rune"]);
	}

	Config.Recipes.push([Recipe.Rune, "Sur Rune"]);
	Config.Recipes.push([Recipe.Rune, "Ber Rune"]);
	Config.Recipes.push([Recipe.Rune, "Jah Rune"]);
}

// Cube to Lo
if (!me.getItem(sdk.runes.Lo)) {
	Config.Recipes.push([Recipe.Rune, "Mal Rune"]);
	Config.Recipes.push([Recipe.Rune, "Ist Rune"]);
	Config.Recipes.push([Recipe.Rune, "Gul Rune"]);
	Config.Recipes.push([Recipe.Rune, "Vex Rune"]);
	Config.Recipes.push([Recipe.Rune, "Ohm Rune"]);
}

// Cube to Ohm
if (!me.getItem(sdk.runes.Ohm)) {
	Config.Recipes.push([Recipe.Rune, "Mal Rune"]);
	Config.Recipes.push([Recipe.Rune, "Ist Rune"]);
	Config.Recipes.push([Recipe.Rune, "Gul Rune"]);
	Config.Recipes.push([Recipe.Rune, "Vex Rune"]);
}

Config.Recipes.push([Recipe.Socket.Weapon, "giantthresher"]);
Config.Recipes.push([Recipe.Socket.Weapon, "greatpoleaxe"]);
Config.Recipes.push([Recipe.Socket.Weapon, "crypticaxe"]);
Config.Recipes.push([Recipe.Socket.Weapon, "thresher"]);

Config.Runewords.push([Runeword.Doom, "giantthresher"]);
Config.Runewords.push([Runeword.Doom, "greatpoleaxe"]);
Config.Runewords.push([Runeword.Doom, "crypticaxe"]);
Config.Runewords.push([Runeword.Doom, "thresher"]);

Config.KeepRunewords.push("[type] == polearm # [holyfreezeaura] == 12");