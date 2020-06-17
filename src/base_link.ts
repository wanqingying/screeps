import { is_empty_tate, is_full_tate, isNotEmpty, isNotFull } from './lib_base';

interface LinkTask {
    link_a: StructureLink[];
    link_b: StructureLink;
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
            const link_b: StructureLink = Game.getObjectById(b_id);
            if (is_empty_tate(link_a, 0.5)) {
                return;
            }
            if (is_full_tate(link_b, 0.5)) {
                return;
            }
            link_a.transferEnergy(link_b);
        });
    };
}
