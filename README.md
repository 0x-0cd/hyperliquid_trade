# Hyperliquid 交易脚本

本项目是一个使用 TypeScript 编写的交易脚本，用于与 Hyperliquid 去中心化交易所进行交互。它同时使用了 Hyperliquid 官方 SDK (`@nktkas/hyperliquid`) 和 `ccxt` 库来执行交易操作。

## 功能
- 通过 SDK 和 CCXT 连接到 Hyperliquid。
- 提交限价订单。
- 分别演示了两种不同库的下单方式。

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
- `@nktkas/hyperliquid`: Hyperliquid 官方 SDK。
- `ccxt`: 流行的加密货币交易库。
- `dotenv`: 用于管理环境变量。

**3. 创建环境变量文件**
为了安全地管理您的钱包凭证，您需要创建一个 `.env` 文件。
```bash
cp .env.example .env
```

## 运行项目
完成安装和配置后，通过以下命令运行主脚本：
```bash
bun run src/index.ts
```
脚本将初始化 SdkTrader 和 CcxtTrader，然后尝试并行发送交易订单。

## 交易执行说明
在 `src/index.ts` 文件中，您会看到以下几行关于订单执行的代码被注释掉了：

```typescript
// Promise.all([sdkTrader.trySendOrder(109700, 0.0001), ccxtTrader.trySendOrder(109700, 0.0001)]);
// await sdkTrader.trySendOrder(109700, 0.0001); // 2714 -> 4094 = 1380ms
// await ccxtTrader.trySendOrder(109700, 0.0001); // 6349 -> 8655 = 2306ms
```

**重要提示:**
- **最小成交金额**: Hyperliquid 要求每笔订单的最小名义价值（成交金额）为 **10 USDC**。请确保您的订单大小（价格 × 数量）满足此要求。
- **并行 vs. 串行执行**:
    - 如果您的账户**资金充足**，可以同时支持两笔订单的保证金，建议使用 `Promise.all` 的方式。这种方式可以并行发送两个交易请求，通常能获得更快的响应和更稳定的执行结果。
    - 如果您的账户**资金不足**以同时支持两笔订单，请注释掉 `Promise.all` 这一行，并分两次执行下面两行 `await` 代码。这将按顺序一笔一笔地发送订单。

