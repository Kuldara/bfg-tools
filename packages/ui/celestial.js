/* The celestial phenomena in short (Rulebook pp. 109-115), for the Scenario
   Library's map legend and Play's Actions. */
export const TERR_NAME = { asteroid: "Asteroid field", gas: "Gas & dust cloud", rift: "Warp rift", planet: "Planet", moon: "Moon" };
export const TERR_SHORT = {
  asteroid: ["Moving through it or touching its edge: Leadership test on 2D6 (3D6 on All Ahead Full; an escort may re-roll). Fail: D6 damage.",
    "Blocks line of fire. Two ships both inside may shoot each other up to 10 cm, with no nova cannon or torpedoes.",
    "Torpedoes detonate on it, attack craft moving through die on a 6, drifting hulks are destroyed."],
  gas: ["Works as a single Blast Marker that never moves.",
    "Moving through it costs 5 cm. Fire across it, or by or at a ship touching it, shifts one column right; a ship touching it has 1 shield less when fired upon.",
    "Ordnance moving over it is removed on a 6. Eldar may pass a Leadership check to ignore it."],
  rift: ["A ship moving in tests Leadership on 3D6 (Eldar 2D6, FAQ 2026). Pass: place it up to 2D6 × 10 cm away, facing any way. Fail: lost in the warp.",
    "Blocks line of fire. Torpedoes detonate on it, attack craft are destroyed."],
  planet: ["Gravity well from the template edge: small 10 cm, medium 15 cm, large 30 cm. A ship in it may turn up to 45° toward the planet at the start and at the end of its move, free.",
    "Ships may move over it. Torpedoes are destroyed on the template edge, and so are drifting hulks.",
    "High orbit: a ship in the gravity well need not move, but standing still it is shot at on the Defences column."],
  moon: ["Counts as a small planet in all respects: gravity well 10 cm from its edge, the free 45° turns toward it, torpedoes destroyed on its edge."]
};
