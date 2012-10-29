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
