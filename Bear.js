var Bear =
{
   agi:		0,
   haste:	0,
   mastery: 0,
   arm:		0,

   dtaken:  0,

   critA:	0,
   missA:	0,
   dodgeA:	0,
   parryA:	0,
   blockA:	0.075,
   glanceA:	0.24,

   critAT:	0,
   missAT:	0,
   dodgeAT:	0,
   parryAT:	0,
   blockAT:	0,
   glanceAT:0,

   missS:	0,
   critS:	0,

   missD:	0,
   dodgeD:	0,
   parryD:	0,

   rage:			0,
   tr:         0,
   vengeance:	0,
   v_time:     0,
   charges:		0,
   dr:			0,
   swing:		2.5,
   gcd_melee:	1.5,
   gcd_spell:	1.5,
   sd_time:		0,
   sd_downtime:0,

   mangle_cd:	0,
   lacerate_cd:0,
   fff_cd:		0,
   trash_cd:	0,
   enrage_cd:	0,

   trash_time:    0,
   lacerate_time: 0,
   weaken_time:   0,

   min_left:0,
   heal:0, healn:0,

   init:function(sim, t) {
      sim.log("Bear init");
      Bear.haste = 1 + Stats.HasteRating * 1.5 / 42500 ;
      Bear.swing = 2.5 / (1.1 * Bear.haste) ;
      Bear.gcd_melee = 1.5 ;
      Bear.gcd_spell = 1.5 / Bear.haste ;

      Bear.agi = 1.05 * (Stats.Agility + 90) ;
      Bear.mastery = 5 + 8 + Stats.MasteryRating / 600 ;
      Bear.arm = (Stats.Armor * 4.3 + Stats.BonusArmor) * (1 + .0125 * Bear.mastery) ;
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

      Bear.critA = 0.074755 + Bear.agi / 125951.806640625 + Stats.CritRating * 1.5 / 60000 ;
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

   Mangle:function(sim, t) {
      var r = Math.random() ;
      if (r < Bear.missAT) sim.log(t + " Mangle miss") ;
      else if (r < Bear.dodgeAT) sim.log(t + " Mangle dodge") ;
      else if (r < Bear.parryAT) sim.log(t + " Mangle parry") ;
      else {
         Bear.rage += 5 ;
         Bear.tr += 5 ;
         var c = Math.random() ;
         if (c < Bear.critA) { // critA, not the table
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
      if (r < Bear.dodgeAT) sim.log(t + " FFF miss") ;
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

   Enrage_tick:function(sim, t) {
      Bear.rage += 1 ;
      Bear.tr += 1 ;
      if (Bear.rage > 100) Bear.rage = 100 ;
      Bear.enrage_ticks -= 1 ;
      if (Bear.enrage_ticks > 0) sim.queue(t+1, Bear.Enrage_tick) ;
   },

   recharge:function(sim, t) {
      Bear.charges++ ;
      if (Bear.charges < 3) sim.queue(t+9, Bear.recharge) ;
   },

} ;

