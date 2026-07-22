(function(A,arg){
var B=A.base||"",W=A.w,H=A.h,tab=0,row=0,dead=0,mapIm=0,guyIm=0,fi=0,msg="";
var T=["STAT","INV","DATA","MAP"],K=["perceptioncondition","endurancecondition","leftattackcondition","rightattackcondition","rightmobilitycondition","leftmobilitycondition"];
var ID=[86377,86375,86376,831580],NM=["STIMPAK","RADAWAY","RAD-X","DOCTOR'S BAG"],CT=[0,0,0,0];
var S={weapon:"FISTS",dmg:6,type:"MELEE",rounds:0,enc:0,deadLead:0,status:"INCOMPLETE"};
function ft(n){try{h.setFont("6x8",n||1)}catch(e){}}
function tx(s,n){s=s==null?"":String(s);return n&&s.length>n?s.substr(0,n-1)+"~":s}
function cl(v,a,b){return v<a?a:v>b?b:v}
function pp(){try{return player&&player.player?player.player:{}}catch(e){return{}}}
function nv(){try{return typeof NV!="undefined"&&NV}catch(e){return 0}}
function ip(){return"INV/"+(nv()?"NV":"F3")+"/AID.INV"}
function close(f){try{if(f&&f.close)f.close()}catch(e){}}
function sync(){try{player.modified=true;if(player.sync)player.sync()}catch(e){}}
function num(k,d){var v=parseInt(pp()[k],10);return isNaN(v)?d:v}
function any(a,d){var p=pp(),i,v;for(i=0;i<a.length;i++){v=parseFloat(p[a[i]]);if(!isNaN(v))return v}return d}
function story(){var s=arg.story||{};s.rounds=s.rounds||{};return s}
function rounds(s){var r=s.rounds||{},n=0,k;for(k in r)if(r[k])n++;return n}
function level(){return cl(num("level",1),1,nv()?50:30)}
function maxHp(){return Math.max(60,70+num("endurance",5)*10+level()*5)}
function hp(){var q=pp(),m=maxHp(),i,v,n=0;for(i=0;i<6;i++){v=parseFloat(q[K[i]]);n+=isNaN(v)?100:cl(v,0,100)}return[Math.round(cl(n/600,0,1)*m),m]}
function ap(){var m=any(["maxAP","maxap","MaxAP","maxActionPoints","actionPointsMax"],65+num("agility",5)*3),v=any(["ap","AP","actionpoints","actionPoints","ActionPoints"],m);m=Math.max(1,Math.round(m));return[cl(Math.round(v),0,m),m]}
function rad(){return cl(Math.round(any(["rad","rads","RAD","radiation","Radiation"],0)),0,100)}
function setRad(v){var q=pp();v=cl(Math.round(v),0,100);if(q.rad!==undefined)q.rad=v;else q.rads=v;sync()}
function readAid(){var f=0,i,o,j;for(j=0;j<4;j++)CT[j]=0;try{f=new InvFile(ip());for(j=0;j<4;j++){i=f.indexOf(ID[j]);if(i>=0){o=f.get(i);CT[j]=Math.max(0,parseInt(o&&o.cnt,10)||0)}}}catch(e){}finally{close(f)}}
function take(j){var f=0,i,o,c,ok=0;try{f=new InvFile(ip());i=f.indexOf(ID[j]);if(i<0)return 0;o=f.get(i)||{};c=parseInt(o.cnt,10)||0;if(c<1)return 0;if(c<2)f.remove(i);else{o.cnt=c-1;f.set(i,o)}if(f.sync)f.sync();CT[j]=c-1;ok=1}catch(e){ok=0}finally{close(f)}return ok}
function capture(){var q=0,s=story();try{q=A.equip?A.equip():0}catch(e){q=0}if(q){S.weapon=tx(q.weapon||"FISTS",22);S.dmg=Math.max(1,parseInt(q.dmg,10)||6);S.type=tx(q.type||"MELEE",12)}S.rounds=rounds(s);S.enc=parseInt(s.encounters,10)||0;S.deadLead=parseInt(s.deadLead,10)||S.enc;S.status=s.rounds&&s.rounds.COURIER?"WEAPON READY":(s.forgeReady?"FORGE READY":"INCOMPLETE");readAid()}
function heal(n){var q=pp(),m=maxHp(),i,v,d=n*100/m;for(i=0;i<6;i++){v=parseFloat(q[K[i]]);if(isNaN(v))v=100;q[K[i]]=cl(Math.round(v+d),0,100)}sync()}
function useAid(){var q=pp(),x=hp(),r=rad(),i,v,w;if(CT[row]<1){msg="NONE LEFT";draw();return}
 if(row==0){if(x[0]>=x[1]){msg="HP ALREADY FULL";draw();return}if(!take(row)){msg="USE FAILED";draw();return}heal(Math.max(25,Math.round(x[1]*.35)));msg="STIMPAK USED"}
 else if(row==1){if(r<1){msg="NO RADIATION";draw();return}if(!take(row)){msg="USE FAILED";draw();return}setRad(r-25);msg="RADAWAY USED"}
 else if(row==2){if(!take(row)){msg="USE FAILED";draw();return}q.wb=q.wb||{};q.wb.rx=Math.max(parseInt(q.wb.rx,10)||0,6);sync();msg="RAD RESIST ACTIVE"}
 else{w=0;for(i=0;i<6;i++){v=parseFloat(q[K[i]]);if(!isNaN(v)&&v<100)w=1}if(!w){msg="LIMBS ARE HEALTHY";draw();return}if(!take(row)){msg="USE FAILED";draw();return}for(i=0;i<6;i++)q[K[i]]=100;sync();msg="LIMBS RESTORED"}
 draw()}
function rf(p){try{return fs.readFile(p)}catch(e){}return 0}
function asset(n){var q=rf(B+n),r;if(q)return q;if(B.indexOf("Assets/")>=0){r=B.substr(0,B.indexOf("Assets/"));q=rf(r+n);if(q)return q}return rf("HOLO/BIGIRON/"+n)}
function pimg(){if(guyIm)return guyIm;guyIm=rf(B+"DATA/PLAYER_SPRITEDOWN.IMG")||asset("DATA/PLAYER_SPRITEDOWN.IMG")||0;return guyIm}
function bar(x,y,w,p){var f=Math.max(0,Math.min(w,Math.floor(w*p)));h.setColor(3).fillRect(x,y,x+f,y+8);h.setColor(1).fillRect(x+f,y,x+w,y+8);h.setColor(2).drawRect(x,y,x+w,y+8)}
function head(){var x=[60,180,300,420],i;h.setFontAlign(0,-1);ft(2);for(i=0;i<4;i++){h.setColor(i==tab?3:2);h.drawString(T[i],x[i],5);if(i==tab)h.drawLine(x[i]-30,29,x[i]+30,29)}h.setColor(2).drawLine(0,36,W-1,36)}
function guy(){var im=pimg(),x=33,y=70;h.setColor(2).drawRect(29,58,139,185);if(im)try{h.setClipRect(30,59,138,184);h.setColor(3).drawImage(im,x-102,y,{scale:3});h.setClipRect(0,0,W-1,H-1);return}catch(e){try{h.setClipRect(0,0,W-1,H-1)}catch(e2){}}h.setColor(3).fillRect(74,76,94,96);h.drawLine(84,96,84,146);h.drawLine(60,112,108,112);h.drawLine(84,146,66,174);h.drawLine(84,146,102,174)}
function stat(){var x=hp(),a=ap(),r=rad();h.setFontAlign(-1,-1);ft(2);h.setColor(3).drawString(tx(pp().name||"COURIER",18)+"  LV "+level(),16,48);guy();ft(1);h.setColor(3).drawString("HP  "+x[0]+"/"+x[1],16,202);bar(16,220,160,x[0]/x[1]);h.drawString("AP  "+a[0]+"/"+a[1],16,242);bar(16,260,160,a[0]/a[1]);h.drawString("RAD "+r+"%",16,282);bar(16,300,160,r/100);h.setColor(3).drawString("BIG IRON "+S.rounds+"/6",236,66);h.setColor(2).drawString("JUDGMENTS "+S.enc+"/20",236,88);h.drawString("DEAD LEAD "+S.deadLead+"/20",236,110);h.setColor(3).drawString(S.status,236,142);h.setColor(2).drawString("CURRENT WEAPON",236,186);h.setColor(3).drawString(S.weapon,236,208);h.setColor(2).drawString("DMG "+S.dmg+"  "+S.type,236,228);actions(["RESUME","SAVE LOCATION","EXIT GAME"],254)}
function actions(a,y){var i;h.setFontAlign(-1,-1);ft(1);if(row>=a.length)row=0;for(i=0;i<a.length;i++){h.setColor(i==row?3:2);h.drawString((i==row?"> ":"  ")+a[i],286,y+i*18)}}
function inv(){var i,y;h.setFontAlign(-1,-1);ft(2);h.setColor(3).drawString("FIELD PACK",16,46);ft(1);h.setColor(2).drawString("CURRENT WEAPON",16,78);h.setColor(3).drawString(S.weapon,16,98);h.setColor(2).drawString("DMG "+S.dmg+"  "+S.type,16,116);h.setColor(3).drawString("BIG IRON "+S.rounds+"/6",300,78);h.setColor(2).drawString("JUDGMENTS "+S.enc+"/20",300,98);h.drawString(S.status,300,116);h.setColor(2).drawRect(14,142,W-15,292);h.setFontAlign(0,-1);h.setColor(3).drawString("AID ITEMS",W/2,151);for(i=0;i<4;i++){y=184+i*25;if(i==row){h.setColor(2).fillRect(44,y-4,W-45,y+17);h.setColor(0)}else h.setColor(3);h.setFontAlign(-1,-1);h.drawString((i==row?"> ":"  ")+NM[i],64,y);h.setFontAlign(1,-1);h.drawString("x"+CT[i],W-66,y)}h.setFontAlign(0,-1);h.setColor(2).drawString(msg||"USE SELECTED ITEM",W/2,300)}
function data(){h.setFontAlign(-1,-1);ft(2);h.setColor(3).drawString("QUEST DATA",18,48);ft(1);h.setColor(3).drawString("> FIND THE JUDGMENT ROUNDS",18,82);h.setColor(2).drawString("OPEN THE ROAD THROUGH SUNSCAR",18,104);h.drawString("FORGE THE COURIER'S ROUND",18,126);h.setColor(3).drawString("ROUNDS "+S.rounds+"/6",18,170);h.setColor(2).drawString("JUDGMENTS "+S.enc+"/20",18,192);h.drawString("DEAD LEAD "+S.deadLead+"/20",18,214);h.setColor(3).drawString(S.status,18,244);actions(["RESUME"],282)}
function map(){var im=mapIm||asset("M.IMG"),mx=14,my=58,px=parseInt(arg.x,10),py=parseInt(arg.y,10),a=["SUN KING'S MARKET","PAWN SHOP","TOWN HALL","DOC'S CLINIC","GUNS & AMMO","CRATER MOTEL"],i;mapIm=im||0;h.setFontAlign(-1,-1);ft(2);h.setColor(3).drawString("SUNSCAR FIELD MAP",16,42);h.setColor(2).drawRect(mx-2,my-2,mx+253,my+145);if(im)try{h.drawImage(im,mx,my,{scale:2})}catch(e){}if(isNaN(px)||px<100)px=704;if(isNaN(py)||py<100)py=255;px=mx+Math.floor(cl(px,0,1440)*252/1440);py=my+Math.floor(cl(py,0,1080)*144/1080);h.setColor(3).fillPoly([px,py-5,px-5,py+5,px+5,py+5]);h.setFontAlign(-1,-1);ft(1);h.setColor(3).drawString("LOCATIONS",286,54);for(i=0;i<a.length;i++){h.setColor(i<3?3:2);h.drawString((i<3?"> ":"  ")+a[i],286,78+i*18)}h.setColor(3).drawString("BIG IRON "+S.rounds+"/6",286,202);h.setColor(2).drawString("JUDGMENTS "+S.enc+"/20",286,220);h.drawString("SOUTH ROAD: LOCKED",286,244);actions(["RESUME"],282)}
function draw(){if(dead)return;h.setClipRect(0,0,W-1,H-1);h.setColor(0).fillRect(0,0,W-1,H-1);head();if(tab==0)stat();else if(tab==1)inv();else if(tab==2)data();else map()}
function frame(){if(dead)return;h.flip();Pip.lastFlip=getTime()}
function stop(){dead=1;if(fi)clearInterval(fi);fi=0}
function back(){stop();A.world({map:arg.map,mode:arg.mode,x:arg.x,y:arg.y,facing:arg.facing,msg:msg||arg.msg||""})}
function pick(){if(tab==1){useAid();return}if(tab==0){if(row==0)back();else if(row==1){msg="GAME SAVED";draw()}else{stop();A.exit()}}else back()}
function k1(v,l){if(dead)return;if(v===0){if(!l)pick();return}tab=(tab+(v<0?-1:1)+4)%4;row=0;msg="";draw()}
function k2(v){var n;if(dead||!v)return;n=tab==1?4:(tab==0?3:1);row=(row+(v<0?-1:1)+n)%n;msg="";draw()}
function remove(){stop();mapIm=guyIm=0;S=0;CT=0;try{A.gc()}catch(e){}}
capture();draw();frame();fi=setInterval(frame,40);return{k1:k1,k2:k2,remove:remove}
})
