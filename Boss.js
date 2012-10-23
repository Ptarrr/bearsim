var Boss =
{
   Armor:123,
   damage:500000,
   swing:1.5,
   bleed_t:0,
   bleed_damage: 50000,
   bleed_ed: 50000,

   init:function(sim,t) {
      sim.queue(Boss.swing,Boss.hit);
   },

   init_stoneguard:function(sim,t) {
      Boss.damage = 60000;
      sim.queue(Boss.swing,Boss.hit);
      sim.queue(Boss.swing,Boss.bleed_apply);
      sim.queue(Boss.swing+1,Boss.bleed_tick);
   },

   hit:function(sim,t) {
      var r = Math.random() ;
      var d = Bear.dodgeD + ((Bear.sd_time >= t) ? Stats.SD_Dodge : 0) ;
      if (r < d) {
         sim.log(t + " Boss hit dodged") ;
         if (Bear.v_time >= t) Bear.v_time = t+20 ;
      } else {
         var dam = Boss.damage * (1 - Bear.dr) * (1 - 0.12) ;
         if (Bear.weaken_time <= t) dam = dam * 0.9 ;

         sim.log(t + " Boss hit : " + Boss.damage + ":" + dam) ;
         Bear.dtaken += dam ;

         var v_add = Boss.damage * 0.02 ;
         var v_min = v_add * 10 / 1.5 ;
         Bear.vengeance = Math.max(v_min, Bear.vengeance * (Bear.v_time - t) / 20 + v_add) ;
         Bear.v_time = t+20 ;
      }      
      sim.queue(t+Boss.swing, Boss.hit) ;
   },

   bleed_apply:function(sim,t) {
      var r = Math.random() ;
      var d = Bear.dodgeD + ((Bear.sd_time >= t) ? Bear.SD_Dodge : 0) ;
      if (r < d) {
         sim.log(t + " Boss bleed dodged") ;
         if (Bear.v_time >= t) Bear.v_time = t+20 ;
      } else {
         var dam = Boss.bleed_damage * (1 - 0.12) ;
         if (Bear.weaken_time <= t) dam = dam * 0.9 ;
         Boss.bleed_ed = dam ;
         Boss.bleed_t = t+15.5 ;

         sim.log(t + " Boss bleed applied") ;
      }      
      sim.queue(t+5, Boss.bleed_apply) ;
   },

   bleed_tick:function(sim,t) {
      if (t <= Boss.bleed_t) {
         var dam = Boss.bleed_ed ;
         sim.log(t + " Boss bleed tick : " + dam) ;
         Bear.dtaken += dam ;

         var v_add = Boss.bleed_damage * 0.05 ;
         var v_min = v_add * 10 / 1.5 ;
         Bear.vengeance = Math.max(v_min, Bear.vengeance * (Bear.v_time - t) / 20 + v_add) ;
         Bear.v_time = t+20 ;
      }      
      sim.queue(t+1, Boss.bleed_tick) ;
   },

} ;

