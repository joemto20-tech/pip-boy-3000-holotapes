(function(A,arg){
  var B=A.base;
  var W=A.w;
  var H=A.h;
  var cx=Math.floor(W/2);
  var cy=Math.floor(H/2);
  var rx=80+Math.floor(Math.random()*(W-160));
  var ry=58+Math.floor(Math.random()*(H-132));
  var rvx=6;
  var rvy=4;
  var hp=4;
  var maxHp=4;
  var shots=12;
  var msg="LINE UP THE SHOT";
  var dead=false;
  var busy=false;
  var pause=-1;
  var tickTimer=null;
  var clickTimer=null;
  var returnTimer=null;
  var roachName=(arg.target||"RADROACH").toString();

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

  function readText(path){
    try{return fs.readFile(path);}catch(e){}
    try{return fs.readFileSync(path);}catch(e2){}
    return null;
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

  function playerData(){
    try{
      if(typeof player!="undefined"&&player&&player.player)return player.player;
    }catch(e){}
    return {};
  }

  function readState(){
    var p=playerData();
    var a=null;
    var b=null;
    if(p&&p.wb&&p.wb.map)return p.wb;
    try{a=JSON.parse(readText(B+"SAVE/STATE.JSON")||"{}");}catch(e){}
    try{b=JSON.parse(readText(B+"STATE.JSON")||"{}");}catch(e2){}
    if(b&&b.map&&(!a||!a.map))return b;
    if(a&&a.map)return a;
    return a||b||{};
  }

  function writeState(s){
    var p;
    var data=JSON.stringify(s);
    if(writeText(B+"SAVE/STATE.JSON",data)||writeText(B+"STATE.JSON",data))return true;
    p=playerData();
    if(p){
      p.wb={
        map:s.map,
        mode:s.mode,
        x:s.x,
        y:s.y,
        facing:s.facing,
        cleared:s.cleared||{},
        story:s.story||{}
      };
    }
    return true;
  }

  function saveWorld(clear){
    var s=readState();
    var first=false;
    if(!s)s={};
    if(!s.cleared)s.cleared={};
    if(!s.story)s.story={};
    if(!s.story.rounds)s.story.rounds={};
    s.map=arg.map;
    s.mode=arg.mode||"tile";
    s.x=arg.x;
    s.y=arg.y;
    s.facing=arg.facing;
    if(clear&&arg.once&&arg.interact&&!s.cleared[arg.interact]){
      first=true;
      s.cleared[arg.interact]=1;
    }
    if(first){
      s.story.encounters=(s.story.encounters||0)+1;
      s.story.deadLead=s.story.encounters;
      if(s.story.encounters>=20)s.story.forgeReady=1;
    }
    writeState(s);
  }

  function bar(x,y,w,value,max){
    var p=max>0?clamp(value/max,0,1):0;
    h.setColor(2).drawRect(x,y,x+w,y+7);
    h.setColor(1).fillRect(x+2,y+2,x+w-2,y+5);
    if(p)h.setColor(3).fillRect(x+2,y+2,x+2+Math.floor((w-4)*p),y+5);
  }

  function roach(){
    var x=rx;
    var y=ry;
    h.setColor(2);
    h.fillRect(x-13,y-7,x+13,y+7);
    h.setColor(3);
    h.fillRect(x-8,y-12,x+8,y+12);
    h.setColor(1);
    h.drawLine(x-17,y-10,x-31,y-21);
    h.drawLine(x-17,y,x-35,y);
    h.drawLine(x-17,y+10,x-31,y+21);
    h.drawLine(x+17,y-10,x+31,y-21);
    h.drawLine(x+17,y,x+35,y);
    h.drawLine(x+17,y+10,x+31,y+21);
    h.setColor(0);
    h.fillRect(x-5,y-5,x-1,y+5);
    h.fillRect(x+1,y-5,x+5,y+5);
  }

  function crosshair(){
    h.setColor(3);
    h.drawCircle(cx,cy,13);
    h.drawLine(cx-22,cy,cx-7,cy);
    h.drawLine(cx+7,cy,cx+22,cy);
    h.drawLine(cx,cy-22,cx,cy-7);
    h.drawLine(cx,cy+7,cx,cy+22);
    h.setColor(2).drawRect(cx-1,cy-1,cx+1,cy+1);
  }

  function draw(){
    if(dead)return;
    h.setClipRect(0,0,W-1,H-1);
    h.setColor(0).fillRect(0,0,W-1,H-1);
    h.setColor(2).drawRect(4,4,W-5,H-5);
    roach();
    crosshair();
    h.setColor(0).fillRect(0,H-55,W-1,H-1);
    h.setColor(2).drawLine(0,H-56,W-1,H-56);
    h.setFontAlign(-1,-1);
    font(1);
    h.setColor(3).drawString(text(roachName,18),8,H-49);
    h.setColor(2).drawString("AMMO "+shots,8,H-22);
    bar(128,H-45,160,hp,maxHp);
    h.setFontAlign(0,-1);
    h.setColor(3).drawString(text(msg,36),W/2,H-24);
    A.flip(0,H-1);
  }

  function moveRoach(){
    if(dead||busy||pause>=0)return;
    rx+=rvx;
    ry+=rvy;
    if(rx<42||rx>W-43){
      rvx=-rvx;
      rx=clamp(rx,42,W-43);
    }
    if(ry<34||ry>H-82){
      rvy=-rvy;
      ry=clamp(ry,34,H-82);
    }
    draw();
  }

  function startTick(){
    if(tickTimer)clearInterval(tickTimer);
    tickTimer=setInterval(moveRoach,210);
  }

  function finish(win){
    busy=true;
    dead=true;
    if(tickTimer)clearInterval(tickTimer);
    tickTimer=null;
    saveWorld(win);
    h.setColor(0).fillRect(0,0,W-1,H-1);
    h.setColor(2).drawRect(22,20,W-23,H-21);
    h.drawRect(30,28,W-31,H-29);
    h.setFontAlign(0,0);
    font(4);
    h.setColor(3).drawString(win?"VICTORY":"DEFEAT",W/2,92);
    font(2);
    h.setColor(2).drawString(win?"TARGET DOWN":"OUT OF AMMO",W/2,145);
    font(1);
    h.drawString("RETURNING TO MAP",W/2,205);
    h.flip();
    if(returnTimer)clearTimeout(returnTimer);
    returnTimer=setTimeout(function(){
      returnTimer=null;
      A.world({map:arg.map,x:arg.x,y:arg.y,facing:arg.facing,msg:win?"RADROACH CLEARED":"NEED MORE PRACTICE"});
    },1500);
  }

  function shoot(){
    var dx;
    var dy;
    var hit;
    if(busy||dead||pause>=0)return;
    shots--;
    dx=cx-rx;
    dy=cy-ry;
    hit=dx*dx+dy*dy<=24*24;
    if(hit){
      hp--;
      msg=hp>0?"HIT - KEEP FIRING":"DIRECT HIT";
      if(hp<=0){
        draw();
        finish(true);
        return;
      }
    }else{
      msg=shots>0?"MISS":"EMPTY";
    }
    if(shots<=0){
      draw();
      finish(false);
      return;
    }
    draw();
  }

  function drawPause(note){
    var options=["RESUME","SAVE LOCATION","EXIT GAME"];
    var i,y;
    h.setColor(0).fillRect(0,0,W-1,H-1);
    h.setColor(2).drawRect(26,20,W-27,H-21);
    h.drawRect(32,26,W-33,H-27);
    h.setFontAlign(0,0);
    font(4);
    h.setColor(3).drawString("PAUSED",W/2,58);
    font(1);
    h.setColor(2).drawString("SHOOTING RANGE",W/2,92);
    for(i=0;i<3;i++){
      y=126+i*46;
      if(i==pause){
        h.setColor(2).fillRect(92,y-16,W-93,y+16);
        h.setColor(0);
      }else{
        h.setColor(2).drawRect(92,y-16,W-93,y+16);
        h.setColor(3);
      }
      font(2);
      h.drawString((i==pause?"> ":"")+options[i],W/2,y);
    }
    font(1);
    h.setColor(2).drawString(note||"DOUBLE PRESS TO PAUSE",W/2,286);
    h.flip();
  }

  function openPause(){
    if(busy||dead)return;
    pause=0;
    drawPause();
  }

  function pauseSelect(){
    if(pause===0){
      pause=-1;
      draw();
    }else if(pause==1){
      saveWorld(false);
      drawPause("GAME SAVED");
    }else{
      saveWorld(false);
      A.exit();
    }
  }

  function click(){
    if(clickTimer){
      clearTimeout(clickTimer);
      clickTimer=null;
      openPause();
    }else{
      clickTimer=setTimeout(function(){
        clickTimer=null;
        if(pause>=0)pauseSelect();
        else shoot();
      },210);
    }
  }

  function k1(value,longPress){
    if(dead)return;
    if(value===0){
      if(longPress){
        if(clickTimer){clearTimeout(clickTimer);clickTimer=null;}
        return;
      }
      click();
      return;
    }
    if(clickTimer){clearTimeout(clickTimer);clickTimer=null;}
    if(pause>=0){
      pause=(pause+(value<0?-1:1)+3)%3;
      drawPause();
      return;
    }
    cy=clamp(cy+(value<0?-8:8),24,H-74);
    draw();
  }

  function k2(value){
    if(dead||!value)return;
    if(clickTimer){clearTimeout(clickTimer);clickTimer=null;}
    if(pause>=0){
      pause=(pause+(value<0?-1:1)+3)%3;
      drawPause();
      return;
    }
    cx=clamp(cx+(value<0?-8:8),24,W-24);
    draw();
  }

  function remove(){
    dead=true;
    if(tickTimer)clearInterval(tickTimer);
    if(clickTimer)clearTimeout(clickTimer);
    if(returnTimer)clearTimeout(returnTimer);
    tickTimer=null;
    clickTimer=null;
    returnTimer=null;
    A.gc();
  }

  saveWorld(false);
  draw();
  startTick();

  return {k1:k1,k2:k2,save:function(){saveWorld(false);},remove:remove};
})
