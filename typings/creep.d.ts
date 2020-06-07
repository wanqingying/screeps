declare interface Creep {
    target_id?: string;
    target_id_mine_energy?: string;
    target_id_drop_source?: string;
    target_id_move_to?: string;
    // 工作前自检，false则表示无法工作
    action_before_work?: () => boolean;
    // 运输到最近的仓库
    transfer_nearby: () => boolean;
    // 捡起最大的垃圾
    pick_up_max_drop: (target: any) => boolean;
    // 开始工作
    run: role_run_fn;
    run_starter: role_run_fn;
    run_builder: role_run_fn;
    log: (p: any) => void;
}