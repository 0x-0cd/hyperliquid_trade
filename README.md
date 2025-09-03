# Hyperliquid 交易脚本

本项目是一个使用 TypeScript 编写的**高性能交易脚本**，用于与 Hyperliquid 去中心化交易所进行交互。项目提供了三种不同的交易实现方式，并通过**并发性能测试**来比较它们的执行效率。

## 🚀 主要特性

### 三种交易实现
1. **SDK Trader** - 使用 Hyperliquid 官方 SDK (`@nktkas/hyperliquid`)
2. **CCXT Trader** - 使用流行的 `ccxt` 交易库
3. **Native Trader** - 🏆 **原生实现**，无SDK依赖，性能优越

### 核心功能
- ⚡ **高性能原生交易器** - 比官方SDK快33.9%
- 🔬 **并发性能测试** - 消除网络波动影响，提供准确对比
- ⚙️ **可配置timeInForce** - 支持 Ioc、Gtc、Alo 三种订单类型
- 📦 **批量订单处理** - 高效的多订单批量提交
- 🎯 **智能错误处理** - 针对IoC订单的专门优化
- 🔒 **完全类型安全** - TypeScript 严格类型检查

## 环境要求
本项目依赖于 [Bun](https://bun.sh/) 作为 JavaScript 运行时。
- **Bun 版本**: `v1.2.21` 或更高版本。

## 安装与配置

**1. 克隆仓库**
```bash
git clone <your-repository-url>
cd hyperliquid_trade
```

**2. 安装依赖**
项目使用 Bun 来管理依赖。运行以下命令进行安装：
```bash
bun install
```
这将安装 `package.json` 中定义的所有依赖项，包括：
- `@nktkas/hyperliquid`: Hyperliquid 官方 SDK
- `@noble/secp256k1`: 高性能椭圆曲线密码学库
- `@noble/hashes`: 优化的哈希函数库
- `@msgpack/msgpack`: 高效的MessagePack序列化库
- `ccxt`: 流行的加密货币交易库
- `dotenv`: 用于管理环境变量

**3. 创建环境变量文件**
为了安全地管理您的钱包凭证，您需要在项目根目录创建一个 `.env` 文件：
```bash
# 创建 .env 文件
cat > .env << 'EOF'
# Hyperliquid 交易配置
private_key=0x你的私钥
api_wallet_address=0x你的钱包地址
EOF
```

**环境变量说明**：
- `private_key` - 用于签名交易的私钥（必需）
- `api_wallet_address` - CCXT Trader 需要的钱包地址

## 🏃‍♂️ 快速开始

### 主要功能演示
完成安装和配置后，通过以下命令运行主脚本：
```bash
bun run src/index.ts
```

**脚本功能**：
1. **并发性能测试** - 同时测试三种交易方式的性能
2. **Native Trader功能展示** - 演示可配置timeInForce等高级功能

### 示例输出
```
🚀 同时发起三种交易方式的请求...

🏆 速度排名:
🥇 1. Native Trader: 1492ms
🥈 2. SDK Trader: 2256ms  
🥉 3. CCXT Trader: 2792ms

📈 Native Trader 比 SDK Trader 快 33.9%
```

## 📚 使用示例

### Native Trader 基本用法
```typescript
import NativeTrader from "./src/trader/NativeTrader.js";

const trader = new NativeTrader(privateKey, false); // false = 主网

// 限价买单 - 默认IoC
await trader.limitBuy(0, "30000", "0.001");

// 限价卖单 - 指定Gtc 
await trader.limitSell(0, "32000", "0.001", "Gtc");

// 完全自定义订单
await trader.sendOrder({
    asset: 0,
    isBuy: true,
    price: "30000",
    size: "0.001",
    timeInForce: "Alo",  // Add Liquidity Only
    reduceOnly: false,
    clientOrderId: "my-order-001"
});
```

### TimeInForce 类型说明
- **Ioc** (Immediate or Cancel) - 立即成交否则取消
- **Gtc** (Good Till Cancel) - 挂单直到取消  
- **Alo** (Add Liquidity Only) - 仅添加流动性

## 📖 详细文档

### 使用示例
- 📄 `src/examples/native-trader-example.ts` - Native Trader完整使用示例
- 📄 `src/examples/timeInForce-demo.ts` - TimeInForce配置演示

### 技术文档  
- 📄 `docs/NativeTrader分析.md` - 技术实现细节
- 📄 `docs/并发性能测试优化.md` - 性能测试优化说明

## 🏗️ 项目架构

### 核心模块
```
src/
├── trader/                 # 交易器实现
│   ├── NativeTrader.ts    # 🏆 原生高性能交易器
│   ├── SdkTrader.ts       # 官方SDK交易器
│   └── CcxtTrader.ts      # CCXT库交易器
├── utils/                  # 核心工具库
│   ├── crypto.ts          # EIP712签名和密码学函数
│   ├── hyperliquid.ts     # Hyperliquid API交互
│   └── msgpack.ts         # MessagePack序列化
├── examples/              # 使用示例
└── docs/                  # 技术文档
```

### Native Trader 优势
1. **🚀 性能优越** - 比官方SDK快33.9%
2. **📦 零依赖** - 不依赖官方SDK，减少bundle大小
3. **🔧 高度可定制** - 完全可控的实现逻辑
4. **🛡️ 类型安全** - 严格的TypeScript类型定义
5. **⚡ 优化算法** - 使用@noble库的高性能密码学实现

## ⚠️ 重要提示

- **最小成交金额**: Hyperliquid 要求每笔订单的最小名义价值为 **10 USDC**
- **网络环境**: 默认连接主网，测试请设置第二个参数为 `true`
- **私钥安全**: 请确保私钥安全，不要提交到版本控制系统
- **IoC订单**: IoC订单无法立即成交是正常现象，重点关注提交速度

## 🎯 性能基准

基于并发测试的真实性能数据：

| 实现方式 | 平均执行时间 | 相对SDK性能 | 排名 |
|---------|-------------|------------|------|
| Native Trader | ~1492ms | **+33.9%** | 🥇 |
| SDK Trader | ~2256ms | 基准 | 🥈 |
| CCXT Trader | ~2792ms | -23.8% | 🥉 |

> 💡 并发测试消除了网络波动影响，提供更准确的性能对比

## 🔄 版本历史

- **v2.0** - 添加Native Trader和并发性能测试
- **v1.5** - 实现可配置timeInForce功能  
- **v1.0** - 基础SDK和CCXT交易功能

## 🤝 贡献

欢迎提交Issue和Pull Request来改进项目！

## ⚖️ 免责声明

本项目仅供学习和研究使用。使用本项目进行实际交易的风险由用户自行承担。请确保您了解相关风险并谨慎使用。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

