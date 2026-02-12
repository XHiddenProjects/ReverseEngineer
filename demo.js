import { ReverseEngineerGUI, CryptoUtils } from './ReverseEngineer.js';
import { Base64 } from './algorithms/Base64/base64.js';
import { Base32 } from './algorithms/Base32/base32.js';
import {CaesarCipher} from './algorithms/CaesarCipher/CaesarCipher.js';
import { AESGCM } from './algorithms/AESGCM/AESGCM .js';
import { BijectiveNumeration } from './algorithms/BijectiveNumeration/BijectiveNumeration.js';
import { Hex } from './algorithms/hex/hex.js';
import { RailFenceCipher } from './algorithms/RailFenceCipher/RailFenceCipher.js';
import { Rot13 } from './algorithms/Rot13/Rot13.js';
import { VigenereCipher } from './algorithms/VigenereCipher/VigenereCipher.js';
import { XORCipher } from './algorithms/xorCipher/xorCipher.js';

const gui = new ReverseEngineerGUI();
gui.setTheme();
gui.build({
    algos: [AESGCM, Base32, Base64, CaesarCipher, BijectiveNumeration, Hex, RailFenceCipher, Rot13, VigenereCipher, XORCipher]
});