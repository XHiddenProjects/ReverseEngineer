/**
 * ReverseEngineer
 * @exports ReverseEngineer
 * @author XHiddenProjects
 * @version 1.2.0
 * @description Reverse Engineer uses existing algorithms to reverse it back
 * @see {@link https://github.com/XHiddenProjects/ReverseEngineer | Documentation}
 */
export const ReverseEngineer = class{
    #instance;
    #algorithms;
    #logLevel="INFO";
    /**
     * Creates the instance of ReverseEngineer class
     */
    constructor(){
        // The instance 
        this.#instance = false;
        this.#algorithms = [];
    }
    /**
     * Get the class Instance before 
     * @returns {ReverseEngineer}
     */
    getInstance(){
        if (this.#instance) return this.#instance;
        this.#instance = this;
        return this.#instance;
    }
    /**
     * Set the default log level
     * @param {'INFO'|'DEBUG'|'WARN'|'ERROR'|'SILENT'} level Log level
     * @returns {ReverseEngineer}
     */
    setLogLevel(level = 'INFO') {
        const allowed = ['DEBUG','INFO','WARN','ERROR','SILENT'];
        if (!allowed.includes(level.toUpperCase())) throw new Error(`Invalid log level ${level}`);
        this.#logLevel = level.toUpperCase();
        return this;
    }
    /**
     * Outputs a formatted debug/log message to the console.
     *
     * @param {string} [label='INFO'] 
     *        The log level or label (e.g., "INFO", "WARN", "ERROR", "DEBUG").
     *
     * @param {string} [message=''] 
     *        The main message text to output.
     *
     * @param {Object} [meta] 
     *        Optional metadata object that will be logged as a second argument.
     *
     * @returns {void}
     *
     * @example
     * debug("INFO", "Loaded successfully");
     *
     * @example
     * debug("ERROR", "Something failed", { error: err });
     *
     * @example
     * debug("DEBUG", "Algorithm params", { params });
     */
    debug(label = 'INFO', message = '', meta = undefined) {
        const levels = ['DEBUG','INFO','WARN','ERROR','SILENT'];
        const current = levels.indexOf(this.#logLevel);
        const incoming = levels.indexOf(String(label).toUpperCase());
        if (incoming < current || this.#logLevel === 'SILENT') return;
        const ts = new Date().toISOString();
        const prefix = `[${ts}] [${String(label).toUpperCase()}]`;
        const fn = label === 'ERROR' ? console.error
                : label === 'WARN'  ? console.warn
                : label === 'DEBUG' ? console.debug
                : console.info;
        meta !== undefined ? fn(`${prefix} - ${message}`, meta) : fn(`${prefix} - ${message}`);
    }

    /**
     * Ensures that the instanced has been called
     */
    #ensureInstanced(){
        if (!this.#instance) 
            throw new Error("Call getInstance() before using ReverseEngineer methods.");
    }
    /**
     * Checks if the algorithm exists
     * @param {String|Object} algorithm Algorithm name
     * @returns {Boolean} True if the algorithm exists, else False
     */
    #hasAlgorithm(algorithm){
        const name = typeof algorithm === "string" ? algorithm : new algorithm().constructor.name,
        n = String(name).toLowerCase();
        return this.#algorithms.some(a => a.algo_name.toLowerCase() === n);
    }
    /**
     * Returns the algorithm information
     * @param {String|Object} algorithm Algorithm name
     * @returns {Object|null} Algorithms object
     */
    #getAlgorithm(algorithm){
        const name = typeof algorithm === "string" ? algorithm : new algorithm().constructor.name,
        n = String(name).toLowerCase();
        return this.#algorithms.find(a => a.algo_name.toLowerCase() === n) ?? null;
    }
    /**
     * Add an algorithm to the object
     * @param {Function} Algo Algorithm class (constructor)
     * @returns {ReverseEngineer}
     */
    add(Algo) {
        if (!this.#instance) throw new Error("You must use the getInstance() before running this");
        const AlgoObj = {};
        const algo = new Algo();
        const ClassName = algo.constructor.name;

        // This check is redundant because `new Algo()` already ensures it's the right type,
        // but keeping it doesn't hurt.
        if (!(algo instanceof Algo)) throw new TypeError(`It must be a ${ClassName} class`);

        if (this.#hasAlgorithm(ClassName)) throw new Error(`${ClassName} already exists`);

        AlgoObj.algo_name = algo.name||ClassName;
        AlgoObj.algo_version = algo.version || "1.0.0";
        AlgoObj.algo_description = algo.description || "";
        AlgoObj.instance = algo;
        AlgoObj.__loaded = true;
        if (typeof algo.init === "function") 
            AlgoObj.algo_init = algo.init.bind(algo);
        if (typeof algo.addForwardAlgorithm === "function") {
            AlgoObj.algo_forward = algo.addForwardAlgorithm.bind(algo);
        } else 
            throw new ReferenceError(`You are missing "addForwardAlgorithm()" method in ${ClassName}`);
        if (typeof algo.addReverseAlgorithm === "function") {
            AlgoObj.algo_reverse = algo.addReverseAlgorithm.bind(algo);
        } else 
            throw new ReferenceError(`You are missing "addReverseAlgorithm()" method in ${ClassName}`);
        this.#algorithms.push(AlgoObj);
        return this;
    }

    /**
     * Remove an algorithm
     * @param {?Object|String} Algo Algorithm to remove, if null it deletes everything
     * @returns 
     */
    remove(Algo = null) {
        if (!Algo) {
            this.#algorithms = [];
            return this;
        }
        const name = typeof Algo === "string"
            ? Algo
            : Algo.name;

        this.#algorithms = this.#algorithms.filter(i => i.algo_name !== name);
        return this;
    }
    /**
     * Execute the class on init
     * @param {String|Object} algorithm Algorithm class
     * @param  {...any} params Any configuration parameters for the method
     * @returns {any}
     */
    init(algorithm,...params){
        const name = typeof algorithm === "string" ? algorithm : new algorithm().constructor.name;
        const getAlgo = this.#getAlgorithm(name);
        if(!getAlgo?.instance) throw new Error(`${name} has not been instanced`);
        return getAlgo.algo_init(...params);
    }
    /**
     * Forward the algorithms
     * @param {String|Object} algorithm Algorithm class
     * @param  {...any} params Any configuration parameters for the method
     * @returns {any}
     */
    forward(algorithm,...params){
        algorithm = typeof algorithm === "string" ? algorithm : new algorithm().constructor.name;
        const name = algorithm,
        getAlgo = this.#getAlgorithm(name);
        if(!getAlgo?.instance) throw new Error(`${name} has not been instanced`);
        return getAlgo.algo_forward(...params);
    }
    /**
     * Reverse the algorithm
     * @param {String|Object} algorithm Algorithm class
     * @param  {...any} params Any configuration parameters for the method
     * @returns {any}
     */
    reverse(algorithm,...params){
        const name = typeof algorithm === "string" ? algorithm : new algorithm().constructor.name,
        getAlgo = this.#getAlgorithm(name);
        if(!getAlgo?.instance) throw new Error(`${name} has not been instanced`);
        return getAlgo.algo_reverse(...params);
    }

    /**
     * Disposes the the algorithm
     * @param {String|Object} algorithm Algorithm name
     * @returns {ReverseEngineer}
     */
    dispose(algorithm) {
        if(algorithm){
            this.#ensureInstanced();
            const name = typeof algorithm === "string" ? algorithm : (algorithm.id || algorithm.name);
            const obj = this.#getAlgorithm(name);
            if (obj?.instance?.dispose)
                obj.instance.dispose();
            this.remove(name);
            return this;
        }else this;
    }

    /**
     * List all the algorithm
     * @returns {String[]} List of loaded algorithms
     */
    list(){
        return this.#algorithms.map(obj=>obj.algo_name);
    }
    /**
     * Uses multiple algorithms
     * @param  {...String|Object} algos Algorithms Objects
     * @returns {ReverseEngineer}
     */
    use(...algos){
        this.#ensureInstanced();
        for (const A in algos) this.add(algos[A]);
        return this;
    }
    /**
     * Checks if the algorithm exists
     * @param {String|Object} algorithm Algorithm object or string
     * @returns {Boolean} True if the algorithm has been loaded, else False
     */
    has(algorithm){
        this.#ensureInstanced();
        return this.#hasAlgorithm(algorithm);
    }
    /**
     * Returns the algorithms information
     * @param {String|Object} algorithm Algorithm name
     * @returns {{algo_name: string, algo_version: string, algo_description: string, __loaded: Boolean}}
     */
    get(algorithm) {
        this.#ensureInstanced();
        const a = this.#getAlgorithm(algorithm);
        if (!a) return null;
        const { algo_name, algo_version, algo_description, __loaded } = a;
        return { algo_name, algo_version, algo_description, __loaded };
    }
    /**
     * Get the length of the of the loaded algorithms
     * @returns {Number} Number of loaded algorithms
     */
    count() {
        this.#ensureInstanced();
        return this.#algorithms.length;
    }
    
    /**
     * Clears out the entire loaded algorithm list
     * @returns {ReverseEngineer}
     */
    clear() { return this.remove(null); }
    /**
     * Get the list of names of loaded algorithms
     * @returns {string[]} Loaded algorithm list
     */
    names() { return this.list(); }
    /**
     * Run a algorithm from a set direction
     * @param {'forward'|'reverse'|'init'} direction Direction type
     * @param {String|Object} algorithm Algorithm name
     * @param  {...any} params Algorithm parameters
     * @returns {any}
     */
    run(direction, algorithm, ...params){
        this.#ensureInstanced();
        const dir = String(direction).toLowerCase();
        if (!["forward", "reverse", "init", "dispose"].includes(dir)) throw new Error(`Unknown direction "${direction}"`);
        if(dir==='dispose') return this[dir](algorithm);
        else return this[dir](algorithm, ...params);
    }
    /**
     * @param {Array<{algo: string|Function, dir: 'forward'|'reverse', args?: any[]}>} steps
     * @param {any} input Initial value passed into the first step
     * @returns {any} The final value
     * @example
     *   const re = new ReverseEngineer().getInstance()
     *   .use(MyAlgo, YourAlgo);
     *
     *   const result = re.pipe([
     *   { algo: MyAlgo,  dir: 'init',    args: [{ rounds: 12 }] },
     *   { algo: MyAlgo,  dir: 'forward' },
     *   { algo: YourAlgo,dir: 'forward', args: ['salt'] },
     *   ], "plain text");
     *
     */
    pipe(steps, input) {
        this.#ensureInstanced();
        return steps.reduce((acc, step) => {
            const { algo, dir, args = [] } = step;
            if (dir === 'forward') return this.forward(algo, acc, ...args);
            if (dir === 'reverse') return this.reverse(algo, acc, ...args);
            if (dir === 'init')    return this.init(algo, acc, ...args);
            if (dir === 'dispose') return this.dispose(algo);
            throw new Error(`Invalid direction: ${dir}`);
        }, input);
    }

    /**
     * Export metadata as a JSON object
     * @returns {JSON} JSON configuration object
     */
    toJSON() {
        this.#ensureInstanced();
        return JSON.stringify(this.#algorithms.map(a => ({
            name: a.algo_name,
            version: a.algo_version,
            description: a.algo_description
        })), null, 2);
    }
    /**
     * Import object from JSON
     * @param {JSON} json JSON object
     * @param {Function} resolver Resolver function
     * @returns {ReverseEngineer}
     */
    fromJSON(json, resolver) {
        // resolver(name) => returns the constructor for that algorithm name
        this.#ensureInstanced();
        const list = JSON.parse(json);
        for (const { name } of list) {
            const AlgoCtor = resolver(name);
            if (AlgoCtor) this.add(AlgoCtor);
        }
        return this;
    }
    
}
/**
 * ReverseEngineer Crypto Utilities
 * @exports CryptoUtils
 * @author XHiddenProjects
 * @version 1.2.0
 * @description Reverse Engineer uses existing algorithms to reverse it back
 * @see {@link https://github.com/XHiddenProjects/ReverseEngineer | Documentation}
 */
export const CryptoUtils = {
    /**
     * Converts base64 to bytes
     * @param {String} b64 base64 string
     * @returns {Uint8Array} bytes
     */
    b64ToBytes: function(b64) {
        return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    },
    /**
     * Converts bytes to base64
     * @param {Uint8Array} bytes bytes
     * @returns {String} base64 string
     */
    bytesToB64: function(bytes) {   
        return btoa(String.fromCharCode(...bytes));
    },
    /**
     * Generates random bytes
     * @param {Number} length length of the array
     * @returns {Uint8Array} random bytes
     */
    randomBytes: function(length) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return array;
    },
    /**
     * Converts utf8 string to bytes
     * @param {String} str utf8 string
     * @returns {Uint8Array} bytes
     */
    utf8ToBytes: function(str) {
        return new TextEncoder().encode(str);
    },
    /**
     * Converts bytes to utf8 string
     * @param {Uint8Array} bytes bytes
     * @returns {String} utf8 string
     */
    bytesToUtf8: function(bytes) {
        return new TextDecoder().decode(bytes);
    },
    /**
     * Generates a base64 key
     * @param {number} length Length of the key in bytes
     * @returns {string} base64-encoded key
     */
    generateB64Key: function(length = 32) {
        const keyBytes = this.randomBytes(length);
        return this.bytesToB64(keyBytes);
    }
};

/**
 * ReverseEngineer GUI
 * @exports ReverseEngineerGUI
 * @author XHiddenProjects
 * @version 1.2.0
 * @description Generates a GUI interface for users
 * @see {@link https://github.com/XHiddenProjects/ReverseEngineer | Documentation}
 */
export const ReverseEngineerGUI = class{
    #instance;
    constructor(){
        this.#instance = new ReverseEngineer().getInstance();
        this.#instance.debug("INFO", "GUI Loaded successfully");
    }
    /**
     * Sets the theme to the GUI
     * @param {String} theme Theme name
     * @returns {ReverseEngineerGUI}
     */
    setTheme(theme='default'){
        theme = theme.toLocaleLowerCase();
        if(!['default'].includes(theme)) throw new Error(`${theme} is not a theme`);
        const themeLink = document.createElement('link');
        themeLink.rel = "stylesheet";
        themeLink.href = `./themes/${theme}.css`;
        document.head.appendChild(themeLink);
        return this;
    }
    /**
     * Generates 
     * @param {{title: string, mount: HTMLElement, algos: Object[]}} [options={}] Options 
     * @returns {HTMLDivElement} The build
     */
    build(options = {}) {
        const inst = this.#instance;
        const opts = {
            title: options.title ?? 'ReverseEngineer',
            mount: options.mount ?? document.body, // can be a Node or a selector string
            algorithms: options.algos ?? ''
        };

        if(opts.algorithms)
            inst.use(...opts.algorithms.sort((a,b)=>b-a))

        // Resolve mount
        const mountEl = typeof opts.mount === 'string' 
            ? document.querySelector(opts.mount) 
            : opts.mount;
        if (!mountEl) throw new Error('ReverseEngineerGUI: mount element not found');

        // Root container
        const gui = document.createElement('div');
        gui.className = "reverse-engineer-gui";
        gui.setAttribute('role', 'application');

        // Build HTML skeleton
        gui.innerHTML = `
        <div class="re-gui-shell">
            <header class="re-gui-nav">
            <div class="re-brand" aria-label="${opts.title}">
                <span class="re-logo" aria-hidden="true">⟲</span>
                <h1 class="re-title">${opts.title}</h1>
            </div>
            <div class="re-actions">
                <button type="button" class="re-btn re-refresh" title="Refresh algorithms (Alt+R)" aria-label="Refresh algorithms">Refresh</button>
                <button type="button"
                        class="re-btn re-icon-btn re-theme-toggle"
                        data-mode="auto"
                        title="Theme: Auto (Alt+T)"
                        aria-label="Toggle theme (Auto)">
                    <!-- One inline SVG that swaps which glyph is visible via CSS -->
                    <svg class="re-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <!-- Auto (A in a circle) -->
                    <g class="icon-auto">
                        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M8.5 15.5L11.5 8.5h1l3 7h-1.6l-.5-1.2h-3.3l-.5 1.2H8.5zm3.1-2.5h2.1L12.7 10l-1.1 3z"
                            fill="currentColor"/>
                    </g>
                    <!-- Light (sun) -->
                    <g class="icon-sun">
                        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/>
                        <g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                        <path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/>
                        <path d="M4.9 4.9l1.4 1.4"/><path d="M17.7 17.7l1.4 1.4"/>
                        <path d="M19.1 4.9l-1.4 1.4"/><path d="M6.3 17.7l-1.4 1.4"/>
                        </g>
                    </g>
                    <!-- Dark (moon) -->
                    <g class="icon-moon">
                        <path d="M15.5 3.5A8 8 0 1 0 20.5 15 6.5 6.5 0 0 1 15.5 3.5z"
                            fill="none" stroke="currentColor" stroke-width="1.5"/>
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
                <div class="re-empty" hidden>No algorithms loaded yet. Use <code>...build({
                    algos: [...algorithms]
                });</code> in your code.</div>
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
                        <label class="re-seg-item">
                            <input type="radio" name="dir" value="init" /> <span>init</span>
                        </label>
                        <label class="re-seg-item">
                            <input type="radio" name="dir" value="forward" checked /> <span>forward</span>
                        </label>
                        <label class="re-seg-item">
                            <input type="radio" name="dir" value="reverse" /> <span>reverse</span>
                        </label>
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
                        <textarea id="re-args" class="re-input re-textarea" rows="3" placeholder='e.g. ["salt", 10, true]  or  salt,10,true'></textarea>
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
                <h2 class="re-panel-title">Output</h2>
                <pre class="re-code" aria-live="polite"><code class="re-code-content">—</code></pre>
                </div>
            </section>
            </div>
        </div>
        `;

        // Insert into DOM
        mountEl.insertAdjacentElement('afterbegin', gui);

        // --- DOM refs
        const listEl = gui.querySelector('.re-algo-list');
        const emptyEl = gui.querySelector('.re-empty');
        const searchInput = gui.querySelector('.re-search-input');
        const refreshBtn = gui.querySelector('.re-refresh');

        const nameEl = gui.querySelector('[data-field="name"]');
        const verEl  = gui.querySelector('[data-field="version"]');
        const descEl = gui.querySelector('[data-field="description"]');

        const formEl = gui.querySelector('.re-form');
        const dirRadios = [...formEl.querySelectorAll('input[name="dir"]')];
        const inputEl = formEl.querySelector('#re-input');
        const argsEl = formEl.querySelector('#re-args');
        const clearBtn = formEl.querySelector('.re-clear');
        const disposeBtn = formEl.querySelector('.re-dispose');
        const outputEl = gui.querySelector('.re-code-content');

        // --- State
        let selected = null;
        let allNames = [];

        // --- Helpers
        const pretty = (val) => {
            try {
                if (typeof val === 'string') {
                    // Try to pretty print JSON strings
                    const maybe = JSON.parse(val);
                    return JSON.stringify(maybe, null, 2);
                }
                return typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
            } catch {
                return typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
            }
        };

        // Keep autoCast as you already have it.
const autoCast = (s) => {
  const t = s.trim();
  if (/^(true|false)$/i.test(t)) return t.toLowerCase() === 'true';
  if (/^(null)$/i.test(t)) return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return t;
};

/**
 * Normalize "JSON-ish" (JS object literal style) into strict JSON:
 * - Quote unquoted object keys: {lower: true} -> {"lower": true}
 * - Convert single-quoted strings to double-quoted strings.
 * - Remove trailing commas.
 * This does NOT evaluate arbitrary code and avoids regexes that break on strings
 * by using a small state machine.
 */
function normalizeJsonishToJson(src) {
  const s = src.trim();
  if (!s) return s;

  // Quick allow-list: only attempt if it looks like object/array.
  if (!/^[\[{]/.test(s)) return s;

  // Pass 1: remove trailing commas before } or ]
  let str = s.replace(/,\s*([}\]])/g, '$1');

  // Pass 2: convert single-quoted strings to double-quoted strings safely
  // We walk and rebuild the string while tracking string states.
  {
    let out = '';
    let inStr = false;
    let quote = '';     // "'" or '"'
    let esc = false;

    for (let i = 0; i < str.length; i++) {
      const ch = str[i];

      if (inStr) {
        if (esc) {
          // Keep escape as-is
          out += ch;
          esc = false;
          continue;
        }
        if (ch === '\\') {
          out += ch;
          esc = true;
          continue;
        }
        if (ch === quote) {
          // Close string
          if (quote === "'") {
            // We have accumulated a single-quoted string in out.
            // Convert surrounding quotes to double quotes. We need to
            // replace the last character in out (the closing ') with ".
            out = out.slice(0, -1) + '"';
          } else {
            out += ch;
          }
          inStr = false;
          quote = '';
          continue;
        }

        // Inside single-quoted string: we need to make it JSON-compatible.
        if (quote === "'") {
          // Replace unescaped " with \"
          if (ch === '"') {
            out += '\\"';
          } else {
            out += ch;
          }
        } else {
          out += ch;
        }
        continue;
      }

      // Not in a string
      if (ch === '"' || ch === "'") {
        inStr = true;
        quote = ch;
        // If starting a single-quoted string, start with a double quote instead
        out += (ch === "'") ? '"' : '"';
        continue;
      }

      out += ch;
    }
    str = out;
  }

  // Pass 3: quote unquoted object keys using a small state machine.
  // We track object/array nesting and when an object expects a key.
  {
    let out = '';
    const stack = []; // 'object' | 'array'
    let inStr = false;
    let esc = false;

    // For object contexts, track if we are at a position expecting a key
    // i.e., right after '{' or ',' until ':' is seen.
    const expectKeyStack = [];

    const isIdentStart = (c) => /[A-Za-z_$]/.test(c);
    const isIdent = (c) => /[A-Za-z0-9_$]/.test(c);

    for (let i = 0; i < str.length; i++) {
      const ch = str[i];

      if (inStr) {
        out += ch;
        if (esc) {
          esc = false;
          continue;
        }
        if (ch === '\\') {
          esc = true;
          continue;
        }
        if (ch === '"') {
          inStr = false;
        }
        continue;
      }

      // Outside strings
      if (ch === '"') {
        inStr = true;
        out += ch;
        continue;
      }

      if (ch === '{') {
        stack.push('object');
        expectKeyStack.push(true);
        out += ch;
        continue;
      }
      if (ch === '[') {
        stack.push('array');
        out += ch;
        continue;
      }
      if (ch === '}') {
        if (stack.pop() === 'object') expectKeyStack.pop();
        out += ch;
        continue;
      }
      if (ch === ']') {
        stack.pop();
        out += ch;
        continue;
      }

      // Inside an object and expecting a key?
      const top = stack[stack.length - 1];
      if (top === 'object') {
        if (ch === ':') {
          // After colon, not expecting a key until next comma.
          expectKeyStack[expectKeyStack.length - 1] = false;
          out += ch;
          continue;
        }
        if (ch === ',') {
          // After comma, expect a key again.
          expectKeyStack[expectKeyStack.length - 1] = true;
          out += ch;
          continue;
        }

        const expectKey = expectKeyStack[expectKeyStack.length - 1];

        if (expectKey) {
          // We’re at potential start of a key: skip whitespace first
          if (/\s/.test(ch)) {
            out += ch;
            continue;
          }

          if (ch === '"') {
            // Already quoted key (handled above, but kept for completeness)
            inStr = true;
            out += ch;
            continue;
          }

          // If it looks like an identifier, quote it
          if (isIdentStart(ch)) {
            let j = i + 1;
            while (j < str.length && isIdent(str[j])) j++;
            const ident = str.slice(i, j);
            // Peek ahead for optional whitespace and a colon; if found, this is a key
            let k = j;
            while (k < str.length && /\s/.test(str[k])) k++;
            if (str[k] === ':') {
              out += `"${ident}"`;
              i = j - 1; // i will be incremented by for-loop
              expectKeyStack[expectKeyStack.length - 1] = false; // until ':'
              continue;
            }
          }
        }
      }

      out += ch;
    }
    str = out;
  }

  return str;
}

const parseArgs = (text) => {
  const raw = text.trim();
  if (!raw) return [];

  // 1) Try to parse entire input as JSON (array/object/primitive)
  try {
    const j = JSON.parse(raw);
    return Array.isArray(j) ? j : [j];
  } catch {
    // continue
  }

  // 2) Split on commas at top level (respecting quotes/brackets/braces/parentheses)
  const parts = [];
  let buf = '';
  let depth = 0;
  let inStr = false;
  let quote = '';
  let esc = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (inStr) {
      buf += ch;
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === quote) { inStr = false; quote = ''; }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inStr = true;
      quote = ch;
      buf += ch;
      continue;
    }

    if (ch === '{' || ch === '[' || ch === '(') { depth++; buf += ch; continue; }
    if (ch === '}' || ch === ']' || ch === ')') { depth = Math.max(0, depth - 1); buf += ch; continue; }

    if (ch === ',' && depth === 0) {
      const tok = buf.trim();
      if (tok) parts.push(tok);
      buf = '';
      continue;
    }

    buf += ch;
  }
  const last = buf.trim();
  if (last) parts.push(last);

  // 3) Token-wise parse: JSON.parse → normalizeJsonishToJson → JSON.parse → autoCast
  return parts.map((p) => {
    // If user wrapped an object in quotes, remove wrapping quotes:
    const isWrappedSingle = p.length >= 2 && p[0] === "'" && p[p.length - 1] === "'";
    const isWrappedDouble = p.length >= 2 && p[0] === '"' && p[p.length - 1] === '"';
    let token = p;

    // If it looks like they quoted an object/array literal, strip the quotes first.
    if ((isWrappedSingle || isWrappedDouble) && /^[\[{].*[\]}]$/.test(p.slice(1, -1).trim())) {
      token = p.slice(1, -1);
    }

    try {
      return JSON.parse(token);
    } catch {
      // try to normalize JSON-ish → strict JSON
      const fixed = normalizeJsonishToJson(token);
      try {
        return JSON.parse(fixed);
      } catch {
        // final fallback
        return autoCast(token);
      }
    }
  });
};

        const setOutput = (val) => {
            outputEl.textContent = pretty(val ?? '—');
        };

        const setDetails = (meta) => {
            nameEl.textContent = meta?.algo_name ?? '—';
            verEl.textContent = meta?.algo_version ?? '—';
            descEl.textContent = meta?.algo_description || '—';
        };

        const setDisabled = (disable) => {
            formEl.querySelectorAll('input, textarea, button').forEach(el => {
                if (el.classList.contains('re-clear')) return; // keep Clear available
                el.disabled = disable;
            });
            disposeBtn.disabled = disable;
        };

        const renderList = (names) => {
            listEl.innerHTML = '';
            if (!names?.length) {
                emptyEl.hidden = false;
                setDetails(null);
                selected = null;
                setDisabled(true);
                return;
            }
            emptyEl.hidden = true;
            names.forEach(n => {
                const li = document.createElement('li');
                li.className = 're-algo-item';
                li.setAttribute('role', 'option');
                li.tabIndex = 0;
                li.dataset.name = n;
                li.innerHTML = `
                <div class="re-algo-name">${n}</div>
                `;
                li.addEventListener('click', () => selectAlgo(n, li));
                li.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectAlgo(n, li);
                    }
                });
                listEl.appendChild(li);
            });
        };

        const selectAlgo = (name, liEl) => {
            selected = name;
            listEl.querySelectorAll('.re-algo-item[aria-selected="true"]')
                .forEach(el => el.removeAttribute('aria-selected'));
            if (liEl) liEl.setAttribute('aria-selected', 'true');

            const meta = inst.get(name);
            setDetails(meta);
            setDisabled(false);
            inst.debug('INFO', `Selected algorithm: ${name}`, meta);
        };

        const refresh = () => {
            allNames = inst.names();
            renderList(allNames);
            setOutput('—');
        };

        const filterList = (q) => {
            const term = q.trim().toLowerCase();
            const filtered = term ? allNames.filter(n => n.toLowerCase().includes(term)) : allNames;
            renderList(filtered);
        };

        // --- Wire events
        refreshBtn.addEventListener('click', refresh);
        searchInput.addEventListener('input', (e) => filterList(e.target.value));

        // Keyboard shortcut: Alt+R to refresh
        gui.addEventListener('keydown', (e) => {
            if (e.altKey && (e.key.toLowerCase() === 'r')) {
                e.preventDefault();
                refreshBtn.click();
            }
        });

        // Form submit: Run
        formEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!selected) return setOutput('Select an algorithm first.');

            const dir = dirRadios.find(r => r.checked)?.value ?? 'forward';
            const inp = inputEl.value;
            const args = parseArgs(argsEl.value);

            try {
                setDisabled(true);

                // Map direction to the corresponding call
                const call = dir === 'init'
                ? () => inst.init(selected, ...args)
                : dir === 'forward'
                ? () => inst.forward(selected, inp, ...args)
                : dir === 'reverse'
                ? () => inst.reverse(selected, inp, ...args)
                : () => { throw new Error(`Unknown direction: ${dir}`); };

                // Await the result whether it is sync or async
                const result = await Promise.resolve(call());

                setOutput(result);
                inst.debug('INFO', `Ran ${dir} on ${selected}`, { input: inp, args, result });
            } catch (err) {
                inst.debug('ERROR', `Run failed: ${err.message}`, err);
                setOutput({ error: err.message });
            } finally {
                setDisabled(false);
            }
            });

        // Clear
        clearBtn.addEventListener('click', () => {
            inputEl.value = '';
            argsEl.value = '';
            setOutput('—');
            inst.debug('DEBUG', 'Cleared inputs and output');
        });

        // Dispose
        disposeBtn.addEventListener('click', () => {
            if (!selected) return;
            try {
                inst.dispose(selected);
                inst.debug('WARN', `Disposed algorithm: ${selected}`);
                selected = null;
                refresh();
                setDetails(null);
            } catch (err) {
                inst.debug('ERROR', `Dispose failed: ${err.message}`, err);
                setOutput({ error: err.message });
            }
        });

        // --- DOM refs (near the other refs)
        const themeBtn = gui.querySelector('.re-theme-toggle');

        // --- Theme helpers
        const THEME_CYCLE = ['auto', 'dark', 'light'];
        const root = document.documentElement;
        const setThemeAttr = (mode) => {
        // apply theme to <html>
        if (mode === 'auto') {
            root.removeAttribute('data-theme');
        } else {
            root.setAttribute('data-theme', mode);
        }
        // reflect state on the icon-only button
        themeBtn.dataset.mode = mode;
        themeBtn.title = `Theme: ${mode[0].toUpperCase()}${mode.slice(1)} (Alt+T)`;
        themeBtn.setAttribute('aria-label', `Toggle theme (${mode[0].toUpperCase()}${mode.slice(1)})`);

        try { localStorage.setItem('re-theme', mode); } catch {}
        };

        // initialize from storage (fallback: auto)
        let themeMode = (() => {
        try { return localStorage.getItem('re-theme') || 'auto'; }
        catch { return 'auto'; }
        })();
        setThemeAttr(themeMode);

        // click to cycle Auto → Dark → Light → …
        themeBtn.addEventListener('click', () => {
        const idx = THEME_CYCLE.indexOf(themeMode);
        themeMode = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
        setThemeAttr(themeMode);
        });

        // keyboard shortcut: Alt+T to toggle theme
        gui.addEventListener('keydown', (e) => {
        if (e.altKey && e.key.toLowerCase() === 't') {
            e.preventDefault();
            themeBtn.click();
        }
        });

        // Initial render
        refresh();

        // Return the GUI element so callers can manage it if needed
        return gui;
    }
};