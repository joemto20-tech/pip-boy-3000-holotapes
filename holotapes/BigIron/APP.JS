(function(){
  var WIDTH=h.getWidth?h.getWidth():480;
  var HEIGHT=h.getHeight?h.getHeight():320;
  var module=null;
  var loading=false;
  var loadTimer=null;
  var exiting=false;
  var homeMode=typeof Pip.MODE=="number"?Pip.MODE:1;
  var musicWanted=false;
  var musicPlaying=false;
  var musicTrack="";
  var musicPath="";
  var musicTimer=null;
  var startMode="art";
  var oldBlitDisable=Pip.blitOptions&&Pip.blitOptions.disable;

  function exists(path){
    try{return !!fs.statSync(path);}catch(e){return false;}
  }

  function findBase(){
    var roots=[
      "HOLO/BIGIRON/",
      "BIGIRON/",
      ""
    ];
    var i;
    for(i=0;i<roots.length;i++){
      if(exists(roots[i]+"battle.json")&&exists(roots[i]+"CODE/WORLD.JS"))return roots[i];
      if(exists(roots[i]+"Assets/battle.json")&&exists(roots[i]+"Assets/CODE/WORLD.JS"))return roots[i]+"Assets/";
    }
    return "HOLO/BIGIRON/";
  }

  var BASE=findBase();

  function gc(){
    try{if(typeof E!="undefined"&&E.gc)E.gc();}catch(e){}
    try{if(typeof E!="undefined"&&E.defrag)E.defrag();}catch(e2){}
  }

  function font(size){
    try{h.setFont("6x8",size||1);}catch(e){}
  }

  function sound(name){
    try{if(Pip.playSound)Pip.playSound(name);}catch(e){}
  }

  function readImage(path){
    try{return fs.readFile(path);}catch(e){}
    try{return fs.readFileSync(path);}catch(e2){}
    return null;
  }

  function readText(path){
    try{return fs.readFileSync(path);}catch(e){}
    try{return fs.readFile(path);}catch(e2){}
    return null;
  }

  function savedMap(){
    var data,map;
    try{
      data=JSON.parse(readText(BASE+"SAVE/STATE.JSON")||readText(BASE+"STATE.JSON")||"{}");
      map=data&&data.map?data.map:"";
      return map&&exists(BASE+"DATA/"+map+".JSON")?map:"";
    }catch(e){}
    return "";
  }

  function drawArt(name){
    var img,w,hgt;
    try{
      img=readImage(BASE+name);
      if(!img)img=readImage(BASE+"Assets/"+name);
      if(!img)return false;
      w=img.charCodeAt?img.charCodeAt(0):WIDTH;
      hgt=img.charCodeAt?img.charCodeAt(1):HEIGHT;
      h.setClipRect(0,0,WIDTH-1,HEIGHT-1);
      h.setColor(0).fillRect(0,0,WIDTH-1,HEIGHT-1);
      h.setColor(3);
      h.drawImage(img,Math.round((WIDTH-w)/2),Math.round((HEIGHT-hgt)/2));
      img=null;
      gc();
      return true;
    }catch(e3){}
    return false;
  }

  function flip(y1,y2){
    var options,k;
    try{
      if(Pip.blitScreen){
        options={};
        try{for(k in Pip.blitOptions)options[k]=Pip.blitOptions[k];}catch(e){}
        options.y1=y1;
        options.y2=y2;
        Pip.blitScreen(h,options);
      }else{
        h.flip();
      }
      try{Pip.lastFlip=getTime();}catch(e2){}
    }catch(e3){
      try{h.flip();}catch(e4){}
    }
  }

  function screen(title,subtitle){
    var y;
    try{
      h.setClipRect(0,0,WIDTH-1,HEIGHT-1);
      h.setColor(0).fillRect(0,0,WIDTH-1,HEIGHT-1);
      h.setColor(1);
      for(y=0;y<HEIGHT;y+=16)h.drawLine(0,y,WIDTH-1,y);
      h.setFontAlign(0,0);
      font(3);
      h.setColor(3).drawString(title,WIDTH/2,125);
      font(1);
      h.setColor(2).drawString(subtitle||"",WIDTH/2,172);
      flip(0,HEIGHT-1);
    }catch(e){}
  }

  function startArtScreen(){
    try{
      if(drawArt("ST.IMG")){
        flip(0,HEIGHT-1);
        gc();
        return true;
      }
    }catch(e){}
    return false;
  }

  function startMenuScreen(){
    var y,hasSave=savedMap();
    try{
      h.setClipRect(0,0,WIDTH-1,HEIGHT-1);
      h.setColor(0).fillRect(0,0,WIDTH-1,HEIGHT-1);
      h.setColor(1);
      for(y=0;y<HEIGHT;y+=16)h.drawLine(0,y,WIDTH-1,y);
      h.setColor(2).drawRect(22,18,WIDTH-23,HEIGHT-19);
      h.drawRect(28,24,WIDTH-29,HEIGHT-25);
      h.setFontAlign(0,0);
      font(4);
      h.setColor(3).drawString("BIG IRON",WIDTH/2,78);
      font(2);
      h.setColor(2).drawString("WASTELAND RPG",WIDTH/2,117);
      h.setColor(1).drawLine(88,146,WIDTH-89,146);
      font(1);
      h.setColor(2).drawString("MOVE WITH BOTH WHEELS",WIDTH/2,204);
      h.drawString("DOUBLE PRESS: PAUSE",WIDTH/2,226);
      h.setColor(0).fillRect(112,276,WIDTH-113,306);
      h.setColor(2).drawRect(112,276,WIDTH-113,306);
      h.setColor(3).drawString("LEFT WHEEL: START",WIDTH/2,284);
      h.setColor(2).drawString(hasSave?"SAVE DETECTED":"NEW TRAIL READY",WIDTH/2,298);
      flip(0,HEIGHT-1);
      gc();
    }catch(e2){}
  }

  function startScreen(){
    startMode="art";
    if(!startArtScreen()){
      startMode="menu";
      startMenuScreen();
    }
    music("HOLO_BICT");
  }

  function findMusic(track){
    track=(track||"NVTH").toString();
    var paths=[
      BASE+"AUDIO/"+track+".wav",
      BASE+"CODE/"+track+".wav",
      BASE+track+".wav"
    ];
    var i;
    for(i=0;i<paths.length;i++){
      if(exists(paths[i])){
        musicPath=paths[i];
        musicTrack=track;
        return musicPath;
      }
    }
    return "";
  }

  function music(on){
    var path;
    if(!on){
      musicWanted=false;
      if(musicTimer){
        clearTimeout(musicTimer);
        musicTimer=null;
      }
      try{if(musicPlaying&&Pip.audioStop)Pip.audioStop();}catch(e){}
      musicPlaying=false;
      try{Pip.radioClipPlaying=0;}catch(e2){}
      return;
    }
    on=on===true?"NVTH":on.toString();
    if(exiting)return;
    musicWanted=true;
    if(musicPlaying&&musicTrack!=on){
      try{if(Pip.audioStop)Pip.audioStop();}catch(e6){}
      musicPlaying=false;
    }
    path=findMusic(on);
    if(!path||!Pip.audioStart)return;
    try{
      if(musicPlaying&&Pip.audioIsPlaying&&Pip.audioIsPlaying())return;
    }catch(e3){}
    try{Pip.radioClipPlaying=1;}catch(e4){}
    try{
      Pip.audioStart(path);
      musicPlaying=true;
    }catch(e5){musicPlaying=false;}
  }

  function musicEnded(){
    musicPlaying=false;
    if(!musicWanted||exiting)return;
    if(musicTimer)clearTimeout(musicTimer);
    musicTimer=setTimeout(function(){
      musicTimer=null;
      music(musicTrack||"NVTH");
    },80);
  }

  function unload(){
    if(module){
      try{if(module.remove)module.remove();}catch(e){}
      module=null;
    }
    gc();
  }

  function loadModule(name,args){
    if(loading)return;
    loading=true;
    gc();
    if(name=="BATTLE")music(false);
    screen("LOADING",name);
    if(loadTimer)clearTimeout(loadTimer);
    loadTimer=setTimeout(function(){
      var source,factory;
      loadTimer=null;
      unload();
      try{
        h.setColor(0).fillRect(0,0,WIDTH-1,HEIGHT-1);
        h.flip();
        gc();
        source=readText(BASE+"CODE/"+name+".JS");
        if(!source)throw "MISSING "+name+".JS";
        factory=eval(source);
        source=null;
        gc();
        module=factory(api,args||{});
        loading=false;
        gc();
      }catch(e){
        loading=false;
        screen("LOAD FAILED",((""+e)||"UNKNOWN").substr(0,42));
      }
    },20);
  }

  function exitApp(){
    if(exiting)return;
    exiting=true;
    music(false);
    try{if(module&&module.save)module.save(true);}catch(e){}
    try{Pip.CURRENT.fullscreen=false;}catch(e2){}
    try{Pip.emit("mode",homeMode,true);}catch(e3){
      try{Pip.changeMenu();}catch(e4){remove();}
    }
    setTimeout(function(){
      if(!loading&&exiting){
        try{Pip.changeMenu();}catch(e){}
      }
    },180);
  }

  function remove(){
    if(loading)return;
    loading=true;
    if(loadTimer){
      clearTimeout(loadTimer);
      loadTimer=null;
    }
    unload();
    music(false);
    try{Pip.removeListener("audioStopped",musicEnded);}catch(e0){}
    try{Pip.removeListener("knob1",onKnob1);}catch(e){}
    try{Pip.removeListener("knob2",onKnob2);}catch(e2){}
    try{Pip.CURRENT.fullscreen=false;}catch(e3){}
    try{if(Pip.blitOptions)Pip.blitOptions.disable=oldBlitDisable;}catch(e8){}
    try{
      if(Pip.stopTimers)Pip.stopTimers();
      if(Pip.startTimers)Pip.startTimers();
    }catch(e4){}
    try{if(Pip.setWatches)Pip.setWatches();}catch(e5){}
    gc();
  }

  function onKnob1(value,longPress){
    if(loading)return;
    if(module&&module.k1)module.k1(value,longPress);
    else if(value===0&&!longPress){
      sound("SELECT");
      gc();
      if(startMode=="art"){
        startMode="menu";
        startMenuScreen();
        return;
      }
      startMode="loading";
      loadModule("WORLD",{});
    }
  }

  function onKnob2(value){
    if(!loading&&module&&module.k2)module.k2(value);
  }

  var api={
    base:BASE,
    w:WIDTH,
    h:HEIGHT,
    flip:flip,
    world:function(args){loadModule("WORLD",args);},
    battle:function(args){loadModule("BATTLE",args);},
    shoot:function(args){loadModule("SHOOT",args);},
    music:music,
    exit:exitApp,
    gc:gc
  };

  try{Pip.CURRENT.fullscreen=true;}catch(e){}
  try{if(Pip.blitOptions)Pip.blitOptions.disable=false;}catch(e1){}
  try{if(Pip.stopTimers)Pip.stopTimers();}catch(e2){}
  try{Pip.onExclusive("knob1",onKnob1);}catch(e3){
    try{Pip.on("knob1",onKnob1);}catch(e4){}
  }
  try{Pip.onExclusive("knob2",onKnob2);}catch(e5){
    try{Pip.on("knob2",onKnob2);}catch(e6){}
  }
  try{Pip.on("audioStopped",musicEnded);}catch(e7){}

  startScreen();

  return {id:"BIGIRON",notDefault:true,fullscreen:true,remove:remove};
});
