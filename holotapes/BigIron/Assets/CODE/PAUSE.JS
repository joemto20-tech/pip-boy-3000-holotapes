(function(A,arg){
  var B=A.base||"",W=A.w,H=A.h,tab=0,row=0,dead=0,pim=0,msg=arg.msg||"";
  var tabs=["STAT","INV","DATA","MAP"];
  var actions=[
    ["RESUME","SAVE LOCATION","EXIT GAME"],
    ["FIELD PACK","RESUME"],
    ["PROGRESS","RESUME"],
    ["RESUME"]
  ];
  function ft(n){try{h.setFont("6x8",n||1)}catch(e){}}
  function tx(s,n){s=s==null?"":s.toString();return n&&s.length>n?s.substr(0,n-1)+"~":s}
  function st(){var s=arg.story||{};s.rounds=s.rounds||{};return s}
  function rounds(){var s=st(),n=0,k;for(k in s.rounds)if(s.rounds[k])n++;return n}
  function bar(x,y,w,p){var f=Math.max(0,Math.min(w,Math.floor(w*p)));h.setColor(3).fillRect(x,y,x+f,y+9);h.setColor(1).fillRect(x+f,y,x+w,y+9);h.setColor(2).drawRect(x,y,x+w,y+9)}
  function cl(v,a,b){return Math.max(a,Math.min(b,v))}
  function pp(){try{return typeof player!="undefined"&&player&&player.player?player.player:{}}catch(e){return {}}}
  function n(k,d){var v=parseInt(pp()[k],10);return isNaN(v)?d:v}
  function any(a,d){var p=pp(),i,v;for(i=0;i<a.length;i++){v=parseFloat(p[a[i]]);if(!isNaN(v))return v}return d}
  function lev(){var m=typeof NV!="undefined"&&NV?50:30;return cl(n("level",1),1,m)}
  function maxHp(){return Math.max(60,70+n("endurance",5)*10+lev()*5)}
  function hpPair(){var p=pp(),sum,m=maxHp();sum=(parseFloat(p.perceptioncondition)||100)+(parseFloat(p.endurancecondition)||100)+(parseFloat(p.leftattackcondition)||100)+(parseFloat(p.rightattackcondition)||100)+(parseFloat(p.rightmobilitycondition)||100)+(parseFloat(p.leftmobilitycondition)||100);return [Math.round(cl(sum/600,0,1)*m),m]}
  function apPair(){var m=any(["maxAP","maxap","MaxAP","maxActionPoints","actionPointsMax"],65+n("agility",5)*3),v=any(["ap","AP","actionpoints","actionPoints","ActionPoints"],m);m=Math.max(1,Math.round(m));return [cl(Math.round(v),0,m),m]}
  function radVal(){return cl(Math.round(any(["rad","rads","RAD","radiation","Radiation"],0)),0,100)}
  function pName(){var p=pp();return tx(p.name||p.nam||p.txt||"COURIER",18)}
  function rf(p){try{return fs.readFile(p)}catch(e){}try{return fs.readFileSync(p)}catch(e2){}return null}
  function playerPic(){if(pim!==0)return pim;try{pim=rf(B+"DATA/PLAYER_SPRITEDOWN.IMG")||rf(B+"DATA/PLAYER_SPRITE.IMG")||null}catch(e){pim=null}return pim}
  function drawPlayerPic(){var im=playerPic();if(im)try{h.setColor(3).drawImage(im,36,72,{scale:3});return}catch(e){try{h.drawImage(im,72,96);return}catch(e2){}}h.setFontAlign(0,-1);ft(1);h.setColor(2).drawString("PLAYER SPRITE",88,104);h.drawString("NOT FOUND",88,120)}
  function header(){
    var x=[24,126,216,306],i;
    h.setFontAlign(-1,-1);ft(2);
    for(i=0;i<tabs.length;i++){h.setColor(i==tab?3:2);h.drawString(tabs[i],x[i],5);if(i==tab){h.drawLine(x[i],29,x[i]+58,29);h.fillPoly([x[i]+28,34,x[i]+38,34,x[i]+33,28])}}
    h.setColor(2).drawLine(0,36,W-1,36);
  }
  function progressText(x,y){
    var s=st(),r=rounds(),e=s.encounters||0,d=s.deadLead||e;
    h.setFontAlign(-1,-1);ft(1);h.setColor(3).drawString("BIG IRON "+r+"/6",x,y);
    h.setColor(2).drawString("JUDGMENTS "+e+"/20",x,y+16);
    h.drawString("DEAD LEAD "+d+"/20",x,y+32);
    h.drawString(tx(arg.city||arg.map||"WASTELAND",23),x,y+48);
    h.setColor(3).drawString(s.rounds&&s.rounds.COURIER?"WEAPON READY":(s.forgeReady?"FORGE READY":"ROUND HUNT ACTIVE"),x,y+72);
  }
  function mapBox(x,y,w,hg){
    var i,px=x+Math.floor(w/2),py=y+Math.floor(hg/2);
    h.setColor(2).drawRect(x,y,x+w,y+hg);
    for(i=1;i<3;i++){h.drawLine(x+Math.floor(w*i/3),y,x+Math.floor(w*i/3),y+hg);h.drawLine(x,y+Math.floor(hg*i/3),x+w,y+Math.floor(hg*i/3))}
    h.setColor(1);
    for(i=0;i<18;i++)h.fillRect(x+8+(i*17)%w,y+8+(i*29)%hg,x+10+(i*17)%w,y+10+(i*29)%hg);
    h.setColor(3).fillPoly([px,py-10,px-8,py+10,px+8,py+10]);
  }
  function menu(){
    var a=actions[tab],i,y;
    h.setFontAlign(-1,-1);ft(1);
    for(i=0;i<a.length;i++){y=238+i*18;h.setColor(i==row?3:2);h.drawString((i==row?"> ":"  ")+a[i],284,y)}
  }
  function stat(){
    var hp=hpPair(),ap=apPair(),rv=radVal();
    h.setFontAlign(-1,-1);ft(1);h.setColor(3).drawString(pName()+"  LV "+lev(),14,48);
    drawPlayerPic();
    h.setColor(3).drawString("HP   "+hp[0]+"/"+hp[1],14,196);bar(14,214,148,hp[0]/hp[1]);
    h.drawString("AP   "+ap[0]+"/"+ap[1],14,236);bar(14,254,148,ap[0]/ap[1]);
    h.drawString("RAD  "+rv+"%",14,276);bar(14,294,148,rv/100);
    progressText(220,54);mapBox(208,158,154,112);menu();
  }
  function inv(){
    h.setFontAlign(-1,-1);ft(2);h.setColor(3).drawString("FIELD PACK",24,58);
    ft(1);h.setColor(2).drawString("USE HEALTH ITEMS BETWEEN FIGHTS",24,94);h.drawString("EQUIPPED WEAPON USES SNAPSHOT",24,116);h.drawString("SHOP BUYS USE PLAYER CAPS",24,138);progressText(24,176);menu();
  }
  function data(){
    h.setFontAlign(-1,-1);ft(2);h.setColor(3).drawString("QUESTS",250,54);
    ft(1);h.setColor(3).drawString("> FIND THE JUDGMENT ROUNDS",250,88);h.setColor(2).drawString("OPEN THE ROAD THROUGH SUNSCAR",250,108);h.drawString("FORGE THE COURIER'S ROUND",250,128);progressText(24,62);mapBox(24,162,160,120);menu();
  }
  function map(){
    h.setFontAlign(-1,-1);ft(2);h.setColor(3).drawString(tx(arg.city||arg.map||"WORLD MAP",18),24,54);mapBox(30,84,260,190);progressText(320,86);menu();
  }
  function draw(note){
    h.setClipRect(0,0,W-1,H-1);h.setColor(0).fillRect(0,0,W-1,H-1);header();
    if(tab==0)stat();else if(tab==1)inv();else if(tab==2)data();else map();
    ft(1);h.setFontAlign(0,-1);h.setColor(2).drawString(tx(note||msg||"TURN FOR TABS / SECOND WHEEL FOR OPTIONS",42),W/2,H-16);
    A.flip(0,H-1);
  }
  function back(){dead=1;A.world({map:arg.map,mode:arg.mode,x:arg.x,y:arg.y,facing:arg.facing,msg:msg})}
  function pick(){
    var a=actions[tab][row];
    if(a=="RESUME"){back();return}
    if(a=="SAVE LOCATION"){msg="GAME SAVED";draw(msg);return}
    if(a=="FIELD PACK"){dead=1;A.inventory?A.inventory({map:arg.map,mode:arg.mode,x:arg.x,y:arg.y,facing:arg.facing}):(dead=0,draw("ITEMS UNAVAILABLE"));return}
    if(a=="EXIT GAME"){dead=1;A.exit();return}
    draw(a);
  }
  function k1(v,l){if(dead)return;if(v===0){if(!l)pick();return}tab=(tab+(v<0?-1:1)+tabs.length)%tabs.length;row=0;draw()}
  function k2(v){if(v&&!dead){var a=actions[tab];row=(row+(v<0?-1:1)+a.length)%a.length;draw()}}
  draw(msg);
  return{k1:k1,k2:k2,remove:function(){dead=1;pim=0;A.gc()}}
})