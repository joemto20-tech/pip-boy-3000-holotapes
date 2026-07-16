(function(){
  var W=h.getWidth?h.getWidth():480,H=h.getHeight?h.getHeight():320;
  var mod=null,loading=false,exiting=false,loadTimer=0,startTimer=0,exitTimer=0;
  var home=typeof Pip.MODE=="number"?Pip.MODE:1,mode="splash",sel=0;
  var musicOn=false,musicTrack="",musicPath="";
  var battleEquip=null;
  var shellQuiet=false,shellTick=0;

  function exists(p){try{return !!fs.statSync(p);}catch(e){return false;}}
  function base(){
    var r=["HOLO/BIGIRON/","BIGIRON/",""],i;
    for(i=0;i<r.length;i++){
      if(exists(r[i]+"battle.json")&&exists(r[i]+"CODE/WORLD.JS"))return r[i];
      if(exists(r[i]+"Assets/battle.json")&&exists(r[i]+"Assets/CODE/WORLD.JS"))return r[i]+"Assets/";
    }
    return "HOLO/BIGIRON/";
  }
  var B=base();

  function gc(){
    try{if(E&&E.gc)E.gc();}catch(e){}
    try{if(E&&E.defrag)E.defrag();}catch(e2){}
  }
  function font(s){try{h.setFont("6x8",s||1);}catch(e){}}
  function sound(n){try{if(Pip.playSound)Pip.playSound(n);}catch(e){}}
  function txt(p){try{return fs.readFileSync(p);}catch(e){}try{return fs.readFile(p);}catch(e2){}return null;}
  function img(p){try{return fs.readFile(p);}catch(e){}try{return fs.readFileSync(p);}catch(e2){}return null;}
  function wr(p,d){try{if(fs.writeFileSync){fs.writeFileSync(p,d);return true;}}catch(e){}try{if(fs.writeFile){fs.writeFile(p,d);return true;}}catch(e2){}return false;}

  function playerData(){try{return typeof player!="undefined"&&player&&player.player?player.player:{};}catch(e){return {};}}
  function weaponName(o,d){var v=o&&o.txt!==undefined?o.txt:d;v=v==null?"":v.toString();return v.length>20?v.substr(0,19)+"~":v;}
  function weaponDmg(o,d){var v=parseFloat(o&&o.DMG);return isNaN(v)?d:v;}
  function datPath(c){return"DATA/"+(NV?"NV":"F3")+"/"+c+".DAT";}
  function datGet(c,id){var d=0,o=0;try{if(!id)return 0;d=new DataFile(datPath(c));o=d.getId(parseInt(id,10)||id);}catch(e){}finally{try{if(d)d.close();}catch(e2){}}return o||0;}
  function prefetchEquipment(force){
    var p=playerData(),wid,w,base;
    if(battleEquip&&!force)return battleEquip;
    try{
      wid=parseInt(p.equippedweap,10)||0;
      w=wid?datGet("WEAPONS",wid):0;
      base=weaponDmg(w,0);
      if(!base)base=wid?12:6;
      battleEquip={weapon:weaponName(w,wid?("WEAPON "+wid):"FISTS"),armor:"NO ARMOR",dt:0,dmg:Math.max(1,Math.floor(base)),type:wid?"GUN":"MELEE"};
    }catch(e){
      battleEquip={weapon:"FISTS",armor:"NO ARMOR",dt:0,dmg:6,type:"MELEE"};
    }
    return battleEquip;
  }

  function flip(y1,y2){
    try{
      h.flip();
      try{Pip.lastFlip=getTime();}catch(e2){}
    }catch(e3){}
  }

  function rawFlip(){
    try{
      h.flip();
      try{Pip.lastFlip=getTime();}catch(e){}
    }catch(e2){}
  }

  function holdShell(){
    try{Pip.lastFlip=getTime()+1;}catch(e){}
  }

  function quietShell(on){
    if(on){
      if(shellQuiet){holdShell();return;}
      shellQuiet=true;
      try{if(Pip.stopTimers)Pip.stopTimers();}catch(e){}
      try{
        if(Pip.timers){
          if(Pip.timers.timeHeader){clearInterval(Pip.timers.timeHeader);Pip.timers.timeHeader=0;}
          if(Pip.timers.flip){clearInterval(Pip.timers.flip);Pip.timers.flip=0;}
        }
      }catch(e2){}
      if(shellTick)clearInterval(shellTick);
      shellTick=setInterval(holdShell,100);
      holdShell();
    }else{
      if(shellTick){clearInterval(shellTick);shellTick=0;}
      if(!shellQuiet){
        try{if(Pip.startTimers)Pip.startTimers();}catch(e0){}
        try{if(Pip.setWatches)Pip.setWatches();}catch(e1){}
        return;
      }
      shellQuiet=false;
      try{if(Pip.stopTimers)Pip.stopTimers();}catch(e3){}
      try{if(Pip.startTimers)Pip.startTimers();}catch(e4){}
      try{if(Pip.setWatches)Pip.setWatches();}catch(e5){}
    }
  }

  function screen(a,b){
    h.setClipRect(0,0,W-1,H-1);
    h.setColor(0).fillRect(0,0,W-1,H-1);
    h.setFontAlign(0,0);
    font(3);h.setColor(3).drawString(a,W/2,125);
    font(1);h.setColor(2).drawString(b||"",W/2,172);
    flip(0,H-1);
  }

  function openFile(n){
    var p=[B+n,n,B+"Assets/"+n],i,f=0;
    if(typeof E=="undefined"||!E.openFile)return 0;
    for(i=0;i<p.length&&!f;i++)try{f=E.openFile(p[i],"r");}catch(e){}
    return f;
  }

  function drawBin(n){
    var f,t,o,c;
    try{
      f=openFile(n);
      if(!f)return false;
      t=new Uint8Array(h.buffer);
      o=t.length;
      c=f.read(256);
      while(c){
        o-=c.length;
        if(o<0)break;
        t.set(c,o);
        c=f.read(256);
      }
      try{f.close();}catch(e){}
      t=null;
      return true;
    }catch(e2){try{if(f)f.close();}catch(e3){}}
    return false;
  }

  function drawFallback(){
    h.setClipRect(0,0,W-1,H-1);
    h.setColor(0).fillRect(0,0,W-1,H-1);
    h.setFontAlign(0,0);
    font(4);h.setColor(3).drawString("BIG IRON",W/2,90);
    font(2);h.drawString("START NEW",W/2,178);
    h.drawString("LOAD",W/2,223);
  }

  function drawMenu(){
    if(!drawBin("MENU.BIN"))drawFallback();
    h.setColor(3).fillPoly([124,sel?216:171,124,sel?228:183,136,sel?222:177]);
    flip(0,H-1);
    gc();
  }

  function showMenu(){
    if(loading||mod)return;
    mode="menu";
    sel=0;
    drawMenu();
  }

  function fadeToMenu(step){
    if(loading||mod)return;
    try{
      h.setColor(0);
      h.fillRect(0,0,W-1,H-1);
      flip(0,H-1);
    }catch(e){}
    startTimer=0;
    showMenu();
  }

  function clearSave(){
    var d='{"cleared":{}}',p;
    wr(B+"SAVE/STATE.JSON",d);
    wr(B+"STATE.JSON",d);
    try{
      if(typeof player!="undefined"&&player&&player.player){
        p=player.player;
        p.wb={};
        player.modified=true;
        if(player.sync)player.sync();
      }
    }catch(e){}
    gc();
  }

  function clearStartMedia(){
    if(startTimer)clearTimeout(startTimer);
    startTimer=0;
    music(false);
    try{if(Pip.videoStop)Pip.videoStop();}catch(e){}
    h.setClipRect(0,0,W-1,H-1);
    h.setColor(0).fillRect(0,0,W-1,H-1);
    flip(0,H-1);
    gc();
  }

  function start(){
    mode="splash";
    sel=0;
    if(startTimer)clearTimeout(startTimer);
    if(!drawBin("IMAGE.BIN"))drawFallback();
    flip(0,H-1);
    startTimer=setTimeout(function(){fadeToMenu(0);},4300);
    music("HOLO_BICT");
  }

  function musicPathFor(t){
    var p=[B+"AUDIO/"+t+".wav",B+"CODE/"+t+".wav",B+t+".wav"],i;
    for(i=0;i<p.length;i++)if(exists(p[i]))return p[i];
    return "";
  }

  function music(t){
    var p;
    if(!t){
      musicOn=false;
      try{if(Pip.audioStop)Pip.audioStop();}catch(e){}
      try{Pip.radioClipPlaying=0;}catch(e2){}
      return;
    }
    if(exiting)return;
    t=t===true?"NVTH":(""+t);
    p=musicPathFor(t);
    if(!p||!Pip.audioStart)return;
    if(musicOn&&musicTrack==t)return;
    try{if(musicOn&&Pip.audioStop)Pip.audioStop();}catch(e3){}
    try{Pip.radioClipPlaying=1;}catch(e4){}
    try{Pip.audioStart(p);musicOn=true;musicTrack=t;musicPath=p;}catch(e5){musicOn=false;}
  }

  function unload(){
    if(mod){
      try{if(mod.remove)mod.remove();}catch(e){}
      mod=null;
    }
    gc();
  }

  function loadModule(n,a){
    if(loading)return;
    loading=true;
    if(loadTimer)clearTimeout(loadTimer);
    unload();
    if(api)api.flip=flip;
    if(n=="BATTLE"){
      quietShell(true);
      music(false);
      screen("CHECKING","WEAPON");
      battleEquip=null;
      prefetchEquipment(true);
    }else{
      quietShell(false);
    }
    screen("LOADING",n);
    loadTimer=setTimeout(function(){
      var s,f;
      loadTimer=0;
      try{
        h.setColor(0).fillRect(0,0,W-1,H-1);
        flip(0,H-1);
        gc();
        s=txt(B+"CODE/"+n+".JS");
        if(!s)throw "MISSING "+n+".JS";
        f=eval(s);
        s=null;
        gc();
        mod=f(api,a||{});
        loading=false;
        gc();
      }catch(e){
        loading=false;
        screen("LOAD FAILED",(""+e).substr(0,42));
      }
    },20);
  }

  function exitApp(){
    if(exiting)return;
    exiting=true;
    music(false);
    quietShell(false);
    try{if(mod&&mod.save)mod.save(true);}catch(e){}
    try{Pip.CURRENT.fullscreen=false;}catch(e2){}
    try{Pip.emit("mode",home,true);}catch(e3){try{Pip.changeMenu();}catch(e4){remove();}}
    if(exitTimer)clearTimeout(exitTimer);
    exitTimer=setTimeout(function(){exitTimer=0;if(!loading&&exiting)try{Pip.changeMenu();}catch(e){}},180);
  }

  function remove(){
    loading=true;
    if(loadTimer)clearTimeout(loadTimer);
    if(startTimer)clearTimeout(startTimer);
    if(exitTimer)clearTimeout(exitTimer);
    loadTimer=startTimer=exitTimer=0;
    unload();
    music(false);
    quietShell(false);
    try{Pip.removeListener("knob1",k1);}catch(e){}
    try{Pip.removeListener("knob2",k2);}catch(e2){}
    try{Pip.CURRENT.fullscreen=false;}catch(e3){}
    try{if(Pip.setWatches)Pip.setWatches();}catch(e4){}
    gc();
  }

  function k1(v,l){
    if(loading)return;
    if(mod&&mod.k1){mod.k1(v,l);return;}
    if(mode=="splash")return;
    if(mode=="menu"){
      if(v!==0){
        sel=sel?0:1;
        drawMenu();
        return;
      }
      if(l)return;
      sound("SELECT");
      mode="loading";
      clearStartMedia();
      if(sel)loadModule("WORLD",{});
      else{
        clearSave();
        loadModule("WORLD",{newGame:true});
      }
    }
  }

  function k2(v){if(!loading&&mod&&mod.k2)mod.k2(v);}

  var api={
    base:B,w:W,h:H,flip:flip,
    equip:function(){return prefetchEquipment();},
    world:function(a){loadModule("WORLD",a);},
    battle:function(a){loadModule("BATTLE",a);},
    inventory:function(a){loadModule("INVENTORY",a);},
    shoot:function(a){loadModule("SHOOT",a);},
    music:music,exit:exitApp,gc:gc
  };

  try{Pip.CURRENT.fullscreen=true;}catch(e){}
  quietShell(false);
  try{Pip.onExclusive("knob1",k1);}catch(e2){try{Pip.on("knob1",k1);}catch(e3){}}
  try{Pip.onExclusive("knob2",k2);}catch(e4){try{Pip.on("knob2",k2);}catch(e5){}}
  start();
  return {id:"BIGIRON",notDefault:true,fullscreen:true,remove:remove};
});
