// This is the "strategy", i.e. the abilities you will use
// There are two functions:
//   - One is for the rotation, which is called after every GCD and should be used to
//     decide between Mangle, Lacerate, Enrage, etc...
//   - The other is called every time after you gain rage and should be used to decide
//     between Maul, FR and SD.

// IMPORTANT:
//   Right now, the check on whether a move is legal (cd up, rage available, etc)
//   is done here, no further validation is done elsewhere. So if you have a bug
//   and e.g. use SD every second, you will get no warning and only see a very low
//   damage taken. BE CAREFUL.

var Strat = {

   // Chooses the strats to be used
   init:function() {
      Bear.FR_effective = 0.9 ;
      Bear.spend = Strat.sd_with_FR_when_no_charges ;
      Bear.special = Strat.simple_rotation ;
   },
   
   // variable used for some rotations
   step:1,

   // Trying to do something clever
   clever_rotation:function(sim, t) {
      if (Bear.mangle_cd <= t) Bear.Mangle(sim, t) ;
      else if (Bear.mangle_cd < t+Bear.gcd_melee) sim.queue(Bear.mangle_cd, Bear.Mangle) ;
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


   // Simply do Trash, Lacerate, FFF, Lacerate, repeat while adding Mangle when it procs and Enrage on CD
   simple_rotation:function(sim, t) {
      if (Bear.mangle_cd <= t) Bear.Mangle(sim, t) ;
      else if (Bear.mangle_cd < t+Bear.gcd_melee) sim.queue(Bear.mangle_cd, Bear.Mangle) ;
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


   // Use SD and SD only, accumulate rage when no charges are available
   sd_only:function(sim, t) {
      if (Bear.rage > 60 && Bear.charges > 0)
      {
         Bear.SavageDefense(sim, t) ;
      }
      if (Bear.rage < 60 && Bear.charges > 0 && Bear.sd_time < t)
      {
         sim.log(t + " missing rage for SD") ;
      }
   },


   // Use SD as much as possible, but do use FR when all SD charges are used
   sd_with_FR_when_no_charges:function(sim, t) {
      if (Bear.rage > 60 && Bear.charges > 0)
      {
         Bear.SavageDefense(sim, t) ;
      }
      if (Bear.rage < 60 && Bear.charges > 0 && Bear.sd_time < t)
      {
         sim.log(t + " missing rage for SD") ;
      }
      if (Bear.charges == 0 && Bear.sd_time >= t+4)
      {
         Bear.FrenziedRegeneration(sim, t) ;
      }
   },


   // Always use FR
   fr_only:function(sim, t) {
      Bear.FrenziedRegeneration(sim, t) ;
   },


   // Always use SD and ignore charges (i.e. assume infinite charges)
   sd_ignoring_charges:function(sim, t) {
      if (Bear.rage > 60)
      {
         Bear.SavageDefense(sim, t) ;
      }
   },
} ;


