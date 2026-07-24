(function(A,arg){
arg=arg||{};
var B=A.base,W=A.w,H=A.h,FY=296,RB=120,STEP=6,FRAME=40;
var id=String(arg.interiorId||"CRATER_MOTEL").toUpperCase(),C=0;
var px=223,py=376,face="up",cy=0,msg="",act=0,dead=0,busy=0,bg=0,sp=0,sk="",pa=1,qx=0,qy=0,tm=0;
var dx=223,dy=412,df="up",da=1,di=0,dk="",lx=[223,223,223,223,223],ly=[412,412,412,412,412],li=0;
var ni=0,nk="",dlg=0,choice=0,tick=0;
function cfg(k){
 var wall=[[0,0,480,82],[0,0,18,456],[462,0,18,456],[0,420,200,36],[280,420,200,36]];
 if(k=="SUN_KINGS_MARKET")return{
  name:"SUN KING'S MARKET",bg:"SM.BIN",spawn:[223,376,"up"],
  col:wall.concat([[30,100,128,70],[30,205,128,70],[30,310,128,70],[322,100,128,70],[322,205,128,70],[322,310,128,70],[182,94,116,58]]),
  npc:{name:"MARKET RAIDER",x:223,y:178,w:34,h:34,solid:1,img:"",kind:"raider",range:50,text:"SUN KING LEFT US THE KEYS. YOU CAN LEAVE OR BLEED.",enemy:"RAIDER",key:"b1"}
 };
 if(k=="GUNS_AMMO")return{
  name:"GUNS & AMMO",bg:"GA.BIN",spawn:[223,376,"up"],
  col:wall.concat([[28,96,130,62],[322,96,130,62],[28,194,144,58],[308,194,144,58],[56,302,124,54],[300,302,124,54],[188,104,104,68]]),
  npc:{name:"RADSCORPION",x:223,y:244,w:34,h:34,solid:1,img:"RSC.BIN",kind:"scorpion",range:52,text:"A RADSCORPION SCRAPES ACROSS THE DISPLAY FLOOR.",enemy:"RADSCORPION",key:"b3"}
 };
 if(k=="TOWN_HALL")return{
  name:"SUNSCAR TOWN HALL",bg:"TH.BIN",spawn:[223,376,"up"],
  col:wall.concat([[104,88,272,70],[34,188,154,48],[292,188,154,48],[34,272,154,48],[292,272,154,48]]),
  npc:{name:"SOLOMON RAY",x:223,y:164,w:34,h:34,solid:1,img:"SR.IMG",kind:"person",range:52,text:"HOW ARE YOU ENJOYING THE RADS?",enemy:"SOLOMON_RAY",key:"b0",bullet:"SCORCHED",miniboss:1}
 };
 if(k=="ROT_TAVERN")return{
  name:"ROT'S TAVERN",bg:"RT.BIN",spawn:[223,376,"up"],
  col:wall.concat([[38,219,34,89],[83,96,40,46],[107,121,268,36],[123,165,28,28],[172,165,28,28],[221,165,28,28],[270,165,28,28],[319,165,28,28],[368,165,28,28],[50,315,94,84],[198,286,84,116],[325,315,94,84],[388,80,47,63],[401,371,39,55],[57,379,29,35]]),
  npc:{name:"ROTJAW",x:214,y:98,w:34,h:34,solid:0,img:"RJ.BIN",kind:"person",range:66,text:"ROAD SOUTH IS OPEN. THE BIKES OUTSIDE ARE NOT YOURS."}
 };
 return{
  name:"CRATER MOTEL",bg:"MT.BIN",spawn:[223,376,"up"],
  col:[[0,0,480,96],[0,0,24,456],[456,0,24,456],[0,420,205,36],[275,420,205,36],[24,100,106,105],[245,100,190,66],[285,205,122,80],[24,260,101,150],[95,348,90,66],[355,345,105,71],[438,170,22,160],[252,314,34,36]],
  npc:{name:"MOTEL RESIDENT",x:252,y:314,w:34,h:34,solid:1,img:"G.IMG",kind:"person",range:46,text:"SURE IS NICE TO HAVE A NOSE."}
 };
}
function ft(n){try{h.setFont("6x8",n||1)}catch(e){}}
function tx(v,n){v=v==null?"":String(v);return n&&v.length>n?v.substr(0,n-1)+"~":v}
function rd(p){try{return fs.readFile(p)}catch(e){return 0}}
function pp(){try{return player&&player.player?player.player:{}}catch(e){return{}}}
function cleared(k){var p=pp(),s=p.wb||{};return!!(k&&s.cleared&&s.cleared[k])}
function npcOn(){return C.npc&&!cleared(C.npc.key)}
function close(){try{if(bg&&bg.close)bg.close()}catch(e){}bg=0}
function open(){try{bg=E.openFile(B+C.bg,"r")}catch(e){bg=0}if(!bg)throw C.bg}
function pimg(){var d,k=face=="down"?"PD":face=="left"?"PL":face=="right"?"PR":"PU";if(sk==k)return sp;sp=0;sk=k;d=rd(B+k+".BIN");if(d&&d.length>=1323)sp={width:42,height:42,bpp:2,transparent:0,buffer:d};else if(d&&d.length>=867)sp={width:34,height:34,bpp:2,transparent:0,buffer:d};else sp=rd(B+k+".IMG")||0;return sp}
function dimg(){var k=df=="left"?"L":df=="right"?"R":df=="up"?"U":"D";if(dk==k)return di;di=0;dk=k;di=rd(B+"D"+k+".IMG")||0;return di}
function nimg(){var n=C.npc,k=n&&n.img,d;if(!k)return 0;if(nk==k)return ni;ni=0;nk=k;d=rd(B+k)||0;if(!d)return 0;if(/\.BIN$/i.test(k)){if(d.length>=441)ni={width:42,height:42,bpp:2,transparent:0,buffer:d};else if(d.length>=289)ni={width:34,height:34,bpp:2,transparent:0,buffer:d};else ni=0;}else ni=d;return ni}
function camera(y){var max=Math.max(0,456-FY),v=Math.floor((y+17-FY/2)/80)*80;return Math.max(0,Math.min(max,v))}
function fullbg(){var t=new Uint8Array(h.buffer),left=FY*RB,o=0,c,n;bg.seek(cy*RB);while(left>0){n=left>512?512:left;c=bg.read(n);if(!c)break;t.set(c,o);o+=c.length;left-=c.length}t=0}
function band(a,b,c,d){var t,y0=Math.max(0,Math.min(a,b,c,d)-cy-10),y1=Math.min(FY,Math.max(a,b,c,d)+44-cy),left,o,n,v;if(y1<=y0)return;left=(y1-y0)*RB;o=y0*RB;bg.seek((cy+y0)*RB);t=new Uint8Array(h.buffer);while(left>0){n=left>512?512:left;v=bg.read(n);if(!v)break;t.set(v,o);o+=v.length;left-=v.length}t=0}
function playerDraw(){var im=pimg(),x=px-4,y=py-cy-8;if(im)try{h.setColor(3).drawImage(im,x,y,{frame:pa%3});return}catch(e){}h.setColor(3).drawRect(x+11,y+7,x+30,y+37)}
function dogDraw(){var im=dimg(),x=dx-4,y=dy-cy-8;if(y+42<0||y>=FY)return;if(im)try{h.setColor(3).drawImage(im,x,y,{frame:da%3});return}catch(e){}h.setColor(3).fillRect(x+6,y+11,x+22,y+22);h.setColor(2).drawLine(x+6,y+22,x+5,y+30);h.drawLine(x+18,y+22,x+20,y+30)}
function raider(x,y){h.setColor(2).fillRect(x+9,y+5,x+24,y+18);h.setColor(3).drawLine(x+5,y+4,x+28,y+4);h.drawLine(x+17,y+18,x+17,y+30);h.drawLine(x+8,y+22,x+27,y+22);h.drawLine(x+17,y+30,x+10,y+34);h.drawLine(x+17,y+30,x+24,y+34)}
function scorpion(x,y){h.setColor(2).fillRect(x+7,y+14,x+26,y+25);h.setColor(3).drawLine(x+7,y+16,x+2,y+9);h.drawLine(x+26,y+16,x+31,y+9);h.drawLine(x+7,y+24,x+2,y+31);h.drawLine(x+26,y+24,x+31,y+31);h.drawLine(x+16,y+14,x+22,y+6);h.drawLine(x+22,y+6,x+29,y+8);h.fillRect(x+12,y+10,x+20,y+16)}
function npcDraw(){var n=C.npc,x,y,im;if(!npcOn())return;x=n.x;y=n.y-cy;if(y+n.h<0||y>=FY)return;im=nimg();if(im)try{h.setColor(3).drawImage(im,x,y);return}catch(e){}if(n.kind=="scorpion")scorpion(x,y);else raider(x,y)}
function overlap(nx,ny,x,y,w,hh){var x1=nx+9,x2=nx+25,y1=ny+25,y2=ny+33;return x2>=x&&x1<x+w&&y2>=y&&y1<y+hh}
function hit(nx,ny){var i,r,n=C.npc;if(nx<0||nx+34>W||ny<0||ny+34>456)return 1;for(i=0;i<C.col.length;i++){r=C.col[i];if(overlap(nx,ny,r[0],r[1],r[2],r[3]))return 1}if(npcOn()&&n.solid&&overlap(nx,ny,n.x,n.y,n.w,n.h))return 1;return 0}
function near(x,y,w,hh,r){var cx=px+17,yy=py+30;return Math.abs(cx-(x+w/2))<=w/2+r&&Math.abs(yy-(y+hh/2))<=hh/2+r}
function find(){var n=C.npc;if(npcOn()&&near(n.x,n.y,n.w,n.h,n.range))return 1;if(near(200,414,80,42,8))return 2;return 0}
function footer(){var label;act=find();if(act==1)label="TALK TO "+C.npc.name+"?";else if(act==2)label="LEAVE "+C.name+"?";else label=msg;h.setClipRect(0,FY,W-1,H-1);h.setColor(0).fillRect(0,FY,W-1,H-1);h.setColor(2).drawLine(0,FY-1,W-1,FY-1);h.setFontAlign(0,0);ft(2);h.setColor(act?3:2).drawString(tx(label,40),W/2,FY+11);h.setClipRect(0,0,W-1,H-1)}
function actors(){npcDraw();dogDraw();playerDraw()}
function full(){cy=camera(py);fullbg();actors();footer()}
function move(mx,my){var ox=px,oy=py,odx=dx,ody=dy,nx=px+mx,ny=py+my,nc,m=0,tx0,ty0;if(busy||dlg)return;if(mx<0)face="left";else if(mx>0)face="right";else if(my>0)face="down";else face="up";if(!hit(nx,ny)){px=nx;py=ny;msg="";m=1}if(m){tx0=lx[li];ty0=ly[li];lx[li]=ox;ly[li]=oy;li=(li+1)%5;dx=tx0;dy=ty0;if(dx<odx)df="left";else if(dx>odx)df="right";else if(dy<ody)df="up";else if(dy>ody)df="down";if(dx!=odx||dy!=ody)da=(da+1)%3;pa=(pa+1)%3}else pa=1;nc=camera(py);if(nc!=cy){full();return}band(oy,py,ody,dy);actors();footer()}
function wrap(s,n){var w=String(s||"").split(" "),a=[],l="",i,q;for(i=0;i<w.length;i++){q=l?l+" "+w[i]:w[i];if(q.length>n&&l){a.push(l);l=w[i]}else l=q}if(l)a.push(l);return a.slice(0,3)}
function dialogueDraw(){var a=wrap(dlg.text,48),i,enemy=!!dlg.enemy;h.setClipRect(0,176,W-1,H-1);h.setColor(0).fillRect(0,176,W-1,H-1);h.setColor(2).drawRect(8,184,W-9,H-9);h.setFontAlign(-1,-1);ft(1);h.setColor(3);for(i=0;i<a.length;i++)h.drawString(a[i],20,196+i*13);if(enemy){h.setColor(choice==0?3:2).drawString((choice==0?"> ":"  ")+"FIGHT",40,252);h.setColor(choice==1?3:2).drawString((choice==1?"> ":"  ")+"BACK AWAY",250,252)}else{h.setColor(3).drawString("> CLOSE",40,252)}h.setClipRect(0,0,W-1,H-1)}
function begin(){dlg=C.npc;choice=0;dialogueDraw()}
function exitRoom(){var q;if(dead)return;dead=1;if(tm)clearInterval(tm);tm=0;close();q={map:arg.map||"WORLD_01",mode:"image",x:arg.x,y:arg.y,facing:arg.facing||"down",msg:"LEFT "+C.name};if(A.returnWorld)A.returnWorld(q,300);else A.world(q)}
function fight(){var n=dlg,q;if(!n||!n.enemy)return;dead=1;if(tm)clearInterval(tm);tm=0;close();q={enemy:n.enemy,map:arg.map||"WORLD_01",mode:"image",x:arg.x,y:arg.y,facing:arg.facing||"down",interact:n.key,once:!!n.key,miniboss:!!n.miniboss,bullet:n.bullet};dlg=0;A.battle(q)}
function choose(){if(!dlg)return;if(!dlg.enemy){dlg=0;full();return}if(choice) {dlg=0;msg="YOU BACK AWAY";full()}else fight()}
function activate(){if(dlg){choose();return}if(act==1){begin();return}if(act==2){exitRoom();return}msg="NOTHING HERE";footer()}
function queue(x,y){var lim=STEP*4;if(dead||busy||dlg)return;if(x){qx+=x<0?-STEP:STEP;if(qx>lim)qx=lim;if(qx<-lim)qx=-lim;qy=0}else{qy+=y<0?-STEP:STEP;if(qy>lim)qy=lim;if(qy<-lim)qy=-lim;qx=0}}
function frame(){var x=0,y=0;if(dead)return;tick++;if(!busy&&!dlg){if(qx){x=qx<0?-STEP:STEP;qx-=x}else if(qy){y=qy<0?-STEP:STEP;qy-=y}if(x||y)move(x,y)}h.flip();Pip.lastFlip=getTime()}
function k1(v,l){if(dead)return;if(v===0&&!l){activate();return}queue(0,v)}
function k2(v){if(dead||!v)return;if(dlg&&dlg.enemy){choice=choice?0:1;dialogueDraw();return}queue(v,0)}
function remove(){dead=1;if(tm)clearInterval(tm);tm=0;close();sp=di=ni=dlg=lx=ly=0;}
C=cfg(id);px=C.spawn[0];py=C.spawn[1];face=C.spawn[2];dx=px;dy=py+36;df=face;lx=[dx,dx,dx,dx,dx];ly=[dy,dy,dy,dy,dy];msg=C.name;open();full();frame();tm=setInterval(frame,FRAME);return{k1:k1,k2:k2,remove:remove};
})
