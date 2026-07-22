(function(A,arg){
var B=A.base,W=A.w,H=A.h,FY=296,RB=120,BH=456,STEP=6,FRAME=40;
var px=223,py=376,face="up",cy=160,msg="CRATER MOTEL",act=0,dead=0,busy=0;
var dx=223,dy=410,df="up",da=0,di=0,dk="",lx=[223,223,223,223,223],ly=[410,410,410,410,410],li=0;
var bg=0,sp=0,sk="",pa=1,gp=0,qx=0,qy=0,fk="",fi=0,mus=0;
var K=["perceptioncondition","endurancecondition","leftattackcondition","rightattackcondition","rightmobilitycondition","leftmobilitycondition"];
var C=[0,0,480,96,0,0,24,456,456,0,480,456,0,420,205,456,275,420,480,456,24,100,130,205,245,100,435,166,285,205,407,285,24,260,125,410,95,348,185,414,355,345,460,416,438,170,460,330,252,314,286,350];
function ft(n){try{h.setFont("6x8",n||1)}catch(e){}}
function tx(v,n){v=v==null?"":String(v);return n&&v.length>n?v.substr(0,n-1)+"~":v}
function pp(){try{return player&&player.player?player.player:{}}catch(e){return{}}}
function sync(){try{player.modified=true;if(player.sync)player.sync()}catch(e){}}
function close(){try{if(bg&&bg.close)bg.close()}catch(e){}bg=0}
function open(){try{bg=E.openFile(B+"DATA/H.BIN","r")}catch(e){bg=0}if(!bg)throw"H.BIN"}
function music(on){if(on){if(mus)return;try{if(A.music)A.music(0)}catch(e){}try{Pip.audioStop()}catch(e2){}try{Pip.radioClipPlaying=1;Pip.audioStart(B+"AUDIO/L.WAV",{repeat:true});mus=1}catch(e3){mus=0}}else{if(!mus)return;try{Pip.audioStop()}catch(e4){}try{Pip.radioClipPlaying=0}catch(e5){}mus=0}}
function pimg(){var k=face=="down"?"PLAYER_SPRITEDOWN":face=="left"?"PLAYER_SPRITEL":face=="right"?"PLAYER_SPRITER":"PLAYER_SPRITEUP";if(sk==k)return sp;sp=0;sk=k;try{sp=fs.readFile(B+"DATA/"+k+".IMG")||0}catch(e){sp=0}return sp}
function dimg(){var k=df=="left"?"L":df=="right"?"R":df=="down"?"D":"U";if(dk==k)return di;di=0;dk=k;try{di=fs.readFile(B+"DATA/D"+k+".IMG")||0}catch(e){di=0}return di}
function gimg(){if(gp)return gp;try{gp=fs.readFile(B+"DATA/G.IMG")||0}catch(e){gp=0}return gp}
function fullbg(){var t=new Uint8Array(h.buffer),left=FY*RB,o=0,c,n;bg.seek(cy*RB);while(left>0){n=left>256?256:left;c=bg.read(n);if(!c)break;t.set(c,o);o+=c.length;left-=c.length}t=0}
function restoreBand(a,b,c,d){var t,y0,y1,left,o,n,v;if(!bg)return;y0=Math.min(a,b,c,d)-cy;y1=Math.max(a,b,c,d)+34-cy;y0=Math.max(0,y0|0);y1=Math.min(FY,y1|0);if(y1<=y0)return;left=(y1-y0)*RB;o=y0*RB;bg.seek((cy+y0)*RB);t=new Uint8Array(h.buffer);while(left>0){n=left>512?512:left;v=bg.read(n);if(!v)break;t.set(v,o);o+=v.length;left-=v.length}t=0}
function drawPlayer(){var im=pimg(),y=py-cy;if(im)try{h.setClipRect(px,y,px+33,y+33);h.setColor(3).drawImage(im,px-(pa%3)*34,y);h.setClipRect(0,0,W-1,H-1);return}catch(e){try{h.setClipRect(0,0,W-1,H-1)}catch(e2){}}h.setColor(3).drawRect(px+9,y+5,px+24,y+30)}
function drawDog(){var im=dimg(),y=dy-cy;if(im)try{h.setClipRect(dx,y,dx+33,y+33);h.setColor(3).drawImage(im,dx-(da%3)*34,y);h.setClipRect(0,0,W-1,H-1);return}catch(e){try{h.setClipRect(0,0,W-1,H-1)}catch(e2){}}h.setColor(3).fillRect(dx+5,y+9,dx+18,y+18);h.setColor(2).drawLine(dx+5,y+18,dx+4,y+24);h.drawLine(dx+15,y+18,dx+16,y+24)}
function drawNpc(){var im=gimg(),x=252,y=314-cy;if(y<-34||y>=FY)return;if(im)try{h.setClipRect(x,y,x+33,y+33);h.setColor(3).drawImage(im,x,y);h.setClipRect(0,0,W-1,H-1);return}catch(e){try{h.setClipRect(0,0,W-1,H-1)}catch(e2){}}h.setColor(3).fillRect(x+10,y+5,x+23,y+17);h.setColor(2).drawRect(x+8,y+3,x+25,y+19);h.drawLine(x+16,y+19,x+16,y+29);h.drawLine(x+8,y+23,x+24,y+23);h.drawLine(x+16,y+29,x+10,y+34);h.drawLine(x+16,y+29,x+22,y+34)}
function center(){return[px+17,py+30]}
function near(x,y,rx,ry){var p=center();return Math.abs(p[0]-x)<=rx&&Math.abs(p[1]-y)<=ry}
function find(){var p=center();if(p[0]>=205&&p[0]<=275&&p[1]>=414)return 4;if(near(140,160,42,48))return 1;if(near(340,378,48,44))return 2;if(near(132,312,46,48))return 3;if(near(269,344,46,48))return 5;return 0}
function label(a){return msg||(a==1?"SLEEP?":a==2?"FORGE FINAL ROUND?":a==3?"SAVE GAME?":a==4?"LEAVE MOTEL?":a==5?"TALK?":"") }
function foot(force){var a=find(),t=label(a),k=a+"|"+t;act=a;if(!force&&k==fk)return 0;fk=k;h.setClipRect(0,FY,W-1,H-1);h.setColor(0).fillRect(0,FY,W-1,H-1);h.setColor(2).drawLine(0,FY-1,W-1,FY-1);h.setFontAlign(0,0);ft(2);h.setColor(a?3:2).drawString(tx(t,42),W/2,FY+11);h.setClipRect(0,0,W-1,H-1);return 1}
function cam(y){return y<150?0:y<290?80:160}
function full(){if(dead)return;cy=cam(py);fullbg();drawNpc();drawDog();drawPlayer();foot(1)}
function stand(){if(pa==1)return;pa=1;restoreBand(py,py,dy,dy);drawNpc();drawDog();drawPlayer();foot(0)}
function frame(){var x=0,y=0;if(dead)return;if(!busy){if(qx){x=qx<0?-STEP:STEP;qx-=x}else if(qy){y=qy<0?-STEP:STEP;qy-=y}if(x||y)move(x,y);else stand()}h.flip();Pip.lastFlip=getTime()}
function hit(nx,ny){var x1=nx+10,y1=ny+24,x2=nx+24,y2=ny+33,i;if(x1<20||x2>460||y1<90||y2>440)return 1;for(i=0;i<C.length;i+=4)if(x2>=C[i]&&x1<C[i+2]&&y2>=C[i+1]&&y1<C[i+3])return 1;return 0}
function move(mx,my){var ox=px,oy=py,odx=dx,ody=dy,nx=px+mx,ny=py+my,nc,tx,ty,m=0;if(busy)return;if(mx<0)face="left";else if(mx>0)face="right";else if(my>0)face="down";else face="up";if(!hit(nx,ny)){px=nx;py=ny;msg="";m=1}if(m){tx=lx[li];ty=ly[li];lx[li]=ox;ly[li]=oy;li=(li+1)%5;dx=tx;dy=ty;if(dx<odx)df="left";else if(dx>odx)df="right";else if(dy<ody)df="up";else if(dy>ody)df="down";if(dx!=odx||dy!=ody)da=(da+1)%3;pa=(pa+1)%3}else pa=1;nc=cam(py);if(nc!=cy){full();return}restoreBand(oy,py,ody,dy);drawNpc();drawDog();drawPlayer();foot(0)}
function queue(x,y){var lim=STEP*4;if(dead||busy)return;if(x){qx+=x<0?-STEP:STEP;if(qx>lim)qx=lim;if(qx<-lim)qx=-lim;qy=0}else{qy+=y<0?-STEP:STEP;if(qy>lim)qy=lim;if(qy<-lim)qy=-lim;qx=0}}
function state(){var q=pp(),s=q.wb||{};s.cleared=s.cleared||{};s.story=s.story||{};s.story.rounds=s.story.rounds||{};s.story.encounters=s.story.encounters||0;s.story.deadLead=s.story.deadLead||0;return s}
function write(s){var q=pp(),d;s.map="WORLD_01";s.mode="tile";s.x=arg.x;s.y=arg.y;s.facing=arg.facing||"down";q.wb=s;sync();d=JSON.stringify(s);try{if(fs.writeFileSync)fs.writeFileSync(B+"SAVE/STATE.JSON",d);else fs.writeFile(B+"SAVE/STATE.JSON",d)}catch(e){}return 1}
function sleep(){var q=pp(),i;for(i=0;i<6;i++)q[K[i]]=100;sync();msg="YOU FEEL RESTED";foot(1)}
function forge(){var s=state(),r=s.story.rounds,e=parseInt(s.story.encounters,10)||0,d=parseInt(s.story.deadLead,10)||0;if(r.COURIER){msg="FINAL ROUND ALREADY FORGED"}else if(e<20||d<10){msg="NEED 10 DEAD LEAD + 20 JUDGMENTS"}else{s.story.deadLead=d-10;r.COURIER=1;s.story.forgeReady=0;write(s);msg="FINAL BIG IRON ROUND FORGED"}foot(1)}
function save(){write(state());msg="GAME SAVED";foot(1)}
function leave(){var q;if(dead)return;dead=1;if(fi)clearInterval(fi);fi=0;music(0);close();sp=0;q={map:"WORLD_01",x:arg.x,y:arg.y,facing:arg.facing||"down",msg:"LEFT CRATER MOTEL"};if(A.returnWorld)A.returnWorld(q);else A.world(q)}
function use(){if(act==1)sleep();else if(act==2)forge();else if(act==3)save();else if(act==4)leave();else if(act==5){msg="SURE IS NICE TO HAVE A NOSE.";foot(1)}else{msg="NOTHING HERE";foot(1)}}
function k1(v,l){if(dead)return;if(v===0&&!l){use();return}if(v)queue(0,v)}
function k2(v){if(dead||!v)return;queue(v,0)}
function remove(){dead=1;if(fi)clearInterval(fi);fi=0;music(0);close();sp=di=gp=0;lx=ly=0;try{A.gc()}catch(e){}}
open();full();frame();music(1);fi=setInterval(frame,FRAME);return{k1:k1,k2:k2,remove:remove};
})
