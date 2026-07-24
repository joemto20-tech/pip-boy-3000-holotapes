(function(A,arg){
var B=A.base,U=A.w,V=A.h,Y=192,sel=0,msg="",dead=0,caps=0,vt=0,cb=0,CAP=15;
var vendor=arg.vendor||"SUNSCAR TRADER",VR=arg.videoRoot||B+"VIDEO",F=arg.folder||"Shop";
var I=[
 {id:86377,name:"STIMPAK",price:35,own:0,im:0,file:"S.IMG"},
 {id:86375,name:"RADAWAY",price:20,own:0,im:0,file:"R.IMG"},
 {id:86376,name:"RAD-X",price:25,own:0,im:0,file:"X.IMG"},
 {id:831580,name:"DOCTOR'S BAG",price:55,own:0,im:0,file:"D.IMG"}
];
var VS="",VI="",VB="";
function ft(n){try{h.setFont("6x8",n||1)}catch(e){}}
function tx(s,n){s=s==null?"":String(s);return n&&s.length>n?s.substr(0,n-1)+"~":s}
function blit(y1,y2){var o=Pip.blitOptions;if(!o){A.flip();return}o.y1=Math.max(0,y1|0);o.y2=Math.max(o.y1,Math.min(V-1,y2|0));try{h.flip();if(typeof getTime=="function")Pip.lastFlip=getTime()}finally{delete o.y1;delete o.y2}}
function nv(){try{return typeof NV!="undefined"&&NV}catch(e){return 0}}
function ip(c){return"INV/"+(nv()?"NV":"F3")+"/"+c+".INV"}
function close(f){try{if(f&&f.close)f.close()}catch(e){}}
function exists(p){try{return!!fs.statSync(p)}catch(e){return false}}
function join(a,b){return a+(a&&a.charAt(a.length-1)=="/"?"":"/")+b}
function asset(n){try{return fs.readFile(B+n)}catch(e){return 0}}
function vp(n){var p=join(join(VR,F),n),g=join(join(VR,"Granny"),n);return exists(p)?p:(exists(g)?g:"")}
function count(f,id){var i,o,n=0;try{i=f.indexOf(id);if(i>=0){o=f.get(i);n=parseInt(o&&o.cnt,10)||0}}catch(e){}return n}
function load(){var f=0,i;try{f=new InvFile(ip("MISC"));caps=count(f,CAP)}catch(e){caps=0}finally{close(f)}try{f=new InvFile(ip("AID"));for(i=0;i<4;i++)I[i].own=count(f,I[i].id)}catch(e2){}finally{close(f)}for(i=0;i<4;i++)I[i].im=asset(I[i].file);VS=vp("BATTLE_START.avi");VI=vp("BATTLE_IDLE.avi");VB=vp("P_MOVE_1.avi")}
function writeCaps(n){var f=0,i,o,ok=0;n=Math.max(0,Math.floor(n));try{f=new InvFile(ip("MISC"));i=f.indexOf(CAP);if(n<1){if(i>=0)f.remove(i);ok=1}else if(i>=0){o=f.get(i)||{id:CAP};o.cnt=n;f.set(i,o);ok=1}else{o={id:CAP,cnt:n};if(f.append){f.append(o);ok=1}else if(f.add){f.add(o);ok=1}else if(f.push){f.push(o);ok=1}else if(f.set){f.set(parseInt(f.length,10)||0,o);ok=1}}if(ok&&f.sync)f.sync()}catch(e){ok=0}finally{close(f)}if(ok)caps=n;return ok}
function add(it){var f=0,i,o,ok=0;try{f=new InvFile(ip("AID"));i=f.indexOf(it.id);if(i>=0){o=f.get(i)||{};o.cnt=(parseInt(o.cnt,10)||0)+1;f.set(i,o);ok=1}else{o={id:it.id,cnt:1};if(f.append){f.append(o);ok=1}else if(f.add){f.add(o);ok=1}else if(f.push){f.push(o);ok=1}else if(f.set){f.set(parseInt(f.length,10)||0,o);ok=1}}if(ok&&f.sync)f.sync()}catch(e){ok=0}finally{close(f)}return ok}
function stop(){try{Pip.removeListener("videoStopped",ended)}catch(e){}if(vt){clearTimeout(vt);vt=0}cb=0;try{if(Pip.videoStop)Pip.videoStop()}catch(e2){}}
function ended(){var f=cb;cb=0;if(vt){clearTimeout(vt);vt=0}try{Pip.removeListener("videoStopped",ended)}catch(e){}if(f)try{f()}catch(e2){}}
function video(p,loop,next){stop();cb=next||0;if(!p){if(next)vt=setTimeout(ended,150);return}try{if(!loop)Pip.on("videoStopped",ended);Pip.videoStart(p,{x:0,y:0,repeat:!!loop,debug:false});if(next)vt=setTimeout(ended,120000)}catch(e){if(next)vt=setTimeout(ended,150)}}
function idle(){video(VI,1,0);draw()}
function icon(it,x,y){var im=it&&it.im;if(!im){h.setColor(2).drawRect(x,y,x+47,y+47);return}try{h.setColor(3).drawImage(im,x,y)}catch(e){}}
function draw(){var i,y,it=sel<4?I[sel]:0,n=5;h.setClipRect(0,Y,U-1,V-1);h.setColor(0).fillRect(0,Y,U-1,V-1);h.setColor(2).drawLine(0,Y,U-1,Y);h.setFontAlign(-1,-1);ft(1);h.setColor(3).drawString(tx(vendor,18),8,198);h.setColor(2).drawString("CAPS "+caps,330,198);h.setColor(2).drawRect(8,222,59,273);if(it){icon(it,10,224);h.setFontAlign(0,-1);h.drawString("OWN "+it.own,34,278)}else{h.setFontAlign(0,0);h.setColor(3).drawString("EXIT",34,248)}h.setFontAlign(0,-1);ft(1);h.setColor(2).drawString(tx(msg||"SELECT AN ITEM",42),U/2,210);for(i=0;i<n;i++){y=224+i*18;if(i==sel){h.setColor(2).fillRect(78,y-2,U-10,y+15);h.setColor(0)}else h.setColor(3);h.setFontAlign(-1,-1);if(i<4)h.drawString((i==sel?"> ":"  ")+I[i].name+"  "+I[i].price,92,y);else h.drawString((i==sel?"> ":"  ")+"LEAVE",92,y)}h.setClipRect(0,0,U-1,V-1);blit(Y,V-1)}
function buy(){var it=I[sel];if(!it)return;if(caps<it.price){msg="NEED "+it.price+" CAPS";draw();return}if(!writeCaps(caps-it.price)){msg="CAPS UPDATE FAILED";draw();return}if(!add(it)){writeCaps(caps+it.price);msg="BUY FAILED";draw();return}it.own++;msg="BOUGHT "+it.name;draw();video(VB,0,idle)}
function leave(){var q;if(dead)return;dead=1;stop();q={map:arg.map||"WORLD_01",mode:arg.mode||"tile",x:arg.x,y:arg.y,facing:arg.facing,msg:"TRADE CLOSED"};I=0;arg=0;if(A.returnWorld)A.returnWorld(q,520);else A.world(q)}
function k1(v,l){if(dead)return;if(v===0&&!l){if(sel<4)buy();else leave()}}
function k2(v){if(dead||!v)return;sel=(sel+(v<0?-1:1)+5)%5;msg="";draw()}
function remove(){dead=1;stop();I=0;arg=0;msg="";}
load();draw();video(VS,0,idle);return{k1:k1,k2:k2,remove:remove}
})
