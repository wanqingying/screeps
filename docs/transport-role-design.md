# Screeps 运输角色系统设计文档

## 概述

本文档详细描述了 Screeps TypeScript 项目中的运输角色系统设计。该系统采用分层架构，支持多版本并存，具有智能任务分配和优先级管理机制。

## 系统架构概览

```mermaid
graph TB
    subgraph "运输系统架构"
        A[主循环 main.ts] --> B[角色管理器]
        B --> C[Carrier v1]
        B --> D[Carry v2]
        B --> E[RoleCarry v2]

        C --> F[任务系统 v1]
        D --> G[任务系统 v2]
        E --> H[BaseRole 基类]

        F --> I[TransBaseTask]
        G --> J[TransTaskMST]

        I --> K[传输任务]
        J --> L[智能任务管理]
    end
```

## 角色版本对比

### 版本演进图

```mermaid
graph LR
    subgraph "角色系统演进"
        A[Carrier v1<br/>基础运输] --> B[Carry v2<br/>优化版本]
        B --> C[RoleCarry v2<br/>面向对象设计]

        A1[简单状态机] --> B1[智能目标选择]
        B1 --> C1[基于类的架构]

        A2[手动任务分配] --> B2[自动任务发现]
        B2 --> C2[优先级评分系统]
    end
```

### 功能对比表

| 特性         | Carrier v1 | Carry v2   | RoleCarry v2 |
| ------------ | ---------- | ---------- | ------------ |
| 架构模式     | 函数式     | 静态类     | 面向对象     |
| 状态管理     | 简单枚举   | 智能检查   | 基类继承     |
| 任务分配     | 手动查找   | 自动发现   | 抽象接口     |
| 优先级系统   | 无         | 复杂评分   | 可扩展       |
| 目标冲突处理 | 基础       | 映射表管理 | 待实现       |

## 状态机设计

### Carry v2 状态流转图

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> restore: 初始化

    restore --> restoreing: 找到取货目标
    restore --> drop: 已有货物但无取货目标
    restore --> idle: 无货物且无目标

    restoreing --> restore: 目标消失/取货完成
    restoreing --> drop: 货物装满

    drop --> dropping: 找到卸货目标
    drop --> restore: 货物已空

    dropping --> drop: 目标已满/卸货完成
    dropping --> restore: 货物已空

    note right of restore
        寻找取货目标：
        1. 容器 (能量>1000)
        2. 废墟
        3. 掉落资源
        4. 存储器
    end note

    note right of drop
        寻找卸货目标：
        1. Spawn/Extension
        2. 控制器容器
        3. 防御塔
        4. 存储器
    end note
```

### Carrier v1 状态流转图

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> restore

    restore --> dropping: 货物装满
    restore --> restore: 继续取货

    dropping --> restore: 货物已空
    dropping --> dropping: 继续卸货

    note right of restore
        简化的取货逻辑：
        - 优先容器
        - 其次废墟和掉落物
        - 最后存储器
    end note
```

## 任务系统架构

### 任务系统 v2 (TransTaskMST) 架构图

```mermaid
graph TB
    subgraph "任务管理系统 v2"
        A[TransTaskMST 管理器] --> B[任务发现]
        A --> C[任务评分]
        A --> D[任务分配]
        A --> E[任务清理]

        B --> F[discover_in<br/>输入任务发现]
        B --> G[discover_out<br/>输出任务发现]

        F --> H[Spawn/Extension<br/>优先级: 8]
        F --> I[Tower<br/>优先级: 8]
        F --> J[Controller Container<br/>优先级: 7]
        F --> K[Storage<br/>优先级: 3]

        G --> L[Dropped Resource<br/>优先级: 10]
        G --> M[Container Source<br/>优先级: 8]
        G --> N[Ruin/Tombstone<br/>优先级: 8]
        G --> O[Storage<br/>优先级: 4]

        C --> P[距离评分]
        C --> Q[时间评分]
        C --> R[数量评分]
        C --> S[优先级权重]
    end
```

### 任务优先级矩阵

```mermaid
graph LR
    subgraph "优先级决策矩阵"
        A[输出任务优先级] --> C[任务匹配算法]
        B[输入任务优先级] --> C

        C --> D{优先级和 >= 10?}
        D -->|是| E[执行任务]
        D -->|否| F[跳过任务]

        A1[掉落资源: 10] --> A
        A2[容器源: 8] --> A
        A3[废墟: 8] --> A
        A4[存储器: 4] --> A

        B1[Spawn: 8] --> B
        B2[Tower: 8] --> B
        B3[控制器容器: 7] --> B
        B4[存储器: 3] --> B
    end
```

## 目标冲突处理

### Carry v2 目标映射系统

```mermaid
graph TB
    subgraph "目标冲突处理机制"
        A[carry_map: Map&lt;targetId, creepId&gt;] --> B[目标预订]
        B --> C[冲突检测]
        C --> D[自动清理]

        E[Creep 请求目标] --> F{目标已被预订?}
        F -->|否| G[预订目标]
        F -->|是| H[寻找其他目标]

        G --> I[执行任务]
        H --> J[重新评估]

        D --> K[清理死亡 Creep]
        D --> L[清理无效目标]
        D --> M[清理状态不匹配]
    end
```

## 性能优化策略

### 缓存和优化机制

```mermaid
graph TB
    subgraph "性能优化架构"
        A[缓存系统] --> B[目标缓存]
        A --> C[任务缓存]
        A --> D[路径缓存]

        B --> E[@CacheId 装饰器]
        B --> F[@CacheIds 装饰器]

        C --> G[tick_cache 函数缓存]
        C --> H[任务映射表]

        D --> I[可视化路径样式]
        D --> J[移动优化]

        K[定期清理] --> L[每 tick 清理映射]
        K --> M[清理无效任务]
        K --> N[清理死亡对象]
    end
```

## 代码结构分析

### 文件组织架构

```mermaid
graph TB
    subgraph "运输系统文件结构"
        A[src/role/] --> B[carrier.ts - v1 实现]
        A --> C[carry.ts - v2 静态类]

        D[src/role-v2/] --> E[carry.ts - v2 面向对象]
        D --> F[base.ts - 基类]

        G[src/task/] --> H[trans_base.ts - v1 任务基类]
        G --> I[trans_in.ts - 输入任务]
        G --> J[trans_out.ts - 输出任务]

        K[src/task-v2/] --> L[trans-manager.ts - v2 管理器]
        K --> M[trans-base.ts - v2 基类]
        K --> N[trans-in.ts - v2 输入]
        K --> O[trans-out.ts - v2 输出]

        P[src/types/] --> Q[dc.ts - 数据常量]
        P --> R[enum.ts - 枚举定义]
    end
```

## 关键算法实现

### 任务评分算法

```mermaid
graph LR
    subgraph "任务评分算法"
        A[输入参数] --> B[距离因子]
        A --> C[时间因子]
        A --> D[数量因子]
        A --> E[优先级因子]

        B --> F[log2(range + 1)]
        C --> G[(Game.time - last_time) / 3]
        D --> H[min(amount, 50)]
        E --> I[task.rank]

        F --> J[综合评分]
        G --> J
        H --> J
        I --> J

        J --> K[min(1, rank - range_factor)]
    end
```

### 目标选择流程

```mermaid
flowchart TD
    A[开始选择目标] --> B{Creep 状态}

    B -->|restore| C[寻找取货目标]
    B -->|drop| D[寻找卸货目标]

    C --> E[检查容器 > 1000 能量]
    E -->|有| F[选择最近容器]
    E -->|无| G[检查废墟]

    G -->|有| H[选择最近废墟]
    G -->|无| I[检查掉落资源 > 20]

    I -->|有| J[选择最近资源]
    I -->|无| K[检查存储器 > 200]

    K -->|有| L[选择存储器]
    K -->|无| M[无目标可用]

    D --> N[检查 Spawn/Extension]
    N -->|有空间| O[选择最近建筑]
    N -->|无| P[检查控制器容器]

    P -->|有空间| Q[选择控制器容器]
    P -->|无| R[检查防御塔]

    R -->|有空间| S[选择防御塔]
    R -->|无| T[选择存储器]
```

## 扩展性设计

### 插件化架构

```mermaid
graph TB
    subgraph "可扩展架构设计"
        A[BaseRole 抽象基类] --> B[RoleCarry 实现]
        A --> C[未来角色扩展]

        D[TaskTransBase 基类] --> E[TaskTransIn 输入任务]
        D --> F[TaskTransOut 输出任务]
        D --> G[自定义任务类型]

        H[配置驱动] --> I[优先级映射表]
        H --> J[角色限制配置]
        H --> K[房间特定配置]

        L[事件系统] --> M[任务完成事件]
        L --> N[目标变更事件]
        L --> O[性能监控事件]
    end
```

## 最佳实践建议

### 1. 版本选择指南

- **新项目**: 推荐使用 Carry v2 (静态类版本)
- **面向对象需求**: 使用 RoleCarry v2 (基类继承版本)
- **简单场景**: 可考虑 Carrier v1

### 2. 性能优化要点

- 合理使用缓存装饰器
- 定期清理无效映射和任务
- 避免频繁的路径计算
- 使用可视化路径样式减少 CPU 消耗

### 3. 扩展开发建议

- 继承 BaseRole 类实现新角色
- 使用配置驱动的优先级系统
- 实现自定义任务评分算法
- 添加性能监控和调试信息

### 4. 调试和监控

- 使用 `creep.memory.debug` 存储调试信息
- 利用 `creep.say()` 显示当前状态
- 监控任务映射表大小和清理频率
- 跟踪任务完成率和效率指标

## 总结

Screeps 运输角色系统展现了从简单函数式设计到复杂面向对象架构的演进过程。v2 版本引入了智能任务管理、优先级评分和目标冲突处理机制，显著提升了系统的可靠性和效率。该设计为未来的功能扩展和性能优化提供了良好的基础架构。
