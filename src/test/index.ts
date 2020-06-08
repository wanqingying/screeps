import { isEqual } from 'lodash';

interface Task {
    fn: Function;
    res: any;
    msg?: string;
}
function testAll(tasks: Task[]) {
    let k = 0;
    tasks.forEach(task => {
        const { fn, res, msg = '' } = task;
        const gotFn = fn();
        if (isEqual(gotFn, res)) {
            k++;
        } else {
            console.log(`err except ${res} but got ${gotFn}`);
        }
    });
}
