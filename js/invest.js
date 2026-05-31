/* ═══ INVESTMENTS ═══ */

function addLiability(){
  var name=document.getElementById('liabName').value.trim(),amt=parseFloat(document.getElementById('liabAmt').value);
  if(!name||isNaN(amt)||amt<=0)return;
  if(!D.liabilities)D.liabilities=[];
  D.liabilities.push({id:Date.now().toString(),name:name,amt:amt});
  autoSave();document.getElementById('liabName').value='';document.getElementById('liabAmt').value='';
  renderNetWorth();
}
function removeLiability(id){if(!confirm('Delete this liability?'))return;D.liabilities=(D.liabilities||[]).filter(function(l){return l.id!==id;});autoSave();renderNetWorth();}
function renderNWSnapshot(){
  var el=document.getElementById('nwSnapshotBody');if(!el)return;
  var accs=D.accounts;
  var accTotal=accs.reduce(function(s,a){
    var sp=D.expenses.filter(function(e){return e.accountId===a.id;}).reduce(function(t,e){return t+e.amt;},0);
    var inc=(D.extraIncome||[]).filter(function(e){return e.accountId===a.id;}).reduce(function(t,e){return t+e.amt;},0);
    var tIn=(D.transfers||[]).filter(function(t){return t.toId===a.id;}).reduce(function(t2,t){return t2+t.amt;},0);
    var tOut=(D.transfers||[]).filter(function(t){return t.fromId===a.id;}).reduce(function(t2,t){return t2+t.amt;},0);
    return s+(a.openingBalance+inc-sp+tIn-tOut);
  },0);
  var liabTotal=(D.liabilities||[]).reduce(function(s,l){return s+l.amt;},0);
  var goalTotal=(D.goals||[]).reduce(function(s,g){return s+(g.contributions||[]).reduce(function(t,c){return t+c.amount;},0);},0);
  var nw=accTotal+goalTotal-liabTotal;
  var col=nw>=0?'var(--green)':'var(--red)';
  el.innerHTML='<div style="display:flex;gap:10px;flex-wrap:wrap">'
    +'<div style="flex:1;min-width:80px;background:var(--sur2);border-radius:8px;padding:8px 10px"><div style="font-size:10px;color:var(--tx3);margin-bottom:3px">ACCOUNTS</div><div style="font-family:monospace;font-weight:600;font-size:14px">'+fmt(accTotal)+'</div></div>'
    +(liabTotal>0?'<div style="flex:1;min-width:80px;background:var(--sur2);border-radius:8px;padding:8px 10px"><div style="font-size:10px;color:var(--tx3);margin-bottom:3px">LIABILITIES</div><div style="font-family:monospace;font-weight:600;font-size:14px;color:var(--red)">'+fmt(liabTotal)+'</div></div>':'')
    +'<div style="flex:1;min-width:80px;background:var(--sur2);border-radius:8px;padding:8px 10px"><div style="font-size:10px;color:var(--tx3);margin-bottom:3px">NET WORTH</div><div style="font-family:monospace;font-weight:600;font-size:16px;color:'+col+'">'+fmt(nw)+'</div></div>'
    +'</div>';
}

function renderNetWorth(){
  var accs=D.accounts;
  var accTotal=accs.reduce(function(s,a){
    var spent=D.expenses.filter(function(e){return e.accountId===a.id;}).reduce(function(t,e){return t+e.amt;},0);
    var incIn=(D.extraIncome||[]).filter(function(e){return e.accountId===a.id;}).reduce(function(t,e){return t+e.amt;},0);
    var tIn=(D.transfers||[]).filter(function(t){return t.toId===a.id;}).reduce(function(s2,t){return s2+t.amt;},0);
    var tOut=(D.transfers||[]).filter(function(t){return t.fromId===a.id;}).reduce(function(s2,t){return s2+t.amt;},0);
    return s+(a.openingBalance+incIn+tIn-tOut-spent);
  },0);
  var fdTotal=D.fds.reduce(function(s,fd){var el=Math.min(mElapsed(fd.start),fd.tenure);return s+calcFD(fd.amt,fd.rate,el);},0);
  var rdTotal=D.rds.reduce(function(s,rd){var el=Math.min(mElapsed(rd.start),rd.tenure);return s+(el>0?calcRD(rd.amt,rd.rate,el):0);},0);
  var goalTotal=D.goals.reduce(function(s,g){return s+(g.contributions||[]).reduce(function(t,c){return t+c.amount;},0);},0);
  /* Pending lent amounts are assets — money owed to you */
  var pendingLent=(D.lent||[]).filter(function(l){return !l.returned;}).reduce(function(s,l){return s+l.amt;},0);
  var totalAssets=accTotal+fdTotal+rdTotal+goalTotal+pendingLent;
  var liabilities=D.liabilities||[];
  var totalLiab=liabilities.reduce(function(s,l){return s+l.amt;},0);
  var netWorth=totalAssets-totalLiab;
  document.getElementById('nw-assets').textContent=fmt(totalAssets);
  document.getElementById('nw-liab').textContent=fmt(totalLiab);
  var nwEl=document.getElementById('nw-total');nwEl.textContent=fmt(netWorth);nwEl.className='mval '+(netWorth>=0?'green':'red');
  /* Debt-to-asset ratio */
  var ratioCard=document.getElementById('nwRatioCard');
  if(ratioCard)ratioCard.style.display=totalLiab>0?'block':'none';
  var dtaEl=document.getElementById('nw-dta-ratio');
  if(dtaEl&&totalAssets>0){var dta=(totalLiab/totalAssets*100).toFixed(1);dtaEl.textContent=dta+'%';dtaEl.style.color=dta>50?'var(--red)':dta>25?'var(--amber)':'var(--green)';}
  var liabCountEl=document.getElementById('nw-liab-count');
  if(liabCountEl)liabCountEl.textContent=fmt(totalLiab);
  var assetRows=[{l:'Account balances',v:accTotal,icon:'🏦'},{l:'FDs (current value)',v:fdTotal,icon:'📈'},{l:'RDs (current value)',v:rdTotal,icon:'🔄'},{l:'Goal savings',v:goalTotal,icon:'🎯'},{l:'Pending lent (owed to you)',v:pendingLent,icon:'💸'}];
  document.getElementById('nw-assets-list').innerHTML=assetRows.filter(function(r){return r.v>0;}).map(function(r){return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--bdr);font-size:13px"><span>'+r.icon+' '+r.l+'</span><span style="font-family:\'DM Mono\',monospace;font-weight:500;color:var(--green)">'+fmt(r.v)+'</span></div>';}).join('')||'<p class="empty">No assets found.</p>';
  var liabEl=document.getElementById('nw-liab-list');
  if(!liabilities.length){liabEl.innerHTML='<p class="empty">No liabilities yet.</p>';return;}
  liabEl.innerHTML=liabilities.map(function(l){return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--bdr);font-size:13px"><span>'+l.name+'</span><div style="display:flex;align-items:center;gap:8px"><span style="font-family:\'DM Mono\',monospace;font-weight:500;color:var(--red)">'+fmt(l.amt)+'</span><button class="del-btn" onclick="removeLiability(\''+l.id+'\')">×</button></div></div>';}).join('');
  /* Net Worth Snapshot — save current value keyed by month */
  if(!D.config.nwSnapshots)D.config.nwSnapshots={};
  var snapKey=mk();
  D.config.nwSnapshots[snapKey]=Math.round(netWorth);
  autoSave();
  /* Render trend chart */
  var snapKeys=Object.keys(D.config.nwSnapshots).sort();
  var snapVals=snapKeys.map(function(k){return D.config.nwSnapshots[k];});
  var snapLabels=snapKeys.map(function(k){var p=k.split('-');return new Date(parseInt(p[0]),parseInt(p[1])-1,1).toLocaleString('default',{month:'short',year:'2-digit'});});
  var dark=document.body.classList.contains('force-dark')||(!document.body.classList.contains('force-light')&&matchMedia('(prefers-color-scheme:dark)').matches);
  var emptyEl=document.getElementById('nw-trend-empty');
  if(snapKeys.length<2){if(emptyEl)emptyEl.style.display='block';return;}
  if(emptyEl)emptyEl.style.display='none';
  if(window._nwChart){try{window._nwChart.destroy();}catch(e){}}
  window._nwChart=new Chart(document.getElementById('nwTrendChart'),{
    type:'line',
    data:{labels:snapLabels,datasets:[{data:snapVals,borderColor:'#1D9E75',backgroundColor:'rgba(29,158,117,.1)',borderWidth:2,pointRadius:4,pointBackgroundColor:'#1D9E75',tension:0.3,fill:true}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(ctx){return fmt(ctx.parsed.y);}}}},scales:{x:{grid:{display:false}},y:{grid:{color:dark?'rgba(255,255,255,.05)':'rgba(0,0,0,.05)'},ticks:{callback:function(v){return '₹'+(Math.abs(v)>=100000?(v/100000).toFixed(0)+'L':v>=1000?(v/1000).toFixed(0)+'K':v);}}}}}
  });
}

function mElapsed(s){var st=new Date(s),n=new Date();return Math.max(0,(n.getFullYear()-st.getFullYear())*12+(n.getMonth()-st.getMonth()));}
function matDate(s,m){var d=new Date(s);d.setMonth(d.getMonth()+m);return d;}
function calcFD(p,r,m){return p*Math.pow(1+r/400,m/3);}
function calcRD(mo,r,m){var qi=r/400,t=0;for(var i=1;i<=m;i++)t+=mo*Math.pow(1+qi,(m-i+1)/3);return t;}
function addFD(){var bank=document.getElementById('fd-bank').value.trim(),amt=parseFloat(document.getElementById('fd-amt').value),rate=parseFloat(document.getElementById('fd-rate').value),tenure=parseInt(document.getElementById('fd-tenure').value),start=document.getElementById('fd-start').value;if(!bank||isNaN(amt)||isNaN(rate)||isNaN(tenure)||!start)return;D.fds.push({id:Date.now().toString(),bank:bank,amt:amt,rate:rate,tenure:tenure,start:start});autoSave();['fd-bank','fd-amt','fd-rate','fd-tenure','fd-start'].forEach(function(id){document.getElementById(id).value='';});renderInvestments();}
function removeFD(id){if(!confirm('Delete this FD?'))return;D.fds=D.fds.filter(function(f){return f.id!==id;});autoSave();renderInvestments();}
function addRD(){var bank=document.getElementById('rd-bank').value.trim(),amt=parseFloat(document.getElementById('rd-amt').value),rate=parseFloat(document.getElementById('rd-rate').value),tenure=parseInt(document.getElementById('rd-tenure').value),start=document.getElementById('rd-start').value;if(!bank||isNaN(amt)||isNaN(rate)||isNaN(tenure)||!start)return;D.rds.push({id:Date.now().toString(),bank:bank,amt:amt,rate:rate,tenure:tenure,start:start});autoSave();['rd-bank','rd-amt','rd-rate','rd-tenure','rd-start'].forEach(function(id){document.getElementById(id).value='';});renderInvestments();}
function removeRD(id){if(!confirm('Delete this RD?'))return;D.rds=D.rds.filter(function(r){return r.id!==id;});autoSave();renderInvestments();}

function renderInvestments(){
  var totInv=0,totCur=0,totMat=0;  /* BUG FIX: totCur declared */
  var fdEl=document.getElementById('fdList');
  if(!D.fds.length){fdEl.innerHTML='<p class="empty">No FDs yet.</p>';}
  else{fdEl.innerHTML=D.fds.map(function(fd){var mat=calcFD(fd.amt,fd.rate,fd.tenure),intA=mat-fd.amt,el=Math.min(mElapsed(fd.start),fd.tenure),rem=fd.tenure-el,pct=(el/fd.tenure*100).toFixed(1),md=matDate(fd.start,fd.tenure),done=rem<=0,soon=rem>0&&rem<=2,cur=calcFD(fd.amt,fd.rate,el);totInv+=fd.amt;totCur+=cur;totMat+=mat;return '<div class="inv-item"><div class="inv-top"><div><div class="inv-name">'+fd.bank+'</div><div class="inv-sub">'+fd.rate+'% p.a. · '+fd.tenure+' months</div></div><div class="inv-badges">'+(done?'<span class="mat-badge">✓ Matured</span>':soon?'<span class="soon-badge">Matures soon!</span>':'')+'<button class="del-btn" onclick="removeFD(\''+fd.id+'\')">×</button></div></div><div class="inv-stats"><div class="ist"><div class="ist-l">Principal</div><div class="ist-v">'+fmt(fd.amt)+'</div></div><div class="ist"><div class="ist-l">Interest</div><div class="ist-v green">+'+fmt(intA)+'</div></div><div class="ist"><div class="ist-l">Maturity</div><div class="ist-v blue">'+fmt(mat)+'</div></div><div class="ist"><div class="ist-l">Matures</div><div class="ist-v">'+md.toLocaleDateString('en-IN',{month:'short',year:'numeric'})+'</div></div></div><div class="pbg" style="margin-top:8px"><div class="pfill" style="width:'+pct+'%;background:'+(done?'var(--green)':'var(--blue)')+'"></div></div></div>';}).join('');}
  var rdEl=document.getElementById('rdList');
  if(!D.rds.length){rdEl.innerHTML='<p class="empty">No RDs yet.</p>';}
  else{rdEl.innerHTML=D.rds.map(function(rd){var el=Math.min(mElapsed(rd.start),rd.tenure),rem=rd.tenure-el,pct=(el/rd.tenure*100).toFixed(1),invA=rd.amt*el,mat=calcRD(rd.amt,rd.rate,rd.tenure),intA=mat-rd.amt*rd.tenure,md=matDate(rd.start,rd.tenure),done=rem<=0,soon=rem>0&&rem<=2;totInv+=invA;totCur+=el>0?calcRD(rd.amt,rd.rate,el):0;totMat+=mat;return '<div class="inv-item"><div class="inv-top"><div><div class="inv-name">'+rd.bank+'</div><div class="inv-sub">'+fmt(rd.amt)+'/month · '+rd.rate+'% p.a.</div></div><div class="inv-badges">'+(done?'<span class="mat-badge">✓ Matured</span>':soon?'<span class="soon-badge">Matures soon!</span>':'')+'<button class="del-btn" onclick="removeRD(\''+rd.id+'\')">×</button></div></div><div class="inv-stats"><div class="ist"><div class="ist-l">Invested</div><div class="ist-v">'+fmt(invA)+'</div></div><div class="ist"><div class="ist-l">Interest</div><div class="ist-v green">+'+fmt(intA)+'</div></div><div class="ist"><div class="ist-l">Maturity</div><div class="ist-v blue">'+fmt(mat)+'</div></div><div class="ist"><div class="ist-l">Matures</div><div class="ist-v">'+md.toLocaleDateString('en-IN',{month:'short',year:'numeric'})+'</div></div></div><div class="pbg" style="margin-top:8px"><div class="pfill" style="width:'+pct+'%;background:'+(done?'var(--green)':'#1D9E75')+'"></div></div></div>';}).join('');}
  document.getElementById('inv-invested').textContent=fmt(totInv);
  var interest=totMat-totInv,rEl=document.getElementById('inv-returns');
  var returnsPct=totInv>0?((interest/totInv)*100).toFixed(1):0;
  rEl.textContent='+'+fmt(Math.max(0,interest))+' ('+returnsPct+'%)';rEl.className='mval green';
  document.getElementById('inv-maturity').textContent=fmt(totMat);
  /* Maturity alert banner */
  var soonFDs=(D.fds||[]).filter(function(fd){var r=fd.tenure-Math.min(fd.tenure,mElapsed(fd.start));return r>0&&r<=2;});
  var soonRDs=(D.rds||[]).filter(function(rd){var r=rd.tenure-Math.min(rd.tenure,mElapsed(rd.start));return r>0&&r<=2;});
  var matBanner=document.getElementById('maturityBanner');
  if(matBanner){
    var items=[].concat(soonFDs.map(function(f){return 'FD: '+f.bank;})).concat(soonRDs.map(function(r){return 'RD: '+r.bank;}));
    if(items.length){matBanner.style.display='flex';document.getElementById('matBannerText').textContent='⏰ Maturing soon: '+items.join(', ');}
    else matBanner.style.display='none';
  }
}

/* ═══ CSV ═══ */
var exportType='excel';
function openExportModal(type){
  exportType=type;
  document.getElementById('exportModalTitle').textContent=type==='excel'?'⬇ Excel Export':'📊 Chart Report';
  document.getElementById('exportModal').classList.add('show');
}
function doExport(months){
  document.getElementById('exportModal').classList.remove('show');
  if(exportType==='excel')exportExcel(months);
  else exportReport(months);
}
function exportExcel(months){
  months=months||6;
  if(typeof XLSX==='undefined'){showToast('Excel library not loaded.','error');return;}
  var wb=XLSX.utils.book_new(),accs=D.accounts,income=(D.config.income||0)+extraIncomeTotal(),fxd=fixedMonthly();

  /* ── Sheet 1: Monthly Summary ── */
  var sum=[['Month','Income','Fixed Costs','Daily Spent','Total Expenses','Savings','Balance']];
  for(var i=months-1;i>=0;i--){
    var d=new Date(curDate.getFullYear(),curDate.getMonth()-i,1);
    var mI=(D.config.income||0)+extraIncomeTotal(d);
    var s=getExpenses(d).reduce(function(a,e){return a+e.amt;},0);
    var sav=Math.max(0,mI-fxd-s),bal=mI-fxd-s;
    sum.push([d.toLocaleString('default',{month:'long',year:'numeric'}),mI,Math.round(fxd),Math.round(s),Math.round(fxd+s),Math.round(sav),Math.round(bal)]);
  }
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(sum),'Monthly Summary ('+months+'mo)');

  /* ── Sheet 2: This Month Summary ── */
  var exps=getExpenses(),spent=exps.reduce(function(s,e){return s+e.amt;},0);
  var savA=Math.max(0,income-fxd-spent),savT=income*(D.config.savpct||20)/100;
  var now=new Date(),dim=new Date(curDate.getFullYear(),curDate.getMonth()+1,0).getDate();
  var isCur=now.getFullYear()===curDate.getFullYear()&&now.getMonth()===curDate.getMonth();
  var daysEl=isCur?now.getDate():dim,dailyAvg=daysEl>0?spent/daysEl:0;
  var lastDate=new Date(curDate.getFullYear(),curDate.getMonth()-1,1);
  var lastSpent=getExpenses(lastDate).reduce(function(s,e){return s+e.amt;},0);
  var lastInc2=(D.config.income||0)+extraIncomeTotal(lastDate);
  var lastSavA=Math.max(0,lastInc2-fxd-lastSpent);
  var mgs=0;D.goals.forEach(function(g){mgs+=(g.contributions||[]).filter(function(c){return c.month===mk();}).reduce(function(s,c){return s+c.amount;},0);});
  var cats={};exps.forEach(function(e){cats[e.cat]=(cats[e.cat]||0)+e.amt;});
  var ov=[
    [curDate.toLocaleString('default',{month:'long',year:'numeric'})+' — Overview',''],
    ['',''],['Metric','Value'],
    ['Income',income],['Fixed Costs',Math.round(fxd)],['Total Expenses',Math.round(spent)],
    ['Amount Saved',Math.round(savA)],['Savings Goal',Math.round(savT)],['Goal Met?',savA>=savT?'Yes':'No'],
    ['Balance',Math.round(income-fxd-spent)],['',''],
    ['Daily Averages',''],['Days Tracked',daysEl],['Daily Avg Spend',Math.round(dailyAvg)],
    ['Projected Full Month',Math.round(dailyAvg*dim)],['',''],
    ['vs Last Month',''],['Last Month Expenses',Math.round(lastSpent)],
    ['Expense Change',Math.round(spent-lastSpent)],['Last Month Savings',Math.round(lastSavA)],
    ['Savings Change',Math.round(savA-lastSavA)],['Goals Funded This Month',Math.round(mgs)],['',''],
    ['Category Breakdown','Amount','% of Spending']
  ];
  var sortedCats=Object.keys(cats).sort(function(a,b){return cats[b]-cats[a];});
  sortedCats.forEach(function(k){ov.push([k,Math.round(cats[k]),spent>0?+((cats[k]/spent)*100).toFixed(1):0]);});
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(ov),'This Month Summary');

  /* ── Sheet 3: All Expenses (all months) ── */
  var all=[['Month','Date','Description','Category','Account','Amount (₹)','Note','Tags']];
  var allMonths=[]; /* BUG FIX: was shadowing param */
  var seen={};
  D.expenses.forEach(function(e){if(!seen[e.month]){seen[e.month]=true;allMonths.push(e.month);}});
  allMonths.sort();
  allMonths.forEach(function(m){
    var parts=m.split('-'),d2=new Date(parseInt(parts[0]),parseInt(parts[1])-1,1);
    var lbl=d2.toLocaleString('default',{month:'long',year:'numeric'});
    var mExps=D.expenses.filter(function(e){return e.month===m;});
    mExps.sort(function(a,b){return new Date(a.date)-new Date(b.date);});
    mExps.forEach(function(e){var acc=accs.find(function(a){return a.id===e.accountId;});all.push([lbl,new Date(e.date).toLocaleDateString('en-IN'),e.name,e.cat,acc?acc.name:'',e.amt,e.note||'',e.tags||'']);});
  });
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(all),'All Expenses');

  /* ── Sheet 4: This Month Expenses ── */
  var tm=[['Date','Description','Category','Account','Amount (₹)','Note','Tags']];
  exps.sort(function(a,b){return new Date(a.date)-new Date(b.date);});
  exps.forEach(function(e){var acc=accs.find(function(a){return a.id===e.accountId;});tm.push([new Date(e.date).toLocaleDateString('en-IN'),e.name,e.cat,acc?acc.name:'',e.amt,e.note||'',e.tags||'']);});
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(tm),'This Month Expenses');

  /* ── Day by Day Sheet ── */
  var dbd=[];
  var dbdDayNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  /* group expenses by date */
  var dbdGroups={};
  exps.forEach(function(e){
    var dKey=new Date(e.date).getDate();
    if(!dbdGroups[dKey])dbdGroups[dKey]=[];
    dbdGroups[dKey].push(e);
  });
  var dbdDim=new Date(curDate.getFullYear(),curDate.getMonth()+1,0).getDate();
  var dbdNow=new Date();
  var dbdIsCur=dbdNow.getFullYear()===curDate.getFullYear()&&dbdNow.getMonth()===curDate.getMonth();
  var dbdLastDay=dbdIsCur?dbdNow.getDate():dbdDim;
  var dbdDailyLimit=D.config.dailyLimit||0;
  dbd.push(['DAY-BY-DAY EXPENSE BREAKDOWN — '+curDate.toLocaleString('default',{month:'long',year:'numeric'}),'','','','','']);
  dbd.push(['','','','','','']);
  for(var dbdi=1;dbdi<=dbdLastDay;dbdi++){
    var dbdDate=new Date(curDate.getFullYear(),curDate.getMonth(),dbdi);
    var dbdItems=dbdGroups[dbdi]||[];
    var dbdDayTotal=dbdItems.reduce(function(s,e){return s+e.amt;},0);
    /* Day header row */
    var dbdLabel=dbdDate.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'});
    var dbdLimitNote=dbdDailyLimit>0?(dbdDayTotal>dbdDailyLimit?' ⚠ OVER LIMIT':' ✓ within limit'):'';
    dbd.push(['📅 '+dbdLabel+dbdLimitNote,'','','','Day Total →',dbdDayTotal>0?dbdDayTotal:'-']);
    if(dbdItems.length===0){
      dbd.push(['  (no expenses)','','','','','']);
    } else {
      /* Column headers for this day */
      dbd.push(['  Description','Category','Account','Amount (₹)','Note','Tags']);
      /* Each expense */
      dbdItems.sort(function(a,b){return new Date(a.date)-new Date(b.date);});
      dbdItems.forEach(function(e){
        var acc=accs.find(function(a){return a.id===e.accountId;});
        dbd.push(['  '+e.name,e.cat,acc?acc.name:'—',e.amt,e.note||'',e.tags||'']);
      });
      /* Category mini-summary for the day */
      if(dbdItems.length>1){
        var dbdCats={};
        dbdItems.forEach(function(e){dbdCats[e.cat]=(dbdCats[e.cat]||0)+e.amt;});
        var dbdCatStr=Object.keys(dbdCats).map(function(k){return k+': ₹'+Math.round(dbdCats[k]).toLocaleString('en-IN');}).join('  |  ');
        dbd.push(['  By category: '+dbdCatStr,'','','','','']);
      }
    }
    dbd.push(['','','','','','']); /* spacer */
  }
  /* Grand totals */
  var dbdTotal=exps.reduce(function(s,e){return s+e.amt;},0);
  var dbdCatsAll={};exps.forEach(function(e){dbdCatsAll[e.cat]=(dbdCatsAll[e.cat]||0)+e.amt;});
  dbd.push(['MONTH TOTAL','','','','',Math.round(dbdTotal)]);
  dbd.push(['','','','','','']);
  dbd.push(['Category Totals','','','','','']);
  Object.keys(dbdCatsAll).sort(function(a,b){return dbdCatsAll[b]-dbdCatsAll[a];}).forEach(function(k){
    dbd.push(['  '+k,'','','','',Math.round(dbdCatsAll[k])]);
  });
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(dbd),'Day by Day');
  var fx=[['Name','Amount','Frequency','Monthly Equiv','Reminder']];
  D.fixed.forEach(function(f){var mo=f.freq==='Daily'?f.amt*30:f.freq==='Weekly'?f.amt*4.33:f.freq==='Yearly'?f.amt/12:f.amt;fx.push([f.name,f.amt,f.freq,Math.round(mo),f.recurring?'Yes':'No']);});
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(fx),'Fixed Expenses');

  /* ── Sheet 6: Goals ── */
  var gl=[['Goal','Target','Saved','Remaining','% Complete','Deadline']];
  D.goals.forEach(function(g){var sv=(g.contributions||[]).reduce(function(s,c){return s+c.amount;},0);gl.push([g.emoji+' '+g.name,g.target,Math.round(sv),Math.round(Math.max(0,g.target-sv)),(Math.min(100,sv/g.target*100)).toFixed(1)+'%',g.deadline||'—']);});
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(gl),'Goals');


  /* ── Lent Sheet ── */
  var lt=[['Person','Amount','Date Lent','Return By','Status','Returned Date','Note']];
  (D.lent||[]).forEach(function(l){lt.push([l.name,l.amt,l.date,l.returnBy||'—',l.returned?'Returned':'Pending',l.returnedDate||'—',l.note||'']);});
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(lt),'Lent Money');

  /* ── Daily Analysis Sheet ── */
  var dailyLimit=D.config.dailyLimit||0;
  var da=[['Date','Day','Total Spent','Daily Limit','Status','Over/Under (₹)']];
  var curM=mk();
  var curDim=new Date(curDate.getFullYear(),curDate.getMonth()+1,0).getDate();
  var curNow=new Date();
  var curIsCur=curNow.getFullYear()===curDate.getFullYear()&&curNow.getMonth()===curDate.getMonth();
  var curLastDay=curIsCur?curNow.getDate():curDim;
  var dayNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  for(var di=1;di<=curLastDay;di++){
    var dd=new Date(curDate.getFullYear(),curDate.getMonth(),di);
    var daySpent=getExpenses().filter(function(e){return new Date(e.date).getDate()===di;}).reduce(function(s,e){return s+e.amt;},0);
    var limitSet=dailyLimit>0;
    var status=!limitSet?'No limit set':(daySpent===0?'No spend':(daySpent<=dailyLimit?'OK':'Over'));
    var overUnder=limitSet?Math.round(dailyLimit-daySpent):'-';
    da.push([dd.toLocaleDateString('en-IN'),dayNames[dd.getDay()],Math.round(daySpent),limitSet?dailyLimit:'-',status,overUnder]);
  }
  /* Summary rows */
  if(dailyLimit>0){
    var daysOver=da.slice(1).filter(function(r){return r[4]==='Over';}).length;
    var daysOK=da.slice(1).filter(function(r){return r[4]==='OK';}).length;
    var daysNoSpend=da.slice(1).filter(function(r){return r[4]==='No spend';}).length;
    var spentVals=da.slice(1).map(function(r){return r[2];}).filter(function(v){return v>0;});
    var avgDaily=spentVals.length?Math.round(spentVals.reduce(function(s,v){return s+v;},0)/spentVals.length):0;
    var worstDay=da.slice(1).reduce(function(best,r){return r[2]>best[2]?r:best;},da[1]||[]);
    da.push(['','','','','','']);
    da.push(['Summary','']);
    da.push(['Daily Limit Set',dailyLimit]);
    da.push(['Days Within Limit',daysOK]);
    da.push(['Days Over Limit',daysOver]);
    da.push(['Days No Spend',daysNoSpend]);
    da.push(['Avg Daily Spend (spend days)',avgDaily]);
    if(worstDay&&worstDay[0])da.push(['Worst Day',worstDay[0]+' ('+worstDay[1]+')',worstDay[2]]);
  }
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(da),'Daily Analysis');

  XLSX.writeFile(wb,'finance-tracker-'+new Date().toISOString().slice(0,10)+'.xlsx');
}

function exportCSV(){
  var arr;
  if(typeof _rangeFrom!=='undefined'&&(_rangeFrom||_rangeTo)){
    var from=_rangeFrom?new Date(_rangeFrom+'T00:00:00'):null;
    var to=_rangeTo?new Date(_rangeTo+'T23:59:59'):null;
    arr=D.expenses.filter(function(e){var d=new Date(e.date);if(from&&d<from)return false;if(to&&d>to)return false;return true;});
  } else {
    arr=getExpenses();
  }
  var accs=D.accounts;if(!arr.length){showToast('No expenses this month!','error');return;}var rows=[['Date','Description','Category','Account','Amount (₹)','Note','Tags']];arr.forEach(function(e){var acc=accs.find(function(a){return a.id===e.accountId;});rows.push([new Date(e.date).toLocaleDateString('en-IN'),e.name,e.cat,acc?acc.name:'',e.amt.toFixed(2),e.note||'',e.tags||'']);});var a=document.createElement('a');a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(rows.map(function(r){return r.join(',');}).join('\n'));a.download='expenses-'+mk()+'.csv';a.click();}
function exportAnalyseCSV(){
  var selMonth=document.getElementById('an-month').value||mk();
  var selCat=document.getElementById('an-cat').value;
  var selAcc=document.getElementById('an-acc').value;
  var selSearch=(document.getElementById('an-search').value||'').toLowerCase().trim();
  var arr=D.expenses.filter(function(e){
    if(e.month!==selMonth)return false;
    if(selCat&&e.cat!==selCat)return false;
    if(selAcc&&e.accountId!==selAcc)return false;
    if(selSearch&&e.name.toLowerCase().indexOf(selSearch)<0&&e.cat.toLowerCase().indexOf(selSearch)<0&&(!e.note||e.note.toLowerCase().indexOf(selSearch)<0))return false;
    return true;
  });
  if(!arr.length){showToast('No data to export','error');return;}
  var accs=D.accounts;
  var rows=[['Date','Description','Category','Account','Amount (₹)','Note']];
  arr.sort(function(a,b){return new Date(a.date)-new Date(b.date);}).forEach(function(e){
    var acc=accs.find(function(a){return a.id===e.accountId;});
    rows.push([new Date(e.date).toLocaleDateString('en-IN'),e.name,e.cat,acc?acc.name:'',e.amt.toFixed(2),e.note||'']);
  });
  var total=arr.reduce(function(s,e){return s+e.amt;},0);
  rows.push(['','','','','','']);
  rows.push(['TOTAL','','','',total.toFixed(2),'']);
  var a=document.createElement('a');
  a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(',');}).join('\n'));
  a.download='analyse-'+selMonth+(selCat?'-'+selCat:'')+(selSearch?'-'+selSearch:'')+'.csv';
  a.click();
  showToast('Exported '+arr.length+' expenses','success');
}
