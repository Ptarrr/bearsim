var Bear =
{
   agi:     0, // buffed Agility
   haste:   0, // buffed haste as a multiplier - e.g. 1.124 is 12.4% haste
   mastery: 0, // buffed mastery 
   arm:     0, // armor in Bear form
   dr:      0, // physical damage reduction granted by armor

   critA:   0,      // chance to crit on attack - 0.23 means 23% crit
   missA:   0,      // chance to miss on attack
   dodgeA:  0,      // chance to be dodged by the boss
   parryA:  0,      // chance to be parried by the boss
   blockA:  0.075,  // chance to be blocked by the boss
   glanceA: 0.24,   // chance to have a glancing hit

   // AT = attack table, this is used to resolve the single-roll system
   missAT:  0,
   dodgeAT: 0,
   parryAT: 0,
   glanceAT:0,
   critAT:  0,  // crit on the attack table - only use this for white attacks

   // S = spell
   missS:   0,  // spell miss chance - used for FF
   critS:   0,  // spell crit chance - used for FF

   // D = defense
   missD:   0,  // chance to be missed by the boss - always 0 for raid bosses
   dodgeD:  0,  // chance to dodge the boss
   parryD:  0,  // chance to parry the boss - always 0 for Bears

   // speed
   swing:      2.5,  // auto-attack swing speed
   gcd_melee:  1.5,  // gcd for melee attacks - always 1.5
   gcd_spell:  1.5,  // gcd for spells (FF)

   // Variables
   rage:       0,    // current rage
   vengeance:  0,    // current vengeance
   charges:    0,    // current number of SD charges

   // Cooldowns for abilities
   mangle_cd:  0,
   lacerate_cd:0,
   fff_cd:     0,
   trash_cd:   0,
   enrage_cd:  0,

   // Duration of buffs & debuffs
   trash_time:    0, // time when trash DoT will expire - for dps
   lacerate_time: 0, // time when lacerate DoT will expire - for dps
   weaken_time:   0, // time when the weaken debuff (phy damage done) will expire
   v_time:        0, // time when vengeance will expire
   sd_time:       0, // time when SD will expire

   // Statistics
   dtaken:      0, // total damage taken
   hdone:       0, // total healing done
   sd_downtime: 0, // downtime of SD
   tr:          0, // total rage gained
   healn:       0, // number of heals
   heal:        0, // healing as if all FRs where at 60 rage (to calculate the average heal strength)

   // Called at the beginning of each fight simulation.
   // This initializes all variables and queues the actions
   init:function(sim, t) {
      sim.log("Bear init");
      Bear.haste = 1 + Stats.HasteRating * 1.5 / 42500 ;
      Bear.swing = 2.5 / (1.1 * Bear.haste) ;
      Bear.gcd_melee = 1.5 ;
      Bear.gcd_spell = 1.5 / Bear.haste ;

      Bear.agi = 1.05 * (Stats.Agility + 90) ;
      Bear.mastery = 5 + 8 + Stats.MasteryRating / 600 ;
      var ArmorFromLeatherNCloth = Stats.Armor - Stats.BonusArmor ; 
      Bear.arm = (ArmorFromLeatherNCloth * 4.3 + Stats.BonusArmor) * (1 + .0125 * Bear.mastery) ;
      Bear.dr = Bear.arm / (Bear.arm + 4037.5 * 93 - 317117.5) ;

      Bear.missA = Math.max(0, 0.075 - Stats.HitRating / 34000) ;
      var e = Stats.ExpRating / 34000 ;
      if (e > 0.075) {
         Bear.dodgeA = 0 ;
         Bear.parryA = Math.max(0, 0.15 - e) ;
      } else {
         Bear.dodgeA = Math.max(0, 0.075 - e) ;
         Bear.parryA = 0.075 ;
      }

      Bear.critA = 0.074755 + Bear.agi / 125951.806640625 + Stats.CritRating * 1.5 / 60000 - 0.03 ;
      // TODO: + Worgen

      var d_k = 1.222 ;
      var d_Cd= 150.2 ;
      var dodge_fromBaseAgi = Stats.BaseAgility / 951.158596 ;
      var dodge_fromAgi = (Bear.agi - Stats.BaseAgility) / 951.158596 ;
      var dodge_fromRating = Stats.DodgeRating / 885 ;
      var base_dodge = 0.03 + 0.02 ; // 0.02 for NE ;
      var dodge_DR = 1 / ((d_k/(dodge_fromAgi+dodge_fromRating)) + (1/d_Cd)) ;
      Bear.dodgeD = (dodge_DR + dodge_fromBaseAgi) / 100 + base_dodge ;

      // pre-calc the table:
      Bear.missAT   = Bear.missA ;
      Bear.dodgeAT  = Bear.missAT + Bear.dodgeA ;
      Bear.parryAT  = Bear.dodgeAT + Bear.parryA ;
      Bear.glanceAT = Bear.parryAT + Bear.glanceA;
      // Bear.blockAT  = Bear.glanceAT + Bear.blockA; // block is 2nd roll
      Bear.critAT   = Bear.glanceAT + Bear.critA;

      // spell miss - it's not clear whether expertise beyond 7.5% can reduce it further, assume yes
      Bear.missS = Math.max(0, 0.15 - Stats.HitRating / 34000 - Stats.ExpRating / 34000) ;
      // Bear.critS = // spell crit - only needed for dps, not done yet

      Bear.charges = 3 ;
      Bear.sd_time = 0 ;
      Bear.rage = 40; // Supposes that Enrage was used
      Bear.tr = 40;
      Bear.sd_downtime = 0 ;

      Bear.mangle_cd = 0 ;
      Bear.lacerate_cd = 0 ;
      Bear.fff_cd = 0 ;
      Bear.trash_cd = 0 ;
      Bear.enrage_cd = 50 ; // We popped Enrage 10 seconds before pull

      Bear.trash_time = 0 ;
      Bear.weaken_time = 0 ;

      Bear.step = 1 ;
      Bear.dtaken = 0 ;
      Bear.vengeance = 0 ;
      Bear.v_time = 0 ;

      sim.queue(0,Bear.hit);
      sim.queue(0,Bear.special);
   },

   // Bear auto-attack
   hit:function(sim, t) {
      var r = Math.random() ;
      if (r < Bear.missAT) sim.log(t + " miss") ;
      else if (r < Bear.dodgeAT) sim.log(t + " dodge") ;
      else if (r < Bear.parryAT) sim.log(t + " parry") ;
      else {
         Bear.rage += 6.25*1.75 ;
         Bear.tr += 6.25*1.75 ;
         if (r < Bear.glanceAT) sim.log(t + " glancing") ;
         else if (r < Bear.critAT) {
            sim.log(t + " crit") ;
            Bear.rage += 15 ;
            Bear.tr += 15 ;
         } else sim.log(t + " hit") ;
         if (Bear.rage > 100) Bear.rage = 100 ;
      }
      sim.queue(t+Bear.swing, Bear.hit) ;
      sim.queue(t+0.1, Bear.spend) ;
   },

   // Now come the functions that execute abilities

   Mangle:function(sim, t) {
      var r = Math.random() ;
      if (r < Bear.missAT) sim.log(t + " Mangle miss") ;
      else if (r < Bear.dodgeAT) sim.log(t + " Mangle dodge") ;
      else if (r < Bear.parryAT) sim.log(t + " Mangle parry") ;
      else {
         Bear.rage += 5 ;
         Bear.tr += 5 ;
         var c = Math.random() ;
         if (c < Bear.critA) { // critA, not the table cos yellow hits are 2-roll
            sim.log(t + " Mangle crit") ;
            Bear.rage += 15 ;
            Bear.tr += 15 ;
         } else sim.log(t + " Mangle hit") ;
         if (Bear.rage > 100) Bear.rage = 100 ;
      }
      Bear.mangle_cd = t + 6 ;
      sim.queue(t+Bear.gcd_melee, Bear.special) ;
      sim.queue(t+0.1, Bear.spend) ;
   },

   Trash:function(sim, t) {
      var r = Math.random() ;
      if (r < Bear.missAT) sim.log(t + " Trash miss") ;
      else if (r < Bear.dodgeAT) sim.log(t + " Trash dodge") ;
      else if (r < Bear.parryAT) sim.log(t + " Trash parry") ;
      else {
         if (Math.random() < 0.25) Bear.mangle_cd = 0 ;
         Bear.weaken_time = t + 30 ;

         /* DPS calculation
            if (Bear.trash_time > t) {
            var next_tick = (Bear.trash_time - t) % 2 ;
            Bear.trash_time = t + 16 + next_tick ;
            } else
            Bear.trash_time = t + 16 ;

         var c = Math.random() ;
         if (c < Bear.critA) { // critA, not the table
            sim.log(t + " Trash crit") ;
         } else sim.log(t + " Trash hit") ;
         */
         sim.log(t + " Trash hit") ;
      }
      Bear.trash_cd = t + 6 ;
      sim.queue(t+Bear.gcd_melee, Bear.special) ;
   },

   FFF:function(sim, t) {
      var r = Math.random() ;
      if (r < Bear.missS) sim.log(t + " FFF miss") ;
      else {
         if (Math.random() < 0.25) Bear.mangle_cd = 0 ;
         /* DPS calculation
         var c = Math.random() ;
         if (c < Bear.critS) { // spell crit
            sim.log(t + " FFF crit") ;
         } else
         */ sim.log(t + " FFF hit") ;
      }
      Bear.fff_cd = t + 6 ;
      sim.queue(t+Bear.gcd_spell, Bear.special) ;
   },

   Lacerate:function(sim, t) {
      var r = Math.random() ;
      if (r < Bear.missAT) sim.log(t + " Lacerate miss") ;
      else if (r < Bear.dodgeAT) sim.log(t + " Lacerate dodge") ;
      else if (r < Bear.parryAT) sim.log(t + " Lacerate parry") ;
      else {
         if (Math.random() < 0.25) Bear.mangle_cd = 0 ;

         /* DPS calculation
         var c = Math.random() ;
         if (c < Bear.critA) { // critA, not the table
            sim.log(t + " Lacerate crit") ;
         } else
         */ sim.log(t + " Lacerate hit") ;
      }
      Bear.lacerate_cd = t + 3 ;
      sim.queue(t+Bear.gcd_melee, Bear.special) ;
   },

   Enrage:function(sim, t) {
      Bear.rage += 20 ;
      if (Bear.rage > 100) Bear.rage = 100 ;
      Bear.tr += 20 ;
      Bear.enrage_cd = t+60 ;
      Bear.enrage_ticks = 10 ;
      sim.queue(t+1, Bear.Enrage_tick) ;
      sim.queue(t+Bear.gcd, Bear.special) ;
   },

   // = = =   Rage spenders   = = =

   SavageDefense:function(sim, t) {
      // this should already have been verified by the strategy before calling us:
      // if (Bear.rage > 60 && Bear.charges > 0)
      {
         if (Bear.sd_time > t)
            Bear.sd_time += 6 ;
         else {
            Bear.sd_downtime += t - Bear.sd_time ;
            Bear.sd_time = t+6 ;
         }

         if (Bear.charges == 3) sim.queue(t+9, Bear.recharge) ;
         Bear.charges-- ;
         Bear.rage -= 60;
      }
   },

   FrenziedRegeneration:function(sim, t) {
      // simplefied - ignoring the AP from strength, procs etc
      var heal = (Bear.vengeance*1.1 + Bear.agi*0.2) * 2 ;
      var rage_used = Math.min(60, Bear.rage) ;
      Bear.heal += heal ; Bear.healn += 1 ;
      var fr_heal = heal * rage_used / 60 ;
      Bear.dtaken -= fr_heal * Bear.FR_effective ;
      Bear.rage -= rage_used ;
      sim.log(t + " FR healing for " + fr_heal) ;
   },

   // = = =   And a few periodic things   = = =

   // Enrage ticks that generate rage
   Enrage_tick:function(sim, t) {
      Bear.rage += 1 ;
      Bear.tr += 1 ;
      if (Bear.rage > 100) Bear.rage = 100 ;
      Bear.enrage_ticks -= 1 ;
      if (Bear.enrage_ticks > 0) sim.queue(t+1, Bear.Enrage_tick) ;
   },

   // SD recharge "ticks"
   recharge:function(sim, t) {
      Bear.charges++ ;
      if (Bear.charges < 3) sim.queue(t+9, Bear.recharge) ;
   },

   // = = =   Helper methods   = = =

   addVengeanceMelee:function(sim, t, unmitDamage, swingtimer) {
      var v_add = unmitDamage * 0.018 ;
      var v_min = v_add * 10 / swingtimer ;
      Bear.vengeance = Math.max(v_min, Bear.vengeance * (Bear.v_time - t) / 20 + v_add) ;
      Bear.v_time = t+20 ;
   },

   addVengeanceSpecialMagic:function(sim, t, unmitDamage) {
      var v_add = unmitDamage * 0.045 ;
      if (Bear.v_time > t)
         Bear.vengeance = Bear.vengeance * (Bear.v_time - t) / 20 + v_add ;
      else // Vengeance expired
         Bear.vengeance = v_add ;
      Bear.v_time = t+20 ;
   },

   // Bleed = physical, but not mitigated by armor
   addVengeanceSpecialBleed:function(sim, t, unmitDamage) {
      var v_add = unmitDamage * 0.045 ;
      if (Bear.v_time > t)
         Bear.vengeance = Bear.vengeance * (Bear.v_time - t) / 20 + v_add ;
      else // Vengeance expired
         Bear.vengeance = v_add ;
      Bear.v_time = t+20 ;
   },

   // For Physical special attacks that ARE mitigated by armor
   addVengeanceSpecialPhysical:function(sim, t, unmitDamage) {
      var v_add = unmitDamage * 0.018 ;
      if (Bear.v_time > t)
         Bear.vengeance = Bear.vengeance * (Bear.v_time - t) / 20 + v_add ;
      else // Vengeance expired
         Bear.vengeance = v_add ;
      Bear.v_time = t+20 ;
   },

} ;

