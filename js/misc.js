/* ═══ FINANCIAL HEALTH SCORE ═══ */
function calcHealthScore(){
  var score=0, factors=[];
  var income=(D.config.income||0)+extraIncomeTotal();
  var fxd=fixedMonthly();
  var spent=getExpenses().reduce(function(s,e){return s+e.amt;},0);
  var savT=income*(D.config.savpct||20)/100;
  var savA=Math.max(0,income-fxd-spent);

  /* 1. Savings rate (25pts) */
  var savPts=0;
  if(income>0&&savT>0){
    savPts=Math.round(Math.min(25, savA/savT*25));
  } else if(income===0){ savPts=12; } /* no income set, neutral */
  score+=savPts;
  factors.push({label:'Savings rate',pts:savPts,max:25,tip:income>0?(savA>=savT?'Meeting savings goal':'Saved '+fmt(savA)+' of '+fmt(savT)+' goal'):'Set income to track'});

  /* 2. Budget control (20pts) */
  var budgets=D.budgets,budgetCats=Object.keys(budgets);
  var budgetPts=20;
  if(budgetCats.length>0){
    var catSpend={};getExpenses().forEach(function(e){catSpend[e.cat]=(catSpend[e.cat]||0)+e.amt;});
    var overCount=budgetCats.filter(function(c){return (catSpend[c]||0)>budgets[c];}).length;
    var nearCount=budgetCats.filter(function(c){var u=catSpend[c]||0;return u<=budgets[c]&&u/budgets[c]>=0.85;}).length;
    budgetPts=Math.max(0, 20 - overCount*8 - nearCount*3);
  }
  score+=budgetPts;
  var overCats=budgetCats.filter(function(c){var s={}; getExpenses().forEach(function(e){s[e.cat]=(s[e.cat]||0)+e.amt;}); return (s[c]||0)>budgets[c];});
  factors.push({label:'Budget control',pts:budgetPts,max:20,tip:budgetCats.length===0?'No budgets set':(overCats.length?overCats.length+' categor'+(overCats.length>1?'ies':'y')+' over limit':'All categories within budget')});

  /* 3. Bills paid on time (15pts) */
  var recurring=D.fixed.filter(function(f){return f.recurring;});
  var paid=getPaid();
  var billPts=15;
  if(recurring.length>0){
    var paidCount=recurring.filter(function(f){return paid.indexOf(f.id)>-1;}).length;
    billPts=Math.round(paidCount/recurring.length*15);
  }
  score+=billPts;
  factors.push({label:'Bills paid',pts:billPts,max:15,tip:recurring.length===0?'No recurring bills':(billPts===15?'All bills marked paid':paid.length+'/'+recurring.length+' paid this month')});

  /* 4. Lent money (10pts) */
  var lent=D.lent||[];
  var overdueLent=lent.filter(function(l){
    if(l.returned||!l.returnBy)return false;
    return new Date(l.returnBy)<new Date();
  });
  var lentPts=Math.max(0, 10 - overdueLent.length*5);
  score+=lentPts;
  factors.push({label:'Lent money',pts:lentPts,max:10,tip:overdueLent.length===0?'No overdue lent amounts':overdueLent.length+' overdue return'+(overdueLent.length>1?'s':'')});

  /* 5. Net worth positive (15pts) */
  var accs=D.accounts;
  var accTotal=accs.reduce(function(s,a){
    var sp=D.expenses.filter(function(e){return e.accountId===a.id;}).reduce(function(t,e){return t+e.amt;},0);
    var inc=(D.extraIncome||[]).filter(function(e){return e.accountId===a.id;}).reduce(function(t,e){return t+e.amt;},0);
    return s+(a.openingBalance+inc-sp);
  },0);
  var fdTotal=(D.fds||[]).reduce(function(s,fd){return s+calcFD(fd.amt,fd.rate,Math.min(mElapsed(fd.start),fd.tenure));},0);
  var rdTotal=(D.rds||[]).reduce(function(s,rd){var el=Math.min(mElapsed(rd.start),rd.tenure);return s+(el>0?calcRD(rd.amt,rd.rate,el):0);},0);
  var goalTotal=(D.goals||[]).reduce(function(s,g){return s+(g.contributions||[]).reduce(function(t,c){return t+c.amount;},0);},0);
  var pendingLent=lent.filter(function(l){return !l.returned;}).reduce(function(s,l){return s+l.amt;},0);
  var totalAssets=accTotal+fdTotal+rdTotal+goalTotal+pendingLent;
  var totalLiab=(D.liabilities||[]).reduce(function(s,l){return s+l.amt;},0);
  var netWorth=totalAssets-totalLiab;
  var nwPts=netWorth>=0?15:Math.max(0,15+Math.round(netWorth/10000));
  score+=nwPts;
  factors.push({label:'Net worth',pts:nwPts,max:15,tip:netWorth>=0?'Net worth: '+fmt(netWorth):'Liabilities exceed assets by '+fmt(Math.abs(netWorth))});

  /* 6. Daily limit (15pts) */
  var limitPts=15;
  var dailyLimit=D.config.dailyLimit||0;
  if(dailyLimit>0){
    var today=new Date();
    var todaySpent=D.expenses.filter(function(e){
      var d=new Date(e.date);
      return d.getFullYear()===today.getFullYear()&&d.getMonth()===today.getMonth()&&d.getDate()===today.getDate();
    }).reduce(function(s,e){return s+e.amt;},0);
    var ratio=todaySpent/dailyLimit;
    limitPts=ratio<=1?15:Math.max(0,Math.round(15-(ratio-1)*15));
  }
  score+=limitPts;
  factors.push({label:'Daily limit',pts:limitPts,max:15,tip:dailyLimit===0?'No daily limit set':(limitPts===15?'Within daily limit':'Over daily limit today')});

  return {score:Math.min(100,score), factors:factors};
}

function getScoreGrade(score){
  if(score>=85)return {grade:'Excellent 🌟',color:'var(--green)'};
  if(score>=70)return {grade:'Good 👍',color:'#5DCAA5'};
  if(score>=55)return {grade:'Fair ⚡',color:'var(--amber)'};
  if(score>=40)return {grade:'Needs Work ⚠️',color:'#D4537E'};
  return {grade:'Critical 🔴',color:'var(--red)'};
}

function renderHealthScore(){
  var el=document.getElementById('healthScoreBody');if(!el)return;
  var result=calcHealthScore();
  var score=result.score, factors=result.factors;
  var g=getScoreGrade(score);
  var circumference=2*Math.PI*36; /* r=36 */
  var dashOffset=circumference*(1-score/100);
  var worstFactor=factors.slice().sort(function(a,b){return (a.pts/a.max)-(b.pts/b.max);})[0];
  var tips=factors.filter(function(f){return f.pts<f.max;}).map(function(f){return f.tip;}).slice(0,2);

  var html='<div class="score-ring-wrap">';
  html+='<div class="score-ring">';
  html+='<svg width="90" height="90" viewBox="0 0 90 90">';
  html+='<circle cx="45" cy="45" r="36" fill="none" stroke="var(--sur2)" stroke-width="8"/>';
  html+='<circle cx="45" cy="45" r="36" fill="none" stroke="'+g.color+'" stroke-width="8" stroke-linecap="round" stroke-dasharray="'+circumference.toFixed(1)+'" stroke-dashoffset="'+dashOffset.toFixed(1)+'"/>';
  html+='</svg>';
  html+='<div class="score-ring-num"><span class="score-num" style="color:'+g.color+'">'+score+'</span><span class="score-lbl">/ 100</span></div>';
  html+='</div>';
  html+='<div class="score-right">';
  html+='<div class="score-grade" style="color:'+g.color+'">'+g.grade+'</div>';
  if(tips.length){html+='<div class="score-tip">'+tips.join(' · ')+'</div>';}
  else{html+='<div class="score-tip" style="color:var(--green)">Everything looks great!</div>';}
  html+='</div></div>';

  html+='<div class="score-factors">';
  factors.forEach(function(f){
    var pct=Math.round(f.pts/f.max*100);
    var col=pct>=80?'var(--green)':pct>=50?'var(--amber)':'var(--red)';
    html+='<div class="sf-item"><div class="sf-bar-wrap"><div class="sf-label">'+f.label+'</div><div class="sf-bar"><div class="sf-fill" style="width:'+pct+'%;background:'+col+'"></div></div></div><span class="sf-pts" style="color:'+col+'">'+f.pts+'/'+f.max+'</span></div>';
  });
  html+='</div>';
  el.innerHTML=html;
}


/* ═══ HISTORY RANGE FILTER ═══ */
var _histRangeDays=0;
var _histRangeMonths=6;
var _rangeFrom=null,_rangeTo=null;

function syncSavPill(val){
  document.querySelectorAll('.hist-pill').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.hist-pill').forEach(function(p){
    if(p.textContent.trim()===val+' Months')p.classList.add('active');
  });
}

function setHistRange(val,btn){
  document.querySelectorAll('.hist-pill').forEach(function(p){p.classList.remove('active');});
  if(btn)btn.classList.add('active');
  if(val<=30){
    _histRangeDays=val;
    _histRangeMonths=0;
    renderHistoryDays(val);
    renderSavingsComparison();
  } else {
    _histRangeDays=0;
    _histRangeMonths=val;
    var sel=document.getElementById('savingsMonthRange');
    if(sel){
      var valid=['3','6','12'];
      sel.value=valid.indexOf(String(val))>-1?String(val):(val<=3?'3':val<=6?'6':'12');
    }
    renderHistory();
  }
}

function renderHistoryDays(days){
  var now=new Date();
  var from=new Date(now);from.setDate(now.getDate()-(days-1));from.setHours(0,0,0,0);

  var exps=D.expenses.filter(function(e){
    var d=new Date(e.date);return d>=from&&d<=now;
  });
  var extraInc=(D.extraIncome||[]).filter(function(e){
    var d=new Date(e.date);return d>=from&&d<=now;
  });

  var spent=exps.reduce(function(s,e){return s+e.amt;},0);
  var baseInc=D.config.income||0;
  var incTotal=extraInc.reduce(function(s,e){return s+e.amt;},0)+(baseInc/30*days);
  var fxd=fixedMonthly()/30*days;
  var sav=Math.max(0,incTotal-fxd-spent);

  /* Category breakdown */
  var cats={};exps.forEach(function(e){cats[e.cat]=(cats[e.cat]||0)+e.amt;});
  var sortedCats=Object.keys(cats).sort(function(a,b){return cats[b]-cats[a];});

  /* Daily spend map */
  var dailyMap={};
  exps.forEach(function(e){
    var dk=e.date.slice(0,10);
    dailyMap[dk]=(dailyMap[dk]||0)+e.amt;
  });
  var dailyKeys=Object.keys(dailyMap).sort();

  /* Rebuild chart with daily data */
  if(_hist){try{_hist.destroy();}catch(e){}_hist=null;}
  var dark=document.body.classList.contains('force-dark')||(!document.body.classList.contains('force-light')&&matchMedia('(prefers-color-scheme:dark)').matches);
  var gc=dark?'rgba(255,255,255,.05)':'rgba(0,0,0,.05)';
  _hist=new Chart(document.getElementById('histChart'),{
    type:'bar',
    data:{
      labels:dailyKeys.map(function(d){return new Date(d+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short'});}),
      datasets:[{label:'Spent',data:dailyKeys.map(function(k){return dailyMap[k];}),backgroundColor:'#D4537E',borderRadius:4}]
    },
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
      scales:{x:{grid:{display:false},ticks:{font:{size:10},maxRotation:45,autoSkip:dailyKeys.length>12}},
        y:{grid:{color:gc},ticks:{callback:function(v){return '\u20B9'+(v>=1000?(v/1000).toFixed(0)+'K':v);}}}}}
  });
  var legEl=document.getElementById('histLeg');
  if(legEl)legEl.innerHTML='<span class="legitem"><span class="legdot" style="background:#D4537E"></span>Daily spending — last '+days+' days</span>';

  /* Summary table */
  var fromStr=from.toLocaleDateString('en-IN',{day:'numeric',month:'short'});
  var toStr=now.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  var el=document.getElementById('histBody');
  if(!el)return;
  var rows='';
  rows+='<tr style="background:var(--sur2)"><td colspan="6" style="font-weight:600;padding:10px 8px">'+fromStr+' to '+toStr+' ('+days+' days)</td></tr>';
  rows+='<tr><td>Total Spent</td><td style="color:var(--red)">'+fmt(spent)+'</td><td>'+exps.length+' expenses</td><td>Avg/day: '+fmt(Math.round(spent/days))+'</td><td></td><td></td></tr>';
  rows+='<tr><td>Est. Savings</td><td style="color:var(--green)">'+fmt(Math.round(sav))+'</td><td></td><td></td><td></td><td></td></tr>';
  sortedCats.slice(0,5).forEach(function(c){
    var pct=spent>0?(cats[c]/spent*100).toFixed(0):0;
    rows+='<tr><td style="color:var(--tx3)">'+c+'</td><td>'+fmt(cats[c])+'</td><td style="color:var(--tx3)">'+pct+'% of spend</td><td></td><td></td><td></td></tr>';
  });
  el.innerHTML=rows;
}

/* ═══ ACCOUNT TRANSFERS ═══ */
function populateTransferSelects(){
  var accs=D.accounts,opts=accs.map(function(a){return '<option value="'+a.id+'">'+a.name+'</option>';}).join('');
  ['transferFrom','transferTo'].forEach(function(id){var el=document.getElementById(id);if(el)el.innerHTML=opts;});
  renderTransferList();
}
function addTransfer(){
  var fromId=document.getElementById('transferFrom').value;
  var toId=document.getElementById('transferTo').value;
  var amt=parseFloat(document.getElementById('transferAmt').value);
  var date=document.getElementById('transferDate').value||todayStr();
  if(!fromId||!toId){showToast('Select accounts','error');return;}
  if(fromId===toId){showToast('Cannot transfer to same account','error');return;}
  if(isNaN(amt)||amt<=0){showToast('Enter amount','error');return;}
  if(!D.transfers)D.transfers=[];
  D.transfers.push({id:Date.now().toString(),fromId:fromId,toId:toId,amt:amt,date:date});
  autoSave();
  document.getElementById('transferAmt').value='';
  document.getElementById('transferDate').value=todayStr();
  var fa=D.accounts.find(function(a){return a.id===fromId;}),ta=D.accounts.find(function(a){return a.id===toId;});
  showToast(fmt(amt)+' transferred '+(fa?fa.name:'')+'→'+(ta?ta.name:''),'success');
  renderAccounts();renderTransferList();
}
function renderTransferList(){
  var el=document.getElementById('transferList');if(!el)return;
  var _allTrans=(D.transfers||[]).slice().reverse();var _showAll=document.getElementById('showAllTransfers')&&document.getElementById('showAllTransfers').dataset.open==='1';var list=_showAll?_allTrans:_allTrans.slice(0,5);
  if(!list.length){el.innerHTML='';return;}
  var moreBtn=_allTrans.length>5&&!_showAll?'<button id="showAllTransfers" class="btn-ghost" style="width:100%;margin-top:8px;font-size:12px" onclick="this.dataset.open=1;renderTransferList()">Show all '+_allTrans.length+' transfers</button>':'';
  el.innerHTML='<div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--tx3);margin-bottom:6px">Transfers</div>'+
    list.map(function(t){
      var fa=D.accounts.find(function(a){return a.id===t.fromId;}),ta=D.accounts.find(function(a){return a.id===t.toId;});
      var d=new Date(t.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
      return '<div class="erow"><div class="eleft"><span style="font-size:13px;margin-right:6px">↔</span><div><div class="ename">'+(fa?fa.name:'?')+' → '+(ta?ta.name:'?')+'</div><div class="emeta">'+d+'</div></div></div><div class="eright"><span class="eamt" style="color:var(--blue)">'+fmt(t.amt)+'</span><button class="del-btn" onclick="deleteTransfer(this.dataset.id)" data-id="'+t.id+'">×</button></div></div>';
    }).join('')+moreBtn;
}
function deleteTransfer(id){
  D.transfers=(D.transfers||[]).filter(function(t){return t.id!==id;});
  autoSave();renderAccounts();renderTransferList();
}

/* ═══ EXPENSE TEMPLATES ═══ */
function saveTemplate(){
  var name=document.getElementById('expName').value.trim();
  var cat=document.getElementById('expCat').value;
  var amt=parseFloat(document.getElementById('expAmt').value)||0;
  var accId=document.getElementById('expAcc').value;
  var note=document.getElementById('expNote')?document.getElementById('expNote').value.trim():'';
  if(!name){showToast('Fill in expense name first','error');return;}
  if(!D.templates)D.templates=[];
  if((D.templates).find(function(t){return t.name===name&&t.cat===cat;})){showToast('Template already exists','error');return;}
  D.templates.push({id:Date.now().toString(),name:name,cat:cat,amt:amt,accId:accId,note:note});
  autoSave();renderTemplates();
  showToast('Template saved!','success');
}
function applyTemplate(id){
  var t=(D.templates||[]).find(function(t){return t.id===id;});if(!t)return;
  document.getElementById('expName').value=t.name;
  document.getElementById('expCat').value=t.cat;
  if(t.amt>0)document.getElementById('expAmt').value=t.amt;
  var ae=document.getElementById('expAcc');if(ae&&t.accId)ae.value=t.accId;
  var ne=document.getElementById('expNote');if(ne)ne.value=t.note||'';
  showToast('Template applied — adjust and click Add','success');
}
function deleteTemplate(id){
  D.templates=(D.templates||[]).filter(function(t){return t.id!==id;});
  autoSave();renderTemplates();
}
function renderTemplates(){
  var el=document.getElementById('templateList');if(!el)return;
  var tpls=D.templates||[];
  if(!tpls.length){el.innerHTML='<p class="empty">No templates. Fill in an expense and click "+ Save current".</p>';return;}
  el.innerHTML=tpls.map(function(t){
    return '<div class="erow"><div class="eleft"><div class="dot" style="background:'+getCatColor(t.cat)+'"></div><div><div class="ename">'+t.name+'</div><div class="emeta">'+t.cat+(t.amt?' · '+fmt(t.amt):'')+'</div></div></div><div class="eright"><button class="btn-ghost" style="padding:4px 10px;font-size:12px" onclick="applyTemplate(this.dataset.id)" data-id="'+t.id+'">Use</button><button class="del-btn" onclick="deleteTemplate(this.dataset.id)" data-id="'+t.id+'">×</button></div></div>';
  }).join('');
}

/* ═══ DUE DAY AUTO-PAY ═══ */
function checkDueDayAutoPay(){
  var today=new Date();
  var todayDate=today.getDate();
  var m=mk();
  if(!D.paid[m])D.paid[m]=[];
  var paid=D.paid[m];
  var autoPaidCount=0;
  D.fixed.forEach(function(f){
    if(!f.recurring||!f.dueDay||f.freq!=='Monthly')return;
    if(paid.indexOf(f.id)>-1)return;
    if(f.skippedMonths&&f.skippedMonths.indexOf(m)>-1)return;
    if(f.autoLog===false)return;
    if(todayDate!==f.dueDay)return;
    paid.push(f.id);
    var alreadyLogged=D.expenses.some(function(e){return e.month===m&&e.name===f.name&&e.amt===f.amt&&new Date(e.date).getDate()===todayDate;});
    if(!alreadyLogged){
      var parts=m.split('-');
      var ed=new Date(parseInt(parts[0]),parseInt(parts[1])-1,todayDate,12,0,0).toISOString();
      D.expenses.push({id:Date.now().toString()+'_dp_'+f.id,date:ed,month:m,name:f.name,cat:f.cat||'Utilities',amt:f.amt,accountId:f.accountId||(D.accounts.length?D.accounts[0].id:''),note:'Auto-paid on due date',tags:''});
    }
    autoPaidCount++;
  });
  if(autoPaidCount>0){D.paid[m]=paid;autoSave();renderFixed();renderExpenses();recalc();showToast(autoPaidCount+' fixed expense'+(autoPaidCount>1?'s':'')+' auto-paid today!','success');}
}

function initDefaults(){if(!D.accounts||!D.accounts.length)D.accounts=[{id:'cash',name:'Cash',type:'Cash',openingBalance:0},{id:'bank',name:'Bank Account',type:'Bank Account',openingBalance:0},{id:'upi',name:'UPI',type:'UPI',openingBalance:0}];}
function renderAll(){
  var income=D.config.income||0,pct=D.config.savpct||20;
  var incEl=document.getElementById('income');if(incEl&&income>0)incEl.value=income;
  document.getElementById('savSlider').value=pct;document.getElementById('pctOut').textContent=pct+'%';
  var dateEl=document.getElementById('expDate');if(dateEl)dateEl.value=todayStr();
  populateCatSelects();renderCustomCategories();renderTemplates();
  var bcb=document.getElementById('budgetCarryover');if(bcb)bcb.checked=!!(D.config&&D.config.budgetCarryover);
  renderAccounts();populateAccSel();populateTransferSelects();
  if(document.getElementById('fixedSummary'))renderFixedSummary();renderFixed();renderExpenses();renderGoals();recalc();checkReminders();renderBudgetBars();checkBudgetAlerts();renderWeeklySummary();autoLogFixed();
  renderIncSrcBtns();renderExtraIncome();checkSavingsStreak();checkMonthlyReset();checkAutoContribs();
  applyTheme(D.config.theme||'auto');applyFontSize(D.config.fontSize||'normal');updateLentBadge();renderLent();
  var incDt=document.getElementById('incDate');if(incDt)incDt.value=todayStr();
  if(D.config&&D.config.dailyLimit){var dli=document.getElementById('dailyLimitInput');if(dli)dli.value=D.config.dailyLimit;}
  var lentDt=document.getElementById('lentDate');if(lentDt)lentDt.value=todayStr();
  var lentRetDt=document.getElementById('lentReturnBy');  /* ensure return-by stays blank */
  checkDueDayAutoPay();
}

/* ═══ CATEGORY FILTER ═══ */
var _selCatFilter=null;
function filterByCat(cat){_selCatFilter=cat;renderCatFilterPills();renderExpenses();}
function toggleCatFilter(){
  var wrap=document.getElementById('catFilterWrap');
  if(!wrap)return;
  var isOpen=wrap.style.display!=='none';
  wrap.style.display=isOpen?'none':'block';
  if(!isOpen)renderCatFilterPills();
}
function renderCatFilterPills(){
  var el=document.getElementById('catFilterPills');if(!el)return;
  var cats={};getExpenses().forEach(function(e){cats[e.cat]=(cats[e.cat]||0)+e.amt;});
  var sortedCats=Object.keys(cats).sort(function(a,b){return cats[b]-cats[a];});
  var html='<button class="qpill'+(!_selCatFilter?' active':'')+'" onclick="_selCatFilter=null;renderCatFilterPills();renderExpenses()">All cats</button>';
  sortedCats.forEach(function(c){html+='<button class="qpill'+(_selCatFilter===c?' active':'')+'" data-cat="'+c+'" onclick="filterByCat(this.dataset.cat)" style="border-left:3px solid '+getCatColor(c)+'">'+c+' '+fmt(cats[c])+'</button>';});
  el.innerHTML=html;
}

/* ═══ EXPENSE ANALYTICS STRIP ═══ */

function applyDateRange(){
  _rangeFrom=document.getElementById('rangeFrom').value||null;
  _rangeTo=document.getElementById('rangeTo').value||null;
  if(!_rangeFrom&&!_rangeTo){clearDateRange();return;}
  renderExpensesRange();
}
function clearDateRange(){
  _rangeFrom=null;_rangeTo=null;
  var rf=document.getElementById('rangeFrom');if(rf)rf.value='';
  var rt=document.getElementById('rangeTo');if(rt)rt.value='';
  var rr=document.getElementById('rangeResult');if(rr)rr.style.display='none';
  renderExpenses();
}
function renderExpensesRange(){
  if(!_rangeFrom&&!_rangeTo){clearDateRange();return;}
  var from=_rangeFrom?new Date(_rangeFrom+'T00:00:00'):null;
  var to=_rangeTo?new Date(_rangeTo+'T23:59:59'):null;
  var all=D.expenses.filter(function(e){var d=new Date(e.date);if(from&&d<from)return false;if(to&&d>to)return false;return true;});
  var q=document.getElementById('expSearch')?document.getElementById('expSearch').value.trim().toLowerCase():'';
  if(q)all=all.filter(function(e){return e.name.toLowerCase().indexOf(q)>-1||e.cat.toLowerCase().indexOf(q)>-1||(e.note&&e.note.toLowerCase().indexOf(q)>-1)||(e.tags&&e.tags.toLowerCase().indexOf(q)>-1);});
  /* Category filter in range view */
  if(_selCatFilter)all=all.filter(function(e){return e.cat===_selCatFilter;});
  all.sort(function(a,b){return new Date(b.date)-new Date(a.date);});
  renderExpenseAnalytics(all);
  var total=all.reduce(function(s,e){return s+e.amt;},0);
  var cats={};all.forEach(function(e){cats[e.cat]=(cats[e.cat]||0)+e.amt;});
  var topCat=Object.keys(cats).sort(function(a,b){return cats[b]-cats[a];})[0]||'--';
  var uDays=new Set(all.map(function(e){return e.date.slice(0,10);})).size;
  var resEl=document.getElementById('rangeResult');
  if(resEl){resEl.style.display='block';resEl.innerHTML='<span class="range-stat">'+all.length+' expenses</span><span class="range-stat">Total: <strong>'+fmt(total)+'</strong></span><span class="range-stat">Avg/day: <strong>'+fmt(uDays>0?Math.round(total/uDays):0)+'</strong></span><span class="range-stat">Top: <strong>'+topCat+'</strong></span>';}
  var accs=D.accounts,el=document.getElementById('expList');
  if(!all.length){if(el)el.innerHTML='<p class="empty">No expenses in this date range.</p>';renderBudgetBars();checkBudgetAlerts();return;}
  if(el)el.innerHTML=all.map(function(e){
    var c=getCatColor(e.cat),d=new Date(e.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
    var acc=accs.find(function(a){return a.id===e.accountId;});
    var id=e.id;
    var tagHtml='';if(e.tags){e.tags.split(' ').filter(Boolean).forEach(function(t){tagHtml+='<span style="display:inline-block;background:var(--bbg,#E6F1FB);color:var(--blue);font-size:9px;font-weight:600;padding:1px 6px;border-radius:99px;margin-left:3px">'+t+'</span>';});}
    var noteHtml=e.note?'<div style="font-size:11px;color:var(--tx3);font-style:italic">'+e.note+'</div>':'';
    var row='<div class="erow"><input type="checkbox" class="exp-check" onclick="toggleBulkSelect(\''+e.id+'\',this)" style="margin-right:4px"><div class="eleft"><div class="dot" style="background:'+c+'"></div><div style="min-width:0"><div class="ename">'+e.name+tagHtml+'</div><div class="emeta">'+d+' - '+e.cat+(acc?' - '+acc.name:'')+'</div>'+noteHtml+'</div></div><div class="eright"><span class="eamt">'+fmt(e.amt)+'</span>';
    row+='<button class="edit-btn" onclick="openEdit(this.dataset.id)" data-id="'+id+'">Edit</button>';
    if(e.tags&&e.tags.indexOf('reimbursable')>-1&&e.tags.indexOf('reimbursed')<0)row+='<button class="btn-ghost" style="padding:2px 6px;font-size:10px;color:var(--green)" onclick="markReimbursed(this.dataset.id)" data-id="'+id+'" title="Mark reimbursed">💸 Got paid</button>';
    row+='<button class="del-btn" onclick="removeExpense(this.dataset.id)" data-id="'+id+'">x</button>';
    row+='</div></div>';
    return row;
  }).join('');
  renderBudgetBars();checkBudgetAlerts();
}

/* ═══ SAVINGS COMPARISON ═══ */
function renderSavingsComparison(){
  var el=document.getElementById('savingsComparisonBody');if(!el)return;
  var nEl=document.getElementById('savingsMonthRange');
  var n=nEl?parseInt(nEl.value):6;
  var fxd=fixedMonthly(),savGoalPct=(D.config.savpct||20)/100;
  var months=[];for(var i=n-1;i>=0;i--)months.push(new Date(curDate.getFullYear(),curDate.getMonth()-i,1));
  var data=months.map(function(d){var spent=getExpenses(d).reduce(function(s,e){return s+e.amt;},0);var mI=(D.config.income||0)+extraIncomeTotal(d);var sav=Math.max(0,mI-fxd-spent);var savG=mI*savGoalPct;return{label:d.toLocaleString('default',{month:'short'})+'|'+d.getFullYear().toString().slice(2),savAmt:sav,savGoal:savG,savRate:mI>0?sav/mI*100:0,income:mI,metGoal:sav>=savG&&mI>0};});
  var maxSav=Math.max.apply(null,data.map(function(d){return Math.max(d.savAmt,d.savGoal,1);}));
  var best=data.slice().sort(function(a,b){return b.savAmt-a.savAmt;})[0];
  var posM=data.filter(function(d){return d.savAmt>0;});
  var avgSav=posM.length?posM.reduce(function(s,d){return s+d.savAmt;},0)/posM.length:0;
  var totalSav=data.reduce(function(s,d){return s+d.savAmt;},0);
  var metCount=data.filter(function(d){return d.metGoal;}).length;
  var bars=data.map(function(d){var h=Math.round(d.savAmt/maxSav*120),gH=Math.round(d.savGoal/maxSav*120);var col=d.metGoal?'var(--green)':d.savAmt>0?'var(--amber)':'var(--bdr)';var p=d.label.split('|');return '<div class="sav-bar-wrap"><div class="sav-bar-amt" style="color:'+col+';font-size:8px">'+(d.savAmt>0?fmt(d.savAmt):'--')+'</div><div class="sav-bar-outer" style="height:120px"><div class="sav-bar-inner" style="height:'+h+'px;background:'+col+'"></div>'+(d.savGoal>0?'<div class="sav-bar-goal" style="bottom:'+gH+'px"></div>':'')+'</div><div class="sav-bar-label">'+p[0]+'<br>&#39;'+p[1]+'</div></div>';}).join('');
  var html='<div class="sav-bars">'+bars+'</div><div class="sav-stats-row"><div class="sav-stat"><div class="sav-stat-label">Total saved</div><div class="sav-stat-val" style="color:var(--green)">'+fmt(totalSav)+'</div></div><div class="sav-stat"><div class="sav-stat-label">Avg/month</div><div class="sav-stat-val">'+fmt(Math.round(avgSav))+'</div></div><div class="sav-stat"><div class="sav-stat-label">Best month</div><div class="sav-stat-val" style="color:var(--green)">'+fmt(best.savAmt)+'<div style="font-size:10px;color:var(--tx3)">'+best.label.replace('|',' ')+'</div></div></div><div class="sav-stat"><div class="sav-stat-label">Goal met</div><div class="sav-stat-val" style="color:'+(metCount===n?'var(--green)':'var(--amber)')+'">'+metCount+'/'+n+'</div></div></div>';
  html+='<div style="overflow-x:auto;margin-top:12px"><table class="htable"><thead><tr><th>Month</th><th>Income</th><th>Saved</th><th>Rate</th><th>Goal</th><th>Status</th></tr></thead><tbody>';
  data.slice().reverse().forEach(function(d){var rc=d.savRate>=(savGoalPct*100)?'var(--green)':d.savRate>0?'var(--amber)':'var(--red)';html+='<tr><td>'+d.label.replace('|',' ')+'</td><td>'+fmt(d.income)+'</td><td style="color:var(--green)">'+fmt(d.savAmt)+'</td><td style="color:'+rc+'">'+d.savRate.toFixed(1)+'%</td><td>'+fmt(d.savGoal)+'</td><td>'+(d.income===0?'--':d.metGoal?'<span style="color:var(--green)">Met</span>':'<span style="color:var(--amber)">Below</span>')+'</td></tr>';});
  el.innerHTML=html+'</tbody></table></div>';
}
