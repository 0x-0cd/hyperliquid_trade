/**
 * 核心加密工具模块
 * 提取自Hyperliquid SDK的加密功能
 */

import { keccak_256 } from "@noble/hashes/sha3";
import { etc, getPublicKey, signAsync, utils } from "@noble/secp256k1";

// 类型定义
export interface Signature {
    r: string;
    s: string;
    v: number;
}

export interface TypedDataDomain {
    name?: string;
    version?: string;
    chainId?: number;
    verifyingContract?: string;
}

export interface TypedDataField {
    name: string;
    type: string;
}

export interface TypedDataTypes {
    [key: string]: TypedDataField[];
}

/**
 * 使用私钥签名EIP712类型化数据
 */
export async function signTypedData(args: {
    privateKey: string;
    domain: TypedDataDomain;
    types: TypedDataTypes;
    primaryType: string;
    message: Record<string, any>;
}): Promise<Signature> {
    const { privateKey, domain, types, primaryType, message } = args;

    const hash = hashTypedData({ domain, types, primaryType, message });
    const signature = await signAsync(hash, cleanHex(privateKey));

    const r = `0x${signature.r.toString(16).padStart(64, "0")}`;
    const s = `0x${signature.s.toString(16).padStart(64, "0")}`;
    const v = signature.recovery + 27;

    return { r, s, v };
}

// 缓存常用的域字段以提高性能
const HYPERLIQUID_DOMAIN_FIELDS: TypedDataField[] = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
];

/**
 * 创建EIP712类型化数据的哈希
 */
function hashTypedData(args: {
    domain: TypedDataDomain;
    types: TypedDataTypes;
    primaryType: string;
    message: Record<string, any>;
}): Uint8Array {
    const { domain, types: types_, primaryType, message } = args;
    
    // 使用预定义的域字段（Hyperliquid总是使用相同的字段）
    const types = {
        EIP712Domain: HYPERLIQUID_DOMAIN_FIELDS,
        ...types_,
    };
    
    const bytes: Uint8Array[] = [new Uint8Array([0x19, 0x01])];
    bytes.push(hashStruct("EIP712Domain", domain, types));
    if (primaryType !== "EIP712Domain") {
        bytes.push(hashStruct(primaryType, message, types));
    }
    
    return keccak_256(etc.concatBytes(...bytes));
}

/**
 * 哈希结构化数据
 */
function hashStruct(primaryType: string, data: Record<string, any>, types: TypedDataTypes): Uint8Array {
    const typeHash = keccak_256(new TextEncoder().encode(encodeType(primaryType, types)));
    const typeFields = types[primaryType];
    if (!typeFields) {
        throw new Error(`Type ${primaryType} not found in types`);
    }
    const encodedValues = typeFields.map((field) =>
        encodeValue(field.type, data[field.name], types)
    );
    return keccak_256(etc.concatBytes(typeHash, ...encodedValues));
}

/**
 * 编码类型定义
 */
function encodeType(primaryType: string, types: TypedDataTypes): string {
    const deps = findTypeDependencies(primaryType, types);
    const sortedDeps = [primaryType, ...deps.filter((d) => d !== primaryType).sort()];

    return sortedDeps
        .map((type) => {
            const typeFields = types[type];
            if (!typeFields) {
                throw new Error(`Type ${type} not found in types`);
            }
            return `${type}(${typeFields.map((field) =>
                `${resolveTypeAlias(field.type)} ${field.name}`
            ).join(",")})`;
        })
        .join("");
}

/**
 * 解析类型别名
 */
function resolveTypeAlias(type: string): string {
    if (type === "uint") return "uint256";
    if (type === "int") return "int256";
    return type;
}

/**
 * 查找类型依赖
 */
function findTypeDependencies(primaryType: string, types: TypedDataTypes, _found = new Set<string>()): string[] {
    if (_found.has(primaryType) || !types[primaryType]) return [];

    _found.add(primaryType);
    for (const field of types[primaryType]) {
        const baseType = field.type.replace(/\[.*?\]/g, "");
        if (types[baseType]) {
            findTypeDependencies(baseType, types, _found);
        }
    }

    return Array.from(_found);
}

/**
 * 编码值
 */
function encodeValue(type: string, value: any, types: TypedDataTypes): Uint8Array {
    // 处理数组类型
    const arrayMatch = type.match(/^(.*)\[(\d*)\]$/);
    if (arrayMatch) {
        const [, baseType, len] = arrayMatch;
        if (!baseType) {
            throw new Error(`Invalid array type: ${type}`);
        }
        if (!Array.isArray(value)) {
            throw new Error(`Expected array for ${type}. Received: ${typeof value}`);
        }
        if (len && value.length !== +len) {
            throw new Error(`Invalid length for ${type}: expected ${len}. Received: ${value.length}`);
        }

        const encodedElements = value.map((v) => encodeValue(baseType, v, types));
        return keccak_256(etc.concatBytes(...encodedElements));
    }

    // 处理自定义类型
    if (types[type]) {
        if (value === undefined) return new Uint8Array(32);
        return hashStruct(type, value, types);
    }

    // 处理基础类型
    if (type === "string") {
        return keccak_256(new TextEncoder().encode(value));
    }

    if (type === "address") {
        const bytes = etc.hexToBytes(cleanHex(value));
        if (bytes.length !== 20) {
            throw new Error(`Address must be 20 bytes.`);
        }
        const padded = new Uint8Array(32);
        padded.set(bytes, 12);
        return padded;
    }

    if (type.startsWith("uint") || type.startsWith("int")) {
        const isUint = type.startsWith("uint");
        const bitsStr = type.slice(isUint ? 4 : 3);
        const bits = parseInt(bitsStr || "256");

        if (bits > 256 || bits % 8 !== 0) {
            throw new Error(`Invalid ${isUint ? "uint" : "int"} size: ${bitsStr}. Must be 8-256 in steps of 8`);
        }

        const bigIntValue = BigInt(value);
        const resizedValue = isUint ? BigInt.asUintN(bits, bigIntValue) : BigInt.asIntN(bits, bigIntValue);
        const hex = BigInt.asUintN(256, resizedValue).toString(16).padStart(64, "0");
        return etc.hexToBytes(hex);
    }

    if (type === "bool") {
        const result = new Uint8Array(32);
        result[31] = value ? 1 : 0;
        return result;
    }

    if (type === "bytes") {
        const bytes = typeof value === "string" ? etc.hexToBytes(cleanHex(value)) : value;
        return keccak_256(bytes);
    }

    const bytesMatch = type.match(/^bytes(\d+)$/);
    if (bytesMatch && bytesMatch[1]) {
        const size = parseInt(bytesMatch[1]);
        if (size === 0 || size > 32) {
            throw new Error(`bytesN size must be 1-32. Received: ${size}`);
        }

        const bytes = etc.hexToBytes(cleanHex(value));
        if (bytes.length !== size) {
            throw new Error(`${type} requires exactly ${size} bytes. Received: ${bytes.length} from '${value}'`);
        }

        const padded = new Uint8Array(32);
        padded.set(bytes, 0);
        return padded;
    }

    throw new Error(`Unsupported type: '${type}'.`);
}

/**
 * 清理十六进制字符串
 */
function cleanHex(hex: string): string {
    return hex.startsWith("0x") ? hex.slice(2) : hex;
}

/**
 * 验证私钥是否有效
 */
export function isValidPrivateKey(privateKey: string): boolean {
    if (typeof privateKey !== "string") return false;
    try {
        return utils.isValidPrivateKey(cleanHex(privateKey));
    } catch {
        return false;
    }
}

/**
 * 私钥转换为以太坊地址
 */
export function privateKeyToAddress(privateKey: string): string {
    const cleanPrivKey = cleanHex(privateKey);
    const publicKey = getPublicKey(cleanPrivKey, false);
    const publicKeyWithoutPrefix = publicKey.slice(1);
    const hash = keccak_256(publicKeyWithoutPrefix);
    const addressBytes = hash.slice(-20);
    const address = etc.bytesToHex(addressBytes);
    return `0x${address}`;
}

/**
 * Keccak256哈希函数
 */
export function keccak256(data: Uint8Array): Uint8Array {
    return keccak_256(data);
}
