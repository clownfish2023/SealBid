// Copyright (c) SealBid
// SPDX-License-Identifier: Apache-2.0

/// 示例：用户自定义代币模块
/// 这个模块展示了如何创建 OTW (One-Time-Witness) 来创建自定义代币
/// 
/// 使用方法：
/// 1. 部署这个模块（会生成 OTW）
/// 2. 使用生成的 OTW 调用 coin_factory::create_coin
module seal_coin::seal_coin {
    use sui::coin;
    use sui::transfer;
    use sui::sui::SUI;

    /// One-Time-Witness (OTW)
    public struct SEAL_COIN has drop {}

    /// 初始化函数
    /// 当模块首次发布时，Sui 会自动调用这个函数
    /// 传入的 witness 参数就是 OTW
    fun init(witness: SEAL_COIN, ctx: &mut TxContext) {
        // OTW 只能使用一次，这里可以做一些初始化工作
        // 对于代币创建，通常不需要在这里做什么
        // OTW 会在 create_coin 函数中使用
    }
}

