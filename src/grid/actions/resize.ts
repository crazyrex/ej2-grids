import { EventHandler, createElement, detach, formatUnit, Browser, closest } from '@syncfusion/ej2-base';
import { Column } from '../models/column';
import { IGrid, IAction, ResizeArgs } from '../base/interface';
import { ColumnWidthService } from '../services/width-controller';
import * as events from '../base/constant';
import { getScrollBarWidth } from '../base/util';
import { OffsetPosition } from '@syncfusion/ej2-popups';

export const resizeClassList: ResizeClasses  = {
    root: 'e-rhandler',
    suppress: 'e-rsuppress',
    icon: 'e-ricon',
    helper: 'e-rhelper',
    header: 'th.e-headercell',
    cursor: 'e-rcursor',
    lines: 'e-rlines'
};

export interface ResizeClasses {
    root: string;
    suppress: string;
    icon: string;
    helper: string;
    header: string;
    cursor: string;
    lines: string;
}

/**
 * `Resize` module is used to handle Resize to fit for columns.
 * @hidden
 * @private
 */
export class Resize implements IAction {
    //Internal variable    
    private content: HTMLDivElement;
    private header: HTMLDivElement;
    private pageX: number;
    private column: Column;
    private element: HTMLElement;
    private helper: HTMLElement;
    //Module declarations
    private parent: IGrid;
    private widthService: ColumnWidthService;

    /**
     * Constructor for the Grid resize module
     * @hidden
     */
    constructor(parent ? : IGrid) {
        this.parent = parent;
        if (this.parent.isDestroyed) {
            return;
        }
        this.widthService = new ColumnWidthService(parent);
        this.addEventListener();
    }

    /** 
     * Resize by field names. 
     * @param  {string|string[]} fName - Defines the field name.  
     * @return {void} 
     */
    public autoFitColumns(fName: string | string[]): void {
        let columnName: string[] = (fName === undefined || fName === null || fName.length <= 0) ?
            this.parent.getColumns().map((x: Column) => x.field) : (typeof fName === 'string') ? [fName] : fName;
        this.findColumn(columnName);
    }
    private resizeColumn(fName: string, index: number, id ? : string): void {
        let gObj: IGrid = this.parent;
        let tWidth: number = 0;
        let headerTable: Element = this.parent.getHeaderTable();
        let contentTable: Element = this.parent.getContentTable();
        let headerDivTag: string = 'e-gridheader';
        let contentDivTag: string = 'e-gridcontent';
        let indentWidthClone: NodeListOf < Element > = gObj.getHeaderTable().querySelector('tr').querySelectorAll('.e-grouptopleftcell');
        let indentWidth: number = 0;
        if (indentWidthClone.length > 0) {
            for (let i: number = 0; i < indentWidthClone.length; i++) {
                indentWidth += ( < HTMLElement > indentWidthClone[i]).offsetWidth;
            }
        }
        let uid: string = id ? id : this.parent.getUidByColumnField(fName);
        let columnIndex: number = this.parent.getNormalizedColumnIndex(uid);
        let headerTextClone: Element = ( < HTMLElement > headerTable.querySelectorAll('th')[columnIndex].cloneNode(true));
        let headerText: Element[] = [headerTextClone];
        let contentTextClone: NodeListOf < Element > = contentTable.querySelectorAll(`td:nth-child(${columnIndex + 1})`);
        let contentText: Element[] = [];
        for (let i: number = 0; i < contentTextClone.length; i++) {
            contentText[i] = contentTextClone[i].cloneNode(true) as Element;
        }
        let wHeader: number = this.createTable(headerTable, headerText, headerDivTag);
        let wContent: number = this.createTable(contentTable, contentText, contentDivTag);
        let columnbyindex: Column = gObj.getColumns()[index];
        let result: Boolean;
        let width: string = (wHeader > wContent) ? columnbyindex.width = formatUnit(wHeader) : columnbyindex.width = formatUnit(wContent);
        this.widthService.setColumnWidth(gObj.getColumns()[index] as Column);
        result = gObj.getColumns().some((x: Column) => x.width === null || x.width === undefined || (x.width as string).length <= 0);
        if (result === false) {
            (gObj.getColumns() as Column[]).forEach((element: Column) => {
                tWidth = tWidth + parseInt(element.width as string, 10);
            });
        }
        let contentwidth: number = (gObj.getContent().scrollWidth);
        let tableWidth: number = tWidth + indentWidth;
        if (tWidth > 0) {
            ( < HTMLTableElement > headerTable).style.width = formatUnit(tableWidth);
            ( < HTMLTableElement > contentTable).style.width = formatUnit(tableWidth);
        }
        if (contentwidth > tableWidth) {
            headerTable.classList.add('e-tableborder');
            contentTable.classList.add('e-tableborder');
        } else {
            headerTable.classList.remove('e-tableborder');
            contentTable.classList.remove('e-tableborder');
        }
    }

    /**
     * To destroy the resize 
     * @return {void}
     * @hidden
     */
    public destroy(): void {
        this.widthService = null;
        this.unwireEvents();
        this.removeEventListener();
    }
    /**
     * For internal use only - Get the module name.
     * @private
     */
    protected getModuleName(): string {
        return 'resize';
    }
    private findColumn(fName: string[]): void {
        fName.forEach((element: string) => {
            let fieldName: string = element as string;
            let columnIndex: number = this.parent.getColumnIndexByField(fieldName);
            if (this.parent.getColumns()[columnIndex].visible === true) {
                this.resizeColumn(fieldName, columnIndex);
            }
        });
    }
    /**
     * To create table for autofit 
     * @hidden
     */
    protected createTable(table: Element, text: Element[], tag: string): number {
        let myTableDiv: HTMLDivElement = createElement('div') as HTMLDivElement;
        myTableDiv.className = this.parent.element.className;
        myTableDiv.style.cssText = 'display: inline-block;visibility:hidden;position:absolute';
        let mySubDiv: HTMLDivElement = createElement('div') as HTMLDivElement;
        mySubDiv.className = tag;
        let myTable: HTMLTableElement = createElement('table') as HTMLTableElement;
        myTable.className = table.className;
        myTable.style.cssText = 'table-layout: auto;width: auto';
        let myTr: HTMLTableRowElement = createElement('tr') as HTMLTableRowElement;
        text.forEach((element: Element) => {
            let tr: HTMLTableRowElement = myTr.cloneNode() as HTMLTableRowElement;
            tr.className = table.querySelector('tr').className;
            tr.appendChild(element);
            myTable.appendChild(tr);
        });
        mySubDiv.appendChild(myTable);
        myTableDiv.appendChild(mySubDiv);
        document.body.appendChild(myTableDiv);
        let offsetWidthValue: number = myTable.getBoundingClientRect().width;
        document.body.removeChild(myTableDiv);
        return Math.ceil(offsetWidthValue);
    }
    /**
     * @hidden
     */
    public addEventListener() : void {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(events.headerRefreshed, this.render, this);
    }
    /**
     * @hidden
     */
    public removeEventListener(): void {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(events.headerRefreshed, this.render);
    }
    /**
     * @hidden
     */
    public render(): void {
        this.wireEvents();
        if (!(this.parent.gridLines === 'vertical' || this.parent.gridLines === 'both')) {
            this.parent.element.classList.add(resizeClassList.lines);
        }
    }

    private wireEvents(): void {
        this.getResizeHandlers().forEach((ele: HTMLElement ) => {
            ele.style.height  = ele.parentElement.offsetHeight + 'px';
            EventHandler.add(ele, Browser.touchStartEvent, this.resizeStart, this);
            EventHandler.add(ele, events.dblclick, this.callAutoFit, this);
        });
    }

    private unwireEvents(): void {
        this.getResizeHandlers().forEach((ele: HTMLElement) => {
            EventHandler.remove(ele, Browser.touchStartEvent, this.resizeStart);
            EventHandler.remove(ele, events.dblclick, this.callAutoFit);
        });
    }

    private getResizeHandlers(): HTMLElement[] {
        return [].slice.call(this.parent.getHeaderTable().querySelectorAll('.' + resizeClassList.root));
    }

    private callAutoFit(e: PointerEvent): void {
        let col: Column = this.getTargetColumn(e);
        this.resizeColumn(col.field, this.parent.getNormalizedColumnIndex(col.uid), col.uid);
    }

    private resizeStart(e: PointerEvent | TouchEvent): void {
        if (!this.helper) {
            this.element = e.target as HTMLElement;
            this.appendHelper();
            this.column = this.getTargetColumn(e);
            this.pageX = this.getPointX(e);
        }
        if (Browser.isDevice && !this.helper.classList.contains(resizeClassList.icon)) {
            this.helper.classList.add(resizeClassList.icon);
            EventHandler.add(document, Browser.touchStartEvent, this.removeHelper, this);
            EventHandler.add(this.helper, Browser.touchStartEvent, this.resizeStart, this);
        } else {
            let args: ResizeArgs = {
                e: e,
                column: this.column
            };
            this.parent.trigger(events.resizeStart, args);
            if (args.cancel) {
                this.cancelResizeAction();
                return;
            }
            EventHandler.add(document, Browser.touchEndEvent, this.resizeEnd, this);
            EventHandler.add(this.parent.element, Browser.touchMoveEvent, this.resizing, this);
            this.updateCursor('add');
        }
    }

    private cancelResizeAction(removeEvents?: boolean): void {
        if (removeEvents) {
            EventHandler.remove(this.parent.element, Browser.touchMoveEvent, this.resizing);
            EventHandler.remove(document, Browser.touchEndEvent, this.resizeEnd);
            this.updateCursor('remove');
        }
        if (Browser.isDevice) {
            EventHandler.remove(document, Browser.touchStartEvent, this.removeHelper);
            EventHandler.remove(this.helper, Browser.touchStartEvent, this.resizeStart);
        }
        detach(this.helper);
        this.refresh();
    }

    private resizing(e: PointerEvent | TouchEvent): void {
        let pageX: number = this.getPointX(e);
        let mousemove: number = this.parent.enableRtl ? -(pageX - this.pageX) : (pageX - this.pageX);
        this.column.width = formatUnit(parseInt(this.widthService.getWidth(this.column).toString(), 10) + mousemove);
        this.pageX = pageX;
        let args: ResizeArgs = {
            e: e,
            column: this.column
        };
        this.parent.trigger(events.onResize, args);
        if (args.cancel) {
            this.cancelResizeAction(true);
            return;
        }
        this.updateColGroup(this.column);
        this.widthService.setColumnWidth(this.column, null, 'resize');
        this.updateHelper();
    }

    private resizeEnd(e: PointerEvent): void {
        if (!this.helper)  { return; }
        EventHandler.remove(this.parent.element, Browser.touchMoveEvent, this.resizing);
        EventHandler.remove(document, Browser.touchEndEvent, this.resizeEnd);
        this.updateCursor('remove');
        detach(this.helper);
        let args: ResizeArgs = {
            e: e,
            column: this.column
        };
        this.parent.trigger(events.resizeStop, args);
        this.refresh();
    }

    private getPointX(e: PointerEvent | TouchEvent): number {
        if ((e as TouchEvent).touches && (e as TouchEvent).touches.length) {
            return (e as TouchEvent).touches[0].pageX;
        } else {
            return (e as PointerEvent).pageX;
        }
    }

    private updateColGroup(column: Column): void {
        for (let col of this.parent.getColumns()) {
            if (col.uid === column.uid) {
                col.width = column.width;
                break;
            }
        }
    }

    private getTargetColumn(e: PointerEvent | TouchEvent): Column {
        let cell: HTMLElement = < HTMLElement > closest( < HTMLElement > e.target, resizeClassList.header);
        let uid: string = cell.querySelector('.e-headercelldiv').getAttribute('e-mappinguid');
        return this.parent.getColumnByUid(uid);
    }

    private updateCursor(action: string): void {
        let headerRows: Element[] = [].slice.call(this.parent.getHeaderContent().querySelectorAll('th'));
        headerRows.push(this.parent.element);
        for (let row of headerRows) {
            row.classList[action](resizeClassList.cursor);
        }
    }

    private refresh(): void {
        this.column = null;
        this.pageX = null;
        this.element = null;
        this.helper = null;
    }

    private appendHelper(): void {
        this.helper = createElement('div', {
            className: resizeClassList.helper
        });
        this.parent.element.appendChild(this.helper);
        let height: number = ( < HTMLElement > this.parent.getContent()).offsetHeight - this.getScrollBarWidth();
        let rect: HTMLElement = closest(this.element, resizeClassList.header) as HTMLElement;
        let tr: HTMLElement[] = [].slice.call(this.parent.getHeaderTable().querySelectorAll('tr'));
        for (let i: number = tr.indexOf(rect.parentElement); i < tr.length; i++) {
            height += tr[i].offsetHeight;
        }
        let pos: OffsetPosition = this.calcPos(rect);
        pos.left += (this.parent.enableRtl ? 0 - 1 : rect.offsetWidth - 2);
        this.helper.style.cssText = 'height: ' + height + 'px; top: ' + pos.top + 'px; left:' + Math.floor(pos.left) + 'px;';
    }

    private getScrollBarWidth(): number {
        let ele: HTMLElement =  this.parent.getContent().firstChild as HTMLElement;
        return ele.scrollWidth > ele.clientWidth ? getScrollBarWidth() : 0;
    }

    private removeHelper(e: MouseEvent): void {
        let cls: DOMTokenList = (e.target as HTMLElement).classList;
        if (!(cls.contains(resizeClassList.root) || cls.contains(resizeClassList.icon)) && this.helper) {
            EventHandler.remove(document, Browser.touchStartEvent, this.removeHelper);
            EventHandler.remove(this.helper, Browser.touchStartEvent, this.resizeStart);
            detach(this.helper);
            this.refresh();
        }
    }

    private updateHelper(): void {
        let rect: HTMLElement = closest(this.element, resizeClassList.header) as HTMLElement;
        this.helper.style.left = Math.floor(this.calcPos(rect).left + (this.parent.enableRtl ? 0 - 1 : rect.offsetWidth - 2)) + 'px';
    }

    private calcPos(elem: HTMLElement): OffsetPosition {
        let parentOffset: OffsetPosition = {
            top: 0,
            left: 0
        };
        let offset: OffsetPosition = elem.getBoundingClientRect();
        let doc: Document = elem.ownerDocument;
        let offsetParent: Node = elem.offsetParent || doc.documentElement;
        while (offsetParent &&
            (offsetParent === doc.body || offsetParent === doc.documentElement) &&
            ( < HTMLElement > offsetParent).style.position === 'static' || '') {
            offsetParent = offsetParent.parentNode;
        }
        if (offsetParent && offsetParent !== elem && offsetParent.nodeType === 1) {
            parentOffset = ( < HTMLElement > offsetParent).getBoundingClientRect();
        }
        return {
            top: offset.top - parentOffset.top,
            left: offset.left - parentOffset.left
        };
    }
}