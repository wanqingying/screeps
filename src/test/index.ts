import { isEqual } from 'lodash';

interface Task {
    fn: Function;
    res: any;
    msg?: string;
}
