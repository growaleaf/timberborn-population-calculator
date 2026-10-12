// Timberborn population growth math. Isomorphic: runs in the browser (attached to window.TBCALC)
// and under Node for the headless tests (module.exports).
//
// Sourced constants — see README.md "Sources" for citations and the one real conflict
// (kit maturation days: wiki.gg implies 5, timberborn.org states 6, varying 3-4 to longer with
// well-being). That value ships as a player-editable input, not a hardcoded constant.
(function (root) {
  "use strict";

  var TB = {
    FOOD_PER_BEAVER_DAY: 2.67,      // timberborn.wiki.gg/wiki/Nutrition — "Beavers eat 2.67 Food per day"
    WATER_PER_BEAVER_DAY: 2.1,      // timberborn.wiki.gg/wiki/Thirst — derived -70/33 = 2.121, rounded
    POD_COST_LOGS: 10,              // timberborn.wiki.gg/wiki/Breeding_Pod
    POD_CYCLE_DAYS: 5,              // timberborn.wiki.gg/wiki/Breeding_Pod — "5d" per cycle
    POD_WATER_PER_CYCLE: 5,         // timberborn.wiki.gg/wiki/Breeding_Pod
    POD_BERRIES_PER_CYCLE: 5,       // timberborn.wiki.gg/wiki/Breeding_Pod
    POD_KITS_PER_CYCLE: 1,          // timberborn.wiki.gg/wiki/Breeding_Pod
    DEFAULT_MATURATION_DAYS: 5      // timberborn.wiki.gg/wiki/Breeding — see conflict note above
  };

  // timberborn.wiki.gg/wiki/Breeding — Iron Teeth Breeding Pod capacity table, keyed by well-being band.
  function capacityPerPod(wellbeing) {
    var w = Number(wellbeing);
    if (!isFinite(w)) w = 0;
    if (w >= 67) return 22;
    if (w >= 57) return 21;
    if (w >= 47) return 20;
    if (w >= 37) return 18;
    if (w >= 27) return 16;
    if (w >= 17) return 14;
    if (w >= 7) return 12;
    return 10;
  }

  // Iron Teeth: pods produce kitsPerCycle every cycleDays while population is below the
  // well-being-scaled equilibrium capacity (pods * capacityPerPod). Growth is modeled as stopping
  // at that capacity rather than continuing indefinitely, matching the sourced formula's own meaning
  // (beyond that point, aging deaths roughly offset new births). Food/water are the player's own
  // CURRENT surplus (production minus consumption at today's population); as population grows, the
  // extra consumption from new beavers is subtracted from that surplus to find the day it goes
  // negative.
  function simulateIronTeeth(opts) {
    opts = opts || {};
    var pods = Math.max(0, Math.floor(opts.pods || 0));
    var cycleDays = opts.cycleDays > 0 ? Number(opts.cycleDays) : TB.POD_CYCLE_DAYS;
    var capPerPod = capacityPerPod(opts.wellbeing);
    var totalCapacity = pods * capPerPod;
    var pop0 = Math.max(0, Math.floor(opts.startPop || 0));
    var foodSurplus0 = Number(opts.foodSurplus) || 0;
    var waterSurplus0 = Number(opts.waterSurplus) || 0;
    var horizonDays = opts.horizonDays > 0 ? opts.horizonDays : 365;
    var targetPop = (opts.targetPop === undefined || opts.targetPop === null || opts.targetPop === "")
      ? null : Number(opts.targetPop);

    var timeline = [{ day: 0, pop: pop0, food: foodSurplus0, water: waterSurplus0 }];
    var foodWarningDay = foodSurplus0 < 0 ? 0 : null;
    var waterWarningDay = waterSurplus0 < 0 ? 0 : null;
    var targetDay = (targetPop !== null && pop0 >= targetPop) ? 0 : null;

    var pop = pop0;
    var day = 0;
    var kitsPerCycle = pods * TB.POD_KITS_PER_CYCLE;

    while (day < horizonDays && pop < totalCapacity && kitsPerCycle > 0) {
      day += cycleDays;
      pop = Math.min(totalCapacity, pop + kitsPerCycle);
      var deltaPop = pop - pop0;
      var food = foodSurplus0 - deltaPop * TB.FOOD_PER_BEAVER_DAY;
      var water = waterSurplus0 - deltaPop * TB.WATER_PER_BEAVER_DAY;
      timeline.push({ day: day, pop: pop, food: food, water: water });
      if (foodWarningDay === null && food < 0) foodWarningDay = day;
      if (waterWarningDay === null && water < 0) waterWarningDay = day;
      if (targetDay === null && targetPop !== null && pop >= targetPop) targetDay = day;
    }

    return {
      capacityPerPod: capPerPod,
      totalCapacity: totalCapacity,
      timeline: timeline,
      foodWarningDay: foodWarningDay,
      waterWarningDay: waterWarningDay,
      targetDay: targetDay,
      reachedCapacity: totalCapacity > 0 && pop >= totalCapacity
    };
  }

  // Folktails: no sourced per-day breeding probability exists (wiki describes only a "small chance"
  // with no published number), so this does not simulate a day-by-day curve. It instead reports the
  // official steady-state ratio (timberborn.wiki.gg/wiki/Breeding: adults sustained per kit-producing
  // pair = lifeExpectancy / maturationDays) applied across the player's own count of breeding
  // households, labeled as an estimate.
  function folktailsEquilibrium(opts) {
    opts = opts || {};
    var lifeExpectancy = Number(opts.lifeExpectancy) || 0;
    var maturationDays = Number(opts.maturationDays) > 0 ? Number(opts.maturationDays) : TB.DEFAULT_MATURATION_DAYS;
    var households = Math.max(0, Math.floor(opts.households || 0));
    var ratio = maturationDays > 0 ? lifeExpectancy / maturationDays : 0;
    return { ratio: ratio, steadyStatePop: households * ratio, households: households };
  }

  // How many additional beavers the player's CURRENT food/water surplus alone can feed before
  // either goes negative — independent of faction or breeding speed.
  function resourceCeiling(foodSurplus, waterSurplus) {
    var foodRoom = Math.floor((Number(foodSurplus) || 0) / TB.FOOD_PER_BEAVER_DAY);
    var waterRoom = Math.floor((Number(waterSurplus) || 0) / TB.WATER_PER_BEAVER_DAY);
    return Math.max(0, Math.min(foodRoom, waterRoom));
  }

  var api = {
    TB: TB,
    capacityPerPod: capacityPerPod,
    simulateIronTeeth: simulateIronTeeth,
    folktailsEquilibrium: folktailsEquilibrium,
    resourceCeiling: resourceCeiling
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.TBCALC = api;
  }
})(typeof window !== "undefined" ? window : this);
