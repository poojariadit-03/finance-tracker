/* ═══ EXPENSES ═══ */

function saveDailyLimit(){
  var v=parseFloat(document.getElementById('dailyLimitInput').value)||0;
  D.config.dailyLimit=v;autoSave();renderDailyLimit();toggleForm('daily-limit-form');
  showToast('Daily limit set to '+fmt(v),'success');
  var aeFilter=document.getElementById('expAccFilter');if(aeFilter){var accs=D.accounts;aeFilter.innerHTML='<option value="">All accounts</option>'+accs.map(function(a){return '<option value="'+a.id+'">'+a.name+'</option>';}).join('');}
}
function renderDailyLimit(){
  var el=document.getElementById('dailyLimitDisplay');if(!el)return;
  var limit=D.config.dailyLimit||0;
  /* Only show today's bar when viewing current month */
  var now=new Date(),isCurMonth=curDate.getFullYear()===now.getFullYear()&&curDate.getMonth()===now.getMonth();
  if(!limit||!isCurMonth){el.innerHTML='<span style="font-size:13px;color:var(--tx3)">'+(limit?'Daily limit: '+fmt(limit)+' (viewing past month)':'No daily limit set.')+'</span>';return;}
  var today=new Date(),exps=D.expenses.filter(function(e){
    var d=new Date(e.date);
    return d.getFullYear()===today.getFullYear()&&d.getMonth()===today.getMonth()&&d.getDate()===today.getDate();
  });
  var spent=exps.reduce(function(s,e){return s+e.amt;},0);
  var pct=Math.min(100,spent/limit*100),over=spent>limit,col=pct<60?'var(--green)':pct<85?'var(--amber)':'var(--red)';
  el.innerHTML='<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px"><span>Today: <strong style="font-family:\'DM Mono\',monospace">'+fmt(spent)+'</strong> of '+fmt(limit)+' limit</span><span style="color:'+(over?'var(--red)':'var(--tx3)')+'">'+(over?'⚠️ Over by '+fmt(spent-limit):fmt(limit-spent)+' left')+'</span></div><div class="pbg" style="height:10px"><div class="pfill" style="width:'+pct.toFixed(1)+'%;background:'+col+'"></div></div>';
}


var BUILTIN_CATS=[
  {name:'Food',emoji:'🍕',color:'#1D9E75'},{name:'Transport',emoji:'🚗',color:'#378ADD'},
  {name:'Shopping',emoji:'🛍️',color:'#D4537E'},{name:'Health',emoji:'💊',color:'#7F77DD'},
  {name:'Entertainment',emoji:'🎬',color:'#EF9F27'},{name:'Utilities',emoji:'💡',color:'#3B6D11'},
  {name:'Education',emoji:'📚',color:'#534AB7'},{name:'Other',emoji:'📦',color:'#888780'}
];
function getAllCategories(){return BUILTIN_CATS.concat(D.customCategories||[]);}
function getCatColor(name){var c=getAllCategories().find(function(x){return x.name===name;});return c?c.color:'#888780';}

function addCustomCategory(){
  var emoji=document.getElementById('newCatEmoji').value.trim()||'🏷️';
  var name=document.getElementById('newCatName').value.trim();
  var color=document.getElementById('newCatColor').value.trim()||'#888780';
  if(!name)return;
  if(getAllCategories().find(function(c){return c.name.toLowerCase()===name.toLowerCase();})){showToast('Category already exists','error');return;}
  if(!D.customCategories)D.customCategories=[];if(!D.lent)D.lent=[];if(!D.transfers)D.transfers=[];if(!D.templates)D.templates=[];
  D.customCategories.push({name:name,emoji:emoji,color:color});
  autoSave();
  document.getElementById('newCatEmoji').value='';document.getElementById('newCatName').value='';document.getElementById('newCatColor').value='';
  renderCustomCategories();populateCatSelects();
}
function removeCustomCategory(name){
  D.customCategories=(D.customCategories||[]).filter(function(c){return c.name!==name;});
  autoSave();renderCustomCategories();populateCatSelects();
}
function renderCustomCategories(){
  var el=document.getElementById('customCatList');if(!el)return;
  var cc=D.customCategories||[];
  if(!cc.length){el.innerHTML='<span style="font-size:13px;color:var(--tx3)">No custom categories yet.</span>';return;}
  el.innerHTML=cc.map(function(c){return '<span class="cat-chip"><span>'+c.emoji+'</span><span>'+c.name+'</span><button class="cat-chip-del" onclick="removeCustomCategory(\''+c.name+'\')">×</button></span>';}).join('');
}
function populateCatSelects(){
  var cats=getAllCategories();
  var opts=cats.map(function(c){return '<option>'+c.name+'</option>';}).join('');
  ['expCat','budgetCat','editCat','fixCat','efCat'].forEach(function(id){var el=document.getElementById(id);if(el){var prev=el.value;el.innerHTML=opts;if(prev)el.value=prev;}});
}

function addExpense(){
  var name=document.getElementById('expName').value.trim(),cat=document.getElementById('expCat').value,accId=document.getElementById('expAcc').value,amt=parseFloat(document.getElementById('expAmt').value);
  var dv=document.getElementById('expDate').value||todayStr();
  var note=document.getElementById('expNote')?document.getElementById('expNote').value.trim():'';
  var tags=document.getElementById('expTags')?document.getElementById('expTags').value.trim():'';
  if(!name||isNaN(amt)||amt<=0)return;
  var parts=dv.split('-'),ed=new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2]),12,0,0).toISOString(),m=parts[0]+'-'+parts[1];
  D.expenses.push({id:Date.now().toString(),date:ed,month:m,name:name,cat:cat,amt:amt,accountId:accId,note:note,tags:tags});
  autoSave();
  document.getElementById('expName').value='';document.getElementById('expAmt').value='';
  document.getElementById('expDate').value=todayStr();
  if(document.getElementById('expNote'))document.getElementById('expNote').value='';
  if(document.getElementById('expTags'))document.getElementById('expTags').value='';
  var recurEl=document.getElementById('expRecurring');
  if(recurEl&&recurEl.checked){
    D.fixed.push({id:Date.now().toString()+'_fromexp',name:name,amt:amt,freq:'Monthly',recurring:true,dueDay:0,cat:document.getElementById('expCat')?document.getElementById('expCat').value:'Utilities',accountId:document.getElementById('expAcc')?document.getElementById('expAcc').value:'',autoLog:true,skippedMonths:[]});
    recurEl.checked=false;
    showToast('Added '+name+' — '+fmt(amt)+' (also added to Fixed)','success');
  } else {
    showToast('Added '+name+' — '+fmt(amt),'success');
  }
  renderExpenses();recalc();renderAccounts();
}


/* ═══ EXPENSE ANALYTICS ═══ */
function renderExpenseAnalytics(arr){
  var el=document.getElementById('expAnalytics');if(!el||!arr)return;
  if(!arr.length){el.innerHTML='';return;}
  var total=arr.reduce(function(s,e){return s+e.amt;},0);
  var avg=total/arr.length;
  var max=arr.reduce(function(a,e){return e.amt>a.amt?e:a;},arr[0]);
  var cats={};arr.forEach(function(e){cats[e.cat]=(cats[e.cat]||0)+e.amt;});
  var topCat=Object.keys(cats).sort(function(a,b){return cats[b]-cats[a];})[0]||'—';
  el.innerHTML='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:10px 0;border-top:1px solid var(--bdr);margin-top:4px">'
    +'<div><div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--tx3);margin-bottom:3px">Total</div><div style="font-family:monospace;font-size:14px;font-weight:600">'+fmt(total)+'</div></div>'
    +'<div><div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--tx3);margin-bottom:3px">Average</div><div style="font-family:monospace;font-size:14px">'+fmt(Math.round(avg))+'</div></div>'
    +'<div><div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--tx3);margin-bottom:3px">Highest</div><div style="font-family:monospace;font-size:14px;color:var(--red)">'+fmt(max.amt)+'</div><div style="font-size:10px;color:var(--tx3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+max.name+'</div></div>'
    +'<div><div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--tx3);margin-bottom:3px">Top cat</div><div style="font-size:13px;font-weight:600">'+topCat+'</div><div style="font-size:10px;color:var(--tx3)">'+arr.length+' entries</div></div>'
    +'</div>';
}


var _expSort='date-desc';
function setExpSort(mode,btn){
  _expSort=mode;
  /* BUG FIX: sync the dropdown so renderExpenses reads the right sort mode */
  var sel=document.getElementById('expSortSel');
  if(sel)sel.value=mode;
  document.querySelectorAll('.sort-btn').forEach(function(b){b.classList.remove('active');});
  if(btn)btn.classList.add('active');
  renderExpenses(document.getElementById('expSearch').value||undefined);
}


/* ═══ BULK DELETE ═══ */
var _bulkSelected=new Set();
function toggleBulkSelect(id,cb){
  if(cb.checked)_bulkSelected.add(id);
  else _bulkSelected.delete(id);
  updateBulkBar();
}
function updateBulkBar(){
  var bar=document.getElementById('bulkBar'),cnt=document.getElementById('bulkCount');
  if(_bulkSelected.size>0){bar.classList.add('show');if(cnt)cnt.textContent=_bulkSelected.size+' selected';}
  else bar.classList.remove('show');
}
function clearBulkSelection(){
  _bulkSelected.clear();
  document.querySelectorAll('.exp-check').forEach(function(cb){cb.checked=false;});
  updateBulkBar();
}
function bulkDelete(){
  if(!_bulkSelected.size)return;
  if(!confirm('Delete '+_bulkSelected.size+' expense'+(  _bulkSelected.size>1?'s':''  )+'?'))return;
  D.expenses=D.expenses.filter(function(e){return !_bulkSelected.has(e.id);});
  _bulkSelected.clear();
  autoSave();renderExpenses();recalc();renderAccounts();updateBulkBar();
  showToast('Deleted expenses','success');
}

function markReimbursed(id){
  var e=D.expenses.find(function(e){return e.id===id;});if(!e)return;
  e.tags=(e.tags?e.tags+' ':'')+'#reimbursed';
  e.note=(e.note?e.note+' · ':'')+'Reimbursed on '+todayStr();
  autoSave();renderExpenses();
  showToast('Marked as reimbursed','success');
}

function removeExpense(id){
  if(!confirm('Delete this expense?'))return;
  D.expenses=D.expenses.filter(function(e){return e.id!==id;});
  autoSave();renderExpenses();recalc();renderAccounts();
}
function renderExpenses(textFilter,dateFilter){
  if(typeof _rangeFrom!=='undefined'&&(_rangeFrom||_rangeTo)){renderExpensesRange();return;}
  var arr=(typeof _qFilterMode!=='undefined'&&_qFilterMode==='reimb')?D.expenses:getExpenses(),accs=D.accounts,el=document.getElementById('expList');
  if(textFilter){var q=textFilter.toLowerCase();arr=arr.filter(function(e){return e.name.toLowerCase().indexOf(q)>-1||e.cat.toLowerCase().indexOf(q)>-1||(e.note&&e.note.toLowerCase().indexOf(q)>-1)||(e.tags&&e.tags.toLowerCase().indexOf(q)>-1);});}
  if(dateFilter){arr=arr.filter(function(e){return new Date(e.date).toISOString().slice(0,10)===dateFilter;});}
  /* Quick filter */
  if(typeof _qFilterMode!=='undefined'&&_qFilterMode!=='all'){
    var _now=new Date(),_dow=_now.getDay();
    var _wkS=new Date(_now);_wkS.setDate(_now.getDate()-_dow);_wkS.setHours(0,0,0,0);
    arr=arr.filter(function(e){
      var d=new Date(e.date);
      if(_qFilterMode==='today')return d.getDate()===_now.getDate()&&d.getMonth()===_now.getMonth()&&d.getFullYear()===_now.getFullYear();
      if(_qFilterMode==='week')return d>=_wkS&&d<=_now;
      if(_qFilterMode==='reimb')return (e.tags&&(e.tags.toLowerCase().indexOf('#reimbursable')>-1||e.tags.toLowerCase().indexOf('reimbursable')>-1))||(e.note&&e.note.toLowerCase().indexOf('reimbursable')>-1);
      return true;
    });
  }
  /* Category filter */
  if(typeof _selCatFilter!=='undefined'&&_selCatFilter)arr=arr.filter(function(e){return e.cat===_selCatFilter;});
  /* Account filter */
  var _accFil=document.getElementById('expAccFilter');
  if(_accFil&&_accFil.value)arr=arr.filter(function(e){return e.accountId===_accFil.value;});
  /* Sort */
  var _sortSel=document.getElementById('expSortSel'),_sortMode=_sortSel?_sortSel.value:'date-desc';
  if(_sortMode==='date-asc')arr.sort(function(a,b){return new Date(a.date)-new Date(b.date);});
  else if(_sortMode==='amt-desc')arr.sort(function(a,b){return b.amt-a.amt;});
  else if(_sortMode==='amt-asc')arr.sort(function(a,b){return a.amt-b.amt;});
  else arr.sort(function(a,b){return new Date(b.date)-new Date(a.date);});
  /* Analytics strip */
  renderExpenseAnalytics(arr);
  if(!arr.length){
    var msg=dateFilter?'No expenses on '+new Date(dateFilter+'T12:00:00').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'}):(textFilter?'No results for "'+textFilter+'"':'No expenses this month.');
    el.innerHTML='<p class="empty">'+msg+'</p>';renderBudgetBars();checkBudgetAlerts();return;
  }
  /* BUG FIX: clear stale bulk selection when list re-renders */
  _bulkSelected.clear();updateBulkBar();
  el.innerHTML=arr.map(function(e){var c=getCatColor(e.cat),d=new Date(e.date).toLocaleDateString('en-IN',{month:'short',day:'numeric'}),acc=accs.find(function(a){return a.id===e.accountId;});var tagHtml='';if(e.tags){e.tags.split(' ').filter(Boolean).forEach(function(t){tagHtml+='<span style="display:inline-block;background:var(--bbg,#E6F1FB);color:var(--blue,#185FA5);font-size:9px;font-weight:600;padding:1px 6px;border-radius:99px;margin-left:3px">'+t+'</span>';});}
    var noteHtml=e.note?'<div style="font-size:11px;color:var(--tx3);font-style:italic">📝 '+e.note+'</div>':'';
    /* BUG FIX: show Got paid button for reimbursable expenses not yet reimbursed */
    var isReimb=e.tags&&(e.tags.toLowerCase().indexOf('#reimbursable')>-1||e.tags.toLowerCase().indexOf('reimbursable')>-1);
    var isReimbursed=e.tags&&e.tags.toLowerCase().indexOf('#reimbursed')>-1;
    var reimbBtn=isReimb&&!isReimbursed?'<button class="btn-ghost" style="padding:2px 6px;font-size:10px;color:var(--green)" onclick="markReimbursed(this.dataset.id)" data-id="'+e.id+'" title="Mark reimbursed">💸 Got paid</button>':'';
    return '<div class="erow"><input type="checkbox" class="exp-check" onclick="toggleBulkSelect(\''+e.id+'\',this)" style="margin-right:4px"><div class="eleft"><div class="dot" style="background:'+c+'"></div><div style="min-width:0"><div class="ename">'+e.name+tagHtml+'</div><div class="emeta">'+d+' - '+e.cat+(acc?' - '+acc.name:'')+'</div>'+noteHtml+'</div></div><div class="eright"><span class="eamt">'+fmt(e.amt)+'</span>'+reimbBtn+'<button class="edit-btn" onclick="openEdit(\''+e.id+'\')">✏️</button><button class="del-btn" onclick="removeExpense(\''+e.id+'\')">×</button></div></div>';}).join('');
  renderBudgetBars();checkBudgetAlerts();
}

var _qFilterMode='all';
function setQFilter(mode,btn){
  if(mode==='reimb'){_qFilterMode='reimb';document.querySelectorAll('.qpill').forEach(function(p){p.classList.remove('active');});if(btn)btn.classList.add('active');renderExpenses(document.getElementById('expSearch').value||undefined);return;}
  _qFilterMode=mode;
  document.querySelectorAll('.qpill').forEach(function(p){p.classList.remove('active');});
  btn.classList.add('active');
  renderExpenses(document.getElementById('expSearch').value||undefined);
}

function filterExpenses(){var txt=document.getElementById('expSearch').value;renderExpenses(txt||null);}
function clearExpFilter(){document.getElementById('expSearch').value='';renderExpenses();}
function searchExpenses(q){renderExpenses(q);}

/* ═══ BUDGETS ═══ */

function updateBudgetHint(){
  var cat=document.getElementById('budgetCat').value;
  var hint=document.getElementById('budgetHint');
  if(!hint)return;
  var current=D.budgets[cat];
  hint.textContent=current?'Current limit: '+fmt(current):'No limit set for this category';
}

function saveBudget(){var cat=document.getElementById('budgetCat').value,amt=parseFloat(document.getElementById('budgetAmt').value);if(!cat||isNaN(amt)||amt<0)return;if(amt===0)delete D.budgets[cat];else D.budgets[cat]=amt;autoSave();document.getElementById('budgetAmt').value='';renderBudgetBars();checkBudgetAlerts();}
function clearBudget(){delete D.budgets[document.getElementById('budgetCat').value];autoSave();renderBudgetBars();checkBudgetAlerts();}
function copyLastMonthBudget(){
  var lastDate=new Date(curDate.getFullYear(),curDate.getMonth()-1,1);
  var lastM=lastDate.getFullYear()+'-'+String(lastDate.getMonth()+1).padStart(2,'0');
  /* Get last month's actual spending by category as a suggested budget */
  var lastExps=D.expenses.filter(function(e){return e.month===lastM;});
  if(!lastExps.length&&!Object.keys(D.budgets).length){showToast('No last month data to copy','error');return;}
  /* If budgets exist, copy them; otherwise suggest from last month spending */
  var source=Object.keys(D.budgets).length?D.budgets:null;
  if(source){
    /* budgets already set — just confirm copy */
    if(!confirm('This will keep your current budgets. They are already set. Use last month\'s spending as new budgets instead?'))return;
  }
  var cats={};lastExps.forEach(function(e){cats[e.cat]=(cats[e.cat]||0)+e.amt;});
  if(!Object.keys(cats).length){showToast('No spending last month to copy from','error');return;}
  Object.keys(cats).forEach(function(cat){D.budgets[cat]=Math.ceil(cats[cat]/100)*100;});
  autoSave();renderBudgetBars();checkBudgetAlerts();
  showToast('Budgets set from last month\'s spending','success');
}
function renderBudgetBars(){
  var budgets=D.budgets,cats=Object.keys(budgets),el=document.getElementById('budgetBars');
  if(!cats.length){el.innerHTML='<p class="empty" style="margin-bottom:4px">No budgets set. Click &ldquo;+ Set budget&rdquo; to add limits.</p>';return;}
  var spent={};getExpenses().forEach(function(e){spent[e.cat]=(spent[e.cat]||0)+e.amt;});
  /* Carry over unused budget from last month */
  var carryover={};
  if(D.config.budgetCarryover){
    var lastDate=new Date(curDate.getFullYear(),curDate.getMonth()-1,1);
    var lastSpent={};getExpenses(lastDate).forEach(function(e){lastSpent[e.cat]=(lastSpent[e.cat]||0)+e.amt;});
    Object.keys(budgets).forEach(function(cat){
      var unused=Math.max(0,(budgets[cat]||0)-(lastSpent[cat]||0));
      carryover[cat]=unused;
    });
  }
  /* Budget summary header */
  var spent2={};getExpenses().forEach(function(e){spent2[e.cat]=(spent2[e.cat]||0)+e.amt;});
  var totalBudgeted=cats.reduce(function(s,c){return s+(budgets[c]||0);},0);
  var totalUsed=cats.reduce(function(s,c){return s+(spent2[c]||0);},0);
  var summaryHtml='';
  if(cats.length>1){
    var overallPct=totalBudgeted>0?Math.min(100,totalUsed/totalBudgeted*100):0;
    var ovCol=overallPct>=80?'var(--red)':overallPct>=60?'var(--amber)':'var(--green)';
    summaryHtml='<div style="background:var(--sur2);border-radius:8px;padding:8px 10px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:12px;font-weight:600;color:var(--tx2)">All budgets</span><span style="font-family:monospace;font-size:12px;color:'+ovCol+'">'+fmt(totalUsed)+' / '+fmt(totalBudgeted)+' ('+overallPct.toFixed(0)+'%)</span></div>';
  }
  el.innerHTML=summaryHtml+cats.map(function(cat){var baseLimit=budgets[cat],carry=carryover[cat]||0,limit=baseLimit+carry,used=spent[cat]||0,pct=Math.min(100,used/limit*100),over=used>limit,barCol=pct<60?'var(--green)':pct<85?'var(--amber)':'var(--red)',catCol=getCatColor(cat);var pill=over?'<span style="background:var(--rbg);color:var(--red);font-size:10px;font-weight:600;padding:1px 8px;border-radius:99px;margin-left:6px">OVER</span>':pct>=85?'<span style="background:var(--abg);color:var(--amber);font-size:10px;font-weight:600;padding:1px 8px;border-radius:99px;margin-left:6px">NEAR LIMIT</span>':'';return '<div style="margin-bottom:13px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="display:flex;align-items:center;font-size:13px;font-weight:500"><span style="width:8px;height:8px;border-radius:50%;background:'+catCol+';display:inline-block;margin-right:6px"></span>'+cat+pill+'</span><span style="font-size:12px;font-family:\'DM Mono\',monospace">'+fmt(used)+' / '+fmt(limit)+'</span></div><div class="pbg" style="height:8px"><div class="pfill" style="width:'+pct.toFixed(1)+'%;background:'+barCol+'"></div></div><div style="display:flex;justify-content:space-between;font-size:11px;margin-top:3px"><span style="color:'+(over?'var(--red)':pct>=85?'var(--amber)':'var(--tx3)')+'">'+( over?'Over by '+fmt(used-limit):fmt(Math.max(0,limit-used))+' left')+'</span><span style="color:var(--tx3)">'+pct.toFixed(0)+'% used</span></div></div>';}).join('');
}
function checkBudgetAlerts(){var cats=Object.keys(D.budgets),badge=document.getElementById('budgetBadge');if(!cats.length){badge.style.display='none';return;}var spent={};getExpenses().forEach(function(e){spent[e.cat]=(spent[e.cat]||0)+e.amt;});var over=cats.filter(function(c){return (spent[c]||0)>D.budgets[c];});var near=cats.filter(function(c){var u=spent[c]||0;return u<=D.budgets[c]&&u/D.budgets[c]>=0.85;});if(over.length){badge.textContent=over.length;badge.style.display='inline-block';badge.style.background='var(--red)';}else if(near.length){badge.textContent='!';badge.style.display='inline-block';badge.style.background='var(--amber)';}else badge.style.display='none';}
