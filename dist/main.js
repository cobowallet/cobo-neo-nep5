"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const neon_core_1 = require("@cityofzion/neon-core");
const abi = __importStar(require("./abi"));
const log = neon_core_1.logging.default("nep5");
const parseTokenInfo = neon_core_1.rpc.buildParser(neon_core_1.rpc.StringParser, neon_core_1.rpc.StringParser, neon_core_1.rpc.IntegerParser, neon_core_1.rpc.Fixed8Parser);
const parseTokenInfoAndBalance = neon_core_1.rpc.buildParser(neon_core_1.rpc.StringParser, neon_core_1.rpc.StringParser, neon_core_1.rpc.IntegerParser, neon_core_1.rpc.Fixed8Parser, neon_core_1.rpc.Fixed8Parser);
/**
 * Get the balance of a single token for a single address.
 * @param url Url of the NEO node to query.
 * @param scriptHash ScriptHash of the NEP5 contract.
 * @param address the Address to query for the balance.
 */
function getTokenBalance(url, scriptHash, address) {
    return __awaiter(this, void 0, void 0, function* () {
        const sb = new neon_core_1.sc.ScriptBuilder();
        abi.decimals(scriptHash)(sb);
        abi.balanceOf(scriptHash, address)(sb);
        const script = sb.str;
        try {
            const res = yield neon_core_1.rpc.Query.invokeScript(script).execute(url);
            const decimals = neon_core_1.rpc.IntegerParser(res.result.stack[0]);
            return neon_core_1.rpc
                .Fixed8Parser(res.result.stack[1])
                .mul(Math.pow(10, 8 - decimals));
        }
        catch (err) {
            log.error(`getTokenBalance failed with : ${err.message}`);
            throw err;
        }
    });
}
exports.getTokenBalance = getTokenBalance;
/**
 * Get token balances for an address.
 * @param url URL of the NEO node to query.
 * @param scriptHashArray Array of contract scriptHashes.
 * @param address Address to query for balance of tokens.
 */
function getTokenBalances(url, scriptHashArray, address) {
    return __awaiter(this, void 0, void 0, function* () {
        const addrScriptHash = neon_core_1.u.reverseHex(neon_core_1.wallet.getScriptHashFromAddress(address));
        const sb = new neon_core_1.sc.ScriptBuilder();
        scriptHashArray.forEach(scriptHash => {
            sb.emitAppCall(scriptHash, "symbol")
                .emitAppCall(scriptHash, "decimals")
                .emitAppCall(scriptHash, "balanceOf", [addrScriptHash]);
        });
        const res = yield neon_core_1.rpc.Query.invokeScript(sb.str).execute(url);
        const tokenList = {};
        if (!res ||
            !res.result ||
            !res.result.stack ||
            res.result.stack.length !== 3 * scriptHashArray.length) {
            throw new Error("Stack returned was invalid");
        }
        try {
            for (let i = 0; i < res.result.stack.length; i += 3) {
                try {
                    const symbol = neon_core_1.rpc.StringParser(res.result.stack[i]);
                    const decimals = neon_core_1.rpc.IntegerParser(res.result.stack[i + 1]);
                    tokenList[symbol] = neon_core_1.rpc
                        .Fixed8Parser(res.result.stack[i + 2])
                        .mul(Math.pow(10, 8 - decimals));
                }
                catch (e) {
                    log.error(`single call in getTokenBalances failed with : ${e.message}`);
                    throw e;
                }
            }
            return tokenList;
        }
        catch (err) {
            log.error(`getTokenBalances failed with : ${err.message}`);
            throw err;
        }
    });
}
exports.getTokenBalances = getTokenBalances;
/**
 * Retrieves the complete information about a token.
 * @param url RPC Node url to query.
 * @param scriptHash ScriptHash of the NEP5 contract.
 * @param address Optional address to query the balance for. If provided, the returned object will include the balance property.
 */
function getToken(url, scriptHash, address) {
    return __awaiter(this, void 0, void 0, function* () {
        const parser = address ? parseTokenInfoAndBalance : parseTokenInfo;
        const sb = new neon_core_1.sc.ScriptBuilder();
        abi.name(scriptHash)(sb);
        abi.symbol(scriptHash)(sb);
        abi.decimals(scriptHash)(sb);
        abi.totalSupply(scriptHash)(sb);
        if (address) {
            abi.balanceOf(scriptHash, address)(sb);
        }
        const script = sb.str;
        try {
            const res = yield neon_core_1.rpc.Query.invokeScript(script)
                .parseWith(parser)
                .execute(url);
            const result = {
                name: res[0],
                symbol: res[1],
                decimals: res[2],
                totalSupply: res[3].div(Math.pow(10, 8 - res[2])).toNumber()
            };
            if (address) {
                result.balance = res[4].div(Math.pow(10, 8 - res[2]));
            }
            return result;
        }
        catch (err) {
            log.error(`getToken failed with : ${err.message}`);
            throw err;
        }
    });
}
exports.getToken = getToken;
/**
 * Retrieves the complete information about a list of tokens.
 * @param url RPC Node url to query.
 * @param scriptHashArray Array of NEP5 contract scriptHashes.
 * @param address Optional address to query the balance for. If provided, the returned object will include the balance property.
 */
function getTokens(url, scriptHashArray, address) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sb = new neon_core_1.sc.ScriptBuilder();
            scriptHashArray.forEach(scriptHash => {
                if (address) {
                    const addrScriptHash = neon_core_1.u.reverseHex(neon_core_1.wallet.getScriptHashFromAddress(address));
                    sb.emitAppCall(scriptHash, "name")
                        .emitAppCall(scriptHash, "symbol")
                        .emitAppCall(scriptHash, "decimals")
                        .emitAppCall(scriptHash, "totalSupply")
                        .emitAppCall(scriptHash, "balanceOf", [addrScriptHash]);
                }
                else {
                    sb.emitAppCall(scriptHash, "name")
                        .emitAppCall(scriptHash, "symbol")
                        .emitAppCall(scriptHash, "decimals")
                        .emitAppCall(scriptHash, "totalSupply");
                }
            });
            const res = yield neon_core_1.rpc.Query.invokeScript(sb.str).execute(url);
            const result = [];
            const step = address ? 5 : 4;
            for (let i = 0; i < res.result.stack.length; i += step) {
                const name = neon_core_1.rpc.StringParser(res.result.stack[i]);
                const symbol = neon_core_1.rpc.StringParser(res.result.stack[i + 1]);
                const decimals = neon_core_1.rpc.IntegerParser(res.result.stack[i + 2]);
                const totalSupply = neon_core_1.rpc
                    .Fixed8Parser(res.result.stack[i + 3])
                    .dividedBy(Math.pow(10, decimals - neon_core_1.rpc.IntegerParser(res.result.stack[i + 2])))
                    .toNumber();
                const balance = address
                    ? neon_core_1.rpc
                        .Fixed8Parser(res.result.stack[i + 4])
                        .dividedBy(Math.pow(10, decimals - neon_core_1.rpc.IntegerParser(res.result.stack[i + 2])))
                    : undefined;
                const obj = {
                    name,
                    symbol,
                    decimals,
                    totalSupply,
                    balance
                };
                if (!obj.balance) {
                    delete obj.balance;
                }
                result.push(obj);
            }
            return result;
        }
        catch (err) {
            log.error(`getTokens failed with : ${err.message}`);
            throw err;
        }
    });
}
exports.getTokens = getTokens;
//# sourceMappingURL=main.js.map