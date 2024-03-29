import { sc, u, wallet } from "@cityofzion/neon-core";
function addressToScriptHash(address) {
    return u.reverseHex(wallet.getScriptHashFromAddress(address));
}
/**
 * Returns a function that applies a APPCALL for name to a ScriptBuilder.
 * @example
 * var generator = name(contractScriptHash);
 * var script = generator().str;
 */
export function name(scriptHash) {
    return (sb = new sc.ScriptBuilder()) => {
        return sb.emitAppCall(scriptHash, "name");
    };
}
/**
 * Returns a function that applies a APPCALL for symbol to a ScriptBuilder.
 * @example
 * var generator = symbol(contractScriptHash);
 * var script = generator().str;
 */
export function symbol(scriptHash) {
    return (sb = new sc.ScriptBuilder()) => {
        return sb.emitAppCall(scriptHash, "symbol");
    };
}
/**
 * Returns a function that applies a APPCALL for decimals to a ScriptBuilder.
 * @example
 * var generator = decimals(contractScriptHash);
 * var script = generator().str;
 */
export function decimals(scriptHash) {
    return (sb = new sc.ScriptBuilder()) => {
        return sb.emitAppCall(scriptHash, "decimals");
    };
}
/**
 * Returns a function that applies a APPCALL for totalSupply to a ScriptBuilder.
 * @example
 * var generator = totalSupply(contractScriptHash);
 * var script = generator().str;
 */
export function totalSupply(scriptHash) {
    return (sb = new sc.ScriptBuilder()) => {
        return sb.emitAppCall(scriptHash, "totalSupply");
    };
}
/**
 * Returns a function that applies a APPCALL for balanceOf to a ScriptBuilder.
 * @example
 * var generator = balanceOf(contractScriptHash, address);
 * var script = generator().str;
 */
export function balanceOf(scriptHash, addr) {
    return (sb = new sc.ScriptBuilder()) => {
        const addressHash = addressToScriptHash(addr);
        return sb.emitAppCall(scriptHash, "balanceOf", [addressHash]);
    };
}
/**
 * Returns a function that applies a APPCALL for balanceOf to a ScriptBuilder.
 * amt is multipled by 100,000,000. The minimum number that can be provided is thus 0.00000001.
 * @example
 * var generator = transfer(contractScriptHash, sendingAddress, receivingAddress, amt);
 * var script = generator().str;
 */
export function transfer(scriptHash, fromAddr, toAddr, amt) {
    return (sb = new sc.ScriptBuilder()) => {
        const fromHash = addressToScriptHash(fromAddr);
        const toHash = addressToScriptHash(toAddr);
        const adjustedAmt = new u.Fixed8(amt).toRawNumber();
        return sb.emitAppCall(scriptHash, "transfer", [
            fromHash,
            toHash,
            sc.ContractParam.integer(adjustedAmt.toString())
        ]);
    };
}
//# sourceMappingURL=abi.js.map