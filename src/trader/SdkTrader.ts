import * as hl from "@nktkas/hyperliquid";

export default class SdkTrader {
    private exchangeClient: hl.ExchangeClient;
    private infoClient: hl.InfoClient;
    constructor(key: any) {
        this.exchangeClient = new hl.ExchangeClient({
            wallet: key,
            transport: new hl.HttpTransport(),
        });
        this.infoClient = new hl.InfoClient({
            transport: new hl.HttpTransport(),
        });
    }

    async trySendOrder(price: number, amount: number) {
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
    }

    async getOrders(wallet: string, till: number) {
        const openOrders = await this.infoClient.historicalOrders({ user: `0x${wallet}` });
        for (const sorder of openOrders) {
            if (sorder.statusTimestamp >= till) {
                console.log(sorder);
            }
        }
    }
}