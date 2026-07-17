(function(A,arg){
var W=A.w,H=A.h,sel=0,msg=arg.msg||"",dead=0;
var opts=["RESUME","SAVE LOCATION","PROGRESS","FIELD PACK","EXIT GAME"];
function ft(n){try{h.setFont("6x8",n||1)}catch(e){}}
function tx(s,n){s=s==null?"":s.toString();return n&&s.length>n?s.substr(0,n-1)+"~":s}
function st(){var s=arg.story||{};s.rounds=s.rounds||{};return s}
function rc(){var s=st(),n=0,k;for(k in s.rounds)if(s.rounds[k])n++;return n}
function progress(){
  var s=st(),r=rc(),e=s.encounters||0,d=s.deadLead||e;
  h.setColor(2).drawRect(246,112,W-42,248);h.setFontAlign(-1,-1);ft(1);
  h.setColor(3).drawString("BIG IRON "+r+"/6",256,122);
  h.setColor(2).drawString("JUDGMENTS "+e+"/20",256,140);
  h.drawString("DEAD LEAD "+d+"/20",256,156);
  h.drawString(tx("CITY "+(arg.city||arg.map||"WASTELAND"),25),256,174);
  if(s.rounds.COURIER)h.setColor(3).drawString("WEAPON READY",256,200);
  else if(s.forgeReady)h.setColor(3).drawString("FORGE READY",256,200);
  else h.setColor(2).drawString(e>=20?"FINAL ROUND READY":"KEEP RECORDING",256,200);
}
function draw(note){
  var i,y;
  h.setClipRect(0,0,W-1,H-1);h.setColor(0).fillRect(0,0,W-1,H-1);
  h.setColor(2).drawRect(26,20,W-27,H-21);h.drawRect(32,26,W-33,H-27);
  h.setFontAlign(0,0);ft(4);h.setColor(3).drawString("PAUSED",W/2,58);
  ft(1);h.setColor(2).drawString("BIG IRON",W/2,92);
  for(i=0;i<5;i++){y=112+i*34;if(i==sel){h.setColor(2).fillRect(58,y-14,226,y+14);h.setColor(0)}else{h.setColor(2).drawRect(58,y-14,226,y+14);h.setColor(3)}ft(2);h.drawString((i==sel?"> ":"")+opts[i],142,y)}
  if(sel==2)progress();
  ft(1);h.setColor(2).drawString(sel==2?"PROGRESS":tx(note||"TURN WHEEL / PRESS TO SELECT",34),W/2,286);
  A.flip(0,H-1);
}
function back(){dead=1;A.world({map:arg.map,mode:arg.mode,x:arg.x,y:arg.y,facing:arg.facing,msg:msg})}
function pick(){
  if(sel==0){back();return}
  if(sel==1){msg="GAME SAVED";draw(msg);return}
  if(sel==2){draw("PROGRESS");return}
  if(sel==3){dead=1;A.inventory?A.inventory({map:arg.map,mode:arg.mode,x:arg.x,y:arg.y,facing:arg.facing}):draw("ITEMS UNAVAILABLE");return}
  dead=1;A.exit();
}
function k1(v,l){if(dead)return;if(v===0){if(!l)pick();return}sel=(sel+(v<0?-1:1)+5)%5;draw()}
function k2(v){if(v&&!dead){sel=(sel+(v<0?-1:1)+5)%5;draw()}}
draw(msg);
return{k1:k1,k2:k2,remove:function(){dead=1;A.gc()}}
})
