(function(A,arg){
arg=arg||{};
var B=A.base,W=A.w,H=A.h,FY=296,RB=120,PAGE=35520,STEP=6,FRAME=70,SS=42,BO=4,YO=8;
var bg=0,cm=0,px=704,py=255,face="down",sp=0,sk="",pa=1,cx=0,cy=0,pg=-1,fi=0,dead=0,turn=0,dir=1,msg="DEMO MODE";
function gc(){}
function ft(n){try{h.setFont("6x8",n||1)}catch(e){}}
function rd(p){try{return fs.readFile(p)}catch(e){return 0}}
function close(){try{if(bg&&bg.close)bg.close()}catch(e){}bg=0}
function open(){try{bg=E.openFile(B+"W.BIN","r")}catch(e){bg=0}if(!bg)throw"W.BIN";cm=rd(B+"C.BIN");if(!cm||cm.length<1350)throw"C.BIN"}
function pimg(){var d,k=face=="down"?"PD":face=="left"?"PL":face=="right"?"PR":"PU";if(sk==k)return sp;sp=0;sk=k;d=rd(B+k+".BIN");if(d&&d.length>=1323)sp={width:42,height:42,bpp:2,transparent:0,buffer:d};else if(d&&d.length>=867)sp={width:34,height:34,bpp:2,transparent:0,buffer:d};else sp=rd(B+k+".IMG")||0;return sp}
function bit(x,y){var i,b;if(x<0||y<0||x>=120||y>=90)return 1;i=y*120+x;b=cm.charCodeAt?cm.charCodeAt(i>>3):cm[i>>3];return(b>>(7-(i&7)))&1}
function hit(nx,ny){var x1=nx+9,x2=nx+25,y1=ny+25,y2=ny+33;return nx<0||ny<0||nx+34>1440||ny+34>1080||bit((x1/12)|0,(y1/12)|0)||bit((x2/12)|0,(y1/12)|0)||bit((x1/12)|0,(y2/12)|0)||bit((x2/12)|0,(y2/12)|0)}
function camx(x){x+=17;return x<360?0:x<600?240:x<840?480:x<1080?720:960}
function camy(y){y+=17;return y<246?0:y<442?196:y<638?392:y<834?588:784}
function page(){return((cy/196)|0)*5+((cx/240)|0)}
function fullbg(){var t=new Uint8Array(h.buffer),left=PAGE,o=0,c,n;pg=page();bg.seek(pg*PAGE);while(left>0){n=left>512?512:left;c=bg.read(n);if(!c)break;t.set(c,o);o+=c.length;left-=c.length}t=0}
function restore(y0,y1){var t,a=Math.max(0,(Math.min(y0,y1)-cy-YO-2)|0),b=Math.min(FY,(Math.max(y0,y1)+SS-cy+2)|0),left,o,n,v;if(b<=a)return;left=(b-a)*RB;o=a*RB;bg.seek(pg*PAGE+o);t=new Uint8Array(h.buffer);while(left>0){n=left>512?512:left;v=bg.read(n);if(!v)break;t.set(v,o);o+=v.length;left-=v.length}t=0}
function drawPlayer(){var im=pimg(),x=px-cx-BO,y=py-cy-YO;if(im)try{h.setColor(3).drawImage(im,x,y,{frame:pa%3});return}catch(e){try{h.setClipRect(0,0,W-1,H-1)}catch(e2){}}h.setColor(3).drawRect(x+11,y+7,x+30,y+37)}
function foot(){h.setClipRect(0,FY,W-1,H-1);h.setColor(0).fillRect(0,FY,W-1,H-1);h.setColor(2).drawLine(0,FY-1,W-1,FY-1);h.setFontAlign(0,0);ft(2);h.setColor(3).drawString("DEMO - LEFT CLICK MENU",W/2,FY+11);h.setClipRect(0,0,W-1,H-1)}
function full(){cx=camx(px);cy=camy(py);fullbg();drawPlayer();foot()}
function pick(){dir=(Math.random()*4)|0;turn=10+((Math.random()*22)|0)}
function step(){var ox=px,oy=py,mx=dir==0?-STEP:dir==1?STEP:0,my=dir==2?-STEP:dir==3?STEP:0,nx=px+mx,ny=py+my,ncx,ncy;if(mx<0)face="left";else if(mx>0)face="right";else if(my<0)face="up";else face="down";if(turn--<=0||hit(nx,ny)){pick();return}px=nx;py=ny;pa=(pa+1)%3;ncx=camx(px);ncy=camy(py);if(ncx!=cx||ncy!=cy){full();return}restore(oy,py);drawPlayer();foot()}
function frame(){if(dead)return;step();h.flip();Pip.lastFlip=getTime()}
function menu(){if(dead)return;dead=1;if(fi)clearInterval(fi);fi=0;close();cm=sp=0;gc();if(A.menu)A.menu();else if(A.exit)A.exit()}
function k1(v,l){if(v===0&&!l)menu()}
function k2(v){}
open();pick();full();frame();fi=setInterval(frame,FRAME);return{k1:k1,k2:k2,remove:function(){dead=1;if(fi)clearInterval(fi);fi=0;close();cm=sp=0;gc()}};
})
