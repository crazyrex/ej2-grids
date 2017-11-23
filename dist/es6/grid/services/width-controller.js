import { isNullOrUndefined, select } from '@syncfusion/ej2-base';
import { formatUnit } from '@syncfusion/ej2-base';
import { columnWidthChanged } from '../base/constant';
import { Column } from '../models/column';
var ColumnWidthService = (function () {
    function ColumnWidthService(parent) {
        this.parent = parent;
    }
    ColumnWidthService.prototype.setWidthToColumns = function () {
        var _this = this;
        var i = 0;
        var indexes = this.parent.getColumnIndexesInView();
        var wFlag = true;
        if (this.parent.allowGrouping) {
            for (var len = this.parent.groupSettings.columns.length; i < len; i++) {
                if (this.parent.enableColumnVirtualization && indexes.indexOf(i) === -1) {
                    wFlag = false;
                    continue;
                }
                this.setColumnWidth(new Column({ width: '30px' }), i);
            }
        }
        if (this.parent.detailTemplate || this.parent.childGrid) {
            this.setColumnWidth(new Column({ width: '30px' }), i);
        }
        this.parent.getColumns().forEach(function (column, index) {
            _this.setColumnWidth(column, wFlag ? undefined : index);
        });
    };
    ColumnWidthService.prototype.setColumnWidth = function (column, index, module) {
        var columnIndex = isNullOrUndefined(index) ? this.parent.getNormalizedColumnIndex(column.uid) : index;
        var cWidth = this.getWidth(column);
        if (cWidth !== null) {
            this.setWidth(cWidth, columnIndex);
            if (this.parent.allowResizing && module === 'resize') {
                this.setWidthToTable();
            }
            this.parent.notify(columnWidthChanged, { index: columnIndex, width: cWidth, column: column, module: module });
        }
    };
    ColumnWidthService.prototype.setWidth = function (width, index) {
        var header = this.parent.getHeaderTable();
        var content = this.parent.getContentTable();
        var fWidth = formatUnit(width);
        var headerCol;
        var mHdr = this.parent.getHeaderContent().querySelector('.e-movableheader');
        if (this.parent.frozenColumns && index >= this.parent.frozenColumns && mHdr && mHdr.querySelector('colgroup')) {
            headerCol = mHdr.querySelector('colgroup').children[index - this.parent.frozenColumns];
        }
        else {
            headerCol = header.querySelector('colgroup').children[index];
        }
        if (headerCol) {
            headerCol.style.width = fWidth;
        }
        var contentCol;
        if (this.parent.frozenColumns && index >= this.parent.frozenColumns) {
            contentCol = this.parent.getContent().querySelector('.e-movablecontent')
                .querySelector('colgroup').children[index - this.parent.frozenColumns];
        }
        else {
            contentCol = content.querySelector('colgroup').children[index];
        }
        if (contentCol) {
            contentCol.style.width = fWidth;
        }
        var edit = content.querySelector('.e-table.e-inline-edit');
        if (edit) {
            edit.querySelector('colgroup').children[index].style.width = fWidth;
        }
    };
    ColumnWidthService.prototype.getSiblingsHeight = function (element) {
        var previous = this.getHeightFromDirection(element, 'previous');
        var next = this.getHeightFromDirection(element, 'next');
        return previous + next;
    };
    ColumnWidthService.prototype.getHeightFromDirection = function (element, direction) {
        var sibling = element[direction + 'ElementSibling'];
        var result = 0;
        while (sibling) {
            result += sibling.offsetHeight;
            sibling = sibling[direction + 'ElementSibling'];
        }
        return result;
    };
    ColumnWidthService.prototype.getWidth = function (column) {
        if (isNullOrUndefined(column.width) && this.parent.allowResizing) {
            column.width = 200;
        }
        if (!column.width) {
            return null;
        }
        var width = parseInt(column.width.toString(), 10);
        if (column.minWidth && width < parseInt(column.minWidth.toString(), 10)) {
            return column.minWidth;
        }
        else if ((column.maxWidth && width > parseInt(column.maxWidth.toString(), 10))) {
            return column.maxWidth;
        }
        else {
            return column.width;
        }
    };
    ColumnWidthService.prototype.getTableWidth = function (columns) {
        var tWidth = 0;
        for (var _i = 0, columns_1 = columns; _i < columns_1.length; _i++) {
            var column = columns_1[_i];
            var cWidth = this.getWidth(column);
            if (column.visible !== false && cWidth !== null) {
                tWidth += parseInt(cWidth.toString(), 10);
            }
        }
        return tWidth;
    };
    ColumnWidthService.prototype.setWidthToTable = function () {
        var tWidth = null;
        if (this.parent.frozenColumns) {
            var freezeWidth = 0;
            var colGrp = this.parent.getContentTable().querySelector('colgroup');
            var mColGrp = select('.e-movablecontent');
            for (var i = 0; i < this.parent.getHeaderTable().querySelector('.e-columnheader').children.length; i++) {
                freezeWidth += parseInt(colGrp.children[i].style.width, 10);
            }
            tWidth = formatUnit(freezeWidth);
            this.parent.getHeaderTable().style.width = tWidth;
            this.parent.getContentTable().style.width = tWidth;
            freezeWidth = 0;
            for (var i = 0; i < select('.e-movableheader').querySelector('.e-columnheader').children.length; i++) {
                freezeWidth += parseInt(mColGrp.children[0].querySelector('colgroup').children[i].style.width, 10);
            }
            tWidth = formatUnit(freezeWidth);
            select('.e-movableheader').firstElementChild.style.width = tWidth;
            select('.e-movablecontent').firstElementChild.style.width = tWidth;
        }
        else {
            tWidth = formatUnit(this.getTableWidth(this.parent.getColumns()));
            this.parent.getHeaderTable().style.width = tWidth;
            this.parent.getContentTable().style.width = tWidth;
        }
        var edit = this.parent.element.querySelector('.e-table.e-inline-edit');
        if (edit) {
            edit.style.width = tWidth;
        }
    };
    return ColumnWidthService;
}());
export { ColumnWidthService };