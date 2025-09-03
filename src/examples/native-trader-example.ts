/**
 * NativeTrader使用示例
 * 展示如何使用原生交易器进行各种交易操作
 */

import NativeTrader from "../trader/NativeTrader.js";

/**
 * 基本交易示例
 */
async function basicTradingExample() {
    // 初始化交易器（使用测试网）
    const privateKey = "0x" + "0".repeat(64); // 请替换为实际的私钥
    const trader = new NativeTrader(privateKey, true); // true表示使用测试网
    
    console.log("交易者地址:", trader.getAddress());
    
    try {
        // 1. 发送限价买单（IoC） - 默认行为
        console.log("\n=== 发送限价买单（IoC）===");
        const buyResult = await trader.limitBuy(
            0,      // BTC-USD永续（资产索引0）
            "30000", // 价格：30,000 USD
            "0.1"   // 数量：0.1 BTC
            // timeInForce 默认为 "Ioc"
        );
        console.log("买单结果:", buyResult);
        
        // 2. 发送限价卖单（Gtc） - 指定timeInForce
        console.log("\n=== 发送限价卖单（Gtc）===");
        const sellResult = await trader.limitSell(
            0,      // BTC-USD永续
            "32000", // 价格：32,000 USD
            "0.05", // 数量：0.05 BTC
            "Gtc"   // Good Till Cancel - 挂单直到取消
        );
        console.log("卖单结果:", sellResult);
        
        // 3. 发送限价买单（Alo） - 仅添加流动性
        console.log("\n=== 发送限价买单（Alo）===");
        const aloResult = await trader.limitBuy(
            0,      // BTC-USD永续
            "29000", // 价格：29,000 USD（较低价格确保添加流动性）
            "0.02", // 数量：0.02 BTC
            "Alo"   // Add Liquidity Only - 仅添加流动性
        );
        console.log("Alo买单结果:", aloResult);
        

    } catch (error) {
        console.error("交易执行错误:", error);
    }
}

/**
 * 批量交易示例
 */
async function batchTradingExample() {
    const privateKey = "0x" + "0".repeat(64); // 请替换为实际的私钥
    const trader = new NativeTrader(privateKey, true);
    
    try {
        console.log("\n=== 批量发送订单 ===");
        
        // 批量发送多个限价单（混合timeInForce）
        const batchResult = await trader.sendBatchOrders([
            {
                asset: 0,
                isBuy: true,
                price: "29000",
                size: "0.1",
                timeInForce: "Gtc", // Good Till Cancel - 挂单
            },
            {
                asset: 0,
                isBuy: true,
                price: "28500",
                size: "0.1", 
                timeInForce: "Alo", // Add Liquidity Only - 仅添加流动性
            },
            {
                asset: 0,
                isBuy: false,
                price: "32000",
                size: "0.05",
                timeInForce: "Ioc", // Immediate or Cancel - 立即成交否则取消
            },
        ]);
        
        console.log("批量订单结果:", batchResult);
        
        // 如果有订单ID，可以批量取消
        // const cancelResult = await trader.cancelOrders([
        //     { asset: 0, orderId: 12345 },
        //     { asset: 0, orderId: 12346 },
        // ]);
        // console.log("取消订单结果:", cancelResult);
        
    } catch (error) {
        console.error("批量交易错误:", error);
    }
}

/**
 * 高级交易示例
 */
async function advancedTradingExample() {
    const privateKey = "0x" + "0".repeat(64); // 请替换为实际的私钥
    const trader = new NativeTrader(privateKey, true);
    
    try {
        console.log("\n=== 高级交易功能 ===");
        
        // 发送带客户端订单ID的限价单（IoC）
        const orderWithClientId = await trader.sendOrder({
            asset: 0,
            isBuy: true,
            price: "31000",
            size: "0.1",
            timeInForce: "Ioc", // 使用IoC
            clientOrderId: "my-order-001",
        });
        console.log("带客户端ID的订单:", orderWithClientId);
        
        // 发送只减仓订单
        const reduceOnlyOrder = await trader.sendOrder({
            asset: 0,
            isBuy: false,
            price: "31500",
            size: "0.05",
            reduceOnly: true,
            timeInForce: "Ioc",
        });
        console.log("只减仓订单:", reduceOnlyOrder);
        
    } catch (error) {
        console.error("高级交易错误:", error);
    }
}

/**
 * 对比SDK和Native实现
 */
async function comparisonExample() {
    console.log("\n=== SDK vs Native 对比 ===");
    
    const privateKey = "0x" + "0".repeat(64);
    
    // 使用原生实现
    console.log("使用NativeTrader:");
    const nativeTrader = new NativeTrader(privateKey, true);
    console.log("- 不依赖外部SDK");
    console.log("- 完全控制签名和网络请求");
    console.log("- 更小的bundle大小");
    console.log("- 自定义优化空间更大");
    
    // 模拟使用SDK的对比
    console.log("\n使用SDK:");
    console.log("- 需要依赖@nktkas/hyperliquid");
    console.log("- 更简单的API");
    console.log("- 但依赖外部库");
    console.log("- bundle大小更大");
}

// 运行示例
async function runExamples() {
    console.log("=== NativeTrader 示例演示 ===");
    
    // 注意：这些示例使用了虚拟私钥，实际使用时请替换为真实私钥
    console.log("⚠️  注意：示例中使用的是虚拟私钥，实际使用时请替换为真实私钥");
    
    await comparisonExample();
    
    // 如果你有真实的私钥和想要测试，可以取消注释下面的行
    // await basicTradingExample();
    // await batchTradingExample();
    // await advancedTradingExample();
}

// 如果直接运行此文件
if (import.meta.main) {
    runExamples().catch(console.error);
}

export {
    basicTradingExample,
    batchTradingExample,
    advancedTradingExample,
    comparisonExample,
};
