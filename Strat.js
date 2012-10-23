var Strat = {
   
   step:1,

   // Trying to do something clever
   clever_rotation:function(sim, t) {
      if (Bear.mangle_cd <= t) Bear.Mangle(sim, t) ;
      else if (Bear.mangle_cd < t+Bear.gcd) sim.queue(Bear.mangle_cd, Bear.Mangle) ;
      else if (Bear.enrage_cd <= t && Bear.rage < 60) Bear.Enrage(sim, t) ; 
      else if (Bear.weaken_time < t+2 && Bear.trash_cd <= t) Bear.Trash(sim, t) ;
      else if (Bear.fff_cd <= t) Bear.FFF(sim, t) ;
      else if (Bear.lacerate_cd <= t) Bear.Lacerate(sim, t) ;
      else if (Bear.trash_cd <= t) Bear.Trash(sim, t) ;
      else {
         sim.log(" - everything on cooldown - WAITING") ;
         sim.queue(t+0.5, Bear.special) ;
      }
   },


   // Simply do Trash, Lacerate, FFF, Lacerate, while adding Mangle when it procs and Enrage on CD
   simple_rotation:function(sim, t) {
      if (Bear.mangle_cd <= t) Bear.Mangle(sim, t) ;
      else if (Bear.mangle_cd < t+Bear.gcd) sim.queue(Bear.mangle_cd, Bear.Mangle) ;
      else if (Bear.enrage_cd <= t && Bear.rage < 60) Bear.Enrage(sim, t) ;
      else if (Strat.step == 1) {
         if (Bear.trash_cd <= t) Bear.Trash(sim, t) ; else sim.queue(Bear.trash_cd, Bear.Trash) ;
         Strat.step = 2 ; 
      } else if (Strat.step == 0 || Strat.step == 2) {
         if (Bear.lacerate_cd <= t) Bear.Lacerate(sim, t) ; else sim.queue(Bear.lacerate_cd, Bear.Lacerate) ;
         Strat.step += 1 ;
      } else {
         if (Bear.fff_cd <= t) Bear.FFF(sim, t) ; else sim.queue(Bear.fff_cd, Bear.FFF) ;
         Strat.step = 0 ;
      }
   },


   sd_only:function(sim, t) {
      if (Bear.rage > 60 && Bear.charges > 0)
      {
         if (Bear.sd_time > t)
            Bear.sd_time += 6;
         else {
            Bear.sd_downtime += t - Bear.sd_time;
            Bear.sd_time = t+6 ;
         } ;
         if (Bear.charges == 3) sim.queue(t+9, Bear.recharge) ;
         Bear.charges-- ;
         Bear.rage -= 60;
      }
      if (Bear.rage < 60 && Bear.charges > 0 && Bear.sd_time < t)
      {
         sim.log(t + " missing rage for SD") ;
      }
   },

   sd_with_FR_when_no_charges:function(sim, t) {
      if (Bear.rage > 60 && Bear.charges > 0)
      {
         if (Bear.sd_time > t)
            Bear.sd_time += 6;
         else {
            Bear.sd_downtime += t - Bear.sd_time;
            Bear.sd_time = t+6 ;
         } ;
         if (Bear.charges == 3) sim.queue(t+9, Bear.recharge) ;
         Bear.charges-- ;
         Bear.rage -= 60;
      }
      if (Bear.rage < 60 && Bear.charges > 0 && Bear.sd_time < t)
      {
         sim.log(t + " missing rage for SD") ;
      }
      if (Bear.charges == 0 && Bear.sd_time >= t+4)
      {
         // simplefied - ignoring the max 60 rage used
         var heal = (Bear.vengeance*1.1 + Bear.agi*0.2) * 2 ;
         Bear.heal += heal ; Bear.healn += 1 ;
         var fr_heal = heal * Bear.rage / 60 ;
         Bear.dtaken -= fr_heal * Bear.FR_effective ;
         Bear.rage = 0 ;
         sim.log(t + " FR healing for " + fr_heal) ;
      }
   },

   fr_only:function(sim, t) {
      // simplefied - ignoring the max 60 rage used
      var heal = (Bear.vengeance*1.1 + Bear.agi*0.2) * 2 ;
      Bear.heal += heal ; Bear.healn += 1 ;
      var fr_heal = heal * Bear.rage / 60 ;
      Bear.dtaken -= fr_heal * Bear.FR_effective ;
      Bear.rage = 0 ;
      sim.log(t + " FR healing for " + fr_heal) ;
   },

   sd_ignoring_charges:function(sim, t) {
      if (Bear.rage > 60)
      {
         if (Bear.sd_time > t)
            Bear.sd_time += 6;
         else {
            Bear.sd_downtime += t - Bear.sd_time;
            Bear.sd_time = t+6 ;
         } ;
         Bear.rage -= 60;
      }
   },

   init:function() {
      Bear.FR_effective = 0.9 ;
      //Bear.spend = Strat.sd_with_FR_when_no_charges ;
      Bear.spend = Strat.fr_only ;
      Bear.special = Strat.simple_rotation ;
   }
} ;


