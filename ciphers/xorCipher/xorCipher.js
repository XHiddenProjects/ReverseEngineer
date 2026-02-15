import { ReverseEngineer } from "../../ReverseEngineer.js";
export const XORCipher = class extends ReverseEngineer{
    // Configuration
    static name = "XOR Cipher"
    static description = 'This will forward and reverse in XOR Cipher'
    static version = '1.1.1';
    static UI_POLICY = {
        requiresInit:false,
        directions:{
          init:{ input:false, args:false, inputPh:'—', argsPh:'—' },
          forward:{ input:true, args:true, inputPh:'Plaintext to XOR', argsPh:`[key, returnAs?]\nreturnAs: "text" | "hex" | "binary"\nExamples:\n ["secret"]\n ["secret", "hex"]\n ["secret", "binary"]` },
          reverse:{ input:true, args:true, inputPh:'XOR data to decrypt (text/hex/binary)', argsPh:`[key, inputAs?]\ninputAs: "text" | "hex" | "binary"\nExamples:\n ["secret"]\n ["secret", "hex"]\n ["secret", "binary"]` }
        }
    }
    static category = "Ciphers";
    static tags = ["XOR", "Symmetric", "Stream", "Keyed XOR", "Text", "Hex", "Binary"];
    constructor(){
        super();
        this.getInstance(); 
    }
    /**
     * Execute on initialize
     */
    init(){
        this.debug('INFO','XOR Cipher algorithm successfully loaded!');
    }
    /**
     * This is the forward algorithm
     * @param {string} message Message
     * @param {string} key Key
     * @param {string} [returnAs='text'] Hex, Text, or Binary
     * @returns {Object} Forward object methods
     */
    addForwardAlgorithm(message, key, returnAs='text'){
        if(!message) throw new Error("You must include a message");
        if(!key) throw new Error("You must include a key");
        let encode = '';
        for(let i=0; i<message.length; i++){
            const msgChar = message.charCodeAt(i);
            const keyChar = key.charCodeAt(i % key.length);
            const xorChar = msgChar ^ keyChar;
            encode += String.fromCharCode(xorChar);
        }
        if(returnAs.toLowerCase() === 'hex'){
            let hexEncode = '';
            for(let i=0; i<encode.length; i++){
                const hex = encode.charCodeAt(i).toString(16);
                hexEncode += (`00${hex}`).slice(-2);
            }
            return hexEncode;
        }
        if(returnAs.toLowerCase() === 'binary'){
            let binaryEncode = '';
            for(let i=0; i<encode.length; i++){
                const binary = encode.charCodeAt(i).toString(2);
                binaryEncode += (`00000000${binary}`).slice(-8);
            }
            return binaryEncode;
        }
        return encode;
    }
    /**
     * This is the reverse algorithm
     * @param {String} encode Encoded message
     * @param {string} key Key
     * @param {string} [inputAs='text'] Hex, Text, or Binary
     * @returns {Object} Reverse object methods
     */
    addReverseAlgorithm(encode, key, inputAs='text'){
        if(!encode) throw new Error("You must include an encoded message");
        if(!key) throw new Error("You must include a key");
        let decode = '';
        if(inputAs.toLowerCase() === 'hex'){
            let hexDecode = '';
            for(let i=0; i<encode.length; i+=2){
                const hex = encode.substr(i, 2);
                const charCode = parseInt(hex, 16);
                hexDecode += String.fromCharCode(charCode);
            }
            encode = hexDecode;
        }
        if(inputAs.toLowerCase() === 'binary'){
            let binaryDecode = '';
            for(let i=0; i<encode.length; i+=8){
                const binary = encode.substr(i, 8);
                const charCode = parseInt(binary, 2);
                binaryDecode += String.fromCharCode(charCode);
            }
            encode = binaryDecode;
        }
        for(let i=0; i<encode.length; i++){
            const encChar = encode.charCodeAt(i);
            const keyChar = key.charCodeAt(i % key.length);
            const xorChar = encChar ^ keyChar;
            decode += String.fromCharCode(xorChar);
        }
        return decode;
    }
}