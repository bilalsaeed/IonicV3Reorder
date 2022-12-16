import { Platform } from '../../platform/platform';
/**
 * @hidden
 */
export declare class ItemReorderGesture {

    private scrollEl: HTMLElement;
    private cachedHeights: number[];
    private scrollElTop;
    private scrollElBottom;
    private scrollElInitial;
    private containerTop;
    private containerBottom;

    private containerTop;
    private containerBottom;
    plt: Platform;
    reorderList: ItemReorderGestureDelegate;
    private selectedItemEle;
    private selectedItemHeight;
    private offset;
    private lastToIndex;
    private lastYcoord;
    private lastScrollPosition;
    private emptyZone;
    private windowHeight;
    private events;
    constructor(plt: Platform, reorderList: ItemReorderGestureDelegate);
    private onDragStart(ev);
    private onDragMove(ev);
    private onDragEnd(ev);
    private itemForCoord(coord);
    private scroll(posY);
    private itemIndexForTop(posY);
    /**
     * @hidden
     */
    destroy(): void;
}
export interface ItemReorderGestureDelegate {
    _isStart: boolean;
    getNativeElement: () => any;
    _reorderPrepare: () => void;
    _scrollContent: (scrollPosition: number) => number;
    _reorderStart: () => void;
    _reorderMove: (fromIndex: number, toIndex: number, itemHeight: number) => void;
    _reorderEmit: (fromIndex: number, toIndex: number) => void;
}
