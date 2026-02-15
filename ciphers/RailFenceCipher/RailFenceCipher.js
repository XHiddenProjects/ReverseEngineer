import { ReverseEngineer } from "../../ReverseEngineer.js";
export const RailFenceCipher = class extends ReverseEngineer {
    static name = "Rail Fence Cipher"
    static version = "1.1.1";
    static description = "Rail Fence cipher (zig-zag). Works best on letters/spaces; preserves chars.";
    static UI_POLICY = {
        requiresInit:false,
        directions:{
          init:{ input:false, args:false, inputPh:'—', argsPh:'—' },
          forward:{ input:true, args:true, inputPh:'Plain text to encode (zig‑zag)', argsPh:`[rails?] // integer ≥ 2\nExamples:\n [3]\n [4]` },
          reverse:{ input:true, args:true, inputPh:'Cipher text to decode (zig‑zag)', argsPh:`[rails?] // must match rails used to encode` }
        }
    }
    static category = "Ciphers";
    static tags = ["Rail Fence", "Zigzag", "Transposition", "Rails", "Encrypt", "Decrypt"];
    constructor(){
        super();
        this.getInstance();
    }
    /**
     * Encode text using Rail Fence Cipher
     * @param {string} text Input text
     * @param {number} rails Number of rails
     * @returns {string} Encoded text
     */
    addForwardAlgorithm(text = "", rails = 3) {
        const r = Number(rails);
        if (r < 2) throw new Error("rails must be >= 2");
        const s = String(text);
        const rows = Array.from({ length: r }, () => []);
        let row = 0, dir = 1;

        for (const ch of s) {
        rows[row].push(ch);
        if (row === 0) dir = 1;
        else if (row === r - 1) dir = -1;
        row += dir;
        }
        return rows.map(a => a.join("")).join("");
    }
    /**
     * Decode text using Rail Fence Cipher
     * @param {string} cipher Encoded text
     * @param {number} rails Number of rails
     * @returns {string} Decoded text
     */
    addReverseAlgorithm(cipher = "", rails = 3) {
        const r = Number(rails);
        if (r < 2) throw new Error("rails must be >= 2");
        const s = String(cipher);
        const n = s.length;

        // Step 1: mark zig-zag positions
        const marks = Array.from({ length: r }, () => Array(n).fill(false));
        let row = 0, dir = 1;
        for (let i = 0; i < n; i++) {
        marks[row][i] = true;
        if (row === 0) dir = 1;
        else if (row === r - 1) dir = -1;
        row += dir;
        }

        // Step 2: fill marked positions row by row
        const grid = Array.from({ length: r }, () => Array(n).fill(null));
        let idx = 0;
        for (let rr = 0; rr < r; rr++) {
        for (let i = 0; i < n; i++) {
            if (marks[rr][i]) grid[rr][i] = s[idx++];
        }
        }

        // Step 3: read zig-zag to reconstruct
        let res = "";
        row = 0; dir = 1;
        for (let i = 0; i < n; i++) {
        res += grid[row][i];
        if (row === 0) dir = 1;
        else if (row === r - 1) dir = -1;
        row += dir;
        }
        return res;
    }
}