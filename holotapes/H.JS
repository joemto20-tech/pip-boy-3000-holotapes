(function(A,arg){
arg=arg||{};
var B=A.base,W=A.w,H=A.h,FY=296,FRAME=40,TOTAL=500,dead=0,done=0,walk=!!arg.walk,fr=0,score=0,hits=0,jumps=0,scroll=0,px=106,py=146,dir=1,pose=0,bi=0,bk="",si=0,shi=0,cai=0,tm=0,lastShot=0;
var ex=[-99,-99,-99,-99,-99,-99],ey=[-99,-99,-99,-99,-99,-99],ea=[0,0,0,0,0,0],ev=[0,0,0,0,0,0];
var bx=[-99,-99,-99,-99],by=[-99,-99,-99,-99],ba=[0,0,0,0];
var gx=0,gl=0,ga=0,go=0,jp=0,cr=0;
function ft(n){try{h.setFont("6x8",n||1)}catch(e){}}
function rd(p){try{return fs.readFile(p)}catch(e){return 0}}
function pp(){try{return player&&player.player?player.player:{}}catch(e){return{}}}
function sync(){try{player.modified=true;if(player.sync)player.sync()}catch(e){}}
function cl(v,a,b){return v<a?a:v>b?b:v}
function bike(){var k=dir<0?"BL":dir==2?"BD":dir==0?"BU":"BR",d;if(k==bk)return bi;bk=k;d=rd(B+k+".BIN");bi=d&&d.length>=441?{width:42,height:42,bpp:2,transparent:0,buffer:d}:0;return bi}
function img(n,w,h,z){var d=rd(B+n);return d&&d.length>=z?{width:w,height:h,bpp:2,transparent:0,buffer:d}:0}
function simg(){return si||(si=img("SC.BIN",56,56,784))}
function shimg(){return shi||(shi=img("SH.BIN",32,32,256))}
function caimg(){return cai||(cai=img("CA.BIN",32,32,256))}
function shrub(x,y){var im=shimg();if(im)try{h.setColor(3).drawImage(im,x,y);return}catch(e){}h.setColor(2).fillRect(x+8,y+18,x+18,y+24)}
function cactus(x,y){var im=caimg();if(im)try{h.setColor(3).drawImage(im,x,y);return}catch(e){}h.setColor(2).fillRect(x+12,y+3,x+18,y+25)}
function back(){var x,i;h.setColor(3).fillRect(0,0,W-1,FY-1);h.setColor(1).fillRect(0,56,W-1,78);h.fillRect(0,236,W-1,295);h.setColor(2).fillRect(0,92,W-1,204);h.setColor(1).drawLine(0,99,W-1,99);h.drawLine(0,198,W-1,198);for(i=0;i<8;i++){x=(i*94-scroll)%620-40;h.setColor(3).fillRect(x,145,x+32,151)}h.setColor(1);for(i=0;i<22;i++){x=(i*29-scroll)%520-6;h.fillRect(x,68+(i%2)*5,x+1,69+(i%2)*5);h.fillRect(x,225+((i+1)%2)*5,x+1,226+((i+1)%2)*5)}for(i=0;i<5;i++){x=(i*118-scroll*2)%760-48;cactus(x,56)}for(i=0;i<6;i++){x=(i*97-scroll*3)%760-32;shrub(x,74)}for(i=0;i<5;i++){x=(i*133-scroll*2)%780-32;cactus(x,216)}for(i=0;i<6;i++){x=(i*88-scroll*3)%760-28;shrub(x,242)}}
function scorp(x,y){var im=simg();if(im)try{h.setColor(3).drawImage(im,x,y);return}catch(e){}h.setColor(0).fillRect(x+12,y+20,x+42,y+38);h.setColor(3).drawLine(x+12,y+22,x+2,y+10);h.drawLine(x+42,y+22,x+53,y+10);h.drawLine(x+12,y+36,x+2,y+49);h.drawLine(x+42,y+36,x+53,y+49);h.drawLine(x+27,y+20,x+37,y+5);h.drawLine(x+37,y+5,x+50,y+10);h.setColor(2).fillRect(x+20,y+13,x+34,y+25)}
function lane(){return cl(Math.round((py-108)/38),0,2)}
function gapDraw(){var y,x=gx;if(!ga)return;h.setColor(0).fillRect(x,92,x+58,204);h.setColor(1).fillPoly([x,92,x+11,102,x+22,94,x+34,104,x+46,93,x+58,101,x+58,92]);h.fillPoly([x,204,x+10,194,x+23,203,x+36,193,x+48,202,x+58,194,x+58,204]);y=101+gl*38;h.setColor(2).fillPoly([x-12,y+27,x+7,y+6,x+56,y+6,x+72,y+27]);h.setColor(3).drawLine(x-8,y+24,x+10,y+9);h.drawLine(x+54,y+9,x+68,y+24);h.drawLine(x+8,y+6,x+56,y+6)}
function gapStep(){var l;if(!ga&&fr%135==55){ga=1;go=0;gx=W+22;gl=Math.floor(Math.random()*3)}if(!ga)return;gx-=9;if(!go&&gx<=px+39&&gx+58>=px){go=1;l=lane();if(l==gl){score+=150;jumps++;jp=10}else{score=Math.max(0,score-100);cr=6}}if(gx<-75)ga=0}
function spawn(){var i,l;for(i=0;i<6;i++)if(!ea[i]){l=Math.floor(Math.random()*3);ex[i]=W+20;ey[i]=108+l*38;ev[i]=6+Math.floor(Math.random()*3);ea[i]=1;return}}
function fire(){var i;for(i=0;i<4;i++)if(!ba[i]){bx[i]=px+36;by[i]=py+16;ba[i]=1;return}}
function collide(){var i,j;if(fr%14==0)spawn();for(i=0;i<6;i++)if(ea[i]){ex[i]-=ev[i];if(ex[i]<-60){ea[i]=0;continue}if(Math.abs(ex[i]+26-(px+22))<34&&Math.abs(ey[i]+26-(py+21))<30){ea[i]=0;score=Math.max(0,score-50);cr=4}}for(j=0;j<4;j++)if(ba[j]){bx[j]+=13;if(bx[j]>W-8){ba[j]=0;continue}for(i=0;i<6;i++)if(ea[i]&&Math.abs(bx[j]-(ex[i]+28))<28&&Math.abs(by[j]-(ey[i]+24))<26){ba[j]=0;ea[i]=0;score+=100;hits++;break}}}
function draw(){var i,im,left=Math.max(0,20-Math.floor(fr/25)),jy=0;back();gapDraw();for(i=0;i<6;i++)if(ea[i])scorp(ex[i],ey[i]);h.setColor(3);for(i=0;i<4;i++)if(ba[i])h.fillRect(bx[i],by[i]-2,bx[i]+8,by[i]+2);if(jp)jy=-Math.min(jp,10-jp)*4;im=bike();if(im)try{h.drawImage(im,px,py+jy)}catch(e){}else{h.setColor(0).fillRect(px+5,py+12+jy,px+36,py+30+jy);h.setColor(3).drawCircle(px+9,py+34+jy,7);h.drawCircle(px+33,py+34+jy,7)}if(cr){h.setColor(0).drawRect(2,29,W-3,FY-3);h.drawRect(5,32,W-6,FY-6)}h.setColor(0).fillRect(0,0,W-1,27);h.setFontAlign(-1,-1);ft(1);h.setColor(3).drawString("DOGTOWN RUN",8,7);h.setFontAlign(0,-1);h.drawString("TIME "+left+"  JUMP "+jumps,W/2,7);h.setFontAlign(1,-1);h.drawString("SCORE "+score,W-8,7);h.setColor(0).fillRect(0,FY,W-1,H-1);h.setFontAlign(0,0);h.setColor(2).drawString("CHANGE LANES FOR THE RAMP / CLICK SHOOTS",W/2,FY+11)}
function save(){var p=pp(),s=p.wb||{};s.story=s.story||{};if(!walk){s.story.bikeStolen=1;s.story.motorcycle=1;s.story.bikeRunComplete=1;s.story.bikeTakenAt="ROTS_CROSSING"}s.story.bikeScore=Math.max(parseInt(s.story.bikeScore,10)||0,score);s.story.bikeHits=Math.max(parseInt(s.story.bikeHits,10)||0,hits);s.story.bikeJumps=Math.max(parseInt(s.story.bikeJumps,10)||0,jumps);s.map="WORLD_02";p.wb=s;sync()}
function result(){h.setColor(0).fillRect(0,0,W-1,H-1);h.setColor(2).drawRect(12,12,W-13,H-13);h.setFontAlign(0,0);ft(3);h.setColor(3).drawString("DOGTOWN HEIGHTS",W/2,62);ft(2);h.drawString(walk?"ARRIVED ON FOOT":"MOTORCYCLE ADDED TO INVENTORY",W/2,112);h.setColor(2).drawString("SCORE "+score+"  HITS "+hits+"  JUMPS "+jumps,W/2,158);ft(1);h.drawString("LEFT CLICK TO ENTER DOGTOWN HEIGHTS",W/2,246);h.flip();Pip.lastFlip=getTime()}
function finish(){if(done)return;done=1;if(tm)clearInterval(tm);tm=0;save();result()}
function frame(){if(dead||done)return;if(walk){fr++;if(fr>45)finish();else{h.setColor(0).fillRect(0,0,W-1,H-1);h.setFontAlign(0,0);ft(3);h.setColor(3).drawString("WALKING SOUTH",W/2,118);ft(1);h.setColor(2).drawString("THE MOTORCYCLE STAYS BEHIND",W/2,166);h.flip();Pip.lastFlip=getTime()}return}fr++;scroll=(scroll+9)%780;gapStep();collide();draw();h.flip();Pip.lastFlip=getTime();if(pose>0)pose--;else dir=1;if(jp)jp--;if(cr)cr--;if(fr>=TOTAL)finish()}
function leave(){var q;if(dead)return;dead=1;if(tm)clearInterval(tm);tm=0;q={map:"WORLD_03",mode:"image",x:820,y:850,facing:"up",bikeEquip:0,msg:walk?"ARRIVED AT DOGTOWN HEIGHTS":"MOTORCYCLE UNLOCKED - ARRIVED AT DOGTOWN"};ex=ey=ea=ev=bx=by=ba=bi=si=shi=cai=0;A.world(q)}
function k1(v,l){var now;if(dead)return;if(done){if(v===0&&!l)leave();return}if(walk)return;if(v!==0){dir=v>0?2:0;pose=5;py+=v>0?38:-38;py=108+lane()*38;return}if(l)return;try{now=getTime()}catch(e){now=0}if(now&&lastShot&&now-lastShot<.12)return;lastShot=now||lastShot+1;fire()}
function k2(v){if(dead||done||walk||!v)return;dir=v<0?-1:1;pose=4;px+=v<0?-14:14;if(px<76)px=76;if(px>180)px=180}
function remove(){dead=1;if(tm)clearInterval(tm);tm=0;ex=ey=ea=ev=bx=by=ba=bi=si=shi=cai=0}
frame();tm=setInterval(frame,FRAME);return{k1:k1,k2:k2,remove:remove};
})
