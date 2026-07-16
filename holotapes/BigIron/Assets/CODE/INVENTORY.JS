(function(A,arg){
  var B=A.base,W=A.w,H=A.h,sel=0,dead=0,msg="",hp=0,mhp=0,stim=0,STIM=86377;

  function cl(v,a,b){return v<a?a:v>b?b:v;}
  function ft(n){try{h.setFont("6x8",n||1);}catch(e){}}
  function tx(s,n){s=s==null?"":s.toString();return n&&s.length>n?s.substr(0,n-1)+"~":s;}
  function pp(){try{return typeof player!="undefined"&&player&&player.player?player.player:{};}catch(e){return {};}}
  function stat(n,d){var v=parseInt(pp()[n],10);return isNaN(v)?d:v;}
  function level(){return cl(stat("level",1),1,NV?50:30);}
  function maxhp(){return Math.max(60,70+stat("endurance",5)*10+level()*5);}
  function hpRead(){
    var p=pp(),i,o,r=1,sum=0,K="perceptioncondition,endurancecondition,leftattackcondition,rightattackcondition,rightmobilitycondition,leftmobilitycondition".split(",");
    mhp=maxhp();
    try{if(player&&player.getinfo)o=player.getinfo(false);}catch(e){}
    if(o){
      if(o.maxHP!==undefined)mhp=parseInt(o.maxHP,10)||mhp;
      if(o.hp!==undefined)r=parseFloat(o.hp);
    }else{
      for(i=0;i<6;i++){
        var c=parseFloat(p[K[i]]);
        sum+=isNaN(c)?100:cl(c,0,100);
      }
      r=sum/600;
    }
    if(isNaN(r))r=1;
    hp=cl(Math.round(cl(r,0,1)*mhp),0,mhp);
    return K;
  }
  function hpChange(d){
    var p=pp(),K=hpRead(),i,n=d*100/mhp,v;
    for(i=0;i<6;i++){
      v=parseFloat(p[K[i]]);
      if(isNaN(v))v=100;
      p[K[i]]=cl(Math.round(v+n),0,100);
    }
    try{if(player){player.modified=true;if(player.sync)player.sync();}}catch(e){}
    hpRead();
  }
  function aidPath(){return "INV/"+(NV?"NV":"F3")+"/AID.INV";}
  function stimRead(){
    var a=0,i=-1,o=0,n=0;
    try{
      a=new InvFile(aidPath());
      i=a.indexOf(parseInt(STIM,10)||STIM);
      if(i>=0){
        o=a.get(i);
        n=parseInt(o&&o.cnt,10)||0;
      }
    }catch(e){}
    stim=Math.max(0,n);
    return stim;
  }
  function stimUse(){
    var a=0,i=-1,o,c;
    try{
      a=new InvFile(aidPath());
      i=a.indexOf(parseInt(STIM,10)||STIM);
      if(i<0){stim=0;return 0;}
      o=a.get(i);
      c=parseInt(o&&o.cnt,10)||0;
      if(c<1){stim=0;return 0;}
      if(c<=1)a.remove(i);
      else{o.cnt=c-1;a.set(i,o);}
      a.sync();
      stim=Math.max(0,c-1);
      return 1;
    }catch(e){stim=0;}
    return 0;
  }
  function refresh(){hpRead();stimRead();}
  function heal(){return Math.max(25,Math.round(mhp*.35));}
  function saveWorld(){
    var p=pp();
    try{
      p.wb=p.wb||{};
      p.wb.map=arg.map;
      p.wb.mode=arg.mode||"tile";
      p.wb.x=arg.x;
      p.wb.y=arg.y;
      p.wb.facing=arg.facing;
      if(player){player.modified=true;if(player.sync)player.sync();}
    }catch(e){}
  }
  function rounds(){
    var st=pp().wb&&pp().wb.story?pp().wb.story:{},r=st.rounds||{},k,n=0;
    for(k in r)if(r[k])n++;
    return {rounds:n,enc:st.encounters||0,lead:st.deadLead||st.encounters||0,ready:!!(r.COURIER||st.forgeReady)};
  }
  function lootLine(i){
    var a=pp().wbLoot||[],o=a[i];
    if(!o)return "";
    return tx((o.name||o.id||"ITEM")+" x"+(o.cnt||1),24);
  }
  function drawBar(x,y,w,v,m){
    var p=m>0?cl(v/m,0,1):0;
    h.setColor(2).drawRect(x,y,x+w,y+8);
    h.setColor(1).fillRect(x+2,y+2,x+w-2,y+6);
    if(p)h.setColor(3).fillRect(x+2,y+2,x+2+Math.floor((w-4)*p),y+6);
  }
  function draw(){
    var o=["RETURN","USE STIMPAK","SAVE","EXIT GAME"],i,y,s=rounds();
    h.setClipRect(0,0,W-1,H-1);
    h.setColor(0).fillRect(0,0,W-1,H-1);
    h.setColor(2).drawRect(26,20,W-27,H-21);
    h.drawRect(32,26,W-33,H-27);
    h.setFontAlign(0,0);
    ft(4);h.setColor(3).drawString("ITEMS",W/2,58);
    ft(1);h.setColor(2).drawString("BIG IRON FIELD PACK",W/2,92);

    h.setFontAlign(-1,-1);
    h.setColor(3);ft(1);
    h.drawString("HP "+hp+"/"+mhp,58,118);
    drawBar(58,134,176,hp,mhp);
    h.setColor(2).drawString("STIMPAKS "+stim,58,152);
    h.drawString("HEAL "+heal(),58,168);

    h.setColor(3).drawString("BIG IRON "+s.rounds+"/6",276,118);
    h.setColor(2).drawString("JUDGMENTS "+s.enc+"/20",276,136);
    h.drawString("DEAD LEAD "+s.lead+"/20",276,152);
    h.drawString(s.ready?"FINAL READY":"KEEP RECORDING",276,170);
    h.drawString(lootLine(0),276,194);
    h.drawString(lootLine(1),276,210);
    h.drawString(lootLine(2),276,226);

    h.setFontAlign(0,0);
    for(i=0;i<4;i++){
      y=198+i*25;
      if(i==sel){
        h.setColor(2).fillRect(58,y-10,224,y+10);
        h.setColor(0);
      }else{
        h.setColor(2).drawRect(58,y-10,224,y+10);
        h.setColor(3);
      }
      ft(1);
      h.drawString((i==sel?"> ":"")+o[i],141,y);
    }
    h.setColor(2);
    h.drawString(tx(msg||"TURN WHEEL / PRESS",36),W/2,294);
    A.flip(0,H-1);
  }
  function back(m){
    A.world({map:arg.map,mode:arg.mode||"tile",x:arg.x,y:arg.y,facing:arg.facing,msg:m||msg||"ITEMS CLOSED"});
  }
  function use(){
    refresh();
    if(hp>=mhp){msg="HP ALREADY FULL";draw();return;}
    if(!stimUse()){msg="NO STIMPAKS";draw();return;}
    hpChange(heal());
    saveWorld();
    refresh();
    msg="STIMPAK USED";
    draw();
  }
  function press(){
    if(sel==0)back();
    else if(sel==1)use();
    else if(sel==2){saveWorld();msg="GAME SAVED";draw();}
    else{saveWorld();A.exit();}
  }
  function k1(v,l){
    if(dead)return;
    if(v===0){if(!l)press();return;}
    sel=(sel+(v<0?-1:1)+4)%4;
    draw();
  }
  function k2(v){if(v){sel=(sel+(v<0?-1:1)+4)%4;draw();}}
  function remove(){dead=1;A.gc();}

  refresh();
  draw();
  return {k1:k1,k2:k2,save:saveWorld,remove:remove};
})
