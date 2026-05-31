/* ═══ HISTORY ═══ */
function renderHistory(){
  var n=typeof _histRangeMonths!=='undefined'&&_histRangeMonths>0?_histRangeMonths:6;
  var fxd=fixedMonthly(),months=[];for(var i=n-1;i>=0;i--)months.push(new Date(curDate.getFullYear(),curDate.getMonth()-i,1));
  var data=months.map(function(d){var s=getExpenses(d).reduce(function(a,e){return a+e.amt;},0),mI=(D.config.income||0)+extraIncomeTotal(d),sav=Math.max(0,mI-fxd-s),bal=mI-fxd-s;return{label:d.toLocaleString('default',{month:'short',year:'numeric'}),income:mI,fxd:Math.round(fxd),spent:Math.round(s),savings:Math.round(sav),balance:Math.round(bal)};});
  if(_hist){_hist.destroy();_hist=null;}
  var dark=matchMedia('(prefers-color-scheme:dark)').matches;
  _hist=new Chart(document.getElementById('histChart'),{type:'bar',data:{labels:data.map(function(d){return d.label;}),datasets:[{label:'Income',data:data.map(function(d){return d.income;}),backgroundColor:'#378ADD',borderRadius:4},{label:'Expenses',data:data.map(function(d){return d.fxd+d.spent;}),backgroundColor:'#D85A30',borderRadius:4},{label:'Savings',data:data.map(function(d){return d.savings;}),backgroundColor:'#1D9E75',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{grid:{color:dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)'},ticks:{callback:function(v){return '₹'+(v>=100000?(v/100000).toFixed(0)+'L':v>=1000?(v/1000).toFixed(0)+'K':v);}}}}}});
  document.getElementById('histLeg').innerHTML=[{l:'Income',c:'#378ADD'},{l:'Expenses',c:'#D85A30'},{l:'Savings',c:'#1D9E75'}].map(function(x){return '<span class="legitem"><span class="legdot" style="background:'+x.c+'"></span>'+x.l+'</span>';}).join('');
  /* Build table with trend arrows */
  var totalInc=0,totalFxd=0,totalSpent=0,totalSav=0;
  document.getElementById('histBody').innerHTML=data.map(function(d,i){
    totalInc+=d.income;totalFxd+=d.fxd;totalSpent+=d.spent;totalSav+=d.savings;
    var prev=data[i-1];
    var spArr=prev?(d.spent<prev.spent?'<span style="color:var(--green);margin-left:3px">↓</span>':'<span style="color:var(--red);margin-left:3px">↑</span>'):'';
    var savArr=prev?(d.savings>prev.savings?'<span style="color:var(--green);margin-left:3px">↑</span>':'<span style="color:var(--red);margin-left:3px">↓</span>'):'';
    return '<tr><td>'+d.label+'</td><td>'+fmt(d.income)+'</td><td>'+fmt(d.fxd)+'</td><td>'+fmt(d.spent)+spArr+'</td><td style="color:var(--green)">'+fmt(d.savings)+savArr+'</td><td style="color:'+(d.balance>=0?'var(--green)':'var(--red)')+'">'+fmt(d.balance)+'</td></tr>';
  }).join('')
  +'<tr style="background:var(--sur2);font-weight:600"><td>Avg/mo</td><td>'+fmt(Math.round(totalInc/data.length))+'</td><td>'+fmt(Math.round(totalFxd/data.length))+'</td><td>'+fmt(Math.round(totalSpent/data.length))+'</td><td style="color:var(--green)">'+fmt(Math.round(totalSav/data.length))+'</td><td></td></tr>';
  renderSavingsComparison();
}

/* ═══ CHARTS ═══ */
function dc(c){if(c){try{c.destroy();}catch(e){}}return null;}

var _chartMonthOffset=0;
function setChartMonth(offset,btn){
  _chartMonthOffset=offset;
  document.querySelectorAll('#tab-charts .hist-pill').forEach(function(p){p.classList.remove('active');});
  if(btn)btn.classList.add('active');
  updateCharts();
}

function updateCharts(){
  var _chartDate=new Date(curDate.getFullYear(),curDate.getMonth()+(typeof _chartMonthOffset!=='undefined'?_chartMonthOffset:0),1);
  var exps=getExpenses(_chartDate),income=(D.config.income||0)+extraIncomeTotal(_chartDate),accs=D.accounts,fxd=fixedMonthly();
  var spent=exps.reduce(function(s,e){return s+e.amt;},0),savA=Math.max(0,income-fxd-spent);
  var dark=matchMedia('(prefers-color-scheme:dark)').matches,gc=dark?'rgba(255,255,255,.05)':'rgba(0,0,0,.05)';
  var cats={};exps.forEach(function(e){cats[e.cat]=(cats[e.cat]||0)+e.amt;});
  var cL=Object.keys(cats),cD=cL.map(function(k){return cats[k];}),cC=cL.map(function(k){return getCatColor(k);});
  _cat=dc(_cat);_cat=new Chart(document.getElementById('catChart'),{type:'doughnut',data:{labels:cL,datasets:[{data:cD,backgroundColor:cC,borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},cutout:'62%'}});
  var cT=cD.reduce(function(s,v){return s+v;},0);
  document.getElementById('catLeg').innerHTML=cL.length?cL.map(function(l,i){return '<span class="legitem"><span class="legdot" style="background:'+cC[i]+'"></span>'+l+' '+(cT>0?(cD[i]/cT*100).toFixed(0):0)+'%</span>';}).join(''):'<span style="font-size:12px;color:var(--tx3)">No expenses</span>';
  var aD=[fxd,spent,savA],aC=['#D85A30','#D4537E','#1D9E75'],aL=['Fixed','Daily','Savings'];
  _alloc=dc(_alloc);_alloc=new Chart(document.getElementById('allocChart'),{type:'doughnut',data:{labels:aL,datasets:[{data:aD,backgroundColor:aC,borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},cutout:'62%'}});
  var aT=aD.reduce(function(s,v){return s+v;},0);
  document.getElementById('allocLeg').innerHTML=aL.map(function(l,i){return '<span class="legitem"><span class="legdot" style="background:'+aC[i]+'"></span>'+l+' '+(aT>0?(aD[i]/aT*100).toFixed(0):0)+'%</span>';}).join('');
  _acc=dc(_acc);
  if(accs.length){var aS=accs.map(function(a){return exps.filter(function(e){return e.accountId===a.id;}).reduce(function(s,e){return s+e.amt;},0);});_acc=new Chart(document.getElementById('accChart'),{type:'bar',data:{labels:accs.map(function(a){return a.name;}),datasets:[{label:'Spent',data:aS,backgroundColor:accs.map(function(_,i){return AC[i%AC.length];}),borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{grid:{color:gc},ticks:{callback:function(v){return '₹'+v;}}}}}});}
  var days={};exps.forEach(function(e){var d=new Date(e.date).getDate();days[d]=(days[d]||0)+e.amt;});
  var tL=Object.keys(days).sort(function(a,b){return a-b;}),tD=tL.map(function(k){return days[k];});
  /* Calculate moving average for trend line */
  var tAvg=tD.map(function(_,i){var slice=tD.slice(Math.max(0,i-2),i+1);return Math.round(slice.reduce(function(s,v){return s+v;},0)/slice.length);});
  /* Top 10 expenses */
  var top10El=document.getElementById('top10List');
  if(top10El){
    var sorted=exps.slice().sort(function(a,b){return b.amt-a.amt;}).slice(0,10);
    var maxA=sorted.length?sorted[0].amt:1;
    top10El.innerHTML=sorted.length?sorted.map(function(e,i){
      var pct=Math.round(e.amt/maxA*100);
      var c=getCatColor(e.cat);
      var d=new Date(e.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
      return '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span style="font-weight:500">'+(i+1)+'. '+e.name+'</span><span style="font-family:monospace">'+fmt(e.amt)+'<span style="color:var(--tx3);margin-left:4px">'+d+'</span></span></div><div style="height:6px;background:var(--sur2);border-radius:99px"><div style="height:100%;width:'+pct+'%;background:'+c+';border-radius:99px"></div></div></div>';
    }).join(''):'<p class="empty">No expenses this month.</p>';
  }
    _trend=dc(_trend);_trend=new Chart(document.getElementById('trendChart'),{type:'bar',data:{labels:tL.map(function(d){return 'Day '+d;}),datasets:[{label:'Spent',data:tD,backgroundColor:'#378ADD',borderRadius:4,order:2},{type:'line',label:'Trend',data:tAvg,borderColor:'#D4537E',backgroundColor:'transparent',borderWidth:2,pointRadius:2,tension:0.4,order:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{font:{size:11},autoSkip:tL.length>14,maxRotation:45}},y:{grid:{color:gc},ticks:{callback:function(v){return '₹'+v;}}}}}});
}
