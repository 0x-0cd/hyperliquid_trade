import * as hl from "@nktkas/hyperliquid";

export default class WebSocketTrader {
    private exchangeClient: hl.ExchangeClient;
    private infoClient: hl.InfoClient;
    private wsTransport: hl.WebSocketTransport;
    
    constructor(key: any) {
        this.wsTransport = new hl.WebSocketTransport({
            url: "wss://api.hyperliquid.xyz/ws", // WebSocket URL
            timeout: 10000,                      // 请求超时
            keepAlive: {
                interval: 30000,                 // 每 30 秒 ping 一次
                timeout: 5000                    // ping 超时
            },
            reconnect: {
                maxRetries: 3,                   // 最大重连尝试次数
                connectionDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 10000) // 指数退避
            },
            autoResubscribe: true                // 重连后自动重新订阅
        });

        this.exchangeClient = new hl.ExchangeClient({
            wallet: key,
            transport: this.wsTransport,
        });

        this.infoClient = new hl.InfoClient({
            transport: new hl.HttpTransport(),
        });
    }

    async trySendOrder(price: number, amount: number) {
        try {
            const result = await this.exchangeClient.order({
                orders: [{
                    a: 0,                    // 资产索引（0 = BTC-USD 永续）
                    b: true,                 // 买单（true = 买入，false = 卖出）
                    p: price.toString(),     // 美元价格
                    s: amount.toString(),    // BTC 数量
                    r: false,                // 非只减仓
                    t: {
                        limit: {
                            tif: "Ioc",      // 撤销前有效
                        },
                    },
                }],
                grouping: "na",             // 无订单分组
            });
            console.log(`✅ WebSocket订单成功 result=${JSON.stringify(result)}`);
            return result;
        } catch (error: any) {
            console.log(`⚠️  WebSocket订单异常: ${error.message || error}`);
            throw error; // 重新抛出异常以保持原有的错误处理逻辑
        }
    }

    async getOrders(wallet: string, till: number) {
        const openOrders = await this.infoClient.historicalOrders({ user: `0x${wallet}` });
        for (const sorder of openOrders) {
            if (sorder.statusTimestamp >= till) {
                console.log(sorder);
            }
        }
    }

    /**
     * 关闭 WebSocket 连接
     */
    async close() {
        try {
            await this.wsTransport.close();
            console.log("WebSocket Trader 连接已关闭");
        } catch (error) {
            console.error("关闭 WebSocket 连接时出错:", error);
        }
    }
}