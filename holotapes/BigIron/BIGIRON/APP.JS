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
    }
    return "HOLO/BIGIRON/";
  }

  var BASE=findBase();

  function gc(){
    try{if(typeof E!="undefined"&&E.gc)E.gc();}catch(e){}
  }

  function font(size){
    try{h.setFont("6x8",size||1);}catch(e){}
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
      h.flip();
    }catch(e){}
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
    if(name=="BATTLE")music(false);
    screen("LOADING",name);
    if(loadTimer)clearTimeout(loadTimer);
    loadTimer=setTimeout(function(){
      var source,factory;
      loadTimer=null;
      unload();
      try{
        source=fs.readFile(BASE+"CODE/"+name+".JS");
        if(!source)throw "MISSING "+name+".JS";
        factory=eval(source);
        source=null;
        gc();
        module=factory(api,args||{});
        loading=false;
        gc();
      }catch(e){
        loading=false;
        screen("LOAD FAILED",(""+e).substr(0,36));
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
    else if(value===0&&!longPress)loadModule("WORLD",{});
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
    music:music,
    exit:exitApp,
    gc:gc
  };

  try{Pip.CURRENT.fullscreen=true;}catch(e){}
  try{if(Pip.stopTimers)Pip.stopTimers();}catch(e2){}
  try{Pip.onExclusive("knob1",onKnob1);}catch(e3){
    try{Pip.on("knob1",onKnob1);}catch(e4){}
  }
  try{Pip.onExclusive("knob2",onKnob2);}catch(e5){
    try{Pip.on("knob2",onKnob2);}catch(e6){}
  }
  try{Pip.on("audioStopped",musicEnded);}catch(e7){}

  screen("Big Iron RPG","");

  return {id:"BIGIRON",notDefault:true,fullscreen:true,remove:remove};
});
