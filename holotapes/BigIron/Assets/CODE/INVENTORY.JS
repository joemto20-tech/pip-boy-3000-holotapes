(function(A,arg){
var W=A.w,H=A.h,s=0,hp=0,mh=0,st=0,msg="",dead=0,ID=86377;
function cl(v,a,b){return v<a?a:v>b?b:v}
function ft(n){try{h.setFont("6x8",n||1)}catch(e){}}
function p(){try{return player&&player.player?player.player:{}}catch(e){return{}}}
function stat(k,d){var v=parseInt(p()[k],10);return isNaN(v)?d:v}
function lvl(){return cl(stat("level",1),1,NV?50:30)}
function max(){return Math.max(60,70+stat("endurance",5)*10+lvl()*5)}
function readHp(){
  var q=p(),k="perceptioncondition,endurancecondition,leftattackcondition,rightattackcondition,rightmobilitycondition,leftmobilitycondition".split(","),i,v,t=0;
  mh=max();
  for(i=0;i<6;i++){v=parseFloat(q[k[i]]);t+=isNaN(v)?100:cl(v,0,100)}
  hp=cl(Math.round(t/600*mh),0,mh);
  return k;
}
function writeHp(n){
  var q=p(),k=readHp(),i,v,d=n*100/mh;
  for(i=0;i<6;i++){v=parseFloat(q[k[i]]);if(isNaN(v))v=100;q[k[i]]=cl(Math.round(v+d),0,100)}
  try{player.modified=true;if(player.sync)player.sync()}catch(e){}
  readHp();
}
function aid(){return"INV/"+(NV?"NV":"F3")+"/AID.INV"}
function readStim(){
  var a,i,o;
  try{a=new InvFile(aid());i=a.indexOf(ID);if(i>=0){o=a.get(i);st=parseInt(o&&o.cnt,10)||0}else st=0}catch(e){st=0}
  return st;
}
function useStim(){
  var a,i,o,c;
  try{
    a=new InvFile(aid());i=a.indexOf(ID);if(i<0)return 0;
    o=a.get(i);c=parseInt(o&&o.cnt,10)||0;if(c<1)return 0;
    if(c<2)a.remove(i);else{o.cnt=c-1;a.set(i,o)}
    a.sync();st=c-1;return 1;
  }catch(e){return 0}
}
function save(){
  var q=p();
  try{q.wb=q.wb||{};q.wb.map=arg.map;q.wb.mode=arg.mode||"tile";q.wb.x=arg.x;q.wb.y=arg.y;q.wb.facing=arg.facing;player.modified=true;if(player.sync)player.sync()}catch(e){}
}
function back(){A.world({map:arg.map,mode:arg.mode||"tile",x:arg.x,y:arg.y,facing:arg.facing,msg:msg||"FIELD PACK CLOSED"})}
function heal(){return Math.max(25,Math.round(mh*.35))}
function draw(){
  var y,i,o=["RETURN","STIMPAK","SAVE"],n;
  readHp();readStim();n=heal();
  h.setClipRect(0,0,W-1,H-1);h.setColor(0).fillRect(0,0,W-1,H-1);
  h.setColor(2).drawRect(32,24,W-33,H-25);h.drawRect(38,30,W-39,H-31);
  h.setFontAlign(0,0);ft(4);h.setColor(3).drawString("FIELD PACK",W/2,62);
  ft(1);h.setColor(2);h.drawString("IN-GAME ITEMS",W/2,96);
  h.setFontAlign(-1,-1);h.setColor(3);h.drawString("HP "+hp+"/"+mh,72,122);
  h.setColor(2).drawRect(72,140,W-73,150);h.setColor(1).fillRect(74,142,W-75,148);
  if(hp)h.setColor(3).fillRect(74,142,74+Math.floor((W-150)*hp/mh),148);
  h.setColor(2);h.drawString("STIMPAKS "+st+"  HEAL "+n,72,164);
  h.setFontAlign(0,0);
  for(i=0;i<3;i++){
    y=204+i*34;
    if(i==s){h.setColor(2).fillRect(116,y-13,W-117,y+13);h.setColor(0)}else{h.setColor(2).drawRect(116,y-13,W-117,y+13);h.setColor(3)}
    ft(2);h.drawString((i==s?"> ":"")+o[i],W/2,y);
  }
  ft(1);h.setColor(2);h.drawString(msg||"TURN WHEEL / PRESS",W/2,294);A.flip(0,H-1);
}
function press(){
  if(s===0){save();back();return}
  if(s===2){save();msg="GAME SAVED";draw();return}
  readHp();
  if(hp>=mh){msg="HP ALREADY FULL";draw();return}
  if(!useStim()){msg="NO STIMPAKS";draw();return}
  writeHp(heal());msg="STIMPAK USED";draw();
}
function k1(v,l){if(dead)return;if(v===0){if(!l)press();return}s=(s+(v<0?-1:1)+3)%3;draw()}
function k2(v){if(v){s=(s+(v<0?-1:1)+3)%3;draw()}}
function remove(){dead=1;A.gc()}
draw();
return{k1:k1,k2:k2,save:save,remove:remove}
})
