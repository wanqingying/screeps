import { Role } from "types";
import { roles_limit, roles_body, roles_priority } from "role";

// MOVE	50	每 tick 减少 2 点疲惫值
// WORK	100
// 每 tick 从能量源采集 2 单位能量。

// 每 tick 从矿区采集 1 单位矿物。

// 每 tick 增加工地建设进度 5 点，花费 5 单位能量。

// 每 tick 增加建筑 100 耐久度，花费 1 单位能量。

// 每 tick 拆减建筑 50 点耐久，并返还 0.25 单位能量。

// 每 tick 提高控制器升级进度 1 点，花费 1 单位能量。

// CARRY	50	携带最多 50 单位资源。
// ATTACK	80	对相邻的 creep 或建筑造成 30 点伤害。
// RANGED_ATTACK	150
// 单个目标时，每 tick 对 creep 或建筑造成 10 点伤害，范围为 3 格。

// 多个目标时，每 tick 对范围内所有 creep 与建筑造成 1-4-10 点伤害，具体伤害取决于距离，范围为 3 格。

// HEAL	250	治疗对象可为自己或其它 creep。自愈或治疗相邻 creep 时每 tick 恢复 12 点耐久，一定距离内远程治疗每 tick 恢复 4 点耐久。
// CLAIM	600
// 占领一个中立房间的控制器。

// 每部件每 tick 使己方对中立房间控制器的预定时间增加 1 tick，或使其他玩家的预定时间减少 1 tick。

// 每部件每 tick 使其他玩家控制器降级计数器加速 300 tick。

// 注：拥有该部件的 creep 寿命只有 600 tick，且无法被 renew。

// TOUGH	10	无附加效果，唯一作用是增加 creep 的最大耐久值。可被强化以承受更多伤害。

// body cost list :

// w 100, c 50, m 50, a 80, r 150, h 250, l 600, t 10
function getCreepBody(role: Role, room: Room): BodyPartConstant[] {
  let body: BodyPartConstant[] = [];
  const hasCarrier = room.memory.roles[Role.carrier].length > 0;
  const hasHarvester = room.memory.roles[Role.harvester].length > 0;
  const isOv = hasCarrier && hasHarvester;
  const capacity = isOv ? room.energyCapacityAvailable : Math.max(room.energyAvailable, 300);
  let move_cap = 0;
  let work_cap = 0;
  let cary_cap = 0;
  let count_m = 0;
  let count_w = 0;
  let count_c = 0;
  switch (role) {
    case Role.starter:
      body = [WORK, CARRY, MOVE];
      break;
    case Role.worker:
      body = [WORK, CARRY, MOVE];
      break;
    case Role.carrier:
    case Role.ruin_cary:
      //   move_cap = capacity * 0.33;
      //   cary_cap = capacity - move_cap;
      cary_cap = (capacity - 50) * 0.66;
      move_cap = capacity - cary_cap;
      count_m = Math.floor(move_cap / BODYPART_COST[MOVE]);
      count_c = Math.floor(cary_cap / BODYPART_COST[CARRY]);
      return Array(count_c).fill(CARRY).concat(Array(count_m).fill(MOVE));
    case Role.upgrader:
      if (room.memory.controller?.container) {
        // [w,w,c,m]
        count_m = 1;
        count_c = 1;
        count_w = Math.floor((capacity - BODYPART_COST[MOVE] - BODYPART_COST[CARRY]) / BODYPART_COST[WORK]);
        return Array(count_w).fill(WORK).concat(Array(count_c).fill(CARRY)).concat(Array(count_m).fill(MOVE));
      }
      //[w,c,m]
      move_cap = capacity * 0.25;
      cary_cap = capacity * 0.25;
      work_cap = capacity - move_cap - cary_cap;
      count_w = Math.floor(work_cap / BODYPART_COST[WORK]);
      count_c = Math.floor(cary_cap / BODYPART_COST[CARRY]);
      count_m = Math.floor(move_cap / BODYPART_COST[MOVE]);
      return Array(count_w).fill(WORK).concat(Array(count_c).fill(CARRY)).concat(Array(count_m).fill(MOVE));
    case Role.builder:
      //[w,c,m]
      move_cap = capacity * 0.25;
      cary_cap = capacity * 0.25;
      work_cap = capacity - move_cap - cary_cap;
      count_w = Math.floor(work_cap / BODYPART_COST[WORK]);
      count_c = Math.floor(cary_cap / BODYPART_COST[CARRY]);
      count_m = Math.floor(move_cap / BODYPART_COST[MOVE]);
      return Array(count_w).fill(WORK).concat(Array(count_c).fill(CARRY)).concat(Array(count_m).fill(MOVE));
    case Role.harvester:
      //[w,w,m]
      move_cap = capacity * 0.2;
      work_cap = capacity - move_cap;
      count_w = Math.floor(work_cap / BODYPART_COST[WORK]);
      count_m = Math.floor(move_cap / BODYPART_COST[MOVE]);
      return Array(count_w).fill(WORK).concat(Array(count_m).fill(MOVE));
    default:
      console.log(`Unknown role: ${role}`);
      break;
  }
  return body;
}

export function spawnCreep(role: Role, spawn?: StructureSpawn) {
  if (!spawn) {
    console.log("No spawn found in the room");
    return;
  }
  const body = getCreepBody(role, spawn.room);
  const rn = Math.random().toString(36).substring(2, 5);
  const name = `${role}-${rn}`;
  const bodyCost = body.reduce((sum, part) => sum + BODYPART_COST[part], 0);
  const energyAvailable = spawn.room.energyAvailable;
  if (spawn.spawning) {
    spawn.room.visual.text(`🛠️ ${spawn.spawning.name}`, spawn.pos.x + 1, spawn.pos.y, { align: "left", opacity: 0.8 });

    return;
  }
  if (bodyCost > energyAvailable) {
    if (Game.time % 5 === 0) {
       console.log(`no energy spawn ${name}, required: ${bodyCost}, available: ${energyAvailable}`);
    }
	return;
  }
  spawn.spawnCreep(body, name, {
    memory: {
      role: role,
      name: name,
      room: spawn.room.name,
      working: false,
      state: "idle"
    }
  });
  console.log(`Spawning new creep: ${name} with role ${role}`);
}

export function getRolesCount(room: Room) {
  const exist_roles: Record<string, number> = {};

  for (const creep of room.find(FIND_MY_CREEPS)) {
    if (exist_roles[creep.memory.role]) {
      exist_roles[creep.memory.role]++;
    } else {
      exist_roles[creep.memory.role] = 1;
    }
  }

  return exist_roles;
}

export function spawn_room(room: Room) {
  const exist_roles = room.memory.roles;
  const should_spawn_starter = exist_roles[Role.harvester].length === 0 && exist_roles[Role.carrier].length === 0;
  const should_spawn_builder = room.find(FIND_MY_CONSTRUCTION_SITES).length > 0;
  const should_spawn_upgrader = room.memory.controller?.container || room.memory.controller?.link;

  let sp: { role: Role; w: number }[] = [];
  roles_priority.forEach((r, i) => {
    const count_exist = exist_roles[r]?.length || 0;
    let count_spawn = roles_limit[r] - count_exist;
    if (!should_spawn_starter && r === Role.starter) {
      count_spawn = 0;
    }
    if (r === Role.builder && !should_spawn_builder) {
      count_spawn = 0;
    }
    if (r === Role.upgrader && !should_spawn_upgrader) {
      count_spawn = 0;
    }
    sp.push({
      role: r,
      w: Math.max(0, count_spawn) * (i + 1)
    });
  });
  sp.sort((a, b) => b.w - a.w);
  if (sp[0]?.w > 0) {
    const role = sp[0].role;
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (spawn) {
      spawnCreep(role, spawn);
    } else {
      //   console.log("No spawn found in the room");
    }
  }
}
