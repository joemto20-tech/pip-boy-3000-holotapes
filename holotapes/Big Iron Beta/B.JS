(function(A,a){
var B=A.base,W=A.w,H=A.h,Y=192,P=0,e=0,eh=1,em=1,ph=1,pm=1,lv=1,sel=0,mode=0,busy=1,dead=0,msg="",eq=0,t=0,vt=0,cb=0,rad=0,rl=0,pt=0,pn="WANDERER";
var K=["perceptioncondition","endurancecondition","leftattackcondition","rightattackcondition","rightmobilitycondition","leftmobilitycondition"];
var V={x:0,y:0,repeat:false,debug:false};
var L=[{pin:LED_RED,target:0},{pin:LED_GREEN,target:0},{pin:LED_BLUE,target:0}];
function lim(v,n,x){return v<n?n:v>x?x:v;}
function p(){try{return player&&player.player?player.player:{};}catch(x){return {};}}
function n(k,d){var v=parseInt(p()[k],10);return isNaN(v)?d:v;}
function font(x){try{h.setFont("6x8",x||1);}catch(z){}}
function text(s,x){s=s==null?"":String(s);return s.length>x?s.substr(0,x-1)+"~":s;}
function fold(id){id=String(id||"").toUpperCase();return id=="RAIDER"?"RAIDER":id=="RADSCORPION"?"RADSCORPION":id=="SOLOMON_RAY"?"SOLOMON_RAY":"Granny";}
function vp(f){var d=f=="P_MOVE_1.avi"||f=="P_MOVE_2.avi"||f=="PLAYER_FAINT.avi"||f=="ENEMY_FAINT.avi"||f=="VICTORY.avi"||f=="DEFEAT.avi";return(d?B+"VIDEO/Granny/":(P||B+"VIDEO/Granny/"))+f;}
function blit(y1,y2){var o=Pip.blitOptions;if(!o){A.flip();return}o.y1=Math.max(0,y1|0);o.y2=Math.max(o.y1,Math.min(H-1,y2|0));try{h.flip();if(typeof getTime=="function")Pip.lastFlip=getTime()}finally{delete o.y1;delete o.y2}}
function sync(){try{player.modified=true;if(player.sync)player.sync();}catch(x){}}
function hp(){var q=p(),i,v,s=0;lv=lim(n("level",1),1,NV?50:30);pm=Math.max(60,70+n("endurance",5)*10+lv*5);for(i=0;i<6;i++){v=parseFloat(q[K[i]]);s+=isNaN(v)?100:lim(v,0,100);}ph=lim(Math.round(s/600*pm),0,pm);}
function hurt(d,save){var q=p(),i,v,z=d*100/pm;hp();for(i=0;i<6;i++){v=parseFloat(q[K[i]]);if(isNaN(v))v=100;q[K[i]]=lim(Math.round(v+z),0,100);}if(save)sync();hp();}
function enemy(id){var r;if(id instanceof Array)id=id[Math.floor(Math.random()*id.length)];id=String(id||"RANDOM").toUpperCase().replace(/ /g,"_");if(id=="RANDOM"){r=Math.floor(Math.random()*3);id=r? (r==1?"RAIDER":"RADSCORPION") : "RADROACH";}
if(id=="SOLOMON_RAY")e={id:id,name:"SOLOMON RAY",level:7,hp:135,xp:55,rad:3};
else if(id=="RAIDER")e={id:id,name:"RAIDER",level:5,hp:70,xp:32};
else if(id=="RADSCORPION")e={id:id,name:"RADSCORPION",level:10,hp:100,xp:45};
else if(id=="RADROACH")e={id:id,name:"RADROACH",level:4,hp:55,xp:24};
else e={id:"GRANNY",name:"GRANNY",level:6,hp:75,xp:35};
em=e.hp;eh=em;}
function light(r,g,b){try{var x=Pip.settings&&Pip.settings.brightness!==undefined?Pip.settings.brightness:1;L[0].target=r*x;L[1].target=g*x;L[2].target=b*x;Pip.fadeTo(L);}catch(z){}}
function radOff(){if(rad){clearTimeout(rad);rad=0;}rl=0;light(1,.5,0);}
function radTick(){var q,v,d=e.rad,x;if(dead||mode==3||!e.rad)return;rl=!rl;light(1,rl?0:.5,0);q=p();x=q.wb&&parseInt(q.wb.rx,10)||0;if(x>0){d=Math.max(1,d-2);q.wb.rx=x-1;}v=parseInt(q.rad!==undefined?q.rad:(q.rads||0),10)||0;if(q.rad!==undefined)q.rad=lim(v+d,0,100);else q.rads=lim(v+d,0,100);msg=(x>0?"RAD-X ":"SOLAR RADS ")+"+"+d;status();rad=setTimeout(radTick,4000);}
function bar(x,y,w,v,m){var q=lim(v/m,0,1);h.setColor(2).drawRect(x,y,x+w,y+7);h.setColor(1).fillRect(x+2,y+2,x+w-2,y+5);if(q)h.setColor(3).fillRect(x+2,y+2,x+2+Math.floor((w-4)*q),y+5);}
function heal(){return Math.max(25,Math.round(pm*.35));}
function menu(full){var i,x,m=eq&&eq.dmg?eq.dmg:6;h.setColor(0).fillRect(4,240,476,277);for(i=0;i<2;i++){x=5+i*158;if(mode==1&&i==sel){h.setColor(2).fillRect(x,241,x+154,276);h.setColor(0);}else{h.setColor(2).drawRect(x,241,x+154,276);h.setColor(3);}font(1);h.setFontAlign(-1,-1);h.drawString((mode==1&&i==sel?"> ":"  ")+(i?"STIMPAK":"ATTACK"),x+5,246);h.drawString(i?"HEAL "+heal():"DMG "+m,x+12,262);}h.setColor(2).drawRect(321,241,475,276);h.setColor(3).drawString(sel?"AID":"EQUIPPED",329,246);h.setColor(2).drawString(text(sel?"STIMPAK":eq.weapon,20),329,262);if(!full)blit(239,278);}
function status(noFlip){if(dead)return;try{h.setClipRect(0,Y,W-1,240);h.setColor(0).fillRect(0,Y,W-1,240);h.setColor(2).drawLine(0,Y,W-1,Y);font(1);h.setFontAlign(-1,-1);h.setColor(3).drawString(text(pn,14)+" LV"+lv,8,196);h.drawString(text(e.name,14)+" LV"+e.level,250,196);bar(8,210,210,ph,pm);bar(250,210,222,eh,em);h.setColor(2).drawString("HP "+ph+"/"+pm,8,220);h.drawString("HP "+eh+"/"+em,250,220);h.setFontAlign(0,-1);h.setColor(3).drawString(text(msg,54),W/2,230);h.setClipRect(0,0,W-1,H-1);if(!noFlip)blit(Y,240);}catch(z){}}
function draw(){status(1);menu(1);blit(Y,278);}
function stop(){try{Pip.removeListener("videoStopped",ended);}catch(z){}if(vt){clearTimeout(vt);vt=0;}cb=0;try{Pip.videoStop();}catch(z2){}}
function ended(){var f=cb;cb=0;if(vt){clearTimeout(vt);vt=0;}try{Pip.removeListener("videoStopped",ended);}catch(z){}if(f)f();}
function play(f,loop,next,ms){stop();cb=next||0;try{V.repeat=!!loop;if(!loop)Pip.on("videoStopped",ended);Pip.videoStart(vp(f),V);if(next)vt=setTimeout(ended,ms||1600);}catch(z){if(next)vt=setTimeout(ended,250);}}
function stim(){var q=0,i,o,c;try{q=new InvFile("INV/"+(NV?"NV":"F3")+"/AID.INV");i=q.indexOf(86377);if(i<0)return 0;o=q.get(i);c=parseInt(o&&o.cnt,10)||0;if(c<1)return 0;if(c==1)q.remove(i);else{o.cnt=c-1;q.set(i,o);}q.sync();return 1;}catch(z){return 0;}finally{try{if(q&&q.close)q.close();}catch(x){}q=o=0;}}
function idle(){mode=1;busy=0;msg="CHOOSE AN ACTION";play("BATTLE_IDLE.avi",1,0);draw();if(e.rad&&!rad)rad=setTimeout(radTick,750);}
function enemyTurn(){var i=Math.floor(Math.random()*4),pow,nm;if(i==0){pow=18;nm="STINGER"}else if(i==1){pow=21;nm="CLAW"}else if(i==2){pow=24;nm="RAD SPIT"}else{pow=15;nm="BURROW"}mode=2;msg=e.name+" USED "+nm;draw();play("E_MOVE_"+(i+1)+".avi",0,function(){var d=Math.max(1,pow+Math.floor(e.level*.4)-Math.floor((eq.dt||0)*.8));hurt(-d,0);msg="YOU TOOK "+d+" DAMAGE";status();if(ph<=0)play("PLAYER_FAINT.avi",0,function(){play("DEFEAT.avi",0,function(){finish(0);},8500);},3600);else t=setTimeout(idle,320);},1500);}
function save(win){var q=p(),s=q.wb||{};s.map="WORLD_01";s.mode="image";s.x=a.x;s.y=a.y;s.facing=a.facing||"up";s.cleared=s.cleared||{};s.story=s.story||{};if(win&&a.once&&a.interact&&!s.cleared[a.interact]){s.cleared[a.interact]=1;s.story.encounters=(s.story.encounters||0)+1;s.story.deadLead=s.story.encounters;if(a.bullet){s.story.rounds=s.story.rounds||{};s.story.rounds[a.bullet]=1;}}q.wb=s;sync();}
function finish(win){var q=p(),s;mode=3;busy=1;radOff();stop();if(win){q.xp=(parseInt(q.xp,10)||0)+(e.xp||0);sync();s="+"+e.xp+" XP";}else s="TRY AGAIN";save(win);h.setColor(0).fillRect(0,0,W-1,H-1);h.setColor(2).drawRect(10,10,W-11,H-11);h.setFontAlign(0,0);font(4);h.setColor(3).drawString(win?"VICTORY":"DEFEAT",W/2,70);font(2);h.drawString(s,W/2,126);font(1);h.setColor(2).drawString("RETURNING TO MAP",W/2,238);A.flip(0,H-1);a.map="WORLD_01";a.mode="image";a.msg=win?s+" SAVE RECOMMENDED":"TRY AGAIN";delete a.enemy;delete a.music;e=eq=0;msg="";if(A.returnWorld)A.returnWorld(a,700);else A.world(a);a=0;}
function act(){var d,old;if(busy||mode!=1)return;busy=1;mode=2;if(sel){hp();if(ph>=pm){busy=0;mode=1;msg="HP ALREADY FULL";status();return;}if(!stim()){busy=0;mode=1;msg="NO STIMPAKS";status();return;}old=ph;hurt(heal(),1);msg="HEALED "+(ph-old)+" HP";draw();t=setTimeout(enemyTurn,420);return;}d=Math.max(1,Math.floor(eq.dmg||6));msg="ATTACK DMG "+d;draw();play(eq.type=="MELEE"?"P_MOVE_2.avi":"P_MOVE_1.avi",0,function(){eh=lim(eh-d,0,em);msg=e.name+" TOOK "+d+" DAMAGE";status();if(eh<=0)play("ENEMY_FAINT.avi",0,function(){play("VICTORY.avi",0,function(){finish(1);},8500);},3600);else t=setTimeout(enemyTurn,320);},1500);}
function k1(v,l){var x=0;if(dead||v!==0||l)return;try{x=getTime();}catch(z){}if(x&&pt&&x-pt<.28)return;pt=x||pt+1;act();}
function k2(v){if(dead||!v||busy||mode!=1)return;sel=sel?0:1;menu(0);}
function boot(){if(dead||!a)return;enemy(a.enemy);P=B+"VIDEO/"+fold(e.id)+"/";hp();pn=text(p().name||"WANDERER",14);try{eq=A.equip();}catch(z){}if(!eq)eq={weapon:"FISTS",dmg:6,dt:0,type:"MELEE"};msg="A WILD "+e.name+" APPEARED";draw();play("BATTLE_START.avi",0,function(){t=setTimeout(idle,100);},7500);}
function remove(){dead=1;if(t)clearTimeout(t);if(rad)clearTimeout(rad);t=rad=0;stop();e=eq=a=0;msg="";}
t=setTimeout(boot,80);
return{k1:k1,k2:k2,save:function(){if(a)save(0);},remove:remove};
})
