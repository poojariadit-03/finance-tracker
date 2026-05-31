/* ═══ LENT MONEY TRACKER ═══ */
function addLent(){
  var name=document.getElementById('lentName').value.trim();
  var amt=parseFloat(document.getElementById('lentAmt').value);
  var date=document.getElementById('lentDate').value||todayStr();
  var returnBy=document.getElementById('lentReturnBy').value||'';
  var note=document.getElementById('lentNote').value.trim();
  if(!name||isNaN(amt)||amt<=0)return;
  if(!D.lent)D.lent=[];if(!D.transfers)D.transfers=[];if(!D.templates)D.templates=[];
  D.lent.push({id:Date.now().toString(),name:name,amt:amt,date:date,returnBy:returnBy,note:note,returned:false,returnedDate:''});
  autoSave();
  document.getElementById('lentName').value='';document.getElementById('lentAmt').value='';
  document.getElementById('lentReturnBy').value='';document.getElementById('lentNote').value='';
  renderLent();updateLentBadge();
  showToast('Lent '+fmt(amt)+' to '+name,'success');
}

function partialReturn(id){
  var entry=(D.lent||[]).find(function(l){return l.id===id;});
  if(!entry)return;
  var amtStr=prompt('How much was returned? (Original: '+fmt(entry.amt)+')');
  if(!amtStr)return;
  var amt=parseFloat(amtStr);
  if(isNaN(amt)||amt<=0){showToast('Invalid amount','error');return;}
  if(amt>=entry.amt){markReturned(id);return;}
  /* Reduce remaining amount */
  entry.amt=Math.round((entry.amt-amt)*100)/100;
  entry.note=(entry.note?entry.note+' | ':'')+fmt(amt)+' returned on '+todayStr();
  autoSave();renderLent();updateLentBadge();
  showToast(fmt(amt)+' partial return recorded. Remaining: '+fmt(entry.amt),'success');
}

function markReturned(id){
  var entry=(D.lent||[]).find(function(l){return l.id===id;});
  if(!entry)return;
  entry.returned=true;entry.returnedDate=todayStr();
  autoSave();renderLent();updateLentBadge();
  showToast(fmt(entry.amt)+' returned by '+entry.name+'!','success');
}
function deleteLent(id){
  if(!confirm('Delete this lent entry?'))return;
  D.lent=(D.lent||[]).filter(function(l){return l.id!==id;});
  autoSave();renderLent();updateLentBadge();
}
function updateLentBadge(){
  var pending=(D.lent||[]).filter(function(l){return !l.returned;});
  var overdue=pending.filter(function(l){return l.returnBy&&new Date(l.returnBy)<new Date();});
  var badge=document.getElementById('lentBadge');
  if(!badge)return;
  if(overdue.length){badge.textContent=overdue.length;badge.style.display='inline-block';badge.style.background='var(--red)';}
  else if(pending.length){badge.textContent=pending.length;badge.style.display='inline-block';badge.style.background='var(--amber)';}
  else{badge.style.display='none';}
}
function renderLent(){
  var lent=D.lent||[];
  var today=new Date();today.setHours(0,0,0,0);
  var pending=lent.filter(function(l){return !l.returned;});
  var returned=lent.filter(function(l){return l.returned;});
  var totalLent=lent.reduce(function(s,l){return s+l.amt;},0);
  var totalPending=pending.reduce(function(s,l){return s+l.amt;},0);
  var totalReturned=returned.reduce(function(s,l){return s+l.amt;},0);
  document.getElementById('lent-total').textContent=fmt(totalLent);
  document.getElementById('lent-pending').textContent=fmt(totalPending);
  document.getElementById('lent-returned').textContent=fmt(totalReturned);
  /* Overdue note */
  var overdue=pending.filter(function(l){return l.returnBy&&new Date(l.returnBy)<today;});
  var odEl=document.getElementById('lentOverdueNote');
  if(odEl)odEl.textContent=overdue.length?'⚠️ '+overdue.length+' overdue!':'';
  /* Pending list */
  var pEl=document.getElementById('lentPendingList');
  if(!pending.length){pEl.innerHTML='<p class="empty">No pending amounts. 🎉</p>';}
  else{
    /* Sort: overdue first, then by returnBy date */
    pending.sort(function(a,b){
      var aOver=a.returnBy&&new Date(a.returnBy)<today;
      var bOver=b.returnBy&&new Date(b.returnBy)<today;
      if(aOver&&!bOver)return -1;if(!aOver&&bOver)return 1;
      if(a.returnBy&&b.returnBy)return new Date(a.returnBy)-new Date(b.returnBy);
      return new Date(b.date)-new Date(a.date);
    });
    pEl.innerHTML=pending.map(function(l){
      var lentDate=new Date(l.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
      var pill='';
      if(l.returnBy){
        var rb=new Date(l.returnBy);rb.setHours(0,0,0,0);
        var diff=Math.round((rb-today)/(1000*60*60*24));
        if(diff<0)pill='<span class="overdue-pill">Overdue by '+Math.abs(diff)+'d</span>';
        else if(diff===0)pill='<span class="overdue-pill">Due TODAY</span>';
        else if(diff<=3)pill='<span class="due-soon-pill">Due in '+diff+'d</span>';
        else pill='<span style="font-size:10px;color:var(--tx3);margin-left:6px">Due '+rb.toLocaleDateString('en-IN',{day:"numeric",month:"short"})+'</span>';
      }
      return '<div class="lent-item"><div class="lent-left"><div class="lent-name">'+l.name+pill+'</div><div class="lent-meta">Lent on '+lentDate+(l.note?' · '+l.note:'')+'</div></div><div class="lent-right"><span style="font-family:monospace;font-weight:600;font-size:15px;color:var(--red)">'+fmt(l.amt)+'</span><button class="return-btn" onclick="markReturned(\''+l.id+'\')" >✓ Returned</button><button class="btn-ghost" style="padding:4px 8px;font-size:11px" onclick="partialReturn(\''+l.id+'\')" title="Partial">↩ Partial</button><button class="del-btn" onclick="deleteLent(\''+l.id+'\')" >×</button></div></div>';
    }).join('');
  }
  /* Returned list */
  var rEl=document.getElementById('lentReturnedList');
  if(!returned.length){rEl.innerHTML='<p class="empty">No returned amounts yet.</p>';}
  else{
    rEl.innerHTML=returned.slice().reverse().map(function(l){
      var lentDate=new Date(l.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
      var retDate=l.returnedDate?new Date(l.returnedDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'—';
      return '<div class="lent-item"><div class="lent-left"><div class="lent-name" style="color:var(--tx2)">'+l.name+'</div><div class="lent-meta">Lent '+lentDate+' · Returned '+retDate+(l.note?' · '+l.note:'')+'</div></div><div class="lent-right"><span style="font-family:monospace;font-size:14px;color:var(--green)">'+fmt(l.amt)+'</span><button class="del-btn" onclick="deleteLent(\''+l.id+'\')" >×</button></div></div>';
    }).join('');
  }
  updateLentBadge();
}
