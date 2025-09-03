import * as hl from "@nktkas/hyperliquid";
import { writeFileSync } from "fs";
import { resolve } from "path";

const transport = new hl.HttpTransport();
const infoClient = new hl.InfoClient({ transport });

const meta = await infoClient.meta();
const futureList = meta.universe;
const data = [];
for (let i = 0; i < futureList.length; i++) {
    data.push({
        symbol: futureList[i]!.name,
        index: i,
    });
}

// 将data写入JSON文件到根目录
try {
    const outputPath = resolve("hyperliquid-symbols.json");
    writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ 成功写入 ${data.length} 个交易对到 ${outputPath}`);
} catch (error) {
    console.error('❌ 写入文件失败:', error);
}
