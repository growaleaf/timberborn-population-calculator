// Headless known-answer tests. Run: node test.js
// Each scenario was worked by hand against the sourced constants in calc.js before being encoded
// here — see the comments for the arithmetic.
var calc = require("./calc.js");

var failures = 0;

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    failures++;
    console.log("FAIL " + label + " — expected " + expected + ", got " + actual);
  } else {
    console.log("PASS " + label + " (" + actual + ")");
  }
}

// Scenario A — Iron Teeth, 2 pods, well-being 50 (band 47-56 -> 20/pod), start pop 30,
// food surplus 20/day, water surplus 100/day (non-binding), 5-day cycle.
// Hand calc: totalCapacity = 2*20 = 40. +2 kits every 5 days: day5->32, day10->34, day15->36,
// day20->38, day25->40 (capacity reached, growth stops).
// Food: surplus0=20, consumption/new-beaver=2.67. deltaPop*2.67 exceeds 20 once deltaPop>=8
// (8*2.67=21.36 > 20; 6*2.67=16.02 < 20) -> deltaPop=8 happens at day20 (pop 38, delta 8). So the
// food warning day is 20.
(function scenarioA() {
  var r = calc.simulateIronTeeth({
    startPop: 30, pods: 2, wellbeing: 50, cycleDays: 5,
    foodSurplus: 20, waterSurplus: 100, targetPop: 40
  });
  assertEqual(r.totalCapacity, 40, "Scenario A totalCapacity");
  assertEqual(r.foodWarningDay, 20, "Scenario A foodWarningDay");
  assertEqual(r.waterWarningDay, null, "Scenario A waterWarningDay (non-binding)");
  assertEqual(r.targetDay, 25, "Scenario A targetDay (reaches pop 40)");
})();

// Scenario B — Iron Teeth, 1 pod, well-being 10 (band 7-16 -> 12/pod), start pop 5,
// food surplus 50/day (non-binding), water surplus 3/day, 5-day cycle, target pop 12 (= capacity).
// Hand calc: totalCapacity = 1*12 = 12. +1 kit every 5 days: day5->6 ... day35->12 (7 cycles of +1
// from pop 5 to reach 12). Water: surplus0=3, consumption/new-beaver=2.1. deltaPop*2.1 exceeds 3
// once deltaPop>=2 (2*2.1=4.2 > 3; 1*2.1=2.1 < 3) -> deltaPop=2 happens at day10 (pop 7, delta 2).
(function scenarioB() {
  var r = calc.simulateIronTeeth({
    startPop: 5, pods: 1, wellbeing: 10, cycleDays: 5,
    foodSurplus: 50, waterSurplus: 3, targetPop: 12
  });
  assertEqual(r.totalCapacity, 12, "Scenario B totalCapacity");
  assertEqual(r.waterWarningDay, 10, "Scenario B waterWarningDay");
  assertEqual(r.foodWarningDay, null, "Scenario B foodWarningDay (non-binding)");
  assertEqual(r.targetDay, 35, "Scenario B targetDay (reaches pop 12 = capacity)");
})();

// Scenario C — Folktails equilibrium ratio reproduces the source's own worked example verbatim:
// timberborn.wiki.gg/wiki/Breeding states "at a life expectancy of 60 days, there will be 1 kit for
// every 12 adults" i.e. ratio = 60/5 = 12.
(function scenarioC() {
  var r = calc.folktailsEquilibrium({ lifeExpectancy: 60, maturationDays: 5, households: 1 });
  assertEqual(r.ratio, 12, "Scenario C Folktails ratio matches wiki.gg's own worked example");
})();

if (failures > 0) {
  console.log(failures + " test(s) failed.");
  process.exit(1);
} else {
  console.log("All tests passed.");
}
