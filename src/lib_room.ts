


export function find_source_min_harvester(room: Room) {
    return room.sourceInfo.sort((a, b) => {
        return a.harvesters.length - b.harvesters.length;
    })[0];
}



