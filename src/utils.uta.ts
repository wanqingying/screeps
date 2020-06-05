//刷新掉memory里不存在的creep
export function check_screeps() {
    for (let name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            delete Memory.creeps[name]
        }
    }


}

interface spawn_creep_o {
    role:role_name
    body:BodyPartConstant[]
    name:string
    spawn:StructureSpawn
}

export function spawn_creep(opt:spawn_creep_o) {
    opt.spawn.spawnCreep( opt.body, opt.name,
        { memory: { role: opt.role } } );
}
