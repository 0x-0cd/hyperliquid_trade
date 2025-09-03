/**
 * MessagePack编码工具
 * 基于Hyperliquid SDK中使用的MessagePack实现
 */

/**
 * 编码值为MessagePack格式
 */
export function encode(value: any): Uint8Array {
    if (value === null) {
        return new Uint8Array([0xc0]);
    }
    
    if (value === false) {
        return new Uint8Array([0xc2]);
    }
    
    if (value === true) {
        return new Uint8Array([0xc3]);
    }
    
    if (typeof value === "number") {
        return encodeNumber(value);
    }
    
    if (typeof value === "string") {
        return encodeString(value);
    }
    
    if (Array.isArray(value)) {
        return encodeArray(value);
    }
    
    if (typeof value === "object") {
        return encodeObject(value);
    }
    
    throw new Error(`Unsupported type: ${typeof value}`);
}

/**
 * 编码数字
 */
function encodeNumber(value: number): Uint8Array {
    if (Number.isInteger(value)) {
        return encodeInteger(value);
    } else {
        return encodeFloat(value);
    }
}

/**
 * 编码整数
 */
function encodeInteger(value: number): Uint8Array {
    if (value >= 0) {
        // 正整数
        if (value < 0x80) {
            return new Uint8Array([value]);
        } else if (value < 0x100) {
            return new Uint8Array([0xcc, value]);
        } else if (value < 0x10000) {
            return new Uint8Array([0xcd, (value >> 8) & 0xff, value & 0xff]);
        } else if (value < 0x100000000) {
            return new Uint8Array([
                0xce,
                (value >> 24) & 0xff,
                (value >> 16) & 0xff,
                (value >> 8) & 0xff,
                value & 0xff
            ]);
        } else {
            // 64位整数
            const high = Math.floor(value / 0x100000000);
            const low = value >>> 0;
            return new Uint8Array([
                0xcf,
                (high >> 24) & 0xff,
                (high >> 16) & 0xff,
                (high >> 8) & 0xff,
                high & 0xff,
                (low >> 24) & 0xff,
                (low >> 16) & 0xff,
                (low >> 8) & 0xff,
                low & 0xff
            ]);
        }
    } else {
        // 负整数
        if (value >= -32) {
            return new Uint8Array([0xe0 + (value + 32)]);
        } else if (value >= -128) {
            return new Uint8Array([0xd0, value & 0xff]);
        } else if (value >= -32768) {
            return new Uint8Array([0xd1, (value >> 8) & 0xff, value & 0xff]);
        } else if (value >= -2147483648) {
            return new Uint8Array([
                0xd2,
                (value >> 24) & 0xff,
                (value >> 16) & 0xff,
                (value >> 8) & 0xff,
                value & 0xff
            ]);
        } else {
            // 64位负整数
            const high = Math.floor(value / 0x100000000);
            const low = value >>> 0;
            return new Uint8Array([
                0xd3,
                (high >> 24) & 0xff,
                (high >> 16) & 0xff,
                (high >> 8) & 0xff,
                high & 0xff,
                (low >> 24) & 0xff,
                (low >> 16) & 0xff,
                (low >> 8) & 0xff,
                low & 0xff
            ]);
        }
    }
}

/**
 * 编码浮点数
 */
function encodeFloat(value: number): Uint8Array {
    const buffer = new ArrayBuffer(9);
    const view = new DataView(buffer);
    view.setUint8(0, 0xcb); // double precision float
    view.setFloat64(1, value, false); // big endian
    return new Uint8Array(buffer);
}

/**
 * 编码字符串
 */
function encodeString(value: string): Uint8Array {
    const utf8 = new TextEncoder().encode(value);
    const length = utf8.length;
    
    let header: Uint8Array;
    if (length < 32) {
        header = new Uint8Array([0xa0 + length]);
    } else if (length < 0x100) {
        header = new Uint8Array([0xd9, length]);
    } else if (length < 0x10000) {
        header = new Uint8Array([0xda, (length >> 8) & 0xff, length & 0xff]);
    } else {
        header = new Uint8Array([
            0xdb,
            (length >> 24) & 0xff,
            (length >> 16) & 0xff,
            (length >> 8) & 0xff,
            length & 0xff
        ]);
    }
    
    const result = new Uint8Array(header.length + utf8.length);
    result.set(header, 0);
    result.set(utf8, header.length);
    return result;
}

/**
 * 编码数组
 */
function encodeArray(value: any[]): Uint8Array {
    const length = value.length;
    let header: Uint8Array;
    
    if (length < 16) {
        header = new Uint8Array([0x90 + length]);
    } else if (length < 0x10000) {
        header = new Uint8Array([0xdc, (length >> 8) & 0xff, length & 0xff]);
    } else {
        header = new Uint8Array([
            0xdd,
            (length >> 24) & 0xff,
            (length >> 16) & 0xff,
            (length >> 8) & 0xff,
            length & 0xff
        ]);
    }
    
    const encodedItems = value.map(item => encode(item));
    const totalLength = header.length + encodedItems.reduce((sum, item) => sum + item.length, 0);
    
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    result.set(header, offset);
    offset += header.length;
    
    for (const item of encodedItems) {
        result.set(item, offset);
        offset += item.length;
    }
    
    return result;
}

/**
 * 编码对象
 */
function encodeObject(value: Record<string, any>): Uint8Array {
    const keys = Object.keys(value);
    const length = keys.length;
    
    let header: Uint8Array;
    if (length < 16) {
        header = new Uint8Array([0x80 + length]);
    } else if (length < 0x10000) {
        header = new Uint8Array([0xde, (length >> 8) & 0xff, length & 0xff]);
    } else {
        header = new Uint8Array([
            0xdf,
            (length >> 24) & 0xff,
            (length >> 16) & 0xff,
            (length >> 8) & 0xff,
            length & 0xff
        ]);
    }
    
    const encodedPairs: Uint8Array[] = [];
    for (const key of keys) {
        encodedPairs.push(encodeString(key));
        encodedPairs.push(encode(value[key]));
    }
    
    const totalLength = header.length + encodedPairs.reduce((sum, item) => sum + item.length, 0);
    
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    result.set(header, offset);
    offset += header.length;
    
    for (const pair of encodedPairs) {
        result.set(pair, offset);
        offset += pair.length;
    }
    
    return result;
}
