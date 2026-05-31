/* ═══ FORMAT ═══ */
function fmt(n){var a=Math.abs(Number(n)),s;if(a>=10000000)s=(a/10000000).toFixed(1).replace(/\.0$/,'')+'Cr';else if(a>=100000)s=(a/100000).toFixed(1).replace(/\.0$/,'')+'L';else s=a.toLocaleString('en-IN',{maximumFractionDigits:0});return (Number(n)<0?'-':'')+'₹'+s;}
function fmtF(n){return (Number(n)<0?'-':'')+'₹'+Math.abs(Number(n)).toLocaleString('en-IN',{maximumFractionDigits:0});}
function todayStr(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function mk(d){var t=d||curDate;return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0');}
function getExpenses(d){var m=mk(d);return D.expenses.filter(function(e){return e.month===m;});}
function getPaid(d){return D.paid[mk(d)]||[];}
function fixedMonthly(){return D.fixed.reduce(function(s,f){if(f.freq==='Daily')return s+f.amt*30;if(f.freq==='Weekly')return s+f.amt*4.33;if(f.freq==='Yearly')return s+f.amt/12;return s+f.amt;},0);}

/* ═══ TABS / NAV ═══ */
function changeMonth(dir){
  /* Reset quick filter and date range when switching months */
  _qFilterMode='all';
  _rangeFrom=null;_rangeTo=null;
  var rf=document.getElementById('rangeFrom');if(rf)rf.value='';
  var rt=document.getElementById('rangeTo');if(rt)rt.value='';
  var rr=document.getElementById('rangeResult');if(rr)rr.style.display='none';
  document.querySelectorAll('.qpill').forEach(function(p){p.classList.remove('active');});
  var first=document.querySelector('.qpill');if(first)first.classList.add('active');curDate=new Date(curDate.getFullYear(),curDate.getMonth()+dir,1);selDay=null;_qFilterMode='all';var pills=document.querySelectorAll('.qpill');if(pills.length){pills.forEach(function(p){p.classList.remove('active');});pills[0].classList.add('active');}updateHeader();renderAll();}
function updateHeader(){
  document.getElementById('monthLabel').textContent=curDate.toLocaleString('default',{month:'short',year:'numeric'});
  var now=new Date();
  var isCurrentMonth=curDate.getFullYear()===now.getFullYear()&&curDate.getMonth()===now.getMonth();
  var btn=document.getElementById('todayNavBtn');
  if(btn)btn.style.display=isCurrentMonth?'none':'block';
}
function jumpToToday(){curDate=new Date();selDay=null;updateHeader();renderAll();}
function switchTab(n){
  document.querySelectorAll('.tab').forEach(function(t){t.classList.toggle('active',t.dataset.tab===n);});
  document.querySelectorAll('.tab-content').forEach(function(c){c.classList.toggle('active',c.id==='tab-'+n);});
  if(n==='history'){renderHistory();updateCharts();}if(n==='calendar')renderCalendar();if(n==='goals')renderGoals();if(n==='invest')renderInvestments();if(n==='networth')renderNetWorth();if(n==='lent')renderLent();if(n==='analyse')initAnalyse();
}
function initAnalyse(){
  /* populate month dropdown */
  var sel=document.getElementById('an-month');
  sel.innerHTML='';
  var months=[];var seen={};
  D.expenses.forEach(function(e){if(!seen[e.month]){seen[e.month]=true;months.push(e.month);}});
  /* also add current month */
  var cm=mk();if(!seen[cm]){months.push(cm);}
  months.sort().reverse();
  months.forEach(function(m){
    var p=m.split('-'),d=new Date(parseInt(p[0]),parseInt(p[1])-1,1);
    var opt=document.createElement('option');opt.value=m;opt.textContent=d.toLocaleString('default',{month:'long',year:'numeric'});
    if(m===cm)opt.selected=true;
    sel.appendChild(opt);
  });
  /* populate account dropdown */
  var accSel=document.getElementById('an-acc');
  accSel.innerHTML='<option value="">All accounts</option>';
  D.accounts.forEach(function(a){var o=document.createElement('option');o.value=a.id;o.textContent=a.name;accSel.appendChild(o);});
  renderAnalyse();
}
function renderAnalyse(){
  var selMonth=document.getElementById('an-month').value||mk();
  var selCat=document.getElementById('an-cat').value;
  var selAcc=document.getElementById('an-acc').value;
  var selSearch=(document.getElementById('an-search').value||'').toLowerCase().trim();
  var p=selMonth.split('-'),anDate=new Date(parseInt(p[0]),parseInt(p[1])-1,1);
  var prevDate=new Date(anDate.getFullYear(),anDate.getMonth()-1,1);
  /* filter expenses */
  var exps=D.expenses.filter(function(e){
    if(e.month!==selMonth)return false;
    if(selCat&&e.cat!==selCat)return false;
    if(selAcc&&e.accountId!==selAcc)return false;
    if(selSearch&&e.name.toLowerCase().indexOf(selSearch)<0&&e.cat.toLowerCase().indexOf(selSearch)<0&&(!e.note||e.note.toLowerCase().indexOf(selSearch)<0))return false;
    return true;
  });
  var prevExps=D.expenses.filter(function(e){return e.month===mk(prevDate)&&(!selCat||e.cat===selCat)&&(!selAcc||e.accountId===selAcc);});
  var total=exps.reduce(function(s,e){return s+e.amt;},0);
  var prevTotal=prevExps.reduce(function(s,e){return s+e.amt;},0);
  var dim=new Date(anDate.getFullYear(),anDate.getMonth()+1,0).getDate();
  var now=new Date(),isCur=now.getFullYear()===anDate.getFullYear()&&now.getMonth()===anDate.getMonth();
  var daysEl=isCur?now.getDate():dim;
  var avg=daysEl>0?total/daysEl:0;
  var cats={};exps.forEach(function(e){cats[e.cat]=(cats[e.cat]||0)+e.amt;});
  var topCat=Object.keys(cats).sort(function(a,b){return cats[b]-cats[a];})[0]||'—';
  var topCatPct=total>0?Math.round((cats[topCat]||0)/total*100):0;
  var CC2={Food:'#1D9E75',Transport:'#378ADD',Shopping:'#D4537E',Health:'#7F77DD',Entertainment:'#EF9F27',Utilities:'#3B6D11',Education:'#534AB7',Other:'#888780'};
  /* no-spend streak */
  var nsStreak=0,nsToday=new Date();
  for(var nsi=1;nsi<=60;nsi++){var nsd=new Date(nsToday.getFullYear(),nsToday.getMonth(),nsToday.getDate()-nsi);var nsKey=nsd.getFullYear()+'-'+String(nsd.getMonth()+1).padStart(2,'0')+'-'+String(nsd.getDate()).padStart(2,'0');var nsM=nsd.getFullYear()+'-'+String(nsd.getMonth()+1).padStart(2,'0');var hasE=D.expenses.some(function(e){return e.month===nsM&&e.date&&e.date.slice(0,10)===nsKey;});if(!hasE)nsStreak++;else break;}
  var nsMetric=nsStreak>=2?'<div class="metric"><div class="mlabel">No-spend streak</div><div class="mval green" style="font-size:14px">🎯 '+nsStreak+' days</div></div>':'';
  /* metrics */
  document.getElementById('an-metrics').innerHTML=
    '<div class="metric"><div class="mlabel">Total spent</div><div class="mval red">'+fmt(total)+'</div></div>'+
    '<div class="metric"><div class="mlabel">Avg / day</div><div class="mval">'+fmt(Math.round(avg))+'</div></div>'+
    '<div class="metric"><div class="mlabel">Transactions</div><div class="mval blue">'+exps.length+'</div></div>'+
    '<div class="metric"><div class="mlabel">Top category</div><div class="mval" style="font-size:14px;color:var(--green)">'+topCat+' '+topCatPct+'%</div></div>'+nsMetric;
  /* category breakdown */
  var sortedCats=Object.keys(cats).sort(function(a,b){return cats[b]-cats[a];});
  document.getElementById('an-cats').innerHTML=sortedCats.length?sortedCats.map(function(k){
    var pct=total>0?Math.round(cats[k]/total*100):0;
    var c=CC2[k]||'#888780';
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">'+
      '<span style="font-size:13px;width:90px;flex-shrink:0">'+k+'</span>'+
      '<div style="flex:1;height:7px;background:var(--sur2);border-radius:99px;overflow:hidden"><div style="width:'+pct+'%;height:100%;border-radius:99px;background:'+c+'"></div></div>'+
      '<span style="font-size:13px;font-weight:500;width:65px;text-align:right">'+fmt(Math.round(cats[k]))+'</span>'+
      '<span style="font-size:11px;color:var(--tx3);width:30px;text-align:right">'+pct+'%</span>'+
    '</div>';
  }).join(''):'<p class="empty">No expenses.</p>';
  /* day by day */
  var groups={};
  exps.forEach(function(e){var d=new Date(e.date).getDate();if(!groups[d])groups[d]=[];groups[d].push(e);});
  var dayNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var dayHtml='';
  for(var di=1;di<=dim;di++){
    var items=groups[di];if(!items)continue;
    var dayAmt=items.reduce(function(s,e){return s+e.amt;},0);
    var dd=new Date(anDate.getFullYear(),anDate.getMonth(),di);
    var expsStr=items.sort(function(a,b){return new Date(a.date)-new Date(b.date);}).map(function(e){return e.name+' '+fmt(e.amt);}).join(' · ');
    dayHtml+='<div style="display:grid;grid-template-columns:90px 1fr auto;gap:8px;padding:9px 0;border-bottom:1px solid var(--bdr);align-items:start">'+
      '<div><div style="font-size:13px;font-weight:500">'+di+' '+dd.toLocaleString('default',{month:'short'})+'</div><div style="font-size:11px;color:var(--tx3)">'+dayNames[dd.getDay()]+'</div></div>'+
      '<div style="font-size:12px;color:var(--tx2)">'+expsStr+'</div>'+
      '<div style="font-size:14px;font-weight:500;color:var(--red);white-space:nowrap">'+fmt(Math.round(dayAmt))+'</div>'+
    '</div>';
  }
  document.getElementById('an-days').innerHTML=dayHtml||'<p class="empty">No expenses.</p>';
  /* daily limit */
  var dlimit=D.config.dailyLimit||0;
  var dlCard=document.getElementById('an-dl-card');
  if(dlimit>0){
    dlCard.style.display='block';
    document.getElementById('an-dl-title').textContent='Daily limit — '+fmt(dlimit)+'/day';
    var okDays=0,overDays=0,noSpendDays=0;
    var dlHtml='';
    for(var dli=1;dli<=dim;dli++){
      var dlItems=groups[dli]||[];
      var dlAmt=dlItems.reduce(function(s,e){return s+e.amt;},0);
      if(dlAmt===0){noSpendDays++;continue;}
      var dlPct=Math.min(100,Math.round(dlAmt/dlimit*100));
      var dlColor=dlAmt>dlimit?'var(--red)':dlAmt/dlimit>=0.85?'var(--amber)':'var(--green)';
      var dlStatus=dlAmt>dlimit?'over':'ok';
      if(dlStatus==='over')overDays++;else okDays++;
      var dlDd=new Date(anDate.getFullYear(),anDate.getMonth(),dli);
      dlHtml+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
        '<span style="font-size:12px;width:70px;flex-shrink:0">'+dli+' '+dayNames[dlDd.getDay()]+'</span>'+
        '<div style="flex:1;height:6px;background:var(--sur2);border-radius:99px;overflow:hidden"><div style="width:'+dlPct+'%;height:100%;border-radius:99px;background:'+dlColor+'"></div></div>'+
        '<span style="font-size:12px;width:90px;text-align:right;color:'+dlColor+'">'+fmt(Math.round(dlAmt))+(dlAmt>dlimit?' ↑':'')+' </span>'+
      '</div>';
    }
    dlHtml+='<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--bdr);display:flex;gap:16px;font-size:12px">'+
      '<span style="color:var(--green)">✓ Within: '+okDays+' days</span>'+
      '<span style="color:var(--red)">✗ Over: '+overDays+' days</span>'+
      '<span style="color:var(--tx3)">— No spend: '+noSpendDays+' days</span></div>';
    document.getElementById('an-dl').innerHTML=dlHtml;
  } else dlCard.style.display='none';
  /* vs previous */
  var diff=total-prevTotal;
  var diffColor=diff<=0?'var(--green)':'var(--red)';
  var diffSign=diff>0?'+':'';
  document.getElementById('an-vs').innerHTML=
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">'+
    '<div style="background:var(--sur2);border-radius:10px;padding:10px 12px"><div style="font-size:10px;color:var(--tx3);text-transform:uppercase;margin-bottom:4px">This month</div><div style="font-family:monospace;font-size:16px;font-weight:500">'+fmt(Math.round(total))+'</div></div>'+
    '<div style="background:var(--sur2);border-radius:10px;padding:10px 12px"><div style="font-size:10px;color:var(--tx3);text-transform:uppercase;margin-bottom:4px">Last month</div><div style="font-family:monospace;font-size:16px;font-weight:500;color:var(--tx2)">'+fmt(Math.round(prevTotal))+'</div></div>'+
    '<div style="background:var(--sur2);border-radius:10px;padding:10px 12px"><div style="font-size:10px;color:var(--tx3);text-transform:uppercase;margin-bottom:4px">Difference</div><div style="font-family:monospace;font-size:16px;font-weight:500;color:'+diffColor+'">'+diffSign+fmt(Math.round(Math.abs(diff)))+(diff>0?' ↑':' ↓')+'</div></div>'+
    '</div>';
  /* top 5 */
  var sorted=exps.slice().sort(function(a,b){return b.amt-a.amt;}).slice(0,5);
  document.getElementById('an-top').innerHTML=sorted.length?sorted.map(function(e){
    var acc=D.accounts.find(function(a){return a.id===e.accountId;});
    var c=CC2[e.cat]||'#888780';
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--bdr)">'+
      '<div><span style="font-size:13px">'+e.name+'</span>'+
      '<span style="font-size:11px;padding:2px 7px;border-radius:99px;background:'+c+'22;color:'+c+';margin-left:6px">'+e.cat+'</span>'+
      (acc?'<span style="font-size:11px;color:var(--tx3);margin-left:4px">'+acc.name+'</span>':'')+
      '</div><span style="font-size:14px;font-weight:500">'+fmt(e.amt)+'</span></div>';
  }).join(''):'<p class="empty">No expenses.</p>';
}
function toggleForm(id){var el=document.getElementById(id);el.style.display=el.style.display==='none'?'block':'none';}
