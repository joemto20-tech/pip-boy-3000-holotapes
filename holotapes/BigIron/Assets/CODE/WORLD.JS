(function(A,arg){
  var BASE=A.base;
  var W=A.w;
  var H=A.h;
  var FOOTER_Y=H-24;
  var MOVE_MS=28;

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
  var queuedX=0;
  var queuedY=0;
  var pause=-1;

  var tileOx=-1;
  var tileOy=-1;
  var tileCols=0;
  var tileRows=0;
  var tileDrawn=false;
  var playerSprites={};

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
    try{return fs.readFile(path);}catch(e){}
    try{return fs.readFileSync(path);}catch(e2){}
    return null;
  }

  function imageFits(path,max){
    var s,n=0;
    try{
      s=fs.statSync(path);
      n=parseInt(s&&(s.size||s.length),10)||0;
    }catch(e){}
    return n>0&&n<=max;
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
        cleared:data.cleared||{},
        story:data.story||{}
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

  function loadPlayerSprite(){
    var file=facing=="down"?"PLAYER_SPRITEDOWN":facing=="left"?"PLAYER_SPRITEL":facing=="right"?"PLAYER_SPRITER":"PLAYER_SPRITEUP";
    var path=BASE+"DATA/"+file+".IMG";
    if(playerSprites[file]!==undefined)return playerSprites[file]||null;
    playerSprites[file]=null;
    try{
      if(typeof global!="undefined"&&global[file]){
        playerSprites[file]=global[file];
        return playerSprites[file];
      }
    }catch(e){}
    if(!imageFits(path,320))return null;
    playerSprites[file]=readImage(path)||null;
    return playerSprites[file]||null;
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
    try{writeProfileState(data,false);}catch(e0){}
    try{
      body=JSON.stringify(data);
      if(writeText(BASE+"SAVE/STATE.JSON",body))return true;
      if(writeText(BASE+"STATE.JSON",body))return true;
    }catch(e){}
    return true;
  }

  function loadSave(){
    saveState=readState();
    if(!saveState)saveState={};
    if(!saveState.cleared)saveState.cleared={};
    if(!saveState.story)saveState.story={};
    if(!saveState.story.rounds)saveState.story.rounds={};
  }

  function storyState(){
    if(!saveState)saveState={};
    if(!saveState.story)saveState.story={};
    if(!saveState.story.rounds)saveState.story.rounds={};
    if(!saveState.story.encounters)saveState.story.encounters=0;
    if(!saveState.story.deadLead)saveState.story.deadLead=0;
    return saveState.story;
  }

  function roundLoaded(roundId){
    var st=storyState();
    return !!(roundId&&st.rounds&&st.rounds[roundId]);
  }

  function roundCount(){
    var st=storyState();
    var k,n=0;
    for(k in st.rounds)if(st.rounds[k])n++;
    return n;
  }

  function regularCount(worldId){
    var list=world&&world.interacts?world.interacts:[];
    var i,z,n=0,city,kind;
    if(!saveState||!saveState.cleared)return 0;
    for(i=0;i<list.length;i++){
      z=list[i];
      city=z&&(z.storyCity||id);
      kind=z&&(z.storyType||((isMiniboss(z)||isFinalBoss(z))?"":"regular"));
      if(z&&city==worldId&&kind=="regular"&&saveState.cleared[z.id])n++;
    }
    return n;
  }

  function storyMessage(){
    var st=storyState();
    if(st.rounds.COURIER)return "WEAPON STATUS READY";
    if(st.forgeReady&&roundCount()>=5)return "FORGE FINAL ROUND";
    return "BIG IRON "+roundCount()+"/6";
  }

  function forgeCourierRound(){
    var st=storyState();
    if(roundLoaded("COURIER")){
      msg="COURIER ROUND LOADED";
      return true;
    }
    if(roundCount()<5){
      msg="FIVE ROUNDS REQUIRED";
      return false;
    }
    if((st.encounters||0)<20){
      msg="DEAD LEAD "+(st.encounters||0)+"/20";
      return false;
    }
    st.rounds.COURIER=1;
    st.forgeReady=1;
    save(false,true);
    msg="CHAMBER 6 LOADED";
    return true;
  }

  function enemyKey(target){
    var e=target&&(target.enemyPool||target.enemy||target.target);
    return e instanceof Array?e[0]:e;
  }

  function bulletFor(target){
    var e=enemyKey(target);
    if(e=="SOLOMON_RAY")return "SCORCHED";
    if(e=="DANNER_COLE")return "HOUND";
    if(e=="ODESSA_CROWN")return "CROWN";
    if(e=="MORDECAI_FLINT")return "RIVER";
    if(e=="ELIAS_BLACK")return "BLACK";
    return "";
  }

  function isMiniboss(target){
    return !!bulletFor(target);
  }

  function isFinalBoss(target){
    return enemyKey(target)=="HARLAN_VALE";
  }

  function routeRound(exit){
    if(exit&&exit.requiresRound)return exit.requiresRound;
    if(!exit)return "";
    if(id=="WORLD_01"&&exit.to=="WORLD_02")return "SCORCHED";
    if(id=="WORLD_02"&&exit.to=="WORLD_03")return "HOUND";
    if(id=="WORLD_03"&&exit.to=="WORLD_04")return "CROWN";
    if(id=="WORLD_04"&&exit.to=="WORLD_05")return "RIVER";
    if(id=="WORLD_05"&&exit.to=="WORLD_06")return "COURIER";
    return "";
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

  function imageByte(index){
    if(!worldImage)return 0;
    return worldImage.charCodeAt?worldImage.charCodeAt(index):worldImage[index];
  }

  function loadWorld(name,pos){
    var path=BASE+"DATA/"+name+".JSON";
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
    if(A.music)A.music(false);
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
    var list=imageMode?(world.imageExits||world.exits):world.exits;
    var i;
    if(!list)return null;
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
    var mid=x+Math.floor(size/2);
    var base=y+size-2;
    var half=Math.max(2,Math.floor(size/4));
    var trunk=Math.max(2,Math.floor(size/5));
    if(!type)return;
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
    var sprite=loadPlayerSprite();
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
    var rounds=roundCount();
    var bx=6;
    var by=FOOTER_Y-36;
    active=findInteract();
    h.setColor(0).fillRect(0,FOOTER_Y,W-1,H-1);
    h.setColor(2).drawLine(0,FOOTER_Y-1,W-1,FOOTER_Y-1);
    h.setColor(3).fillPoly([bx,by+2,bx,by+24,bx+18,by+13]);
    h.setColor(2).drawRect(bx+20,by+3,bx+34,by+21);
    font(1);
    h.setFontAlign(0,0);
    h.setColor(3).drawString(rounds,bx+27,by+12);
    font(2);
    h.setFontAlign(0,-1);
    if(active)h.setColor(3).drawString(active.prompt||"ENTER?",W/2,FOOTER_Y+4);
    else h.setColor(2).drawString(text(msg||storyMessage()||"HOLD WHEEL TO SAVE",34),W/2,FOOTER_Y+4);
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
    h.setClipRect(clamp(px-20,0,W-1),clamp(py-24,0,FOOTER_Y-1),clamp(px+40,0,W-1),clamp(py+36,0,FOOTER_Y-1));
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

  function updateCamera(oldX,oldY){
    var size=world.scale||world.tile||16;
    var mapW=world.rows&&world.rows[0]?world.rows[0].length:0;
    var mapH=world.rows?world.rows.length:0;
    var maxX,maxY,sx,sy,dx,dy,oldOx=tileOx,oldOy=tileOy;
    tileCols=Math.ceil(W/size);
    tileRows=Math.max(1,Math.floor(FOOTER_Y/size));
    maxX=Math.max(0,mapW-tileCols);
    maxY=Math.max(0,mapH-tileRows);
    if(tileOx<0){
      tileOx=clamp(playerX-Math.floor(tileCols/2),0,maxX);
      tileOy=clamp(playerY-Math.floor(tileRows/2),0,maxY);
      return true;
    }
    dx=oldX===undefined?0:playerX-oldX;
    dy=oldY===undefined?0:playerY-oldY;
    sx=playerX-tileOx;
    sy=playerY-tileOy;
    if(dx>0&&sx>=tileCols-1)tileOx=clamp(playerX,0,maxX);
    else if(dx<0&&sx<=0)tileOx=clamp(playerX-tileCols+1,0,maxX);
    else if(sx<0)tileOx=clamp(playerX-tileCols+1,0,maxX);
    else if(sx>=tileCols)tileOx=clamp(playerX,0,maxX);
    if(dy>0&&sy>=tileRows-1)tileOy=clamp(playerY,0,maxY);
    else if(dy<0&&sy<=0)tileOy=clamp(playerY-tileRows+1,0,maxY);
    else if(sy<0)tileOy=clamp(playerY-tileRows+1,0,maxY);
    else if(sy>=tileRows)tileOy=clamp(playerY,0,maxY);
    return tileOx!=oldOx||tileOy!=oldOy;
  }

  function drawOneTile(x,y){
    var size=world.scale||world.tile||16;
    var px=(x-tileOx)*size;
    var py=(y-tileOy)*size;
    if(px>-size&&py>-size&&px<W&&py<FOOTER_Y)drawSceneTile(x,y,px,py,size);
  }

  function drawPlayerFootprint(x,y){
    var ix,iy;
    for(iy=y-1;iy<=y+2;iy++)for(ix=x-1;ix<=x+2;ix++)drawOneTile(ix,iy);
  }

  function drawTileWorld(full,oldX,oldY){
    var size=world.scale||world.tile||16;
    var movedCamera=updateCamera(oldX,oldY);
    var i,j;
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
      drawPlayerFootprint(oldX,oldY);
      if(oldX!=playerX||oldY!=playerY)drawPlayerFootprint(playerX,playerY);
      drawPlayer((playerX-tileOx)*size+Math.floor((size-16)/2),(playerY-tileOy)*size+Math.floor((size-16)/2));
      drawFooter();
      h.setClipRect(0,0,W-1,H-1);
      A.flip(0,H-1);
    }catch(e){}
  }

  function draw(full,oldX,oldY){
    if(removed||!world)return;
    if(imageMode)drawImage(full,oldX,oldY);
    else drawTileWorld(full,oldX,oldY);
  }

  function canUseExit(exit){
    var need=routeRound(exit);
    if(need&&!roundLoaded(need)){
      msg=exit.lockedMsg||(need+" ROUND REQUIRED");
      return false;
    }
    if(exit&&exit.requiresReady&&roundCount()<6){
      msg="BIG IRON NOT READY";
      return false;
    }
    return true;
  }

  function canStartEncounter(target){
    var need,bullet=bulletFor(target);
    if(isMiniboss(target)){
      need=target.minRegular||2;
      if(regularCount(target.storyCity||id)<need){
        msg="COMPLETE "+need+" ENCOUNTERS";
        return false;
      }
      if(bullet&&roundLoaded(bullet)){
        msg="ROUND ALREADY LOADED";
        return false;
      }
    }
    if(isFinalBoss(target)&&roundCount()<6){
      msg="BIG IRON NOT READY";
      return false;
    }
    return true;
  }

  function transition(exit){
    var title=exit.tt||"TRAVELLING";
    var sub=exit.ts||exit.to;
    busy=true;
    if(moveTimer){clearTimeout(moveTimer);moveTimer=null;}
    save(true);
    h.setColor(0).fillRect(0,0,W-1,H-1);
    h.setFontAlign(0,0);
    font(3);
    h.setColor(3).drawString(text(title,22),W/2,135);
    font(2);
    h.setColor(2).drawString(text(sub,24),W/2,175);
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
      if(!canUseExit(exit)){
        draw(false,oldX,oldY);
        return;
      }
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
    if(queuedX||queuedY)moveTimer=setTimeout(flushMove,MOVE_MS);
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
    var title,sub;
    if(!target){
      msg="NOTHING HERE";
      draw(false,playerX,playerY);
      return;
    }
    if(target.type=="battle"||target.type=="shoot"){
      if(!canStartEncounter(target)){
        draw(false,playerX,playerY);
        return;
      }
      save(true);
      busy=true;
      title=target.lt||target.prompt||"ENCOUNTER";
      sub=target.ls||target.enemy||target.target||"";
      h.setColor(0).fillRect(0,0,W-1,H-1);
      h.setFontAlign(0,0);
      font(3);
      h.setColor(3).drawString(text(title,22),W/2,132);
      if(sub){
        font(2);
        h.setColor(2).drawString(text(sub,24),W/2,172);
      }
      A.flip(0,H-1);
      if(target.type=="shoot"){
        A.shoot({target:target.target||target.enemy||"RADROACH",map:id,mode:imageMode?"image":"tile",x:playerX,y:playerY,facing:facing,interact:target.id,once:target.once});
      }else{
        A.battle({enemy:target.enemyPool||target.enemy,map:id,mode:imageMode?"image":"tile",x:playerX,y:playerY,facing:facing,interact:target.id,once:target.once,music:target.music!==undefined?target.music:((id=="WORLD_03"||id=="WORLD_06")?"NVTH":false),boss:target.boss,miniboss:isMiniboss(target),finalBoss:isFinalBoss(target),bullet:bulletFor(target)});
      }
    }else if(target.type=="save"){
      save(false,true);
      draw(false,playerX,playerY);
    }else if(target.type=="forge"){
      forgeCourierRound();
      draw(false,playerX,playerY);
    }
  }

  function drawPauseProgress(){
    var st=storyState(),r=roundCount(),e=st.encounters||0,d=st.deadLead||e;
    h.setColor(2).drawRect(246,112,W-42,248);
    h.setFontAlign(-1,-1);
    font(1);
    h.setColor(3).drawString("BIG IRON "+r+"/6",256,122);
    h.setColor(2).drawString("JUDGMENTS "+e+"/20",256,140);
    h.drawString("DEAD LEAD "+d+"/20",256,156);
    h.drawString("CITY "+id,256,174);
    if(st.rounds&&st.rounds.COURIER)h.setColor(3).drawString("WEAPON READY",256,200);
    else if(st.forgeReady)h.setColor(3).drawString("FORGE READY",256,200);
    else h.setColor(2).drawString(e>=20?"FINAL ROUND READY":"KEEP RECORDING",256,200);
  }

  function drawPause(note){
    var options=["RESUME","SAVE LOCATION","PROGRESS","EXIT GAME"];
    var i,y;
    h.setClipRect(0,0,W-1,H-1);
    h.setColor(0).fillRect(0,0,W-1,H-1);
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
        h.setColor(2).fillRect(58,y-14,226,y+14);
        h.setColor(0);
      }else{
        h.setColor(2).drawRect(58,y-14,226,y+14);
        h.setColor(3);
      }
      font(2);
      h.drawString((i==pause?"> ":"")+options[i],142,y);
    }
    if(pause==2)drawPauseProgress();
    font(1);
    h.setColor(2).drawString(pause==2?"PROGRESS":"TURN WHEEL / PRESS TO SELECT",W/2,286);
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
        drawPause("PROGRESS");
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
    moveTimer=null;
    clickTimer=null;
    travelTimer=null;
    world=null;
    worldImage=null;
    saveState=null;
    active=null;
    playerSprites={};
    A.gc();
  }

  loadSave();
  if(arg.newGame){
    saveState.map="";
    saveState.x=undefined;
    saveState.y=undefined;
    saveState.facing="up";
    saveState.story={rounds:{},encounters:0,deadLead:0};
  }
  if(!arg.map&&saveState.map&&!exists(BASE+"DATA/"+saveState.map+".JSON"))saveState.map="";
  loadWorld(arg.map||saveState.map||"WORLD_01",arg.x!==undefined?arg:null);
  if(arg.msg)msg=arg.msg;
  draw(true);

  return {k1:k1,k2:k2,save:save,remove:remove};
})
