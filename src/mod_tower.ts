import { findRepairTarget, findAttackTarget, findHealTarget } from './lib_room';

export function load_tower_logic() {
    Object.values(Game.rooms).forEach(room => {
        try {
            checkTower(room);
        } catch (e) {
            g_log('err load_tower_logic ', room.name);
            g_log_err(e.message);
            g_log_err(e.stack);
        }
    });
}

function checkTower(room: Room) {
    const towers = room.findBy(
        FIND_STRUCTURES,
        t => t.structureType === STRUCTURE_TOWER
    ) as StructureTower[];
    for (let i = 0; i < towers.length; i++) {
        const tower = towers[i];
        const targetHeal = findHealTarget(room);
        if (targetHeal) {
            tower.heal(targetHeal);
            continue;
        }
        const targetRepair = findRepairTarget(room, null, [STRUCTURE_WALL, STRUCTURE_RAMPART]);
        if (targetRepair) {
            tower.repair(targetRepair);
            continue;
        }
        const targetAttack = findAttackTarget(room);
        if (targetAttack) {
            tower.attack(targetAttack);
        }
    }
}
