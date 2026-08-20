let chats=JSON.parse(localStorage.getItem("FAHD_CHATS")||"[]"),current=localStorage.getItem("FAHD_CURRENT")||"";
let settings=Object.assign({model:"",lang:"auto",theme:"light",provider:"ollama",apiKey:"",cloudModel:""},JSON.parse(localStorage.getItem("FAHD_SETTINGS")||"{}"));
let modelInfo={};
let attachments=[];
const QUICKIES=[["🧠 Explain","How does AI work?"],["🌐 Website","Build me a website"],["💻 Code","Help me write JavaScript"],["📚 Study","Make a study plan"]];
const SYSTEM_PROMPT="You are Fahd AI, a capable, friendly AI assistant. Be accurate, honest, and helpful. Think step by step before answering complex questions. Use Markdown for structure: headings, lists, tables, and code blocks when useful. When the user attaches a file (text or image), read it carefully and use it as the main source. For coding requests, give complete, working, idiomatic solutions with brief explanations. If you are not sure about something, say so instead of guessing. Answer in the same language the user writes in.";
const PROVIDERS={
  openai:{label:"OpenAI",models:["gpt-4o-mini","gpt-4o","gpt-4.1-mini","gpt-4.1","gpt-4.1-nano"]},
  gemini:{label:"Google Gemini",models:["gemini-3.7-flash","gemini-3.6-flash","gemini-3.5-flash","gemini-3.1-flash-lite","gemini-2.5-pro","gemini-3.1-pro-preview"]},
  anthropic:{label:"Anthropic Claude",models:["claude-3-5-haiku-latest","claude-3-5-sonnet-latest","claude-haiku-4-5-20251001","claude-sonnet-4-20250514"]}
};
function isCloud(){return settings.provider&&settings.provider!=="ollama"}
const $=x=>document.getElementById(x);
function save(){localStorage.setItem("FAHD_CHATS",JSON.stringify(chats));localStorage.setItem("FAHD_CURRENT",current);localStorage.setItem("FAHD_SETTINGS",JSON.stringify(settings))}
function active(){return chats.find(x=>x.id===current)}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function newChat(){let c={id:Date.now().toString(),title:"New chat",messages:[]};chats.unshift(c);current=c.id;save();render();$("input").focus()}
function drawHistory(){
  let q=($("find").value||"").toLowerCase();
  $("history").innerHTML=chats.filter(c=>c.title.toLowerCase().includes(q)).map(c=>
    `<div class="chat ${c.id===current?"active":""}" data-id="${c.id}" onclick="openChat('${c.id}')">
       <span class="t">${esc(c.title)}</span>
       <span class="ops">
         <button title="Rename" onclick="event.stopPropagation();renameChat('${c.id}')">✎</button>
         <button title="Delete" onclick="event.stopPropagation();deleteChat('${c.id}')">🗑</button>
       </span>
     </div>`).join("")||`<div style="color:var(--muted);font-size:13px;padding:10px">No chats found</div>`;
}
function openChat(id){current=id;save();render()}
function renameChat(id){
  let wrap=document.querySelector(`.chat[data-id="${id}"]`);
  let t=wrap&&wrap.querySelector(".t");if(!t)return;
  let inp=document.createElement("input");
  inp.value=t.textContent;inp.className="ri";inp.maxLength=80;
  inp.style.cssText="border:1px solid var(--border);border-radius:8px;padding:5px 7px;font:inherit;font-size:13px;width:100%;outline:none;background:var(--panel);color:var(--text)";
  inp.onclick=e=>e.stopPropagation();
  t.replaceWith(inp);inp.focus();inp.select();
  let done=false;
  let commit=()=>{
    if(done)return;done=true;
    let v=inp.value.trim();
    let c=chats.find(x=>x.id===id);
    if(c&&v){c.title=v;save()}
    drawHistory();
  };
  inp.onkeydown=e=>{
    e.stopPropagation();
    if(e.key==="Enter")commit();
    if(e.key==="Escape"){done=true;drawHistory()}
  };
  inp.onblur=commit;
}
function deleteChat(id){
  if(!confirm("Delete this chat?"))return;
  chats=chats.filter(x=>x.id!==id);
  if(current===id){current=chats.length?chats[0].id:""}
  save();render();
}
function clearAll(){
  if(!chats.length)return;
  if(!confirm("Delete ALL chats and history? This cannot be undone."))return;
  chats=[];current="";attachments=[];save();render();
}
function render(){
  drawHistory();let c=active();let box=$("inner");box.innerHTML="";
  if(!c||!c.messages.length){
    let w=document.createElement("div");w.className="welcome";
    let h=document.createElement("h1");h.textContent="What can I help you with? ✨";
    let p=document.createElement("p");p.textContent="Ask me anything — local AI, no API key needed.";
    let q=document.createElement("div");q.className="quick";
    for(const [emoji,label] of QUICKIES){let b=document.createElement("button");b.textContent=emoji+" "+label;b.onclick=()=>quick(label);q.appendChild(b)}
    w.append(h,p,q);box.appendChild(w);return;
  }
  for(const m of c.messages){
    let d=document.createElement("div");d.className="msg "+m.role;
    d.innerHTML=`<div class="avatar">${m.role==="user"?"F":"✦"}</div><div class="bubble"></div>`;
    if(m.files&&m.files.length){
      let f=document.createElement("div");f.className="files";
      f.innerHTML=m.files.map(x=>`<span class="filechip">📎 ${esc(x.name)}</span>`).join("");
      d.insertBefore(f,d.querySelector(".bubble"));
    }
    let b=d.querySelector(".bubble");
    if(m.role==="assistant"){
      b.innerHTML='<span class="c"></span><span class="acts"><button class="actbtn" title="Copy reply">📋</button><button class="speakbtn" title="Read aloud">🔊</button></span>';
      b.querySelector(".c").textContent=m.content;
      let cb=b.querySelector(".actbtn"),s=b.querySelector(".speakbtn");
      if(!m.content){cb.style.display="none";s.style.display="none"}
      cb.onclick=()=>{copyText(m.content);cb.textContent="✅";setTimeout(()=>cb.textContent="📋",1200)};
      s.onclick=()=>speak(m.content,s);
    }else{
      b.textContent=m.content;
    }
    box.appendChild(d);
  }
  $("inner").parentElement.scrollTop=999999;
}
function quick(x){$("input").value=x;send()}
function key(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}}

/* ---------- Attachments ---------- */
function pickFiles(){$("filepick").value="";$("filepick").click()}
function addFiles(files){
  for(const f of files){
    if(attachments.length>=4){alert("Max 4 attachments per message.");break}
    if(f.size>8*1024*1024){alert(f.name+" is larger than 8 MB.");continue}
    if(f.type.startsWith("image/")){
      let mi=modelInfo[settings.model];
      if(settings.model&&mi&&!mi.vision){
        if(!confirm("The selected model ("+settings.model+") does not support images.\nSwitch to a vision model like llava or qwen2.5vl? Click OK to attach anyway."))continue;
      }
    }
    let reader=new FileReader();
    reader.onload=()=>{
      attachments.push({name:f.name,type:f.type.startsWith("image/")?"image":"text",data:(reader.result||"").split(",")[1]||""});
      drawAttach();
    };
    reader.readAsDataURL(f);
  }
}
function drawAttach(){
  $("attached").innerHTML=attachments.map((a,i)=>
    `<span class="filechip">${a.type==="image"?"🖼":"📎"} ${esc(a.name)} <button onclick="removeAttach(${i})" title="Remove">✕</button></span>`
  ).join("");
}
function removeAttach(i){attachments.splice(i,1);drawAttach()}

/* ---------- Voice ---------- */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
let rec=null;
function mic(){
  if(!SR){alert("Voice input needs Chrome or Edge browser.");return}
  if(rec){try{rec.stop()}catch{};return}
  try{
    rec=new SR();
    rec.lang=settings.lang==="auto"?"en-US":settings.lang;
    rec.interimResults=true;rec.continuous=false;
    rec.onresult=e=>{let t="";for(const r of e.results)t+=r[0].transcript;$("input").value=t;$("input").focus()};
    rec.onend=()=>{rec=null;$("micbtn").classList.remove("rec")};
    rec.onerror=e=>{
      rec=null;$("micbtn").classList.remove("rec");
      if(e.error==="not-allowed")alert("Microphone permission denied. Click the lock icon in the address bar and allow the microphone.");
      else if(e.error==="no-speech")alert("No speech detected. Try again and speak louder.");
    };
    rec.start();$("micbtn").classList.add("rec");
  }catch(e){alert("Voice input failed: "+e.message)}
}
function pickVoice(){
  if(!("speechSynthesis" in window))return null;
  let vs=speechSynthesis.getVoices();
  if(!vs.length)return null;
  if(settings.lang==="auto")return vs.find(v=>v.lang.toLowerCase().startsWith("en"))||vs[0];
  let lang=settings.lang.split("-")[0].toLowerCase();
  return vs.find(v=>v.lang.toLowerCase().startsWith(lang))||vs[0];
}
function speak(text,btn){
  if(!("speechSynthesis" in window)||!text)return;
  if(speechSynthesis.speaking){speechSynthesis.cancel();if(btn)btn.textContent="🔊";return}
  let u=new SpeechSynthesisUtterance(text);
  let v=pickVoice();
  if(v){u.voice=v;u.lang=v.lang}
  if(btn)btn.textContent="🔇";
  u.onend=()=>{if(btn)btn.textContent="🔊"};
  u.onerror=()=>{if(btn)btn.textContent="🔊"};
  speechSynthesis.speak(u);
}
function copyText(t){try{navigator.clipboard&&navigator.clipboard.writeText(t)}catch{}}

/* ---------- Models ---------- */
async function loadModels(){
  try{
    let r=await fetch("/api/models");let d=await r.json();
    let sel=$("modelsel");sel.innerHTML="";
    if(!d.models.length){sel.innerHTML='<option value="">No models installed</option>'}
    for(const m of d.models){
      modelInfo[m.name]=m;
      let b=(m.vision?"👁 ":"")+(m.tools?"⚙️ ":"");
      let o=document.createElement("option");o.value=m.name;o.textContent=m.name+(b?"("+b.trim()+")":"");
      if(m.name===settings.model)o.selected=true;
      sel.appendChild(o);
    }
    if(!settings.model&&d.models.length){settings.model=d.models[0].name;save()}
    if(sel.value)settings.model=sel.value;
    $("modelcap").textContent=modelInfo[settings.model]?"Capabilities: "+(modelInfo[settings.model].vision?"vision ":"")+(modelInfo[settings.model].tools?"tools ":"")||"none":"Download a model below to get started.";
  }catch(e){
    $("errbox").textContent="Could not reach Ollama. Make sure it is running.";$("errbox").style.display="block";
  }
  buildReco();
  updateHeaderModel();
}
function buildReco(){
  let rec=[["llama3.2","Fast default"],["qwen2.5:3b","Fast + strong"],["qwen2.5:7b","Stronger"],["llava","Vision (images)"]];
  $("reco").innerHTML="Recommended: "+rec.map(r=>`<button onclick="downloadReco('${r[0]}')">${r[0]}</button>`).join(" ");
}
function downloadReco(m){$("pullname").value=m;pullModel()}
async function pullModel(){
  let m=$("pullname").value.trim();if(!m)return;
  let out=$("pullout");out.style.display="block";out.textContent="Downloading "+m+"...\n";
  $("errbox").style.display="none";
  try{
    let r=await fetch("/api/pull",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:m})});
    if(!r.body)throw new Error("No response");
    let rd=r.body.getReader(),dec=new TextDecoder();
    while(true){let {done,value}=await rd.read();if(done)break;out.textContent+=dec.decode(value);out.scrollTop=out.scrollHeight}
    out.textContent+="\n✓ Refreshing list...";
    await loadModels();
  }catch(e){out.textContent+="\nError: "+e.message}
}
function setModel(v){settings.model=v;save();$("modelcap").textContent=modelInfo[v]?"Capabilities: "+(modelInfo[v].vision?"vision ":"")+(modelInfo[v].tools?"tools ":"")||"none":"";updateHeaderModel()}
function updateHeaderModel(){
  if(isCloud())$("modelname").textContent=(settings.cloudModel||"choose model")+" ☁️";
  else $("modelname").textContent=settings.model||"choose model";
}
function setLang(v){settings.lang=v;save()}
function populateModelPresets(){
  const p=PROVIDERS[settings.provider];
  $("modelpresets").innerHTML=p?p.models.map(m=>`<option value="${m}">`).join(""):"";
}
function applyProviderUI(){
  const cloud=isCloud();
  $("cloudfields").style.display=cloud?"block":"none";
  $("ollamafields").style.display=cloud?"none":"block";
  if(cloud){
    $("apikey").value=settings.apiKey||"";
    $("cloudmodel").value=settings.cloudModel||"";
    $("apikey").placeholder=settings.provider==="openai"?"sk-…":settings.provider==="gemini"?"AIza…":"sk-ant-…";
    populateModelPresets();
  }
  updateHeaderModel();
  $("banner").innerHTML="";
  checkBackend();
}
function setProvider(v){settings.provider=v;save();applyProviderUI()}
function saveCloud(){
  settings.apiKey=$("apikey").value.trim();
  settings.cloudModel=$("cloudmodel").value.trim();
  save();updateHeaderModel();
  let t=$("cloudtest");t.textContent="✓ Saved to this browser";t.style.color="#10b981";
  setTimeout(()=>t.textContent="",2500);
}
function pickCloudModel(n){settings.cloudModel=n;save();updateHeaderModel();closeModelMenu();let m=$("cloudmodel");if(m)m.value=n}
function openSettings(){$("overlay").classList.add("open");$("langsel").value=settings.lang;$("provsel").value=settings.provider||"ollama";applyProviderUI();loadModels()}
function closeSettings(){$("overlay").classList.remove("open")}
function populateModelMenu(){
  if(isCloud()){
    const p=PROVIDERS[settings.provider];
    const presets=p?p.models:[];
    $("modellist").innerHTML=presets.map(n=>`<div class="modelitem" onclick="pickCloudModel('${n}')"><span>${n}</span>${n===(settings.cloudModel||"")?'<span class="ck">✓</span>':""}</div>`).join("")+`<div style="padding:9px 10px;font-size:11px;color:var(--muted)">Type any model in Settings → Model</div>`;
    return;
  }
  let names=Object.keys(modelInfo);
  $("modellist").innerHTML=names.length?names.map(n=>
    `<div class="modelitem" onclick="pickModel('${n.replace(/'/g,"\\'")}')"><span>${esc(n)}${modelInfo[n].vision?" 👁":""}</span>${n===settings.model?'<span class="ck">✓</span>':""}</div>`
  ).join(""):`<div style="padding:10px;color:var(--muted);font-size:12px">No models installed — manage below.</div>`;
}
function pickModel(n){setModel(n);closeModelMenu()}
function toggleModels(){if(!$("modelmenu").classList.contains("hidden"))return closeModelMenu();populateModelMenu();$("modelmenu").classList.remove("hidden")}
function closeModelMenu(){$("modelmenu").classList.add("hidden")}
document.addEventListener("click",e=>{if(!e.target.closest(".mwrap"))closeModelMenu()});

/* ---------- Theme + drawer ---------- */
function applyTheme(){document.documentElement.dataset.theme=settings.theme||"light";let b=$("themebtn");if(b)b.textContent=(settings.theme||"light")==="dark"?"☀️":"🌙"}
function toggleTheme(){settings.theme=(settings.theme||"light")==="dark"?"light":"dark";applyTheme();save()}
function toggleSide(){document.getElementById("side").classList.toggle("open");document.getElementById("backdrop").classList.toggle("open")}

/* ---------- Chat ---------- */
let streamEl=null;
function updateStream(text){
  if(!streamEl){let els=document.querySelectorAll(".msg.assistant .bubble .c");streamEl=els[els.length-1]}
  if(streamEl){streamEl.textContent=text+"▋";$("inner").parentElement.scrollTop=999999}
}
function setStatus(state,text){
  let s=$("status");
  s.className="status"+(state==="err"?" err":state==="busy"?" busy":"");
  $("statustext").textContent=text;
}
async function chatLocal(c,atts){
  const body={messages:c.messages,attachments:atts,model:settings.model||undefined};
  const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(!r.ok||!r.body){let d;try{d=await r.json()}catch{};throw new Error((d&&d.error)||("Server error "+r.status))}
  let rd=r.body.getReader(),dec=new TextDecoder(),buf="",out="",err=null;
  while(true){
    let {done,value}=await rd.read();if(done)break;
    buf+=dec.decode(value,{stream:true});
    let i;
    while((i=buf.indexOf("\n"))>=0){
      let line=buf.slice(0,i);buf=buf.slice(i+1);
      if(!line.trim())continue;
      try{
        let o=JSON.parse(line);
        if(o.d!=null){out+=o.d;updateStream(out);setStatus("busy","Generating…")}
        else if(o.error){err=o.error}
      }catch{}
    }
  }
  if(err)throw new Error(err);
  return out;
}
async function send(){
  let el=$("input"),text=el.value.trim();
  if(!text&&!attachments.length)return;
  if(!current)newChat();
  let c=active();
  c.messages.push({role:"user",content:text,files:attachments.map(a=>({name:a.name,type:a.type}))});
  if(c.title==="New chat")c.title=(text||attachments[0].name).slice(0,50);
  let atts=attachments.slice();
  attachments=[];el.value="";drawAttach();
  c.messages.push({role:"assistant",content:""});
  save();render();streamEl=null;
  setStatus("busy","Thinking…");
  try{
    let out=isCloud()?await chatRemote(c,atts):await chatLocal(c,atts);
    c.messages[c.messages.length-1].content=out;
    setStatus("",isCloud()?"Ready · ☁️ "+settings.provider:"Ready");
    save();render();
  }catch(e){
    setStatus("err","Error");
    c.messages[c.messages.length-1].content="❌ "+e.message;save();render();
  }
}

/* ---------- Cloud providers (OpenAI / Gemini / Anthropic) ---------- */
function decodeB64(s){
  try{
    const bin=atob(s||"");const bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }catch{return ""}
}
function prepareCloudMessages(history,attachments){
  const list=history.filter(m=>!(m.role==="assistant"&&!m.content)).map(m=>({role:m.role,content:m.content,files:m.files}));
  const textParts=[],imgs=[];
  for(const a of attachments){
    if(a.type==="text")textParts.push(`[Attachment: ${a.name}]
${decodeB64(a.data)}`);
    else imgs.push(a);
  }
  let idx=-1;
  for(let i=list.length-1;i>=0;i--)if(list[i].role==="user"){idx=i;break}
  if(idx>=0){
    if(textParts.length)list[idx].content=(list[idx].content?list[idx].content+"\n\n":"")+textParts.join("\n\n");
    list[idx].images=imgs;
  }else{
    list.push({role:"user",content:textParts.join("\n\n")||" ",images:imgs});
  }
  return list;
}
async function readSSE(r,onDelta,onDone){
  const rd=r.body.getReader(),dec=new TextDecoder();let buf="";
  while(true){
    const {done,value}=await rd.read();if(done)break;
    buf+=dec.decode(value,{stream:true});
    let i;
    while((i=buf.indexOf("\n"))>=0){
      const line=buf.slice(0,i).trim();buf=buf.slice(i+1);
      if(!line.startsWith("data:"))continue;
      const p=line.slice(5).trim();
      if(p==="[DONE]"){if(onDone)onDone();return}
      if(!p)continue;
      try{onDelta(JSON.parse(p))}catch{}
    }
  }
}
async function errFrom(r){
  let msg="HTTP "+r.status;
  try{const j=await r.json();msg=(j.error&&(j.error.message||j.error))||j.message||msg}catch{}
  return msg;
}
async function openaiChat(history,attachments,key,model){
  const list=prepareCloudMessages(history,attachments);
  const msgs=[{role:"system",content:SYSTEM_PROMPT}];
  for(const m of list){
    if(m.role==="user"&&m.images&&m.images.length){
      const parts=[{type:"text",text:m.content||"Describe this image."}];
      for(const im of m.images)parts.push({type:"image_url",image_url:{url:"data:image/jpeg;base64,"+im.data}});
      msgs.push({role:"user",content:parts});
    }else msgs.push({role:m.role,content:m.content});
  }
  const r=await fetch("https://api.openai.com/v1/chat/completions",{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
    body:JSON.stringify({model,messages:msgs,stream:true})
  });
  if(!r.ok||!r.body)throw new Error(await errFrom(r));
  let out="";
  await readSSE(r,o=>{
    const d=o.choices&&o.choices[0]&&o.choices[0].delta;
    if(d&&typeof d.content==="string"){out+=d.content;updateStream(out);setStatus("busy","Generating…")}
  });
  return out;
}
async function geminiChat(history,attachments,key,model){
  const list=prepareCloudMessages(history,attachments);
  const contents=list.map(m=>({
    role:m.role==="assistant"?"model":"user",
    parts:(()=>{
      const parts=[];
      if(m.content)parts.push({text:m.content});
      if(m.images)for(const im of m.images)parts.push({inline_data:{mime_type:"image/jpeg",data:im.data}});
      return parts.length?parts:[{text:" "}];
    })()
  }));
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({contents,systemInstruction:{parts:[{text:SYSTEM_PROMPT}]}})
  });
  if(!r.ok||!r.body)throw new Error(await errFrom(r));
  let out="";
  await readSSE(r,o=>{
    const cand=o.candidates&&o.candidates[0];
    if(cand&&cand.content&&cand.content.parts){
      const t=cand.content.parts.map(p=>p.text||"").join("");
      if(t){out=t;updateStream(out);setStatus("busy","Generating…")}
    }
  });
  return out;
}
async function anthropicChat(history,attachments,key,model){
  const list=prepareCloudMessages(history,attachments);
  const msgs=list.map(m=>{
    if(m.role==="user"&&m.images&&m.images.length){
      const content=[{type:"text",text:m.content||"Describe this image."}];
      for(const im of m.images)content.push({type:"image",source:{type:"base64",media_type:"image/jpeg",data:im.data}});
      return {role:"user",content};
    }
    return {role:m.role,content:m.content};
  });
  const r=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",
    headers:{"Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01"},
    body:JSON.stringify({model,max_tokens:2048,system:SYSTEM_PROMPT,messages:msgs,stream:true})
  });
  if(!r.ok||!r.body)throw new Error(await errFrom(r));
  let out="";
  await readSSE(r,o=>{
    if(o.type==="content_block_delta"&&o.delta&&typeof o.delta.text==="string"){out+=o.delta.text;updateStream(out);setStatus("busy","Generating…")}
  });
  return out;
}
async function chatRemote(c,attachments){
  const key=(settings.apiKey||"").trim();
  if(!key)throw new Error("Add your API key first: Settings (⚙️) → API Key.");
  const model=(settings.cloudModel||"").trim();
  if(!model)throw new Error("Choose a cloud model in Settings (⚙️).");
  const history=c.messages.filter(m=>!(m.role==="assistant"&&!m.content));
  if(settings.provider==="openai")return openaiChat(history,attachments,key,model);
  if(settings.provider==="gemini")return geminiChat(history,attachments,key,model);
  return anthropicChat(history,attachments,key,model);
}

/* ---------- Backend check (static hosting detection) ---------- */
async function checkBackend(){
  if(isCloud()){setStatus("","Ready · ☁️ "+settings.provider);return}
  try{
    let r=await fetch("/api/health",{signal:AbortSignal.timeout(2500)});
    if(!r.ok)throw 0;
  }catch{
    let b=document.createElement("div");b.className="staticbanner";
    b.innerHTML="🌐 <b>Online demo mode</b> — no local Ollama here. To use AI on this site, open <b>Settings (⚙️) → AI Provider</b> and add a cloud provider (OpenAI / Gemini / Claude) with your own key.";
    $("banner").appendChild(b);
    setStatus("err","Offline");
  }
}

/* ---------- Init ---------- */
render();
loadModels();
checkBackend();
applyTheme();
if("speechSynthesis" in window){speechSynthesis.getVoices();speechSynthesis.onvoiceschanged=()=>{}}