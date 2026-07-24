(function(A,arg){
var W=A.w,H=A.h,B=A.base,dead=0,t=0,fi=0,px=7,py=8,nx=7,ny=2,sel=0,phase="walk",ni=0;
var title=arg.name||arg.room||"INTERIOR",enemy=arg.enemy||"RAIDER",msg="THE DOOR SHUTS",dlg=arg.dlg||"YOU READY?",ftxt=arg.ft||"FIGHT",fltxt=arg.fl||"FLEE";
function ft(n){try{h.setFont("6x8",n||1)}catch(e){}}
function tx(s,n){s=s==null?"":s.toString();return n&&s.length>n?s.substr(0,n-1)+"~":s}
function cell(x,y){return[60+x*24,38+y*18]}
function rd(p){try{return fs.readFile(p)}catch(e){return 0}}
function npcImg(){var n=arg.ns||arg.npcSprite;if(ni!==0)return ni||0;if(!n)return ni=null;n=n.toString().replace(/\.(JS|IMG)$/i,"");ni=rd(B+n+".IMG")||null;return ni||0}
function drawGuy(x,y,c,hat){
  var p=cell(x,y),a=p[0],b=p[1];
  h.setColor(c||3).fillRect(a+8,b+4,a+14,b+10);
  h.drawLine(a+11,b+10,a+11,b+20);
  h.drawLine(a+6,b+14,a+16,b+14);
  h.drawLine(a+11,b+20,a+6,b+26);
  h.drawLine(a+11,b+20,a+16,b+26);
  if(hat){h.drawLine(a+3,b+3,a+19,b+3);h.drawRect(a+7,b,a+15,b+3)}
}
function drawNpc(x,y){var p=cell(x,y),im=npcImg();if(im)try{h.setColor(3).drawImage(im,p[0]-5,p[1]-6);return}catch(e){}drawGuy(x,y,2,0)}
function top(){
  var x,y,p;
  h.setClipRect(0,0,W-1,240);
  h.setColor(0).fillRect(0,0,W-1,240);
  h.setFontAlign(0,0);
  ft(2);h.setColor(3).drawString(tx(title,24),W/2,18);
  h.setColor(2).drawRect(42,32,W-43,230);
  h.drawRect(48,38,W-49,224);
  for(y=0;y<10;y++)for(x=0;x<15;x++){p=cell(x,y);h.setColor((x+y)&1?1:0).fillRect(p[0],p[1],p[0]+23,p[1]+17)}
  h.setColor(2).drawRect(62,54,128,92);
  h.drawRect(W-136,54,W-70,92);
  h.drawLine(60,190,W-61,190);
  drawGuy(px,py,3,1);
  drawNpc(nx,ny);
}
function bottom(){
  h.setClipRect(0,241,W-1,H-1);
  h.setColor(0).fillRect(0,241,W-1,H-1);
  h.setColor(2).drawRect(18,246,W-19,H-19);
  h.setFontAlign(0,0);
  ft(2);h.setColor(3).drawString(tx(msg,34),W/2,272);
  ft(1);h.setColor(2).drawString(phase=="choice"?((sel?ftxt:"> "+ftxt)+"     "+(sel?"> "+fltxt:fltxt)):"PRESS TO SKIP",W/2,300);
  h.setClipRect(0,0,W-1,H-1);
}
function draw(){top();bottom()}
function frame(){if(dead)return;h.flip();Pip.lastFlip=getTime()}
function start(){
  var q;
  if(dead)return;
  dead=1;
  if(t)clearTimeout(t);
  if(fi)clearInterval(fi);
  t=fi=0;
  q={enemy:enemy,map:"WORLD_01",mode:"tile",x:arg.x,y:arg.y,facing:arg.facing||"up",interact:arg.interact,once:arg.once,miniboss:arg.miniboss,bullet:arg.bullet};
  ni=0;
  A.battle(q);
}
function flee(){
  dead=1;
  if(t)clearTimeout(t);
  if(fi)clearInterval(fi);
  t=fi=0;ni=0;
  A.world({map:"WORLD_01",mode:"tile",x:arg.x,y:arg.y,facing:arg.facing||"up",msg:"YOU FLED"});
}
function choice(){phase="choice";msg=dlg;bottom()}
function walk(){
  if(dead)return;
  if(ny<py-2){
    ny++;msg=enemy+" APPROACHES";
    top();bottom();
    t=setTimeout(walk,220);
    return;
  }
  choice();
}
function k1(v,l){if(v===0&&!l){if(phase!="choice")choice();else if(sel)flee();else start()}}
function k2(v){if(phase=="choice"&&v){sel=sel?0:1;bottom()}}
function remove(){dead=1;if(t)clearTimeout(t);if(fi)clearInterval(fi);t=fi=0;ni=0}
draw();
frame();
fi=setInterval(frame,40);
t=setTimeout(walk,350);
return{k1:k1,k2:k2,remove:remove};
})