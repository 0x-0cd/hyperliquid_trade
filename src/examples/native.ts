import NativeTrader from "../trader/NativeTrader";

(async () => {
    const privateKey = process.env.private_key!;
    const trader = new NativeTrader(privateKey, false);

    try {
        console.log("\n=== 发送限价买单 ===");
        const buyResult = await trader.limitBuy(
            0,          // BTC-USD永续（资产索引0）
            "10000",    // 价格：10,000 USD
            "0.001",    // 数量：0.1 BTC
            "Gtc"       // 时间有效性：Gtc
        );
        console.log("买单结果:", buyResult);
    } catch (error) {
        console.error("买单错误:", error);
    }
})();