// This file defines what simulations to run

function riversong_expire(sim, t)
{
   if (Bear.rs_t == t)
   {
      Bear.dodgeD = Bear.dodgeD_N ;
   }
}

function riversong(sim, t)
{
   var r = Math.random() ;
   if (r <= 0.083333333)
   {
      Bear.dodgeD = Bear.dodgeD_RS ;
      Bear.rs_t = t+7 ;
      sim.queue(Bear.rs_t, riversong_expire) ;
   }
}

function dancingsteel_expire(sim, t)
{
   if (Bear.ds_t == t)
   {
      Bear.dodgeD = Bear.dodgeD_N ;
      Bear.critA  = Bear.critA_N ;
      Bear.critAT = Bear.glanceAT + Bear.critA ;
   }
}

function dancingsteel(sim, t)
{
   var r = Math.random() ;
   if (r < 0.041666667)
   {
      Bear.dodgeD = Bear.dodgeD_DS ;
      Bear.critA  = Bear.critA_DS ;
      Bear.critAT = Bear.glanceAT + Bear.critA ;
      Bear.ds_t = t+12 ;
      sim.queue(Bear.ds_t, dancingsteel_expire) ;
   }
}

function windsong_haste_expires(sim, t)
{
   if (Bear.wsh_t == t)
   {
      Bear.haste = Bear.hasteN ;
      Bear.swing = 2.5 / (1.1 * Bear.haste) ;
      Bear.gcd_spell = 1.5 / Bear.haste / 1.05 ;
   }
}

function windsong_crit_expires(sim, t)
{
   if (Bear.wsc_t == t)
   {
      Bear.critA  = Bear.critA_N ;
      Bear.critAT = Bear.glanceAT + Bear.critA ;
   }
}

function windsong_mastery_expires(sim, t)
{
   if (Bear.wsm_t == t)
   {
      Bear.mastery = Bear.masteryN ;
      Bear.arm     = Bear.armN ;
      Bear.dr      = Bear.drN ;
   }
}

function windsong(sim, t)
{
   var r = Math.random() ;
   var tt = Math.min(10, t-Bear.lastproc) ;
   if (r < 2 * Bear.haste * 1.1 * tt / 60)
   {
      var r2 = 3*Math.random() ;
      if (r2 < 1)
      {
         Bear.haste = Bear.hasteWS ;
         Bear.swing = 2.5 / (1.1 * Bear.haste) ;
         Bear.gcd_spell = 1.5 / Bear.haste / 1.05 ;
         Bear.wsh_t = t+12 ; 
         sim.queue(Bear.wsh_t, windsong_haste_expires) ;
         // increase haste, crit or mastery by 1500 for 12 seconds
      }
      else if (r2 < 2)
      {
         Bear.critA  = Bear.critA_N ;
         Bear.critAT = Bear.glanceAT + Bear.critA ;
         Bear.wsc_t = t+12 ;
         sim.queue(Bear.wsc_t, windsong_crit_expires) ;
      }
      else
      {
         Bear.mastery = Bear.masteryN ;
         Bear.arm     = Bear.armN ;
         Bear.dr      = Bear.drN ;
         Bear.wsm_t   = t+12 ;
         sim.queue(Bear.wsm_t, windsong_mastery_expires) ;
      }
   }
}

function colossus(sim, t)
{
   if (Bear.lastproc < t-3)
   {
      var r = Math.random() ;
      if (r < 0.125)
      {
         Bear.dtaken -= 7500 ;
         Bear.lastproc = t ;
      }
   }
}

function nop(sim, t){}

function simOnLoad()
{
   Strat.init() ;

   document.getElementById("result").innerHTML="Calculating";
   document.getElementById("result").innerHTML=runSimManyTimes(2000);
   document.getElementById("result").innerHTML+="average heal: " + (Bear.heal / Bear.healn) + "<br/>";

   Bear.hasteN  = 1 + Stats.HasteRating * 1.5 / 42500 ;
   Bear.hasteWS = 1 + (Stats.HasteRating + 1500) * 1.5 / 42500 ;

   Bear.critA_N  = 0.074755 + Bear.agi / 125951.806640625 + Stats.CritRating * 1.5 / 60000 + 0.05 - 0.03 ;
   Bear.critA_WS = 0.074755 + Bear.agi / 125951.806640625 + (Stats.CritRating + 1500) * 1.5 / 60000 + 0.05 - 0.03 ;
   Bear.critA_DS = 0.074755 + (Bear.agi + 1650*1.05) / 125951.806640625 + Stats.CritRating * 1.5 / 60000 + 0.05 - 0.03 ;

   var d_k = 1.222 ;
   var d_Cd= 150.2 ;
   var dodge_fromBaseAgi = Stats.BaseAgility / 951.158596 ;
   var dodge_fromAgi = (Bear.agi - Stats.BaseAgility) / 951.158596 ;
   var dodge_fromRating = Stats.DodgeRating / 885 ;
   var base_dodge = 0.03 + 0.02 ; // 0.02 for NE ;
   var dodge_DR = 1 / ((d_k/(dodge_fromAgi+dodge_fromRating)) + (1/d_Cd)) ;

   var dodge_fromAgi_DS = (Bear.agi - Stats.BaseAgility + (1650 * 1.05) ) / 951.158596 ;
   var dodge_DR_DS = 1 / ((d_k/(dodge_fromAgi_DS+dodge_fromRating)) + (1/d_Cd)) ;

   var dodge_fromRating_RS = (Stats.DodgeRating + 1650) / 885 ;
   var dodge_DR_RS = 1 / ((d_k/(dodge_fromAgi+dodge_fromRating_RS)) + (1/d_Cd)) ;

   Bear.dodgeD_N  = (dodge_DR + dodge_fromBaseAgi) / 100 + base_dodge ;
   Bear.dodgeD_DS = (dodge_DR_DS + dodge_fromBaseAgi) / 100 + base_dodge ;
   Bear.dodgeD_RS = (dodge_DR_RS + dodge_fromBaseAgi) / 100 + base_dodge ;

   Bear.masteryN  = 5 + 8 + Stats.MasteryRating / 600 ;
   Bear.masteryWS = 5 + 8 + (Stats.MasteryRating + 1500) / 600 ;
   var ArmorFromLeatherNCloth = Stats.Armor - Stats.BonusArmor ;
   Bear.armN = (ArmorFromLeatherNCloth * 4.3 + Stats.BonusArmor) * (1 + .0125 * Bear.masteryN) ;
   Bear.armWS = (ArmorFromLeatherNCloth * 4.3 + Stats.BonusArmor) * (1 + .0125 * Bear.masteryWS) ;

   Bear.drN  = Bear.armN  / (Bear.armN  + 4037.5 * 93 - 317117.5) ;
   Bear.drWS = Bear.armWS / (Bear.armWS + 4037.5 * 93 - 317117.5) ;

   Bear.procAATry = riversong ;
   Bear.procMeleeTry = riversong ;
   document.getElementById("result").innerHTML+="<br/>River's song<br/>" + runSimManyTimes(2000);

   Bear.procAATry = colossus ;
   Bear.procMeleeTry = colossus ;
   document.getElementById("result").innerHTML+="<br/>Colossus<br/>" + runSimManyTimes(2000);

   Bear.procAATry = nop ;
   Bear.procMeleeTry = nop ;
   Bear.procAAHit = dancingsteel ;
   Bear.procMeleeHit = dancingsteel ;
   document.getElementById("result").innerHTML+="<br/>Dancing Steel<br/>" + runSimManyTimes(2000);

   Bear.procAAHit = windsong ;
   Bear.procMeleeHit = windsong ;
   Bear.procSpellHit = windsong ;
   document.getElementById("result").innerHTML+="<br/>Windsong<br/>" + runSimManyTimes(2000);

/*
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
   Stats.Armor += 2250 ;
   Stats.MasteryRating += 750 ;
   document.getElementById("result").innerHTML+="<br/>Elixirs: 2250 Armor + 750 Mastery<br/>" + runSimManyTimes(1000);
   Stats.BonusArmor -= 2250 ;
   Stats.Armor -= 2250 ;
   Stats.MasteryRating -= 750 ;
*/
}
