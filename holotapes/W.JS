(function(A,arg){
arg=arg||{};
var B=A.base,W=A.w,H=A.h,FY=296,RB=120,PAGE=35520,STEP=6,FRAME=40,CM=280,SS=42,BO=4,YO=8;
var bg=0,cm=0,s=0,px=704,py=255,face="down",msg="WELCOME TO SUNSCAR",act=0,dead=0,busy=0;
var dx=704,dy=291,df="down",da=0,di=0,dk="",lx=[704,704,704,704,704],ly=[291,291,291,291,291],li=0;
var sp=0,sk="",po=1,pa=1,cx=0,cy=0,pg=-1,ct=0,qx=0,qy=0,fk="",fi=0,rp=0,rk="",RX=1015,RY=845,warn=0,rap=0,ride=arg.bikeEquip===1,rvx=0,rvy=0;
function gc(){}
function ft(n){try{h.setFont("6x8",n||1)}catch(e){}}
function tx(v,n){v=v==null?"":String(v);return n&&v.length>n?v.substr(0,n-1)+"~":v}
function pp(){try{return player&&player.player?player.player:{}}catch(e){return{}}}
function rd(p){try{return fs.readFile(p)}catch(e){return 0}}
function wr(p,d){try{if(fs.writeFileSync){fs.writeFileSync(p,d);return 1}}catch(e){}try{if(fs.writeFile){fs.writeFile(p,d);return 1}}catch(e2){}return 0}
function sync(){try{player.modified=true;if(player.sync)player.sync()}catch(e){}}
function close(){try{if(bg&&bg.close)bg.close()}catch(e){}bg=0}
function open(){try{bg=E.openFile(B+"W.BIN","r")}catch(e){bg=0}if(!bg)throw"W.BIN";cm=rd(B+"C.BIN");if(!cm||cm.length<1350)throw"C.BIN"}
function loadState(){var p=pp(),q=0;if(p.wb&&p.wb.map)return p.wb;try{q=JSON.parse(rd(B+"SAV.JSON")||"{}")}catch(e){q={}}return q||{}}
function story(){s.story=s.story||{};s.story.rounds=s.story.rounds||{};s.story.encounters=s.story.encounters||0;s.story.deadLead=s.story.deadLead||0;if(s.story.bikeStolen&&!s.story.motorcycle)s.story.motorcycle=1;return s.story}
function rounds(){var r=story().rounds,n=0,k;for(k in r)if(r[k])n++;return n}
function store(){var p=pp(),d;s.cleared=s.cleared||{};story();s.map="WORLD_01";s.mode="image";s.x=px;s.y=py;s.facing=face;try{p.wb=s;sync()}catch(e){}d=JSON.stringify(s);wr(B+"SAV.JSON",d);return 1}
function save(){store();msg="GAME SAVED";return 1}
function done(k){if(!s.cleared||!s.cleared[k])return 0;if(k=="b0"&&!story().rounds.SCORCHED)return 0;return 1}
function pimg(){var d,f=face=="down"?"D":face=="left"?"L":face=="right"?"R":"U",k=(ride?"B":"P")+f;if(sk==k)return sp;sp=0;sk=k;d=rd(B+k+".BIN");if(ride&&d&&d.length>=441)sp={width:42,height:42,bpp:2,transparent:0,buffer:d};else if(d&&d.length>=1323)sp={width:42,height:42,bpp:2,transparent:0,buffer:d};else if(d&&d.length>=867)sp={width:34,height:34,bpp:2,transparent:0,buffer:d};else sp=rd(B+k+".IMG")||0;return sp}
function acc(x,y){}
function dimg(){var k=df=="left"?"L":df=="right"?"R":df=="up"?"U":"D";if(dk==k)return di;di=0;dk=k;di=rd(B+"D"+k+".IMG")||0;return di}
function rw(){return story().residentWarned}
function rimg(){var k="T.IMG";if(rk==k)return rp;rp=0;rk=k;rp=rd(B+k)||0;return rp}
function camx(x){x+=17;return x<360?0:x<600?240:x<840?480:x<1080?720:960}
function camy(y){y+=17;return y<246?0:y<442?196:y<638?392:y<834?588:784}
function page(){return((cy/196)|0)*5+((cx/240)|0)}
function fullbg(){var t=new Uint8Array(h.buffer),left=PAGE,o=0,c,n;pg=page();bg.seek(pg*PAGE);while(left>0){n=left>512?512:left;c=bg.read(n);if(!c)break;t.set(c,o);o+=c.length;left-=c.length}t=0}
function restoreBand(a,b,c,d){var t,y0,y1,left,o,n,v;if(!bg)return;y0=Math.min(a,b,c,d)-cy-YO-2;y1=Math.max(a,b,c,d)+SS-cy+2;y0=Math.max(0,y0|0);y1=Math.min(FY,y1|0);if(y1<=y0)return;left=(y1-y0)*RB;o=y0*RB;bg.seek(pg*PAGE+o);t=new Uint8Array(h.buffer);while(left>0){n=left>512?512:left;v=bg.read(n);if(!v)break;t.set(v,o);o+=v.length;left-=v.length}t=0}
function drawPlayer(){var im=pimg(),x=px-cx-BO,y=py-cy-YO;if(im)try{h.setColor(3);if(ride)h.drawImage(im,x,y);else h.drawImage(im,x,y,{frame:pa%3});acc(x,y);return}catch(e){try{h.setClipRect(0,0,W-1,H-1)}catch(e2){}}h.setColor(3).drawRect(x+11,y+7,x+30,y+37);acc(x,y)}
function drawDog(){var im=dimg(),x=dx-cx-BO,y=dy-cy-YO;if(im)try{h.setColor(3).drawImage(im,x,y,{frame:da%3});return}catch(e){try{h.setClipRect(0,0,W-1,H-1)}catch(e2){}}h.setColor(3).fillRect(x+6,y+11,x+22,y+22);h.setColor(2).drawLine(x+6,y+22,x+5,y+30);h.drawLine(x+18,y+22,x+20,y+30)}
function drawResident(){var im=rimg(),x=RX-cx-BO,y=RY-cy-YO;if(x<-SS||y<-SS||x>=W||y>=FY)return;if(im)try{h.setClipRect(x,y,x+SS-1,y+SS-1);h.setColor(3).drawImage(im,x,y);h.setClipRect(0,0,W-1,H-1);return}catch(e){try{h.setClipRect(0,0,W-1,H-1)}catch(e2){}}h.setColor(2).fillRect(x+11,y+7,x+30,y+25);h.setColor(3).drawLine(x+20,y+25,x+20,y+39)}
function bit(x,y){var i,b;if(x<0||y<0||x>=120||y>=90)return 1;i=y*120+x;b=cm.charCodeAt(i>>3);return(b>>(7-(i&7)))&1}
function hitResident(nx,ny){var x1=nx+9,x2=nx+25,y1=ny+25,y2=ny+33,rx1=RX+9,rx2=RX+25,ry1=RY+25,ry2=RY+33;return x2>=rx1&&x1<=rx2&&y2>=ry1&&y1<=ry2}
function hit(nx,ny){var x1=nx+9,x2=nx+25,y1=ny+25,y2=ny+33;return bit((x1/12)|0,(y1/12)|0)||bit((x2/12)|0,(y1/12)|0)||bit((x1/12)|0,(y2/12)|0)||bit((x2/12)|0,(y2/12)|0)||hitResident(nx,ny)}
function center(){return[px+17,py+30]}
function near(x,y,rx,ry){var p=center();return Math.abs(p[0]-x)<=rx&&Math.abs(p[1]-y)<=ry}
function nearAt(nx,ny,x,y,rx,ry){return Math.abs(nx+17-x)<=rx&&Math.abs(ny+30-y)<=ry}
function nr(){return near(RX+17,RY+30,44,40)}
function find(){if(near(320,370,52,44))return 2;if(near(390,610,54,44))return 5;if(near(1030,545,64,48))return 1;if(near(285,825,58,46))return 6;if(near(715,950,62,46))return 3;if(!rw()&&nr())return 7;if(near(1145,810,62,48))return 4;return 0}
function prompt(a){return a==1?"ENTER TOWN HALL?":a==2?"ENTER SUN KING'S MARKET?":a==3?"ENTER CRATER MOTEL?":a==4?"ENTER GUNS & AMMO?":a==5?"ENTER PAWN SHOP?":a==6?"ENTER DOC'S CLINIC?":a==7?"TALK TO RESIDENT?":msg}
function foot(force){var r=rounds(),a=find(),t=msg||prompt(a),k=r+"|"+t;act=a;if(!force&&k==fk)return 0;fk=k;h.setClipRect(0,FY,W-1,H-1);h.setColor(0).fillRect(0,FY,W-1,H-1);h.setColor(2).drawLine(0,FY-1,W-1,FY-1);h.setColor(3).fillPoly([6,FY-22,6,FY-4,22,FY-13]);h.setColor(2).drawRect(25,FY-22,41,FY-5);ft(1);h.setFontAlign(0,0);h.setColor(3).drawString(r,33,FY-13);ft(2);h.setColor(a?3:2).drawString(tx(t,38),W/2,FY+11);h.setClipRect(0,0,W-1,H-1);return 1}
function stand(){if(pa==1)return;pa=1;restoreBand(py,py,dy,dy);drawResident();drawDog();drawPlayer();foot(0)}
function frame(){var x=0,y=0;if(dead)return;if(rap)residentStep();else if(!busy){if(ride&&(rvx||rvy)){x=rvx;y=rvy}else if(qx){x=qx<0?-STEP:STEP;qx-=x}else if(qy){y=qy<0?-STEP:STEP;qy-=y}if(x||y)move(x,y);else stand()}h.flip();Pip.lastFlip=getTime()}
function full(){if(dead)return;cx=camx(px);cy=camy(py);fullbg();drawResident();drawDog();drawPlayer();foot(1)}
function move(mx,my){var ox=px,oy=py,odx=dx,ody=dy,nx=px+mx,ny=py+my,ncx,ncy,tx0,ty0,m=0;if(busy)return;if(mx<0)face="left";else if(mx>0)face="right";else if(my>0)face="down";else face="up";if(nx+17>=700&&nx+17<=870&&ny+33>=1044){qx=qy=0;store();dead=1;if(fi)clearInterval(fi);fi=0;close();ride=0;rvx=rvy=0;A.bridge({map:"WORLD_02",mode:"image",x:1120,y:126,facing:"down",bikeEquip:0,msg:"ENTERED ROT\'S CROSSING - MOTORCYCLE STORED"});return}if(!rw()&&nearAt(nx,ny,977,790,66,56)){residentStart();return}if(!hit(nx,ny)){px=nx;py=ny;msg="";m=1}else if(ride){rvx=rvy=0;msg="BIKE STOPPED"}if(m){tx0=lx[li];ty0=ly[li];lx[li]=ox;ly[li]=oy;li=(li+1)%5;dx=tx0;dy=ty0;if(dx<odx)df="left";else if(dx>odx)df="right";else if(dy<ody)df="up";else if(dy>ody)df="down";if(dx!=odx||dy!=ody)da=(da+1)%3;pa=(pa+1)%3}else pa=1;ncx=camx(px);ncy=camy(py);if(ncx!=cx||ncy!=cy){full();return}restoreBand(oy,py,ody,dy);drawResident();drawDog();drawPlayer();foot(0)}
function queue(x,y){var lim=STEP*4;if(dead||busy)return;if(ride){qx=qy=0;if(x){rvx=x<0?-STEP:STEP;rvy=0;face=x<0?"left":"right"}else{rvy=y<0?-STEP:STEP;rvx=0;face=y<0?"up":"down"}sk="";return}if(x){qx+=x<0?-STEP:STEP;if(qx>lim)qx=lim;if(qx<-lim)qx=-lim;qy=0}else{qy+=y<0?-STEP:STEP;if(qy>lim)qy=lim;if(qy<-lim)qy=-lim;qx=0}}
function closeWarn(){warn=0;busy=0;msg="RESIDENT WARNED YOU";full()}
function residentSpeak(){rap=0;story().residentWarned=1;store();busy=1;warn=1;msg="RADSCORPIONS BY GUNS & AMMO!";full()}
function residentStart(){if(ct){clearTimeout(ct);ct=0}qx=qy=0;busy=1;rap=1;msg="";full()}
function rhit(nx,ny){var x1=nx+9,x2=nx+25,y1=ny+25,y2=ny+33;return bit((x1/12)|0,(y1/12)|0)||bit((x2/12)|0,(y1/12)|0)||bit((x1/12)|0,(y2/12)|0)||bit((x2/12)|0,(y2/12)|0)}
function residentStep(){var ox=RX,oy=RY,ddx=px-RX,ddy=py-RY,sx=0,sy=0,nx,ny;if(Math.abs(ddx)<=42&&Math.abs(ddy)<=38){residentSpeak();return}if(Math.abs(ddx)>Math.abs(ddy))sx=ddx<0?-STEP:STEP;else sy=ddy<0?-STEP:STEP;nx=RX+sx;ny=RY+sy;if(rhit(nx,ny)){if(sx){sx=0;sy=ddy<0?-STEP:STEP}else{sy=0;sx=ddx<0?-STEP:STEP}nx=RX+sx;ny=RY+sy}if(rhit(nx,ny)){residentSpeak();return}RX=nx;RY=ny;restoreBand(oy,RY,dy,py);drawResident();drawDog();drawPlayer();foot(1)}
function go(){var a=act,e,r;if(!a){msg="NOTHING HERE";foot(1);return}if(a==7){if(rw())residentSpeak();else residentStart();return}busy=1;if(a!=5)save();h.setColor(0).fillRect(0,0,W-1,H-1);h.setFontAlign(0,0);ft(3);h.setColor(3).drawString(tx(prompt(a),24),W/2,132);if(a==1)A.house({interiorId:"TOWN_HALL",map:"WORLD_01",x:px,y:py,facing:face});else if(a==2)A.house({interiorId:"SUN_KINGS_MARKET",map:"WORLD_01",x:px,y:py,facing:face});else if(a==3)A.house({interiorId:"CRATER_MOTEL",map:"WORLD_01",x:px,y:py,facing:face});else if(a==4)A.house({interiorId:"GUNS_AMMO",map:"WORLD_01",x:px,y:py,facing:face});else if(a==5)A.shop({vendor:"SUNSCAR PAWN",folder:"Shop",map:"WORLD_01",x:px,y:py,facing:face});else{if(a==6)e=Math.random()<.5?"RADROACH":"RADSCORPION";else{r=Math.floor(Math.random()*3);e=r==0?"RAIDER":r==1?"RADROACH":"RADSCORPION"}A.battle({enemy:e,map:"WORLD_01",x:px,y:py,facing:face,interact:"b"+(a-1),once:true})}}
function pause(){if(busy)return;qx=qy=0;save();A.pause({map:"WORLD_01",mode:"image",x:px,y:py,facing:face,city:"SUNSCAR",story:story(),msg:msg})}
function dismount(){ride=0;rvx=rvy=0;sk="";sp=0;pa=1;msg="MOTORCYCLE STORED";full()}
function click(){if(ct){clearTimeout(ct);ct=0;if(ride)dismount();else pause()}else ct=setTimeout(function(){ct=0;if(!dead)go()},CM)}
function k1(v,l){if(dead)return;if(warn){if(v===0)closeWarn();return}if(v===0){click();return}if(ct){clearTimeout(ct);ct=0}queue(0,v)}
function k2(v){if(dead||warn||!v)return;if(ct){clearTimeout(ct);ct=0}queue(v,0)}
function remove(){dead=1;if(fi)clearInterval(fi);if(ct)clearTimeout(ct);fi=ct=0;close();cm=s=sp=di=rp=lx=ly=0;gc()}
s=loadState();s.cleared=s.cleared||{};story();ride=ride&&!!story().motorcycle;if(arg.newGame){s={map:"",cleared:{},story:{rounds:{},encounters:0,deadLead:0}};ride=0}if(arg&&arg.x!==undefined){px=parseInt(arg.x,10);py=parseInt(arg.y,10);face=arg.facing||"down"}else if(s.map=="WORLD_01"&&s.x!==undefined){px=parseInt(s.x,10);py=parseInt(s.y,10);face=s.facing||"down"}if(isNaN(px)||isNaN(py)||px<100||py<100||px>1400||py>1040){px=704;py=255;face="down"}dx=px;dy=py+36;df=face;lx=[dx,dx,dx,dx,dx];ly=[dy,dy,dy,dy,dy];if(arg.msg)msg=arg.msg;if(ride){if(face=="left")rvx=-STEP;else if(face=="right")rvx=STEP;else if(face=="up")rvy=-STEP;else rvy=STEP}open();if(arg.newGame)store();if(A.music)A.music(0);full();frame();fi=setInterval(frame,FRAME);return{k1:k1,k2:k2,save:save,remove:remove};
})
