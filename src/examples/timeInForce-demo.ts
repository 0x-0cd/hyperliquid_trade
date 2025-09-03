/**
 * TimeInForce 配置演示
 * 展示如何使用不同的时间有效性选项
 */

import NativeTrader, { type TimeInForce } from "../trader/NativeTrader.js";

async function timeInForceDemo() {
    const privateKey = process.env.private_key!;
    const trader = new NativeTrader(privateKey, false); // 使用主网
    
    console.log("=== TimeInForce 配置演示 ===\n");
    console.log(`交易者地址: ${trader.getAddress()}\n`);
    
    // 演示所有可用的TimeInForce选项
    const timeInForceOptions: TimeInForce[] = ["Ioc", "Gtc", "Alo"];
    
    console.log("支持的TimeInForce选项:");
    timeInForceOptions.forEach(tif => {
        switch (tif) {
            case "Ioc":
                console.log(`✓ ${tif} - Immediate or Cancel (立即成交否则取消)`);
                break;
            case "Gtc":
                console.log(`✓ ${tif} - Good Till Cancel (挂单直到取消)`);
                break;
            case "Alo":
                console.log(`✓ ${tif} - Add Liquidity Only (仅添加流动性)`);
                break;
        }
    });
    
    console.log("\n=== 使用示例 ===\n");
    
    // 示例1: 使用默认timeInForce (Ioc)
    console.log("1. 默认timeInForce (Ioc):");
    console.log("   await trader.limitBuy(0, '30000', '0.001');");
    console.log("   // 等价于:");
    console.log("   await trader.limitBuy(0, '30000', '0.001', 'Ioc');\n");
    
    // 示例2: 指定不同的timeInForce
    console.log("2. 指定timeInForce:");
    timeInForceOptions.forEach(tif => {
        console.log(`   await trader.limitBuy(0, '30000', '0.001', '${tif}'); // ${getTimeInForceDescription(tif)}`);
    });
    console.log();
    
    // 示例3: 使用sendOrder方法的完整配置
    console.log("3. 完整配置示例:");
    console.log("   await trader.sendOrder({");
    console.log("       asset: 0,");
    console.log("       isBuy: true,");
    console.log("       price: '30000',");
    console.log("       size: '0.001',");
    console.log("       timeInForce: 'Gtc',  // 可配置");
    console.log("       reduceOnly: false,");
    console.log("       clientOrderId: 'my-order-001'");
    console.log("   });\n");
    
    // 示例4: 批量订单使用不同timeInForce
    console.log("4. 批量订单示例:");
    console.log("   await trader.sendBatchOrders([");
    console.log("       { asset: 0, isBuy: true, price: '29000', size: '0.1', timeInForce: 'Gtc' },");
    console.log("       { asset: 0, isBuy: true, price: '28500', size: '0.1', timeInForce: 'Alo' },");
    console.log("       { asset: 0, isBuy: false, price: '32000', size: '0.05', timeInForce: 'Ioc' }");
    console.log("   ]);\n");
    
    console.log("=== 使用建议 ===\n");
    console.log("📌 Ioc: 适合快速交易，避免挂单风险");
    console.log("📌 Gtc: 适合普通限价订单，等待更好价格");
    console.log("📌 Alo: 适合提供流动性，获得maker费率");
    
    console.log("\n⚠️  注意：实际使用时请替换为真实的私钥和合适的订单参数");
}

function getTimeInForceDescription(tif: TimeInForce): string {
    switch (tif) {
        case "Ioc": return "立即成交否则取消";
        case "Gtc": return "挂单直到取消";
        case "Alo": return "仅添加流动性";
        default: return "未知";
    }
}

// 如果直接运行此文件
if (import.meta.main) {
    timeInForceDemo().catch(console.error);
}

export { timeInForceDemo };
