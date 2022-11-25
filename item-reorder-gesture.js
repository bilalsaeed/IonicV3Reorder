import { findReorderItem, indexForItem } from './item-reorder-util';
import { pointerCoord } from '../../util/dom';
import { UIEventManager } from '../../gestures/ui-event-manager';
/**
 * @hidden
 */
var ItemReorderGesture = (function() {
    function ItemReorderGesture(plt, reorderList) {
        this.plt = plt;
        this.reorderList = reorderList;
        this.selectedItemEle = null;
        this.events = new UIEventManager(plt);
        this.scrollElInitial = 0;
        this.scrollElTop = 0;
        this.scrollElBottom = 0;
        this.cachedHeights = []
        this.events.pointerEvents({
            element: this.reorderList.getNativeElement(),
            pointerDown: this.onDragStart.bind(this),
            pointerMove: this.onDragMove.bind(this),
            pointerUp: this.onDragEnd.bind(this),
            zone: false
        });
    }
    ItemReorderGesture.prototype.onDragStart = function(ev) {
        if (this.selectedItemEle) {
            return false;
        }
        var reorderElement = ev.target;
        if (reorderElement.nodeName !== 'ION-REORDER') {
            return false;
        }
        var reorderMark = reorderElement['$ionComponent'];
        if (!reorderMark) {
            console.error('ion-reorder does not contain $ionComponent');
            return false;
        }
        this.reorderList._reorderPrepare();
        var item = reorderMark.getReorderNode();
        if (!item) {
            console.error('reorder node not found');
            return false;
        }
        ev.preventDefault();
        const heights = this.cachedHeights;
        heights.length = 0;
        let sum = 0;
        for (let i = 0; i < this.reorderList._element.children.length; i++) {
            const child = this.reorderList._element.children[i];
            sum += child.offsetHeight;
            heights.push(sum);
            child.$ionIndex = i;
        }
        // Preparing state
        this.selectedItemEle = item;
        this.selectedItemHeight = item.offsetHeight;
        this.lastYcoord = -100;
        this.lastToIndex = indexForItem(item);
        this.windowHeight = this.plt.height() - AUTO_SCROLL_MARGIN;
        this.lastScrollPosition = this.reorderList._scrollContent(0);
        this.offset = pointerCoord(ev);
        this.offset.y += this.lastScrollPosition;
        const scrollBox = this.reorderList._content.getScrollElement().getBoundingClientRect();
        this.scrollElInitial = this.reorderList._content.getScrollElement().scrollTop;
        this.scrollElTop = scrollBox.top + AUTO_SCROLL_MARGIN;
        this.scrollElBottom = scrollBox.bottom - AUTO_SCROLL_MARGIN;
        const box = this.reorderList._element.getBoundingClientRect();
        this.containerTop = box.top;
        this.containerBottom = box.bottom;
        item.classList.add(ITEM_REORDER_ACTIVE);
        this.reorderList._reorderStart();
        return true;
    };
    ItemReorderGesture.prototype.onDragMove = function(ev) {
        var selectedItem = this.selectedItemEle;
        if (!selectedItem) {
            return;
        }
        ev.preventDefault();
        // Get coordinate
        var coord = pointerCoord(ev);
        var posY = coord.y;
        // Scroll if we reach the scroll margins
        var scrollPosition = this.scroll(posY);

        const top = this.containerTop - scrollPosition;
        const bottom = this.containerBottom - scrollPosition;
        const currentY = Math.max(top, Math.min(posY, bottom));
        const normalizedY = currentY - top;

        const toIndex = this.itemIndexForTop(normalizedY);
        if (toIndex !== this.lastToIndex) {
            const fromIndex = indexForItem(selectedItem);
            this.lastToIndex = toIndex;
            this.reorderList._reorderMove(fromIndex, toIndex, this.selectedItemHeight);
        }
        var ydiff = Math.round(posY - this.offset.y + scrollPosition);
        selectedItem.style[this.plt.Css.transform] = "translateY(" + ydiff + "px)";
    };
    ItemReorderGesture.prototype.onDragEnd = function(ev) {
        var _this = this;
        var selectedItem = this.selectedItemEle;
        if (!selectedItem) {
            return;
        }
        if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
        }
        var toIndex = this.lastToIndex;
        var coord = pointerCoord(ev);
        var overItem = this.itemForCoord(coord);
        if (overItem) {
            toIndex = indexForItem(overItem);
        }
        var fromIndex = indexForItem(selectedItem);
        var reorderInactive = function() {
            _this.selectedItemEle.style.transition = '';
            _this.selectedItemEle.classList.remove(ITEM_REORDER_ACTIVE);
            _this.selectedItemEle = null;
        };
        if (toIndex === fromIndex) {
            selectedItem.style.transition = 'transform 200ms ease-in-out';
            setTimeout(reorderInactive, 200);
        }
        else {
            reorderInactive();
        }
        this.reorderList._reorderEmit(fromIndex, toIndex);
    };
    ItemReorderGesture.prototype.itemForCoord = function(coord) {
        var sideOffset = this.reorderList._isStart === this.plt.isRTL ? -50 : 100;
        var x = this.offset.x + sideOffset;
        var y = coord.y;
        var element = this.plt.getElementFromPoint(x, y);
        return findReorderItem(element, this.reorderList.getNativeElement());
    };
    ItemReorderGesture.prototype.scroll = function(posY) {
        let amount = 0;
        if (posY < this.scrollElTop) {
            amount = -SCROLL_JUMP;
            this.lastScrollPosition += amount;
        } else if (posY > this.scrollElBottom) {
            amount = SCROLL_JUMP;
            this.lastScrollPosition += amount;
        }
        if (amount !== 0) {
            this.reorderList._content.getScrollElement().scrollBy(0, amount);
        }
        return this.reorderList._content.getScrollElement().scrollTop - this.scrollElInitial;
        //if (posY < AUTO_SCROLL_MARGIN) {
        //    this.lastScrollPosition += this.reorderList._scrollContent(-SCROLL_JUMP);
        //}
        //else if (posY > this.windowHeight) {
        //    this.lastScrollPosition += this.reorderList._scrollContent(SCROLL_JUMP);
        //}
        //return this.lastScrollPosition;
    };

    ItemReorderGesture.prototype.itemIndexForTop = function(deltaY) {
        const heights = this.cachedHeights;

        for (let i = 0; i < heights.length; i++) {
            if (heights[i] > deltaY) {
                return i;
            }
        }
        return heights.length - 1;
    }
    /**
     * @hidden
     */
    ItemReorderGesture.prototype.destroy = function() {
        this.onDragEnd(null);
        this.events.destroy();
        this.events = null;
        this.reorderList = null;
    };
    return ItemReorderGesture;
}());
export { ItemReorderGesture };
var AUTO_SCROLL_MARGIN = 60;
var SCROLL_JUMP = 10;
var ITEM_REORDER_ACTIVE = 'reorder-active';
//# sourceMappingURL=item-reorder-gesture.js.map
