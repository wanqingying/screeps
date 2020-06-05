import {roomList} from "./bootstrap.constant";
import {check_screeps, spawn_creep} from "./utils.uta";

export function check_state() {
    flush_data();
    let creep_count=Object.keys(Game.creeps).length;

    if (creep_count===0){
        start_0()
    }


    // roomList.forEach(name => {
    //     let room = Game.rooms[name];
    //     if (!room) {
    //         Memory.errors.push('room not exist ' + name)
    //     } else {
    //         check_room_state(room)
    //     }
    // })
}

export function check_room_state(room: Room) {
    Memory.rooms[room.name] = room;
}

function flush_data() {
    Memory.errors = [];

    check_screeps();
}

function start_0() {
    let fr=roomList[0];
    let first_room=Game.rooms[fr.room_name];
    let first_spawn=Game.spawns[fr.spawn_name];
    spawn_creep({spawn:first_spawn,body:[MOVE,WORK,CARRY],name:'span1',role:"starter"})
}