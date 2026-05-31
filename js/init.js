/* ═══ INIT ═══ */
/* -- WEEKLY SUMMARY -- */
function renderWeeklySummary(){
  var now=new Date();
  var _isCM2=now.getFullYear()===curDate.getFullYear()&&now.getMonth()===curDate.getMonth();
  var wCard=document.getElementById('weeklyCard');if(wCard)wCard.style.display=_isCM2?'':'none';
  if(!_isCM2)return;
  var dow=now.getDay();
  var wkS=new Date(now);wkS.setDate(now.getDate()-dow);wkS.setHours(0,0,0,0);
  var pvS=new Date(wkS);pvS.setDate(pvS.getDate()-7);
  var pvE=new Date(wkS);pvE.setMilliseconds(-1);
  var tExp=D.expenses.filter(function(e){var d=new Date(e.date);return d>=wkS&&d<=now;});
  var pExp=D.expenses.filter(function(e){var d=new Date(e.date);return d>=pvS&&d<=pvE;});
  var tTot=tExp.reduce(function(s,e){return s+e.amt;},0),pTot=pExp.reduce(function(s,e){return s+e.amt;},0);
  var diff=tTot-pTot,pct=pTot>0?((diff/pTot)*100).toFixed(0):null;
  var cats={};tExp.forEach(function(e){cats[e.cat]=(cats[e.cat]||0)+e.amt;});
  var topC=Object.keys(cats).sort(function(a,b){return cats[b]-cats[a];})[0]||'---';
  document.getElementById('weekRange').textContent=wkS.toLocaleDateString('en-IN',{day:'numeric',month:'short'})+' to '+now.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
  var dCol=diff<=0?'var(--green)':'var(--red)',dSgn=diff>0?'+':'';
  var h='<div class="wk-grid">';
  h+='<div class="wk-box"><div class="wk-label">This week</div><div class="wk-val" style="color:var(--tx)">'+fmt(tTot)+'</div></div>';
  h+='<div class="wk-box"><div class="wk-label">Last week</div><div class="wk-val" style="color:var(--tx2)">'+fmt(pTot)+'</div></div>';
  h+='<div class="wk-box"><div class="wk-label">Change</div><div class="wk-val" style="color:'+dCol+'">'+dSgn+fmt(diff)+(pct?' ('+dSgn+pct+'%)':'')+'</div></div>';
  h+='<div class="wk-box"><div class="wk-label">Top category</div><div class="wk-val" style="font-size:14px;font-weight:600">'+topC+(cats[topC]?' '+fmt(cats[topC]):'')+'</div></div>';
  h+='</div>';
  if(tExp.length){h+='<div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--tx3);margin-bottom:8px">Expenses this week</div>';h+=tExp.slice().reverse().slice(0,8).map(function(e){var c=getCatColor(e.cat),d=new Date(e.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric'});return '<div class="erow"><input type="checkbox" class="exp-check" onclick="toggleBulkSelect(\''+e.id+'\',this)" style="margin-right:4px"><div class="eleft"><div class="dot" style="background:'+c+'"></div><div><div class="ename">'+e.name+'</div><div class="emeta">'+d+' '+e.cat+'</div></div></div><span class="eamt">'+fmt(e.amt)+'</span></div>';}).join('');}
  else h+='<p class="empty">No expenses this week yet.</p>';
  document.getElementById('weeklySummary').innerHTML=h;
}
/* -- AUTO LOG FIXED -- */
function autoLogFixed(){
  if(!D.autoLogged)D.autoLogged=[];
  var m=mk();
  if(D.autoLogged.indexOf(m)>-1)return;
  var monthly=D.fixed.filter(function(f){return f.freq==='Monthly'&&f.recurring&&f.autoLog!==false&&(!f.skippedMonths||f.skippedMonths.indexOf(m)<0);});
  if(!monthly.length){D.autoLogged.push(m);autoSave();return;}
  var count=0;
  monthly.forEach(function(f){var already=D.expenses.some(function(e){return e.month===m&&e.name===f.name&&e.amt===f.amt;});if(!already){var parts=m.split('-'),ed=new Date(parseInt(parts[0]),parseInt(parts[1])-1,1,12,0,0).toISOString();D.expenses.push({id:Date.now().toString()+'_auto',date:ed,month:m,name:f.name,cat:f.cat||'Utilities',amt:f.amt,accountId:f.accountId||(D.accounts.length?D.accounts[0].id:''),note:'Auto-logged',tags:''});count++;}});
  D.autoLogged.push(m);autoSave();
  if(count>0){renderExpenses();recalc();showToast('Auto-logged '+count+' recurring expense'+(count>1?'s':'')+' for this month','success');}
}
/* -- EDIT EXPENSE -- */
var editingId=null;
function openEdit(id){
  var e=D.expenses.find(function(e){return e.id===id;});if(!e)return;
  editingId=id;
  populateCatSelects(); /* refresh cats including any new custom ones */
  document.getElementById('editName').value=e.name;
  document.getElementById('editCat').value=e.cat;
  document.getElementById('editAmt').value=e.amt;
  document.getElementById('editDate').value=e.date?e.date.slice(0,10):'';
  var sel=document.getElementById('editAcc');sel.innerHTML=D.accounts.map(function(a){return '<option value="'+a.id+'"'+(a.id===e.accountId?' selected':'')+'>'+a.name+'</option>';}).join('');
  document.getElementById('editModal').classList.add('show');
}
function closeEdit(){document.getElementById('editModal').classList.remove('show');editingId=null;}
function saveEdit(){
  if(!editingId)return;
  var e=D.expenses.find(function(e){return e.id===editingId;});if(!e)return;
  var name=document.getElementById('editName').value.trim(),cat=document.getElementById('editCat').value,amt=parseFloat(document.getElementById('editAmt').value),dv=document.getElementById('editDate').value,accId=document.getElementById('editAcc').value;
  var note=document.getElementById('editNote')?document.getElementById('editNote').value.trim():'';
  var tags=document.getElementById('editTags')?document.getElementById('editTags').value.trim():'';
  if(!name||isNaN(amt)||amt<=0)return;
  var parts=dv.split('-'),ed=new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2]),12,0,0).toISOString(),nm=parts[0]+'-'+parts[1];
  e.name=name;e.cat=cat;e.amt=amt;e.date=ed;e.month=nm;e.accountId=accId;e.note=note;e.tags=tags;
  autoSave();closeEdit();renderExpenses();recalc();renderAccounts();
  showToast('Expense updated','success');
}
/* -- EXTRA INCOME -- */
function renderIncSrcBtns(){var el=document.getElementById('incSrcGrid');if(!el)return;el.innerHTML=INC_SOURCES.map(function(s){return '<button class="inc-src-btn'+(selIncSrc===s.key?' active':'')+'" onclick="selIncSrc=\''+s.key+'\';renderIncSrcBtns()">'+s.icon+' '+s.key+'</button>';}).join('');}
function addExtraIncome(){
  var name=document.getElementById('incName').value.trim(),amt=parseFloat(document.getElementById('incAmt').value),dv=document.getElementById('incDate').value||todayStr();
  if(!name||isNaN(amt)||amt<=0)return;
  var parts=dv.split('-'),ed=new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2]),12,0,0).toISOString(),m=parts[0]+'-'+parts[1];
  if(!D.extraIncome)D.extraIncome=[];
  /* Use first account for extra income — income form has no account selector */
  var _incAccId=D.accounts.length?D.accounts[0].id:'';
  D.extraIncome.push({id:Date.now().toString(),date:ed,month:m,name:name,source:selIncSrc,amt:amt,accountId:_incAccId});
  autoSave();document.getElementById('incName').value='';document.getElementById('incAmt').value='';renderExtraIncome();recalc();
}
function removeExtraIncome(id){if(!confirm('Delete this extra income entry?'))return;D.extraIncome=D.extraIncome.filter(function(e){return e.id!==id;});autoSave();renderExtraIncome();recalc();}
function toggleExtraIncForm(){
  var f=document.getElementById('inc-log-form');
  var btn=document.getElementById('extraIncToggleBtn');
  var open=f.style.display==='none';
  f.style.display=open?'block':'none';
  btn.textContent=open?'✕ Close':'+ Add';
  if(open){renderIncSrcBtns();var incDt=document.getElementById('incDate');if(incDt)incDt.value=todayStr();}
}
function renderExtraIncome(){
  var entries=getExtraIncome();
  var total=entries.reduce(function(s,e){return s+e.amt;},0);
  var _yr=String(curDate.getFullYear());
  var ytd=(D.extraIncome||[]).filter(function(e){return e.date&&e.date.slice(0,4)===_yr;}).reduce(function(s,e){return s+e.amt;},0);
  var eEl=document.getElementById('extraIncTotal');
  if(eEl)eEl.textContent=total>0?'+'+fmt(total)+(ytd>total?' (YTD +'+fmt(ytd)+')':''):'';
  var srcIco={};INC_SOURCES.forEach(function(s){srcIco[s.key]=s.icon;});
  document.getElementById('extraIncList').innerHTML=entries.length
    ?entries.slice().reverse().map(function(e){
        var d=new Date(e.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
        return '<div class="erow"><div class="eleft"><div style="font-size:16px;margin-right:6px">'+(srcIco[e.source]||'💰')+'</div>'
          +'<div><div class="ename">'+e.name+'</div><div class="emeta">'+d+' · '+e.source+'</div></div></div>'
          +'<div class="eright"><span class="eamt" style="color:var(--green)">+'+fmt(e.amt)+'</span>'
          +'<button class="del-btn" onclick="removeExtraIncome(\''+e.id+'\')">×</button></div></div>';
      }).join('')
    :'<p class="empty">No extra income this month. Click + Add to log some!</p>';
}
/* -- SAVINGS STREAK -- */
function checkSavingsStreak(){
  var streak=0,fxd=fixedMonthly();
  for(var i=1;i<=12;i++){
    var d=new Date(curDate.getFullYear(),curDate.getMonth()-i,1);
    var s=getExpenses(d).reduce(function(a,e){return a+e.amt;},0);
    var mI=(D.config.income||0)+extraIncomeTotal(d);
    if(mI>0&&(mI-fxd-s)>0)streak++;else break;
  }
  var badge=document.getElementById('streakBadge');
  /* savings streak */
  var savText=streak>=2?'🔥 Savings streak: '+streak+' months in a row!':'';
  /* no-spend day streak */
  var today=new Date(),noSpendStreak=0;
  for(var j=1;j<=60;j++){
    var nd=new Date(today.getFullYear(),today.getMonth(),today.getDate()-j);
    var ndKey=nd.getFullYear()+'-'+String(nd.getMonth()+1).padStart(2,'0')+'-'+String(nd.getDate()).padStart(2,'0');
    var ndMonth=nd.getFullYear()+'-'+String(nd.getMonth()+1).padStart(2,'0');
    var dayExps=D.expenses.filter(function(e){return e.month===ndMonth&&e.date&&e.date.slice(0,10)===ndKey;});
    if(dayExps.length===0)noSpendStreak++;else break;
  }
  var noSpendText=noSpendStreak>=2?'🎯 No-spend streak: '+noSpendStreak+' days!':'';
  var combined=[savText,noSpendText].filter(Boolean).join('  ·  ');
  if(combined){badge.classList.add('show');document.getElementById('streakText').textContent=combined;}
  else badge.classList.remove('show');
}
/* -- MONTHLY RESET -- */
function checkMonthlyReset(){
  var now=new Date(),m=mk();
  if(!D.monthResetSeen)D.monthResetSeen=[];
  if(D.monthResetSeen.indexOf(m)>-1||now.getDate()>3)return;
  var lastDate=new Date(now.getFullYear(),now.getMonth()-1,1);
  var lastSpent=getExpenses(lastDate).reduce(function(s,e){return s+e.amt;},0);
  var lastInc=(D.config.income||0)+extraIncomeTotal(lastDate),lastFxd=fixedMonthly();
  var lastSav=Math.max(0,lastInc-lastFxd-lastSpent);
  var lm=lastDate.toLocaleString('default',{month:'long',year:'numeric'});
  var body='<div style="text-align:center;padding:8px 0">';
  body+='<div style="font-size:32px;margin-bottom:8px">'+(lastSav>0?'🎉':'💪')+'</div>';
  body+='<div style="font-size:16px;font-weight:600;margin-bottom:16px">'+lm+' recap</div>';
  body+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">';
  body+='<div style="background:var(--sur2);border-radius:10px;padding:12px"><div style="font-size:11px;color:var(--tx3);text-transform:uppercase;margin-bottom:4px">Spent</div><div style="font-family:\'DM Mono\',monospace;font-size:18px;font-weight:500;color:var(--red)">'+fmt(lastFxd+lastSpent)+'</div></div>';
  body+='<div style="background:var(--sur2);border-radius:10px;padding:12px"><div style="font-size:11px;color:var(--tx3);text-transform:uppercase;margin-bottom:4px">Saved</div><div style="font-family:\'DM Mono\',monospace;font-size:18px;font-weight:500;color:var(--green)">'+fmt(lastSav)+'</div></div>';
  body+='</div>';
  if(lastSav>0)body+='<div style="font-size:14px;color:var(--green)">✅ Great! Saved '+fmt(lastSav)+' last month.</div>';
  else body+='<div style="font-size:14px;color:var(--amber)">⚠️ No savings last month. New month, fresh start!</div>';
  body+='</div>';
  document.getElementById('monthResetBody').innerHTML=body;
  document.getElementById('monthResetModal').classList.add('show');
  D.monthResetSeen.push(m);autoSave();
}
function closeMonthReset(){document.getElementById('monthResetModal').classList.remove('show');}
/* -- GOAL AUTO-CONTRIBUTION -- */
var autoContribGoalId=null;
function openAutoContrib(id){
  var g=D.goals.find(function(g){return g.id===id;});if(!g)return;
  autoContribGoalId=id;
  document.getElementById('autoContribGoalName').textContent=g.emoji+' '+g.name;
  document.getElementById('autoContribAmt').value=g.autoAmt||'';
  document.getElementById('autoContribDay').value=g.autoDay||'';
  document.getElementById('autoContribModal').classList.add('show');
}
function saveAutoContrib(){
  var g=D.goals.find(function(g){return g.id===autoContribGoalId;});if(!g)return;
  g.autoAmt=parseFloat(document.getElementById('autoContribAmt').value)||0;
  g.autoDay=parseInt(document.getElementById('autoContribDay').value)||0;
  autoSave();document.getElementById('autoContribModal').classList.remove('show');renderGoals();
}
function checkAutoContribs(){
  var today=new Date().getDate(),m=mk();
  D.goals.forEach(function(g){
    if(!g.autoAmt||!g.autoDay||g.autoDay!==today)return;
    var already=(g.contributions||[]).some(function(c){return c.month===m&&c.auto===true;});
    if(!already){if(!g.contributions)g.contributions=[];g.contributions.push({month:m,amount:g.autoAmt,destination:'Auto',date:new Date().toISOString(),auto:true});autoSave();}
  });
}
/* -- THEME & FONT -- */
function applyTheme(t){document.body.classList.remove('force-light','force-dark');if(t==='light')document.body.classList.add('force-light');if(t==='dark')document.body.classList.add('force-dark');var btn=document.getElementById('themeBtn');if(btn)btn.textContent=t==='dark'?'☀️':t==='light'?'🌙':'auto';}
function toggleTheme(){var ts=['auto','light','dark'],cur=D.config.theme||'auto',nxt=ts[(ts.indexOf(cur)+1)%3];D.config.theme=nxt;autoSave();applyTheme(nxt);}
function applyFontSize(f){document.body.classList.remove('fs-large','fs-small');if(f==='large')document.body.classList.add('fs-large');if(f==='small')document.body.classList.add('fs-small');var btn=document.getElementById('fontBtn');if(btn)btn.textContent=f==='large'?'A+':f==='small'?'A-':'A';}
function cycleFontSize(){var fs=['normal','large','small'],cur=D.config.fontSize||'normal',nxt=fs[(fs.indexOf(cur)+1)%3];D.config.fontSize=nxt;autoSave();applyFontSize(nxt);}
/* -- CHART REPORT -- */
function exportReport(months){
  months=months||6;
  var income=(D.config.income||0)+extraIncomeTotal(),fxd=fixedMonthly(),exps=getExpenses();
  var spent=exps.reduce(function(s,e){return s+e.amt;},0),savA=Math.max(0,income-fxd-spent),bal=income-fxd-spent;
  var savRate=income>0?Math.round(savA/income*100):0;

  /* Previous month for comparison */
  var prevDate=new Date(curDate.getFullYear(),curDate.getMonth()-1,1);
  var prevExps=getExpenses(prevDate),prevSpent=prevExps.reduce(function(s,e){return s+e.amt;},0);
  var prevIncome=(D.config.income||0)+extraIncomeTotal(prevDate);
  var prevSavA=Math.max(0,prevIncome-fxd-prevSpent);
  var prevSavRate=prevIncome>0?Math.round(prevSavA/prevIncome*100):0;
  var spentDiff=prevSpent>0?Math.round((spent-prevSpent)/prevSpent*100):null;
  var savDiff=prevSavA>0?Math.round((savA-prevSavA)/prevSavA*100):null;

  var monthsArr=[];for(var i=months-1;i>=0;i--)monthsArr.push(new Date(curDate.getFullYear(),curDate.getMonth()-i,1));
  var hist=monthsArr.map(function(d){var s=getExpenses(d).reduce(function(a,e){return a+e.amt;},0),mI=(D.config.income||0)+extraIncomeTotal(d);var sv=Math.max(0,mI-fxd-s);return{label:d.toLocaleString('default',{month:'short',year:'numeric'}),income:mI,fxd:Math.round(fxd),spent:Math.round(s),savings:Math.round(sv),savRate:mI>0?Math.round(sv/mI*100):0,balance:Math.round(mI-fxd-s)};});

  var cats={};exps.forEach(function(e){cats[e.cat]=(cats[e.cat]||0)+e.amt;});
  var cL=Object.keys(cats).sort(function(a,b){return cats[b]-cats[a];});
  var cD=cL.map(function(k){return Math.round(cats[k]);}),cC=cL.map(function(k){return getCatColor(k);});

  /* Top categories ranked */
  var topCats=cL.slice(0,5).map(function(k){return {name:k,amt:Math.round(cats[k]),color:getCatColor(k),pct:spent>0?Math.round(cats[k]/spent*100):0};});

  var mStr=curDate.toLocaleString('default',{month:'long',year:'numeric'});
  var generatedOn=new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  var r=function(n){return '\u20b9'+Math.abs(Math.round(n)).toLocaleString('en-IN');};
  var pct=function(v,good){var arrow=v>0?'\u25b2':'\u25bc';var col=((v>0)===good)?'#1D9E75':'#D85A30';return '<span style="color:'+col+';font-size:11px;font-weight:600">'+arrow+' '+Math.abs(v)+'%</span>';};

  /* Metric cards — now includes Savings Rate + MoM change */
  var metCards=[
    {label:'Income',val:r(income),color:'#185FA5',sub:null},
    {label:'Fixed',val:r(fxd),color:'#D85A30',sub:null},
    {label:'Spent',val:r(spent),color:'#D85A30',sub:spentDiff!==null?pct(spentDiff,false)+' vs last month':null},
    {label:'Saved',val:r(savA),color:'#1D9E75',sub:savDiff!==null?pct(savDiff,true)+' vs last month':null},
    {label:'Savings Rate',val:savRate+'%',color:savRate>=20?'#1D9E75':savRate>=10?'#BA7517':'#D85A30',sub:prevSavRate>0?'Last month: '+prevSavRate+'%':null},
    {label:'Balance',val:r(bal),color:bal>=0?'#1D9E75':'#D85A30',sub:null}
  ];
  var mets=metCards.map(function(m){return '<div style="background:#fff;border:1px solid #E4E2DA;border-radius:12px;padding:.9rem 1rem"><div style="font-size:10px;color:#9E9C97;margin-bottom:5px">'+m.label+'</div><div style="font-family:monospace;font-size:20px;font-weight:600;color:'+m.color+'">'+m.val+'</div>'+(m.sub?'<div style="margin-top:4px;font-size:11px;color:#9E9C97">'+m.sub+'</div>':'')+'</div>';}).join('');

  /* History table rows — includes Savings Rate column */
  var hRows='';hist.forEach(function(h){hRows+='<tr><td>'+h.label+'</td><td>'+r(h.income)+'</td><td>'+r(h.fxd)+'</td><td>'+r(h.spent)+'</td><td style="color:#1D9E75">'+r(h.savings)+'</td><td style="color:'+(h.savRate>=20?'#1D9E75':h.savRate>=10?'#BA7517':'#D85A30')+'">'+h.savRate+'%</td><td style="color:'+(h.balance>=0?'#1D9E75':'#D85A30')+'">'+r(h.balance)+'</td></tr>';});

  /* Top categories HTML */
  var topCatHtml=topCats.length?topCats.map(function(c){var barW=c.pct;return '<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="font-size:13px;font-weight:500;color:#1A1A18">'+c.name+'</span><span style="font-family:monospace;font-size:13px;color:'+c.color+';font-weight:600">'+r(c.amt)+' <span style="color:#9E9C97;font-weight:400">('+c.pct+'%)</span></span></div><div style="background:#F1F0EC;border-radius:99px;height:6px"><div style="background:'+c.color+';width:'+barW+'%;height:6px;border-radius:99px"></div></div></div>';}).join(''):'<p style="color:#9E9C97;font-size:13px">No expenses this month.</p>';

  /* Chart scripts */
  var sD='var H='+JSON.stringify(hist)+';var CL='+JSON.stringify(cL)+';var CD='+JSON.stringify(cD)+';var CC2='+JSON.stringify(cC)+';var MONTHS='+months+';';

  /* Bar chart — if 1 month, show summary cards instead; else show multi-month bar with legend */
  var overviewSection='';
  if(months===1){
    /* Single month: show a cleaner summary card layout instead of lonely single bar */
    overviewSection='<div class="sec"><div class="stitle">This Month Overview</div><div class="card"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px"><div style="text-align:center;padding:12px;background:#F1F0EC;border-radius:10px"><div style="font-size:11px;color:#9E9C97;margin-bottom:4px;text-transform:uppercase">Income</div><div style="font-family:monospace;font-size:18px;font-weight:600;color:#185FA5">'+r(income)+'</div></div><div style="text-align:center;padding:12px;background:#F1F0EC;border-radius:10px"><div style="font-size:11px;color:#9E9C97;margin-bottom:4px;text-transform:uppercase">Total Out</div><div style="font-family:monospace;font-size:18px;font-weight:600;color:#D85A30">'+r(fxd+spent)+'</div></div><div style="text-align:center;padding:12px;background:#F1F0EC;border-radius:10px"><div style="font-size:11px;color:#9E9C97;margin-bottom:4px;text-transform:uppercase">Saved</div><div style="font-family:monospace;font-size:18px;font-weight:600;color:#1D9E75">'+r(savA)+' <span style="font-size:13px">('+savRate+'%)</span></div></div></div>'+(spentDiff!==null?'<div style="margin-top:14px;padding:10px 14px;background:'+(spentDiff<=0?'#E8F7F2':'#FEF0EC')+';border-radius:8px;font-size:13px;color:#1A1A18">'+( spentDiff<=0?'\uD83D\uDCC9 Spent '+Math.abs(spentDiff)+'% less than last month — great job!':'\uD83D\uDCC8 Spent '+Math.abs(spentDiff)+'% more than last month.')+'</div>':'')+' </div></div>';
  } else {
    var legendHtml='<div style="display:flex;gap:16px;margin-bottom:10px;font-size:12px"><span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:2px;background:#378ADD;display:inline-block"></span>Income</span><span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:2px;background:#D85A30;display:inline-block"></span>Fixed+Spent</span><span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:2px;background:#1D9E75;display:inline-block"></span>Savings</span></div>';
    overviewSection='<div class="sec"><div class="stitle">'+months+'-Month Overview</div><div class="card">'+legendHtml+'<div class="ch"><canvas id="hc"></canvas></div></div></div>';
  }

  /* Daily limit section for report */
  var dlimit=D.config.dailyLimit||0;
  var dlRows='';
  var dlSummary='';
  if(dlimit>0){
    var rDim=new Date(curDate.getFullYear(),curDate.getMonth()+1,0).getDate();
    var rNow2=new Date();
    var rIsCur=rNow2.getFullYear()===curDate.getFullYear()&&rNow2.getMonth()===curDate.getMonth();
    var rLastDay=rIsCur?rNow2.getDate():rDim;
    var rDayNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var rOver=0,rOK=0,rNoSpend=0,rWorstAmt=0,rWorstDate='';
    for(var ri=1;ri<=rLastDay;ri++){
      var rDd=new Date(curDate.getFullYear(),curDate.getMonth(),ri);
      var rSpent=getExpenses().filter(function(e){return new Date(e.date).getDate()===ri;}).reduce(function(s,e){return s+e.amt;},0);
      var rStatus=rSpent===0?'No spend':(rSpent<=dlimit?'OK':'Over');
      var rColor=rSpent===0?'#9E9C97':rSpent<=dlimit?'#1D9E75':'#D85A30';
      if(rStatus==='Over')rOver++;
      else if(rStatus==='OK')rOK++;
      else rNoSpend++;
      if(rSpent>rWorstAmt){rWorstAmt=rSpent;rWorstDate=rDd.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});}
      dlRows+='<tr><td>'+rDd.toLocaleDateString('en-IN',{day:'numeric',month:'short'})+'</td><td>'+rDayNames[rDd.getDay()]+'</td><td>\u20b9'+Math.round(rSpent).toLocaleString('en-IN')+'</td><td style="color:'+rColor+';font-weight:600">'+rStatus+'</td><td style="color:'+(rSpent>dlimit?'#D85A30':'#1D9E75')+'">'+(rSpent>0?'\u20b9'+Math.round(dlimit-rSpent).toLocaleString('en-IN'):'-')+'</td></tr>';
    }
    var rPct=rLastDay>0?Math.round((rOK+rNoSpend)/rLastDay*100):0;
    dlSummary='<div class="sec"><div class="stitle">Daily Limit Analysis \u2014 \u20b9'+dlimit.toLocaleString('en-IN')+'/day</div><div class="card"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:16px"><div style="background:#F1F0EC;border-radius:10px;padding:10px 12px"><div style="font-size:10px;color:#9E9C97;text-transform:uppercase;margin-bottom:4px">Within Limit</div><div style="font-family:monospace;font-size:18px;font-weight:600;color:#1D9E75">'+rOK+' days</div></div><div style="background:#F1F0EC;border-radius:10px;padding:10px 12px"><div style="font-size:10px;color:#9E9C97;text-transform:uppercase;margin-bottom:4px">Over Limit</div><div style="font-family:monospace;font-size:18px;font-weight:600;color:#D85A30">'+rOver+' days</div></div><div style="background:#F1F0EC;border-radius:10px;padding:10px 12px"><div style="font-size:10px;color:#9E9C97;text-transform:uppercase;margin-bottom:4px">No Spend</div><div style="font-family:monospace;font-size:18px;font-weight:600;color:#185FA5">'+rNoSpend+' days</div></div><div style="background:#F1F0EC;border-radius:10px;padding:10px 12px"><div style="font-size:10px;color:#9E9C97;text-transform:uppercase;margin-bottom:4px">Success Rate</div><div style="font-family:monospace;font-size:18px;font-weight:600;color:'+(rPct>=80?'#1D9E75':rPct>=60?'#BA7517':'#D85A30')+'">'+rPct+'%</div></div>'+(rWorstDate?'<div style="background:#F1F0EC;border-radius:10px;padding:10px 12px"><div style="font-size:10px;color:#9E9C97;text-transform:uppercase;margin-bottom:4px">Worst Day</div><div style="font-family:monospace;font-size:14px;font-weight:600;color:#D85A30">'+rWorstDate+'</div><div style="font-size:11px;color:#9E9C97">\u20b9'+Math.round(rWorstAmt).toLocaleString('en-IN')+'</div></div>':'')+'</div><div style="overflow-x:auto"><table><thead><tr><th>Date</th><th>Day</th><th>Spent</th><th>Status</th><th>Over/Under</th></tr></thead><tbody>'+dlRows+'</tbody></table></div></div></div>';
  }
  /* Day-by-day section for report */
  var dbdSection='';
  var rExps=getExpenses();
  if(rExps.length){
    var rGrp={};
    rExps.forEach(function(e){var day=new Date(e.date).getDate();if(!rGrp[day])rGrp[day]=[];rGrp[day].push(e);});
    var rDim2=new Date(curDate.getFullYear(),curDate.getMonth()+1,0).getDate();
    var rNow3=new Date();
    var rIsCur2=rNow3.getFullYear()===curDate.getFullYear()&&rNow3.getMonth()===curDate.getMonth();
    var rLast2=rIsCur2?rNow3.getDate():rDim2;
    var rDN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var rCC2={Food:'#1D9E75',Transport:'#378ADD',Shopping:'#D4537E',Health:'#7F77DD',Entertainment:'#EF9F27',Utilities:'#3B6D11',Education:'#534AB7',Other:'#888780'};
    var rDayRows='';
    for(var rdi=1;rdi<=rLast2;rdi++){
      var rDd2=new Date(curDate.getFullYear(),curDate.getMonth(),rdi);
      var rItems=rGrp[rdi]||[];
      var rDayAmt=rItems.reduce(function(s,e){return s+e.amt;},0);
      if(rDayAmt===0)continue;
      var rDayLabel=rDd2.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'});
      var rItemRows=rItems.sort(function(a,b){return new Date(a.date)-new Date(b.date);}).map(function(e){
        return '<tr><td style="padding-left:20px;color:#1A1A18">'+e.name+'</td><td><span style="background:'+(rCC2[e.cat]||'#888')+'22;color:'+(rCC2[e.cat]||'#888')+';padding:2px 8px;border-radius:99px;font-size:11px;font-family:sans-serif">'+e.cat+'</span></td><td style="color:#1A1A18;font-weight:600">\u20b9'+Math.round(e.amt).toLocaleString('en-IN')+'</td></tr>';
      }).join('');
      rDayRows+='<tr style="background:#F7F6F3"><td colspan="3" style="padding:8px 10px;font-family:sans-serif;font-weight:600;font-size:13px;color:#1A1A18;border-bottom:2px solid #E4E2DA">'+rDayLabel+'<span style="float:right;font-family:monospace;color:#D85A30">\u20b9'+Math.round(rDayAmt).toLocaleString('en-IN')+'</span></td></tr>'+rItemRows;
    }
    dbdSection='<div class="sec"><div class="stitle">Day-by-Day Breakdown</div><div class="card" style="padding:0;overflow:hidden"><table style="margin:0"><thead><tr><th>Expense</th><th>Category</th><th>Amount</th></tr></thead><tbody>'+rDayRows+'</tbody></table></div></div>';
  }

  /* Chart script — bar chart with legend + doughnut with labels */
  var sC='try{'
    +'if(MONTHS>1){new Chart(document.getElementById("hc"),{type:"bar",data:{labels:H.map(function(d){return d.label;}),datasets:[{label:"Income",data:H.map(function(d){return d.income;}),backgroundColor:"#378ADD",borderRadius:4},{label:"Fixed+Spent",data:H.map(function(d){return d.fxd+d.spent;}),backgroundColor:"#D85A30",borderRadius:4},{label:"Savings",data:H.map(function(d){return d.savings;}),backgroundColor:"#1D9E75",borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{ticks:{callback:function(v){return"\u20b9"+(v>=100000?(v/100000).toFixed(0)+"L":v>=1000?(v/1000).toFixed(0)+"K":v);}}}}}});}'
    +'if(CL.length){new Chart(document.getElementById("cc"),{type:"doughnut",data:{labels:CL,datasets:[{data:CD,backgroundColor:CC2,borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:"55%",plugins:{legend:{display:true,position:"right",labels:{font:{size:11},boxWidth:12,padding:8}}}}});}'
    +'}catch(e){}';

  var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Report '+mStr+'</title>'
    +'<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"><\/script>'
    +'<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:#F7F6F3;color:#1A1A18;font-size:15px}.page{max-width:900px;margin:0 auto;padding:2rem 1.5rem}.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem}h1{font-size:24px;font-weight:700;margin-bottom:4px}.sub{color:#6B6A65;font-size:14px}.gen{font-size:11px;color:#9E9C97;margin-top:4px}.mgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:2rem}.sec{margin-bottom:2rem}.stitle{font-size:11px;font-weight:600;text-transform:uppercase;color:#9E9C97;margin-bottom:10px}.card{background:#fff;border:1px solid #E4E2DA;border-radius:12px;padding:1.25rem 1.5rem}.two{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:2rem}.ch{position:relative;height:220px}table{width:100%;border-collapse:collapse;font-size:13px}th{font-size:10px;font-weight:600;text-transform:uppercase;color:#9E9C97;text-align:left;padding:6px 8px;border-bottom:1px solid #E4E2DA}td{padding:8px;border-bottom:1px solid #E4E2DA;font-family:monospace}td:first-child{font-family:inherit;color:#6B6A65}.pbtn{position:fixed;bottom:24px;right:24px;background:#1A1A18;color:#fff;border:none;border-radius:99px;padding:12px 24px;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.2)}@media print{.pbtn{display:none}}</style>'
    +'</head><body><div class="page">'
    +'<div class="hdr"><div><h1>\uD83D\uDCB0 Finance Report</h1><div class="sub">'+mStr+'</div><div class="gen">Generated on '+generatedOn+'</div></div></div>'
    +'<div class="mgrid">'+mets+'</div>'
    +overviewSection
    +'<div class="two"><div class="card"><div class="stitle">By Category</div><div class="ch"><canvas id="cc"></canvas></div></div>'
    +'<div class="card"><div class="stitle">Top Spending Categories</div>'+topCatHtml+'</div></div>'
    +'<div class="sec"><div class="stitle">Monthly Summary</div><div class="card"><div style="overflow-x:auto"><table><thead><tr><th>Month</th><th>Income</th><th>Fixed</th><th>Spent</th><th>Savings</th><th>Sav %</th><th>Balance</th></tr></thead><tbody>'+hRows+'</tbody></table></div></div></div>'
    +dbdSection+dlSummary
    +'</div><button class="pbtn" onclick="window.print()">\uD83D\uDDB8 Print / Save PDF</button>'
    +'<script>'+sD+sC+'<\/script></body></html>';

  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));a.download='finance-report-'+mk()+'.html';a.click();
}
