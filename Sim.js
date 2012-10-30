// The mechanics of the simulator
// It is a very dumb, event-based simulation
// You queue events that are a JS function and a time and the sim simply execute
// the next event in time, until it encounters the special "bossdead" event.

// Initialize the sim for a new fight
function initSim()
{
   var sim = new Object();
   sim.end = {time:100000} ;
   sim.bossdead = {time:60*(5+Math.random())} ; // Boss dies after 5-6 minutes
   sim.events = [ {time:-1, run:Bear.prepare}, sim.bossdead, sim.end] ;
   sim.log_text = "" ; // reset the log
   //sim.log = function(l) { this.log_text += "<br/>" + l ; } ; // active log function
   sim.log = function(l) { } ; // no-op log function
   sim.queue = function(t,f)
   {
      var i = 0 ;
      while (sim.events[i].time < t) i++ ; // find the place where to insert the event
      sim.events.splice(i,0,{time:t, run:f}) ; // insert the event
   } ;
   return sim ;
}

// run the sim
function runSim(sim)
{
   var e = sim.events.shift() ;
   while (e != sim.bossdead)
   {
      e.run(sim, e.time);
      e = sim.events.shift() ;
   }
   return e.time ;
}

// run the sim many times and calculate statistics
function runSimManyTimes(iterations)
{
   var sim = initSim();
   var uptimes = new Array() ;
   var upt = 0 ;
   var times = new Array() ;
   var damage_taken = new Array() ;
   var dt = 0 ;
   var rpss = new Array() ;
   var rps_sum = 0 ;

   for (var i=0; i<iterations; ++i)
   {
      sim.bossdead.time = 60*(5+Math.random()) ;
      sim.events = [ {time:-1, run:Bear.init}, {time:-1, run:Boss.init}, sim.bossdead, sim.end] ;
      var time = runSim(sim);

      // Add SD downtime at the end of the fight
      if (Bear.sd_time < time) Bear.sd_downtime += time - Bear.sd_time ;
      var uptime = 100 * (time - Bear.sd_downtime) / time ;
      uptimes.push(uptime) ;
      upt += uptime ;

      // Calculate DTPS
      var dtps = Bear.dtaken / time ;
      dt += dtps ;
      damage_taken.push(dtps) ;

      // Calculate average RPS
      var rps = Bear.tr / time ;
      rps_sum += rps ;
      rpss.push(rps) ;

      times.push(time) ;
   }

   uptimes.sort() ;
   times.sort() ;
   damage_taken.sort() ;
   rpss.sort() ;

   var sd_text = "SD Uptimes average (5%, median, 95%) : " + (upt / iterations) + " ( " + uptimes[Math.floor(iterations*0.05)] + " , " + uptimes[Math.floor(iterations*0.5)] + " , " + uptimes[Math.floor(iterations*0.95)] + " ) " ;
   var dt_text = "DTPS average (5%, median, 95%) : " + (dt / iterations) + " ( " + damage_taken[Math.floor(iterations*0.05)] + " , " + damage_taken[Math.floor(iterations*0.5)] + " , " + damage_taken[Math.floor(iterations*0.95)] + " ) " ;
   var rps_text = "RPS average (5%, median, 95%) : " + (rps_sum / iterations) + " ( " + rpss[Math.floor(iterations*0.05)] + " , " + rpss[Math.floor(iterations*0.5)] + " , " + rpss[Math.floor(iterations*0.95)] + " ) " ;

   return sd_text + "<br/>" + dt_text + "<br/>" + rps_text + "<br/>" ;
}

