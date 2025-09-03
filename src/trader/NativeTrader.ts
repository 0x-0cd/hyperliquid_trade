import { privateKeyToAddress, isValidPrivateKey } from "../utils/crypto.js";
import { 
    signL1Action, 
    formatOrderAction, 
    formatCancelAction, 
    sendTransaction 
} from "../utils/hyperliquid.js";

// 时间有效性类型定义
export type TimeInForce = 
    | "Ioc"  // Immediate or Cancel - 立即成交否则取消
    | "Gtc"  // Good Till Cancel - 挂单直到取消  
    | "Alo"; // Add Liquidity Only - 仅添加流动性

/**
 * 原生Hyperliquid交易器
 * 不依赖SDK，直接实现所有交易功能
 */
export default class NativeTrader {
    private privateKey: string;
    private address: string;
    private isTestnet: boolean;

    constructor(privateKey: string, isTestnet: boolean = false) {
        if (!isValidPrivateKey(privateKey)) {
            throw new Error("Invalid private key");
        }
        
        this.privateKey = privateKey;
        this.address = privateKeyToAddress(privateKey);
        this.isTestnet = isTestnet;
        
        // console.log(`NativeTrader初始化完成，地址: ${this.address}`);
    }

    /**
     * 获取交易者地址
     */
    getAddress(): string {
        return this.address;
    }

    /**
     * 发送订单
     */
    async sendOrder(args: {
        asset: number;      // 资产索引（0 = BTC-USD永续）
        isBuy: boolean;     // 买卖方向
        price: string;      // 价格
        size: string;       // 数量
        reduceOnly?: boolean; // 是否只减仓
        timeInForce?: TimeInForce; // 时间有效性（默认"Ioc"）
        clientOrderId?: string; // 客户端订单ID（可选）
    }): Promise<any> {
        const { 
            asset, 
            isBuy, 
            price, 
            size, 
            reduceOnly = false, 
            timeInForce = "Ioc",
            clientOrderId
        } = args;

        // 构造订单动作
        const orderAction = formatOrderAction({
            orders: [{
                a: asset,
                b: isBuy,
                p: price,
                s: size,
                r: reduceOnly,
                t: {
                    limit: {
                        tif: timeInForce,
                    },
                },
                c: clientOrderId,
            }],
            grouping: "na", // 无订单分组
        });

        return await this.executeAction(orderAction);
    }

    /**
     * 批量发送订单
     */
    async sendBatchOrders(orders: Array<{
        asset: number;
        isBuy: boolean;
        price: string;
        size: string;
        reduceOnly?: boolean;
        timeInForce?: TimeInForce;
        clientOrderId?: string;
    }>): Promise<any> {
        const formattedOrders = orders.map(order => ({
            a: order.asset,
            b: order.isBuy,
            p: order.price,
            s: order.size,
            r: order.reduceOnly ?? false,
            t: {
                limit: {
                    tif: order.timeInForce ?? "Ioc",
                },
            },
            c: order.clientOrderId,
        }));

        const orderAction = formatOrderAction({
            orders: formattedOrders,
            grouping: "na",
        });

        return await this.executeAction(orderAction);
    }

    /**
     * 取消订单
     */
    async cancelOrder(asset: number, orderId: number): Promise<any> {
        const cancelAction = formatCancelAction([{ a: asset, o: orderId }]);
        return await this.executeAction(cancelAction);
    }

    /**
     * 批量取消订单
     */
    async cancelOrders(cancels: Array<{ asset: number; orderId: number }>): Promise<any> {
        const formattedCancels = cancels.map(cancel => ({
            a: cancel.asset,
            o: cancel.orderId,
        }));

        const cancelAction = formatCancelAction(formattedCancels);
        return await this.executeAction(cancelAction);
    }

    /**
     * 便捷方法：发送限价买单
     */
    async limitBuy(asset: number, price: string, size: string, timeInForce: TimeInForce = "Ioc"): Promise<any> {
        return await this.sendOrder({
            asset,
            isBuy: true,
            price,
            size,
            timeInForce,
        });
    }

    /**
     * 便捷方法：发送限价卖单
     */
    async limitSell(asset: number, price: string, size: string, timeInForce: TimeInForce = "Ioc"): Promise<any> {
        return await this.sendOrder({
            asset,
            isBuy: false,
            price,
            size,
            timeInForce,
        });
    }

    /**
     * 执行动作（私有方法）
     */
    private async executeAction(action: Record<string, any>): Promise<any> {
        try {
            // 生成nonce（时间戳）
            const nonce = Date.now();

            // 签名动作
            const signature = await signL1Action({
                privateKey: this.privateKey,
                action,
                nonce,
                isTestnet: this.isTestnet,
            });

            // 发送交易
            const result = await sendTransaction({
                action,
                signature,
                nonce,
                isTestnet: this.isTestnet,
            });

            return result;

        } catch (error) {
            throw error;
        }
    }
}