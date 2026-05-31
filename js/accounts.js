/* ═══ ACCOUNTS ═══ */
function addAccount(){
  var name=document.getElementById('accName').value.trim(),type=document.getElementById('accType').value,bal=parseFloat(document.getElementById('accBal').value)||0;
  var note=document.getElementById('accNoteInput')?document.getElementById('accNoteInput').value.trim():'';
  var limit=document.getElementById('accLimitInput')?parseFloat(document.getElementById('accLimitInput').value)||0:0;
  var thresh=document.getElementById('accThreshInput')?parseFloat(document.getElementById('accThreshInput').value)||0:0;
  if(!name)return;
  D.accounts.push({id:Date.now().toString(),name:name,type:type,openingBalance:bal,note:note,creditLimit:limit,lowBalanceThreshold:thresh});
  autoSave();
  ['accName','accBal','accNoteInput','accLimitInput','accThreshInput'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  renderAccounts();populateAccSel();populateTransferSelects();
  if(document.getElementById('fixedSummary'))renderFixedSummary();
  showToast('Account added: '+name,'success');
}

/* ═══ EDIT ACCOUNT ═══ */
var _editAccId=null;
function openEditAccount(id){
  var a=D.accounts.find(function(a){return a.id===id;});if(!a)return;
  _editAccId=id;
  document.getElementById('eaName').value=a.name||'';
  document.getElementById('eaType').value=a.type||'Bank Account';
  document.getElementById('eaBal').value=a.openingBalance||0;
  document.getElementById('eaNote').value=a.note||'';
  document.getElementById('eaLimit').value=a.creditLimit||'';
  document.getElementById('eaThresh').value=a.lowBalanceThreshold||'';
  document.getElementById('editAccModal').classList.add('show');
}
function closeEditAccount(){document.getElementById('editAccModal').classList.remove('show');_editAccId=null;}
function saveEditAccount(){
  if(!_editAccId)return;
  var a=D.accounts.find(function(a){return a.id===_editAccId;});if(!a)return;
  a.name=document.getElementById('eaName').value.trim()||a.name;
  a.type=document.getElementById('eaType').value;
  a.openingBalance=parseFloat(document.getElementById('eaBal').value)||0;
  a.note=document.getElementById('eaNote').value.trim();
  a.creditLimit=parseFloat(document.getElementById('eaLimit').value)||0;
  a.lowBalanceThreshold=parseFloat(document.getElementById('eaThresh').value)||0;
  autoSave();closeEditAccount();renderAccounts();populateAccSel();populateTransferSelects();
  showToast('Account updated','success');
}


/* ═══ ACCOUNT STATEMENT ═══ */
var _stmtAccId=null;
function openAccountStatement(id){
  var a=D.accounts.find(function(a){return a.id===id;});if(!a)return;
  _stmtAccId=id;
  document.getElementById('accStmtTitle').textContent=a.name+' — Statement';
  renderAccountStatement(id);
  document.getElementById('accStmtModal').classList.add('show');
}
function closeAccountStatement(){document.getElementById('accStmtModal').classList.remove('show');_stmtAccId=null;}
function renderAccountStatement(id){
  var a=D.accounts.find(function(a){return a.id===id;});if(!a)return;
  var exps=D.expenses.filter(function(e){return e.accountId===id;});
  var inc=(D.extraIncome||[]).filter(function(e){return e.accountId===id;});
  var trans=(D.transfers||[]).filter(function(t){return t.fromId===id||t.toId===id;});
  /* Combine all events */
  var events=[];
  exps.forEach(function(e){events.push({date:e.date,label:e.name,sub:e.cat,amt:-e.amt,type:'exp'});});
  inc.forEach(function(e){events.push({date:e.date,label:e.name,sub:e.source,amt:e.amt,type:'inc'});});
  trans.forEach(function(t){
    var other=D.accounts.find(function(a){return a.id===(t.fromId===id?t.toId:t.fromId);});
    var isIn=t.toId===id;
    events.push({date:t.date+'T12:00:00',label:isIn?'Transfer in':'Transfer out',sub:(other?other.name:''),amt:isIn?t.amt:-t.amt,type:'transfer'});
  });
  events.sort(function(a,b){return new Date(b.date)-new Date(a.date);});
  var el=document.getElementById('accStmtList');
  if(!events.length){el.innerHTML='<p style="font-size:13px;color:var(--tx3);padding:12px 0">No transactions for this account.</p>';return;}
  /* Running balance */
  var running=a.openingBalance;
  var eventsAsc=events.slice().reverse();
  var bals=[];var bal=a.openingBalance;
  eventsAsc.forEach(function(e){bal+=e.amt;bals.push(bal);});
  bals.reverse();
  el.innerHTML=events.map(function(e,i){
    var d=new Date(e.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
    var col=e.amt>=0?'var(--green)':'var(--red)';
    var icon=e.type==='inc'?'💰':e.type==='transfer'?'↔':'•';
    var balCol=bals[i]>=0?'var(--tx2)':'var(--red)';
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--bdr);gap:8px">'
      +'<div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1">'
      +'<span style="font-size:16px;flex-shrink:0">'+icon+'</span>'
      +'<div style="min-width:0"><div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+e.label+'</div>'
      +'<div style="font-size:11px;color:var(--tx3)">'+d+(e.sub?' · '+e.sub:'')+'</div></div></div>'
      +'<div style="text-align:right;flex-shrink:0">'
      +'<div style="font-family:monospace;font-size:13px;font-weight:600;color:'+col+'">'+(e.amt>=0?'+':'')+fmt(e.amt)+'</div>'
      +'<div style="font-size:10px;color:'+balCol+'">bal '+fmt(bals[i])+'</div>'
      +'</div></div>';
  }).join('');
}

function removeAccount(id){
  var linked=D.expenses.filter(function(e){return e.accountId===id;}).length;
  var transfers=(D.transfers||[]).filter(function(t){return t.fromId===id||t.toId===id;}).length;
  var msg='Delete this account?';
  if(linked>0)msg+='\n\n⚠️ '+linked+' expense'+(linked>1?'s':'')+' linked to this account will lose their account tag.';
  if(transfers>0)msg+='\n⚠️ '+transfers+' transfer'+(transfers>1?'s':'')+' involve this account.';
  if(!confirm(msg))return;
  D.accounts=D.accounts.filter(function(a){return a.id!==id;});
  autoSave();renderAccounts();populateAccSel();populateTransferSelects();
}
function renderAccounts(){
  var accs=D.accounts,grid=document.getElementById('accountGrid');
  if(!accs.length){grid.innerHTML='<p class="empty" style="margin-bottom:1rem">No accounts yet.</p>';return;}
  /* Total balance summary */
  var totalBal=accs.reduce(function(s,a,i){
    var sp=D.expenses.filter(function(e){return e.accountId===a.id;}).reduce(function(t,e){return t+e.amt;},0);
    var inc=(D.extraIncome||[]).filter(function(e){return e.accountId===a.id;}).reduce(function(t,e){return t+e.amt;},0);
    var tIn=(D.transfers||[]).filter(function(t){return t.toId===a.id;}).reduce(function(t2,t){return t2+t.amt;},0);
    var tOut=(D.transfers||[]).filter(function(t){return t.fromId===a.id;}).reduce(function(t2,t){return t2+t.amt;},0);
    return s+(a.openingBalance+inc+tIn-tOut-sp);
  },0);
  var totalEl=document.getElementById('accTotalBal');
  if(totalEl){totalEl.textContent=fmt(totalBal);totalEl.style.color=totalBal>=0?'var(--green)':'var(--red)';}
  /* Low balance check */
  var lowAlerts=[];
  accs.forEach(function(a){
    if(!a.lowBalanceThreshold)return;
    var sp=D.expenses.filter(function(e){return e.accountId===a.id;}).reduce(function(s,e){return s+e.amt;},0);
    var inc=(D.extraIncome||[]).filter(function(e){return e.accountId===a.id;}).reduce(function(s,e){return s+e.amt;},0);
    var tIn=(D.transfers||[]).filter(function(t){return t.toId===a.id;}).reduce(function(s,t){return s+t.amt;},0);
    var tOut=(D.transfers||[]).filter(function(t){return t.fromId===a.id;}).reduce(function(s,t){return s+t.amt;},0);
    var bal=a.openingBalance+inc+tIn-tOut-sp;
    if(bal<a.lowBalanceThreshold)lowAlerts.push(a.name+': '+fmt(bal));
  });
  var lowBanner=document.getElementById('lowBalanceBanner');
  if(lowBanner){
    if(lowAlerts.length){lowBanner.style.display='flex';document.getElementById('lowBalanceText').textContent='⚠️ Low balance: '+lowAlerts.join(', ');}
    else lowBanner.style.display='none';
  }
  grid.innerHTML=accs.map(function(a,i){var spent=D.expenses.filter(function(e){return e.accountId===a.id;}).reduce(function(s,e){return s+e.amt;},0);
    var incIn=(D.extraIncome||[]).filter(function(e){return e.accountId===a.id;}).reduce(function(s,e){return s+e.amt;},0); /* BUG FIX: include extra income */
    var tIn=(D.transfers||[]).filter(function(t){return t.toId===a.id;}).reduce(function(s,t){return s+t.amt;},0);var tOut=(D.transfers||[]).filter(function(t){return t.fromId===a.id;}).reduce(function(s,t){return s+t.amt;},0);var bal=a.openingBalance+incIn+tIn-tOut-spent,c=AC[i%AC.length];var utilHtml='';
    if(a.type==='Credit Card'&&a.creditLimit>0){
      var util=Math.min(100,Math.abs(bal)/a.creditLimit*100);
      var utilCol=util>=80?'var(--red)':util>=50?'var(--amber)':'var(--green)';
      utilHtml='<div style="margin-top:6px"><div style="display:flex;justify-content:space-between;font-size:10px;color:var(--tx3);margin-bottom:3px"><span>Credit used</span><span>'+util.toFixed(0)+'%</span></div><div style="height:4px;background:var(--sur2);border-radius:99px;overflow:hidden"><div style="height:100%;width:'+util.toFixed(1)+'%;background:'+utilCol+';border-radius:99px"></div></div><div style="font-size:10px;color:var(--tx3);margin-top:2px">Limit: '+fmt(a.creditLimit)+'</div></div>';
    }
    var noteHtml=a.note?'<div style="font-size:10px;color:var(--tx3);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+a.note+'">'+a.note+'</div>':'';
    var lowWarn=a.lowBalanceThreshold&&bal<a.lowBalanceThreshold?'<span style="background:var(--rbg);color:var(--red);font-size:9px;font-weight:600;padding:1px 6px;border-radius:99px;margin-left:6px">LOW</span>':'';
    return '<div class="acard"><div class="atype" style="color:'+c+'">'+a.type+'</div><div class="aname">'+a.name+lowWarn+'</div><div class="abal" style="color:'+(bal>=0?'var(--tx)':'var(--red)')+'">'+fmt(bal)+'</div><div style="font-size:11px;color:var(--tx3);margin-top:3px">Spent: '+fmt(spent)+'</div>'+noteHtml+utilHtml+'<div style="display:flex;gap:6px;margin-top:8px"><button onclick="openAccountStatement(this.dataset.id)" data-id="'+a.id+'" class="btn-ghost" style="flex:1;font-size:11px;padding:4px">📋</button><button onclick="openEditAccount(this.dataset.id)" data-id="'+a.id+'" class="btn-ghost" style="flex:1;font-size:11px;padding:4px">✏️</button></div><button class="adel" onclick="removeAccount(\''+a.id+'\')">×</button></div>';}).join('');
}
function populateAccSel(){var accs=D.accounts,sel=document.getElementById('expAcc');
  var fixAccSel=document.getElementById('fixAccId');
  if(fixAccSel)fixAccSel.innerHTML=accs.length?accs.map(function(a){return '<option value="'+a.id+'">'+a.name+'</option>';}).join(''):'<option value="">No accounts</option>';sel.innerHTML=accs.length?accs.map(function(a){return '<option value="'+a.id+'">'+a.name+'</option>';}).join(''):'<option value="">No accounts</option>';
  var aeFilter=document.getElementById('expAccFilter');if(aeFilter)aeFilter.innerHTML='<option value="">All accounts</option>'+accs.map(function(a){return '<option value="'+a.id+'">'+a.name+'</option>';}).join('');
}
