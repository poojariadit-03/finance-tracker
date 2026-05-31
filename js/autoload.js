/* ═══ AUTO-LOAD ═══ */
(function(){
  var saved=localStorage.getItem(FBKEY);
  if(saved){
    try{var cfg=JSON.parse(saved);initFirebase(cfg);}
    catch(e){localStorage.removeItem(FBKEY);}
  }
})();
