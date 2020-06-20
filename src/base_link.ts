import { is_less_than, is_more_than, isNotEmpty, isNotFull } from './lib_base';

interface LinkTask {
    link_a: StructureLink[];
    link_out: StructureLink;
}
export class BaseLink {
    private roomsLink: any;
    private resType = RESOURCE_ENERGY;
    constructor() {}

    public static start = () => {
        let links: string[][] = [];
        Object.values(w_config.rooms).forEach(c => {
            links = links.concat(c?.link_pair || []);
        });
        links.forEach(([a_id, b_id]) => {
            if (!a_id || !b_id) {
                return;
            }
            const link_a: StructureLink = Game.getObjectById(a_id);
            const link_out: StructureLink = Game.getObjectById(b_id);
            // a 必须有充足能量  b必须有足够空余
            if (is_more_than(link_a, 0.1) && is_less_than(link_out, 0.9)) {
                link_a.transferEnergy(link_out);
            }
        });
    };
}
