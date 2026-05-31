/* ═══ FIXED ═══ */
function addFixed(){
  var name=document.getElementById('fixName').value.trim(),amt=parseFloat(document.getElementById('fixAmt').value),freq=document.getElementById('fixFreq').value,recurring=document.getElementById('fixRecur').checked;
  var _fixDueDateVal=document.getElementById('fixDueDay').value;
  var dueDay=_fixDueDateVal?new Date(_fixDueDateVal+'T12:00:00').getDate():0;
  var cat=document.getElementById('fixCat')?document.getElementById('fixCat').value:'Utilities';
  var accountId=document.getElementById('fixAccId')?document.getElementById('fixAccId').value:'';
  if(!name||isNaN(amt)||amt<=0)return;
  D.fixed.push({id:Date.now().toString(),name:name,amt:amt,freq:freq,recurring:recurring,dueDay:dueDay,cat:cat,accountId:accountId,autoLog:true,skippedMonths:[]});autoSave();document.getElementById('fixName').value='';document.getElementById('fixAmt').value='';document.getElementById('fixDueDay').value='';renderFixed();recalc();}

var _editFixedId=null;
function openEditFixed(id){
  var f=D.fixed.find(function(f){return f.id===id;});if(!f)return;
  _editFixedId=id;
  document.getElementById('efName').value=f.name;
  document.getElementById('efAmt').value=f.amt;
  document.getElementById('efFreq').value=f.freq;
  var _efDayVal='';
  if(f.dueDay>0){var _n2=new Date();_efDayVal=_n2.getFullYear()+'-'+String(_n2.getMonth()+1).padStart(2,'0')+'-'+String(f.dueDay).padStart(2,'0');}
  document.getElementById('efDueDay').value=_efDayVal;
  var _efAcc2=document.getElementById('efAccId');
  if(_efAcc2)_efAcc2.innerHTML=D.accounts.map(function(a){return '<option value="'+a.id+'"'+(a.id===f.accountId?' selected':'')+'>'+a.name+'</option>';}).join('');
  document.getElementById('efRecur').checked=!!f.recurring;
  if(document.getElementById('efAutoLog'))document.getElementById('efAutoLog').checked=f.autoLog!==false;
  populateCatSelects();
  var _efCat=document.getElementById('efCat');if(_efCat)_efCat.value=f.cat||'Utilities';
  var _efAcc=document.getElementById('efAccId');
  if(_efAcc)_efAcc.innerHTML=D.accounts.map(function(a){return '<option value="'+a.id+'"'+(a.id===f.accountId?' selected':'')+'>'+a.name+'</option>';}).join('');
  document.getElementById('editFixedModal').classList.add('show');
}
function closeEditFixed(){document.getElementById('editFixedModal').classList.remove('show');_editFixedId=null;}


function skipThisMonth(id){
  var f=D.fixed.find(function(f){return f.id===id;});if(!f)return;
  var m=mk();
  if(!f.skippedMonths)f.skippedMonths=[];
  var idx=f.skippedMonths.indexOf(m);
  if(idx>-1){f.skippedMonths.splice(idx,1);showToast('Skip removed for '+f.name,'success');}
  else{f.skippedMonths.push(m);showToast('Skipped '+f.name+' this month','success');}
  autoSave();renderFixed();
}

function toggleAutoLog(id){
  var f=D.fixed.find(function(f){return f.id===id;});if(!f)return;
  f.autoLog=!f.autoLog;
  autoSave();renderFixed();
  showToast('Auto-log '+(f.autoLog?'enabled':'disabled')+' for '+f.name,'success');
}

function saveEditFixed(){
  if(!_editFixedId)return;
  var f=D.fixed.find(function(f){return f.id===_editFixedId;});if(!f)return;
  f.name=document.getElementById('efName').value.trim()||f.name;
  f.amt=parseFloat(document.getElementById('efAmt').value)||f.amt;
  f.freq=document.getElementById('efFreq').value;
  var _efDueDateVal=document.getElementById('efDueDay').value;
  f.dueDay=_efDueDateVal?new Date(_efDueDateVal+'T12:00:00').getDate():0;
  f.recurring=document.getElementById('efRecur').checked;
  f.autoLog=document.getElementById('efAutoLog')?document.getElementById('efAutoLog').checked:(f.autoLog!==false);
  f.cat=document.getElementById('efCat')?document.getElementById('efCat').value:(f.cat||'Utilities');
  f.accountId=document.getElementById('efAccId')?document.getElementById('efAccId').value:(f.accountId||'');
  f.autoLog=document.getElementById('efAutoLog')?document.getElementById('efAutoLog').checked:(f.autoLog!==false);
  var _efC=document.getElementById('efCat');if(_efC)f.cat=_efC.value;
  var _efA=document.getElementById('efAccId');if(_efA)f.accountId=_efA.value;
  autoSave();closeEditFixed();renderFixed();recalc();
  showToast('Fixed expense updated','success');
}


function cleanupPaidData(){
  if(!D.paid)return;
  var now=new Date(),cutoff=new Date(now.getFullYear(),now.getMonth()-2,1);
  var toKeep=Object.keys(D.paid).filter(function(m){
    var parts=m.split('-');
    return new Date(parseInt(parts[0]),parseInt(parts[1])-1,1)>=cutoff;
  });
  var cleaned={};toKeep.forEach(function(k){cleaned[k]=D.paid[k];});
  D.paid=cleaned;
}


/* ═══ FIXED PAYMENT HISTORY ═══ */
var _payHistId=null;
function openPayHistory(id){
  var f=D.fixed.find(function(f){return f.id===id;});if(!f)return;
  _payHistId=id;
  document.getElementById('payHistTitle').textContent=f.name+' — Payment History';
  renderPayHistory(f);
  document.getElementById('payHistModal').classList.add('show');
}
function closePayHistory(){document.getElementById('payHistModal').classList.remove('show');_payHistId=null;}
function renderPayHistory(f){
  var el=document.getElementById('payHistList');if(!el)return;
  // Build last 12 months
  var now=new Date(),rows='';
  for(var i=11;i>=0;i--){
    var d=new Date(now.getFullYear(),now.getMonth()-i,1);
    var m=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
    var paid=(D.paid[m]||[]).indexOf(f.id)>-1;
    var skipped=f.skippedMonths&&f.skippedMonths.indexOf(m)>-1;
    var monthLabel=d.toLocaleString('default',{month:'long',year:'numeric'});
    var status=skipped?'<span style="background:var(--abg);color:var(--amber);font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px">Skipped</span>':
               paid?'<span style="background:var(--gbg);color:var(--green);font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px">✓ Paid</span>':
               '<span style="background:var(--sur2);color:var(--tx3);font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px">Pending</span>';
    rows+='<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--bdr)"><span style="font-size:13px">'+monthLabel+'</span>'+status+'</div>';
  }
  el.innerHTML=rows||'<p style="color:var(--tx3);font-size:13px">No history yet.</p>';
}


/* ═══ FIXED YEARLY SUMMARY ═══ */
function renderFixedSummary(){
  var el=document.getElementById('fixedSummary');if(!el)return;
  if(!D.fixed.length){el.innerHTML='';return;}
  var monthly=0,yearly=0;
  D.fixed.forEach(function(f){
    var mo=f.freq==='Daily'?f.amt*30:f.freq==='Weekly'?f.amt*4.33:f.freq==='Yearly'?f.amt/12:f.amt;
    monthly+=mo;yearly+=mo*12;
  });
  // Group by category
  var cats={};
  D.fixed.forEach(function(f){
    var mo=f.freq==='Daily'?f.amt*30:f.freq==='Weekly'?f.amt*4.33:f.freq==='Yearly'?f.amt/12:f.amt;
    var c=f.cat||'Utilities';
    cats[c]=(cats[c]||0)+mo;
  });
  var topCats=Object.keys(cats).sort(function(a,b){return cats[b]-cats[a];}).slice(0,3);
  el.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'
    +'<div style="background:var(--sur2);border-radius:8px;padding:8px 12px"><div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--tx3);margin-bottom:3px">Monthly total</div><div style="font-family:monospace;font-size:16px;font-weight:600;color:var(--red)">'+fmt(Math.round(monthly))+'</div></div>'
    +'<div style="background:var(--sur2);border-radius:8px;padding:8px 12px"><div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--tx3);margin-bottom:3px">Yearly total</div><div style="font-family:monospace;font-size:16px;font-weight:600;color:var(--red)">'+fmt(Math.round(yearly))+'</div></div>'
    +'</div>'
    +(topCats.length?'<div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--tx3);margin-bottom:6px">By category</div>'
    +topCats.map(function(c){var pct=monthly>0?(cats[c]/monthly*100).toFixed(0):0;return '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span>'+c+'</span><span style="font-family:monospace">'+fmt(Math.round(cats[c]))+' <span style="color:var(--tx3)">'+pct+'%</span></span></div>';}).join(''):'');
}


var _fixedSort='default';
function setFixedSort(mode,btn){
  _fixedSort=mode;
  document.querySelectorAll('.fix-sort-btn').forEach(function(b){b.classList.remove('active');});
  if(btn)btn.classList.add('active');
  renderFixed();
}


var _fixedSearch='';
function searchFixed(q){
  _fixedSearch=q.toLowerCase().trim();
  renderFixed();
}

function removeFixed(id){
  if(!confirm('Delete this fixed expense?'))return;
  D.fixed=D.fixed.filter(function(f){return f.id!==id;});
  autoSave();renderFixed();recalc();
}
function togglePaid(id){var m=mk(),paid=D.paid[m]||[],idx=paid.indexOf(id);if(idx>-1)paid.splice(idx,1);else paid.push(id);D.paid[m]=paid;autoSave();renderFixed();checkReminders();}
function renderFixed(){
  renderFixedSummary();
  var rawArr=D.fixed.slice().filter(function(f){
    if(!_fixedSearch)return true;
    return f.name.toLowerCase().indexOf(_fixedSearch)>-1||(f.cat&&f.cat.toLowerCase().indexOf(_fixedSearch)>-1);
  });
  if(typeof _fixedSort!=='undefined'&&_fixedSort!=='default'){
    rawArr.sort(function(a,b){
      if(_fixedSort==='due'){var da=a.dueDay||99,db=b.dueDay||99;return da-db;}
      if(_fixedSort==='amt-desc')return b.amt-a.amt;
      if(_fixedSort==='amt-asc')return a.amt-b.amt;
      if(_fixedSort==='name')return a.name.localeCompare(b.name);
      return 0;
    });
  }
  var arr=rawArr,paid=getPaid(),el=document.getElementById('fixedList'),today=new Date().getDate();
  if(!arr.length){el.innerHTML='<p class="empty">No fixed expenses yet.</p>';return;}
  var rec=arr.filter(function(f){return f.recurring;}),pc=rec.filter(function(f){return paid.indexOf(f.id)>-1;}).length;
  document.getElementById('recurStatus').textContent=rec.length?pc+'/'+rec.length+' paid this month':'';
  renderFixedSummary();
  el.innerHTML=arr.map(function(f){
    var isPaid=paid.indexOf(f.id)>-1,mo=f.freq==='Daily'?f.amt*30:f.freq==='Weekly'?f.amt*4.33:f.freq==='Yearly'?f.amt/12:f.amt;
    var note=f.freq!=='Monthly'?' (approx '+fmt(mo)+'/mo)':'';
    var duePill='';
    if(f.dueDay>0){var diff=f.dueDay-today;
      if(isPaid){duePill=' <span style="font-size:10px;color:var(--green);margin-left:4px">✓ Due '+f.dueDay+'th</span>';}
      else if(diff>3){duePill=' <span style="font-size:10px;color:var(--tx3);margin-left:4px">Due '+f.dueDay+'th</span>';}
      else if(diff>=1&&diff<=3){duePill=' <span class="bill-soon">Due in '+diff+'d</span>';}
      else if(diff===0){duePill=' <span class="bill-due">Due TODAY</span>';}
      else{duePill=' <span class="bill-due">Overdue ('+f.dueDay+'th)</span>';}
    }
    var catTag=f.cat?'<span style="display:inline-block;background:var(--sur2);color:var(--tx3);font-size:9px;font-weight:600;padding:1px 6px;border-radius:99px;margin-left:5px">'+f.cat+'</span>':'';
    var skipLabel=f.skippedMonths&&f.skippedMonths.indexOf(mk())>-1?'Unskip':'Skip';
    var autoLabel=(f.autoLog===false)?'⏸':'▶';
    return '<div class="erow" style="flex-wrap:wrap"><div class="eleft"><div class="dot" style="background:var(--red)"></div><div><div class="ename">'+f.name+duePill+catTag+'</div><div class="emeta">'+f.freq+' · '+fmt(f.amt)+note+(f.freq!=='Monthly'?' (~'+fmt(Math.round(mo))+'/mo)':'')+(f.accountId?(' · '+(D.accounts.find(function(a){return a.id===f.accountId;})||{name:''}).name):'')+'</div></div></div><div class="eright">'+(f.recurring?(isPaid?'<span class="paid-badge">Paid</span>':'<button class="pend-badge" onclick="togglePaid(\''+f.id+'\')">Mark paid</button>'):'')+' <button class="fix-edit-btn" style="font-size:11px;padding:2px 6px" onclick="openPayHistory(\''+f.id+'\')">📋</button><button class="fix-edit-btn" style="font-size:11px;padding:2px 6px" onclick="skipThisMonth(\''+f.id+'\')">'+skipLabel+'</button><button class="fix-edit-btn" style="font-size:11px;padding:2px 6px" title="Toggle auto-log" onclick="toggleAutoLog(\''+f.id+'\')">'+(autoLabel)+'</button><button class="fix-edit-btn" onclick="openEditFixed(\''+f.id+'\')">✏️</button><button class="del-btn" onclick="removeFixed(\''+f.id+'\')">×</button></div></div>';
  }).join('');
  var badge=document.getElementById('pendingBadge'),pend=rec.filter(function(f){return paid.indexOf(f.id)<0;}).length;badge.textContent=pend;badge.style.display=pend>0?'inline-block':'none';
}
function checkReminders(){var _ckm=mk();var pending=D.fixed.filter(function(f){return f.recurring&&getPaid().indexOf(f.id)<0&&(!f.skippedMonths||f.skippedMonths.indexOf(_ckm)<0);});var today=new Date().getDate();var dueSoon=D.fixed.filter(function(f){return f.dueDay>0&&(f.dueDay===today||(f.dueDay-today>=1&&f.dueDay-today<=3));});var banner=document.getElementById('reminderBanner'),msgs=[];if(pending.length)msgs.push(pending.length+' recurring payment'+(pending.length>1?'s':'')+' pending');if(dueSoon.length)msgs.push(dueSoon.map(function(f){return f.name+(f.dueDay===today?' due TODAY':' due in '+(f.dueDay-today)+'d');}).join(', '));if(msgs.length){document.getElementById('reminderText').textContent='Warning: '+msgs.join(' / ');banner.classList.add('show');}else banner.classList.remove('show');}

/* ═══ CALENDAR ═══ */
function renderCalendar(){
  var exps=getExpenses(),year=curDate.getFullYear(),month=curDate.getMonth(),today=new Date();
  var dayT={};exps.forEach(function(e){var d=new Date(e.date).getDate();dayT[d]=(dayT[d]||0)+e.amt;});
  /* Also track income per day */
  var dayInc={};getExtraIncome().forEach(function(e){var d=new Date(e.date).getDate();dayInc[d]=(dayInc[d]||0)+e.amt;});
  var maxA=Math.max.apply(null,Object.values(dayT).concat([1])),firstDay=new Date(year,month,1).getDay(),dim=new Date(year,month+1,0).getDate(),prev=new Date(year,month,0).getDate();
  var days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var h=days.map(function(d){return '<div class="calhd">'+d+'</div>';}).join('');
  for(var i=firstDay-1;i>=0;i--)h+='<div class="calday other"><div class="cdnum">'+(prev-i)+'</div></div>';
  for(var d=1;d<=dim;d++){var amt=dayT[d]||0,isT=today.getFullYear()===year&&today.getMonth()===month&&today.getDate()===d,isSel=selDay===d;var bg='',tc='var(--tx2)';if(amt>0){var r=amt/maxA;bg=r<.33?'rgba(29,158,117,.12)':r<.66?'rgba(186,117,23,.15)':'rgba(216,90,48,.15)';tc=r<.33?'var(--green)':r<.66?'var(--amber)':'var(--red)';}h+='<div class="calday'+(isT?' today':'')+(isSel?' selected':'')+'" style="background:'+(isSel?'':bg)+'" onclick="selectDay('+d+')"><div class="cdnum" style="color:'+(isT?'var(--blue)':'var(--tx2)')+'">'+d+'</div>'+(amt>0?'<div class="cdamt" style="color:'+tc+'">'+fmt(amt)+'</div>':'')+(dayInc[d]>0?'<div class="cdamt" style="color:var(--green);font-size:8px">+'+fmt(dayInc[d])+'</div>':'')+'</div>';}
  var rem=(firstDay+dim)%7===0?0:7-(firstDay+dim)%7;for(var d2=1;d2<=rem;d2++)h+='<div class="calday other"><div class="cdnum">'+d2+'</div></div>';
  document.getElementById('calGrid').innerHTML=h;if(selDay)showDayPanel(selDay);
}
function selectDay(d){selDay=selDay===d?null:d;renderCalendar();if(!selDay)document.getElementById('dayPanel').style.display='none';}
function showDayPanel(d){var exps=getExpenses().filter(function(e){return new Date(e.date).getDate()===d;}),panel=document.getElementById('dayPanel');var ds=new Date(curDate.getFullYear(),curDate.getMonth(),d).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'});if(!exps.length){panel.innerHTML='<div style="font-size:13px;color:var(--tx3)">'+ds+' — no expenses.</div>';}else{var total=exps.reduce(function(s,e){return s+e.amt;},0);panel.innerHTML='<div style="display:flex;justify-content:space-between;margin-bottom:10px"><span style="font-size:13px;font-weight:500">'+ds+'</span><span style="font-family:\'DM Mono\',monospace;font-size:13px">'+fmt(total)+'</span></div>'+exps.map(function(e){return '<div class="erow"><div class="eleft"><div class="dot" style="background:'+(getCatColor(e.cat))+'"></div><span class="ename">'+e.name+'</span><span class="emeta">'+e.cat+'</span></div><span class="eamt">'+fmt(e.amt)+'</span></div>';}).join('');}panel.style.display='block';}
