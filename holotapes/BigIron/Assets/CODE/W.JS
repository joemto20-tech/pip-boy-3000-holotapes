(function(A,arg){
var B=A.base,W=A.w,H=A.h,FY=296,RB=120,PAGE=35520,STEP=6,FRAME=40,CM=280;
var bg=0,cm=0,s=0,px=704,py=255,face="down",msg="WELCOME TO SUNSCAR",act=0,dead=0,busy=0;
var dx=704,dy=291,df="down",da=0,di=0,dk="",lx=[704,704,704,704,704],ly=[291,291,291,291,291],li=0;
var sp=0,sk="",pa=1,cx=0,cy=0,pg=-1,ct=0,qx=0,qy=0,fk="",fi=0;
function gc(){try{A.gc()}catch(e){}}
function ft(n){try{h.setFont("6x8",n||1)}catch(e){}}
function tx(v,n){v=v==null?"":String(v);return n&&v.length>n?v.substr(0,n-1)+"~":v}
function pp(){try{return player&&player.player?player.player:{}}catch(e){return{}}}
function rd(p){try{return fs.readFile(p)}catch(e){return 0}}
function wr(p,d){try{if(fs.writeFileSync){fs.writeFileSync(p,d);return 1}}catch(e){}try{if(fs.writeFile){fs.writeFile(p,d);return 1}}catch(e2){}return 0}
function sync(){try{player.modified=true;if(player.sync)player.sync()}catch(e){}}
function close(){try{if(bg&&bg.close)bg.close()}catch(e){}bg=0}
function open(){var f=0;try{bg=E.openFile(B+"DATA/W.BIN","r")}catch(e){bg=0}if(!bg)try{bg=E.openFile(B+"W.BIN","r")}catch(e2){bg=0}if(!bg)throw"W.BIN";cm=rd(B+"DATA/C.BIN")||rd(B+"C.BIN");if(!cm||cm.length<1350){try{f=E.openFile(B+"DATA/C.BIN","r")}catch(e3){f=0}if(!f)try{f=E.openFile(B+"C.BIN","r")}catch(e4){f=0}if(f)try{cm=f.read(1350)}catch(e5){cm=0}try{if(f&&f.close)f.close()}catch(e6){}f=0}if(!cm||cm.length<1350)throw"C.BIN"}
function loadState(){var p=pp(),q=0;if(p.wb&&p.wb.map)return p.wb;try{q=JSON.parse(rd(B+"SAVE/STATE.JSON")||"{}")}catch(e){q={}}return q||{}}
function story(){s.story=s.story||{};s.story.rounds=s.story.rounds||{};s.story.encounters=s.story.encounters||0;s.story.deadLead=s.story.deadLead||0;return s.story}
function rounds(){var r=story().rounds,n=0,k;for(k in r)if(r[k])n++;return n}
function save(){var p=pp(),d;s.cleared=s.cleared||{};story();s.map="WORLD_01";s.mode="image";s.x=px;s.y=py;s.facing=face;try{p.wb=s;sync()}catch(e){}d=JSON.stringify(s);wr(B+"SAVE/STATE.JSON",d);msg="GAME SAVED";return 1}
function done(k){if(!s.cleared||!s.cleared[k])return 0;if(k=="b0"&&!story().rounds.SCORCHED)return 0;return 1}
function pimg(){var k=face=="down"?"PLAYER_SPRITEDOWN":face=="left"?"PLAYER_SPRITEL":face=="right"?"PLAYER_SPRITER":"PLAYER_SPRITEUP",d;if(sk==k)return sp;sp=0;sk=k;d=rd(B+"DATA/"+k+".BIN");if(d&&d.length>=867)sp={width:102,height:34,bpp:2,transparent:0,buffer:d};else sp=rd(B+"DATA/"+k+".IMG")||0;return sp}
function dimg(){var k=df=="left"?"L":df=="right"?"R":df=="up"?"U":"D";if(dk==k)return di;di=0;dk=k;di=rd(B+"DATA/D"+k+".IMG")||0;return di}
function camx(x){x+=17;return x<360?0:x<600?240:x<840?480:x<1080?720:960}
function camy(y){y+=17;return y<246?0:y<442?196:y<638?392:y<834?588:784}
function page(){return((cy/196)|0)*5+((cx/240)|0)}
function fullbg(){var t=new Uint8Array(h.buffer),left=PAGE,o=0,c,n;pg=page();bg.seek(pg*PAGE);while(left>0){n=left>512?512:left;c=bg.read(n);if(!c)break;t.set(c,o);o+=c.length;left-=c.length}t=0}
function restoreBand(a,b,c,d){var t,y0,y1,left,o,n,v;if(!bg)return;y0=Math.min(a,b,c,d)-cy;y1=Math.max(a,b,c,d)+34-cy;y0=Math.max(0,y0|0);y1=Math.min(FY,y1|0);if(y1<=y0)return;left=(y1-y0)*RB;o=y0*RB;bg.seek(pg*PAGE+o);t=new Uint8Array(h.buffer);while(left>0){n=left>512?512:left;v=bg.read(n);if(!v)break;t.set(v,o);o+=v.length;left-=v.length}t=0}
function drawPlayer(){var im=pimg(),x=px-cx,y=py-cy;if(im)try{h.setClipRect(x,y,x+33,y+33);h.setColor(3).drawImage(im,x-(pa%3)*34,y);h.setClipRect(0,0,W-1,H-1);return}catch(e){try{h.setClipRect(0,0,W-1,H-1)}catch(e2){}}h.setColor(3).drawRect(x+9,y+5,x+24,y+30)}
function drawDog(){var im=dimg(),x=dx-cx,y=dy-cy;if(im)try{h.setClipRect(x,y,x+33,y+33);h.setColor(3).drawImage(im,x-(da%3)*34,y);h.setClipRect(0,0,W-1,H-1);return}catch(e){try{h.setClipRect(0,0,W-1,H-1)}catch(e2){}}h.setColor(3).fillRect(x+5,y+9,x+18,y+18);h.setColor(2).drawLine(x+5,y+18,x+4,y+24);h.drawLine(x+15,y+18,x+16,y+24)}
function bit(x,y){var i,b;if(x<0||y<0||x>=120||y>=90)return 1;i=y*120+x;b=cm.charCodeAt(i>>3);return(b>>(7-(i&7)))&1}
function hit(nx,ny){var x1=nx+9,x2=nx+25,y1=ny+25,y2=ny+33;return bit((x1/12)|0,(y1/12)|0)||bit((x2/12)|0,(y1/12)|0)||bit((x1/12)|0,(y2/12)|0)||bit((x2/12)|0,(y2/12)|0)}
function center(){return[px+17,py+30]}
function near(x,y,rx,ry){var p=center();return Math.abs(p[0]-x)<=rx&&Math.abs(p[1]-y)<=ry}
function find(){if(!done("b1")&&near(320,390,50,42))return 2;if(near(386,620,54,42))return 5;if(!done("b0")&&near(1025,590,62,44))return 1;if(near(292,856,56,42))return 6;if(!done("b2")&&near(735,980,60,42))return 3;if(!done("b3")&&near(980,790,56,52))return 4;return 0}
function prompt(a){return a==1?"ENTER TOWN HALL?":a==2?"SEARCH SUN KING'S MARKET?":a==3?"ENTER CRATER MOTEL?":a==4?"CHECK GUNS & AMMO?":a==5?"ENTER PAWN SHOP?":a==6?"ENTER DOC'S CLINIC?":msg}
function foot(force){var r=rounds(),a=find(),t=prompt(a),k=r+"|"+t;act=a;if(!force&&k==fk)return 0;fk=k;h.setClipRect(0,FY,W-1,H-1);h.setColor(0).fillRect(0,FY,W-1,H-1);h.setColor(2).drawLine(0,FY-1,W-1,FY-1);h.setColor(3).fillPoly([6,FY-22,6,FY-4,22,FY-13]);h.setColor(2).drawRect(25,FY-22,41,FY-5);ft(1);h.setFontAlign(0,0);h.setColor(3).drawString(r,33,FY-13);ft(2);h.setColor(a?3:2).drawString(tx(t,38),W/2,FY+11);h.setClipRect(0,0,W-1,H-1);return 1}
function stand(){if(pa==1)return;pa=1;restoreBand(py,py,dy,dy);drawDog();drawPlayer();foot(0)}
function frame(){var x=0,y=0;if(dead)return;if(!busy){if(qx){x=qx<0?-STEP:STEP;qx-=x}else if(qy){y=qy<0?-STEP:STEP;qy-=y}if(x||y)move(x,y);else stand()}h.flip();Pip.lastFlip=getTime()}
function full(){if(dead)return;cx=camx(px);cy=camy(py);fullbg();drawDog();drawPlayer();foot(1)}
function move(mx,my){var ox=px,oy=py,odx=dx,ody=dy,nx=px+mx,ny=py+my,ncx,ncy,tx0,ty0,m=0;if(busy)return;if(mx<0)face="left";else if(mx>0)face="right";else if(my>0)face="down";else face="up";if(nx+17>=700&&nx+17<=870&&ny+33>=1044){msg="WAIT FOR THE DLC";foot(1);return}if(!hit(nx,ny)){px=nx;py=ny;msg="";m=1}if(m){tx0=lx[li];ty0=ly[li];lx[li]=ox;ly[li]=oy;li=(li+1)%5;dx=tx0;dy=ty0;if(dx<odx)df="left";else if(dx>odx)df="right";else if(dy<ody)df="up";else if(dy>ody)df="down";if(dx!=odx||dy!=ody)da=(da+1)%3;pa=(pa+1)%3}else pa=1;ncx=camx(px);ncy=camy(py);if(ncx!=cx||ncy!=cy){full();return}restoreBand(oy,py,ody,dy);drawDog();drawPlayer();foot(0)}
function queue(x,y){var lim=STEP*4;if(dead||busy)return;if(x){qx+=x<0?-STEP:STEP;if(qx>lim)qx=lim;if(qx<-lim)qx=-lim;qy=0}else{qy+=y<0?-STEP:STEP;if(qy>lim)qy=lim;if(qy<-lim)qy=-lim;qx=0}}
function go(){var a=act,e,r;if(!a){msg="NOTHING HERE";foot(1);return}busy=1;if(a!=5)save();h.setColor(0).fillRect(0,0,W-1,H-1);h.setFontAlign(0,0);ft(3);h.setColor(3).drawString(tx(prompt(a),24),W/2,132);if(a==1)A.interior({name:"TOWN HALL",room:"TOWN HALL",enemy:"SOLOMON_RAY",ns:"SOLOMON_RAY_SPRITE",dlg:"HOW YOU ENJOYING THE RADS?",map:"WORLD_01",x:px,y:py,facing:face,interact:"b0",once:true,miniboss:true,bullet:"SCORCHED"});else if(a==5)A.shop({vendor:"SUNSCAR PAWN",folder:"Shop",map:"WORLD_01",x:px,y:py,facing:face});else if(a==3)A.house({map:"WORLD_01",x:px,y:py,facing:face});else{if(a==2)e="RAIDER";else if(a==6)e=Math.random()<.5?"RADROACH":"RADSCORPION";else{r=Math.floor(Math.random()*3);e=r==0?"RAIDER":r==1?"RADROACH":"RADSCORPION"}A.battle({enemy:e,map:"WORLD_01",x:px,y:py,facing:face,interact:"b"+(a-1),once:true})}}
function pause(){if(busy)return;qx=qy=0;save();A.pause({map:"WORLD_01",mode:"image",x:px,y:py,facing:face,city:"SUNSCAR",story:story(),msg:msg})}
function click(){if(ct){clearTimeout(ct);ct=0;pause()}else ct=setTimeout(function(){ct=0;if(!dead)go()},CM)}
function k1(v,l){if(dead)return;if(v===0){click();return}if(ct){clearTimeout(ct);ct=0}queue(0,v)}
function k2(v){if(dead||!v)return;if(ct){clearTimeout(ct);ct=0}queue(v,0)}
function remove(){dead=1;if(fi)clearInterval(fi);if(ct)clearTimeout(ct);fi=ct=0;close();cm=s=sp=di=lx=ly=0;gc()}
s=loadState();s.cleared=s.cleared||{};story();if(arg.newGame)s={map:"",cleared:{},story:{rounds:{},encounters:0,deadLead:0}};if(arg&&arg.x!==undefined){px=parseInt(arg.x,10);py=parseInt(arg.y,10);face=arg.facing||"down"}else if(s.map=="WORLD_01"&&s.x!==undefined){px=parseInt(s.x,10);py=parseInt(s.y,10);face=s.facing||"down"}if(isNaN(px)||isNaN(py)||px<100||py<100||px>1400||py>1040){px=704;py=255;face="down"}dx=px;dy=py+36;df=face;lx=[dx,dx,dx,dx,dx];ly=[dy,dy,dy,dy,dy];if(arg.msg)msg=arg.msg;open();if(A.music)A.music(0);full();frame();fi=setInterval(frame,FRAME);return{k1:k1,k2:k2,save:save,remove:remove};
})
