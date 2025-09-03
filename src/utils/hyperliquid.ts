/**
 * Hyperliquid特定的签名和哈希工具
 * 提取自Hyperliquid SDK的核心逻辑
 */

import { keccak256, signTypedData, type Signature } from "./crypto.js";
import { encode as encodeMsgpack } from "@msgpack/msgpack";
import { etc } from "@noble/secp256k1";

/**
 * 创建L1动作哈希
 */
export function createL1ActionHash(args: {
    action: Record<string, unknown> | unknown[];
    nonce: number;
    vaultAddress?: string;
    expiresAfter?: number;
}): string {
    const { action, nonce, vaultAddress, expiresAfter } = args;
    
    // 1. 编码动作数据
    const actionBytes = encodeMsgpack(action);
    
    // 2. 编码nonce为uint64
    const nonceBytes = toUint64Bytes(nonce);
    
    // 3. 处理vault地址
    const vaultMarker = vaultAddress ? new Uint8Array([1]) : new Uint8Array([0]);
    const vaultBytes = vaultAddress ? hexToBytes(vaultAddress.slice(2)) : new Uint8Array();
    
    // 4. 处理过期时间
    const expiresMarker = expiresAfter !== undefined ? new Uint8Array([0]) : new Uint8Array();
    const expiresBytes = expiresAfter !== undefined ? toUint64Bytes(expiresAfter) : new Uint8Array();
    
    // 5. 连接所有字节并计算哈希
    const allBytes = concatBytes(
        actionBytes,
        nonceBytes,
        vaultMarker,
        vaultBytes,
        expiresMarker,
        expiresBytes
    );
    
    const hash = keccak256(allBytes);
    return `0x${bytesToHex(hash)}`;
}

/**
 * 签名L1动作
 */
// 缓存Hyperliquid的固定类型定义
const HYPERLIQUID_DOMAIN = {
    name: "Exchange",
    version: "1",
    chainId: 1337,
    verifyingContract: "0x0000000000000000000000000000000000000000",
};

const AGENT_TYPES = {
    Agent: [
        { name: "source", type: "string" },
        { name: "connectionId", type: "bytes32" },
    ],
};

export async function signL1Action(args: {
    privateKey: string;
    action: Record<string, unknown> | unknown[];
    nonce: number;
    isTestnet?: boolean;
    vaultAddress?: string;
    expiresAfter?: number;
}): Promise<Signature> {
    const { privateKey, action, nonce, isTestnet = false, vaultAddress, expiresAfter } = args;
    
    const actionHash = createL1ActionHash({ action, nonce, vaultAddress, expiresAfter });
    
    const message = {
        source: isTestnet ? "b" : "a",
        connectionId: actionHash,
    };
    
    return await signTypedData({
        privateKey,
        domain: HYPERLIQUID_DOMAIN,
        types: AGENT_TYPES,
        primaryType: "Agent",
        message,
    });
}

/**
 * 格式化订单动作
 */
export function formatOrderAction(args: {
    orders: Array<{
        a: number;      // 资产索引
        b: boolean;     // 买卖方向
        p: string;      // 价格
        s: string;      // 数量
        r: boolean;     // 是否只减仓
        t: {
            limit: {
                tif: string; // 时间有效性
            };
        };
        c?: string;     // 客户端订单ID（可选）
    }>;
    grouping: string;
    builder?: string;
}): Record<string, any> {
    const { orders, grouping, builder } = args;
    
    const formattedAction: Record<string, any> = {
        type: "order",
        orders: orders.map((order) => {
            const formattedOrder: Record<string, any> = {
                a: order.a,
                b: order.b,
                p: formatDecimal(order.p),
                s: formatDecimal(order.s),
                r: order.r,
                t: {
                    limit: {
                        tif: order.t.limit.tif,
                    },
                },
            };
            
            if (order.c !== undefined) {
                formattedOrder.c = order.c;
            }
            
            return formattedOrder;
        }),
        grouping: grouping,
    };
    
    if (builder !== undefined) {
        formattedAction.builder = builder;
    }
    
    return formattedAction;
}

/**
 * 格式化取消订单动作
 */
export function formatCancelAction(cancels: Array<{ a: number; o: number }>): Record<string, any> {
    return {
        type: "cancel",
        cancels: cancels.map((cancel) => ({
            a: cancel.a,
            o: cancel.o,
        })),
    };
}

/**
 * 发送交易请求到Hyperliquid API
 */
export async function sendTransaction(args: {
    action: Record<string, any>;
    signature: Signature;
    nonce: number;
    isTestnet?: boolean;
}): Promise<any> {
    const { action, signature, nonce, isTestnet = false } = args;
    
    const apiUrl = isTestnet 
        ? "https://api.hyperliquid-testnet.xyz/exchange"
        : "https://api.hyperliquid.xyz/exchange";
    
    const requestBody = {
        action,
        signature: {
            r: signature.r,
            s: signature.s,
            v: signature.v,
        },
        nonce,
    };
    
    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }
    
    return await response.json();
}

// 辅助函数

/**
 * 将数字转换为64位大端字节
 */
function toUint64Bytes(n: number): Uint8Array {
    const bytes = new Uint8Array(8);
    new DataView(bytes.buffer).setBigUint64(0, BigInt(n), false);
    return bytes;
}

// 使用@noble库的高效字节操作函数
const { concatBytes, hexToBytes, bytesToHex } = etc;

/**
 * 格式化小数字符串
 */
function formatDecimal(value: string): string {
    // 移除多余的小数点后的零
    return parseFloat(value).toString();
}

/**
 * 将签名对象转换为字符串格式（可选工具函数）
 */
function signatureToString(signature: Signature): string {
    const r = signature.r.startsWith("0x") ? signature.r.slice(2) : signature.r;
    const s = signature.s.startsWith("0x") ? signature.s.slice(2) : signature.s;
    const v = signature.v.toString(16).padStart(2, "0");
    return `0x${r}${s}${v}`;
}
