var Boss =
{
   Armor:  123,    // Boss armor - for dps
   damage: 500000, // Boss unmitigated auto-attack damage
   swing:  1.5,    // Boss swing timer

   // Things for the Stoneguard sim
   bleed_t:      0,     // time when the bleed will expire
   bleed_damage: 50000, // unmitigated bleed damage - seems to be that in 10N
   bleed_ed:     50000, // actual strength of the current bleed

   // Called at the beginning of each fight simulation.
   // This initializes all variables and queues the actions
   init:function(sim,t) {
      sim.queue(Boss.swing,Boss.hit);
   },

   // A different init to simulate Stoneguard (tanking one boss)
   init_stoneguard:function(sim,t) {
      Boss.damage = 60000; // seems to be about that in 10N
      Boss.bleed_t = -1;
      sim.queue(Boss.swing,Boss.hit);
      sim.queue(Boss.swing,Boss.bleed_apply);
      sim.queue(Boss.swing+1,Boss.bleed_tick);
   },

   // Boss auto-attack
   hit:function(sim,t) {
      var r = Math.random() ;
      // There should be miss here too, but as it's always 0...
      var d = Bear.dodgeD + ((Bear.sd_time >= t) ? Stats.SD_Dodge : 0) ;
      if (r < d) {
         sim.log(t + " Boss hit dodged") ;
         if (Bear.v_time >= t) Bear.v_time = t+20 ;
      } else {
         var dam = Boss.damage * (1 - Bear.dr) * (1 - 0.12) ;
         if (Bear.weaken_time <= t) dam = dam * 0.9 ;

         sim.log(t + " Boss hit : " + Boss.damage + ":" + dam) ;
         Bear.dtaken += dam ;

         var v_add = Boss.damage * 0.018 ;
         var v_min = v_add * 10 / Boss.swing ;
         Bear.vengeance = Math.max(v_min, Bear.vengeance * (Bear.v_time - t) / 20 + v_add) ;
         Bear.v_time = t+20 ;
      }      
      sim.queue(t+Boss.swing, Boss.hit) ;
   },

   // Stoneguard bleed application
   bleed_apply:function(sim,t) {
      var r = Math.random() ;
      // There should be miss here too, but as it's always 0...
      var d = Bear.dodgeD + ((Bear.sd_time >= t) ? Stats.SD_Dodge : 0) ;
      if (r < d) {
         sim.log(t + " Boss bleed dodged") ;
         if (Bear.v_time >= t) Bear.v_time = t+20 ;
      } else {
         var dam = Boss.bleed_damage * (1 - 0.12) ;
         if (Bear.weaken_time <= t) dam = dam * 0.9 ;
         Boss.bleed_ed = dam ;
         Boss.bleed_t = t+15.5 ; // it's 15 seconds, but as floats can be weird, I add .5

         sim.log(t + " Boss bleed applied") ;
      }      
      sim.queue(t+5, Boss.bleed_apply) ;
   },

   // Stoneguard bleed tick
   bleed_tick:function(sim,t) {
      if (t <= Boss.bleed_t) {
         var dam = Boss.bleed_ed ;
         sim.log(t + " Boss bleed tick : " + dam) ;
         Bear.dtaken += dam ;

         var v_add = Boss.bleed_damage * 0.045 ;
         Bear.vengeance = Bear.vengeance * (Bear.v_time - t) / 20 + v_add ;
         Bear.v_time = t+20 ;
      }      
      sim.queue(t+1, Boss.bleed_tick) ;
   },

} ;

