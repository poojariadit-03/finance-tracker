/* ═══ DATA ═══ */
var D={config:{income:0,savpct:20,theme:'auto',fontSize:'normal',dailyLimit:0},accounts:[],expenses:[],fixed:[],paid:{},goals:[],fds:[],rds:[],budgets:{},autoLogged:[],extraIncome:[],monthResetSeen:[],customCategories:[],liabilities:[],lent:[],
  transfers:[],
  templates:[]};

/* ── TOAST (replaces alert) ── */

var _gsTimer=null;
function doGlobalSearch(q){
  var el=document.getElementById('gsearchResults');
  if(!q||q.length<2){el.classList.remove('show');return;}
  clearTimeout(_gsTimer);
  _gsTimer=setTimeout(function(){
    var qq=q.toLowerCase();
    var expResults=D.expenses.filter(function(e){
      return e.name.toLowerCase().indexOf(qq)>-1||e.cat.toLowerCase().indexOf(qq)>-1||(e.note&&e.note.toLowerCase().indexOf(qq)>-1)||(e.tags&&e.tags.toLowerCase().indexOf(qq)>-1);
    });
    var incResults=(D.extraIncome||[]).filter(function(e){
      return e.name.toLowerCase().indexOf(qq)>-1||(e.source&&e.source.toLowerCase().indexOf(qq)>-1);
    }).map(function(e){return {id:e.id,name:e.name,cat:e.source||'Income',amt:e.amt,date:e.date,month:e.month,_isIncome:true};});
    var results=expResults.concat(incResults).slice().reverse().slice(0,20);
    if(!results.length){el.innerHTML='<div class="gsr-item" style="color:var(--tx3)">No results</div>';el.classList.add('show');return;}
    el.innerHTML=results.map(function(e){
      var d=new Date(e.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
      var icon=e._isIncome?'<span style="color:var(--green);font-size:11px;margin-right:4px">+</span>':'';
      return '<div class="gsr-item" onclick="jumpToExpense(\''+e.month+'\')"><div><div class="gsr-name">'+e.name+'</div><div class="gsr-meta">'+d+' · '+e.cat+'</div></div><span style="font-family:\'DM Mono\',monospace;font-size:13px;font-weight:500;flex-shrink:0">'+fmt(e.amt)+'</span></div>';
    }).join('');
    el.classList.add('show');
  },200);
}
function jumpToExpense(month){
  var parts=month.split('-');
  curDate=new Date(parseInt(parts[0]),parseInt(parts[1])-1,1);
  updateHeader();renderAll();switchTab('expenses');
  document.getElementById('gsearchResults').classList.remove('show');
  document.getElementById('globalSearch').value='';
}
document.addEventListener('click',function(e){if(!e.target.closest||!e.target.closest('.gsearch-wrap'))document.getElementById('gsearchResults').classList.remove('show');});

function showToast(msg,type){
  var el=document.getElementById('ftToast');
  el.textContent=msg;el.className='ft-toast '+(type||'');
  void el.offsetWidth;el.classList.add('show');
  if(_toastTimer)clearTimeout(_toastTimer);
  _toastTimer=setTimeout(function(){el.classList.remove('show');},2800);
}

var db=null,saveTimer=null,curDate=new Date(),selDay=null,_toastTimer=null;
var _rangeFrom=null,_rangeTo=null,_qFilterMode='all',_histRangeMonths=6,_fixedSearch='',_fixedSort='default',_bulkSelected=new Set();
var _isSaving=false; /* BUG FIX: prevent listener overwrite during save */
var _cat=null,_alloc=null,_trend=null,_hist=null,_acc=null;
/* CC kept for legacy; use getCatColor() for full support including custom cats */
var CC={Food:'#1D9E75',Transport:'#378ADD',Shopping:'#D4537E',Health:'#7F77DD',Entertainment:'#EF9F27',Utilities:'#3B6D11',Education:'#534AB7',Other:'#888780'};
var AC=['#185FA5','#1D9E75','#BA7517','#D85A30','#534AB7','#63991B','#888780'];
var GC=['#1D9E75','#185FA5','#534AB7','#D4537E','#EF9F27','#D85A30'];
var FBKEY='ft_firebase_config';
function getExtraIncome(d){var m=mk(d);return (D.extraIncome||[]).filter(function(e){return e.month===m;});}
function extraIncomeTotal(d){return getExtraIncome(d).reduce(function(s,e){return s+e.amt;},0);}
var INC_SOURCES=[{key:'Pocket Money',icon:'💵'},{key:'Freelance',icon:'💻'},{key:'Gift',icon:'🎁'},{key:'Business',icon:'🏪'},{key:'Bonus',icon:'🎯'},{key:'Other',icon:'💰'}];
var selIncSrc='Pocket Money';

/* ═══ FIREBASE SETUP ═══ */
function extractConfig(txt){
  var cfg={},keys=['apiKey','authDomain','databaseURL','projectId','storageBucket','messagingSenderId','appId'];
  keys.forEach(function(k){var m=txt.match(new RegExp(k+'\\s*:\\s*["\']([^"\']+)["\']'));if(m)cfg[k]=m[1];});
  return cfg;
}
function connectFirebase(){
  var txt=document.getElementById('cfgInput').value.trim();
  var cfg=extractConfig(txt);
  var err=document.getElementById('setupErr');
  if(!cfg.apiKey){err.textContent='Could not find apiKey. Please paste the full firebaseConfig object.';err.style.display='block';return;}
  if(!cfg.databaseURL){err.textContent='Could not find databaseURL. Make sure you created the Realtime Database in step 2.';err.style.display='block';return;}
  err.style.display='none';
  localStorage.setItem(FBKEY,JSON.stringify(cfg));
  initFirebase(cfg);
}
function initFirebase(cfg){
  document.getElementById('setup').style.display='none';
  document.getElementById('loading').style.display='flex';
  document.getElementById('loadingTxt').textContent='Connecting to Firebase...';
  try{
    if(!firebase.apps.length)firebase.initializeApp(cfg);
    db=firebase.database();
    loadFromFirebase();
  }catch(e){
    document.getElementById('loading').style.display='none';
    document.getElementById('setup').style.display='flex';
    var err=document.getElementById('setupErr');
    err.textContent='Connection failed: '+e.message+'. Please check your config and try again.';
    err.style.display='block';
    localStorage.removeItem(FBKEY);
  }
}
function disconnectFirebase(){
  if(!confirm('Disconnect from Firebase? You will need to re-enter your config.'))return;
  localStorage.removeItem(FBKEY);
  location.reload();
}
function loadFromFirebase(){
  document.getElementById('loadingTxt').textContent='Loading your data...';
  db.ref('finances/data').once('value').then(function(snap){
    var val=snap.val();
    if(val){try{var ld=JSON.parse(val);D=ld;if(!D.autoLogged)D.autoLogged=[];if(!D.fds)D.fds=[];if(!D.rds)D.rds=[];if(!D.extraIncome)D.extraIncome=[];if(!D.monthResetSeen)D.monthResetSeen=[];if(!D.config.theme)D.config.theme='auto';if(!D.config.fontSize)D.config.fontSize='normal';if(D.config.budgetCarryover===undefined)D.config.budgetCarryover=false;if(!D.config.dailyLimit)D.config.dailyLimit=0;if(!D.liabilities)D.liabilities=[];if(!D.customCategories)D.customCategories=[];if(!D.occasions)D.occasions=[];if(!D.lent)D.lent=[];if(!D.transfers)D.transfers=[];if(!D.templates)D.templates=[];}catch(e){initDefaults();}}
    else initDefaults();
    document.getElementById('loading').style.display='none';
    document.getElementById('app').style.display='block';
    updateHeader();renderAll();setSyncStatus('synced');
    listenForChanges();
  }).catch(function(e){
    document.getElementById('loadingTxt').textContent='Error loading data: '+e.message;
  });
}
function listenForChanges(){
  db.ref('finances/data').on('value',function(snap){
    if(_isSaving)return; /* BUG FIX: skip if mid-save */
    var val=snap.val();
    if(val){
      try{
        var fresh=JSON.parse(val);
        if(!fresh.customCategories)fresh.customCategories=[];if(!fresh.occasions)fresh.occasions=[];if(!fresh.lent)fresh.lent=[];
        if(!fresh.liabilities)fresh.liabilities=[];
        if(!fresh.config)fresh.config={};if(!fresh.config.dailyLimit)fresh.config.dailyLimit=0;
        if(JSON.stringify(fresh)!==JSON.stringify(D)){D=fresh;renderAll();}
      }catch(e){}
    }
  });
}
function autoSave(){
  _isSaving=true;
  cleanupPaidData(); /* BUG FIX */
  setSyncStatus('syncing');
  if(saveTimer)clearTimeout(saveTimer);
  saveTimer=setTimeout(function(){saveToFirebase();},2000);
}
function saveToFirebase(){
  if(!db)return;
  db.ref('finances/data').set(JSON.stringify(D)).then(function(){
    setSyncStatus('synced');
    setTimeout(function(){_isSaving=false;},1000); /* BUG FIX */
  }).catch(function(){setSyncStatus('error');_isSaving=false;});
}
function setSyncStatus(s){
  var dot=document.getElementById('syncDot'),lbl=document.getElementById('syncLabel');
  if(!dot)return;
  dot.className='sync-dot'+(s==='syncing'?' syncing':s==='error'?' error':'');
  lbl.textContent=s==='syncing'?'Syncing...':s==='error'?'Sync error':'Synced';
}
