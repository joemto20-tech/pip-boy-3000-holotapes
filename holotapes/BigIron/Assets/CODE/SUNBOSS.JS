(function(A,arg){
var B=A.base,W=A.w,H=A.h,T=192,N="THE SUN KING",LV=9,MAX=140,bhp=140;
var php=100,pm=100,st=0,sel=0,msg="THE SUN KING DESCENDS",busy=1,dead=0,pause=-1;
var EQ={weapon:"FISTS",armor:"NO ARMOR",dt:0,dmg:10,type:"MELEE"};
var frames=0,frame=0,cur=0,animTimer=0,idleTimer=0,waitTimer=0,pressTimer=0;
var playerImg=0,fx="",fxn=0,bossOff=0,playerOff=0,phase2=0,nextAtk="",guarded=0,disrupted=0;
var ST=86377,XP=85;

function cl(v,a,b){return v<a?a:v>b?b:v;}
function ft(n){try{h.setFont("6x8",n||1);}catch(e){}}
function tx(s,n){s=s==null?"":s.toString();return n&&s.length>n?s.substr(0,n-1)+"~":s;}
function pp(){try{return typeof player!="undefined"&&player&&player.player?player.player:{};}catch(e){return {};}}
function stat(n,d){var v=parseInt(pp()[n],10);return isNaN(v)?d:v;}
function level(){return cl(stat("level",1),1,NV?50:30);}
function maxhp(){return Math.max(60,70+stat("endurance",5)*10+level()*5);}
function hpRead(){
  var p=pp(),i,o,r=1,sum=0,K="perceptioncondition,endurancecondition,leftattackcondition,rightattackcondition,rightmobilitycondition,leftmobilitycondition".split(",");
  pm=maxhp();
  try{if(player&&player.getinfo)o=player.getinfo(false);}catch(e){}
  if(o){if(o.maxHP!==undefined)pm=parseInt(o.maxHP,10)||pm;if(o.hp!==undefined)r=parseFloat(o.hp);}
  else{for(i=0;i<6;i++){var c=parseFloat(p[K[i]]);sum+=isNaN(c)?100:cl(c,0,100);}r=sum/600;}
  if(isNaN(r))r=1;
  php=cl(Math.round(cl(r,0,1)*pm),0,pm);
  return K;
}
function hpChange(d,syncNow){
  var p=pp(),K=hpRead(),i,n=d*100/pm,v;
  for(i=0;i<6;i++){v=parseFloat(p[K[i]]);if(isNaN(v))v=100;p[K[i]]=cl(Math.round(v+n),0,100);}
  try{if(player){player.modified=true;if(syncNow&&player.sync)player.sync();}}catch(e){}
  hpRead();
}
function sync(){try{if(player){player.modified=true;if(player.sync)player.sync();}}catch(e){}}
function aidPath(){return"INV/"+(NV?"NV":"F3")+"/AID.INV";}
function stimRead(){
  var a=0,i=-1,o=0,n=0;
  try{a=new InvFile(aidPath());i=a.indexOf(parseInt(ST,10)||ST);if(i>=0){o=a.get(i);n=parseInt(o&&o.cnt,10)||0;}}catch(e){}
  st=Math.max(0,n);return st;
}
function stimUse(){
  var a=0,i=-1,o,c;
  try{
    a=new InvFile(aidPath());i=a.indexOf(parseInt(ST,10)||ST);
    if(i<0){st=0;return 0;}
    o=a.get(i);c=parseInt(o&&o.cnt,10)||0;
    if(c<1){st=0;return 0;}
    if(c<=1)a.remove(i);else{o.cnt=c-1;a.set(i,o);}
    a.sync();st=Math.max(0,c-1);return 1;
  }catch(e){st=0;return 0;}
}
function heal(){return Math.max(25,Math.round(pm*.35));}
function equip(){
  var e=0;try{if(A.equip)e=A.equip();}catch(x){}
  EQ=e||EQ;return EQ;
}
function defense(){return Math.max(stat("dt",0),EQ.dt||0);}
function exists(p){try{return!!fs.statSync(p);}catch(e){return 0;}}
function readText(p){try{return fs.readFile(p);}catch(e){}try{return fs.readFileSync(p);}catch(e2){}return null;}
function writeText(p,d){try{if(fs.writeFileSync){fs.writeFileSync(p,d);return 1;}}catch(e){}try{if(fs.writeFile){fs.writeFile(p,d);return 1;}}catch(e2){}return 0;}
function readState(){
  var p=pp(),a=0,b=0;
  if(p&&p.wb&&p.wb.map)return p.wb;
  try{a=JSON.parse(readText(B+"SAVE/STATE.JSON")||"{}");}catch(e){}
  try{b=JSON.parse(readText(B+"STATE.JSON")||"{}");}catch(e2){}
  if(b&&b.map&&(!a||!a.map))return b;
  if(a&&a.map)return a;
  return a||b||{};
}
function writeState(s){
  var p,d=JSON.stringify(s);
  try{if(typeof player!="undefined"&&player&&player.player)p=player.player;}catch(e){}
  if(p)p.wb={map:s.map,mode:s.mode,x:s.x,y:s.y,facing:s.facing,cleared:s.cleared||{},story:s.story||{}};
  writeText(B+"SAVE/STATE.JSON",d)||writeText(B+"STATE.JSON",d);
}
function roundName(r){return r=="SCORCHED"?"SCORCHED ROUND":(r?r+" ROUND":"DEAD MAN'S LEAD");}
function saveWorld(clear){
  var s=readState(),story,first=0;
  if(!s)s={};if(!s.cleared)s.cleared={};if(!s.story)s.story={};if(!s.story.rounds)s.story.rounds={};
  s.map=arg.map;s.mode=arg.mode||"tile";s.x=arg.x;s.y=arg.y;s.facing=arg.facing;
  if(clear&&arg.once&&arg.interact&&!s.cleared[arg.interact]){s.cleared[arg.interact]=1;first=1;}
  if(clear&&first){
    story=s.story;story.encounters=(story.encounters||0)+1;story.deadLead=story.encounters;
    if(arg.bullet)story.rounds[arg.bullet]=1;
    if(story.encounters>=20)story.forgeReady=1;
  }
  writeState(s);
}
function award(){return arg.bullet?roundName(arg.bullet)+" LOADED":"DEAD MAN'S LEAD +1";}
function addXP(){
  var p=pp(),n=XP,m=NV?50:30,l=0;
  p.xp=(parseInt(p.xp,10)||0)+n;
  if(!p.nextLevelXp)p.nextLevelXp=100+(parseInt(p.level,10)||1)*75+Math.floor((parseInt(p.level,10)||1)*(parseInt(p.level,10)||1)*12);
  while((parseInt(p.level,10)||1)<m&&p.xp>=p.nextLevelXp){
    p.xp-=p.nextLevelXp;p.level=(parseInt(p.level,10)||1)+1;
    p.nextLevelXp=100+p.level*75+Math.floor(p.level*p.level*12);l++;
  }
  sync();return"+"+n+"XP "+award()+(l?" LV "+p.level:"");
}

function img(n){
  var p=B+"DATA/SUNKING/"+n+".IMG",v=0;
  try{if(A.readImage)v=A.readImage(p);}catch(e){}
  if(!v)try{if(typeof readImage!="undefined")v=readImage(p);}catch(e2){}
  return v||0;
}
function clearAnim(){
  if(animTimer){clearTimeout(animTimer);animTimer=0;}
  if(idleTimer){clearInterval(idleTimer);idleTimer=0;}
  frames=0;cur=0;frame=0;
  try{A.gc();}catch(e){}
}
function load(prefix,count){
  var a=[],i,v;
  for(i=0;i<count;i++){v=img(prefix+"_"+i);if(v)a.push(v);}
  frames=a.length?a:[0];frame=0;cur=frames[0];
}
function ground(){
  h.setColor(1).drawLine(0,172,W-1,172);
  h.drawLine(18,180,166,180);h.drawLine(300,180,466,180);
  h.setColor(2).drawLine(18,181,166,181);h.drawLine(300,181,466,181);
}
function fallbackBoss(){
  var x=365+bossOff,y=47;
  h.setColor(2).fillRect(x-16,y+25,x+16,y+85);
  h.setColor(1).fillRect(x-10,y+6,x+10,y+28);
  h.setColor(3).drawCircle(x,y,20);
  h.drawLine(x,y-27,x,y-20);h.drawLine(x-27,y,x-20,y);h.drawLine(x+20,y,x+27,y);
  h.fillCircle(x,y+45,5);
}
function drawPlayer(){
  var x=45+playerOff,y=101;
  if(playerImg){try{h.setColor(3).drawImage(playerImg,x,y,{scale:2});return;}catch(e){}}
  h.setColor(2).fillRect(x+18,y+12,x+42,y+54);
  h.setColor(3).drawRect(x+15,y+7,x+37,y+29);
  h.drawLine(x+39,y+29,x+56,y+25);
}
function effects(){
  var x;
  if(fx=="BULLET"){
    x=110+fxn*44;
    h.setColor(3).fillRect(x,121,x+9,124);
    h.setColor(2).drawLine(x-7,122,x-1,122);
  }else if(fx=="CROWN"){
    x=110+fxn*44;
    h.setColor(3).fillRect(x,99-fxn*7,x+8,102-fxn*7);
    h.setColor(2).drawLine(x-6,101-fxn*7,x-1,101-fxn*7);
  }else if(fx=="BEAM"){
    h.setColor(1).fillPoly([92,126,341,78-fxn*2,341,91+fxn*2,92,139]);
    h.setColor(3).drawLine(92,130,341,84);
    if(fxn>0)h.setColor(2).drawLine(92,136,341,91);
  }else if(fx=="SUNSPOT"){
    h.setColor(fxn%2?3:2).drawCircle(77,164,10+fxn*5);
    h.drawLine(77,143-fxn*3,77,154);h.drawLine(55-fxn*3,164,67,164);
    h.drawLine(87,164,99+fxn*3,164);
  }else if(fx=="FLASH"){
    if(fxn%2)h.setColor(3).fillRect(0,0,W-1,T-1);
  }else if(fx=="STAFF"){
    h.setColor(3).drawLine(315-fxn*34,96+fxn*10,344,76);
  }
}
function top(){
  if(dead)return;
  h.setClipRect(0,0,W-1,T-1);
  h.setColor(0).fillRect(0,0,W-1,T-1);
  h.setFontAlign(-1,-1);ft(1);h.setColor(2).drawString(phase2?"CROWN: OVERDRIVE":"CROWN: STABLE",8,8);
  h.setFontAlign(1,-1);h.drawString("SOLAR THRONE",W-8,8);
  ground();
  drawPlayer();
  if(cur){
    try{h.setColor(3).drawImage(cur,331+bossOff,34,{scale:2});}
    catch(e){fallbackBoss();}
  }else fallbackBoss();
  effects();
  h.setClipRect(0,0,W-1,H-1);
  A.flip(0,T-1);
}
function bar(x,y,w,v,m){
  var p=m>0?cl(v/m,0,1):0;
  h.setColor(2).drawRect(x,y,x+w,y+7);
  h.setColor(1).fillRect(x+2,y+2,x+w-2,y+5);
  if(p)h.setColor(3).fillRect(x+2,y+2,x+2+Math.floor((w-4)*p),y+5);
}
function hint(){
  if(nextAtk=="LANCE")return"THE CROWN FOCUSES";
  if(nextAtk=="SUNSPOT")return"THE FLOOR GLOWS";
  return"THE SCEPTER RISES";
}
function hud(){
  var names=["FIRE","CROWN SHOT","DEFEND","STIMPAK"],i,x,y,ok=!busy&&pause<0;
  h.setClipRect(0,T,W-1,H-1);
  h.setColor(0).fillRect(0,T,W-1,H-1);
  h.setColor(2).drawLine(0,T,W-1,T);
  h.setFontAlign(-1,-1);ft(1);h.setColor(3);
  h.drawString(tx(pp().name||"WANDERER",15)+" LV"+level(),8,196);
  h.drawString(N+" LV"+LV,250,196);
  bar(8,210,210,php,pm);bar(250,210,222,bhp,MAX);
  h.setColor(2).drawString("HP "+php+"/"+pm+" DT "+defense(),8,220);
  h.drawString("HP "+bhp+"/"+MAX,250,220);
  h.setFontAlign(0,-1);h.setColor(3).drawString(tx(msg||hint(),55),W/2,231);
  for(i=0;i<4;i++){
    x=6+(i%2)*237;y=247+Math.floor(i/2)*35;
    if(ok&&i==sel){h.setColor(2).fillRect(x,y,x+231,y+31);h.setColor(0);}
    else{h.setColor(2).drawRect(x,y,x+231,y+31);h.setColor(3);}
    h.setFontAlign(-1,-1);ft(1);
    h.drawString((ok&&i==sel?"> ":"  ")+names[i],x+6,y+5);
    if(i==0)h.drawString("DMG "+Math.max(6,EQ.dmg||10),x+124,y+5);
    else if(i==1)h.drawString("BREAK SOLAR",x+124,y+5);
    else if(i==2)h.drawString("HALF DAMAGE",x+124,y+5);
    else h.drawString("HEAL "+heal()+" x"+st,x+124,y+5);
  }
  h.setClipRect(0,0,W-1,H-1);
  A.flip(T,H-1);
}
function pickAttack(){
  var r=Math.random();
  if(phase2)return r<.45?"LANCE":r<.72?"SUNSPOT":"STAFF";
  return r<.25?"LANCE":r<.55?"SUNSPOT":"STAFF";
}
function startIdle(){
  clearAnim();load("IDLE",2);cur=frames[0];top();
  idleTimer=setInterval(function(){
    if(dead||busy||pause>=0)return;
    frame=(frame+1)%frames.length;cur=frames[frame];top();
  },320);
}
function play(prefix,count,speed,effect,done){
  clearAnim();busy=1;load(prefix,count);fx=effect||"";fxn=0;
  function tick(){
    if(dead)return;
    cur=frames[Math.min(frame,frames.length-1)]||0;
    fxn=frame;bossOff=fx=="STAFF"?-frame*13:fx=="HIT"?(frame%2?4:-4):0;
    top();frame++;
    if(frame<count)animTimer=setTimeout(tick,speed);
    else{
      animTimer=0;fx="";fxn=0;bossOff=0;frames=0;cur=0;
      try{A.gc();}catch(e){}
      if(done)done();
    }
  }
  tick();
}
function wait(f,n){if(waitTimer)clearTimeout(waitTimer);waitTimer=setTimeout(function(){waitTimer=0;if(!dead)f();},n);}
function menu(){
  if(dead)return;
  busy=0;guarded=0;disrupted=0;nextAtk=pickAttack();msg=hint();startIdle();hud();
}
function enemyDamage(base,label){
  var dodge=.03+stat("agility",5)*.01,d;
  if(Math.random()<dodge){msg=(pp().name||"WANDERER")+" DODGED";hud();wait(menu,400);return;}
  d=Math.max(1,base+Math.floor(LV*.35)-Math.floor(defense()*.75+stat("endurance",5)*.2));
  if(guarded)d=Math.max(1,Math.floor(d*.5));
  if(disrupted)d=Math.max(1,Math.floor(d*.45));
  hpChange(-d,0);msg=label+" DEALT "+d;hud();
  if(php<=0){sync();wait(function(){result(0);},600);}else wait(menu,500);
}
function enemyTurn(){
  var a=nextAtk||pickAttack();nextAtk="";
  busy=1;hud();
  if(a=="STAFF"){
    msg=N+" USED BURNING SCEPTER";hud();
    play("STAFF",3,120,"STAFF",function(){enemyDamage(13,"BURNING SCEPTER");});
  }else if(a=="SUNSPOT"){
    msg=N+" MARKED A SUNSPOT";hud();
    play("CHARGE",3,150,"SUNSPOT",function(){
      play("BLAST",3,110,"SUNSPOT",function(){enemyDamage(16,"SUNSPOT");});
    });
  }else{
    msg=N+" USED CROWN LANCE";hud();
    play("CHARGE",3,150,"FLASH",function(){
      play("BLAST",3,105,"BEAM",function(){enemyDamage(phase2?23:19,"CROWN LANCE");});
    });
  }
}
function bossHit(d,crown){
  bhp=cl(bhp-d,0,MAX);
  msg=crown?"THE CROWN TOOK "+d:"THE SUN KING TOOK "+d;
  hud();
  if(bhp<=0){
    play("DEFEAT",5,190,"FLASH",function(){result(1);});
    return;
  }
  play("HIT",2,110,"HIT",function(){
    if(!phase2&&bhp<=Math.floor(MAX*.5)){
      phase2=1;msg="THE FALSE SUN ERUPTS";hud();
      play("PHASE",3,210,"FLASH",function(){nextAtk="LANCE";enemyTurn();});
    }else enemyTurn();
  });
}
function playerAttack(crown){
  var base=Math.max(6,Math.floor(EQ.dmg||10)),hit=1,dmg;
  busy=1;clearAnim();load("IDLE",2);cur=frames[0];
  if(crown){
    hit=Math.random()<(phase2?.68:.8);
    disrupted=hit&&nextAtk!="STAFF"?1:0;
    dmg=Math.max(5,Math.floor(base*.8)+5+(disrupted?3:0));
    msg=(pp().name||"WANDERER")+" FIRED AT THE CROWN";
    fx="CROWN";
  }else{
    dmg=Math.max(5,base-2+Math.floor(Math.random()*5));
    msg=(pp().name||"WANDERER")+" FIRED "+tx(EQ.weapon,16);
    fx="BULLET";
  }
  hud();
  frame=0;
  function bullet(){
    if(dead)return;
    cur=frames[frame%frames.length]||0;fxn=frame;playerOff=frame==0?-3:0;top();frame++;
    if(frame<6)animTimer=setTimeout(bullet,70);
    else{
      animTimer=0;fx="";fxn=0;playerOff=0;frames=0;cur=0;
      if(!hit){msg="CROWN SHOT MISSED";hud();wait(enemyTurn,350);}
      else bossHit(dmg,crown);
    }
  }
  bullet();
}
function act(){
  var old;
  if(busy||pause>=0)return;
  clearAnim();busy=1;
  if(sel==0){playerAttack(0);return;}
  if(sel==1){playerAttack(1);return;}
  if(sel==2){
    guarded=1;msg=(pp().name||"WANDERER")+" BRACED";top();hud();wait(enemyTurn,350);return;
  }
  hpRead();
  if(php>=pm){busy=0;msg="HP ALREADY FULL";startIdle();hud();return;}
  if(!stimUse()){busy=0;msg="NO STIMPAKS";startIdle();hud();return;}
  old=php;hpChange(heal(),1);msg="STIMPAK RESTORED "+(php-old)+" HP";top();hud();wait(enemyTurn,450);
}
function result(win){
  var s=win?addXP():"NO XP - TRY AGAIN",m=arg.map,x=arg.x,y=arg.y,f=arg.facing;
  dead=1;clearAnim();if(waitTimer)clearTimeout(waitTimer);if(pressTimer)clearTimeout(pressTimer);
  saveWorld(win);sync();
  h.setClipRect(0,0,W-1,H-1);h.setColor(0).fillRect(0,0,W-1,H-1);
  h.setColor(2).drawRect(10,10,W-11,H-11);h.setFontAlign(0,0);
  ft(4);h.setColor(3).drawString(win?"SUN SET":"DEFEAT",W/2,88);
  ft(2);h.drawString(tx(s,34),W/2,143);
  ft(1);h.setColor(2).drawString(win?"THE SCORCHED ROUND IS YOURS":"RETURNING TO THE WASTES",W/2,184);
  h.drawString("RETURNING TO MAP",W/2,220);A.flip(0,H-1);
  frames=0;playerImg=0;try{A.gc();}catch(e){}
  setTimeout(function(){A.world({map:m,x:x,y:y,facing:f,msg:win?s:"THE SUN STILL BURNS"});},1150);
}
function pauseDraw(note){
  var o=["RESUME","SAVE LOCATION","EXIT GAME"],i,y;
  clearAnim();h.setColor(0).fillRect(0,0,W-1,H-1);h.setColor(2).drawRect(26,20,W-27,H-21);h.drawRect(32,26,W-33,H-27);
  h.setFontAlign(0,0);ft(4);h.setColor(3).drawString("PAUSED",W/2,52);ft(1);h.setColor(2).drawString("SUN KING BATTLE",W/2,86);
  for(i=0;i<3;i++){y=126+i*46;if(i==pause){h.setColor(2).fillRect(92,y-16,W-93,y+16);h.setColor(0);}else{h.setColor(2).drawRect(92,y-16,W-93,y+16);h.setColor(3);}ft(2);h.drawString((i==pause?"> ":"")+o[i],W/2,y);}
  ft(1);h.setColor(2).drawString(note||"TURN WHEEL / PRESS TO SELECT",W/2,286);h.flip();
}
function openPause(){if(busy)return;pause=0;pauseDraw();}
function press(){
  if(pause>=0){
    if(pause==0){pause=-1;menu();}
    else if(pause==1){saveWorld(0);pauseDraw("GAME SAVED");}
    else{saveWorld(0);A.exit();}
    return;
  }
  act();
}
function click(){
  if(pressTimer){clearTimeout(pressTimer);pressTimer=0;openPause();}
  else pressTimer=setTimeout(function(){pressTimer=0;if(!dead)press();},250);
}
function k1(v,l){
  if(dead)return;
  if(v===0){if(l){if(pressTimer){clearTimeout(pressTimer);pressTimer=0;}return;}click();return;}
  if(pressTimer){clearTimeout(pressTimer);pressTimer=0;}
  if(pause>=0){pause=(pause+(v<0?-1:1)+3)%3;pauseDraw();}
  else if(!busy){sel=(sel+(v<0?-1:1)+4)%4;hud();}
}
function k2(v){
  if(!v||dead)return;
  if(pause>=0){pause=(pause+(v<0?-1:1)+3)%3;pauseDraw();}
  else if(!busy){sel=(sel+(v<0?-1:1)+4)%4;hud();}
}
function remove(){
  dead=1;clearAnim();
  if(waitTimer)clearTimeout(waitTimer);if(pressTimer)clearTimeout(pressTimer);
  waitTimer=pressTimer=0;frames=0;playerImg=0;EQ=0;
  try{A.gc();}catch(e){}
}

try{playerImg=typeof readImage!="undefined"?readImage(B+"DATA/PLAYER_SPRITER.IMG"):0;}catch(e){}
hpRead();stimRead();equip();
if(arg.music&&A.music)A.music(arg.music);
hud();
play("PHASE",3,180,"FLASH",function(){menu();});
return{k1:k1,k2:k2,save:function(){saveWorld(0);},remove:remove};
})
