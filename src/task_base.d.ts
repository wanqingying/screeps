declare interface BaseTaskTarget<T> {
    ref:T|null
    id:string
    pos:RoomPosition
}

declare interface AnyPosIdTarget {
    id:string
    pos:RoomPosition
}

