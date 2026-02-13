import { ReverseEngineer } from "../../ReverseEngineer.js";
export const VigenereCipher = class extends ReverseEngineer{
    name = "Vigenère Cipher"
    description = 'This will forward and reverse in Vigenère Cipher'
    version = '1.1.0';
    static UI_POLICY = {
        requiresInit:false,
        directions:{
          init:{ input:false, args:false, inputPh:'—', argsPh:'—' },
          forward:{ input:true, args:true, inputPh:'Plaintext to encrypt (letters preserved)', argsPh:`[key, characters?]\nDefaults: ["<your-key>", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"]\nExamples:\n ["LEMON"]\n ["KEY", "abcdefghijklmnopqrstuvwxyz"]` },
          reverse:{ input:true, args:true, inputPh:'Ciphertext to decrypt', argsPh:`[key, characters?] // must match forward\nExamples:\n ["LEMON"]` }
        }
    }
    constructor(){
        super();
        this.getInstance();
    }
    /**
     * Execute on initialize
     */
    init(){
        this.debug('INFO','Vigenère Cipher algorithm successfully loaded!');
    }
    /**
     * This is the forward algorithm
     * @param {string} message Message
     * @param {string} key Key
     * @param {string} [characters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'] Characters
     * @returns {Object} Forward object methods
     */
    addForwardAlgorithm(message, key, characters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'){
        if(!message) throw new Error("You must include a message");
        if(!key) throw new Error("You must include a key");
        const split = characters.split('');
        let encode = '';
        const isUpperCase = (char) => /[A-Z]/.test(char);
        const isLowerCase = (char) => /[a-z]/.test(char);
        let keyIndex = 0;
        for(let msg in message){
            const index = split.indexOf(message[msg].toLocaleUpperCase())
            if(index<0) encode+=message[msg];
            else{
                const keyChar = key[keyIndex % key.length].toLocaleUpperCase();
                const keyCharIndex = split.indexOf(keyChar);
                if(keyCharIndex<0) throw new Error(`Invalid character '${keyChar}' in key`);
                const newIndex = (index + keyCharIndex) % split.length
                if(isUpperCase(message[msg]))
                    encode+=split[newIndex].toLocaleUpperCase();
                else if(isLowerCase(message[msg]))
                    encode+=split[newIndex].toLocaleLowerCase();
                else
                    encode+=split[newIndex]
                keyIndex++;
            }
        }
        return encode;
    }
    /**
     * This is the reverse algorithm
     * @param {String} encode Encoded message
     * @param {string} key Key
     * @param {string} [characters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'] Characters
     * @returns {Object} Reverse object methods
     */
    addReverseAlgorithm(encode, key, characters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'){
        if(!encode) throw new Error("You must include a message");
        if(!key) throw new Error("You must include a key");
        const split = characters.split('');
        let decode = '';
        const isUpperCase = (char) => /[A-Z]/.test(char);
        const isLowerCase = (char) => /[a-z]/.test(char);
        let keyIndex = 0;
        for(let msg in encode){
            const index = split.indexOf(encode[msg].toLocaleUpperCase())
            if(index<0) decode+=encode[msg];
            else{
                const keyChar = key[keyIndex % key.length].toLocaleUpperCase();
                const keyCharIndex = split.indexOf(keyChar);
                if(keyCharIndex<0) throw new Error(`Invalid character '${keyChar}' in key`);
                const newIndex = (index - keyCharIndex + split.length) % split.length;
                if(isUpperCase(encode[msg]))
                    decode+=split[newIndex].toLocaleUpperCase();
                else if(isLowerCase(encode[msg]))
                    decode+=split[newIndex].toLocaleLowerCase();
                else decode+=split[newIndex];
                
                keyIndex++;
            }
        }
        return decode;
    }
}