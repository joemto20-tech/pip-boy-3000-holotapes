(function (global) {
  "use strict";

  function clean(value, fallback) {
    return String(value || fallback || "").replace(/[\r\n\t]+/g, " ").trim();
  }
  function fileName(assetId) {
    var value = String(assetId || "");
    var path = value.indexOf(":") >= 0 ? value.slice(value.indexOf(":") + 1) : value;
    return path.split(/[\\/]/).pop() || "";
  }
  function lookupAssets(assets) {
    var result = {};
    (assets || []).forEach(function (asset) { result[asset.id] = asset; });
    return result;
  }
  function dialogueData(project, ids) {
    var result = {};
    (project.dialogues || []).forEach(function (dialogue) {
      if (!ids.has(dialogue.id)) return;
      result[dialogue.id] = (dialogue.nodes || []).map(function (node) {
        return [
          clean(node.id, "node"),
          clean(node.text, "..."),
          (node.choices || []).slice(0, 3).map(function (choice) {
            return [clean(choice.label, "CONTINUE"), clean(choice.action, "close"), clean(choice.target), clean(choice.next), clean(choice.interact), choice.once ? 1 : 0, clean(choice.bullet), choice.miniboss ? 1 : 0];
          })
        ];
      });
    });
    return result;
  }
  function sceneConfig(scene, project, assets, interior) {
    var assetMap = lookupAssets(assets);
    var dialogueIds = new Set();
    var npcs = [];
    var zones = [];
    (scene.entities || []).forEach(function (entity) {
      if (entity.dialogueId) dialogueIds.add(entity.dialogueId);
      if (entity.type === "npc" || entity.type === "companion") {
        var asset = assetMap[entity.spriteAssetId] || {};
        npcs.push([
          clean(entity.id, "npc"), clean(entity.name, "NPC"), Math.round(entity.x || 0), Math.round(entity.y || 0),
          Math.round(entity.width || 34), Math.round(entity.height || 34), entity.solid === false ? 0 : 1,
          fileName(entity.spriteAssetId), clean(entity.facing, "down"), clean(entity.movement && entity.movement.type, "static"),
          clean(entity.movement && entity.movement.axis, "x"), Math.round(entity.movement && entity.movement.distance || 0),
          Math.max(1, Math.round(entity.movement && entity.movement.speed || 1)), clean(entity.dialogueId),
          asset.width === 102 ? 3 : 1, Math.max(24, Math.round(entity.interactionRange || 44))
        ]);
      } else {
        var action = entity.action || {};
        zones.push([
          clean(entity.id, entity.type), clean(entity.type, "trigger"), clean(entity.name, entity.type),
          Math.round(entity.x || 0), Math.round(entity.y || 0), Math.round(entity.width || 48), Math.round(entity.height || 48),
          entity.solid ? 1 : 0, clean(entity.prompt, "INTERACT?"), clean(action.type, entity.type === "exit" ? "world" : "close"),
          clean(action.target), entity.once ? 1 : 0, clean(entity.dialogueId || action.dialogue), clean(action.bullet), action.miniboss ? 1 : 0
        ]);
      }
    });
    return {
      id: clean(scene.id, interior ? "INTERIOR" : "WORLD_01"),
      name: clean(scene.name, scene.id),
      width: Math.round(scene.width || (interior ? 480 : 1440)),
      height: Math.round(scene.height || (interior ? 456 : 1080)),
      background: (interior ? "INT_" : "MAP_") + clean(scene.id).toUpperCase() + ".BIN",
      collision: interior ? (scene.collisionRects || []).map(function (rect) { return [Math.round(rect.x), Math.round(rect.y), Math.round(rect.width), Math.round(rect.height)]; }) : "COL_" + clean(scene.id).toUpperCase() + ".BIN",
      spawn: [Math.round(scene.spawn && scene.spawn.x || 0), Math.round(scene.spawn && scene.spawn.y || 0), clean(scene.spawn && scene.spawn.facing, "down")],
      npcs: npcs,
      zones: zones,
      dialogues: dialogueData(project, dialogueIds)
    };
  }

  function dispatcher(kind, ids) {
    var prefix = kind === "world" ? "W_" : "INT_";
    var fallback = ids[0] || (kind === "world" ? "WORLD_01" : "INTERIOR");
    var argument = kind === "world" ? "arg.map" : "arg.interiorId";
    return "(function(A,arg){\n" +
      "  var n=String(" + argument + "||\"" + fallback + "\").toUpperCase().replace(/[^A-Z0-9_]/g,\"\");\n" +
      "  var s=0,f=0,m=0;\n" +
      "  try{s=fs.readFile(A.base+\"CODE/" + prefix + "\"+n+\".JS\");if(!s)throw n;f=eval(s);s=0;if(A.gc)A.gc();m=f(A,arg||{});f=0;return m;}\n" +
      "  catch(e){s=f=0;throw \"" + prefix + "\"+n+\":\"+e;}\n" +
      "})\n";
  }

  function worldModule(scene, project, assets) {
    var config = JSON.stringify(sceneConfig(scene, project, assets, false));
    return `(function(A,arg){
  var C=${config};
  var B=A.base,W=A.w,H=A.h,FY=296,RB=120,PAGE=35520,STEP=6,FRAME=40,CLICK=280;
  var bg=0,cm=0,state=0,px=C.spawn[0],py=C.spawn[1],face=C.spawn[2],msg=C.name,act=0,dead=0,busy=0;
  var sp=0,sk="",pa=1,cx=0,cy=0,pg=-1,qx=0,qy=0,footKey="",timer=0,clickTimer=0,tick=0;
  var npcImage=0,npcKey="",drag=0,dialogue="",node="",choice=0;
  function gc(){try{A.gc()}catch(e){}}
  function font(n){try{h.setFont("6x8",n||1)}catch(e){}}
  function text(v,n){v=v==null?"":String(v);return n&&v.length>n?v.substr(0,n-1)+"~":v}
  function pdata(){try{return player&&player.player?player.player:{}}catch(e){return{}}}
  function read(p){try{return fs.readFile(p)}catch(e){return 0}}
  function write(p,d){try{if(fs.writeFileSync){fs.writeFileSync(p,d);return 1}}catch(e){}try{if(fs.writeFile){fs.writeFile(p,d);return 1}}catch(e2){}return 0}
  function sync(){try{player.modified=true;if(player.sync)player.sync()}catch(e){}}
  function close(){try{if(bg&&bg.close)bg.close()}catch(e){}bg=0}
  function open(){try{bg=E.openFile(B+"DATA/"+C.background,"r")}catch(e){bg=0}if(!bg)throw C.background;cm=read(B+"DATA/"+C.collision);if(!cm||cm.length<1350)throw C.collision}
  function loadState(){var p=pdata(),q=0;if(p.wb&&p.wb.map)return p.wb;try{q=JSON.parse(read(B+"SAVE/STATE.JSON")||"{}")}catch(e){q={}}return q||{}}
  function story(){state.story=state.story||{};state.story.rounds=state.story.rounds||{};state.story.encounters=state.story.encounters||0;state.story.deadLead=state.story.deadLead||0;return state.story}
  function save(){var p=pdata(),d;state.cleared=state.cleared||{};story();state.map=C.id;state.mode="image";state.x=px;state.y=py;state.facing=face;try{p.wb=state;sync()}catch(e){}d=JSON.stringify(state);write(B+"SAVE/STATE.JSON",d);return 1}
  function cleared(id){return!!(state.cleared&&state.cleared[id])}
  function playerImage(){var k=face=="down"?"PLAYER_SPRITEDOWN":face=="left"?"PLAYER_SPRITEL":face=="right"?"PLAYER_SPRITER":"PLAYER_SPRITEUP",d;if(sk==k)return sp;sp=0;sk=k;d=read(B+"DATA/"+k+".BIN");if(d&&d.length>=867)sp={width:102,height:34,bpp:2,transparent:0,buffer:d};else sp=read(B+"DATA/"+k+".IMG")||0;return sp}
  function getNpcImage(n){var k=n[7],d;if(!k)return 0;if(n[9]=="follow"&&k=="DD.IMG"){d=n[8]=="left"?"L":n[8]=="right"?"R":n[8]=="up"?"U":"D";k="D"+d+".IMG"}if(npcKey==k)return npcImage;npcImage=0;npcKey=k;npcImage=read(B+"DATA/"+k)||0;return npcImage}
  function cameraX(x){x+=17;return x<360?0:x<600?240:x<840?480:x<1080?720:960}
  function cameraY(y){y+=17;return y<246?0:y<442?196:y<638?392:y<834?588:784}
  function page(){return((cy/196)|0)*5+((cx/240)|0)}
  function fullBackground(){var target=new Uint8Array(h.buffer),left=PAGE,offset=0,chunk,count;pg=page();bg.seek(pg*PAGE);while(left>0){count=left>512?512:left;chunk=bg.read(count);if(!chunk)break;target.set(chunk,offset);offset+=chunk.length;left-=chunk.length}target=0}
  function restoreBand(a,b,c,d){var target,y0,y1,left,offset,count,value;if(!bg)return;y0=Math.min(a,b,c,d)-cy;y1=Math.max(a,b,c,d)+38-cy;y0=Math.max(0,y0|0);y1=Math.min(FY,y1|0);if(y1<=y0)return;left=(y1-y0)*RB;offset=y0*RB;bg.seek(pg*PAGE+offset);target=new Uint8Array(h.buffer);while(left>0){count=left>512?512:left;value=bg.read(count);if(!value)break;target.set(value,offset);offset+=value.length;left-=value.length}target=0}
  function drawPlayer(){var im=playerImage(),x=px-cx,y=py-cy;if(im)try{h.setClipRect(x,y,x+33,y+33);h.setColor(3).drawImage(im,x-(pa%3)*34,y);h.setClipRect(0,0,W-1,H-1);return}catch(e){try{h.setClipRect(0,0,W-1,H-1)}catch(e2){}}h.setColor(3).drawRect(x+9,y+5,x+24,y+30)}
  function drawNpc(n){var x=n[2]-cx,y=n[3]-cy,im;if(x+n[4]<0||y+n[5]<0||x>=W||y>=FY)return;im=getNpcImage(n);if(im)try{h.setClipRect(x,y,x+n[4]-1,y+n[5]-1);h.setColor(3).drawImage(im,x-(n[14]>1?(tick%3)*34:0),y);h.setClipRect(0,0,W-1,H-1);return}catch(e){try{h.setClipRect(0,0,W-1,H-1)}catch(e2){}}h.setColor(2).fillRect(x+9,y+5,x+24,y+20);h.setColor(3).drawLine(x+16,y+20,x+16,y+31)}
  function drawNpcs(){var i;for(i=0;i<C.npcs.length;i++)drawNpc(C.npcs[i])}
  function bit(x,y){var index,byte;if(x<0||y<0||x>=120||y>=90)return 1;index=y*120+x;byte=cm.charCodeAt?cm.charCodeAt(index>>3):cm[index>>3];return(byte>>(7-(index&7)))&1}
  function overlaps(nx,ny,n){var x1=nx+9,x2=nx+25,y1=ny+25,y2=ny+33;return x2>=n[2]&&x1<n[2]+n[4]&&y2>=n[3]&&y1<n[3]+n[5]}
  function hit(nx,ny){var x1=nx+9,x2=nx+25,y1=ny+25,y2=ny+33,i,n;if(bit((x1/12)|0,(y1/12)|0)||bit((x2/12)|0,(y1/12)|0)||bit((x1/12)|0,(y2/12)|0)||bit((x2/12)|0,(y2/12)|0))return 1;for(i=0;i<C.npcs.length;i++){n=C.npcs[i];if(n[6]&&overlaps(nx,ny,n))return 1}return 0}
  function center(){return[px+17,py+30]}
  function nearRect(x,y,w,h,range){var p=center(),cx0=x+w/2,cy0=y+h/2;return Math.abs(p[0]-cx0)<=w/2+range&&Math.abs(p[1]-cy0)<=h/2+range}
  function find(){var i,n,z;for(i=0;i<C.npcs.length;i++){n=C.npcs[i];if(n[13]&&nearRect(n[2],n[3],n[4],n[5],n[15]))return[0,i]}for(i=0;i<C.zones.length;i++){z=C.zones[i];if(z[11]&&cleared(z[0]))continue;if(nearRect(z[3],z[4],z[5],z[6],8))return[1,i]}return 0}
  function prompt(a){var item;if(!a)return msg;item=a[0]?C.zones[a[1]]:C.npcs[a[1]];return a[0]?item[8]:"TALK TO "+item[1]+"?"}
  function footer(force){var a=find(),label=prompt(a),key=(a?a[0]+":"+a[1]:"-")+"|"+label;act=a;if(!force&&key==footKey)return;footKey=key;h.setClipRect(0,FY,W-1,H-1);h.setColor(0).fillRect(0,FY,W-1,H-1);h.setColor(2).drawLine(0,FY-1,W-1,FY-1);h.setColor(3).fillPoly([6,FY-22,6,FY-4,22,FY-13]);font(2);h.setFontAlign(0,0);h.setColor(a?3:2).drawString(text(label,38),W/2,FY+11);h.setClipRect(0,0,W-1,H-1)}
  function full(){if(dead)return;cx=cameraX(px);cy=cameraY(py);fullBackground();drawNpcs();drawPlayer();footer(1)}
  function stand(){if(pa==1)return;pa=1;restoreBand(py,py,py,py);drawNpcs();drawPlayer();footer(0)}
  function move(mx,my){var ox=px,oy=py,nx=px+mx,ny=py+my,ncx,ncy;if(busy||dialogue)return;if(mx<0)face="left";else if(mx>0)face="right";else if(my>0)face="down";else face="up";if(!hit(nx,ny)){px=nx;py=ny;msg="";pa=(pa+1)%3}else pa=1;ncx=cameraX(px);ncy=cameraY(py);if(ncx!=cx||ncy!=cy){full();return}restoreBand(oy,py,oy,py);drawNpcs();drawPlayer();footer(0)}
  function moveNpcs(){var i,n,old,moved=0,minY=99999,maxY=0,step,xd,yd;if(dialogue||busy)return;for(i=0;i<C.npcs.length;i++){n=C.npcs[i];if(n[9]=="static"||!n[11])continue;if(n.length<19){n[16]=n[2];n[17]=n[3];n[18]=1}old=n[3];step=n[12];if(n[9]=="follow"){xd=px-n[2];yd=py-n[3];if(Math.abs(xd)+Math.abs(yd)<=n[11])continue;if(Math.abs(xd)>Math.abs(yd)){n[2]+=xd<0?-step:step;n[8]=xd<0?"left":"right"}else{n[3]+=yd<0?-step:step;n[8]=yd<0?"up":"down"}}else{if(n[9]=="wander"&&Math.random()<.35)n[18]=-n[18];if(n[10]=="y")n[3]+=step*n[18];else n[2]+=step*n[18];if(Math.abs((n[10]=="y"?n[3]-n[17]:n[2]-n[16]))>=n[11])n[18]=-n[18]}minY=Math.min(minY,old,n[3]);maxY=Math.max(maxY,old,n[3]);moved=1}if(moved){restoreBand(minY,maxY,minY,maxY);drawNpcs();drawPlayer();footer(0)}}
  function wrap(value,size){var words=String(value||"").split(" "),lines=[],line="",i,next;for(i=0;i<words.length;i++){next=line?(line+" "+words[i]):words[i];if(next.length>size&&line){lines.push(line);line=words[i]}else line=next}if(line)lines.push(line);return lines.slice(0,3)}
  function dialogueNode(){var rows=C.dialogues[dialogue]||[],i;for(i=0;i<rows.length;i++)if(rows[i][0]==node)return rows[i];return rows[0]}
  function drawDialogue(){var row=dialogueNode(),lines=wrap(row?row[1]:"...",48),i,choices=row?row[2]:[];h.setClipRect(0,176,W-1,H-1);h.setColor(0).fillRect(0,176,W-1,H-1);h.setColor(2).drawRect(8,184,W-9,H-9);h.setFontAlign(-1,-1);font(1);h.setColor(3);for(i=0;i<lines.length;i++)h.drawString(lines[i],20,196+i*13);for(i=0;i<choices.length;i++){h.setColor(i==choice?3:2);h.drawString((i==choice?"> ":"  ")+text(choices[i][0],18),32,244+i*18)}h.setClipRect(0,0,W-1,H-1)}
  function beginDialogue(id){var rows=C.dialogues[id];if(!rows||!rows.length){msg="NO DIALOGUE";footer(1);return}dialogue=id;node=rows[0][0];choice=0;drawDialogue()}
  function endDialogue(){dialogue="";node="";choice=0;full()}
  function transition(type,target,label,interact,once,bullet,miniboss){var data={map:C.id,mode:"image",x:px,y:py,facing:face,msg:label||""};busy=1;save();if(interact)data.interact=interact;if(once)data.once=true;if(bullet)data.bullet=bullet;if(miniboss)data.miniboss=true;if(type=="battle"){data.enemy=target||"RANDOM";A.battle(data)}else if(type=="shop"){data.vendor=label||"TRADER";data.folder=target||"Shop";A.shop(data)}else if(type=="confrontation"){data.enemy=target||"RAIDER";data.name=label||target;data.dlg=dialogueNode()?dialogueNode()[1]:"YOU READY?";A.interior(data)}else if(type=="interior"){data.interiorId=target;A.house(data)}else if(type=="world"){data.map=target||C.id;delete data.x;delete data.y;delete data.facing;A.world(data)}else if(type=="exit")A.exit();else{busy=0;endDialogue()}}
  function chooseDialogue(){var row=dialogueNode(),c;if(!row||!row[2].length){endDialogue();return}c=row[2][choice];if((c[1]=="next"||c[1]=="continue")&&c[3]){node=c[3];choice=0;drawDialogue()}else if(c[1]=="close"||c[1]=="continue")endDialogue();else transition(c[1],c[2],row[1],c[4],c[5],c[6],c[7])}
  function activate(){var item,dialogueId,type,target;if(!act){msg="NOTHING HERE";footer(1);return}item=act[0]?C.zones[act[1]]:C.npcs[act[1]];dialogueId=act[0]?item[12]:item[13];if(dialogueId){beginDialogue(dialogueId);return}if(act[0]){type=item[9];target=item[10];transition(type,target,item[2],item[0],item[11],item[13],item[14])}}
  function pause(){if(busy||dialogue)return;qx=qy=0;save();A.pause({map:C.id,mode:"image",x:px,y:py,facing:face,city:C.name,story:story(),msg:msg})}
  function click(){if(dialogue){chooseDialogue();return}if(clickTimer){clearTimeout(clickTimer);clickTimer=0;pause()}else clickTimer=setTimeout(function(){clickTimer=0;if(!dead)activate()},CLICK)}
  function queue(x,y){var limit=STEP*4;if(dead||busy||dialogue)return;if(x){qx+=x<0?-STEP:STEP;qx=Math.max(-limit,Math.min(limit,qx));qy=0}else{qy+=y<0?-STEP:STEP;qy=Math.max(-limit,Math.min(limit,qy));qx=0}}
  function frame(){var x=0,y=0;if(dead)return;tick++;if(!busy&&!dialogue){if(qx){x=qx<0?-STEP:STEP;qx-=x}else if(qy){y=qy<0?-STEP:STEP;qy-=y}if(x||y)move(x,y);else stand();if(!(tick%12))moveNpcs()}h.flip();Pip.lastFlip=getTime()}
  function k1(value,longPress){if(dead)return;if(value===0&&!longPress){click();return}if(clickTimer){clearTimeout(clickTimer);clickTimer=0}if(dialogue)return;queue(0,value)}
  function k2(value){var row;if(dead||!value)return;if(clickTimer){clearTimeout(clickTimer);clickTimer=0}if(dialogue){row=dialogueNode();if(row&&row[2].length){choice=(choice+(value<0?-1:1)+row[2].length)%row[2].length;drawDialogue()}return}queue(value,0)}
  function remove(){dead=1;if(timer)clearInterval(timer);if(clickTimer)clearTimeout(clickTimer);timer=clickTimer=0;close();cm=state=sp=npcImage=0;gc()}
  state=loadState();state.cleared=state.cleared||{};story();if(arg.newGame)state={map:"",cleared:{},story:{rounds:{},encounters:0,deadLead:0}};if(arg&&arg.x!==undefined&&(!arg.map||arg.map==C.id)){px=parseInt(arg.x,10);py=parseInt(arg.y,10);face=arg.facing||C.spawn[2]}else if(state.map==C.id&&state.x!==undefined){px=parseInt(state.x,10);py=parseInt(state.y,10);face=state.facing||C.spawn[2]}if(isNaN(px)||isNaN(py)||px<0||py<0||px>C.width-34||py>C.height-34){px=C.spawn[0];py=C.spawn[1];face=C.spawn[2]}if(arg.msg)msg=arg.msg;open();if(A.music)A.music(0);full();frame();timer=setInterval(frame,FRAME);return{k1:k1,k2:k2,save:save,remove:remove};
})
`;
  }

  function interiorModule(scene, project, assets) {
    var config = JSON.stringify(sceneConfig(scene, project, assets, true));
    return `(function(A,arg){
  var C=${config};
  var B=A.base,W=A.w,H=A.h,FY=296,RB=120,STEP=6,FRAME=40;
  var px=C.spawn[0],py=C.spawn[1],face=C.spawn[2],cy=0,msg=C.name,act=0,dead=0,busy=0,bg=0,sp=0,sk="",pa=1,qx=0,qy=0,timer=0;
  var npcImage=0,npcKey="",dialogue="",node="",choice=0,tick=0;
  function font(n){try{h.setFont("6x8",n||1)}catch(e){}}
  function text(v,n){v=v==null?"":String(v);return n&&v.length>n?v.substr(0,n-1)+"~":v}
  function read(p){try{return fs.readFile(p)}catch(e){return 0}}
  function close(){try{if(bg&&bg.close)bg.close()}catch(e){}bg=0}
  function open(){try{bg=E.openFile(B+"DATA/"+C.background,"r")}catch(e){bg=0}if(!bg)throw C.background}
  function playerImage(){var k=face=="down"?"PLAYER_SPRITEDOWN":face=="left"?"PLAYER_SPRITEL":face=="right"?"PLAYER_SPRITER":"PLAYER_SPRITEUP";if(sk==k)return sp;sp=0;sk=k;sp=read(B+"DATA/"+k+".IMG")||0;return sp}
  function getNpcImage(n){var k=n[7];if(!k)return 0;if(npcKey==k)return npcImage;npcImage=0;npcKey=k;npcImage=read(B+"DATA/"+k)||0;return npcImage}
  function camera(y){var max=Math.max(0,C.height-FY),value=Math.floor((y+17-FY/2)/80)*80;return Math.max(0,Math.min(max,value))}
  function fullBackground(){var target=new Uint8Array(h.buffer),left=FY*RB,offset=0,chunk,count;bg.seek(cy*RB);while(left>0){count=left>512?512:left;chunk=bg.read(count);if(!chunk)break;target.set(chunk,offset);offset+=chunk.length;left-=chunk.length}target=0}
  function restoreBand(a,b){var target,y0=Math.max(0,Math.min(a,b)-cy),y1=Math.min(FY,Math.max(a,b)+38-cy),left,offset,count,value;if(y1<=y0)return;left=(y1-y0)*RB;offset=y0*RB;bg.seek((cy+y0)*RB);target=new Uint8Array(h.buffer);while(left>0){count=left>512?512:left;value=bg.read(count);if(!value)break;target.set(value,offset);offset+=value.length;left-=value.length}target=0}
  function drawPlayer(){var im=playerImage(),y=py-cy;if(im)try{h.setClipRect(px,y,px+33,y+33);h.setColor(3).drawImage(im,px-(pa%3)*34,y);h.setClipRect(0,0,W-1,H-1);return}catch(e){try{h.setClipRect(0,0,W-1,H-1)}catch(e2){}}h.setColor(3).drawRect(px+9,y+5,px+24,y+30)}
  function drawNpc(n){var x=n[2],y=n[3]-cy,im;if(y+n[5]<0||y>=FY)return;im=getNpcImage(n);if(im)try{h.setClipRect(x,y,x+n[4]-1,y+n[5]-1);h.setColor(3).drawImage(im,x-(n[14]>1?(tick%3)*34:0),y);h.setClipRect(0,0,W-1,H-1);return}catch(e){try{h.setClipRect(0,0,W-1,H-1)}catch(e2){}}h.setColor(2).fillRect(x+9,y+5,x+24,y+20)}
  function drawNpcs(){var i;for(i=0;i<C.npcs.length;i++)drawNpc(C.npcs[i])}
  function overlaps(nx,ny,x,y,w,h){var x1=nx+9,x2=nx+25,y1=ny+25,y2=ny+33;return x2>=x&&x1<x+w&&y2>=y&&y1<y+h}
  function hit(nx,ny){var i,r,n;if(nx<0||nx+34>W||ny<0||ny+34>C.height)return 1;for(i=0;i<C.collision.length;i++){r=C.collision[i];if(overlaps(nx,ny,r[0],r[1],r[2],r[3]))return 1}for(i=0;i<C.npcs.length;i++){n=C.npcs[i];if(n[6]&&overlaps(nx,ny,n[2],n[3],n[4],n[5]))return 1}return 0}
  function center(){return[px+17,py+30]}
  function nearRect(x,y,w,h,range){var p=center();return Math.abs(p[0]-(x+w/2))<=w/2+range&&Math.abs(p[1]-(y+h/2))<=h/2+range}
  function find(){var i,n,z;for(i=0;i<C.npcs.length;i++){n=C.npcs[i];if(n[13]&&nearRect(n[2],n[3],n[4],n[5],n[15]))return[0,i]}for(i=0;i<C.zones.length;i++){z=C.zones[i];if(nearRect(z[3],z[4],z[5],z[6],8))return[1,i]}return 0}
  function footer(){var item,label;act=find();item=act?(act[0]?C.zones[act[1]]:C.npcs[act[1]]):0;label=item?(act[0]?item[8]:"TALK TO "+item[1]+"?"):msg;h.setClipRect(0,FY,W-1,H-1);h.setColor(0).fillRect(0,FY,W-1,H-1);h.setColor(2).drawLine(0,FY-1,W-1,FY-1);h.setFontAlign(0,0);font(2);h.setColor(item?3:2).drawString(text(label,40),W/2,FY+11);h.setClipRect(0,0,W-1,H-1)}
  function full(){cy=camera(py);fullBackground();drawNpcs();drawPlayer();footer()}
  function move(mx,my){var old=py,nx=px+mx,ny=py+my,next;if(busy||dialogue)return;if(mx<0)face="left";else if(mx>0)face="right";else if(my>0)face="down";else face="up";if(!hit(nx,ny)){px=nx;py=ny;msg="";pa=(pa+1)%3}else pa=1;next=camera(py);if(next!=cy){full();return}restoreBand(old,py);drawNpcs();drawPlayer();footer()}
  function wrap(value,size){var words=String(value||"").split(" "),lines=[],line="",i,next;for(i=0;i<words.length;i++){next=line?(line+" "+words[i]):words[i];if(next.length>size&&line){lines.push(line);line=words[i]}else line=next}if(line)lines.push(line);return lines.slice(0,3)}
  function dialogueNode(){var rows=C.dialogues[dialogue]||[],i;for(i=0;i<rows.length;i++)if(rows[i][0]==node)return rows[i];return rows[0]}
  function drawDialogue(){var row=dialogueNode(),lines=wrap(row?row[1]:"...",48),i,choices=row?row[2]:[];h.setClipRect(0,176,W-1,H-1);h.setColor(0).fillRect(0,176,W-1,H-1);h.setColor(2).drawRect(8,184,W-9,H-9);h.setFontAlign(-1,-1);font(1);h.setColor(3);for(i=0;i<lines.length;i++)h.drawString(lines[i],20,196+i*13);for(i=0;i<choices.length;i++){h.setColor(i==choice?3:2);h.drawString((i==choice?"> ":"  ")+text(choices[i][0],18),32,244+i*18)}h.setClipRect(0,0,W-1,H-1)}
  function beginDialogue(id){var rows=C.dialogues[id];if(!rows||!rows.length){msg="NO DIALOGUE";footer();return}dialogue=id;node=rows[0][0];choice=0;drawDialogue()}
  function leave(target){dead=1;if(timer)clearInterval(timer);timer=0;close();if(A.returnWorld)A.returnWorld({map:target||arg.map||"WORLD_01",x:arg.x,y:arg.y,facing:arg.facing||"down",msg:"LEFT "+C.name});else A.world({map:target||arg.map||"WORLD_01"})}
  function transition(type,target,label,interact,once,bullet,miniboss){var data={map:arg.map||"WORLD_01",x:arg.x,y:arg.y,facing:arg.facing||"down",msg:label||""};busy=1;if(interact)data.interact=interact;if(once)data.once=true;if(bullet)data.bullet=bullet;if(miniboss)data.miniboss=true;if(type=="battle"){data.enemy=target||"RANDOM";A.battle(data)}else if(type=="shop"){data.vendor=label||"TRADER";data.folder=target||"Shop";A.shop(data)}else if(type=="confrontation"){data.enemy=target||"RAIDER";data.name=label||target;data.dlg=dialogueNode()?dialogueNode()[1]:"YOU READY?";A.interior(data)}else if(type=="interior"){data.interiorId=target;A.house(data)}else if(type=="world")leave(target);else if(type=="exit")A.exit();else{busy=0;dialogue="";full()}}
  function chooseDialogue(){var row=dialogueNode(),c;if(!row||!row[2].length){dialogue="";full();return}c=row[2][choice];if((c[1]=="next"||c[1]=="continue")&&c[3]){node=c[3];choice=0;drawDialogue()}else if(c[1]=="close"||c[1]=="continue"){dialogue="";full()}else transition(c[1],c[2],row[1],c[4],c[5],c[6],c[7])}
  function activate(){var item,id;if(dialogue){chooseDialogue();return}if(!act){msg="NOTHING HERE";footer();return}item=act[0]?C.zones[act[1]]:C.npcs[act[1]];id=act[0]?item[12]:item[13];if(id){beginDialogue(id);return}if(act[0])transition(item[9],item[10],item[2],item[0],item[11],item[13],item[14])}
  function queue(x,y){var limit=STEP*4;if(dead||busy||dialogue)return;if(x){qx+=x<0?-STEP:STEP;qx=Math.max(-limit,Math.min(limit,qx));qy=0}else{qy+=y<0?-STEP:STEP;qy=Math.max(-limit,Math.min(limit,qy));qx=0}}
  function frame(){var x=0,y=0;if(dead)return;tick++;if(!busy&&!dialogue){if(qx){x=qx<0?-STEP:STEP;qx-=x}else if(qy){y=qy<0?-STEP:STEP;qy-=y}if(x||y)move(x,y)}h.flip();Pip.lastFlip=getTime()}
  function k1(value,longPress){if(dead)return;if(value===0&&!longPress){activate();return}queue(0,value)}
  function k2(value){var row;if(dead||!value)return;if(dialogue){row=dialogueNode();if(row&&row[2].length){choice=(choice+(value<0?-1:1)+row[2].length)%row[2].length;drawDialogue()}return}queue(value,0)}
  function remove(){dead=1;if(timer)clearInterval(timer);timer=0;close();sp=npcImage=0;try{A.gc()}catch(e){}}
  open();full();frame();timer=setInterval(frame,FRAME);return{k1:k1,k2:k2,remove:remove};
})
`;
  }

  global.BirdRuntimeTemplates = {
    worldModule: worldModule,
    interiorModule: interiorModule,
    worldDispatcher: function (maps) { return dispatcher("world", maps.map(function (map) { return map.id; })); },
    interiorDispatcher: function (interiors) { return dispatcher("interior", interiors.map(function (interior) { return interior.id; })); },
    fileName: fileName
  };
})(window);
