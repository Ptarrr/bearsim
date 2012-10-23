function initSim()
{
   var sim = new Object();
   sim.end = {time:100000} ;
   sim.bossdead = {time:60*(5+Math.random())} ;
   sim.events = [ {time:-1, run:Bear.prepare}, sim.bossdead, sim.end] ;
   sim.log_text = "" ;
   //sim.log = function(l) { this.log_text += "<br/>" + l ; } ;
   sim.log = function(l) { } ;
   sim.queue = function(t,f)
   {
      var i = 0 ;
      while (sim.events[i].time < t) i++ ;
      sim.events.splice(i,0,{time:t, run:f}) ;
   } ;
   return sim ;
}

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
      var uptime = 100 * (time - Bear.sd_downtime) / time ;
      uptimes.push(uptime) ;
      upt += uptime ;
      var dtps = Bear.dtaken / time ;
      dt += dtps ;
      var rps = Bear.tr / time ;
      rps_sum += rps ;
      rpss.push(rps) ;
      damage_taken.push(dtps) ;
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

function simOnLoad()
{
   Strat.init() ;

   document.getElementById("result").innerHTML="Calculating";
   document.getElementById("result").innerHTML=runSimManyTimes(1000);
   document.getElementById("result").innerHTML+="average heal: " + (Bear.heal / Bear.healn) + "<br/>";

   Stats.Agility += 1000 ;
   document.getElementById("result").innerHTML+="<br/>Agility + 1000:<br/>" + runSimManyTimes(1000);
   Stats.Agility -= 1000 ;

   Stats.Armor += 1000 ;
   document.getElementById("result").innerHTML+="<br/>Armor + 1000:<br/>" + runSimManyTimes(1000);
   Stats.Armor -= 1000 ;

   Stats.DodgeRating += 2000 ;
   document.getElementById("result").innerHTML+="<br/>Dodge + 2000:<br/>" + runSimManyTimes(1000);
   Stats.DodgeRating -= 2000 ;

   Stats.MasteryRating += 2000 ;
   document.getElementById("result").innerHTML+="<br/>Mastery + 2000:<br/>" + runSimManyTimes(1000);
   Stats.MasteryRating -= 2000 ;

   Stats.CritRating += 2000 ;
   document.getElementById("result").innerHTML+="<br/>Crit + 2000:<br/>" + runSimManyTimes(1000);
   Stats.CritRating -= 2000 ;

   Stats.HasteRating += 2000 ;
   document.getElementById("result").innerHTML+="<br/>Haste + 2000:<br/>" + runSimManyTimes(1000);
   Stats.HasteRating -= 2000 ;

   Stats.ExpRating += 2000 ;
   document.getElementById("result").innerHTML+="<br/>Expertise + 2000:<br/>" + runSimManyTimes(1000);
   Stats.ExpRating -= 2000 ;

   Stats.BonusArmor += 2250 ;
   Stats.MasteryRating += 750 ;
   document.getElementById("result").innerHTML+="<br/>Elixirs: 2250 Armor + 750 Mastery<br/>" + runSimManyTimes(1000);
   Stats.BonusArmor -= 2250 ;
   Stats.MasteryRating -= 750 ;

}
