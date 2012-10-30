// The statistics you gain from gear - as they appear in caster form
var Stats = {
   Armor:         17370,
   Agility:       11277,
   Intellect:     249,
   Strength:      180,
   Stamina:       17292,
   CritRating:    6760,
   HasteRating:   621+600,
   MasteryRating: 3765,
   DodgeRating:   600,
   HitRating:     2560,
   ExpRating:     3550-600, // WARNING: if this is over 3000, the stat value for 2k expertise will be wrong
   BonusArmor:    0,  // do NOT forget to also increase total armor if you increase this

   SD_Dodge:      0.45, // change this to 0.50 if you have 4pc T14

   BaseAgility:	99, // This is for NE TODO: just have a "race" variable
} ;
