(function(A,arg){
arg=arg||{};
var B=A.base,W=A.w,H=A.h,FY=296,RB=120,PAGE=35520,STEP=6,FRAME=40,CM=280,SS=42,BO=4,YO=8;
var MW=1672,MH=941,CW=140,CH=79,NX=6,XP=[0,240,480,720,960,1192],YP=[0,196,392,588,645];
var bg=0,cm=0,s=0,px=1120,py=126,face="down",msg="ROT'S CROSSING",act=0,dead=0,busy=0;
var dx=1120,dy=162,df="down",da=0,di=0,dk="",lx=[1120,1120,1120,1120,1120],ly=[162,162,162,162,162],li=0;
var sp=0,sk="",pa=1,cx=0,cy=0,xi=0,yi=0,pg=-1,ct=0,qx=0,qy=0,fk="",fi=0,dlg=0,choice=0,ride=arg.bikeEquip===1,rvx=0,rvy=0;
function gc(){}
function ft(n){try{h.setFont("6x8",n||1)}catch(e){}}
function tx(v,n){v=v==null?"":String(v);return n&&v.length>n?v.substr(0,n-1)+"~":v}
function pp(){try{return player&&player.player?player.player:{}}catch(e){return{}}}
function rd(p){try{return fs.readFile(p)}catch(e){return 0}}
function wr(p,d){try{if(fs.writeFileSync){fs.writeFileSync(p,d);return 1}}catch(e){}try{if(fs.writeFile){fs.writeFile(p,d);return 1}}catch(e2){}return 0}
function sync(){try{player.modified=true;if(player.sync)player.sync()}catch(e){}}
function close(){try{if(bg&&bg.close)bg.close()}catch(e){}bg=0}
function open(){try{bg=E.openFile(B+"W2.BIN","r")}catch(e){bg=0}if(!bg)throw"W2.BIN";cm=rd(B+"C2.BIN");if(!cm||cm.length<1383)throw"C2.BIN"}
function loadState(){var p=pp(),q=0;if(p.wb)return p.wb;try{q=JSON.parse(rd(B+"SAV.JSON")||"{}")}catch(e){q={}}return q||{}}
function story(){s.story=s.story||{};s.story.rounds=s.story.rounds||{};s.story.encounters=s.story.encounters||0;if(s.story.bikeStolen&&!s.story.motorcycle)s.story.motorcycle=1;return s.story}
function store(){var p=pp(),d;s.cleared=s.cleared||{};story();s.map="WORLD_02";s.mode="image";s.x=px;s.y=py;s.facing=face;try{p.wb=s;sync()}catch(e){}d=JSON.stringify(s);wr(B+"SAV.JSON",d);return 1}
function pimg(){var d,f=face=="down"?"D":face=="left"?"L":face=="right"?"R":"U",k=(ride?"B":"P")+f;if(sk==k)return sp;sp=0;sk=k;d=rd(B+k+".BIN");if(ride&&d&&d.length>=441)sp={width:42,height:42,bpp:2,transparent:0,buffer:d};else if(d&&d.length>=1323)sp={width:42,height:42,bpp:2,transparent:0,buffer:d};else if(d&&d.length>=867)sp={width:34,height:34,bpp:2,transparent:0,buffer:d};else sp=rd(B+k+".IMG")||0;return sp}
function dimg(){var k=df=="left"?"L":df=="right"?"R":df=="up"?"U":"D";if(dk==k)return di;di=0;dk=k;di=rd(B+"D"+k+".IMG")||0;return di}
function xindex(x){x+=17;return x<360?0:x<600?1:x<840?2:x<1080?3:x<1320?4:5}
function yindex(y){y+=17;return y<246?0:y<442?1:y<638?2:y<736?3:4}
function page(){xi=xindex(px);yi=yindex(py);cx=XP[xi];cy=YP[yi];return yi*NX+xi}
function fullbg(){var t=new Uint8Array(h.buffer),left=PAGE,o=0,c,n;pg=page();bg.seek(pg*PAGE);while(left>0){n=left>512?512:left;c=bg.read(n);if(!c)break;t.set(c,o);o+=c.length;left-=c.length}t=0}
function restoreBand(a,b,c,d){var t,y0,y1,left,o,n,v;if(!bg)return;y0=Math.min(a,b,c,d)-cy-YO-2;y1=Math.max(a,b,c,d)+SS-cy+2;y0=Math.max(0,y0|0);y1=Math.min(FY,y1|0);if(y1<=y0)return;left=(y1-y0)*RB;o=y0*RB;bg.seek(pg*PAGE+o);t=new Uint8Array(h.buffer);while(left>0){n=left>512?512:left;v=bg.read(n);if(!v)break;t.set(v,o);o+=v.length;left-=v.length}t=0}
function drawPlayer(){var im=pimg(),x=px-cx-BO,y=py-cy-YO;if(im)try{h.setColor(3);if(ride)h.drawImage(im,x,y);else h.drawImage(im,x,y,{frame:pa%3});return}catch(e){}h.setColor(3).drawRect(x+11,y+7,x+30,y+37)}
function drawDog(){var im=dimg(),x=dx-cx-BO,y=dy-cy-YO;if(im)try{h.setColor(3).drawImage(im,x,y,{frame:da%3});return}catch(e){}h.setColor(3).fillRect(x+6,y+11,x+22,y+22)}
function bit(x,y){var i,b;if(x<0||y<0||x>=CW||y>=CH)return 1;i=y*CW+x;b=cm.charCodeAt(i>>3);return(b>>(7-(i&7)))&1}
function hit(nx,ny){var x1=nx+9,x2=nx+25,y1=ny+25,y2=ny+33;return bit((x1/12)|0,(y1/12)|0)||bit((x2/12)|0,(y1/12)|0)||bit((x1/12)|0,(y2/12)|0)||bit((x2/12)|0,(y2/12)|0)}
function center(){return[px+17,py+30]}
function near(x,y,rx,ry){var p=center();return Math.abs(p[0]-x)<=rx&&Math.abs(p[1]-y)<=ry}
function find(){if(near(462,404,55,38))return 1;if(!story().bikeStolen&&near(720,350,108,108))return 2;if(near(1150,112,70,38))return 3;if(near(935,884,70,48))return 4;return 0}
function prompt(a){return a==1?"ENTER ROT'S TAVERN?":a==2?"CHECK THE MOTORCYCLES?":a==3?"RETURN TO SUNSCAR?":a==4?"WALK TO DOGTOWN HEIGHTS?":msg}
function foot(force){var a=find(),t=msg||prompt(a),k=a+"|"+t;act=a;if(!force&&k==fk)return 0;fk=k;h.setClipRect(0,FY,W-1,H-1);h.setColor(0).fillRect(0,FY,W-1,H-1);h.setColor(2).drawLine(0,FY-1,W-1,FY-1);ft(2);h.setFontAlign(0,0);h.setColor(a?3:2).drawString(tx(t,40),W/2,FY+11);h.setClipRect(0,0,W-1,H-1);return 1}
function actors(){drawDog();drawPlayer()}
function stand(){if(pa==1)return;pa=1;restoreBand(py,py,dy,dy);actors();foot(0)}
function frame(){var x=0,y=0;if(dead)return;if(!busy&&!dlg){if(ride&&(rvx||rvy)){x=rvx;y=rvy}else if(qx){x=qx<0?-STEP:STEP;qx-=x}else if(qy){y=qy<0?-STEP:STEP;qy-=y}if(x||y)move(x,y);else stand()}h.flip();Pip.lastFlip=getTime()}
function full(){if(dead)return;fullbg();actors();foot(1)}
function move(mx,my){var ox=px,oy=py,odx=dx,ody=dy,nx=px+mx,ny=py+my,nxi,nyi,tx0,ty0,m=0;if(busy||dlg)return;if(mx<0)face="left";else if(mx>0)face="right";else if(my>0)face="down";else face="up";if(!hit(nx,ny)){px=nx;py=ny;msg="";m=1}else if(ride){rvx=rvy=0;msg="BIKE STOPPED"}if(m){tx0=lx[li];ty0=ly[li];lx[li]=ox;ly[li]=oy;li=(li+1)%5;dx=tx0;dy=ty0;if(dx<odx)df="left";else if(dx>odx)df="right";else if(dy<ody)df="up";else if(dy>ody)df="down";if(dx!=odx||dy!=ody)da=(da+1)%3;pa=(pa+1)%3}else pa=1;nxi=xindex(px);nyi=yindex(py);if(nxi!=xi||nyi!=yi){full();return}restoreBand(oy,py,ody,dy);actors();foot(0)}
function queue(x,y){var lim=STEP*4;if(dead||busy||dlg)return;if(ride){qx=qy=0;if(x){rvx=x<0?-STEP:STEP;rvy=0;face=x<0?"left":"right"}else{rvy=y<0?-STEP:STEP;rvx=0;face=y<0?"up":"down"}sk="";return}if(x){qx+=x<0?-STEP:STEP;if(qx>lim)qx=lim;if(qx<-lim)qx=-lim;qy=0}else{qy+=y<0?-STEP:STEP;if(qy>lim)qy=lim;if(qy<-lim)qy=-lim;qx=0}}
function stopWorld(){dead=1;if(fi)clearInterval(fi);if(ct)clearTimeout(ct);fi=ct=0;close();cm=sp=di=lx=ly=0;gc()}
function toSunscar(){var q;ride=0;rvx=rvy=0;sk="";sp=0;story().bikeActive=0;store();q={map:"WORLD_01",mode:"image",x:760,y:996,facing:"up",bikeEquip:0,msg:"RETURNED TO SUNSCAR - MOTORCYCLE STORED"};stopWorld();A.world(q)}
function startRun(walk){var q={walk:!!walk,map:"WORLD_02",x:px,y:py,facing:face};store();stopWorld();A.ride(q)}
function enter(){var q={interiorId:"ROT_TAVERN",map:"WORLD_02",x:px,y:py,facing:face};store();stopWorld();A.house(q)}
function choiceDraw(){h.setClipRect(0,170,W-1,H-1);h.setColor(0).fillRect(0,170,W-1,H-1);h.setColor(2).drawRect(8,178,W-9,H-9);h.setFontAlign(0,-1);ft(2);h.setColor(3).drawString("STEAL THE MOTORCYCLE?",W/2,192);ft(1);h.setColor(choice==0?3:2).drawString((choice==0?"> ":"  ")+"STEAL IT",145,242);h.setColor(choice==1?3:2).drawString((choice==1?"> ":"  ")+"WALK SOUTH",335,242);h.setColor(2).drawString("RIGHT WHEEL / LEFT CLICK",W/2,276);h.setClipRect(0,0,W-1,H-1)}
function beginChoice(){dlg=1;choice=0;qx=qy=0;choiceDraw()}
function choose(){if(!dlg)return;dlg=0;if(choice)startRun(1);else startRun(0)}
function go(){var a=act;if(!a){msg="NOTHING HERE";foot(1);return}if(a==1){enter();return}if(a==2){beginChoice();return}if(a==3){toSunscar();return}if(a==4){startRun(1);return}}
function pause(){if(busy||dlg)return;qx=qy=0;store();stopWorld();A.pause({map:"WORLD_02",mode:"image",x:px,y:py,facing:face,city:"ROT'S CROSSING",story:story(),msg:msg})}
function dismount(){ride=0;rvx=rvy=0;sk="";sp=0;pa=1;msg="MOTORCYCLE STORED";full()}
function click(){if(dlg){choose();return}if(ct){clearTimeout(ct);ct=0;if(ride)dismount();else pause()}else ct=setTimeout(function(){ct=0;if(!dead)go()},CM)}
function k1(v,l){if(dead)return;if(v===0){click();return}if(ct){clearTimeout(ct);ct=0}queue(0,v)}
function k2(v){if(dead||!v)return;if(dlg){choice=choice?0:1;choiceDraw();return}if(ct){clearTimeout(ct);ct=0}queue(v,0)}
function remove(){if(!dead)stopWorld()}
s=loadState();s.cleared=s.cleared||{};story();story().bikeActive=0;ride=ride&&!!story().motorcycle;if(arg&&arg.x!==undefined){px=parseInt(arg.x,10);py=parseInt(arg.y,10);face=arg.facing||"down"}else if(s.map=="WORLD_02"&&s.x!==undefined){px=parseInt(s.x,10);py=parseInt(s.y,10);face=s.facing||"down"}if(isNaN(px)||isNaN(py)||px<80||py<80||px>MW-80||py>MH-50){px=1120;py=126;face="down"}dx=px;dy=py+36;df=face;lx=[dx,dx,dx,dx,dx];ly=[dy,dy,dy,dy,dy];if(arg.msg)msg=arg.msg;if(ride){if(face=="left")rvx=-STEP;else if(face=="right")rvx=STEP;else if(face=="up")rvy=-STEP;else rvy=STEP}open();store();full();frame();fi=setInterval(frame,FRAME);return{k1:k1,k2:k2,save:store,remove:remove};
})
