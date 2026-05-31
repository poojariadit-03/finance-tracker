/* ═══ RECALC ═══ */
function recalc(){
  var baseIncome=D.config.income||0,extraInc=extraIncomeTotal(),income=baseIncome,totalIncome=baseIncome+extraInc,fxd=fixedMonthly(),spent=getExpenses().reduce(function(s,e){return s+e.amt;},0);
  var savT=totalIncome*(D.config.savpct||20)/100,savA=Math.max(0,totalIncome-fxd-spent),bal=totalIncome-fxd-spent;
  document.getElementById('s-income').textContent=fmt(income);
  var extraBox=document.getElementById('s-extra-box'),extraEl=document.getElementById('s-extra');
  if(extraInc>0){extraBox.style.display='block';extraEl.textContent='+'+fmt(extraInc);}else extraBox.style.display='none';
  var spPct=totalIncome>0?(fxd+spent)/totalIncome*100:0,spBan=document.getElementById('spendBanner');
  if(income>0&&spPct>=100){spBan.style.display='flex';document.getElementById('spendBannerText').textContent='🚨 Exceeded income! Spent '+fmt(fxd+spent)+' of '+fmt(totalIncome);}
  else if(income>0&&spPct>=80){spBan.style.display='flex';document.getElementById('spendBannerText').textContent='⚠️ '+spPct.toFixed(0)+'% of income spent — only '+fmt(totalIncome-fxd-spent)+' left!';}
  else spBan.style.display='none';
  renderExtraIncome();checkSavingsStreak();
  document.getElementById('s-fixed').textContent=fmt(fxd);
  var _hasNonMon=D.fixed.some(function(f){return f.freq!=='Monthly';});
  var _estLbl=document.getElementById('fixedEstLabel');if(_estLbl)_estLbl.textContent=_hasNonMon?'(est.)':'';
  document.getElementById('s-daily').textContent=fmt(spent);
  document.getElementById('s-savings').textContent=fmt(savA);
  var bEl=document.getElementById('s-balance');bEl.textContent=fmt(bal);bEl.className='mval '+(bal>=0?'green':'red');
  var _td=new Date(),_tdSpent=D.expenses.filter(function(e){var d=new Date(e.date);return d.getFullYear()===_td.getFullYear()&&d.getMonth()===_td.getMonth()&&d.getDate()===_td.getDate();}).reduce(function(s,e){return s+e.amt;},0);
  var tdEl=document.getElementById('s-today-spent'),tdBox=document.getElementById('s-today-box');
  if(tdEl){tdEl.textContent=fmt(_tdSpent);tdEl.className='mval '+(D.config.dailyLimit&&_tdSpent>D.config.dailyLimit?'red':'');}
  var _isCM=_td.getFullYear()===curDate.getFullYear()&&_td.getMonth()===curDate.getMonth();
  if(tdBox)tdBox.style.display=_isCM?'':'none';
  var pct=savT>0?Math.min(100,savA/savT*100):0;
  document.getElementById('savProg').textContent=fmtF(savA)+' / '+fmtF(savT);
  var bar=document.getElementById('savBar');bar.style.width=pct.toFixed(1)+'%';bar.style.background=pct>=100?'var(--green)':pct>=60?'var(--amber)':'var(--red)';
  var rows=[{l:'Fixed expenses',v:fxd,p:totalIncome>0?fxd/totalIncome*100:0,c:'var(--red)'},{l:'Daily spending',v:spent,p:totalIncome>0?spent/totalIncome*100:0,c:'#D4537E'},{l:'Savings',v:savA,p:totalIncome>0?savA/totalIncome*100:0,c:'var(--green)'}];
  document.getElementById('budgetHealth').innerHTML=rows.map(function(r){return '<div class="hrow"><div class="hlabel"><span>'+r.l+'</span><span style="font-family:\'DM Mono\',monospace;font-weight:500">'+fmt(r.v)+' <span style="color:'+(r.p>=80?'var(--red)':r.p>=50?'var(--amber)':'var(--green)')+'">('+r.p.toFixed(1)+'%)</span></span></div><div class="pbg"><div class="pfill" style="width:'+Math.min(100,r.p).toFixed(1)+'%;background:'+r.c+'"></div></div></div>';}).join('');
  renderDailyLimit();
  renderHealthScore();
  renderMonthlySummary();
  if(document.getElementById('nwSnapshotBody'))renderNWSnapshot();
  var ecb=document.getElementById('expCountBadge');if(ecb){var ec=getExpenses().length;ecb.textContent=ec>0?'('+ec+')':'';}  
}

/* ═══ MONTHLY SUMMARY ═══ */
function renderMonthlySummary(){
  var income=(D.config.income||0)+extraIncomeTotal(),fxd=fixedMonthly(),exps=getExpenses();
  var spent=exps.reduce(function(s,e){return s+e.amt;},0),savA=Math.max(0,income-fxd-spent),savT=income*(D.config.savpct||20)/100;
  var lastDate=new Date(curDate.getFullYear(),curDate.getMonth()-1,1),lastSpent=getExpenses(lastDate).reduce(function(s,e){return s+e.amt;},0),lastIncome=(D.config.income||0)+extraIncomeTotal(lastDate),lastSavA=Math.max(0,lastIncome-fxd-lastSpent);
  var cats={};exps.forEach(function(e){cats[e.cat]=(cats[e.cat]||0)+e.amt;});
  var sorted=Object.keys(cats).sort(function(a,b){return cats[b]-cats[a];}).slice(0,4);
  var now=new Date(),dim=new Date(curDate.getFullYear(),curDate.getMonth()+1,0).getDate();
  var isCur=now.getFullYear()===curDate.getFullYear()&&now.getMonth()===curDate.getMonth();
  var daysEl=isCur?now.getDate():dim,dailyAvg=daysEl>0?spent/daysEl:0;
  var mgs=0;D.goals.forEach(function(g){mgs+=(g.contributions||[]).filter(function(c){return c.month===mk();}).reduce(function(s,c){return s+c.amount;},0);});
  var h='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:16px">';
  function box(l,v,s,c){return '<div style="background:var(--sur2);border-radius:10px;padding:.75rem 1rem"><div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--tx3);margin-bottom:4px">'+l+'</div><div style="font-family:\'DM Mono\',monospace;font-size:16px;font-weight:500;color:'+c+'">'+v+'</div>'+(s?'<div style="font-size:11px;color:var(--tx3);margin-top:2px">'+s+'</div>':'')+' </div>';}
  h+=box('Expenses',fmt(spent),'this month',spent>income*0.6?'var(--red)':'var(--tx)');
  h+=box('Saved',fmt(savA),savA>=savT?'Goal met!':'Goal: '+fmt(savT),savA>=savT?'var(--green)':'var(--amber)');
  h+=box('Daily avg',fmt(Math.round(dailyAvg)),daysEl+' days so far','var(--blue)');
  if(isCur){
    var daysLeft=dim-daysEl;
    var remBudget=Math.max(0,income-fxd-spent);
    var safeDaily=daysLeft>0?Math.round(remBudget/daysLeft):0;
    h+=box('Days left',String(daysLeft)+'d',daysLeft>0?fmt(safeDaily)+'/day safe':'End of month','var(--tx)');
  }
  if(isCur){
    h+=box('Projected',fmt(Math.round(dailyAvg*dim)),'full month',dailyAvg*dim>income*0.7?'var(--red)':'var(--tx)');
    var projSav=Math.max(0,income-fxd-Math.round(dailyAvg*dim));
    h+=box('Proj. savings',fmt(projSav),'if pace holds',projSav>=savT?'var(--green)':'var(--amber)');
  }
  if(mgs>0)h+=box('Goals funded',fmt(mgs),'this month','var(--purple)');
  h+='</div>';
  if(sorted.length){h+='<div style="margin-bottom:16px"><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--tx3);margin-bottom:8px">Where your money went</div>';sorted.forEach(function(k){var p=spent>0?Math.min(100,cats[k]/spent*100):0,c=getCatColor(k);h+='<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:3px"><span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:'+c+';display:inline-block"></span>'+k+'</span><span style="font-family:\'DM Mono\',monospace;font-weight:500">'+fmt(cats[k])+'<span style="color:var(--tx3);font-size:11px"> '+p.toFixed(0)+'%</span></span></div><div class="pbg"><div class="pfill" style="width:'+p.toFixed(1)+'%;background:'+c+'"></div></div></div>';});h+='</div>';}
  /* Most frequent merchant */
  var nameCount={};exps.forEach(function(e){nameCount[e.name]=(nameCount[e.name]||0)+1;});
  var topNames=Object.keys(nameCount).filter(function(n){return nameCount[n]>1;}).sort(function(a,b){return nameCount[b]-nameCount[a];});
  if(topNames.length){
    var tn=topNames[0],tc2=exps.filter(function(e){return e.name===tn;}).reduce(function(s,e){return s+e.amt;},0);
    h+='<div style="background:var(--sur2);border-radius:10px;padding:.75rem 1rem;margin-bottom:12px">';
    h+='<div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--tx3);margin-bottom:6px">Most frequent</div>';
    h+='<div style="display:flex;justify-content:space-between"><span style="font-size:13px;font-weight:500">'+tn+'</span><span style="font-family:monospace;font-size:13px">'+fmt(tc2)+'<span style="color:var(--tx3)"> x'+nameCount[tn]+'</span></span></div></div>';
  }
  function vb(cur,prev,gd){var diff=cur-prev,sg=diff>0?'+':'',col=diff===0?'var(--tx3)':((diff<0)===gd?'var(--green)':'var(--red)');return '<span style="font-family:\'DM Mono\',monospace;color:'+col+';font-size:12px">'+(diff!==0?sg:'')+fmt(diff)+'</span>';}
  h+='<div style="background:var(--sur2);border-radius:10px;padding:.75rem 1rem"><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--tx3);margin-bottom:8px">vs last month</div><div style="display:flex;flex-wrap:wrap;gap:16px"><div><div style="font-size:12px;color:var(--tx2);margin-bottom:2px">Expenses</div>'+vb(spent,lastSpent,true)+'</div><div><div style="font-size:12px;color:var(--tx2);margin-bottom:2px">Savings</div>'+vb(savA,lastSavA,false)+'</div>'+(lastSpent>0?'<div><div style="font-size:12px;color:var(--tx2);margin-bottom:2px">Change</div><span style="font-family:\'DM Mono\',monospace;color:'+(spent<=lastSpent?'var(--green)':'var(--red)')+';font-size:12px">'+(spent>lastSpent?'+':'')+((spent-lastSpent)/lastSpent*100).toFixed(1)+'%</span></div>':'')+'</div></div>';
  document.getElementById('monthlySummary').innerHTML=h;
  document.getElementById('sumTitle').textContent=curDate.toLocaleString('default',{month:'long',year:'numeric'})+' — Summary';
}
