(function(){
  var W=h.getWidth?h.getWidth():480,H=h.getHeight?h.getHeight():320;
  var B="HOLO/BIGIRON/",M=0,busy=0,quit=0,lt=0,rt=0,xt=0;
  var rn="",ra=0,rd=0,home=typeof Pip.MODE=="number"?Pip.MODE:1;
  var mode="splash",sel=0,mus=0,track="",st=0,ip=0,last=0,it=0,fade=0;
  var shell=0,sht=0;

  function gc(){try{if(E&&E.gc)E.gc()}catch(e){}try{if(E&&E.defrag)E.defrag()}catch(e2){}}
  function ft(n){try{h.setFont("6x8",n||1)}catch(e){}}
  function snd(n){try{if(Pip.playSound)Pip.playSound(n)}catch(e){}}
  function flip(){h.flip();if(typeof getTime=="function")Pip.lastFlip=getTime()}
  function hold(){try{Pip.lastFlip=getTime()+1}catch(e){}}
  function quiet(on){
    if(on){
      if(shell){hold();return}shell=1;
      try{if(Pip.stopTimers)Pip.stopTimers()}catch(e){}
      try{if(Pip.timers){if(Pip.timers.timeHeader){clearInterval(Pip.timers.timeHeader);Pip.timers.timeHeader=0}if(Pip.timers.flip){clearInterval(Pip.timers.flip);Pip.timers.flip=0}}}catch(e2){}
      if(sht)clearInterval(sht);sht=setInterval(hold,120);hold();
    }else{
      if(sht){clearInterval(sht);sht=0}shell=0;
      try{if(Pip.stopTimers)Pip.stopTimers()}catch(e3){}
      try{if(Pip.startTimers)Pip.startTimers()}catch(e4){}
      try{if(Pip.setWatches)Pip.setWatches()}catch(e5){}
    }
  }
  function screen(a,b){h.setClipRect(0,0,W-1,H-1);h.setColor(0).fillRect(0,0,W-1,H-1);h.setFontAlign(0,0);ft(3);h.setColor(3).drawString(a,W/2,126);ft(1);h.setColor(2).drawString(b||"",W/2,172);flip(0,H-1)}

  function pdata(){try{return player&&player.player?player.player:{}}catch(e){return{}}}
  function equip(){
    var p=pdata(),id=0,d=0,o=0,v,n="FISTS",dm=6;
    try{if(player&&player.getav)id=player.getav("equippedWeap")}catch(e){}
    if(id===undefined||id===null||id==="")id=p.equippedWeap;
    if(id===undefined||id===null||id==="")id=p.equippedweap;
    id=parseInt(id,10)||0;
    if(id)try{d=new DataFile("DATA/"+(NV?"NV":"F3")+"/WEAPONS.DAT");o=d.getId(id)}catch(e2){}finally{try{if(d&&d.close)d.close()}catch(e3){}}
    if(o){v=o.txt;if(v!==undefined&&v!==null)n=String(v);v=parseFloat(o.dam!==undefined?o.dam:(o.dmg!==undefined?o.dmg:o.damage));if(!isNaN(v)&&v>0)dm=Math.floor(v)}
    if(n.length>20)n=n.substr(0,19)+"~";
    return{weapon:n,weaponId:id,dmg:dm,dt:0,type:id?"GUN":"MELEE"};
  }

  function bin(n){var f=0,t=0,o,c;try{f=E.openFile(B+n,"r");if(!f)return 0;t=new Uint8Array(h.buffer);o=t.length;c=f.read(256);while(c){o-=c.length;if(o<0)break;t.set(c,o);c=f.read(256)}f.close();t=0;return 1}catch(e){try{if(f)f.close()}catch(e2){}return 0}}
  function fallback(){h.setColor(0).fillRect(0,0,W-1,H-1);h.setFontAlign(0,0);h.setColor(2).drawRect(34,24,W-35,H-25);ft(4);h.setColor(3).drawString("BIG IRON",W/2,78);ft(1);h.setColor(2).drawString("PB3000 RPG",W/2,116)}
  function choices(){var y=[145,187,229],i,t=["START NEW","LOAD GAME","DEMO MODE"];h.setFontAlign(0,0);ft(2);for(i=0;i<3;i++){h.setColor(2).drawRect(118,y[i],W-119,y[i]+31);h.setColor(sel==i?3:2).drawString(t[i],W/2,y[i]+8)}h.setColor(3).fillPoly([96,y[sel]+9,96,y[sel]+21,108,y[sel]+15]);ft(1);h.setColor(2).drawString("RIGHT WHEEL / LEFT CLICK",W/2,286)}
  function menu(){if(!bin("MENU.BIN"))fallback();choices();flip(0,H-1)}
  function showMenu(){if(st){clearTimeout(st);st=0}if(busy||M)return;mode="menu";sel=0;menu();music("BICT")}
  function start(){sel=0;mode="splash";if(bin("IMAGE.BIN")||bin("Startg1.BIN")){flip(0,H-1);st=setTimeout(showMenu,1300)}else showMenu()}

  function music(n){var p;if(!n){mus=0;track="";try{if(Pip.audioStop)Pip.audioStop()}catch(e){}try{Pip.radioClipPlaying=0}catch(e2){}return}if(quit)return;n=String(n);if(mus&&track==n)return;p=B+n+".wav";try{if(mus&&Pip.audioStop)Pip.audioStop();Pip.radioClipPlaying=1;Pip.audioStart(p);mus=1;track=n}catch(e3){mus=0;track=""}}

  function closeIntro(){try{if(ip&&ip.close)ip.close()}catch(e){}ip=0}
  function introDraw(s){var a=s.split("|"),y=Math.floor(H/2-(a.length-1)*12),i;h.setColor(0).fillRect(0,0,W-1,H-1);h.setColor(2).drawRect(18,18,W-19,H-19).drawRect(24,24,W-25,H-25);h.setFontAlign(0,0);ft(2);for(i=0;i<a.length;i++){h.setColor(a[i].charAt(0)=="*"?2:3);h.drawString(a[i],W/2,y+i*24)}ft(1);h.setColor(2).drawString(last?"":"LEFT CLICK",W/2,H-34);flip(0,H-1);if(last){closeIntro();if(it)clearTimeout(it);it=setTimeout(fadeIntro,1500)}}
  function introRead(){var c,n,s;if(!ip)return;c=ip.read(1);if(!c){closeIntro();fadeIntro();return}n=c.charCodeAt(0);last=!!(n&128);n&=127;s=ip.read(n)||"";introDraw(s);s=0}
  function fadeIntro(){if(it){clearTimeout(it);it=0}if(mode!="intro")return;fade++;h.setColor(fade<3?fade:0).fillRect(0,0,W-1,H-1);flip(0,H-1);if(fade<3){it=setTimeout(fadeIntro,180);return}fade=0;last=0;music(0);gc();route("W",{newGame:true},90)}
  function intro(){if(st){clearTimeout(st);st=0}mode="intro";last=0;fade=0;try{ip=E.openFile(B+"I.BIN","r")}catch(e){ip=0}if(!ip){music(0);route("W",{newGame:true},90);return}introRead()}

  function unload(){var q=M;M=0;if(q){try{if(q.remove)q.remove()}catch(e){}q=0}gc()}
  function load(){var n=rn,a=ra,s=0,f=0;lt=0;rn="";ra=0;rd=0;try{s=fs.readFile(B+n+".JS");if(!s)throw n;f=eval(s);s=0;gc();M=f(API,a||{});f=a=0;busy=0;gc()}catch(e){s=f=a=0;busy=0;screen("LOAD FAILED",String(e).substr(0,36))}}
  function detach(){rt=0;unload();music(0);h.setColor(0).fillRect(0,0,W-1,H-1);flip(0,H-1);gc();screen("LOADING",rn);lt=setTimeout(load,rd)}
  function route(n,a,d){if(busy||quit)return;busy=1;mode="load";rn=n;ra=a||{};rd=d===undefined?80:d;if(rt)clearTimeout(rt);if(lt)clearTimeout(lt);rt=lt=0;quiet(1);rt=setTimeout(detach,20)}
  function back(a){route(a&&a.map=="WORLD_03"?"Q":a&&a.map=="WORLD_02"?"X":"W",a,100)}
  function toMenu(){if(quit)return;busy=1;unload();quiet(0);busy=0;showMenu()}

  function exitApp(){if(quit)return;quit=1;music(0);quiet(0);try{if(M&&M.save)M.save(true)}catch(e){}try{Pip.CURRENT.fullscreen=false}catch(e2){}try{Pip.emit("mode",home,true)}catch(e3){try{Pip.changeMenu()}catch(e4){remove()}}if(xt)clearTimeout(xt);xt=setTimeout(function(){xt=0;try{Pip.changeMenu()}catch(e){}},180)}
  function remove(){busy=1;if(st)clearTimeout(st);if(lt)clearTimeout(lt);if(rt)clearTimeout(rt);if(xt)clearTimeout(xt);if(it)clearTimeout(it);st=lt=rt=xt=it=0;closeIntro();unload();music(0);quiet(0);try{Pip.removeListener("knob1",k1)}catch(e){}try{Pip.removeListener("knob2",k2)}catch(e2){}try{Pip.CURRENT.fullscreen=false}catch(e3){}gc()}
  function k1(v,l){if(busy)return;if(M&&M.k1){M.k1(v,l);return}if(mode=="intro"){if(v===0&&!l&&!last){snd("SELECT");introRead()}return}if(mode=="menu"&&v===0&&!l){snd("SELECT");if(sel==2){music(0);route("D",{},70)}else if(sel) {music(0);route("W",{},90)}else intro()}}
  function k2(v){if(busy)return;if(M&&M.k2){M.k2(v);return}if(mode=="menu"&&v){sel=(sel+(v>0?1:2))%3;menu()}}

  var API={base:B,w:W,h:H,flip:flip,gc:gc,equip:equip,music:music,exit:exitApp,
    world:function(a){route(a&&a.map=="WORLD_03"?"Q":a&&a.map=="WORLD_02"?"X":"W",a,100)},returnWorld:back,
    bridge:function(a){route("X",a,100)},ride:function(a){route("H",a,65)},
    battle:function(a){route("B",a,80)},shop:function(a){route("S",a,55)},
    pause:function(a){route("P",a,55)},interior:function(a){route("R",a,75)},house:function(a){route("M",a,65)},menu:toMenu};
  try{Pip.CURRENT.fullscreen=true}catch(e){}
  quiet(0);
  try{Pip.onExclusive("knob1",k1)}catch(e2){try{Pip.on("knob1",k1)}catch(e3){}}
  try{Pip.onExclusive("knob2",k2)}catch(e4){try{Pip.on("knob2",k2)}catch(e5){}}
  start();
  return{id:"BIGIRON",notDefault:true,fullscreen:true,remove:remove};
});
