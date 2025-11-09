# 部署指南

本文档详细说明如何部署 SealBid 项目到 Sui 测试网和主网。

## 📋 前置准备

### 1. 安装依赖

```bash
# 安装 Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui

# 验证安装
sui --version

# 安装 Node.js 依赖
cd frontend
npm install
```

### 2. 配置 Sui 钱包

```bash
# 创建新钱包（如果没有）
sui client new-address ed25519

# 切换到测试网
sui client switch --env testnet

# 获取测试网 SUI
# 访问: https://discord.gg/sui
# 在 #testnet-faucet 频道请求测试币
```

## 🚀 部署智能合约

### Step 1: 编译合约

```bash
cd move

# 编译检查
sui move build

# 运行测试
sui move test
```

### Step 2: 部署到测试网

```bash
# 部署合约
sui client publish --gas-budget 100000000

# 输出示例:
# ----- Transaction Digest ----
# 8kLvxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# 
# ----- Object Changes ----
# Created Objects:
#   - PackageID: 0xabcd1234...
#   - CoinRegistry: 0x5678efgh...
```

### Step 3: 记录重要信息

部署成功后，记录以下信息：

```bash
# 1. Package ID
PACKAGE_ID=0xabcd1234...

# 2. CoinRegistry 对象 ID
COIN_REGISTRY_ID=0x5678efgh...

# 3. 其他共享对象 ID
```

## ⚙️ 配置前端

### Step 1: 环境变量

```bash
cd frontend

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
nano .env
```

填入部署信息：

```env
VITE_NETWORK=testnet
VITE_PACKAGE_ID=0xabcd1234...  # 你的 Package ID
VITE_SEAL_PACKAGE_ID=0x927a54e9ae803f82ebf480136a9bcff45101ccbe28b13f433c89f5181069d682
VITE_SEAL_SERVER_1=0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75
VITE_SEAL_SERVER_2=0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8
```

### Step 2: 更新配置文件

编辑 `frontend/src/config/constants.ts`:

```typescript
export const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '0xabcd1234...'
export const COIN_REGISTRY_ID = '0x5678efgh...'  // 添加这一行
```

### Step 3: 构建前端

```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 预览生产版本
npm run preview
```

## 🌐 部署前端

### 选项 1: Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

### 选项 2: Netlify

```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 登录
netlify login

# 部署
netlify deploy --prod --dir=dist
```

### 选项 3: IPFS

```bash
# 构建
npm run build

# 上传到 IPFS
# 使用 Pinata, Web3.Storage 或其他 IPFS 服务
```

## 🧪 测试部署

### 1. 测试智能合约

```bash
# 测试创建拍卖
sui client call \
  --package $PACKAGE_ID \
  --module auction \
  --function create_auction \
  --args $TREASURY_CAP_ID "Test Coin" 1000000 10 0 $START_TIME $END_TIME \
  --type-args "0x2::sui::SUI" \
  --gas-budget 10000000

# 测试提交出价
sui client call \
  --package $PACKAGE_ID \
  --module auction \
  --function place_bid \
  --args $AUCTION_ID "[1,2,3,4]" $COIN_OBJECT "0x6" \
  --type-args "0x2::sui::SUI" \
  --gas-budget 10000000
```

### 2. 测试前端集成

1. 连接钱包
2. 创建测试拍卖
3. 提交测试出价
4. 验证交易成功

## 📊 主网部署

### ⚠️ 重要提示

在部署到主网之前：

1. ✅ 完整测试所有功能
2. ✅ 进行安全审计
3. ✅ 准备足够的 SUI 用于 Gas
4. ✅ 备份所有私钥和助记词

### 部署步骤

```bash
# 1. 切换到主网
sui client switch --env mainnet

# 2. 检查余额
sui client gas

# 3. 部署合约
sui client publish --gas-budget 100000000

# 4. 更新前端配置
# 编辑 .env 文件，修改为主网配置
VITE_NETWORK=mainnet
VITE_PACKAGE_ID=<主网 Package ID>
VITE_SEAL_PACKAGE_ID=0xa212c4c6c7183b911d0be8768f4cb1df7a383025b5d0ba0c014009f0f30f5f8d

# 5. 重新构建和部署前端
npm run build
```

## 🔧 故障排除

### 问题 1: Gas 不足

```bash
# 检查 Gas
sui client gas

# 获取更多 SUI（测试网）
# 访问 Discord 或水龙头
```

### 问题 2: 编译错误

```bash
# 清理并重新编译
sui move clean
sui move build
```

### 问题 3: 交易失败

```bash
# 查看交易详情
sui client transaction-show <DIGEST>

# 检查对象状态
sui client object <OBJECT_ID>
```

### 问题 4: 前端连接失败

1. 检查 RPC 节点连接
2. 验证 Package ID 正确
3. 确认网络配置匹配

## 📝 升级合约

### 方案 1: 不可变升级

```bash
# 部署新版本
sui client publish --gas-budget 100000000

# 更新前端配置使用新 Package ID
```

### 方案 2: 使用升级能力

```move
// 在合约中添加升级能力
public struct UpgradeCap has key, store {
    id: UID,
    package: ID,
}

// 执行升级
sui client upgrade \
  --package-id $OLD_PACKAGE_ID \
  --upgrade-capability $UPGRADE_CAP \
  --gas-budget 100000000
```

## 🔐 安全检查清单

- [ ] 所有 entry 函数都有适当的权限检查
- [ ] 时间检查逻辑正确
- [ ] 金额计算无溢出风险
- [ ] 访问控制策略正确实施
- [ ] Seal 密钥 ID 格式正确
- [ ] 前端输入验证完善
- [ ] 敏感信息妥善保管

## 📊 监控和维护

### 监控指标

1. **合约调用量**: 跟踪各函数调用次数
2. **Gas 使用**: 监控平均 Gas 消耗
3. **活跃拍卖数**: 统计进行中的拍卖
4. **用户活跃度**: 追踪用户参与情况

### 日志查询

```bash
# 查询事件
sui client events --package $PACKAGE_ID

# 查询特定拍卖
sui client object $AUCTION_ID --json
```

## 🆘 获取帮助

- [Sui Discord](https://discord.gg/sui)
- [Sui 开发者文档](https://docs.sui.io)
- [GitHub Issues](https://github.com/your-repo/issues)

---

**祝部署顺利！🎉**

