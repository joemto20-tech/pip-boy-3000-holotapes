// Big Iron profile rows in STATS > GENERAL.
// Reads the compact profile written by HOLO/BIGIRON/APP.JS.
(function(){
  if(typeof loadJSONWithDefaults!="function")return;
  var cfw=global.CFW=global.CFW||{};
  if(cfw.BIGIRON_STATS)return;
  cfw.BIGIRON_STATS=1;
  var orig=loadJSONWithDefaults;
  function readProfile(){
    var p=["HOLO/BIGIRON/SAVE/PROFILE.JSON","HOLO/BIGIRON/PROFILE.JSON"],i;
    for(i=0;i<p.length;i++){
      try{return JSON.parse(fs.readFileSync(p[i]));}catch(e){}
    }
    return null;
  }
  global.loadJSONWithDefaults=function(file,defaults){
    var o=orig(file,defaults),p;
    if(file=="SETTINGS/GENERAL.JSON"){
      p=readProfile();
      if(p){
        o["Big Iron Level"]=p.lv||1;
        o["Big Iron HP"]=(p.hp||0)+"/"+(p.mh||0);
        o["Big Iron Weapon"]=p.w||"FISTS";
        o["Big Iron Damage"]=p.d||0;
        o["Big Iron Rounds"]=(p.r||0)+"/6";
        o["Big Iron Encounters"]=p.e||0;
        o["Dead Man's Lead"]=p.dl||0;
      }
    }
    return o;
  };
})();
