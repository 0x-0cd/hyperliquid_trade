import "dotenv/config";
import SdkTrader from "./trader/SdkTrader.js";
import CcxtTrader from "./trader/CcxtTrader.js";
import NativeTrader from "./trader/NativeTrader.js";

/**
 * 性能对比测试
 */
async function performanceComparison() {
    const key = process.env.private_key;
    const wallet = process.env.api_wallet_address;

    if (!key) {
        console.error("请在.env文件中设置private_key");
        return;
    }

    console.log("=== 交易器性能对比测试 ===\n");

    // 初始化三个交易器
    console.log("1. 初始化交易器...");
    const sdkTrader = new SdkTrader(key);
    const ccxtTrader = new CcxtTrader(wallet!, key!);
    const nativeTrader = new NativeTrader(key, false); // 使用主网

    await ccxtTrader.init();

    console.log("SDK Trader - 已初始化");
    console.log("CCXT Trader - 已初始化");
    console.log("Native Trader - 已初始化");
    console.log(`Native Trader 地址: ${nativeTrader.getAddress()}\n`);

    // 测试参数
    const testPrice = 111000;
    const testSize = 0.0001;

    console.log("2. 性能测试：并发执行三种交易方式（消除网络波动影响）...\n");

    // 定义三个并发测试函数
    const sdkTest = async () => {
        const start = Date.now();
        let success = false;
        let message = "";
        
        try {
            await sdkTrader.trySendOrder(testPrice, testSize);
            success = true;
            message = "订单发送成功";
        } catch (error: any) {
            if (error.message && error.message.includes("could not immediately match")) {
                success = true;
                message = "订单发送成功（IoC无立即成交）";
            } else {
                message = `发送失败: ${error.message || error}`;
            }
        }
        
        return {
            name: "SDK Trader",
            time: Date.now() - start,
            success,
            message
        };
    };

    const ccxtTest = async () => {
        const start = Date.now();
        let success = false;
        let message = "";
        
        try {
            await ccxtTrader.trySendOrder(testPrice, testSize);
            success = true;
            message = "订单发送成功";
        } catch (error: any) {
            if (error.message && error.message.includes("could not immediately match")) {
                success = true;
                message = "订单发送成功（IoC无立即成交）";
            } else {
                message = `发送失败: ${error.message || error}`;
            }
        }
        
        return {
            name: "CCXT Trader",
            time: Date.now() - start,
            success,
            message
        };
    };

    const nativeTest = async () => {
        const start = Date.now();
        let success = false;
        let message = "";
        
        try {
            const result = await nativeTrader.sendOrder({
                asset: 0,
                isBuy: true,
                price: testPrice.toString(),
                size: testSize.toString(),
                timeInForce: "Ioc",
            });

            if (result.status === "ok") {
                success = true;
                message = "订单发送成功";
            } else {
                message = "订单发送失败";
            }
        } catch (error: any) {
            message = `发送失败: ${error.message || error}`;
        }
        
        return {
            name: "Native Trader",
            time: Date.now() - start,
            success,
            message
        };
    };

    // 并发执行所有测试
    console.log("🚀 同时发起三种交易方式的请求...");
    const testStart = Date.now();
    const [sdkResult, ccxtResult, nativeResult] = await Promise.all([
        sdkTest(),
        ccxtTest(), 
        nativeTest()
    ]);
    const totalTestTime = Date.now() - testStart;

    // 显示每个测试的结果
    console.log(`\n⏱️  并发测试完成，总耗时: ${totalTestTime}ms\n`);
    
    [sdkResult, ccxtResult, nativeResult].forEach(result => {
        console.log(`=== ${result.name} 结果 ===`);
        console.log(result.message);
        console.log(`执行时间: ${result.time}ms`);
        console.log(`状态: ${result.success ? '✅ 成功' : '❌ 失败'}\n`);
    });

    // 性能总结与排名
    console.log("=== 📊 性能总结 ===");
    console.log(`SDK Trader:    ${sdkResult.time}ms`);
    console.log(`CCXT Trader:   ${ccxtResult.time}ms`);
    console.log(`Native Trader: ${nativeResult.time}ms`);
    
    // 按速度排序
    const results = [sdkResult, ccxtResult, nativeResult].sort((a, b) => a.time - b.time);
    
    console.log("\n🏆 速度排名:");
    results.forEach((result, index) => {
        const medals = ["🥇", "🥈", "🥉"];
        const medal = medals[index] || "🏅";
        console.log(`${medal} ${index + 1}. ${result.name}: ${result.time}ms`);
    });

    // 计算Native Trader与SDK的对比
    if (nativeResult.time > 0 && sdkResult.time > 0) {
        const improvement = ((sdkResult.time - nativeResult.time) / sdkResult.time * 100).toFixed(1);
        const comparison = nativeResult.time < sdkResult.time ? "快" : "慢";
        console.log(`\n📈 Native Trader 比 SDK Trader ${comparison} ${Math.abs(parseFloat(improvement))}%`);
    }

    console.log("\n💡 并发测试优势:");
    console.log("✓ 消除网络波动对测试结果的影响");
    console.log("✓ 三种方式在相同网络条件下执行");
    console.log("✓ 更准确的性能对比结果");
    console.log("\n📝 说明：IoC订单无法立即成交是正常现象，重点关注订单发送和处理的速度性能。");
}

/**
 * Native Trader 功能演示
 * 展示可配置timeInForce和完整功能集
 */
async function nativeTraderDemo() {
    const key = process.env.private_key;

    if (!key) {
        console.error("请在.env文件中设置private_key");
        return;
    }

    console.log("\n=== Native Trader 功能演示 ===\n");

    const trader = new NativeTrader(key, false); // 使用主网
    console.log(`交易者地址: ${trader.getAddress()}\n`);

        console.log("支持的功能:");
    console.log("✓ 限价买单/卖单（可配置timeInForce）");
    console.log("✓ 支持所有TimeInForce类型：Ioc, Gtc, Alo");
    console.log("✓ 批量订单");
    console.log("✓ 订单取消");
    console.log("✓ 只减仓订单");
    console.log("✓ 自定义客户端订单ID");
    console.log("✓ 完全独立，无SDK依赖\n");
    
    // 实际功能调用演示
    console.log("限价单示例调用（可配置timeInForce）:");
    console.log("// 限价买单 - 默认IoC");
    console.log("// await trader.limitBuy(0, '30000', '0.001');");
    console.log("// 限价买单 - 指定Gtc");
    console.log("// await trader.limitBuy(0, '30000', '0.001', 'Gtc');");
    console.log("// 自定义订单");
    console.log("// await trader.sendOrder({ asset: 0, isBuy: true, price: '30000', size: '0.001', timeInForce: 'Alo' });");
    console.log("// 取消订单");
    console.log("// await trader.cancelOrder(0, 12345);");
}

/**
 * 主函数
 */
async function main() {
    try {
        await performanceComparison();
        await nativeTraderDemo();

        console.log("\n=== 完成 ===");
        console.log("🔬 性能测试现已使用并发执行，结果更准确");
        console.log("📚 查看 src/examples/native-trader-example.ts 了解详细使用方法");
        console.log("📖 查看 src/examples/timeInForce-demo.ts 了解timeInForce配置");
        console.log("📄 查看 docs/NativeTrader分析.md 了解技术细节");

    } catch (error) {
        console.error("执行错误:", error);
    }
}

// 执行主函数
main();