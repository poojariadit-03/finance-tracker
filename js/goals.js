/* ═══ GOALS ═══ */
function addGoal(){var emoji=document.getElementById('gEmoji').value.trim()||'🎯',name=document.getElementById('gName').value.trim(),target=parseFloat(document.getElementById('gTarget').value),deadline=document.getElementById('gDeadline').value||'';if(!name||isNaN(target)||target<=0)return;D.goals.push({id:Date.now().toString(),emoji:emoji,name:name,target:target,deadline:deadline,contributions:[],autoAmt:0,autoDay:0});autoSave();['gEmoji','gName','gTarget','gDeadline'].forEach(function(id){document.getElementById(id).value='';});renderGoals();}
function removeGoal(id){if(!confirm('Delete this goal?'))return;D.goals=D.goals.filter(function(g){return g.id!==id;});autoSave();renderGoals();}

function addWithdrawal(id){
  var inp=document.getElementById('withdraw-'+id);
  if(!inp)return;
  var amt=parseFloat(inp.value);
  if(isNaN(amt)||amt<=0)return;
  var g=D.goals.find(function(g){return g.id===id;});if(!g)return;
  var saved=Math.max(0,(g.contributions||[]).reduce(function(s,c){return s+c.amount;},0));
  if(amt>saved){showToast('Cannot withdraw more than saved amount','error');return;}
  if(!g.contributions)g.contributions=[];
  g.contributions.push({month:mk(),amount:-amt,destination:'Withdrawal',date:new Date().toISOString(),isWithdrawal:true});
  autoSave();inp.value='';renderGoals();
  showToast('Withdrew '+fmt(amt)+' from goal','success');
}

function addContrib(id){var inp=document.getElementById('contrib-'+id),amt=parseFloat(inp.value),dest=document.getElementById('contrib-dest-'+id).value;if(isNaN(amt)||amt<=0)return;var g=D.goals.find(function(g){return g.id===id;});if(!g)return;g.contributions.push({month:mk(),amount:amt,destination:dest,date:new Date().toISOString()});autoSave();inp.value='';renderGoals();}
function removeContrib(goalId,idx){var g=D.goals.find(function(g){return g.id===goalId;});if(!g)return;g.contributions.splice(idx,1);autoSave();renderGoals();}
function renderGoals(){
  var goals=D.goals,container=document.getElementById('goalCards');
  if(!goals.length){container.innerHTML='<p class="empty" style="margin-bottom:.5rem">No goals yet.</p>';return;}
  container.innerHTML=goals.map(function(g,gi){
    var color=GC[gi%GC.length],saved=(g.contributions||[]).reduce(function(s,c){return s+c.amount;},0),pct=Math.min(100,saved/g.target*100),rem=Math.max(0,g.target-saved),done=saved>=g.target;
    var mmap={};(g.contributions||[]).forEach(function(c){mmap[c.month]=(mmap[c.month]||0)+c.amount;});
    var vals=Object.values(mmap),avg=vals.length?vals.reduce(function(s,v){return s+v;},0)/vals.length:0;
    var estM='—',projD='—';if(!done&&avg>0){var ml=Math.ceil(rem/avg);estM=ml===1?'1 month':ml+' months';var p=new Date();p.setMonth(p.getMonth()+ml);projD=p.toLocaleString('default',{month:'short',year:'numeric'});}else if(done){estM='✓ Reached!';projD='✓ Done';}
    var dlNote='';if(g.deadline&&!done){var dl=new Date(g.deadline+'-01'),now=new Date(),ml2=(dl.getFullYear()-now.getFullYear())*12+(dl.getMonth()-now.getMonth());dlNote=ml2>0?'Save '+fmtF(Math.ceil(rem/ml2))+'/mo to meet deadline':'<span style="color:var(--red)">Deadline passed!</span>';}
    var recent=(g.contributions||[]).slice().reverse().slice(0,5);
    return '<div class="gcard"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px"><div style="display:flex;align-items:flex-start;gap:10px"><span style="font-size:26px">'+g.emoji+'</span><div><div style="font-size:15px;font-weight:600">'+g.name+'</div><div style="font-size:12px;color:var(--tx3)">Target: '+fmtF(g.target)+(g.deadline?' · Due '+new Date(g.deadline+'-01').toLocaleString('default',{month:'short',year:'numeric'}):'')+'</div></div></div><button class="del-btn" onclick="removeGoal(\''+g.id+'\')">×</button></div>'+
      '<div style="display:flex;justify-content:space-between;margin:10px 0 6px;font-size:13px"><span><span style="font-size:11px;color:var(--tx3)">Saved </span><span style="font-family:\'DM Mono\',monospace;font-weight:500;color:var(--green)">'+fmtF(saved)+'</span></span><span><span style="font-size:11px;color:var(--tx3)">Left </span><span style="font-family:\'DM Mono\',monospace;color:var(--tx3)">'+fmtF(rem)+'</span></span></div>'+
      '<div class="pbg" style="height:8px"><div class="pfill" style="width:'+pct.toFixed(1)+'%;background:'+(done?'var(--green)':color)+'"></div></div>'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">'
      +'<div style="font-size:11px;color:var(--tx3)">'+pct.toFixed(1)+'% complete</div>'
      +(done?'<span style="background:var(--gbg);color:var(--green);font-size:11px;font-weight:700;padding:2px 10px;border-radius:99px">🎉 Goal reached!</span>':pct>=75?'<span style="background:var(--bbg);color:var(--blue);font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px">🔥 75%+</span>':pct>=50?'<span style="background:var(--abg);color:var(--amber);font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px">⚡ Halfway!</span>':'')
      +'</div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px"><div style="background:var(--sur2);border-radius:8px;padding:7px 10px"><div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--tx3);margin-bottom:3px">Avg/month</div><div style="font-family:\'DM Mono\',monospace;font-size:13px;font-weight:500">'+(avg>0?fmtF(avg):'—')+'</div></div><div style="background:var(--sur2);border-radius:8px;padding:7px 10px"><div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--tx3);margin-bottom:3px">Time left</div><div style="font-size:12px;font-weight:500">'+estM+'</div></div><div style="background:var(--sur2);border-radius:8px;padding:7px 10px"><div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--tx3);margin-bottom:3px">Projected</div><div style="font-size:12px;font-weight:500">'+projD+'</div></div><div style="background:var(--sur2);border-radius:8px;padding:7px 10px"><div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--tx3);margin-bottom:3px">Contributions</div><div style="font-family:\'DM Mono\',monospace;font-size:13px;font-weight:500">'+(g.contributions||[]).length+'</div></div></div>'+
      (dlNote?'<div style="font-size:12px;color:var(--amber);margin-top:8px">⏰ '+dlNote+'</div>':'')+
      '<div style="margin-top:12px">'+'<div style="display:flex;gap:8px;margin-bottom:6px;flex-wrap:wrap">'+'<input type="number" id="contrib-'+g.id+'" placeholder="Amount ₹" min="1" step="100" style="flex:1;min-width:100px">'+'<select id="contrib-dest-'+g.id+'" style="max-width:155px"><option>FD</option><option>RD</option><option>Savings Account</option><option>Cash</option><option>Emergency Fund</option><option>Other</option></select>'+'<button class="btn" style="padding:7px 12px" onclick="addContrib(\''+g.id+'\')" >+ Save</button>'+'<input type="number" id="withdraw-'+g.id+'" placeholder="Withdraw ₹" min="1" step="100" style="flex:1;min-width:80px">'
+'<button class="btn" style="padding:7px 12px;background:var(--red)" onclick="addWithdrawal(\''+g.id+'\')" >- Withdraw</button>'+'<button class="btn-ghost" style="padding:7px 12px" onclick="openAutoContrib(\''+g.id+'\')">&#9881; Auto</button>'+'</div></div>'+
      (recent.length?'<div style="margin-top:8px;max-height:120px;overflow-y:auto">'+recent.map(function(c,ri){var realIdx=(g.contributions||[]).length-1-ri,d=new Date(c.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'});var dl=c.destination?' → '+c.destination:'';var isWd=c.isWithdrawal||c.amount<0;return '<div class="erow"><div class="eleft"><div class="dot" style="background:'+color+'"></div><div><span class="emeta">'+d+dl+'</span></div></div><div class="eright"><span class="eamt" style="color:'+color+'">+'+fmtF(c.amount)+'</span><button class="del-btn" onclick="removeContrib(\''+g.id+'\','+realIdx+')">×</button></div></div>';}).join('')+'</div>':'')+
      '</div>';
  }).join('');
}
