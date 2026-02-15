/**
 * @module ReverseEngineer
 * @version 1.4.0
 * @description ReverseEngineer is an open-source JavaScript library that allows you to encode/decode and encrypt/decrypt strings,
 * and provides a small GUI to experiment with loaded algorithms.
 * @see https://github.com/XHiddenProjects/ReverseEngineer
 */

/**
 * A log level used by the engine.
 * @typedef {'DEBUG'|'INFO'|'WARN'|'ERROR'|'SILENT'} LogLevel
 */

/**
 * Direction in which to run an algorithm.
 * @typedef {'init'|'forward'|'reverse'|'dispose'} Direction
 */

/**
 * A constructor for an algorithm plug‑in class.
 * The instance is expected to expose:
 * - `addForwardAlgorithm(input, ...args)` (required)
 * - `addReverseAlgorithm(input, ...args)` (required)
 * - `init(...args)` (optional)
 * - `dispose()` (optional)
 * - Optional static/instance UI policy providers: `UI_POLICY`, `getUIPolicy()`, `uiPolicy`.
 * @typedef {new (...args:any[]) => any} AlgorithmCtor
 */

/**
 * Metadata tracked for a loaded algorithm.
 * @typedef {Object} AlgorithmMeta
 * @property {string} algo_name    Human-friendly name (or constructor name).
 * @property {string} algo_version Semver version (default "1.0.0").
 * @property {string} [algo_description] Description if provided.
 * @property {string} [algo_category='Uncategorized'] Category bucket for UI grouping.
 * @property {string[]} [algo_tags=[]] Free-form tags (for future search/filter).
 * @property {boolean} __loaded    Internal marker.
 */

/**
 * Per-direction UI policy.
 * @typedef {Object} UIPolicyDirection
 * @property {boolean} input  Whether the "input" field should be enabled.
 * @property {boolean} args   Whether the "args" field should be enabled.
 * @property {string}  [inputPh] Placeholder for the input textarea.
 * @property {string}  [argsPh]  Placeholder for the args textarea.
 * @property {boolean} [allowFile]  Whether the File picker/drag&drop is enabled for this direction. (extension)
 */

/**
 * UI policy for an algorithm.
 * @typedef {Object} UIPolicy
 * @property {boolean} [requiresInit=false] Whether init must be run before forward/reverse.
 * @property {{init:UIPolicyDirection, forward:UIPolicyDirection, reverse:UIPolicyDirection}} directions
 */

/**
 * A pipe step used by {@link ReverseEngineer#pipe}.
 * @typedef {Object} PipeStep
 * @property {string|AlgorithmCtor} algo     The algorithm (name or constructor).
 * @property {'init'|'forward'|'reverse'|'dispose'} dir  Direction to execute.
 * @property {any[]} [args]                  Extra arguments for the call (excluding the piped input).
 */

/* ========================================================================== */
/* =============================== Core Engine ============================== */
/* ========================================================================== */

export const ReverseEngineer = class {
  /** @private */ #instance;
  /** @private */ #algorithms;
  /** @private */ #logLevel = 'INFO';

  constructor() {
    this.#instance = false;
    this.#algorithms = [];
  }

  getInstance() { if (this.#instance) return this.#instance; this.#instance = this; return this.#instance; }

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

  /** @private */ #ensureInstanced() { if (!this.#instance) throw new Error('Call getInstance() before using ReverseEngineer methods.'); }

  /** @private */ #hasAlgorithm(algorithm) {
    const name = typeof algorithm === 'string' ? algorithm : new algorithm().constructor.name;
    const n = String(name).toLowerCase();
    return this.#algorithms.some(a => a.algo_name.toLowerCase() === n);
  }

  /** @private */ #getAlgorithm(algorithm) {
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
    obj.algo_name = Algo?.name ?? algo?.name ?? ClassName;
    obj.algo_version = Algo?.version ?? algo?.version ?? '1.0.0';
    obj.algo_description = Algo.description ?? algo?.description ?? '';
    obj.algo_category = (Algo?.category ?? algo?.category ?? algo?.CATEGORY ?? 'Uncategorized') || 'Uncategorized';
    const tagsStatic = Array.isArray(Algo?.TAGS) ? Algo.TAGS : (typeof Algo?.TAGS === 'string' ? [Algo.TAGS] : []);
    const tagsInst   = Array.isArray(algo?.tags) ? algo.tags : (typeof algo?.tags === 'string' ? [algo.tags] : []);
    obj.algo_tags = [...tagsStatic, ...tagsInst].filter(Boolean);

    obj.instance = algo;
    obj.__loaded = true;

    if (typeof algo.init === 'function') obj.algo_init = algo.init.bind(algo);
    if (typeof algo.addForwardAlgorithm === 'function') obj.algo_forward = algo.addForwardAlgorithm.bind(algo);
    else throw new ReferenceError(`You are missing "addForwardAlgorithm()" method in ${ClassName}`);
    if (typeof algo.addReverseAlgorithm === 'function') obj.algo_reverse = algo.addReverseAlgorithm.bind(algo);
    else throw new ReferenceError(`You are missing "addReverseAlgorithm()" method in ${ClassName}`);

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

  remove(Algo = null) { if (!Algo) { this.#algorithms = []; return this; } const name = typeof Algo === 'string' ? Algo : Algo.name; this.#algorithms = this.#algorithms.filter(i => i.algo_name !== name); return this; }

  init(algorithm, ...params) { const name = typeof algorithm === 'string' ? algorithm : new algorithm().constructor.name; const a = this.#getAlgorithm(name); if (!a?.instance) throw new Error(`${name} has not been instanced`); return a.algo_init?.(...params); }
  forward(algorithm, ...params) { const name = typeof algorithm === 'string' ? algorithm : new algorithm().constructor.name; const a = this.#getAlgorithm(name); if (!a?.instance) throw new Error(`${name} has not been instanced`); return a.algo_forward(...params); }
  reverse(algorithm, ...params) { const name = typeof algorithm === 'string' ? algorithm : new algorithm().constructor.name; const a = this.#getAlgorithm(name); if (!a?.instance) throw new Error(`${name} has not been instanced`); return a.algo_reverse(...params); }
  dispose(algorithm) { if (algorithm) { this.#ensureInstanced(); const name = typeof algorithm === 'string' ? algorithm : (algorithm.id ?? algorithm.name); const obj = this.#getAlgorithm(name); if (obj?.instance?.dispose) obj.instance.dispose(); this.remove(name); return this; } return this; }

  list(){ return this.#algorithms.map(o => o.algo_name); }
  use(...algos){ this.#ensureInstanced(); for (const A in algos) this.add(algos[A]); return this; }
  has(algorithm){ this.#ensureInstanced(); return this.#hasAlgorithm(algorithm); }
  get(algorithm){ this.#ensureInstanced(); const a=this.#getAlgorithm(algorithm); if(!a) return null; const {algo_name, algo_version, algo_description, __loaded, algo_category, algo_tags}=a; return {algo_name, algo_version, algo_description, __loaded, algo_category, algo_tags}; }
  count(){ this.#ensureInstanced(); return this.#algorithms.length; }
  clear(){ return this.remove(null); }
  names(){ return this.list(); }
  run(direction, algorithm, ...params){ this.#ensureInstanced(); const dir = String(direction).toLowerCase(); if (!['forward','reverse','init','dispose'].includes(dir)) throw new Error(`Unknown direction "${direction}"`); if (dir === 'dispose') return this[dir](algorithm); return this[dir](algorithm, ...params); }
  pipe(steps, input){ this.#ensureInstanced(); return steps.reduce((acc, step)=>{ const {algo, dir, args = []} = step; if (dir === 'forward') return this.forward(algo, acc, ...args); if (dir === 'reverse') return this.reverse(algo, acc, ...args); if (dir === 'init') return this.init(algo, acc, ...args); if (dir === 'dispose') return this.dispose(algo); throw new Error(`Invalid direction: ${dir}`); }, input); }
  toJSON(){ this.#ensureInstanced(); return JSON.stringify(this.#algorithms.map(a=>({name:a.algo_name,version:a.algo_version,description:a.algo_description})), null, 2); }
  fromJSON(json, resolver){ this.#ensureInstanced(); const list = JSON.parse(json); for (const {name} of list){ const Ctor = resolver(name); if (Ctor) this.add(Ctor); } return this; }
  uiPolicy(algorithm){ this.#ensureInstanced(); const name = typeof algorithm === 'string' ? algorithm : new algorithm().constructor.name; const a = this.#getAlgorithm(name); return a?.uiPolicy ?? null; }
  setUiPolicy(algorithm, policy){ this.#ensureInstanced(); const name = typeof algorithm === 'string' ? algorithm : new algorithm().constructor.name; const a = this.#getAlgorithm(name); if (!a) throw new Error(`${name} has not been instanced`); a.uiPolicy = policy; return this; }
};

/* ========================================================================== */
/* =========================== Crypto Utilities ============================= */
/* ========================================================================== */

export const CryptoUtils = {
  b64ToBytes: (b64)=>Uint8Array.from(atob(b64), c=>c.charCodeAt(0)),
  bytesToB64: (bytes)=>btoa(String.fromCharCode(...bytes)),
  randomBytes: (length)=>{ const a=new Uint8Array(length); crypto.getRandomValues(a); return a; },
  utf8ToBytes: (s)=>new TextEncoder().encode(s),
  bytesToUtf8: (b)=>new TextDecoder().decode(b),
  generateB64Key:(length=32)=>{ const keyBytes = CryptoUtils.randomBytes(length); return CryptoUtils.bytesToB64(keyBytes); }
};

/* ========================================================================== */
/* ================================== GUI ================================== */
/* ========================================================================== */

export const ReverseEngineerGUI = class {
  #instance;
  constructor(autoClearCache=false){ if(autoClearCache) this.#clearCache(); this.#instance=new ReverseEngineer().getInstance(); this.#instance.debug('INFO','GUI Loaded successfully'); }
  /**
   * Clears out the cache
   * @returns {ReverseEngineerGUI}
   */
  clearCache(){ this.#clearCache(); return this; }
  #clearCache(){ const KEY_PREFIX=/^re[-_]/i; const KNOWN_KEYS=['re-ui-policies','re-theme']; try{ KNOWN_KEYS.forEach(k=>{ if(typeof localStorage!=='undefined') localStorage.removeItem(k); }); if(typeof localStorage!=='undefined'){ const toRemove=[]; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k && KEY_PREFIX.test(k)) toRemove.push(k); } toRemove.forEach(k=>localStorage.removeItem(k)); } }catch{} try{ if(typeof sessionStorage!=='undefined'){ const toRemove=[]; for(let i=0;i<sessionStorage.length;i++){ const k=sessionStorage.key(i); if(k && KEY_PREFIX.test(k)) toRemove.push(k); } toRemove.forEach(k=>sessionStorage.removeItem(k)); } }catch{} try{ if(typeof document!=='undefined'){ document.documentElement.removeAttribute('data-theme'); } }catch{} try{ if(typeof document!=='undefined'){ document.querySelectorAll('link[data-re-theme="1"]').forEach(el=>el.remove()); } }catch{} try{ this.#instance?.debug?.('INFO','ReverseEngineerGUI cache cleared'); }catch{} }
  /**
   * Set the theme to the GUI
   * @param {'Default'|'LagoonDrift'|'Sunset'|'Nebula'|'Emerald'|'Graphite'|'RetroPop'} [theme='Default'] Theme to set
   * @returns {ReverseEngineer}
   */
  setTheme(theme='Default'){ theme=theme.toLowerCase(); const ok=['default','lagoondrift','sunset','nebula','emerald','graphite','retropop']; if(!ok.includes(theme)) throw new Error(`${theme} is not a theme`); try{ document.querySelectorAll('link[data-re-theme="1"]').forEach(el=>el.remove()); }catch{} const link=document.createElement('link'); link.rel='stylesheet'; const ts=Date.now(); link.href=`./themes/${theme}.css?v=${ts}`; link.dataset.reTheme='1'; document.head.appendChild(link); return this; }

  /**
   * @typedef {Object} GUIBuildOptions
   * @property {string} [title='ReverseEngineer']
   * @property {HTMLElement|string} [mount=document.body]
   * @property {AlgorithmCtor[]} [algos]
   */
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
            <path d="M15.5 3.5A8 8 0 1 0 20.5 15 A6.5 6.5 0 0 1 15.5 3.5z" fill="none" stroke="currentColor" stroke-width="1.5"/>
          </g>
        </svg>
      </button>
    </div>
  </header>
  <div class="re-gui-main">
    <aside class="re-sidebar">
      <div class="re-search">
        <input type="search" class="re-input re-search-input" placeholder="Search algorithms…" aria-label="Search algorithms" />
        <div class="re-sortbar" role="toolbar" aria-label="Grouping and sorting">
          <label class="re-visually-hidden" for="re-group-by">Group by</label>
          <select id="re-group-by" class="re-input re-group-by" aria-label="Group by">
            <option value="category" selected>Group: Category</option>
            <option value="none">Group: None</option>
          </select>
          <button type="button" class="re-btn re-icon-btn re-sort" data-order="asc" title="Sort A→Z" aria-label="Sort A to Z">
            <svg class="re-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 17V7M7 7l-3 3M7 7l3 3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M17 7v10M17 17l-3-3M17 17l3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
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

          <!-- File picker + drag&drop (disabled by default; enabled by policy)
               You can configure validation via data attributes on .re-file-zone:
               data-size-limit="2MB" data-file-type=".txt,.json,text/plain"
               Optional read mode: data-read-mode="bytes|text|dataurl"
          -->
          <div class="re-file-wrap">
            <div class="re-file-zone"
                 tabindex="0"
                 role="button"
                 aria-label="Drop a file or choose a file"
                 disabled
                 data-size-limit="100GB"
                 data-file-type=".txt"
                 data-read-mode="bytes">
              <input id="re-file" class="re-input re-file" type="file" accept=".txt"/>
              <div class="re-file-zone-inner">
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" class="re-file-icon">
                  <path d="M12 16V4m0 0l-3 3m3-3l3 3M6 20h12a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <div class="re-file-zone-text">
                  <strong>Drop a file here</strong>
                  <span class="re-file-zone-or">or</span>
                  <label for="re-file" class="re-link re-choose-file">choose</label>
                </div>
              </div>
            </div>

            <!-- Error area -->
            <div class="re-file-error" role="alert" aria-live="polite" hidden></div>
            <!-- Progress bar (client-side only) -->
            <div class="re-progress-wrap" hidden aria-hidden="true">
              <div class="re-progress-track">
                <div class="re-progress-bar"></div>
              </div>
              <div class="re-progress-label">0%</div>
            </div>
            <div class="re-file-meta" hidden>
              <div class="re-file-info">
                <span class="re-file-name"></span>
                <span class="re-file-size"></span>
              </div>
              <div class="re-file-actions">
                <button type="button" class="re-btn re-mini re-clear-file" aria-label="Remove file">Remove</button>
              </div>
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
        <pre class="re-code re-no-select" aria-live="polite"><code class="re-code-content">—</code></pre>
      </div>
    </section>
  </div>
  <footer class="re-footer" role="contentinfo" aria-label="Footer">
    <small>Powered by: <a href="https://github.com/XHiddenProjects/ReverseEngineer" target="_blank" rel="noopener noreferrer">XHiddenProjects</a></small>
  </footer>
</div>`;

    mountEl.insertAdjacentElement('afterbegin', gui);


    // ----- DOM refs -----
    const listEl = gui.querySelector('.re-algo-list');
    const emptyEl = gui.querySelector('.re-empty');
    const searchInput = gui.querySelector('.re-search-input');
    const refreshBtn = gui.querySelector('.re-refresh');
    const groupSelect = gui.querySelector('#re-group-by');
    const sortBtn = gui.querySelector('.re-sort');
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

    // File controls
    const fileZone   = gui.querySelector('.re-file-zone');
    const fileInput  = gui.querySelector('#re-file');
    const fileMeta   = gui.querySelector('.re-file-meta');
    const fileNameEl = gui.querySelector('.re-file-name');
    const fileSizeEl = gui.querySelector('.re-file-size');
    const clearFileBtn = gui.querySelector('.re-clear-file');
    const fileErrEl = gui.querySelector('.re-file-error');
    const progWrap  = gui.querySelector('.re-progress-wrap');
    const progBar   = gui.querySelector('.re-progress-bar');
    const progLabel = gui.querySelector('.re-progress-label');

    // Helpers
    const fmtBytes = (n)=>{ if(!Number.isFinite(n)) return ''; const u=['B','KB','MB','GB','TB']; let i=0,v=n; while(v>=1024 && i<u.length-1){ v/=1024; i++; } return `${v.toFixed(v<10?2:1)} ${u[i]}`; };

    // --- File config + validation + progress helpers ---
    const readFileCfg = () => {
      const ds = fileZone?.dataset || {};
      const di = fileInput?.dataset || {};
      const sizeLimitRaw = ds.sizeLimit ?? di.sizeLimit ?? '';
      const typesRaw     = ds.fileType ?? ds.fileTypes ?? di.fileType ?? di.fileTypes ?? '';
      const readMode     = (ds.readMode ?? di.readMode ?? '').toLowerCase();
      return {
        sizeLimit: parseSizeLimit(sizeLimitRaw),
        types: parseTypes(typesRaw),
        readMode: (['bytes','arraybuffer','text','dataurl'].includes(readMode) ? readMode : ''),
      };
    };

    const applyAcceptFromTypes = (types) => {
      if (!fileInput) return;
      if (!types?.length) return;
      const acceptList = types
        .map(t => t.includes('/') || t.startsWith('.') ? t : ('.' + t))
        .join(',');
      fileInput.setAttribute('accept', acceptList);
    };

    function parseSizeLimit(v) {
      if (v == null || String(v).trim() === '') return Infinity;
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      const m = String(v).trim().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb|tb|kib|mib|gib|tib)?$/i);
      if (!m) return NaN;
      const n = parseFloat(m[1]);
      const unit = (m[2] || 'b').toLowerCase();
      const table = {
        b:1, kb:1000, mb:1000**2, gb:1000**3, tb:1000**4,
        kib:1024, mib:1024**2, gib:1024**3, tib:1024**4
      };
      return Math.floor(n * (table[unit] || 1));
    }

    function parseTypes(raw) {
      const s = String(raw || '').trim();
      if (!s) return [];
      return s.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    }

    function fmtLimitReadable(bytes) {
      if (!Number.isFinite(bytes)) return '∞';
      const u=['B','KB','MB','GB','TB']; let i=0,v=bytes;
      while(v>=1024 && i<u.length-1){ v/=1024; i++; }
      return `${v.toFixed(v<10?2:1)} ${u[i]}`;
    }

    function matchType(file, token) {
      token = token.trim().toLowerCase();
      if (!token) return false;
      const mime = (file.type || '').toLowerCase();
      const ext  = (file.name || '').includes('.') ? file.name.split('.').pop().toLowerCase() : '';

      if (token === '*/*') return true;
      if (token.endsWith('/*')) {
        const base = token.slice(0, -1); // "image/"
        return mime.startsWith(base);
      }
      if (token.startsWith('.')) return ('.' + ext) === token;
      if (token.includes('/')) return mime === token;
      // bare extension like "txt"
      return ext === token;
    }

    function validateFileAgainstCfg(file, cfg) {
      if (!file) return { ok:false, error:'No file selected.' };
      if (!Number.isFinite(cfg.sizeLimit)) {
        return { ok:false, error:'Invalid size limit configuration.' };
      }
      if (file.size > cfg.sizeLimit) {
        return {
          ok:false,
          error:`File is too large. Max allowed ${fmtLimitReadable(cfg.sizeLimit)}; selected ${fmtBytes(file.size)}.`
        };
      }
      if (cfg.types.length) {
        const ok = cfg.types.some(t => matchType(file, t));
        if (!ok) {
          const ext = (file.name.split('.').pop()||'').toLowerCase();
          return {
            ok:false,
            error:`File type not allowed. Allowed: ${cfg.types.join(', ')}; selected: `
                  + (file.type || (ext ? `.${ext}` : 'unknown'))
          };
        }
      }
      return { ok:true };
    }

    function showFileError(msg) {
      if (!fileErrEl) return;
      fileErrEl.hidden = false;
      fileErrEl.textContent = String(msg || 'Invalid file.');
      fileZone?.classList.add('is-error');
    }
    function clearFileError() {
      if (!fileErrEl) return;
      fileErrEl.hidden = true;
      fileErrEl.textContent = '';
      fileZone?.classList.remove('is-error');
    }

    function showProgress() {
      if (!progWrap) return;
      progWrap.hidden = false;
      progWrap.style.display = 'grid';
      progWrap.setAttribute('aria-hidden', 'false');
      updateProgress(0);
    }
    function hideProgress() {
      if (!progWrap) return;
      progWrap.hidden = true;
      progWrap.style.display = 'none';
      progWrap.setAttribute('aria-hidden', 'true');
      updateProgress(0);
    }
    function updateProgress(pct) {
      const p = Math.max(0, Math.min(100, Math.round(pct)));
      if (progBar)   progBar.style.width = `${p}%`;
      if (progLabel) progLabel.textContent = `${p}%`;
    }

    // Will hold pre-read data when read mode is requested
    let selectedFileData = null;

    // Read the file on the client if requested by data-read-mode
    function readSelectedFileIfNeeded(file, readMode) {
      selectedFileData = null;
      if (!file || !readMode) return Promise.resolve(null);

      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadstart = () => showProgress();
        reader.onprogress  = (e) => {
          if (e.lengthComputable) updateProgress((e.loaded / e.total) * 100);
        };
        reader.onerror     = () => {
          hideProgress();
          reject(new Error('Failed to read the file.'));
        };
        reader.onloadend   = () => {
          hideProgress();
        };
        reader.onload      = () => {
          const res = reader.result;
          if (readMode === 'bytes' || readMode === 'arraybuffer') {
            const buf = new Uint8Array(res);
            selectedFileData = { bytes: buf };
          } else if (readMode === 'text') {
            selectedFileData = { text: String(res) };
          } else if (readMode === 'dataurl') {
            selectedFileData = { dataUrl: String(res) };
          }
          resolve(selectedFileData);
        };

        if (readMode === 'bytes' || readMode === 'arraybuffer') reader.readAsArrayBuffer(file);
        else if (readMode === 'text') reader.readAsText(file);
        else if (readMode === 'dataurl') reader.readAsDataURL(file);
        else resolve(null);
      });
    }

    let selected=null; let allMeta=[]; let sortOrder='asc'; let groupBy='category'; let selectedFile=null;

    // disabled state mirror
    const updateFileZoneDisabled = ()=>{ if(!fileZone) return; const dis=fileZone.hasAttribute('disabled')||fileZone.getAttribute('aria-disabled')==='true'; fileZone.classList.toggle('is-disabled', !!dis); };
    updateFileZoneDisabled();
    if(fileZone){ const mo=new MutationObserver((muts)=>{ if(muts.some(m=>m.attributeName==='disabled'||m.attributeName==='aria-disabled')) updateFileZoneDisabled(); }); mo.observe(fileZone,{attributes:true, attributeFilter:['disabled','aria-disabled']}); }

    const refreshFileUI = ()=>{ if(selectedFile){ fileMeta.hidden=false; fileNameEl.textContent=selectedFile.name||'(unnamed)'; fileSizeEl.textContent = selectedFile.size!=null? `· ${fmtBytes(selectedFile.size)}`: ''; } else { fileMeta.hidden=true; fileNameEl.textContent=''; fileSizeEl.textContent=''; } };
    const resetFileInput = () => { try { if (fileInput) fileInput.value = ''; } catch {} };
    const setFile = async (f)=>{
      clearFileError();
      selectedFile=null; selectedFileData=null;
      const cfg = readFileCfg();
      if (f) {
        const v = validateFileAgainstCfg(f, cfg);
        if (!v.ok) { showFileError(v.error); resetFileInput(); refreshFileUI(); return; }
        try { await readSelectedFileIfNeeded(f, cfg.readMode); }
        catch (err) { showFileError(err?.message || 'Failed to read file.'); resetFileInput(); refreshFileUI(); return; }
        selectedFile=f;
      }
      refreshFileUI();
    };

    const pretty = (val)=>{ try{ if(typeof val==='string'){ const maybe=JSON.parse(val); return JSON.stringify(maybe,null,2); } return typeof val==='object'? JSON.stringify(val,null,2): String(val); }catch{ return typeof val==='object'? JSON.stringify(val,null,2): String(val);} };

    const autoCast = (s)=>{ const t=s.trim(); if(/^(true|false)$/i.test(t)) return t.toLowerCase()==='true'; if(/^null$/i.test(t)) return null; if(/^-?\d+(\.\d+)?$/.test(t)) return Number(t); return t; };

    function normalizeJsonishToJson(src){ const s0=src.trim(); if(!s0) return s0; if(!/^[\[\{]/.test(s0)) return s0; let str=s0.replace(/,\s*(?=[\}\]\)])/g,''); { let out=''; const stack=[]; let inStr=false; let esc=false; const expectKeyStack=[]; const isIdentStart=c=>/[A-Za-z_$]/.test(c); const isIdent=c=>/[A-Za-z0-9_$]/.test(c); for(let i=0;i<str.length;i++){ const ch=str[i]; if(inStr){ out+=ch; if(esc){esc=false; continue;} if(ch==='\\'){esc=true; continue;} if(ch==='"'){inStr=false;} continue;} if(ch==='"'){ inStr=true; out+=ch; continue;} if(ch==='{'){ stack.push('object'); expectKeyStack.push(true); out+=ch; continue;} if(ch==='['){ stack.push('array'); out+=ch; continue;} if(ch==='}'){ if(stack.pop()==='object') expectKeyStack.pop(); out+=ch; continue;} if(ch===']'){ stack.pop(); out+=ch; continue;} const top=stack[stack.length-1]; if(top==='object'){ if(ch===':'){ expectKeyStack[expectKeyStack.length-1]=false; out+=ch; continue;} if(ch===','){ expectKeyStack[expectKeyStack.length-1]=true; out+=ch; continue;} const expectKey=expectKeyStack[expectKeyStack.length-1]; if(expectKey){ if(/\s/.test(ch)){ out+=ch; continue;} if(ch==='"'){ inStr=true; out+=ch; continue;} if(isIdentStart(ch)){ let j=i+1; while(j<str.length && isIdent(str[j])) j++; const ident=str.slice(i,j); let k=j; while(k<str.length && /\s/.test(str[k])) k++; if(str[k]===':'){ out+=`"${ident}"`; i=j-1; expectKeyStack[expectKeyStack.length-1]=false; continue;} } } } out+=ch; } str=out; } return str; }

    const parseArgs = (text)=>{ const raw=text.trim(); if(!raw) return []; try{ const j=JSON.parse(raw); return Array.isArray(j)? j: [j]; }catch{} const parts=[]; let buf=''; let depth=0; let inStr=false; let quote=''; let esc=false; for(let i=0;i<raw.length;i++){ const ch=raw[i]; if(inStr){ buf+=ch; if(esc){esc=false; continue;} if(ch==='\\'){esc=true; continue;} if(ch===quote){ inStr=false; quote=''; } continue;} if(ch==='"'||ch==='\''){ inStr=true; quote=ch; buf+=ch; continue;} if(ch==='{'||ch==='['||ch==='('){ depth++; buf+=ch; continue;} if(ch==='}'||ch===']'||ch===')'){ depth=Math.max(0,depth-1); buf+=ch; continue;} if(ch===',' && depth===0){ const tok=buf.trim(); if(tok) parts.push(tok); buf=''; continue;} buf+=ch; } const last=buf.trim(); if(last) parts.push(last); return parts.map((p)=>{ const isWrappedSingle=p.length>=2 && p[0]==='\'' && p[p.length-1]=='\''; const isWrappedDouble=p.length>=2 && p[0]==='"' && p[p.length-1]==='"'; let token=p; if((isWrappedSingle||isWrappedDouble) && /^[\[\{].*[\]\}]$/.test(p.slice(1,-1).trim())) token=p.slice(1,-1); try{ return JSON.parse(token);}catch{} const fixed=normalizeJsonishToJson(token); try{ return JSON.parse(fixed);}catch{} return autoCast(token); }); };

    const setOutput = (val)=>{ outputEl.textContent = pretty(val ?? '—'); };
    const setDetails=(meta)=>{ nameEl.textContent = meta?.algo_name ?? '—'; verEl.textContent = meta?.algo_version ?? '—'; descEl.textContent = meta?.algo_description ?? '—'; };

    // ----- Policy Catalog -----
    const ALGO_UI_POLICY = {};

    const DEFAULT_POLICY = {
      requiresInit:false,
      directions:{
        init:    {input:false,args:true, inputPh:'—',       argsPh:'Algorithm-specific options (JSON)', allowFile:false},
        forward: {input:true, args:true, inputPh:'Input',   argsPh:'Arguments (JSON or comma-separated)', allowFile:false},
        reverse: {input:true, args:true, inputPh:'Input',   argsPh:'Arguments (JSON or comma-separated)', allowFile:false}
      }
    };

    const initState=new Map();

    const deepClone = (o)=>JSON.parse(JSON.stringify(o));
    function normalizePolicy(policy){
      const base = deepClone(DEFAULT_POLICY);
      if(!policy || typeof policy!=='object') return base;
      const out = {...base, ...policy};
      out.requiresInit = !!(policy.requiresInit ?? base.requiresInit);
      const baseDirs = base.directions; const dirs = policy.directions || {};
      function normDir(dir, fallback){
        const merged = {...fallback, ...(dir||{})};
        merged.input = !!merged.input; merged.args = !!merged.args; merged.allowFile = !!merged.allowFile;
        return merged;
      }
      out.directions = {
        init:    normDir(dirs.init, baseDirs.init),
        forward: normDir(dirs.forward, baseDirs.forward),
        reverse: normDir(dirs.reverse, baseDirs.reverse),
      };
      return out;
    }

    const BUILTIN_POLICY_SET = new Set(Object.keys(ALGO_UI_POLICY));
    const STORAGE_KEY = 're-ui-policies';

    (function loadUserPolicies(){ try{ const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'); Object.entries(saved).forEach(([name,pol])=>{ if(!ALGO_UI_POLICY[name]) ALGO_UI_POLICY[name]=normalizePolicy(pol); }); }catch{} })();
    function persistUserPolicies(){ try{ const custom={}; Object.keys(ALGO_UI_POLICY).forEach(name=>{ if(!BUILTIN_POLICY_SET.has(name)) custom[name]=ALGO_UI_POLICY[name]; }); localStorage.setItem(STORAGE_KEY, JSON.stringify(custom)); }catch{} }
    function addPolicyFor(name,policy){ if(!policy) return; ALGO_UI_POLICY[name]=normalizePolicy(policy); persistUserPolicies(); }
    function tryAttachAlgoPolicy(name){ try{ const pol=inst.uiPolicy?.(name); if(pol && !ALGO_UI_POLICY[name]) addPolicyFor(name, pol); }catch{} }

    const getPolicy=(name)=> ALGO_UI_POLICY[name] ?? DEFAULT_POLICY;
    const getDirRadio=(val)=> dirRadios.find(r=>r.value===val);

    const setGlobalBusy = (busy,{includeClear=false}={})=>{
      formEl.querySelectorAll('input, textarea, button').forEach(el=>{ if(!includeClear && el.classList.contains('re-clear')) return; el.disabled = busy; el.setAttribute('aria-disabled', String(busy)); });
      disposeBtn.disabled = busy; disposeBtn.setAttribute('aria-disabled', String(busy));
      if(fileZone){ if(busy) fileZone.setAttribute('disabled',''); else fileZone.removeAttribute('disabled'); }
    };
    const setDisabled = (disable)=> setGlobalBusy(disable,{includeClear:true});

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
      inputEl.disabled=!d.input; argsEl.disabled=!d.args; inputEl.placeholder=d.inputPh ?? inputEl.placeholder; argsEl.placeholder=d.argsPh ?? argsEl.placeholder;

      // File zone enablement strictly by policy + init state
      if(fileZone){
        const allowFile = !!d.allowFile;
        if(allowFile && isInited){ fileZone.removeAttribute('disabled'); }
        else { fileZone.setAttribute('disabled',''); }
      }
    }

    function sortItems(items){ const dir = sortOrder==='asc'?1:-1; return items.slice().sort((a,b)=>{ const an=(a.algo_name||'').toLowerCase(); const bn=(b.algo_name||'').toLowerCase(); if(an<bn) return -1*dir; if(an>bn) return 1*dir; return 0; }); }

    function renderList(metaList){
      listEl.innerHTML='';
      if(!metaList?.length){ emptyEl.hidden=false; setDetails(null); selected=null; setDisabled(true); return; }
      emptyEl.hidden=true;
      const items=sortItems(metaList);
      if(groupBy==='category'){
        const groups=new Map(); for(const m of items){ const cat=(m.algo_category||'Uncategorized').toString(); if(!groups.has(cat)) groups.set(cat,[]); groups.get(cat).push(m); }
        const cats=Array.from(groups.keys()).sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'}));
        for(const cat of cats){ const header=document.createElement('li'); header.className='re-group-header'; header.setAttribute('role','presentation'); header.textContent=cat; listEl.appendChild(header); const groupItems=groups.get(cat); for(const m of groupItems){ const li=document.createElement('li'); li.className='re-algo-item'; li.setAttribute('role','option'); li.tabIndex=0; li.dataset.name=m.algo_name; li.innerHTML=`<div class="re-algo-name">${m.algo_name}</div>`; li.addEventListener('click',()=>selectAlgo(m.algo_name, li)); li.addEventListener('keydown',(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); selectAlgo(m.algo_name, li);} }); listEl.appendChild(li); } }
      } else {
        for(const m of items){ const li=document.createElement('li'); li.className='re-algo-item'; li.setAttribute('role','option'); li.tabIndex=0; li.dataset.name=m.algo_name; li.innerHTML=`<div class=\"re-algo-name\">${m.algo_name}</div>`; li.addEventListener('click',()=>selectAlgo(m.algo_name, li)); li.addEventListener('keydown',(e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); selectAlgo(m.algo_name, li);} }); listEl.appendChild(li); }
      }
      if(!selected) setDisabled(true);
    }

    const selectAlgo=(name, liEl)=>{ selected=name; listEl.querySelectorAll('.re-algo-item[aria-selected="true"]').forEach(el=>el.removeAttribute('aria-selected')); if(liEl) liEl.setAttribute('aria-selected','true'); const meta=inst.get(name); setDetails(meta); tryAttachAlgoPolicy(name); const pol=getPolicy(name); if(!initState.has(name)) initState.set(name, !pol.requiresInit); setDisabled(false); applyUIRules(); inst.debug('INFO',`Selected algorithm: ${name}`, meta); };

    const refresh=()=>{ const names=inst.names(); allMeta = names.map(n=>{ const meta=inst.get(n)||{}; return { algo_name:n, algo_version:meta.algo_version ?? meta.version ?? '1.0.0', algo_description:meta.algo_description ?? meta.description ?? '', algo_category: meta.algo_category ?? 'Uncategorized', algo_tags:Array.isArray(meta.algo_tags)? meta.algo_tags:[], __loaded:true }; }); allMeta.forEach(m=>tryAttachAlgoPolicy(m.algo_name)); applySearchAndRender(); setOutput('—'); if(!selected) setDisabled(true); };

    function applySearchAndRender(){ const term=(searchInput.value||'').trim().toLowerCase(); if(!term){ renderList(allMeta); return; } const filtered=allMeta.filter(m=>{ const fields=[ m.algo_name||'', m.algo_description||'', (m.algo_category||''), ...(Array.isArray(m.algo_tags)? m.algo_tags:[]) ].join(' ').toLowerCase(); return fields.includes(term); }); renderList(filtered); }

    // Apply <input accept> from dataset types if present
    applyAcceptFromTypes(readFileCfg().types);

    // Picker helpers & event guards
    const openFilePicker = () => { if(!fileInput) return; try{ if(typeof fileInput.showPicker==='function'){ fileInput.showPicker(); return; } }catch{} fileInput.click(); };

    fileZone?.addEventListener('click', (e)=>{ if(e.target.closest('.re-choose-file')) return; if(fileZone.hasAttribute('disabled')||fileZone.getAttribute('aria-disabled')==='true') return; openFilePicker(); });
    fileZone?.addEventListener('keydown', (e)=>{ if(e.key==='Enter'||e.key===' '){ if(fileZone.hasAttribute('disabled')||fileZone.getAttribute('aria-disabled')==='true') return; e.preventDefault(); openFilePicker(); } });

    const stop=(e)=>{ e.preventDefault(); e.stopPropagation(); };
    if(fileZone){
      ['dragenter','dragover'].forEach(ev=> fileZone.addEventListener(ev, (e)=>{ if(fileZone.hasAttribute('disabled')||fileZone.getAttribute('aria-disabled')==='true') return; stop(e); fileZone.classList.add('dragover'); }));
      ['dragleave','dragend','drop'].forEach(ev=> fileZone.addEventListener(ev, (e)=>{ if(fileZone.hasAttribute('disabled')||fileZone.getAttribute('aria-disabled')==='true') return; stop(e); if(ev!=='drop') fileZone.classList.remove('dragover'); }));
      fileZone.addEventListener('drop', async (e)=>{ if(fileZone.hasAttribute('disabled')||fileZone.getAttribute('aria-disabled')==='true') return; const dt=e.dataTransfer; const f=dt && dt.files && dt.files[0]? dt.files[0]: null; if(f) await setFile(f); fileZone.classList.remove('dragover'); });
    }

    fileInput?.addEventListener('change', async () =>{ const f=(fileInput.files && fileInput.files[0])? fileInput.files[0]: null; await setFile(f); });
    clearFileBtn?.addEventListener('click', ()=>{ hideProgress(); clearFileError(); setFile(null); if(fileInput) fileInput.value=''; });

    refreshBtn.addEventListener('click', refresh);
    searchInput.addEventListener('input', () => applySearchAndRender());
    gui.addEventListener('keydown', (e)=>{ if(e.altKey && e.key.toLowerCase()==='r'){ e.preventDefault(); refreshBtn.click(); } });
    dirRadios.forEach(r=> r.addEventListener('change', applyUIRules));

    formEl.addEventListener('submit', async (e)=>{
      e.preventDefault(); if(!selected) return setOutput('Select an algorithm first.');
      const dir = dirRadios.find(r=>r.checked)?.value ?? 'forward';
      const inp = inputEl.value; const args = parseArgs(argsEl.value);

      const hasFileLikeArg = args.some(a=> a && typeof a==='object' && (a.file || a.fileInput || a.bytes || a.path));
      if(selectedFile && !hasFileLikeArg) {
        const cfg = readFileCfg();
        const v = validateFileAgainstCfg(selectedFile, cfg);
        if (!v.ok) { setOutput({ error: v.error }); return; }
        const payload = { file: selectedFile };
        if (selectedFileData) Object.assign(payload, selectedFileData);
        args.push(payload);
      }

      try{
        setGlobalBusy(true);
        const call = dir==='init'? ()=>inst.init(selected, ...args)
                  : dir==='forward'? ()=>inst.forward(selected, inp, ...args)
                  : dir==='reverse'? ()=>inst.reverse(selected, inp, ...args)
                  : ()=>{ throw new Error(`Unknown direction: ${dir}`); };
        let result = await Promise.resolve(call());
        if(result && typeof result==='object' && result.__ui_policy){ addPolicyFor(selected, result.__ui_policy); const {__ui_policy, ...rest}=result; result=rest; }
        tryAttachAlgoPolicy(selected);
        setOutput(result);
        if(dir==='init'){ initState.set(selected,true); }
      }catch(err){ inst.debug('ERROR',`Run failed: ${err.message}`, err); setOutput({ error: err.message }); }
      finally{ setGlobalBusy(false); applyUIRules(); }
    });

    clearBtn.addEventListener('click', ()=>{ inputEl.value=''; argsEl.value=''; hideProgress(); clearFileError(); setFile(null); if(fileInput) fileInput.value=''; setOutput('—'); applyUIRules(); });

    disposeBtn.addEventListener('click', ()=>{ if(!selected) return; try{ inst.dispose(selected); initState.delete(selected); hideProgress(); clearFileError(); setFile(null); if(fileInput) fileInput.value=''; selected=null; refresh(); setDetails(null);} catch(err){ setOutput({ error: err.message }); } });

    const themeBtn = gui.querySelector('.re-theme-toggle');
    const THEME_CYCLE=['auto','dark','light'];
    const root=document.documentElement;
    const setThemeAttr=(mode)=>{ if(mode==='auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', mode); themeBtn.dataset.mode=mode; themeBtn.title=`Theme: ${mode[0].toUpperCase()}${mode.slice(1)} (Alt+T)`; themeBtn.setAttribute('aria-label', `Toggle theme (${mode[0].toUpperCase()}${mode.slice(1)})`); try{ localStorage.setItem('re-theme', mode);}catch{} };
    let themeMode=(()=>{ try{ return localStorage.getItem('re-theme') ?? 'auto'; }catch{ return 'auto'; } })();
    setThemeAttr(themeMode);
    themeBtn.addEventListener('click', ()=>{ const idx=THEME_CYCLE.indexOf(themeMode); themeMode = THEME_CYCLE[(idx+1)%THEME_CYCLE.length]; setThemeAttr(themeMode); });
    gui.addEventListener('keydown', (e)=>{ if(e.altKey && e.key.toLowerCase()==='t'){ e.preventDefault(); themeBtn.click(); } });

    const copyBtn = gui.querySelector('.re-copy');
    const getOutputPlain=()=> outputEl?.textContent ?? '';
    const doCopy = async ()=>{ const text=getOutputPlain(); if(!text || text==='—'){ const prevTitle=copyBtn.title; copyBtn.title='Nothing to copy'; setTimeout(()=> (copyBtn.title=prevTitle), 800); return; } const showCopied=(ok=true)=>{ const prevTitle=copyBtn.title; copyBtn.title = ok ? 'Copied!' : 'Copy failed'; copyBtn.classList.toggle('is-success', ok); copyBtn.classList.toggle('is-error', !ok); setTimeout(()=>{ copyBtn.title=prevTitle; copyBtn.classList.remove('is-success','is-error'); }, 900); }; try{ if(navigator.clipboard?.writeText){ await navigator.clipboard.writeText(text); showCopied(true); return; } const range=document.createRange(); range.selectNodeContents(outputEl); const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(range); const ok=document.execCommand('copy'); sel.removeAllRanges(); showCopied(ok); } catch{ showCopied(false); } };
    copyBtn.addEventListener('click', doCopy);
    gui.addEventListener('keydown', (e)=>{ if(e.altKey && e.key.toLowerCase()==='c'){ e.preventDefault(); doCopy(); } });

    sortBtn?.addEventListener('click', ()=>{ sortOrder = sortOrder==='asc' ? 'desc':'asc'; sortBtn.dataset.order=sortOrder; sortBtn.title = sortOrder==='asc' ? 'Sort A→Z' : 'Sort Z→A'; sortBtn.setAttribute('aria-label', sortOrder==='asc'? 'Sort A to Z':'Sort Z to A'); applySearchAndRender(); });
    groupSelect?.addEventListener('change', (e)=>{ groupBy = e.target.value==='none'? 'none':'category'; applySearchAndRender(); });

    setDisabled(true);
    refresh();
    return gui;
  }
};