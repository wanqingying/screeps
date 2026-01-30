# AGENTS.md - Screeps TypeScript Starter 代码助手指南

本文档为在此 Screeps TypeScript 项目中工作的代码助手提供详细指导。

## 项目概览

这是一个成熟的 Screeps AI 开发框架，使用 TypeScript 构建，具有分层架构、角色系统、任务管理和完整的工具链。

### 核心架构

- **分层设计**: 基础类 → 扩展 → 原型 → 业务逻辑
- **角色系统**: 基于枚举的 Creep 角色管理 (v1 + v2)
- **任务系统**: 传输任务的抽象化管理 (v1 + v2)
- **缓存系统**: 装饰器实现的性能优化
- **事件系统**: EventBus 驱动的架构

## 构建、测试和 Lint 命令

### 基本命令

```bash
# 代码检查
npm run lint

# 构建项目
npm run build

# 运行所有测试
npm run test

# 运行单元测试
npm run test-unit

# 运行集成测试（需要额外配置）
npm run test-integration
```

### 部署命令

```bash
# 部署到主服务器
npm run push-main

# 部署到私服
npm run push-pserver

# 部署到季节服务器
npm run push-season

# 部署到模拟器
npm run push-sim
```

### 监听模式（开发时使用）

```bash
# 监听并自动部署到主服务器
npm run watch-main

# 监听并自动部署到私服
npm run watch-pserver

# 监听并自动部署到季节服务器
npm run watch-season

# 监听并自动部署到模拟器
npm run watch-sim
```

### 运行单个测试文件

```bash
# 运行特定测试文件
npx mocha test/unit/path/to/specific.test.ts

# 运行特定目录下的测试
npx mocha "test/unit/role/**/*.ts"

# 使用 grep 运行特定测试用例
npx mocha test/unit/**/*.ts --grep "测试用例名称"
```

## 代码风格指南

### 导入规范

```typescript
// 1. 第三方库导入
import { planner } from "./mod/autoplannerv201";

// 2. 类型导入
import "types";
import { Role } from "types";

// 3. 本地模块导入（按功能分组）
import "./prototype/room";
import "./prototype/tower";
import { ErrorMapper } from "utils/ErrorMapper";
import { work } from "./role";
```

### 格式化配置 (Prettier)

- **分号**: 必须使用 (semi: true)
- **缩进**: 2 个空格 (tabWidth: 2)
- **行宽**: 120 字符 (printWidth: 120)
- **引号**: 双引号 (singleQuote: false)
- **尾随逗号**: 所有地方都使用 (trailingComma: "all")
- **箭头函数括号**: 避免不必要的括号 (arrowParens: "avoid")

### TypeScript 配置

- **目标版本**: ES2019
- **模块系统**: ESNext
- **严格模式**: 关闭 (strict: false)
- **装饰器**: 启用实验性装饰器
- **源码映射**: 启用

### 命名约定

```typescript
// 枚举使用 PascalCase
export enum Role {
  starter = "starter",
  worker = "worker",
  carrier = "carrier",
}

// 类使用 PascalCase
export class RoomExtend {
  public static run_tick() {}
}

// 函数使用 camelCase 或 snake_case（项目中混用）
export function work(creep: Creep) {}
export function work_starter(creep: Creep) {}

// 常量使用 UPPER_SNAKE_CASE
const MAX_CREEPS = 10;

// 接口使用 PascalCase
interface CreepMemory {
  role: Role;
  state?: string;
}
```

### 类型定义

```typescript
// 优先使用接口扩展而非类型别名
interface RoomMemory {
  init?: boolean;
  renew?: boolean;
}

// 使用枚举定义常量集合
export enum Role {
  starter = "starter",
  worker = "worker",
}

// 泛型类型使用描述性名称
export function CacheIds<T extends _HasId>(ttl: number = 0): MethodDecorator;
```

### 错误处理

```typescript
// 使用 ErrorMapper 包装主循环
export const loop = ErrorMapper.wrapLoop(() => {
  // 主要逻辑
});

// 函数内部使用 try-catch
try {
  // 可能出错的代码
} catch (error) {
  console.log(`Error in ${functionName}:`, error);
}
```

### 装饰器使用

```typescript
// 缓存装饰器 - 用于性能优化
@CacheTick(10)
public getSources(): Source[] {
  return this.room.find(FIND_SOURCES);
}

// 日志装饰器 - 用于调试
@Log(10, "RoomExtend")
public getRdGameTime(key: string): number {
  return Game.time - this.cache[key];
}

// ID 缓存装饰器 - 用于游戏对象缓存
@CacheId(50)
public getController(): StructureController | null {
  return this.room.controller;
}
```

## ESLint 规则重点

### 强制规则

- **显式成员访问性**: 必须明确 public/private/protected
- **禁用 any 类型**: 关闭 (项目允许使用 any)
- **驼峰命名**: 强制使用 camelCase
- **禁用位运算**: 不允许使用位运算符
- **禁用 eval**: 不允许使用 eval
- **单一类声明**: 每个文件最多一个类
- **导入排序**: 建议按字母顺序排序导入

### 项目特殊规则

- 允许使用 `console.log` (no-console: off)
- 允许使用 `any` 类型
- 强制使用 `===` 而非 `==`
- 禁用下划线前缀变量名（警告级别）

## 文件组织结构

### 源码目录结构

```
src/
├── main.ts                 # 主入口文件
├── base/                   # 基础类（Logger, RootObj）
├── extend/                 # 扩展类（RoomExtend 等）
├── prototype/              # 原型扩展（Room, Creep, Tower）
├── role/                   # Creep 角色实现 (v1)
├── role-v2/                # 角色系统 v2
├── room/                   # 房间管理
├── spawn/                  # 孵化管理
├── task/                   # 任务系统 (v1)
├── task-v2/                # 任务系统 v2
├── types/                  # 类型定义
├── utils/                  # 工具函数
└── mod/                    # 第三方模块
```

### 新功能开发指南

1. **新角色**: 添加到 `src/role/` 或 `src/role-v2/`
2. **新任务**: 添加到 `src/task/` 或 `src/task-v2/`
3. **类型定义**: 添加到 `src/types/`
4. **工具函数**: 添加到 `src/utils/`
5. **原型扩展**: 添加到 `src/prototype/`

## 测试指南

### 测试文件结构

```
test/
├── unit/                   # 单元测试
└── integration/            # 集成测试
```

### 测试框架

- **测试运行器**: Mocha
- **断言库**: Chai
- **模拟库**: Sinon

### 测试命名约定

```typescript
describe("RoomExtend", () => {
  describe("getSources", () => {
    it("should return all sources in room", () => {
      // 测试逻辑
    });
  });
});
```

## 性能优化

### 缓存策略

- 使用 `@CacheTick(ttl)` 缓存计算结果
- 使用 `@CacheId(ttl)` 缓存游戏对象 ID
- 使用 `@CacheIds(ttl)` 缓存对象 ID 数组

### 内存管理

- 避免在 Memory 中存储大量数据
- 使用全局缓存 `global.cache` 存储临时数据
- 定期清理无用的内存数据

## 调试和日志

### 日志系统

```typescript
// 使用装饰器记录函数调用
@Log(10, "FunctionName")
public myFunction() { }

// 直接使用 console.log
console.log(`time:${Game.time}, message`);
```

### 性能分析

项目集成了 screeps-profiler，可用于性能分析。

## 部署注意事项

1. **环境配置**: 确保 `screeps.json` 配置正确
2. **构建检查**: 部署前运行 `npm run build` 确保无编译错误
3. **代码检查**: 部署前运行 `npm run lint` 确保代码质量
4. **测试验证**: 部署前运行 `npm run test` 确保功能正常

## 常见问题

1. **模块导入**: 项目使用 ES 模块，确保 import/export 语法正确
2. **类型错误**: 使用严格的 TypeScript 配置，注意类型定义
3. **装饰器**: 确保启用实验性装饰器支持
4. **路径解析**: 使用 `src/*` 路径别名进行模块导入

---

遵循本指南将确保代码质量和项目一致性。如有疑问，请参考现有代码示例或项目文档。
