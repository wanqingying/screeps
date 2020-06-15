// 房间是否可以开外矿
import { findNearTarget } from './lib_base';

export function canReservation(room: Room): boolean {
    if (room.controller) {
        return false;
    }
    if (room.controller.owner.username) {
        return false;
    }
    if (!room.controller.reservation.username) {
        return true;
    }
    return room.controller.reservation.username === w_my_name;
}

export function findRepairTarget(room: Room, types?: any[] | null, excludes?: any[]): AnyStructure {
    let targets = room
        .findBy(FIND_STRUCTURES, t => {
            if (types && !types.includes(t.structureType)) {
                return false;
            }
            if (excludes && excludes.includes(t.structureType)) {
                return false;
            }
            return t.hits < (t.hitsMax * 4) / 5;
        })
        .sort((a, b) => {
            return a.hits - b.hits;
        });
    return targets.shift();
}
export function findHealTarget(room: Room): AnyCreep {
    return room
        .findBy(FIND_MY_CREEPS, t => t.hits < t.hitsMax)
        .sort((a, b) => {
            return a.hits - b.hits;
        })[0];
}

export function findAttackTarget(room: Room) {
    let targets = room
        .findBy(FIND_HOSTILE_CREEPS, t => {
            return t.body.some(b => [ATTACK, RANGED_ATTACK, HEAL].includes(b.type as any));
        })
        .sort((a, b) => {
            return a.hits - b.hits;
        });
    return targets.shift();
}

// 获取房间内 source 和旁边 container 配对信息
export function getSourceWithContainer(
    room: Room
): { source: Source; container: StructureContainer | undefined }[] {
    const containers = room.findBy(FIND_STRUCTURES, t => t.structureType === STRUCTURE_CONTAINER);
    return room.find(FIND_SOURCES).map(source => {
        const near_container = findNearTarget(source, containers) as StructureContainer;
        const far = w_utils.count_distance(near_container?.pos, source?.pos);
        if (far <= 2 && near_container) {
            return { source: source, container: near_container };
        } else {
            return { source: source, container: undefined };
        }
    });
}
