# 贡献指南

感谢你对 SealBid 项目的关注！我们欢迎各种形式的贡献。

## 🤝 贡献方式

### 报告 Bug

如果你发现了 bug，请创建一个 Issue 并包含以下信息：

- Bug 的详细描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（操作系统、浏览器、Sui 版本等）
- 截图（如果适用）

### 提出新功能

我们欢迎新功能建议！请创建一个 Issue 描述：

- 功能的目的和用途
- 预期的行为
- 可能的实现方案
- 是否愿意自己实现

### 提交代码

1. **Fork 项目**

```bash
# 点击 GitHub 上的 Fork 按钮
# 克隆你的 fork
git clone https://github.com/YOUR_USERNAME/SealBid.git
cd SealBid
```

2. **创建分支**

```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 或者修复分支
git checkout -b fix/issue-number
```

3. **编写代码**

- 遵循项目的代码风格
- 添加必要的注释
- 编写或更新测试
- 更新相关文档

4. **测试**

```bash
# 测试 Move 合约
cd move
sui move test

# 测试前端
cd frontend
npm run lint
npm run build
```

5. **提交**

```bash
git add .
git commit -m "描述你的更改"
git push origin feature/your-feature-name
```

6. **创建 Pull Request**

- 在 GitHub 上创建 PR
- 填写 PR 模板
- 等待审核

## 📝 代码规范

### Move 代码规范

```move
// 1. 模块注释
/// 模块描述

// 2. 常量使用大写
const EErrorCode: u64 = 1;

// 3. 函数注释
/// 函数功能描述
/// 参数说明
/// 返回值说明

// 4. 使用有意义的变量名
let total_supply = 1000000;  // ✅
let ts = 1000000;            // ❌

// 5. 错误处理
assert!(condition, EErrorCode);
```

### TypeScript 代码规范

```typescript
// 1. 使用 TypeScript 类型
interface User {
  address: string
  balance: number
}

// 2. 使用有意义的函数名
function formatTokenAmount(amount: string): string  // ✅
function fmt(a: string): string                    // ❌

// 3. 使用 const 和 let，避免 var
const packageId = '0x...'  // ✅
var pkgId = '0x...'        // ❌

// 4. 组件使用 PascalCase
export default function AuctionCard() {}  // ✅
export default function auction_card() {} // ❌

// 5. 使用箭头函数
const handleClick = () => {}  // ✅
```

### Git 提交信息规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型（type）：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

示例：
```
feat(auction): add random selection strategy

Implement RANDOM_N strategy for fair token distribution.
The strategy uses blockchain timestamp as seed for randomness.

Closes #123
```

## 🧪 测试指南

### Move 合约测试

```bash
cd move

# 运行所有测试
sui move test

# 运行特定测试
sui move test --filter auction_tests

# 显示详细输出
sui move test -v
```

### 前端测试

```bash
cd frontend

# Lint 检查
npm run lint

# 类型检查
npm run type-check

# 构建测试
npm run build
```

## 📚 文档指南

- 所有新功能都应该更新文档
- 使用清晰的中文描述
- 提供代码示例
- 更新 README.md 中的相关部分

## 🔍 代码审查流程

1. 自动化检查通过
2. 至少一位维护者审查
3. 解决所有评论
4. 测试通过
5. 合并到主分支

## ❓ 需要帮助？

- 查看 [README.md](README.md)
- 查看 [文档](docs/)
- 在 Issue 中提问
- 加入讨论

## 📜 行为准则

- 尊重所有贡献者
- 保持友善和专业
- 接受建设性批评
- 关注对项目最有利的事情

## 🎯 优先级

当前优先级较高的任务：

1. [ ] 完善 Seal SDK 集成
2. [ ] 添加更多测试用例
3. [ ] 优化 Gas 使用
4. [ ] 改进 UI/UX
5. [ ] 添加更多拍卖策略

## 🏆 贡献者

感谢所有贡献者的付出！

---

再次感谢你的贡献！🎉

