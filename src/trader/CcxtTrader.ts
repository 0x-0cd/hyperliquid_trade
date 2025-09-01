import * as ccxt from "ccxt";

export default class CcxtTrader {
    private exchange: ccxt.Exchange;
    private inited: boolean = false;
    private markets!: { [key: string]: ccxt.Market };

    constructor(address: string, key: string) {
        this.exchange = new ccxt.hyperliquid({
            walletAddress: address,
            privateKey: key,
        });
    }

    async init() {
        this.markets = await this.exchange.loadMarkets();
        this.inited = true;
    }

    async trySendOrder(price: number, amount: number) {
        const advancedOrder = await this.exchange.createOrder(
            'BTC/USDC:USDC',
            'limit',
            'buy',
            amount,
            price,
            {
                'postOnly': true,
                'timeInForce': 'IOC'
            });
    }
}