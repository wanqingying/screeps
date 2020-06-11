let levelNow = 7;
let downgradeIn = 127782;
let shardTick = {
    shard0: 5.2,
    shard1: 3.7,
    shard2: 4.0,
    shard3: 3.2,
};
let controllerTicker = {
    1: 20e3,
    2: 10e3,
    3: 20e3,
    4: 40e3,
    5: 80e3,
    6: 120e3,
    7: 150e3,
    8: 200e3,
};
function getTicks(levelIn, downIn) {
    let ticks = 0;
    for (let level in controllerTicker) {
        if (level < levelIn) {
            ticks += controllerTicker[level];
        }
    }
    ticks += downIn;
    return ticks;
}
function getHours(levelIn, downIn, shardTickIn) {
    let ticks = getTicks(levelIn, downIn);
    let tickPerSecond = shardTickIn || shardTick[Game.shard.name];
    let hours = (ticks * tickPerSecond) / 3600;
    console.log(`需要 ${hours}小时 等于${hours / 24}天`);
    let claimNum = [1, 2, 5, 10, 15, 17];
    for (let a of claimNum) {
        console.log(
            `如果 用${a}claim加速 需要${(solveClaim(ticks, a) * tickPerSecond) / 3600 / 24}天`
        );
    }
    return hours;
}

function solveClaim(ticks, claimParts) {
    let downGradePer1000Tick = 1000;
    downGradePer1000Tick += 300 * claimParts;
    let newDownGradeTick = ticks * (1000 / downGradePer1000Tick);
    return newDownGradeTick;
}
getHours(levelNow, downgradeIn, 3.2);
