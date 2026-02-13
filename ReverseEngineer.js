/**
 * ReverseEngineer
 * @exports ReverseEngineer
 * @version 1.3.0
 * @description Reverse Engineer is an open-source JavaScript library that allows you to encode/decode and encrypt/decrypt strings
 * @see {@link https://github.com/XHiddenProjects/ReverseEngineer | Documentation}
 */

// ========================= Core Engine =========================
export const ReverseEngineer = class {
  #instance;
  #algorithms;
  #logLevel = 'INFO';

  constructor() {
    this.#instance = false;
    this.#algorithms = [];
  }

  getInstance() {
    if (this.#instance) return this.#instance;
    this.#instance = this;
    return this.#instance;
  }

  setLogLevel(level = 'INFO') {
    const ok = ['DEBUG','INFO','WARN','ERROR','SILENT'];
    if (!ok.includes(level.toUpperCase())) throw new Error(`Invalid log level ${level}`);
    this.#logLevel = level.toUpperCase();
    return this;
  }

  debug(label = 'INFO', message = '', meta) {
    const lv = ['DEBUG','INFO','WARN','ERROR','SILENT'];
    const cur = lv.indexOf(this.#logLevel);
    const inc = lv.indexOf(String(label).toUpperCase());
    if ((inc < cur) || this.#logLevel === 'SILENT') return;
    const ts = new Date().toISOString();
    const prefix = `[${ts}] [${String(label).toUpperCase()}]`;
    const fn = label === 'ERROR' ? console.error
            : label === 'WARN'  ? console.warn
            : label === 'DEBUG' ? console.debug
            : console.info;
    meta !== undefined ? fn(`${prefix} - ${message}`, meta) : fn(`${prefix} - ${message}`);
  }

  #ensureInstanced() {
    if (!this.#instance) throw new Error('Call getInstance() before using ReverseEngineer methods.');
  }

  #hasAlgorithm(algorithm) {
    const name = typeof algorithm === 'string' ? algorithm : new algorithm().constructor.name;
    const n = String(name).toLowerCase();
    return this.#algorithms.some(a => a.algo_name.toLowerCase() === n);
  }

  #getAlgorithm(algorithm) {
    const name = typeof algorithm === 'string' ? algorithm : new algorithm().constructor.name;
    const n = String(name).toLowerCase();
    return this.#algorithms.find(a => a.algo_name.toLowerCase() === n) ?? null;
  }

  add(Algo) {
    if (!this.#instance) throw new Error('You must use the getInstance() before running this');
    const algo = new Algo();
    const ClassName = algo.constructor.name;
    if (!(algo instanceof Algo)) throw new TypeError(`It must be a ${ClassName} class`);
    if (this.#hasAlgorithm(ClassName)) throw new Error(`${ClassName} already exists`);

    const obj = {};
    obj.algo_name = algo.name ?? ClassName;
    obj.algo_version = algo.version ?? '1.0.0';
    obj.algo_description = algo.description ?? '';
    obj.instance = algo;
    obj.__loaded = true;

    if (typeof algo.init === 'function') obj.algo_init = algo.init.bind(algo);
    if (typeof algo.addForwardAlgorithm === 'function') obj.algo_forward = algo.addForwardAlgorithm.bind(algo);
    else throw new ReferenceError(`You are missing "addForwardAlgorithm()" method in ${ClassName}`);
    if (typeof algo.addReverseAlgorithm === 'function') obj.algo_reverse = algo.addReverseAlgorithm.bind(algo);
    else throw new ReferenceError(`You are missing "addReverseAlgorithm()" method in ${ClassName}`);

    // NEW: sniff for UI policy on class/instance
    try {
      let pol = null;
      if (typeof Algo?.UI_POLICY !== 'undefined') {
        pol = (typeof Algo.UI_POLICY === 'function') ? Algo.UI_POLICY() : Algo.UI_POLICY;
      } else if (typeof algo.getUIPolicy === 'function') {
        pol = algo.getUIPolicy();
      } else if (typeof algo.UI_POLICY !== 'undefined') {
        pol = (typeof algo.UI_POLICY === 'function') ? algo.UI_POLICY() : algo.UI_POLICY;
      } else if (typeof algo.uiPolicy !== 'undefined') {
        pol = (typeof algo.uiPolicy === 'function') ? algo.uiPolicy() : algo.uiPolicy;
      }
      if (pol && typeof pol === 'object') obj.uiPolicy = pol;
    } catch {}

    this.#algorithms.push(obj);
    return this;
  }

  remove(Algo = null) {
    if (!Algo) { this.#algorithms = []; return this; }
    const name = typeof Algo === 'string' ? Algo : Algo.name;
    this.#algorithms = this.#algorithms.filter(i => i.algo_name !== name);
    return this;
  }

  init(algorithm, ...params) {
    const name = typeof algorithm === 'string' ? algorithm : new algorithm().constructor.name;
    const a = this.#getAlgorithm(name);
    if (!a?.instance) throw new Error(`${name} has not been instanced`);
    return a.algo_init?.(...params);
  }

  forward(algorithm, ...params) {
    const name = typeof algorithm === 'string' ? algorithm : new algorithm().constructor.name;
    const a = this.#getAlgorithm(name);
    if (!a?.instance) throw new Error(`${name} has not been instanced`);
    return a.algo_forward(...params);
  }

  reverse(algorithm, ...params) {
    const name = typeof algorithm === 'string' ? algorithm : new algorithm().constructor.name;
    const a = this.#getAlgorithm(name);
    if (!a?.instance) throw new Error(`${name} has not been instanced`);
    return a.algo_reverse(...params);
  }

  dispose(algorithm) {
    if (algorithm) {
      this.#ensureInstanced();
      const name = typeof algorithm === 'string' ? algorithm : (algorithm.id ?? algorithm.name);
      const obj = this.#getAlgorithm(name);
      if (obj?.instance?.dispose) obj.instance.dispose();
      this.remove(name);
      return this;
    }
    return this;
  }

  list(){ return this.#algorithms.map(o => o.algo_name); }
  use(...algos){ this.#ensureInstanced(); for (const A in algos) this.add(algos[A]); return this; }
  has(algorithm){ this.#ensureInstanced(); return this.#hasAlgorithm(algorithm); }
  get(algorithm){ this.#ensureInstanced(); const a=this.#getAlgorithm(algorithm); if(!a) return null; const {algo_name, algo_version, algo_description, __loaded}=a; return {algo_name, algo_version, algo_description, __loaded}; }
  count(){ this.#ensureInstanced(); return this.#algorithms.length; }
  clear(){ return this.remove(null); }
  names(){ return this.list(); }

  run(direction, algorithm, ...params){
    this.#ensureInstanced();
    const dir = String(direction).toLowerCase();
    if (!['forward','reverse','init','dispose'].includes(dir)) throw new Error(`Unknown direction "${direction}"`);
    if (dir === 'dispose') return this[dir](algorithm);
    return this[dir](algorithm, ...params);
  }

  pipe(steps, input){
    this.#ensureInstanced();
    return steps.reduce((acc, step)=>{
      const {algo, dir, args = []} = step;
      if (dir === 'forward') return this.forward(algo, acc, ...args);
      if (dir === 'reverse') return this.reverse(algo, acc, ...args);
      if (dir === 'init')    return this.init(algo, acc, ...args);
      if (dir === 'dispose') return this.dispose(algo);
      throw new Error(`Invalid direction: ${dir}`);
    }, input);
  }

  toJSON(){
    this.#ensureInstanced();
    return JSON.stringify(this.#algorithms.map(a=>({name:a.algo_name,version:a.algo_version,description:a.algo_description})), null, 2);
  }

  fromJSON(json, resolver){
    this.#ensureInstanced();
    const list = JSON.parse(json);
    for (const {name} of list){ const Ctor = resolver(name); if (Ctor) this.add(Ctor); }
    return this;
  }

  // ---- NEW: expose/set UI policy ----
  uiPolicy(algorithm){
    this.#ensureInstanced();
    const name = typeof algorithm === 'string' ? algorithm : new algorithm().constructor.name;
    const a = this.#getAlgorithm(name);
    return a?.uiPolicy ?? null;
  }
  setUiPolicy(algorithm, policy){
    this.#ensureInstanced();
    const name = typeof algorithm === 'string' ? algorithm : new algorithm().constructor.name;
    const a = this.#getAlgorithm(name);
    if (!a) throw new Error(`${name} has not been instanced`);
    a.uiPolicy = policy;
    return this;
  }
};

// ========================= Crypto Utilities =========================
export const CryptoUtils = {
  b64ToBytes: (b64)=>Uint8Array.from(atob(b64), c=>c.charCodeAt(0)),
  bytesToB64: (bytes)=>btoa(String.fromCharCode(...bytes)),
  randomBytes: (length)=>{ const a=new Uint8Array(length); crypto.getRandomValues(a); return a; },
  utf8ToBytes: (s)=>new TextEncoder().encode(s),
  bytesToUtf8: (b)=>new TextDecoder().decode(b),
  generateB64Key:(length=32)=>{ const keyBytes = CryptoUtils.randomBytes(length); return CryptoUtils.bytesToB64(keyBytes); }
};

// ========================= GUI =========================
export const ReverseEngineerGUI = class {
  #instance;
  constructor(){ this.#instance=new ReverseEngineer().getInstance(); this.#instance.debug('INFO','GUI Loaded successfully'); }

  setTheme(theme='default'){
    theme = theme.toLowerCase();
    const ok=['default','lagoondrift','sunset','nebula','emerald','graphite','retropop'];
    if(!ok.includes(theme)) throw new Error(`${theme} is not a theme`);
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=`./themes/${theme}.css`;
    document.head.appendChild(link);
    return this;
  }

  build(options={}){
    const inst=this.#instance;
    const opts={ title: options.title ?? 'ReverseEngineer', mount: options.mount ?? document.body, algorithms: options.algos ?? '' };
    if(opts.algorithms) inst.use(...opts.algorithms);

    const mountEl = typeof opts.mount==='string'? document.querySelector(opts.mount): opts.mount;
    if(!mountEl) throw new Error('ReverseEngineerGUI: mount element not found');

    const gui=document.createElement('div'); gui.className='reverse-engineer-gui'; gui.setAttribute('role','application'); gui.tabIndex=0;
    gui.innerHTML = `
<div class="re-gui-shell">
  <header class="re-gui-nav">
    <div class="re-brand" aria-label="${opts.title}">
      <span class="re-logo" aria-hidden="true">⟲</span>
      <h1 class="re-title">${opts.title}</h1>
    </div>
    <div class="re-actions">
      <button type="button" class="re-btn re-refresh" title="Refresh algorithms (Alt+R)" aria-label="Refresh algorithms">Refresh</button>
      <button type="button" class="re-btn re-icon-btn re-theme-toggle" data-mode="auto" title="Theme: Auto (Alt+T)" aria-label="Toggle theme (Auto)">
        <svg class="re-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <g class="icon-auto">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <path d="M8.5 15.5L11.5 8.5h1l3 7h-1.6l-.5-1.2h-3.3l-.5 1.2H8.5zm3.1-2.5h2.1L12.7 10l-1.1 3z" fill="currentColor"/>
          </g>
          <g class="icon-sun">
            <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/>
              <path d="M4.9 4.9l1.4 1.4"/><path d="M17.7 17.7l1.4 1.4"/>
              <path d="M19.1 4.9l-1.4 1.4"/><path d="M6.3 17.7l-1.4 1.4"/>
            </g>
          </g>
          <g class="icon-moon">
            <path d="M15.5 3.5A8 8 0 1 0 20.5 15 6.5 6.5 0 0 1 15.5 3.5z" fill="none" stroke="currentColor" stroke-width="1.5"/>
          </g>
        </svg>
      </button>
    </div>
  </header>
  <div class="re-gui-main">
    <aside class="re-sidebar">
      <div class="re-search">
        <input type="search" class="re-input re-search-input" placeholder="Search algorithms…" aria-label="Search algorithms" />
      </div>
      <div class="re-list-wrap">
        <ul class="re-algo-list" role="listbox" aria-label="Loaded algorithms"></ul>
        <div class="re-empty" hidden>No algorithms loaded yet. Use <code>...build({\n algos: [...algorithms]\n});</code> in your code.</div>
      </div>
    </aside>
    <section class="re-workspace" aria-live="polite">
      <div class="re-panel re-details">
        <h2 class="re-panel-title">Algorithm Details</h2>
        <div class="re-detail-grid">
          <div>
            <label class="re-label">Name</label>
            <div class="re-kv"><span class="re-value" data-field="name">—</span></div>
          </div>
          <div>
            <label class="re-label">Version</label>
            <div class="re-kv"><span class="re-value" data-field="version">—</span></div>
          </div>
          <div class="re-col-span">
            <label class="re-label">Description</label>
            <div class="re-kv"><span class="re-value" data-field="description">—</span></div>
          </div>
        </div>
      </div>
      <div class="re-panel re-runner">
        <h2 class="re-panel-title">Run</h2>
        <form class="re-form" novalidate>
          <div class="re-field-row">
            <div class="re-field">
              <label class="re-label">Direction</label>
              <div class="re-seg">
                <label class="re-seg-item"><input type="radio" name="dir" value="init" /> <span>init</span></label>
                <label class="re-seg-item"><input type="radio" name="dir" value="forward" checked /> <span>forward</span></label>
                <label class="re-seg-item"><input type="radio" name="dir" value="reverse" /> <span>reverse</span></label>
              </div>
              <p class="re-hint">Use <b>init</b> for setup/config; <b>forward</b> / <b>reverse</b> for execution.</p>
            </div>
          </div>
          <div class="re-field-row">
            <div class="re-field">
              <label for="re-input" class="re-label">Input (passed as first argument for forward/reverse)</label>
              <textarea id="re-input" class="re-input re-textarea" rows="4" placeholder="Enter input, e.g. plain text, JSON, or base64"></textarea>
            </div>
          </div>
          <div class="re-field-row">
            <div class="re-field">
              <label for="re-args" class="re-label">Arguments (JSON array preferred; fallback: comma-separated)</label>
              <textarea id="re-args" class="re-input re-textarea" rows="3" placeholder='e.g. ["salt", 10, true] or salt,10,true'></textarea>
              <p class="re-hint">We’ll <code>JSON.parse</code> first; if that fails, we split by commas and auto-cast numbers/booleans/null.</p>
            </div>
          </div>
          <div class="re-actions-row">
            <button type="submit" class="re-btn re-primary" title="Run (Enter)" aria-label="Run">Run</button>
            <button type="button" class="re-btn re-secondary re-clear" aria-label="Clear">Clear</button>
            <button type="button" class="re-btn re-danger re-dispose" aria-label="Dispose algorithm">Dispose</button>
          </div>
        </form>
      </div>
      <div class="re-panel re-output">
        <h2 class="re-panel-title">Output 
          <button type="button" class="re-btn re-icon-btn re-copy" title="Copy output (Alt+C)" aria-label="Copy output" style="margin-left:.5rem">
            <svg class="re-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="9" y="9" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
              <rect x="5" y="5" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
        </h2>
        <pre class="re-code" aria-live="polite"><code class="re-code-content">—</code></pre>
      </div>
    </section>
  </div>
  <footer class="re-footer" role="contentinfo" aria-label="Footer">
    <small>Powered by: <a href="https://github.com/XHiddenProjects/ReverseEngineer" target="_blank" rel="noopener noreferrer">XHiddenProjects</a></small>
  </footer>
</div>`;

    mountEl.insertAdjacentElement('afterbegin', gui);

    const listEl = gui.querySelector('.re-algo-list');
    const emptyEl = gui.querySelector('.re-empty');
    const searchInput = gui.querySelector('.re-search-input');
    const refreshBtn = gui.querySelector('.re-refresh');
    const nameEl = gui.querySelector('[data-field="name"]');
    const verEl = gui.querySelector('[data-field="version"]');
    const descEl = gui.querySelector('[data-field="description"]');
    const formEl = gui.querySelector('.re-form');
    const dirRadios = [...formEl.querySelectorAll('input[name="dir"]')];
    const inputEl = formEl.querySelector('#re-input');
    const argsEl = formEl.querySelector('#re-args');
    const clearBtn = formEl.querySelector('.re-clear');
    const disposeBtn = formEl.querySelector('.re-dispose');
    const outputEl = gui.querySelector('.re-code-content');

    let selected = null; let allNames = [];

    const pretty = (val)=>{
      try{
        if (typeof val === 'string'){
          const maybe = JSON.parse(val);
          return JSON.stringify(maybe, null, 2);
        }
        return typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
      } catch {
        return typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
      }
    };

    const autoCast = (s)=>{
      const t=s.trim();
      if (/^(true|false)$/i.test(t)) return t.toLowerCase()==='true';
      if (/^null$/i.test(t)) return null;
      if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
      return t;
    };

    function normalizeJsonishToJson(src){
      const s0 = src.trim(); if (!s0) return s0; if (!/^[\[\{]/.test(s0)) return s0; let str=s0.replace(/,\s*(?=[\}\]\)])/g,'');
      // unify quotes for keys when missing
      {
        let out=''; const stack=[]; let inStr=false; let esc=false; const expectKeyStack=[];
        const isIdentStart=c=>/[A-Za-z_$]/.test(c); const isIdent=c=>/[A-Za-z0-9_$]/.test(c);
        for(let i=0;i<str.length;i++){
          const ch=str[i];
          if(inStr){ out+=ch; if(esc){esc=false; continue;} if(ch==='\\'){esc=true; continue;} if(ch==='"'){inStr=false;} continue; }
          if(ch==='"'){ inStr=true; out+=ch; continue; }
          if(ch==='{'){ stack.push('object'); expectKeyStack.push(true); out+=ch; continue; }
          if(ch==='['){ stack.push('array'); out+=ch; continue; }
          if(ch==='}'){ if(stack.pop()==='object') expectKeyStack.pop(); out+=ch; continue; }
          if(ch===']'){ stack.pop(); out+=ch; continue; }
          const top = stack[stack.length-1];
          if(top==='object'){
            if(ch===':'){ expectKeyStack[expectKeyStack.length-1]=false; out+=ch; continue; }
            if(ch===','){ expectKeyStack[expectKeyStack.length-1]=true; out+=ch; continue; }
            const expectKey = expectKeyStack[expectKeyStack.length-1];
            if(expectKey){
              if(/\s/.test(ch)){ out+=ch; continue; }
              if(ch==='"'){ inStr=true; out+=ch; continue; }
              if(isIdentStart(ch)){
                let j=i+1; while(j<str.length && isIdent(str[j])) j++;
                const ident=str.slice(i,j);
                let k=j; while(k<str.length && /\s/.test(str[k])) k++;
                if(str[k]===':'){ out+=`"${ident}"`; i=j-1; expectKeyStack[expectKeyStack.length-1]=false; continue; }
              }
            }
          }
          out+=ch;
        }
        str=out;
      }
      return str;
    }

    const parseArgs = (text)=>{
      const raw=text.trim(); if(!raw) return [];
      try{ const j=JSON.parse(raw); return Array.isArray(j)? j: [j]; } catch{}
      const parts=[]; let buf=''; let depth=0; let inStr=false; let quote=''; let esc=false;
      for(let i=0;i<raw.length;i++){
        const ch=raw[i];
        if(inStr){ buf+=ch; if(esc){esc=false; continue;} if(ch==='\\'){esc=true; continue;} if(ch===quote){ inStr=false; quote=''; } continue; }
        if(ch==='"' || ch==='\''){ inStr=true; quote=ch; buf+=ch; continue; }
        if(ch==='{' || ch==='[' || ch==='('){ depth++; buf+=ch; continue; }
        if(ch==='}' || ch===']' || ch===')'){ depth=Math.max(0,depth-1); buf+=ch; continue; }
        if(ch===',' && depth===0){ const tok=buf.trim(); if(tok) parts.push(tok); buf=''; continue; }
        buf+=ch;
      }
      const last=buf.trim(); if(last) parts.push(last);
      return parts.map((p)=>{
        const isWrappedSingle=p.length>=2 && p[0]==='\'' && p[p.length-1]==='\'';
        const isWrappedDouble=p.length>=2 && p[0]==='"' && p[p.length-1]==='"';
        let token=p;
        if((isWrappedSingle||isWrappedDouble) && /^[\[\{].*[\]\}]$/.test(p.slice(1,-1).trim())) token=p.slice(1,-1);
        try{ return JSON.parse(token);} catch{}
        const fixed=normalizeJsonishToJson(token); try{ return JSON.parse(fixed);} catch{}
        return autoCast(token);
      });
    };

    const setOutput = (val)=>{ outputEl.textContent = pretty(val ?? '—'); };
    const setDetails=(meta)=>{ nameEl.textContent = meta?.algo_name ?? '—'; verEl.textContent = meta?.algo_version ?? '—'; descEl.textContent = meta?.algo_description ?? '—'; };

    // ---------- Policy Catalog (built-ins) ----------
    const ALGO_UI_POLICY = {};

    const DEFAULT_POLICY = { requiresInit:false, directions:{ init:{input:false,args:true,inputPh:'—',argsPh:'Algorithm-specific options (JSON)'}, forward:{input:true,args:true,inputPh:'Input',argsPh:'Arguments (JSON or comma-separated)'}, reverse:{input:true,args:true,inputPh:'Input',argsPh:'Arguments (JSON or comma-separated)'} } };

    const initState = new Map();

    // ---- NEW: normalization & persistence for dynamic policies ----
    const deepClone = (o)=>JSON.parse(JSON.stringify(o));
    function normalizePolicy(policy){
      const base = deepClone(DEFAULT_POLICY);
      if(!policy || typeof policy!=='object') return base;
      const out = {...base, ...policy};
      out.requiresInit = !!(policy.requiresInit ?? base.requiresInit);
      const baseDirs = base.directions; const dirs = policy.directions || {};
      out.directions = {
        init:    {...baseDirs.init,    ...(dirs.init    || {})},
        forward: {...baseDirs.forward, ...(dirs.forward || {})},
        reverse: {...baseDirs.reverse, ...(dirs.reverse || {})},
      };
      ['init','forward','reverse'].forEach(k=>{ out.directions[k].input=!!out.directions[k].input; out.directions[k].args=!!out.directions[k].args; });
      return out;
    }

    const BUILTIN_POLICY_SET = new Set(Object.keys(ALGO_UI_POLICY));
    const STORAGE_KEY = 're-ui-policies';

    (function loadUserPolicies(){
      try{
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        Object.entries(saved).forEach(([name,pol])=>{ if(!ALGO_UI_POLICY[name]) ALGO_UI_POLICY[name]=normalizePolicy(pol); });
      }catch{}
    })();

    function persistUserPolicies(){
      try{
        const custom = {};
        Object.keys(ALGO_UI_POLICY).forEach(name=>{ if(!BUILTIN_POLICY_SET.has(name)) custom[name]=ALGO_UI_POLICY[name]; });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
      }catch{}
    }

    function addPolicyFor(name, policy){ if(!policy) return; ALGO_UI_POLICY[name]=normalizePolicy(policy); persistUserPolicies(); }
    function tryAttachAlgoPolicy(name){ try{ const pol = inst.uiPolicy?.(name); if(pol && !ALGO_UI_POLICY[name]) addPolicyFor(name, pol); }catch{} }

    const getPolicy=(name)=> ALGO_UI_POLICY[name] ?? DEFAULT_POLICY;
    const getDirRadio=(val)=> dirRadios.find(r=>r.value===val);

    const setGlobalBusy=(busy)=>{
      formEl.querySelectorAll('input, textarea, button').forEach(el=>{ if(el.classList.contains('re-clear')) return; el.disabled=busy; });
      disposeBtn.disabled=busy;
    };
    const setDisabled=(disable)=> setGlobalBusy(disable);

    function applyUIRules(){
      if(!selected) return;
      const policy=getPolicy(selected);
      const isInitRequired = policy.requiresInit;
      const isInited = !isInitRequired || initState.get(selected)===true;

      let dir = dirRadios.find(r=>r.checked)?.value ?? 'forward';
      const initRadio=getDirRadio('init'), forwardRadio=getDirRadio('forward'), reverseRadio=getDirRadio('reverse');

      if(isInitRequired && !isInited){
        initRadio.disabled=false; forwardRadio.disabled=true; reverseRadio.disabled=true;
        if(dir!=='init'){ initRadio.checked=true; dir='init'; }
      } else {
        initRadio.disabled=!isInitRequired; forwardRadio.disabled=false; reverseRadio.disabled=false;
        if(!isInitRequired && dir==='init'){ forwardRadio.checked=true; dir='forward'; }
      }

      const d = policy.directions[dir] ?? DEFAULT_POLICY.directions[dir];
      inputEl.disabled=!d.input; argsEl.disabled=!d.args;
      inputEl.placeholder = d.inputPh ?? inputEl.placeholder;
      argsEl.placeholder = d.argsPh ?? argsEl.placeholder;
    }

    const renderList=(names)=>{
      listEl.innerHTML='';
      if(!names?.length){ emptyEl.hidden=false; setDetails(null); selected=null; setDisabled(true); return; }
      emptyEl.hidden=true;
      names.forEach(n=>{
        const li=document.createElement('li');
        li.className='re-algo-item'; li.setAttribute('role','option'); li.tabIndex=0; li.dataset.name=n;
        li.innerHTML = `<div class="re-algo-name">${n}</div>`;
        li.addEventListener('click',()=>selectAlgo(n,li));
        li.addEventListener('keydown',(e)=>{ if(e.key==='Enter'|| e.key===' '){ e.preventDefault(); selectAlgo(n,li);} });
        listEl.appendChild(li);
      });
    };

    const selectAlgo=(name, liEl)=>{
      selected=name;
      listEl.querySelectorAll('.re-algo-item[aria-selected="true"]').forEach(el=>el.removeAttribute('aria-selected'));
      if(liEl) liEl.setAttribute('aria-selected','true');
      const meta=inst.get(name);
      setDetails(meta);
      tryAttachAlgoPolicy(name);
      const pol=getPolicy(name);
      if(!initState.has(name)) initState.set(name, !pol.requiresInit);
      setDisabled(false);
      applyUIRules();
      inst.debug('INFO',`Selected algorithm: ${name}`, meta);
    };

    const refresh=()=>{
      allNames = inst.names();
      renderList(allNames);
      allNames.forEach(n=>tryAttachAlgoPolicy(n));
      setOutput('—');
    };

    const filterList=(q)=>{ const term=q.trim().toLowerCase(); renderList(term? allNames.filter(n=>n.toLowerCase().includes(term)) : allNames); };

    refreshBtn.addEventListener('click', refresh);
    searchInput.addEventListener('input', (e)=> filterList(e.target.value));
    gui.addEventListener('keydown', (e)=>{ if(e.altKey && e.key.toLowerCase()==='r'){ e.preventDefault(); refreshBtn.click(); } });
    dirRadios.forEach(r=> r.addEventListener('change', applyUIRules));

    formEl.addEventListener('submit', async (e)=>{
      e.preventDefault();
      if(!selected) return setOutput('Select an algorithm first.');
      const dir = dirRadios.find(r=>r.checked)?.value ?? 'forward';
      const inp = inputEl.value; const args = parseArgs(argsEl.value);
      try{
        setGlobalBusy(true);
        const call = dir==='init'? ()=>inst.init(selected, ...args)
                  : dir==='forward'? ()=>inst.forward(selected, inp, ...args)
                  : dir==='reverse'? ()=>inst.reverse(selected, inp, ...args)
                  : ()=>{ throw new Error(`Unknown direction: ${dir}`); };
        let result = await Promise.resolve(call());

        // If algo returned a runtime UI policy, persist it and hide marker
        if (result && typeof result === 'object' && result.__ui_policy){
          addPolicyFor(selected, result.__ui_policy);
          const {__ui_policy, ...rest} = result; result = rest;
        }
        tryAttachAlgoPolicy(selected);

        setOutput(result);
        if(dir==='init'){ initState.set(selected,true); applyUIRules(); }
        inst.debug('INFO',`Ran ${dir} on ${selected}`, { input: inp, args, result });
      } catch(err){
        inst.debug('ERROR',`Run failed: ${err.message}`, err);
        setOutput({ error: err.message });
      } finally{
        setGlobalBusy(false);
        applyUIRules();
      }
    });

    clearBtn.addEventListener('click', ()=>{ inputEl.value=''; argsEl.value=''; setOutput('—'); inst.debug('DEBUG','Cleared inputs and output'); applyUIRules(); });

    disposeBtn.addEventListener('click', ()=>{ if(!selected) return; try{ inst.dispose(selected); initState.delete(selected); inst.debug('WARN',`Disposed algorithm: ${selected}`); selected=null; refresh(); setDetails(null);} catch(err){ inst.debug('ERROR',`Dispose failed: ${err.message}`, err); setOutput({ error: err.message }); } });

    const themeBtn = gui.querySelector('.re-theme-toggle');
    const THEME_CYCLE=['auto','dark','light'];
    const root=document.documentElement;
    const setThemeAttr=(mode)=>{ if(mode==='auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', mode); themeBtn.dataset.mode=mode; themeBtn.title=`Theme: ${mode[0].toUpperCase()}${mode.slice(1)} (Alt+T)`; themeBtn.setAttribute('aria-label', `Toggle theme (${mode[0].toUpperCase()}${mode.slice(1)})`); try{ localStorage.setItem('re-theme', mode);}catch{} };
    let themeMode = (()=>{ try{ return localStorage.getItem('re-theme') ?? 'auto'; } catch{ return 'auto'; } })(); setThemeAttr(themeMode);
    themeBtn.addEventListener('click', ()=>{ const idx=THEME_CYCLE.indexOf(themeMode); themeMode = THEME_CYCLE[(idx+1)%THEME_CYCLE.length]; setThemeAttr(themeMode); });
    gui.addEventListener('keydown', (e)=>{ if(e.altKey && e.key.toLowerCase()==='t'){ e.preventDefault(); themeBtn.click(); } });

    const copyBtn = gui.querySelector('.re-copy');
    const getOutputPlain=()=> outputEl?.textContent ?? '';
    const doCopy = async ()=>{
      const text=getOutputPlain();
      if(!text || text==='—'){
        inst.debug('WARN','Nothing to copy');
        const prevTitle=copyBtn.title; copyBtn.title='Nothing to copy'; setTimeout(()=> (copyBtn.title=prevTitle), 800); return;
      }
      const showCopied=(ok=true)=>{ const prevTitle=copyBtn.title; copyBtn.title = ok ? 'Copied!' : 'Copy failed'; copyBtn.classList.toggle('is-success', ok); copyBtn.classList.toggle('is-error', !ok); setTimeout(()=>{ copyBtn.title=prevTitle; copyBtn.classList.remove('is-success','is-error'); }, 900); };
      try{
        if(navigator.clipboard?.writeText){ await navigator.clipboard.writeText(text); inst.debug('INFO','Output copied to clipboard'); showCopied(true); return; }
        const range=document.createRange(); range.selectNodeContents(outputEl); const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(range); const ok=document.execCommand('copy'); sel.removeAllRanges(); inst.debug(ok?'INFO':'WARN', ok?'Output copied (fallback)':'Fallback copy returned false'); showCopied(ok);
      } catch(err){ inst.debug('ERROR',`Copy failed: ${err.message}`, err); showCopied(false); }
    };
    copyBtn.addEventListener('click', doCopy);
    gui.addEventListener('keydown', (e)=>{ if(e.altKey && e.key.toLowerCase()==='c'){ e.preventDefault(); doCopy(); } });

    refresh();
    return gui;
  }
};