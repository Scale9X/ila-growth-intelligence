/* Scale9X Analyst Portal (Phase 3) — queue + submission review + status workflow.
   Reads the same shared DB the client portal writes to. */
const $=s=>document.getElementById(s);
const esc=s=>(''+(s==null?'':s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const go=h=>location.hash=h;
const TOK=()=>localStorage.getItem('1xl_staff_tok');
let S={ user:null, detail:null };

async function api(method,path,body){
  const r=await fetch(path,{method,headers:Object.assign({'Content-Type':'application/json'},TOK()?{Authorization:'Bearer '+TOK()}:{}),body:body?JSON.stringify(body):undefined});
  const d=await r.json().catch(()=>({}));
  if(r.status===401 && TOK()){localStorage.removeItem('1xl_staff_tok');S={user:null};go('#/login');throw new Error('Your session expired — please sign in again.');}
  if(!r.ok) throw new Error(d.error||('Request failed ('+r.status+')')); return d;
}

// Download a client-uploaded document via authenticated fetch → blob (Bearer token can't ride on a plain link).
async function downloadDoc(id,name){
  try{
    const r=await fetch('/api/analyst/document/'+id,{headers:TOK()?{Authorization:'Bearer '+TOK()}:{}});
    if(!r.ok) throw new Error('Download failed ('+r.status+')');
    const blob=await r.blob(); const u=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=u; a.download=name||'document'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u);
  }catch(e){ alert(e.message); }
}
function shell(body,title){
  return `<div class="app"><aside class="rail"><div class="brand"><div class="mark">iL</div><div><div class="logo">ILA<span class="t">tech</span></div><span>Analyst Workspace</span></div></div>
    <a class="navitem ${location.hash.includes('queue')||!location.hash?'active':''}" href="#/queue">Engagements</a>
    ${S.isAdmin?`<a class="navitem ${location.hash.includes('admin')?'active':''}" href="#/admin">Team &amp; Admin</a>`:''}
    <div style="margin-top:auto"><div class="small muted">${t('signedin')} · ${esc(S.user?S.user.full_name:'')}</div><a href="#/logout" class="btn ghost" style="margin-top:8px;width:100%;justify-content:center;padding:9px">${t('signout')}</a></div></aside>
    <div class="main"><div class="topbar"><div style="display:flex;align-items:center;gap:10px"><a onclick="history.back()" title="Back" style="cursor:pointer;font-size:20px;color:var(--muted)">←</a><b>${esc(title||'')}</b></div><div style="display:flex;align-items:center;gap:12px">${langSelect()}<span class="pill accent">${esc(S.user?S.user.full_name:'Scale9X')}${S.isAdmin?' · Admin':' · Analyst'}</span></div></div>
    <div class="content" style="max-width:1080px">${body}</div></div></div>`;
}

function vLogin(signup){
  return `<div class="landing"><div class="left"><div>
   <div class="brand" style="padding:0 0 28px"><div class="mark" style="background:rgba(255,255,255,.18);box-shadow:none">S9</div><div class="logo" style="color:#fff;font-size:17px">Scale<span style="color:#dbe6ff">9X</span></div></div>
   <div class="tagline">Internal · Analyst Workspace</div>
   <h1>Scale9X Analyst Workspace</h1><div class="sub">Review client submissions, run the diagnostic, and deliver the growth report — all from the shared platform.</div></div>
   <div class="small" style="color:rgba(255,255,255,.7)">Confidential · Staff only</div></div>
   <div class="right" style="position:relative"><div style="position:absolute;top:22px;right:26px">${langSelect()}</div><div class="authbox"><div class="ab-mark"><div class="mark">iL</div><div class="logo">ILA<span class="t">tech</span></div></div><h2 style="font-size:23px">${signup?'Create analyst account':'Staff sign in'}</h2>
   ${signup?`<div class="field"><label>Your name</label><input class="input" id="f_name"></div>`:''}
   <div class="field"><label>Email</label><input class="input" id="f_email" ${signup?'':'value="analyst@1xl.co"'}></div>
   <div class="field"><label>Password</label><input class="input" type="password" id="f_pass" ${signup?'':'value="changeme"'}></div>
   <div id="err" class="small" style="color:var(--red)"></div>
   <button class="btn" style="width:100%;justify-content:center" onclick="${signup?'doStaffSignup()':'staffLogin()'}">${signup?'Create account':'Sign in'}</button>
   <div class="muted small" style="text-align:center;margin-top:14px">${signup?`Have an account? <a href="#/login" style="color:var(--accent)">Sign in</a>`:`New analyst? <a href="#/signup" style="color:var(--accent)">Create an account</a>`}</div>
   <div class="muted small" style="text-align:center;margin-top:6px">New analysts start with no engagements until an admin assigns them.</div></div></div></div>`;
}
async function doStaffSignup(){ try{ const d=await api('POST','/api/auth/staff-signup',{full_name:document.getElementById('f_name').value.trim(),email:document.getElementById('f_email').value.trim(),password:document.getElementById('f_pass').value}); localStorage.setItem('1xl_staff_tok',d.token); S.user=d.user; go('#/queue'); }catch(e){ document.getElementById('err').textContent=e.message; } }
async function staffLogin(){
  try{ const d=await api('POST','/api/auth/login',{email:$('f_email').value.trim(),password:$('f_pass').value});
    if(!d.user.is_staff){ $('err').textContent='This portal is for Scale9X staff only.'; return; }
    localStorage.setItem('1xl_staff_tok',d.token); S.user=d.user; go('#/queue');
  }catch(e){ $('err').textContent=e.message; }
}
function logout(){ localStorage.removeItem('1xl_staff_tok'); S={user:null}; go('#/login'); }

async function vQueue(){
  const d=await api('GET','/api/analyst/queue'); S.stageLabels=d.stageLabels; S.isAdmin=d.isAdmin; S.me=d.me;
  const rows=d.engagements.map(e=>`<div class="checkrow" style="cursor:pointer" onclick="go('#/e/${e.id}')">
    <div><b>${esc(e.company)}</b><div class="muted small">${esc(e.industry||'—')} · submitted ${esc((e.submitted_at||'').slice(0,10))}</div></div>
    <span class="pill ${e.status==='delivered'?'green':'amber'}">${esc(d.stageLabels[e.status]||e.status)}</span></div>`).join('') || '<div class="muted">No engagements assigned to you yet. An admin assigns engagements to analysts.</div>';
  return shell(`<div class="eyebrow">Analyst Console</div><h1 class="h-title">Engagement Queue</h1>
    <p class="muted">${d.isAdmin?'You are an <b>Admin</b> — you see all engagements.':'You see the engagements <b>assigned to you</b>.'} Submissions flow here automatically when a client submits.</p>
    <div class="card pad" style="margin-top:14px">${rows}</div>`,'Engagements');
}
async function vAdmin(){
  const d=await api('GET','/api/analyst/staff');
  const rows=d.staff.map(s=>`<div class="checkrow"><div><b>${esc(s.full_name)}</b> <span class="muted small">${esc(s.email)}</span></div><span class="pill ${/admin/.test(s.roles||'')?'accent':''}">${esc((s.roles||'analyst').replace('super_admin','admin'))}</span></div>`).join('');
  return shell(`<div class="eyebrow">Admin</div><h1 class="h-title">Team &amp; Access</h1>
    <p class="muted">Admins see every engagement. Analysts only see engagements assigned to them (assign analysts on each engagement page).</p>
    <div class="card pad" style="margin-bottom:14px"><b>Staff (${d.staff.length})</b>${rows}</div>
    <div class="card pad"><b>Add a team member</b>
      <div class="row wrap" style="margin-top:8px"><div class="field" style="flex:1;min-width:150px"><label>Name</label><input class="input" id="st_name"></div><div class="field" style="flex:1;min-width:150px"><label>Email</label><input class="input" id="st_email"></div></div>
      <div class="row wrap"><div class="field" style="flex:1;min-width:150px"><label>Temp password</label><input class="input" id="st_pass" value="changeme"></div><div class="field" style="width:160px"><label>Role</label><select class="sel" id="st_role"><option value="analyst">Analyst</option><option value="admin">Admin</option></select></div></div>
      <button class="btn" onclick="addStaff()">Create account</button><div id="st_err" class="small" style="color:var(--red);margin-top:6px"></div></div>`,'Admin');
}
async function addStaff(){ try{ await api('POST','/api/analyst/staff',{full_name:document.getElementById('st_name').value.trim(),email:document.getElementById('st_email').value.trim(),password:document.getElementById('st_pass').value,role:document.getElementById('st_role').value}); render(); }catch(e){ document.getElementById('st_err').textContent=e.message; } }
async function assignAnalyst(id){ await api('POST','/api/analyst/engagement/'+id+'/assign',{analyst_id:document.getElementById('asg').value}); render(); }

function stepper(stages,labels,cur,visited,id){
  const ci=stages.indexOf(cur); const delivered=(cur==='delivered');
  return `<div class="stepper">${stages.map((s,i)=>{
    if(i===ci) return `<span class="step cur">${esc(labels[s]||s)}</span>`;
    const done=i<ci&&(delivered||!visited||visited.has(s));   // green ✓ only if actually passed through (or delivered = terminal)
    const skipped=i<ci&&!done;                                 // before current but never visited → genuinely incomplete
    const sty=skipped?'cursor:pointer;background:#FEF3C7;color:#92400E;border:1px solid #FCD34D':'cursor:pointer';
    const tip=skipped?'Skipped — click to go back and complete this stage':('Click to set status to '+(labels[s]||s));
    return `<span class="step ${done?'done':''}" style="${sty}" title="${esc(tip)}" onclick="setStatus('${id}','${s}')">${done?'✓ ':skipped?'⚠ ':''}${esc(labels[s]||s)}</span>`;
  }).join('')}</div>`;
}
async function vEngagement(id){
  const d=await api('GET','/api/analyst/engagement/'+id); S.detail=d; S.stageLabels=d.stageLabels;
  const e=d.engagement, cur=e.status, ci=d.stages.indexOf(cur), nextStage=d.stages[ci+1];
  const ansByCode={}; d.answers.forEach(a=>ansByCode[a.code]=a);
  const sections=SECTIONS.map(sec=>{
    const qs=PROMPTS.filter(p=>p.sec===sec.key).filter(p=>ansByCode[p.id]);
    if(!qs.length) return '';
    return `<div class="card pad" style="margin-bottom:12px"><b>${esc(sec.title)} <span class="muted" style="font-weight:400">· ${esc(sec.sub)}</span></b>
      ${qs.map(p=>{const a=ansByCode[p.id];return `<div class="qa"><div class="q">${esc(p.q)}</div><div class="a">${esc(a.value)}</div>${a.by?`<div class="by">— ${esc(a.by)}</div>`:''}</div>`;}).join('')}</div>`;
  }).join('');
  const profile=d.profile||{};
  const profRows=[['Industry',profile.industry],['Revenue',profile.revenue],['Team',profile.team],['Website',profile.website],['Markets',profile.markets],['Offerings',profile.offerings]].filter(r=>r[1]);
  const smart=d.smart;
  const smartHtml=smart?`<div class="card pad" style="margin-bottom:12px"><b>Smart Discovery ${smart.confirmed?'<span class="pill green">client-confirmed</span>':''}</b>
    <div class="grid" style="grid-template-columns:1fr 1fr;margin-top:8px">
      ${[['Ideal Customer','icp'],['Challenges','challenges'],['Objectives','objectives'],['Opportunities','opps']].map(c=>`<div><div class="tiny" style="color:var(--accent)">${c[0]}</div><div class="small">${esc(smart[c[1]]||'—')}</div></div>`).join('')}
    </div></div>`:'';
  const docs=d.documents.length?`<div class="card pad" style="margin-bottom:12px"><b>Uploaded documents</b> <span class="muted small">(click to download &amp; review)</span>${d.documents.map(x=>`<div class="checkrow"><span style="cursor:pointer;color:var(--accent)" title="Download" onclick="downloadDoc('${x.id}','${esc(x.file_name||'document').replace(/'/g,"\\'")}')">📎 ${esc(x.file_name)}</span><span class="pill">${esc(x.category)}</span></div>`).join('')}</div>`:'';
  const teamHtml=`<div class="card pad" style="margin-bottom:12px"><b>Contributors</b>${d.members.map(m=>`<div class="checkrow"><div><b>${esc(m.name)}</b> <span class="pill ${m.role==='owner'?'accent':''}">${esc(m.role)}</span></div><span class="muted small">${(m.sections||[]).map(s=>(SECTIONS.find(x=>x.key===s)||{}).sub).filter(Boolean).join(', ')||'—'}</span></div>`).join('')}</div>`;
  const visited=(d.events&&d.events.length)?new Set(d.events.flatMap(ev=>[ev.from_status,ev.to_status])):null;
  const skipped=(visited&&cur!=='delivered')?d.stages.slice(0,ci).filter(s=>!visited.has(s)):[];
  const statusCtrl=`<div class="card pad" style="margin-bottom:16px"><div class="between"><div><div class="tiny">Engagement status</div>${stepper(d.stages,d.stageLabels,cur,visited,id)}${skipped.length?`<div class="muted small" style="margin-top:6px;color:#92400E">⚠ ${skipped.map(s=>esc(d.stageLabels[s])).join(', ')} ${skipped.length>1?'were':'was'} skipped — click that stage to go back and complete it.</div>`:''}</div>
    <div style="display:flex;gap:8px;align-items:center">
      <select class="sel" id="st_sel" style="width:200px;padding:8px">${d.stages.map(s=>`<option value="${s}" ${s===cur?'selected':''}>${esc(d.stageLabels[s])}</option>`).join('')}</select>
      <button class="btn ghost" onclick="setStatus('${id}',document.getElementById('st_sel').value)">Update</button>
      ${nextStage?(nextStage==='delivered'?`<button class="btn ghost" title="Delivery happens by publishing the report" onclick="setStatus('${id}','delivered')">Deliver via report ↓</button>`:`<button class="btn" onclick="setStatus('${id}','${nextStage}')">Advance → ${esc(d.stageLabels[nextStage])}</button>`):'<span class="pill green">Delivered</span>'}
    </div></div></div>`;
  return shell(`<a href="#/queue" class="muted small" style="color:var(--accent)">← Queue</a>
    <div class="between" style="margin-top:6px"><div><div class="eyebrow">Engagement</div><h1 class="h-title">${esc(d.company.name)}</h1></div><a class="btn ghost" href="#/e/${id}/history">🕓 History</a></div>
    <div class="card pad" style="margin-bottom:16px"><div class="between"><div><div class="tiny">Assigned analyst</div><b>${esc(d.assignedAnalyst||'Unassigned')}</b></div>
      ${d.isAdmin?`<div style="display:flex;gap:8px;align-items:center"><select class="sel" id="asg" style="width:210px;padding:7px">${(d.analysts||[]).map(a=>`<option value="${a.id}" ${a.id===d.assigned_analyst_id?'selected':''}>${esc(a.full_name)}</option>`).join('')}</select><button class="btn ghost" onclick="assignAnalyst('${id}')">Assign</button></div>`:'<span class="muted small">Only an admin can reassign.</span>'}</div></div>
    ${statusCtrl}
    ${(d.discovery&&!d.discovery.complete)?`<div class="card pad" style="margin-bottom:16px;border:1px solid var(--red);background:#FEF2F2"><b style="color:var(--red)">⚠ Discovery incomplete — ${d.discovery.answered}/${d.discovery.required} questions answered.</b><div class="muted small" style="margin-top:4px">Scoring, findings, and report generation are locked until the client completes the interview. Ask the client to finish the remaining ${d.discovery.required-d.discovery.answered} questions in their portal.</div></div>`:''}
    ${(()=>{ const dv=d.discovery||{}, sc=d.scoring||{maturity:{},potential:{}};
      if(!dv.complete) return `<div class="card pad" style="margin-bottom:16px"><div class="between"><div><div class="tiny">Diagnostic Engine</div><b>Locked until discovery is complete</b></div><span class="pill amber">🔒 ${dv.answered}/${dv.required} answered</span></div></div>`;
      const scoredOk=sc.complete;
      const lockNote=`<span class="pill amber" title="Score both scorecards first">🔒 needs scoring · M ${sc.maturity.scored}/${sc.maturity.total} · P ${sc.potential.scored}/${sc.potential.total}</span>`;
      const reportBtns = scoredOk
        ? `<a class="btn ghost" href="#/e/${id}/findings">Findings</a><a class="btn" href="#/e/${id}/report">Build Report →</a>`
        : lockNote;
      return `<div class="card pad" style="margin-bottom:16px"><div class="between" style="flex-wrap:wrap;gap:10px"><div><div class="tiny">Diagnostic Engine</div><b>Score this engagement</b>${scoredOk?'':`<div class="muted small" style="margin-top:3px">Findings &amp; report unlock once both scorecards are fully scored.</div>`}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn ghost" href="#/e/${id}/score/maturity">Score Maturity ${sc.maturity.scored===sc.maturity.total?'✓':`(${sc.maturity.scored}/${sc.maturity.total})`}</a><a class="btn ghost" href="#/e/${id}/score/potential">Score Potential ${sc.potential.scored===sc.potential.total?'✓':`(${sc.potential.scored}/${sc.potential.total})`}</a><a class="btn ghost" href="#/e/${id}/results">Results</a>${reportBtns}</div></div></div>`;
    })()}
    <h2 style="font-size:18px;margin:6px 0 10px">Submission Review</h2>
    <div class="card pad" style="margin-bottom:12px"><b>Business profile</b><table style="width:100%;margin-top:6px;border-collapse:collapse">${profRows.map(r=>`<tr><td style="color:var(--muted);padding:5px 8px;width:140px">${esc(r[0])}</td><td style="padding:5px 8px">${esc(r[1])}</td></tr>`).join('')}</table></div>
    ${smartHtml}${teamHtml}${docs}
    <h2 style="font-size:18px;margin:14px 0 10px">Discovery responses</h2>
    ${sections||'<div class="muted">No answers yet.</div>'}`,'Engagement · '+d.company.name);
}
async function setStatus(id,status){
  try{ await api('POST','/api/analyst/engagement/'+id+'/status',{status}); render(); }
  catch(e){
    // 'delivered' is reached only by publishing the report — surface that instead of failing silently.
    if(status==='delivered'){ alert('To deliver this engagement, publish its report — delivery happens automatically when you publish.\n\nPath: Score Maturity (50) + Potential (43) → Generate report → Approve → Publish.\n\n('+e.message+')'); }
    else alert(e.message);
  }
}

/* ---- Phase 4: scoring + results ---- */
const CONF=['','low','medium','high'];
async function vScore(id,type){
  const d=await api('GET','/api/analyst/engagement/'+id+'/scores/'+type);
  const cfg=d.config, sc=d.scores||{};
  const cats=cfg.categories.map(cat=>`<div class="card pad" style="margin-bottom:12px"><b>${esc(cat.name)} <span class="muted" style="font-weight:400">· weight ${cat.weight}</span></b>
    ${cat.areas.map(ar=>{const cur=sc[ar.id]||{};return `<div class="qa"><div class="q">${esc(ar.name)} <span class="muted">(0–${ar.max})</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;align-items:center">
        <select class="sel scinp" data-area="${ar.id}" style="width:auto;min-width:220px;padding:7px">${['',...ar.options].map((o,i)=>{const val=i===0?'':String(i-1);return `<option value="${val}" ${(''+(cur.raw_score==null?'':cur.raw_score))===val?'selected':''}>${i===0?'— not scored —':(i-1)+' · '+esc(o)}</option>`;}).join('')}</select>
        <select class="sel" id="cf_${ar.id}" style="width:auto;padding:7px">${CONF.map(c=>`<option value="${c}" ${cur.confidence===c?'selected':''}>${c?c[0].toUpperCase()+c.slice(1)+' confidence':'— confidence —'}</option>`).join('')}</select>
        <input class="input" id="ev_${ar.id}" placeholder="Evidence note" value="${esc(cur.evidence_note||'')}" style="flex:1;min-width:200px">
      </div></div>`;}).join('')}</div>`).join('');
  return shell(`<a href="#/e/${id}" class="muted small" style="color:var(--accent)">← Engagement</a>
    <div class="between" style="margin:6px 0 4px"><div><div class="eyebrow">${type==='maturity'?'Growth Maturity':'Growth Potential'} Scorecard</div><h1 class="h-title">Score ${esc(d.config.name.replace(/^(?:1XL|Scale9X)\s+/,''))}</h1></div>
      <div style="display:flex;gap:8px"><button class="btn ghost" id="ai_btn" onclick="suggestScores('${id}','${type}')">✨ Suggest with AI</button><button class="btn" onclick="saveScore('${id}','${type}')">Save scores →</button></div></div>
    <p class="muted">Pick a rubric level per area; add confidence and evidence to keep scoring defensible. Or let AI draft a first pass from the client's answers, then review and edit before saving.</p>
    <div id="ai_banner"></div>
    ${cats}<button class="btn lg" onclick="saveScore('${id}','${type}')">Save scores →</button>`,'Score · '+type);
}
// Confirm + choose model before any paid AI call. Resolves to a model id, or null if cancelled.
function aiPick(task){
  return new Promise(res=>{
    const w=document.createElement('div');
    w.style.cssText='position:fixed;inset:0;background:rgba(14,17,22,.45);display:grid;place-items:center;z-index:9999';
    w.innerHTML=`<div class="card pad" style="max-width:460px;background:#fff;box-shadow:0 12px 48px rgba(0,0,0,.25)">
      <b style="font-size:16px">Run ${esc(task)} with AI?</b>
      <p class="muted small" style="margin:8px 0 12px">This makes a <b>paid</b> call to Claude using your Anthropic credit. Pick a model — or score/write by hand for free instead.</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn" data-m="claude-haiku-4-5">Haiku — fast &amp; low cost · ≈ $0.02–0.05</button>
        <button class="btn ghost" data-m="claude-opus-4-8">Opus — highest quality · ≈ $0.15–0.30</button>
        <button class="btn ghost" data-m="" style="color:var(--muted)">Cancel — don't spend</button>
      </div></div>`;
    w.addEventListener('click',e=>{ if(e.target===w){document.body.removeChild(w);return res(null);} const b=e.target.closest('button'); if(!b)return; const m=b.dataset.m; document.body.removeChild(w); res(m||null); });
    document.body.appendChild(w);
  });
}
async function suggestScores(id,type){
  const model=await aiPick((type==='maturity'?'Maturity':'Potential')+' scoring'); if(!model)return;
  const fast=model.includes('haiku');
  const btn=document.getElementById('ai_btn'); const bn=document.getElementById('ai_banner');
  if(btn){btn.disabled=true;btn.textContent='✨ Scoring… ('+(fast?'~20s':'up to ~2 min')+')';}
  try{
    const d=await api('POST','/api/analyst/engagement/'+id+'/scores/'+type+'/suggest',{model});
    if(d.available===false){ if(bn)bn.innerHTML='<div class="card pad" style="border:1px solid #FCD34D;background:#FEF3C7;color:#92400E;margin-bottom:12px">'+esc(d.error||'AI scoring is not configured.')+'</div>'; return; }
    if(d.error){ if(bn)bn.innerHTML='<div class="card pad" style="border:1px solid var(--red);margin-bottom:12px">AI scoring failed: '+esc(d.error)+'</div>'; return; }
    let applied=0;
    (d.suggestions||[]).forEach(s=>{
      const sel=document.querySelector('.scinp[data-area="'+s.area_id+'"]');
      if(sel){ sel.value=String(s.raw_score); applied++; }
      const cf=document.getElementById('cf_'+s.area_id); if(cf) cf.value=s.confidence;
      const ev=document.getElementById('ev_'+s.area_id); if(ev) ev.value=s.evidence_note||'';
    });
    if(bn)bn.innerHTML='<div class="card pad" style="border:1px solid var(--accent);background:#EEF2FF;margin-bottom:12px"><b>✨ AI drafted '+applied+' of '+d.total+' scores</b> from the client’s submission ('+esc(d.model)+'). Nothing is saved yet — review every area, adjust anything that’s off, then click <b>Save scores</b>.</div>';
    window.scrollTo(0,0);
  }catch(e){ if(bn)bn.innerHTML='<div class="card pad" style="border:1px solid var(--red);margin-bottom:12px">AI scoring failed: '+esc(e.message)+'</div>'; }
  finally{ if(btn){btn.disabled=false;btn.textContent='✨ Suggest with AI';} }
}
async function saveScore(id,type){
  if(_busy)return; _busy=true;
  const scores=[...document.querySelectorAll('.scinp')].map(el=>{const area=el.dataset.area;const raw=el.value;if(raw==='')return null;return {area_id:area,raw_score:raw,confidence:(document.getElementById('cf_'+area)||{}).value||null,evidence_note:(document.getElementById('ev_'+area)||{}).value||null};}).filter(Boolean);
  try{ await api('POST','/api/analyst/engagement/'+id+'/scores/'+type,{scores}); go('#/e/'+id+'/results'); }
  catch(e){ alert(e.message); }finally{_busy=false;}
}
function miniMatrix(mx){
  if(mx.quadrant==null) return `<div class="muted">Score both Maturity and Potential to place on the Magic Matrix.</div>`;
  return `<div style="display:flex;gap:12px;align-items:stretch"><div style="writing-mode:vertical-rl;transform:rotate(180deg);font-size:11px;color:var(--muted);font-weight:600;text-align:center">GROWTH MATURITY →</div>
    <div style="flex:1"><div style="position:relative;width:100%;max-width:440px;aspect-ratio:1;border:1px solid var(--line);border-radius:14px;background:#fafafa">
      <div style="position:absolute;left:60%;top:0;bottom:0;border-left:1px dashed var(--line)"></div><div style="position:absolute;top:40%;left:0;right:0;border-top:1px dashed var(--line)"></div>
      <div style="position:absolute;top:8px;left:10px;font-size:11px;color:var(--muted);font-weight:700">Mature Business</div>
      <div style="position:absolute;top:8px;right:10px;font-size:11px;color:var(--accent);font-weight:700">Scale Client</div>
      <div style="position:absolute;bottom:8px;left:10px;font-size:11px;color:var(--muted);font-weight:700">High Risk</div>
      <div style="position:absolute;bottom:8px;right:10px;font-size:11px;color:var(--accent);font-weight:700">Best Client</div>
      <div style="position:absolute;left:${mx.potential}%;bottom:${mx.maturity}%;transform:translate(-50%,calc(50% - 26px));font-size:12px;font-weight:700;background:var(--ink);color:#fff;padding:3px 8px;border-radius:7px;white-space:nowrap">${esc(mx.quadrant)}</div>
      <div style="position:absolute;left:${mx.potential}%;bottom:${mx.maturity}%;width:18px;height:18px;border-radius:50%;background:var(--accent);border:3px solid #fff;box-shadow:var(--shadow-lg);transform:translate(-50%,50%)"></div>
    </div><div style="text-align:center;font-size:11px;color:var(--muted);font-weight:600;margin-top:6px">GROWTH POTENTIAL →</div></div></div>`;
}
async function vResults(id){
  const d=await api('GET','/api/analyst/engagement/'+id+'/diagnostic');
  const scoreCard=(b,sub)=>{
    if(!b.complete) return `<div class="card pad" style="flex:1;min-width:220px"><div class="tiny">${sub}</div><div style="font-size:22px;font-weight:700;color:var(--muted)">Not fully scored</div><span class="pill amber">${b.scoredAreas}/${b.totalAreas} areas scored</span><div class="muted small" style="margin-top:6px">A grade is shown only once every area is scored — no partial grades.</div></div>`;
    return `<div class="card pad" style="flex:1;min-width:220px"><div class="tiny">${sub}</div><div style="font-size:36px;font-weight:750">${b.total}<span class="muted" style="font-size:15px">/100</span></div><span class="pill accent">${esc(b.grade)}${b.label?' · '+esc(b.label):''}</span>${b.confidence?` <span class="pill">${esc(b.confidence)} confidence</span>`:''}</div>`;
  };
  const list=arr=>arr.length?('<ul style="margin:8px 0 0;padding-left:18px">'+arr.map(c=>`<li>${esc(c.name)} <span class="muted">(${c.score}/${c.weight})</span></li>`).join('')+'</ul>'):'<div class="muted small">Score maturity to see this.</div>';
  const oq=d.opportunities||{};
  const quad=(t,col,items)=>`<div class="card pad"><b style="color:${col}">${t}</b>${(items&&items.length)?items.map(o=>`<div class="qa"><b>${esc(o.title)}</b><div class="muted small">${esc(o.impact)} impact · ${esc(o.effort)} effort</div></div>`).join(''):'<div class="muted small" style="margin-top:6px">—</div>'}</div>`;
  return shell(`<a href="#/e/${id}" class="muted small" style="color:var(--accent)">← Engagement</a>
    <div class="eyebrow" style="margin-top:6px">Diagnostic Results</div><h1 class="h-title">Diagnostic</h1>
    <div class="row wrap" style="margin-top:12px">${scoreCard(d.maturity,'Growth Maturity')}${scoreCard(d.potential,'Growth Potential')}</div>
    <div class="row wrap" style="margin-top:14px"><div class="card pad" style="flex:1;min-width:240px"><div class="tiny" style="color:var(--green)">Strengths</div>${list(d.strengths)}</div><div class="card pad" style="flex:1;min-width:240px"><div class="tiny" style="color:var(--red)">Priority weaknesses</div>${list(d.weaknesses)}</div></div>
    <h2 style="font-size:18px;margin:22px 0 8px">Magic Matrix</h2><div class="card pad">${miniMatrix(d.matrix)}</div>
    <h2 style="font-size:18px;margin:22px 0 8px">Opportunity Matrix <span class="muted" style="font-size:13px;font-weight:400">· auto-generated from weak areas</span></h2>
    <div class="grid" style="grid-template-columns:1fr 1fr">${quad('Quick Wins','var(--green)',oq.quick_win)}${quad('Strategic Initiatives','var(--accent)',oq.strategic)}${quad('Long-Term','var(--amber)',oq.long_term)}${quad('Transformation','#0E7490',oq.transformation)}</div>`,'Diagnostic Results');
}

async function vHistory(id){
  const d=await api('GET','/api/analyst/engagement/'+id+'/history');
  const rows=(d.history||[]).map(h=>`<div class="checkrow"><div><b>${esc(h.detail)}</b><div class="muted small">${esc(h.who)} · ${esc((h.at||'').replace('T',' ').slice(0,16))}</div></div><span class="pill ${h.type==='status'?'accent':''}">${esc(h.type)}</span></div>`).join('')||'<div class="muted">No history recorded yet.</div>';
  return shell(`<a href="#/e/${id}" class="muted small" style="color:var(--accent)">← Engagement</a>
    <div class="eyebrow" style="margin-top:6px">Audit</div><h1 class="h-title">Engagement history</h1>
    <p class="muted">Every status change and staff action on this engagement — who did it, and when. Newest first.</p>
    <div class="card pad" style="margin-top:12px">${rows}</div>`,'History');
}

/* ---- Phase 5: Findings Builder ---- */
async function vFindings(id){
  const d=await api('GET','/api/analyst/engagement/'+id+'/findings');
  const fs=d.findings||[];
  const aiMsg=S.aiMsg; S.aiMsg=null;
  const list=fs.length?fs.map(f=>`<div class="card pad" style="margin-bottom:10px"><div class="between"><b>${esc(f.area)} <span class="pill ${f.severity==='high'?'amber':''}">${esc(f.severity)}</span></b><span style="cursor:pointer;color:var(--muted)" onclick="delFinding('${id}','${f.id}')">✕</span></div>
    <div class="qa"><div class="q">Observation</div><div class="a">${esc(f.observation)}</div></div>
    <div class="qa"><div class="q">Root cause</div><div class="a">${esc(f.root_cause||'')}</div></div>
    <div class="qa"><div class="q">Business impact</div><div class="a">${esc(f.business_impact||'')}</div></div>
    <div class="qa"><div class="q">Opportunity → Action</div><div class="a">${esc(f.opportunity||'')} → ${esc(f.action||'')}</div></div>
    <div class="muted small">Evidence: ${(f.evidence||[]).map(esc).join(', ')||'—'}</div></div>`).join(''):'<div class="muted">No findings yet. Add one below or generate drafts from the weak areas.</div>';
  const fld=(id2,label,ph)=>`<div class="field"><label>${label}</label><input class="input" id="${id2}" placeholder="${ph||''}"></div>`;
  return shell(`<a href="#/e/${id}" class="muted small" style="color:var(--accent)">← Engagement</a>
    <div class="between" style="margin:6px 0;flex-wrap:wrap;gap:8px"><div><div class="eyebrow">Findings Builder</div><h1 class="h-title">Findings</h1></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="fd_ai_btn" onclick="draftFindingsAI('${id}')">✨ Draft findings with AI</button><button class="btn ghost" onclick="genDrafts('${id}')">⚙ Quick drafts (no AI)</button></div></div>
    ${aiMsg?`<div class="card pad" style="border:1px solid var(--accent);background:#EEF2FF;margin-bottom:12px">${esc(aiMsg)}</div>`:''}
    ${list}
    ${fs.length?`<div class="card pad" style="margin-top:14px;background:var(--grad-soft);border-color:#dfe6ff;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap"><div><b>✓ ${fs.length} finding${fs.length>1?'s':''} saved automatically.</b><div class="muted small" style="margin-top:3px">Review them above — remove any with ✕, or add your own below. When you're happy, build the report.</div></div><a class="btn lg" href="#/e/${id}/report">Continue → Build Report →</a></div>`:''}
    <div class="card pad" style="margin-top:14px"><b>Add a finding</b>
      ${fld('fd_area','Area','e.g. Sales Excellence')}
      <div class="field"><label>Observation</label><textarea class="ta" id="fd_obs" style="min-height:60px"></textarea></div>
      ${fld('fd_cause','Root cause')}${fld('fd_impact','Business impact')}${fld('fd_opp','Opportunity')}${fld('fd_action','Action')}
      <div class="row"><div class="field" style="width:160px"><label>Severity</label><select class="sel" id="fd_sev"><option>medium</option><option>high</option><option>low</option></select></div>
      <div class="field" style="flex:1"><label>Evidence (comma-separated)</label><input class="input" id="fd_ev" placeholder="Sales MIS, Discovery responses"></div></div>
      <button class="btn" onclick="addFinding('${id}')">Add finding</button></div>`,'Findings');
}
async function addFinding(id){
  const f={area:$('fd_area').value.trim(),observation:$('fd_obs').value.trim(),root_cause:$('fd_cause').value.trim(),business_impact:$('fd_impact').value.trim(),opportunity:$('fd_opp').value.trim(),action:$('fd_action').value.trim(),severity:$('fd_sev').value,evidence:$('fd_ev').value.split(',').map(s=>s.trim()).filter(Boolean)};
  if(!f.area||!f.observation){alert('Area and Observation are required.');return;}
  await api('POST','/api/analyst/engagement/'+id+'/findings',f); render();
}
async function genDrafts(id){ if(_busy)return; _busy=true; try{ await api('POST','/api/analyst/engagement/'+id+'/findings/generate'); render(); }catch(e){ alert(e.message); }finally{_busy=false;} }
async function draftFindingsAI(id){
  const model=await aiPick('Findings'); if(!model)return;
  const fast=model.includes('haiku');
  const btn=document.getElementById('fd_ai_btn'); if(btn){btn.disabled=true;btn.textContent='✨ Reading the answers… ('+(fast?'~20s':'up to ~2 min')+')';}
  try{
    const d=await api('POST','/api/analyst/engagement/'+id+'/findings/draft-ai',{model});
    if(d.available===false){ alert(d.error||'AI is not configured.'); return; }
    if(d.error){ alert('AI findings failed: '+d.error); return; }
    S.aiMsg='✨ AI drafted '+d.count+' findings ('+(d.model||'')+') grounded in the client’s answers, and saved them automatically. Review below — remove any with ✕ or add your own — then click “Continue → Build Report”.';
    render();
  }catch(e){ alert('AI findings failed: '+e.message); }
  finally{ if(btn){btn.disabled=false;btn.textContent='✨ Draft findings with AI';} }
}
async function delFinding(id,fid){ await api('DELETE','/api/analyst/finding/'+fid); render(); }

/* ---- Phase 5: Report ---- */
async function vReport(id){
  const d=await api('GET','/api/analyst/engagement/'+id+'/report');
  if(!d.report){
    return shell(`<a href="#/e/${id}" class="muted small" style="color:var(--accent)">← Engagement</a>
      <div class="eyebrow" style="margin-top:6px">Report Generation</div><h1 class="h-title">Build the diagnostic report</h1>
      <p class="muted">The report is assembled entirely from the scores, findings, and opportunity matrix — no numbers are invented. You can edit the narrative sections before publishing.</p>
      <button class="btn lg" onclick="genReport('${id}')">⚙ Generate report</button>`,'Report');
  }
  S.report=d.report; const s=d.sections, st=d.report.status, locked=st==='published';
  const ex=s.executive_summary.content, ed=k=>d.editable.includes(k)&&!locked;
  const cat=(arr)=>arr.map(c=>`<tr><td style="padding:4px 8px">${esc(c.name)}</td><td style="padding:4px 8px" class="kpi">${c.score==null?'—':c.score}/${c.weight}</td></tr>`).join('');
  const sw=s.strengths_weaknesses.content;
  const findings=s.key_findings.content||[];
  const opp=s.opportunity_matrix.content||{};
  const oq=(t,items)=>`<div><div class="tiny">${t}</div>${(items&&items.length)?items.map(o=>`<div class="small">• ${esc(o.title)}</div>`).join(''):'<div class="muted small">—</div>'}</div>`;
  const plan=s.ninety_day_plan.content||[], road=s.twelve_month_roadmap.content||[], kpis=s.kpi_framework.content||[], budget=s.budget_allocation.content||[];
  const recs=s.strategic_recommendations.content||[];
  const statusPill = locked
    ? '<span class="pill green">● Published — visible to client</span>'
    : (st==='approved'
        ? '<span class="pill green">✓ Approved — ready to publish</span>'
        : '<span class="pill amber">Draft — not visible to client</span>');
  const actions = locked ? '' : (
    `<button class="btn ghost" id="ai_rep_btn" onclick="narrateReport('${id}')">✨ Rewrite with AI</button>`
    + `<button class="btn ghost" onclick="genReport('${id}')">Regenerate</button>`
    + (st==='approved'
        ? `<button class="btn ghost" disabled style="opacity:.55;cursor:default">✓ Approved</button><button class="btn" onclick="publishReport('${id}')">Publish → Deliver</button>`
        : `<button class="btn" onclick="approveReport()">Approve →</button><button class="btn ghost" disabled title="Approve the report first" style="opacity:.5;cursor:not-allowed">Publish → Deliver</button>`)
  );
  const ctrl=`<div class="card pad" style="margin-bottom:16px"><div class="between"><div><div class="tiny">Report status</div><b style="font-size:16px">${st.charAt(0).toUpperCase()+st.slice(1)} · v${d.report.version}</b> ${statusPill}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${actions}</div></div></div>`;
  const aiMsg=S.aiMsg; S.aiMsg=null;
  return shell(`<a href="#/e/${id}" class="muted small" style="color:var(--accent)">← Engagement</a>
    <div class="eyebrow" style="margin-top:6px">Diagnostic Report</div><h1 class="h-title">Report</h1>
    ${ctrl}
    ${aiMsg?`<div class="card pad" style="border:1px solid var(--accent);background:#EEF2FF;margin-bottom:12px">${esc(aiMsg)}</div>`:''}
    <div class="card pad" style="margin-bottom:12px"><b>Executive Summary</b> ${ed('executive_summary')?'<span class="muted small">(editable)</span>':''}
      ${['situation','diagnosis','impact','opportunity'].map(k=>`<div class="field"><label>${k[0].toUpperCase()+k.slice(1)}</label><textarea class="ta" id="ex_${k}" style="min-height:54px" ${ed('executive_summary')?'':'readonly'}>${esc(ex[k]||'')}</textarea></div>`).join('')}
      <div class="field"><label>Prescription (one per line)</label><textarea class="ta" id="ex_presc" style="min-height:60px" ${ed('executive_summary')?'':'readonly'}>${esc((ex.prescription||[]).join('\n'))}</textarea></div>
      ${ed('executive_summary')?`<button class="btn ghost" onclick="saveExec()">Save Executive Summary</button>`:''}</div>
    <div class="card pad" style="margin-bottom:12px"><b>Business Reality</b><textarea class="ta" id="biz_real" style="min-height:80px;margin-top:8px" ${ed('business_reality')?'':'readonly'}>${esc(s.business_reality.content)}</textarea>${ed('business_reality')?`<button class="btn ghost" onclick="saveSection('business_reality',document.getElementById('biz_real').value)">Save</button>`:''}</div>
    <div class="card pad" style="margin-bottom:12px"><b>Diagnostic Scores</b> <span class="muted small">(auto from scores)</span>
      <div class="row wrap" style="margin-top:6px"><div style="flex:1"><div class="tiny">Maturity ${s.diagnostic_scores.content.maturity.total}/100 · ${esc(s.diagnostic_scores.content.maturity.grade)}</div><table>${cat(s.diagnostic_scores.content.maturity.categories)}</table></div>
      <div style="flex:1"><div class="tiny">Potential ${s.diagnostic_scores.content.potential.total}/100 · ${esc(s.diagnostic_scores.content.potential.grade)}</div><table>${cat(s.diagnostic_scores.content.potential.categories)}</table></div></div>
      <div class="muted small" style="margin-top:8px">Magic Matrix: <b>${esc(s.magic_matrix.content.quadrant||'pending')}</b></div></div>
    <div class="card pad" style="margin-bottom:12px"><b>Key Findings</b> <span class="muted small">(from Findings Builder)</span>${findings.length?findings.map(f=>`<div class="qa"><b>${esc(f.area)}</b> <span class="pill ${f.severity==='high'?'amber':''}">${esc(f.severity)}</span><div class="small">${esc(f.observation)}</div><div class="muted small">Impact: ${esc(f.business_impact||'')}</div></div>`).join(''):'<div class="muted small">No findings — add them in the Findings Builder.</div>'}</div>
    <div class="card pad" style="margin-bottom:12px"><b>Strategic Recommendations</b> ${ed('strategic_recommendations')?'<span class="muted small">(editable, one per line)</span>':''}<textarea class="ta" id="recs" style="min-height:90px;margin-top:8px" ${ed('strategic_recommendations')?'':'readonly'}>${esc(recs.join('\n'))}</textarea>${ed('strategic_recommendations')?`<button class="btn ghost" onclick="saveSection('strategic_recommendations',document.getElementById('recs').value.split('\\n').map(x=>x.trim()).filter(Boolean))">Save</button>`:''}</div>
    <div class="card pad" style="margin-bottom:12px"><b>Opportunity Matrix</b><div class="grid" style="grid-template-columns:1fr 1fr;margin-top:8px">${oq('Quick Wins',opp.quick_win)}${oq('Strategic',opp.strategic)}${oq('Long-Term',opp.long_term)}${oq('Transformation',opp.transformation)}</div></div>
    <div class="card pad" style="margin-bottom:12px"><b>90-Day Plan</b><table style="margin-top:6px">${plan.map(p=>`<tr><td style="padding:4px 8px;width:70px"><b>${esc(p.weeks)}</b></td><td style="padding:4px 8px">${p.items.map(esc).join(' · ')}</td></tr>`).join('')}</table></div>
    <div class="card pad" style="margin-bottom:12px"><b>12-Month Roadmap</b><table style="margin-top:6px">${road.map(q=>`<tr><td style="padding:4px 8px;width:50px"><b>${esc(q.quarter)}</b></td><td style="padding:4px 8px">${esc(q.objective)}: ${q.initiatives.map(esc).join(', ')}</td></tr>`).join('')}</table></div>
    <div class="row wrap"><div class="card pad" style="flex:1;min-width:240px"><b>KPI Framework</b>${kpis.map(k=>`<div class="small" style="margin-top:4px"><b>${esc(k.layer)}:</b> ${k.items.map(esc).join(', ')}</div>`).join('')}</div>
    <div class="card pad" style="flex:1;min-width:240px"><b>Budget Allocation</b>${budget.map(x=>`<div class="between small" style="margin-top:4px"><span>${esc(x.area)}</span><b>${x.pct}%</b></div>`).join('')}</div></div>`,'Report');
}
let _busy=false; // prevents double-click on mutating actions
async function genReport(id){ if(_busy)return; _busy=true; try{ await api('POST','/api/analyst/engagement/'+id+'/report/generate'); render(); }catch(e){ alert(e.message); }finally{_busy=false;} }
async function narrateReport(id){
  const model=await aiPick('Report narrative'); if(!model)return;
  const fast=model.includes('haiku');
  const btn=document.getElementById('ai_rep_btn'); if(btn){btn.disabled=true;btn.textContent='✨ Writing… ('+(fast?'~30s':'up to ~2 min')+')';}
  try{
    const d=await api('POST','/api/analyst/engagement/'+id+'/report/narrate',{model});
    if(d.available===false){ alert(d.error||'AI is not configured.'); return; }
    if(d.error){ alert('AI rewrite failed: '+d.error); return; }
    S.aiMsg='✨ AI rewrote the narrative sections ('+(d.model||'')+'). Review and edit each section below, then Approve / Publish when you’re happy.';
    render();
  }catch(e){ alert('AI rewrite failed: '+e.message); }
  finally{ if(btn){btn.disabled=false;btn.textContent='✨ Rewrite with AI';} }
}
async function saveSection(key,content){ await api('POST','/api/analyst/report/'+S.report.id+'/section',{key,content}); render(); }
async function saveExec(){ const c={situation:$('ex_situation').value,diagnosis:$('ex_diagnosis').value,impact:$('ex_impact').value,opportunity:$('ex_opportunity').value,prescription:$('ex_presc').value.split('\n').map(x=>x.trim()).filter(Boolean)}; await saveSection('executive_summary',c); }
async function approveReport(){ if(_busy)return; _busy=true; try{ await api('POST','/api/analyst/report/'+S.report.id+'/approve'); render(); }catch(e){ alert(e.message); }finally{_busy=false;} }
async function publishReport(id){ if(_busy)return; if(!confirm('Publish and deliver to the client? This locks the report and notifies the client.'))return; _busy=true; try{ await api('POST','/api/analyst/report/'+S.report.id+'/publish'); render(); }catch(e){ alert(e.message); }finally{_busy=false;} }

function render(){
  let h=location.hash||'';
  if(h==='#/logout'){logout();return;}
  if(!TOK()){ $('app').innerHTML=vLogin(h.includes('signup')); return; }
  $('app').innerHTML='<div style="display:grid;place-items:center;height:100vh" class="muted">Loading…</div>';
  let m; const fail=e=>$('app').innerHTML=shell('<div class="muted">'+esc(e.message)+'</div>','Error');
  if((m=h.match(/^#\/e\/([^/]+)\/score\/(maturity|potential)$/))){ vScore(m[1],m[2]).then(html=>$('app').innerHTML=html).catch(fail); return; }
  if((m=h.match(/^#\/e\/([^/]+)\/results$/))){ vResults(m[1]).then(html=>$('app').innerHTML=html).catch(fail); return; }
  if((m=h.match(/^#\/e\/([^/]+)\/findings$/))){ vFindings(m[1]).then(html=>$('app').innerHTML=html).catch(fail); return; }
  if((m=h.match(/^#\/e\/([^/]+)\/report$/))){ vReport(m[1]).then(html=>$('app').innerHTML=html).catch(fail); return; }
  if((m=h.match(/^#\/e\/([^/]+)\/history$/))){ vHistory(m[1]).then(html=>$('app').innerHTML=html).catch(fail); return; }
  if((m=h.match(/^#\/e\/([^/]+)$/))){ vEngagement(m[1]).then(html=>$('app').innerHTML=html).catch(fail); return; }
  if(h.includes('admin')){ vAdmin().then(html=>$('app').innerHTML=html).catch(fail); return; }
  vQueue().then(html=>$('app').innerHTML=html).catch(e=>{ $('app').innerHTML=vLogin(); });
}
window.addEventListener('hashchange',render);
window.addEventListener('DOMContentLoaded',()=>{ if(!location.hash) location.hash=TOK()?'#/queue':'#/login'; render(); });
