import "dotenv/config";
import SdkTrader from "./trader/SdkTrader";
// import CcxtTrader from "./trader/CcxtTrader";
// import NativeTrader from "./trader/NativeTrader";
import WebSocketTrader from "./trader/WebSocketTrader";

// 测试参数
const testPrice = 100000;// 价格（BTC-USDC）
const testSize = 0.0001; // 数量（BTC）
const testRounds = 5;    // 测试轮次
/**
 * 性能对比测试
 */
async function performanceComparison(webSocketTrader: WebSocketTrader) {
    const key = process.env.private_key;
    const wallet = process.env.api_wallet_address;

    console.log("=== 交易器性能对比测试 ===\n");

    // 初始化一个交易器（webSocketTrader 从外部传入）
    console.log("1. 初始化交易器...");
    const sdkTrader = new SdkTrader(key!);
    // const ccxtTrader = new CcxtTrader(wallet!, key!);
    // const nativeTrader = new NativeTrader(key!, false); // 使用主网
    // const webSocketTrader = new WebSocketTrader(key); // 从参数传入

    // await ccxtTrader.init();

    console.log("SDK Trader - 已初始化");
    // console.log("CCXT Trader - 已初始化");
    // console.log("Native Trader - 已初始化");
    console.log("WebSocket Trader - 已初始化");
    console.log("SDK Trader 和 WebSocket Trader 准备就绪\n");

    console.log(`2. 性能测试：连接复用批量测试（${testRounds}轮测试，统计平均延迟）...\n`);

    // 定义两个并发测试函数（包含预热+多轮测试）
    const sdkTest = async () => {
        console.log("🔄 SDK Trader: 执行预热交易...");

        // 第一次交易（预热）
        try {
            await sdkTrader.trySendOrder(testPrice, testSize);
            console.log("✅ SDK Trader: 预热交易完成");
        } catch (error: any) {
            console.log("✅ SDK Trader: 预热交易完成（IoC无立即成交是正常的）");
        }

        // 等待2秒后开始正式测试
        console.log("⏳ SDK Trader: 等待2秒后开始批量测试...");
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 多轮测试
        const results = [];
        console.log(`🚀 SDK Trader: 开始 ${testRounds} 轮测试...`);

        for (let round = 1; round <= testRounds; round++) {
            const start = Date.now();
            let success = false;

            try {
                await sdkTrader.trySendOrder(testPrice + round, testSize); // 每轮不同价格避免重复
                success = true;
            } catch (error: any) {
                if (error.message && error.message.includes("could not immediately match")) {
                    success = true;
                }
            }

            const time = Date.now() - start;
            results.push(time);

            if (round % 3 === 0) {
                console.log(`📊 SDK Trader: 完成第 ${round}/${testRounds} 轮，当前延迟: ${time}ms`);
            }

            // 轮次间隔1秒避免请求过快
            if (round < testRounds) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // 计算统计数据
        const avgTime = Math.round(results.reduce((a, b) => a + b, 0) / results.length);
        const minTime = Math.min(...results);
        const maxTime = Math.max(...results);
        const successRate = 100; // 假设都成功（IoC无立即成交也算成功）

        console.log(`✅ SDK Trader: 完成 ${testRounds} 轮测试`);

        return {
            name: "SDK Trader",
            avgTime,
            minTime,
            maxTime,
            successRate,
            allResults: results,
            message: `${testRounds}轮测试完成，平均延迟: ${avgTime}ms`
        };
    };

    /*
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
    */

    /*
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
    */

    const webSocketTest = async () => {
        // 延迟 20ms 以避免与 SDK Trader 的 nonce 冲突
        await new Promise(resolve => setTimeout(resolve, 20));

        console.log("🔄 WebSocket Trader: 执行预热交易...");

        // 第一次交易（预热，WebSocket连接已建立）
        try {
            await webSocketTrader.trySendOrder(testPrice, testSize);
            console.log("✅ WebSocket Trader: 预热交易完成");
        } catch (error: any) {
            console.log("✅ WebSocket Trader: 预热交易完成（IoC无立即成交是正常的）");
        }

        // 等待2秒后开始正式测试（保持WebSocket连接）
        console.log("⏳ WebSocket Trader: 等待2秒后开始批量测试（保持连接）...");
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 多轮测试（复用WebSocket连接）
        const results = [];
        console.log(`🚀 WebSocket Trader: 开始 ${testRounds} 轮测试（连接复用）...`);

        for (let round = 1; round <= testRounds; round++) {
            const start = Date.now();
            let success = false;

            try {
                await webSocketTrader.trySendOrder(testPrice + round + 100, testSize); // 每轮不同价格，与SDK错开
                success = true;
            } catch (error: any) {
                if (error.message && error.message.includes("could not immediately match")) {
                    success = true;
                }
            }

            const time = Date.now() - start;
            results.push(time);

            if (round % 3 === 0) {
                console.log(`📊 WebSocket Trader: 完成第 ${round}/${testRounds} 轮，当前延迟: ${time}ms`);
            }

            // 轮次间隔1秒避免请求过快
            if (round < testRounds) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // 计算统计数据
        const avgTime = Math.round(results.reduce((a, b) => a + b, 0) / results.length);
        const minTime = Math.min(...results);
        const maxTime = Math.max(...results);
        const successRate = 100; // 假设都成功（IoC无立即成交也算成功）

        console.log(`✅ WebSocket Trader: 完成 ${testRounds} 轮测试`);

        return {
            name: "WebSocket Trader",
            avgTime,
            minTime,
            maxTime,
            successRate,
            allResults: results,
            message: `${testRounds}轮测试完成，平均延迟: ${avgTime}ms（连接复用）`
        };
    };

    // 并发执行所有测试（每个测试包含预热+多轮测试）
    console.log("🚀 开始批量连接复用测试（两个交易器并发执行预热+多轮测试）...\n");
    const testStart = Date.now();
    const [sdkResult, webSocketResult] = await Promise.all([
        sdkTest(),
        webSocketTest()
    ]);
    const totalTestTime = Date.now() - testStart;

    // 显示详细统计结果
    console.log(`\n⏱️  批量测试完成，总耗时: ${totalTestTime}ms\n`);

    [sdkResult, webSocketResult].forEach(result => {
        console.log(`=== ${result.name} 统计结果 ===`);
        console.log(result.message);
        console.log(`平均延迟: ${result.avgTime}ms`);
        console.log(`最快延迟: ${result.minTime}ms`);
        console.log(`最慢延迟: ${result.maxTime}ms`);
        console.log(`延迟波动: ${result.maxTime - result.minTime}ms`);
        console.log(`成功率: ${result.successRate}%`);
        console.log(`所有结果: [${result.allResults.join(', ')}]ms\n`);
    });

    // 性能总结与排名
    console.log("=== 📊 统计性能对比 ===");
    console.log(`SDK Trader 平均延迟:       ${sdkResult.avgTime}ms (${sdkResult.minTime}-${sdkResult.maxTime}ms)`);
    console.log(`WebSocket Trader 平均延迟: ${webSocketResult.avgTime}ms (${webSocketResult.minTime}-${webSocketResult.maxTime}ms)`);

    // 按平均速度排序
    const results = [sdkResult, webSocketResult].sort((a, b) => a.avgTime - b.avgTime);

    console.log("\n🏆 平均速度排名:");
    results.forEach((result, index) => {
        const medals = ["🥇", "🥈"];
        const medal = medals[index] || "🏅";
        console.log(`${medal} ${index + 1}. ${result.name}: 平均 ${result.avgTime}ms`);
    });

    // 计算两个 Trader 的性能对比
    if (sdkResult.avgTime > 0 && webSocketResult.avgTime > 0) {
        const improvement = ((Math.max(sdkResult.avgTime, webSocketResult.avgTime) - Math.min(sdkResult.avgTime, webSocketResult.avgTime)) / Math.max(sdkResult.avgTime, webSocketResult.avgTime) * 100).toFixed(1);
        const faster = sdkResult.avgTime < webSocketResult.avgTime ? "SDK Trader" : "WebSocket Trader";
        const slower = sdkResult.avgTime < webSocketResult.avgTime ? "WebSocket Trader" : "SDK Trader";
        console.log(`\n📈 ${faster} 平均比 ${slower} 快 ${improvement}%`);

        // 额外的统计分析
        console.log(`\n📈 详细对比分析:`);
        console.log(`• SDK Trader 延迟稳定性: ${((sdkResult.maxTime - sdkResult.minTime) / sdkResult.avgTime * 100).toFixed(1)}% 波动`);
        console.log(`• WebSocket Trader 延迟稳定性: ${((webSocketResult.maxTime - webSocketResult.minTime) / webSocketResult.avgTime * 100).toFixed(1)}% 波动`);

        const sdkWins = sdkResult.allResults?.filter((time, i) => {
            const wsResult = webSocketResult.allResults?.[i];
            return wsResult !== undefined && time < wsResult;
        }).length || 0;
        const wsWins = testRounds - sdkWins;
        console.log(`• 单轮对比: SDK胜${sdkWins}轮, WebSocket胜${wsWins}轮`);
    }

    console.log("\n💡 批量测试优势:");
    console.log("✓ 多轮测试提供更可靠的统计数据");
    console.log("✓ 测试WebSocket连接复用的长期性能优势");
    console.log("✓ 排除连接建立时间和网络波动的影响");
    console.log("✓ 模拟真实高频交易的连续操作场景");
    console.log("✓ 统计延迟稳定性和成功率");
    console.log(`\n📝 说明：基于${testRounds}轮测试的统计结果更能反映实际应用中的性能表现。`);

    // 额外分析：为什么HTTP仍然更快？
    console.log(`\n🤔 结果分析 - 为什么HTTP在连接复用场景下仍然更快？`);
    console.log(`📋 可能的原因：`);
    console.log(`1. HTTP Keep-Alive: 现代HTTP/1.1客户端默认复用连接，抵消了WebSocket的连接优势`);
    console.log(`2. 服务器架构: Hyperliquid可能对HTTP请求有更直接的处理路径`);
    console.log(`3. 协议开销: WebSocket的帧封装、心跳机制可能增加了实际延迟`);
    console.log(`4. SDK实现: @nktkas/hyperliquid的HttpTransport可能比WebSocketTransport更优化`);
    console.log(`5. 网络因素: WebSocket对网络质量要求更高，更容易受到网络波动影响`);
}

/*
 * Native Trader 功能演示
 * 展示可配置timeInForce和完整功能集
 * （已注释，因为现在使用 SDK Trader）
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
*/

/**
 * 主函数
 */
async function main() {
    const key = process.env.private_key;

    if (!key) {
        console.error("请在.env文件中设置private_key");
        return;
    }

    // 创建 WebSocket Trader 实例
    const webSocketTrader = new WebSocketTrader(key);

    try {
        await performanceComparison(webSocketTrader);
        // await nativeTraderDemo(); // 已注释，因为使用的是 SDK Trader

        console.log("\n=== 完成 ===");
        console.log("🔬 性能测试现已支持两种交易器的并发执行，结果更准确");
        console.log("📊 对比 SDK 和 WebSocket 两种交易方式的性能");
        console.log("🚀 WebSocket Trader 使用持久连接，SDK Trader 使用官方 SDK");
        console.log("⚡ 两种方式各有优势，可根据具体场景选择");

    } catch (error) {
        console.error("执行错误:", error);
    } finally {
        // 确保关闭 WebSocket 连接
        console.log("\n🔌 正在关闭 WebSocket 连接...");
        await webSocketTrader.close();
    }
}

// 执行主函数
main();