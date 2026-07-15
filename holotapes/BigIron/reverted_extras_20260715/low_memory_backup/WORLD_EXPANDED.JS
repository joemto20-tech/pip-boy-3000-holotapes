(function(A,arg){
  var BASE=A.base;
  var W=A.w;
  var H=A.h;
  var FOOTER_Y=H-24;

  var world=null;
  var saveState=null;
  var worldImage=null;
  var imageMode=false;
  var id="WORLD_01";
  var playerX=0;
  var playerY=0;
  var facing="up";
  var msg="FIND A DOOR";
  var active=null;
  var busy=false;
  var removed=false;
  var moveTimer=null;
  var clickTimer=null;
  var travelTimer=null;
  var npcTimer=null;
  var queuedX=0;
  var queuedY=0;
  var pause=-1;

  var tileOx=-1;
  var tileOy=-1;
  var tileCols=0;
  var tileRows=0;
  var tileDrawn=false;
  var playerSprite=null;
  var playerSprites=null;
  var spriteCache={};

  try{
    playerSprites={
      up:{width:12,height:14,bpp:1,transparent:0,buffer:atob("H4A/wH/g//A/wDnAP8AfgC9Af+BvYD/AKUBgYA==")},
      down:{width:12,height:14,bpp:2,transparent:0,buffer:atob("AAAAAFVAAVVQApWgAqqgAoogAKqAACoAAVlQAVVQAhUgABUAACIAABEA")},
      left:{width:12,height:14,bpp:2,transparent:0,buffer:atob("AAAAAFVQBVVQAqqgAgggAqqgAKKAACoAAVlQAVVQAhUgABUAAIIAAkGA")},
      right:{width:12,height:14,bpp:2,transparent:0,buffer:atob("AAAABVUABVVQCqqACCCACqqAAooAAKgABWVABVVACFSAAFQAAIIAAkGA")}
    };
    playerSprite=playerSprites.up;
  }catch(e){
    playerSprite=null;
    playerSprites=null;
  }

  function clamp(v,min,max){
    return v<min?min:(v>max?max:v);
  }

  function font(size){
    try{h.setFont("6x8",size||1);}catch(e){}
  }

  function text(value,max){
    value=value==null?"":value.toString();
    return max&&value.length>max?value.substr(0,max-1)+"~":value;
  }

  function join(a,b){
    return a+(a.charAt(a.length-1)=="/"?"":"/")+b;
  }

  function exists(path){
    try{return !!fs.statSync(path);}catch(e){return false;}
  }

  function readImage(path){
    try{return fs.readFileSync(path);}catch(e){}
    try{return fs.readFile(path);}catch(e2){}
    return null;
  }

  function playerData(){
    try{
      if(typeof player!="undefined"&&player&&player.player)return player.player;
    }catch(e){}
    return {};
  }

  function readProfileState(){
    var p=playerData();
    if(p&&p.wb&&p.wb.map)return p.wb;
    return null;
  }

  function writeProfileState(data,syncNow){
    var p;
    try{
      if(typeof player=="undefined"||!player||!player.player)return false;
      p=player.player;
      if(!p)return false;
      p.wb={
        map:data.map,
        mode:data.mode,
        x:data.x,
        y:data.y,
        facing:data.facing,
        cleared:data.cleared||{}
      };
      return true;
    }catch(e){}
    return false;
  }

  function readText(path){
    try{return fs.readFile(path);}catch(e){}
    try{return fs.readFileSync(path);}catch(e2){}
    return null;
  }

  function spriteName(name){
    var parts=(name||"").toString().replace(/\.JS$/i,"").split(/[\\\/]+/);
    var out=[];
    var i,p;
    for(i=0;i<parts.length;i++){
      p=parts[i].replace(/[^A-Z0-9_]/gi,"_").replace(/^_+|_+$/g,"").toUpperCase();
      if(p)out.push(p);
    }
    return out.join("/");
  }

  function loadSprite(name){
    var key=spriteName(name);
    var source,eq,end,sprite;
    if(!key)return null;
    if(spriteCache[key]!==undefined)return spriteCache[key];
    spriteCache[key]=null;
    source=readText(BASE+"DATA/"+key+".JS");
    if(!source)return null;
    try{
      eq=source.indexOf("=");
      end=source.lastIndexOf(";");
      if(eq<0)return null;
      sprite=eval("("+source.substring(eq+1,end>eq?end:source.length)+")");
      if(sprite&&sprite.width&&sprite.height&&sprite.buffer){
        spriteCache[key]=sprite;
        return sprite;
      }
    }catch(e){}
    return null;
  }

  function loadPlayerSprites(){
    var up=loadSprite("PLAYER_SPRITEUP")||playerSprites&&playerSprites.up;
    var down=loadSprite("PLAYER_SPRITEDOWN")||playerSprites&&playerSprites.down;
    var left=loadSprite("PLAYER_SPRITEL")||loadSprite("PLAYER_SPRITELEFT")||playerSprites&&playerSprites.left;
    var right=loadSprite("PLAYER_SPRITER")||loadSprite("PLAYER_SPRITERIGHT")||playerSprites&&playerSprites.right;
    if(up||down||left||right){
      playerSprites={up:up||playerSprite,down:down||up||playerSprite,left:left||up||playerSprite,right:right||up||playerSprite};
      playerSprite=playerSprites.up;
    }
  }

  function writeText(path,data){
    try{
      if(fs.writeFileSync){
        fs.writeFileSync(path,data);
        return true;
      }
    }catch(e){}
    try{
      if(fs.writeFile){
        fs.writeFile(path,data);
        return true;
      }
    }catch(e2){}
    return false;
  }

  function safeSound(name,fallback){
    try{
      if(Pip.playSound){
        Pip.playSound(name);
        return;
      }
    }catch(e){}
    try{if(fallback&&Pip.playSound)Pip.playSound(fallback);}catch(e2){}
  }

  function readState(){
    var a=null;
    var b=null;
    try{a=JSON.parse(readText(BASE+"SAVE/STATE.JSON")||"{}");}catch(e){}
    try{b=JSON.parse(readText(BASE+"STATE.JSON")||"{}");}catch(e2){}
    if(b&&b.map&&(!a||!a.map))return b;
    if(a&&a.map)return a;
    b=readProfileState();
    if(b&&b.map)return b;
    return a||b||{};
  }

  function writeState(data,syncNow){
    var body;
    try{
      body=JSON.stringify(data);
      if(writeText(BASE+"SAVE/STATE.JSON",body))return true;
      if(writeText(BASE+"STATE.JSON",body))return true;
    }catch(e){}
    try{writeProfileState(data,false);}catch(e2){}
    return true;
  }

  function loadSave(){
    saveState=readState();
    if(!saveState)saveState={};
    if(!saveState.cleared)saveState.cleared={};
  }

  function save(silent,refresh){
    if(!saveState)saveState={};
    if(!saveState.cleared)saveState.cleared={};
    if(world){
      saveState.map=id;
      saveState.mode=imageMode?"image":"tile";
      saveState.x=playerX;
      saveState.y=playerY;
      saveState.facing=facing;
    }
    writeState(saveState,!silent);
    msg="GAME SAVED";
    if(!silent)safeSound("SELECT","TAB");
    if(refresh)A.gc();
    return true;
  }

  function saveProfile(){
    msg="PROFILE COMING SOON";
    return true;
  }

  function imageByte(index){
    if(!worldImage)return 0;
    return worldImage.charCodeAt?worldImage.charCodeAt(index):worldImage[index];
  }

  function loadWorld(name,pos){
    var path=BASE+"DATA/"+name+".JSON";
    if(npcTimer){clearTimeout(npcTimer);npcTimer=null;}
    world=null;
    worldImage=null;
    imageMode=false;
    active=null;
    tileOx=-1;
    tileOy=-1;
    tileDrawn=false;
    A.gc();

    try{world=JSON.parse(fs.readFile(path));}catch(e){world=null;}
    if(!world&&name!="WORLD_01"){
      name="WORLD_01";
      path=BASE+"DATA/WORLD_01.JSON";
      try{world=JSON.parse(fs.readFile(path));}catch(e2){world=null;}
    }
    if(!world)throw "WORLD "+name;

    id=world.id||name;
    world.tile=world.tile||16;
    world.scale=world.scale||24;
    world.spawn=world.spawn||[2,2];
    world.decor=world.decor||[];

    if(world.image&&exists(BASE+"WORLD/"+world.image)){
      worldImage=readImage(BASE+"WORLD/"+world.image);
      imageMode=!!worldImage;
      if(imageMode){
        world.imgScale=world.imgScale||2;
        world.step=world.step||2;
        world.w=world.w||imageByte(0)||Math.floor(W/world.imgScale);
        world.h=world.h||imageByte(1)||Math.floor(H/world.imgScale);
        world.spawnPx=world.spawnPx||world.spawn;
      }
    }

    if(pos){
      playerX=parseInt(pos.x,10);
      playerY=parseInt(pos.y,10);
      facing=pos.facing||"up";
    }else if(saveState.map==id&&saveState.x!==undefined&&((imageMode&&saveState.mode=="image")||(!imageMode&&saveState.mode!="image"))){
      playerX=parseInt(saveState.x,10);
      playerY=parseInt(saveState.y,10);
      facing=saveState.facing||"up";
    }else if(imageMode&&world.spawnPx){
      playerX=world.spawnPx[0];
      playerY=world.spawnPx[1];
      facing="up";
    }else{
      playerX=world.spawn[0];
      playerY=world.spawn[1];
      facing="up";
    }

    if(isNaN(playerX))playerX=imageMode&&world.spawnPx?world.spawnPx[0]:world.spawn[0];
    if(isNaN(playerY))playerY=imageMode&&world.spawnPx?world.spawnPx[1]:world.spawn[1];
    loadPlayerSprites();
    setupNpcs();
    if(A.music)A.music(false);
    scheduleNpc();
  }

  function zone(x,y,z){
    return z&&x>=z.x&&y>=z.y&&x<z.x+(z.w||1)&&y<z.y+(z.h||1);
  }

  function frontPoint(){
    var x=playerX;
    var y=playerY;
    var step=imageMode?(world.step||2):1;
    if(facing=="left")x-=step;
    else if(facing=="right")x+=step;
    else if(facing=="down")y+=step;
    else y-=step;
    return {x:x,y:y};
  }

  function findInteract(){
    var point=frontPoint();
    var list=imageMode?(world.imageInteracts||world.interacts||[]):world.interacts||[];
    var i,z;
    for(i=0;i<list.length;i++){
      z=list[i];
      if(z&&!(z.once&&saveState.cleared[z.id])&&(zone(point.x,point.y,z)||zone(playerX,playerY,z)))return z;
    }
    return null;
  }

  function findExit(x,y){
    var list=imageMode?(world.imageExits||world.exits||[]):world.exits||[];
    var i;
    for(i=0;i<list.length;i++)if(zone(x,y,list[i]))return list[i];
    return null;
  }

  function tileAt(x,y){
    if(!world||!world.rows||y<0||y>=world.rows.length||x<0||x>=world.rows[y].length)return "B";
    return world.rows[y].charAt(x);
  }

  function blocked(x,y){
    var list,i;
    if(imageMode){
      if(x<0||y<0||x>=world.w||y>=world.h)return true;
      list=world.imageBlocks||world.blocks||[];
      for(i=0;i<list.length;i++)if(zone(x,y,list[i]))return true;
      return false;
    }
    var t=tileAt(x,y);
    return t=="B"||t=="H"||t=="D"||t=="R"||t=="F"||t=="S"||t=="X";
  }

  function npcList(){
    var list=imageMode?(world.imageInteracts||world.interacts||[]):world.interacts||[];
    var out=[];
    var i,z;
    for(i=0;i<list.length;i++){
      z=list[i];
      if(z&&z.npc&&!(z.once&&saveState.cleared[z.id]))out.push(z);
    }
    return out;
  }

  function npcDecor(npc){
    var list=decorList();
    var i,d;
    for(i=0;i<list.length;i++){
      d=list[i];
      if(!d||decorType(d)!="npc")continue;
      if(npc.decorId&&d.id==npc.decorId)return d;
      if(d.x==npc.x&&d.y==npc.y)return d;
      if(npc.homeX!==undefined&&d.x==npc.homeX&&d.y==npc.homeY)return d;
    }
    return null;
  }

  function setupNpcs(){
    var list=npcList();
    var i,n,d;
    for(i=0;i<list.length;i++){
      n=list[i];
      n.homeX=n.homeX!==undefined?parseInt(n.homeX,10):parseInt(n.x,10);
      n.homeY=n.homeY!==undefined?parseInt(n.homeY,10):parseInt(n.y,10);
      if(isNaN(n.homeX))n.homeX=n.x;
      if(isNaN(n.homeY))n.homeY=n.y;
      n.x=parseInt(n.x,10);
      n.y=parseInt(n.y,10);
      if(isNaN(n.x))n.x=n.homeX;
      if(isNaN(n.y))n.y=n.homeY;
      n.range=parseInt(n.range,10);
      if(isNaN(n.range))n.range=3;
      n.patrol=n.patrol===false?"still":(n.patrol||"horizontal");
      n.dir=n.dir||n.facing||(n.patrol=="vertical"?"down":"right");
      d=npcDecor(n);
      if(d){
        n.decorId=d.id;
        d.x=n.x;
        d.y=n.y;
        d.facing=n.dir;
      }
    }
  }

  function dirX(dir){
    return dir=="left"?-1:(dir=="right"?1:0);
  }

  function dirY(dir){
    return dir=="up"?-1:(dir=="down"?1:0);
  }

  function reverseDir(dir){
    if(dir=="left")return "right";
    if(dir=="right")return "left";
    if(dir=="up")return "down";
    return "up";
  }

  function playerInNpcSight(n){
    var dx=dirX(n.dir);
    var dy=dirY(n.dir);
    var x=n.x+dx;
    var y=n.y+dy;
    var left=n.sight||6;
    if(!dx&&!dy)return false;
    while(left-->0&&!blocked(x,y)){
      if(x==playerX&&y==playerY)return true;
      x+=dx;
      y+=dy;
    }
    return false;
  }

  function npcBlocked(x,y,npc){
    var list=npcList();
    var i,n;
    if(x==playerX&&y==playerY)return false;
    if(blocked(x,y))return true;
    for(i=0;i<list.length;i++){
      n=list[i];
      if(n!=npc&&n.x==x&&n.y==y)return true;
    }
    return false;
  }

  function npcOutOfRange(x,y,npc){
    if(npc.range<1)return x!=npc.homeX||y!=npc.homeY;
    return Math.abs(x-npc.homeX)>npc.range||Math.abs(y-npc.homeY)>npc.range;
  }

  function moveNpc(npc){
    var chasing=playerInNpcSight(npc);
    var dx=0;
    var dy=0;
    var nx,ny,d;
    if(chasing){
      dx=dirX(npc.dir);
      dy=dirY(npc.dir);
    }else if(npc.patrol=="vertical"){
      if(npc.dir!="up"&&npc.dir!="down")npc.dir="down";
      dy=dirY(npc.dir);
    }else if(npc.patrol=="horizontal"){
      if(npc.dir!="left"&&npc.dir!="right")npc.dir="right";
      dx=dirX(npc.dir);
    }else{
      return false;
    }
    nx=npc.x+dx;
    ny=npc.y+dy;
    if(nx==playerX&&ny==playerY){
      startInteract(npc);
      return "hit";
    }
    if(npcBlocked(nx,ny,npc)||(!chasing&&npcOutOfRange(nx,ny,npc))){
      npc.dir=reverseDir(npc.dir);
      d=npcDecor(npc);
      if(d)d.facing=npc.dir;
      return false;
    }
    d=npcDecor(npc);
    npc.oldX=npc.x;
    npc.oldY=npc.y;
    npc.x=nx;
    npc.y=ny;
    npc.facing=npc.dir;
    if(d){
      d.x=nx;
      d.y=ny;
      d.facing=npc.dir;
    }
    return true;
  }

  function decorList(){
    return imageMode?(world.imageDecor||world.decor||[]):world.decor||[];
  }

  function decorType(entry){
    return entry&&entry.type?entry.type.toString().toLowerCase():"";
  }

  function decorAt(x,y){
    var list=decorList();
    var i,entry,w,h;
    for(i=0;i<list.length;i++){
      entry=list[i];
      if(!entry)continue;
      w=entry.w||1;
      h=entry.h||1;
      if(x>=entry.x&&y>=entry.y&&x<entry.x+w&&y<entry.y+h)return entry;
    }
    return null;
  }

  function drawDecor(entry,x,y,size){
    var type=decorType(entry);
    var sprite=entry&&entry.sprite?loadSprite(entry.sprite):null;
    var mid=x+Math.floor(size/2);
    var base=y+size-2;
    var half=Math.max(2,Math.floor(size/4));
    var trunk=Math.max(2,Math.floor(size/5));
    if(!type)return;
    if(sprite){
      try{
        h.setColor(3).drawImage(sprite,x+Math.floor((size-sprite.width)/2),y+Math.floor((size-sprite.height)/2));
        return;
      }catch(e){}
    }
    if(type=="tree"){
      h.setColor(2).fillRect(mid-1,base-trunk,mid+1,base);
      h.setColor(3).fillRect(mid-half,y+2,mid+half,y+Math.floor(size/2));
      h.setColor(2).fillRect(mid-half+1,y+Math.floor(size/3),mid+half-1,y+Math.floor(size/2)+2);
    }else if(type=="npc"){
      h.setColor(3).fillRect(mid-1,y+3,mid+1,y+5);
      h.drawLine(mid,y+6,mid,base-2);
      h.drawLine(mid-3,y+9,mid+3,y+9);
      h.drawLine(mid,base-3,mid-3,base);
      h.drawLine(mid,base-3,mid+3,base);
    }else if(type=="camp"){
      h.setColor(3).drawLine(x+3,base,x+half+2,y+5);
      h.drawLine(x+size-4,base,x+half+2,y+5);
      h.drawLine(x+4,base,x+size-5,base);
      h.setColor(2).drawLine(mid,base-2,mid-1,base-5);
      h.drawLine(mid,base-2,mid+1,base-5);
    }else if(type=="sign"){
      h.setColor(2).drawLine(mid,base,mid,y+4);
      h.setColor(3).drawRect(mid-half,y+3,mid+half,y+Math.floor(size/3)+2);
      h.drawLine(mid-half+2,y+7,mid+half-2,y+7);
    }else if(type=="rocks"){
      h.setColor(3).fillRect(x+3,base-4,x+6,base-1);
      h.fillRect(mid-1,base-6,mid+2,base-2);
      h.fillRect(x+size-7,base-3,x+size-4,base);
    }else{
      h.setColor(3).drawRect(x+4,y+4,x+size-5,y+size-5);
      h.setColor(2).drawLine(x+5,y+size-6,x+size-6,y+5);
    }
  }

  function drawSceneTile(x,y,px,py,size){
    var entry;
    drawTile(tileAt(x,y),px,py,size);
    entry=decorAt(x,y);
    if(entry)drawDecor(entry,px,py,size);
  }

  function drawPlayer(px,py){
    var x=px+2;
    var y=py+1;
    var sprite=playerSprites&&(playerSprites[facing]||playerSprites.up)||playerSprite;
    if(sprite){
      try{
        h.setColor(3).drawImage(sprite,x,y);
        if(facing=="up"){
          h.setColor(2);
          h.drawLine(x+5,y-2,x+5,y);
        }
        return;
      }catch(e){}
    }
    h.setColor(3).drawRect(px+5,py+5,px+10,py+10);
    h.setColor(2).drawLine(px+7,py+3,px+7,py+12);
  }

  function drawFooter(){
    active=findInteract();
    h.setColor(0).fillRect(0,FOOTER_Y,W-1,H-1);
    h.setColor(2).drawLine(0,FOOTER_Y-1,W-1,FOOTER_Y-1);
    font(2);
    h.setFontAlign(0,-1);
    if(active)h.setColor(3).drawString(active.prompt||"ENTER?",W/2,FOOTER_Y+4);
    else h.setColor(2).drawString(text(msg||"HOLD WHEEL TO SAVE",36),W/2,FOOTER_Y+4);
  }

  function drawImageBackground(){
    h.drawImage(worldImage,0,0,{scale:world.imgScale||2});
  }

  function drawImagePlayer(){
    var scale=world.imgScale||2;
    drawPlayer(playerX*scale-8,playerY*scale-12);
  }

  function patchImageSpot(x,y){
    var scale=world.imgScale||2;
    var px=x*scale;
    var py=y*scale;
    h.setClipRect(px-18,py-22,px+18,py+18);
    drawImageBackground();
  }

  function imageDrawMode(){
    return world.imageDraw||world.drawMode||"patch";
  }

  function mapSound(name,fallback){
    safeSound(name,fallback);
  }

  function drawImageFull(){
    h.setClipRect(0,0,W-1,H-1);
    h.setColor(0).fillRect(0,0,W-1,H-1);
    drawImageBackground();
    drawImagePlayer();
    drawFooter();
    tileDrawn=true;
    A.flip(0,H-1);
  }

  function drawImageReveal(full,oldX,oldY){
    var scale=world.imgScale||2;
    var cx=playerX*scale;
    var cy=playerY*scale;
    var r=world.lightRadius||58;
    var band=world.lightBand||16;
    var dy,y1,y2,half;

    h.setClipRect(0,0,W-1,H-1);
    h.setColor(0).fillRect(0,0,W-1,H-1);

    for(dy=-r;dy<=r;dy+=band){
      half=Math.floor(Math.sqrt(r*r-dy*dy));
      y1=clamp(cy+dy,0,FOOTER_Y-2);
      y2=clamp(cy+dy+band-1,0,FOOTER_Y-2);
      if(y2>=y1&&cx+half>=0&&cx-half<W){
        h.setClipRect(clamp(cx-half,0,W-1),y1,clamp(cx+half,0,W-1),y2);
        drawImageBackground();
      }
    }

    h.setClipRect(0,0,W-1,H-1);
    drawImagePlayer();
    drawFooter();
    tileDrawn=true;
    A.flip(0,H-1);
  }

  function drawImagePatch(full,oldX,oldY){
    if(full||!tileDrawn){
      drawImageFull();
      return;
    }
    patchImageSpot(oldX,oldY);
    patchImageSpot(playerX,playerY);
    h.setClipRect(0,0,W-1,H-1);
    drawImagePlayer();
    drawFooter();
    A.flip(0,H-1);
  }

  function drawImage(full,oldX,oldY){
    try{
      var mode=imageDrawMode();
      if(mode=="reveal"){
        drawImageReveal(full,oldX,oldY);
        return;
      }
      if(mode=="full"){
        drawImageFull();
        return;
      }
      drawImagePatch(full,oldX,oldY);
    }catch(e){
      imageMode=false;
      msg="IMAGE DRAW FAILED";
      drawTileWorld(true,oldX,oldY);
    }
  }

  function drawTile(t,x,y,size){
    h.setColor(0).fillRect(x,y,x+size-1,y+size-1);
    if(t=="P"){
      h.setColor(2).fillRect(x,y,x+size-1,y+size-1);
      h.setColor(1).drawLine(x,y+size-1,x+size-1,y+size-1);
    }else if(t=="H"||t=="D"){
      h.setColor(1).fillRect(x,y,x+size-1,y+size-1);
      h.setColor(3).drawRect(x+1,y+1,x+size-2,y+size-2);
      if(t=="D")h.setColor(0).fillRect(x+5,y+4,x+size-6,y+size-2);
    }else if(t=="B"){
      h.setColor(1).fillRect(x,y,x+size-1,y+size-1);
      h.setColor(2).drawLine(x,y+size-2,x+size-1,y+1);
    }else if(t=="X"){
      h.setColor(2).fillRect(x+7,y+6,x+8,y+size-2);
      h.setColor(3).drawLine(x+7,y+7,x+2,y+3);
      h.drawLine(x+8,y+8,x+size-3,y+2);
      h.drawLine(x+7,y+10,x+3,y+12);
    }else if(t=="S"){
      h.setColor(2).drawLine(x+3,y+11,x+7,y+7);
      h.drawLine(x+7,y+7,x+12,y+11);
    }
  }

  function updateCamera(){
    var size=world.scale||world.tile||16;
    var mapW=world.rows&&world.rows[0]?world.rows[0].length:0;
    var mapH=world.rows?world.rows.length:0;
    var maxX,maxY,sx,sy,leadX,leadY,oldX=tileOx,oldY=tileOy;
    tileCols=Math.ceil(W/size);
    tileRows=Math.max(1,Math.floor(FOOTER_Y/size));
    maxX=Math.max(0,mapW-tileCols);
    maxY=Math.max(0,mapH-tileRows);
    leadX=clamp(Math.floor(tileCols/5),2,4);
    leadY=clamp(Math.floor(tileRows/4),2,3);
    if(tileOx<0){
      tileOx=clamp(playerX-Math.floor(tileCols/2),0,maxX);
      tileOy=clamp(playerY-Math.floor(tileRows/2),0,maxY);
      return true;
    }
    sx=playerX-tileOx;
    sy=playerY-tileOy;
    if(facing=="right"&&sx>=tileCols-leadX-1)tileOx=clamp(playerX-leadX,0,maxX);
    else if(facing=="left"&&sx<=leadX)tileOx=clamp(playerX-tileCols+leadX+1,0,maxX);
    else if(sx<1)tileOx=clamp(playerX-tileCols+leadX+1,0,maxX);
    else if(sx>tileCols-2)tileOx=clamp(playerX-leadX,0,maxX);
    if(facing=="down"&&sy>=tileRows-leadY-1)tileOy=clamp(playerY-leadY,0,maxY);
    else if(facing=="up"&&sy<=leadY)tileOy=clamp(playerY-tileRows+leadY+1,0,maxY);
    else if(sy<1)tileOy=clamp(playerY-tileRows+leadY+1,0,maxY);
    else if(sy>tileRows-2)tileOy=clamp(playerY-leadY,0,maxY);
    return tileOx!=oldX||tileOy!=oldY;
  }

  function drawOneTile(x,y){
    var size=world.scale||world.tile||16;
    var px=(x-tileOx)*size;
    var py=(y-tileOy)*size;
    if(px>-size&&py>-size&&px<W&&py<FOOTER_Y)drawSceneTile(x,y,px,py,size);
  }

  function drawTileWorld(full,oldX,oldY){
    var size=world.scale||world.tile||16;
    var movedCamera=updateCamera();
    var i,j,top,bottom;
    try{
      if(full!==false||!tileDrawn||movedCamera){
        h.setClipRect(0,0,W-1,H-1);
        h.setColor(0).fillRect(0,0,W-1,H-1);
        for(j=0;j<tileRows;j++)for(i=0;i<tileCols;i++)drawSceneTile(tileOx+i,tileOy+j,i*size,j*size,size);
        drawPlayer((playerX-tileOx)*size+Math.floor((size-16)/2),(playerY-tileOy)*size+Math.floor((size-16)/2));
        drawFooter();
        tileDrawn=true;
        A.flip(0,H-1);
        return;
      }
      drawOneTile(oldX,oldY);
      if(oldX!=playerX||oldY!=playerY)drawOneTile(playerX,playerY);
      drawPlayer((playerX-tileOx)*size+Math.floor((size-16)/2),(playerY-tileOy)*size+Math.floor((size-16)/2));
      drawFooter();
      top=Math.max(0,Math.min((oldY-tileOy)*size,(playerY-tileOy)*size));
      bottom=Math.min(FOOTER_Y-1,Math.max((oldY-tileOy)*size,(playerY-tileOy)*size)+size-1);
      if(bottom>=top)A.flip(top,bottom);
      A.flip(FOOTER_Y-1,H-1);
    }catch(e){}
  }

  function draw(full,oldX,oldY){
    if(removed||!world)return;
    if(imageMode)drawImage(full,oldX,oldY);
    else drawTileWorld(full,oldX,oldY);
  }

  function drawNpcChanges(list,count){
    var size=world.scale||world.tile||16;
    var i,n,y1,y2,top=FOOTER_Y,bottom=0;
    if(!count)return;
    if(imageMode){
      draw(true);
      return;
    }
    for(i=0;i<count;i++){
      n=list[i];
      drawOneTile(n.oldX,n.oldY);
      drawOneTile(n.x,n.y);
      y1=Math.min((n.oldY-tileOy)*size,(n.y-tileOy)*size);
      y2=Math.max((n.oldY-tileOy)*size,(n.y-tileOy)*size)+size-1;
      if(y2>=0&&y1<FOOTER_Y){
        if(y1<top)top=y1;
        if(y2>bottom)bottom=y2;
      }
    }
    drawPlayer((playerX-tileOx)*size+Math.floor((size-16)/2),(playerY-tileOy)*size+Math.floor((size-16)/2));
    drawFooter();
    top=clamp(top,0,FOOTER_Y-1);
    bottom=clamp(bottom,0,FOOTER_Y-1);
    if(bottom>=top)A.flip(top,bottom);
    A.flip(FOOTER_Y-1,H-1);
  }

  function scheduleNpc(){
    if(npcTimer||removed||!world)return;
    if(!npcList().length)return;
    npcTimer=setTimeout(npcTick,world.npcPace||420);
  }

  function npcTick(){
    var list,changed=[];
    var i,r;
    npcTimer=null;
    if(removed||!world)return;
    if(busy||pause>=0){
      scheduleNpc();
      return;
    }
    list=npcList();
    for(i=0;i<list.length;i++){
      r=moveNpc(list[i]);
      if(r=="hit")return;
      if(r===true)changed.push(list[i]);
    }
    if(changed.length)drawNpcChanges(changed,changed.length);
    scheduleNpc();
  }

  function transition(exit){
    busy=true;
    if(moveTimer){clearTimeout(moveTimer);moveTimer=null;}
    if(npcTimer){clearTimeout(npcTimer);npcTimer=null;}
    save(true);
    h.setColor(0).fillRect(0,0,W-1,H-1);
    h.setFontAlign(0,0);
    font(3);
    h.setColor(3).drawString("TRAVELLING",W/2,135);
    font(2);
    h.setColor(2).drawString(text(exit.to,24),W/2,175);
    A.flip(0,H-1);
    world=null;
    tileDrawn=false;
    A.gc();
    travelTimer=setTimeout(function(){
      travelTimer=null;
      if(removed)return;
      loadWorld(exit.to,{x:(exit.spawn||[2,2])[0],y:(exit.spawn||[2,2])[1],facing:exit.facing||facing});
      msg="ENTERED "+id;
      if(imageMode&&imageDrawMode()=="reveal")mapSound("TORCH","SELECT");
      busy=false;
      draw(true);
    },50);
  }

  function step(dx,dy){
    if(busy||pause>=0)return;
    var oldX=playerX;
    var oldY=playerY;
    var amount=imageMode?(world.step||2):1;
    var nx,ny,exit;

    if(dx<0)facing="left";
    else if(dx>0)facing="right";
    else if(dy>0)facing="down";
    else facing="up";

    nx=playerX+dx*amount;
    ny=playerY+dy*amount;
    exit=findExit(nx,ny);
    if(exit){
      transition(exit);
      return;
    }
    if(!blocked(nx,ny)){
      playerX=nx;
      playerY=ny;
      msg="";
    }
    draw(false,oldX,oldY);
  }

  function flushMove(){
    var dx=0;
    var dy=0;
    moveTimer=null;
    if(removed||busy){
      queuedX=0;
      queuedY=0;
      return;
    }
    if(queuedX){
      dx=queuedX;
      queuedX=0;
    }else if(queuedY){
      dy=queuedY;
      queuedY=0;
    }else{
      return;
    }
    step(dx,dy);
    moveTimer=setTimeout(flushMove,45);
  }

  function queueMove(dx,dy){
    if(busy||pause>=0)return;
    if(dx){
      queuedX=dx<0?-1:1;
      queuedY=0;
    }else if(dy){
      queuedY=dy<0?-1:1;
      queuedX=0;
    }
    if(!moveTimer)flushMove();
  }

  function activate(){
    var target=findInteract();
    if(!target){
      msg="NOTHING HERE";
      draw(false,playerX,playerY);
      return;
    }
    startInteract(target);
  }

  function startInteract(target){
    if(!target)return;
    if(target.type=="battle"||target.type=="shoot"){
      if(npcTimer){clearTimeout(npcTimer);npcTimer=null;}
      save(true);
      busy=true;
      h.setColor(0).fillRect(0,0,W-1,H-1);
      h.setFontAlign(0,0);
      font(3);
      h.setColor(3).drawString("ENCOUNTER",W/2,145);
      A.flip(0,H-1);
      if(target.type=="shoot"){
        A.shoot({target:target.target||target.enemy||"RADROACH",map:id,mode:imageMode?"image":"tile",x:playerX,y:playerY,facing:facing,interact:target.id,once:target.once});
      }else{
        A.battle({enemy:target.enemyPool||target.enemy,map:id,mode:imageMode?"image":"tile",x:playerX,y:playerY,facing:facing,interact:target.id,once:target.once,music:target.music!==undefined?target.music:(id=="WORLD_03"?"NVTH":false),boss:target.boss,npc:target.npc});
      }
    }else if(target.type=="save"){
      save(false,true);
      draw(false,playerX,playerY);
    }
  }

  function drawPause(note){
    var options=["RESUME","SAVE LOCATION","PROFILE SOON","EXIT GAME"];
    var i,y;
    h.setClipRect(0,0,W-1,H-1);
    h.setColor(0).fillRect(0,0,W-1,H-1);
    h.setColor(1);
    for(y=0;y<H;y+=16)h.drawLine(0,y,W-1,y);
    h.setColor(2).drawRect(26,20,W-27,H-21);
    h.drawRect(32,26,W-33,H-27);
    h.setFontAlign(0,0);
    font(4);
    h.setColor(3).drawString("PAUSED",W/2,58);
    font(1);
    h.setColor(2).drawString("BIG IRON",W/2,92);
    for(i=0;i<4;i++){
      y=114+i*39;
      if(i==pause){
        h.setColor(2).fillRect(92,y-14,W-93,y+14);
        h.setColor(0);
      }else{
        h.setColor(2).drawRect(92,y-14,W-93,y+14);
        h.setColor(3);
      }
      font(2);
      h.drawString((i==pause?"> ":"")+options[i],W/2,y);
    }
    font(1);
    h.setColor(2).drawString(note||"TURN WHEEL / PRESS TO SELECT",W/2,286);
    A.flip(0,H-1);
  }

  function openPause(){
    if(busy)return;
    pause=0;
    if(moveTimer){clearTimeout(moveTimer);moveTimer=null;}
    queuedX=0;
    queuedY=0;
    drawPause();
  }

  function press(){
    if(pause>=0){
      if(pause===0){
        pause=-1;
        draw(true);
      }else if(pause==1){
        save(false,true);
        drawPause(msg);
      }else if(pause==2){
        saveProfile();
        drawPause(msg);
      }else{
        save(false);
        A.exit();
      }
      return;
    }
    activate();
  }

  function click(){
    if(clickTimer){
      clearTimeout(clickTimer);
      clickTimer=null;
      openPause();
    }else{
      clickTimer=setTimeout(function(){
        clickTimer=null;
        if(!removed)press();
      },250);
    }
  }

  function k1(value,longPress){
    if(removed)return;
    if(value===0){
      if(longPress){
        if(clickTimer){clearTimeout(clickTimer);clickTimer=null;}
        if(pause<0){
          save(false,true);
          draw(false,playerX,playerY);
        }
        return;
      }
      click();
      return;
    }
    if(clickTimer){clearTimeout(clickTimer);clickTimer=null;}
    if(pause>=0){
      pause=(pause+(value<0?-1:1)+4)%4;
      drawPause();
    }else{
      queueMove(value,0);
    }
  }

  function k2(value){
    if(!value||removed)return;
    if(clickTimer){clearTimeout(clickTimer);clickTimer=null;}
    if(pause>=0){
      pause=(pause+(value<0?-1:1)+4)%4;
      drawPause();
    }else{
      queueMove(0,value);
    }
  }

  function remove(){
    removed=true;
    if(moveTimer)clearTimeout(moveTimer);
    if(clickTimer)clearTimeout(clickTimer);
    if(travelTimer)clearTimeout(travelTimer);
    if(npcTimer)clearTimeout(npcTimer);
    moveTimer=null;
    clickTimer=null;
    travelTimer=null;
    npcTimer=null;
    world=null;
    worldImage=null;
    saveState=null;
    active=null;
    A.gc();
  }

  loadSave();
  if(!arg.map&&saveState.map&&!exists(BASE+"DATA/"+saveState.map+".JSON"))saveState.map="";
  loadWorld(arg.map||saveState.map||"WORLD_01",arg.x!==undefined?arg:null);
  if(arg.msg)msg=arg.msg;
  draw(true);

  return {k1:k1,k2:k2,save:save,remove:remove};
})
