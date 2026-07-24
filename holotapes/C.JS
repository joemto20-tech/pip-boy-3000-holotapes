(function(A,arg){
var dead=0,t=0;
function start(){if(dead)return;dead=1;t=0;if(A.music)A.music(0);A.world({newGame:true,msg:"WELCOME TO SUNSCAR"})}
t=setTimeout(start,40);
return{k1:function(){},k2:function(){},remove:function(){dead=1;if(t)clearTimeout(t);t=0;}};
})
