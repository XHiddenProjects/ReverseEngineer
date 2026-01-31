import { ReverseEngineer } from "../../ReverseEngineer.js";
export const Hex = class extends ReverseEngineer{
    constructor(){
        super();
        this.getInstance();
        // Configuration
        this.description = 'This will forward and reverse in Hexadecimal encoding'
        this.version = '1.0.0';
    }
    /**
     * Execute on initialize
     */
    init(){
        this.debug('INFO','Hexadecimal algorithm successfully loaded!');
    }
    /**
     * This is the forward algorithm
     * @param {string} message Message
     * @returns {Object} Forward object methods
     */
    addForwardAlgorithm(message){
        if(!message) throw new Error("You must include a message");
        let encode = '';
        for(let i=0; i<message.length; i++){
            const hex = message.charCodeAt(i).toString(16);
            encode += (`00${hex}`).slice(-2);
        }
        return encode;
    }
    /**
     * This is the reverse algorithm
     * @param {String} encode Encoded message
     * @returns {Object} Reverse object methods
     */
    addReverseAlgorithm(encode){
        if(!encode) throw new Error("You must include a message");
        let decode = '';
        for(let i=0; i<encode.length; i+=2){
            const hex = encode.substr(i, 2);
            decode += String.fromCharCode(parseInt(hex, 16));
        }
        return decode;
    }
}