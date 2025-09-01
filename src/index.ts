import "dotenv/config";
import SdkTrader from "./trader/SdkTrader";
import CcxtTrader from "./trader/CcxtTrader";

(async () => {
    const wallet = process.env.api_wallet_address;
    const key = process.env.private_key;
    const sdkTrader = new SdkTrader(key);
    const ccxtTrader = new CcxtTrader(wallet!, key!);
    await ccxtTrader.init();
    const start = Date.now();
    console.log(`交易创建时间: ${start}`);
    // Promise.all([sdkTrader.trySendOrder(109700, 0.0001), ccxtTrader.trySendOrder(109700, 0.0001)]);
    // await sdkTrader.trySendOrder(109700, 0.0001); // 2714 -> 4094 = 1380ms
    // await ccxtTrader.trySendOrder(109700, 0.0001); // 6349 -> 8655 = 2306ms
    setTimeout(async () => {
        await sdkTrader.getOrders(process.env.wallet_address!, start);
    }, 5000);
})();