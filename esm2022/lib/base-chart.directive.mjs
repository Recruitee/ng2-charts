import { Directive, Input, Output, EventEmitter, ElementRef, } from '@angular/core';
import * as chartJs from 'chart.js';
import { getColors } from './get-colors';
import { ThemeService } from './theme.service';
import * as _ from 'lodash';
import * as i0 from "@angular/core";
import * as i1 from "./theme.service";
var UpdateType;
(function (UpdateType) {
    UpdateType[UpdateType["Default"] = 0] = "Default";
    UpdateType[UpdateType["Update"] = 1] = "Update";
    UpdateType[UpdateType["Refresh"] = 2] = "Refresh";
})(UpdateType || (UpdateType = {}));
class BaseChartDirective {
    element;
    themeService;
    data;
    datasets;
    labels;
    options = {};
    chartType;
    colors;
    legend;
    plugins;
    chartClick = new EventEmitter();
    chartHover = new EventEmitter();
    ctx;
    chart;
    old = {
        dataExists: false,
        dataLength: 0,
        datasetsExists: false,
        datasetsLength: 0,
        datasetsDataObjects: [],
        datasetsDataLengths: [],
        colorsExists: false,
        colors: [],
        labelsExist: false,
        labels: [],
    };
    subs = [];
    /**
     * Register a plugin.
     */
    static registerPlugin(plugin) {
        chartJs.Chart.plugins.register(plugin);
    }
    static unregisterPlugin(plugin) {
        chartJs.Chart.plugins.unregister(plugin);
    }
    constructor(element, themeService) {
        this.element = element;
        this.themeService = themeService;
    }
    ngOnInit() {
        this.ctx = this.element.nativeElement.getContext('2d');
        this.refresh();
        this.subs.push(this.themeService.colorschemesOptions.subscribe(r => this.themeChanged(r)));
    }
    themeChanged(options) {
        this.refresh();
    }
    ngDoCheck() {
        if (!this.chart) {
            return;
        }
        let updateRequired = UpdateType.Default;
        const wantUpdate = (x) => {
            updateRequired = x > updateRequired ? x : updateRequired;
        };
        if (!!this.data !== this.old.dataExists) {
            this.propagateDataToDatasets(this.data);
            this.old.dataExists = !!this.data;
            wantUpdate(UpdateType.Update);
        }
        if (this.data && this.data.length !== this.old.dataLength) {
            this.old.dataLength = this.data && this.data.length || 0;
            wantUpdate(UpdateType.Update);
        }
        if (!!this.datasets !== this.old.datasetsExists) {
            this.old.datasetsExists = !!this.datasets;
            wantUpdate(UpdateType.Update);
        }
        if (this.datasets && this.datasets.length !== this.old.datasetsLength) {
            this.old.datasetsLength = this.datasets && this.datasets.length || 0;
            wantUpdate(UpdateType.Update);
        }
        if (this.datasets && this.datasets.filter((x, i) => x.data !== this.old.datasetsDataObjects[i]).length) {
            this.old.datasetsDataObjects = this.datasets.map(x => x.data);
            wantUpdate(UpdateType.Update);
        }
        if (this.datasets && this.datasets.filter((x, i) => x.data.length !== this.old.datasetsDataLengths[i]).length) {
            this.old.datasetsDataLengths = this.datasets.map(x => x.data.length);
            wantUpdate(UpdateType.Update);
        }
        if (!!this.colors !== this.old.colorsExists) {
            this.old.colorsExists = !!this.colors;
            this.updateColors();
            wantUpdate(UpdateType.Update);
        }
        // This smells of inefficiency, might need to revisit this
        if (this.colors && this.colors.filter((x, i) => !this.colorsEqual(x, this.old.colors[i])).length) {
            this.old.colors = this.colors.map(x => this.copyColor(x));
            this.updateColors();
            wantUpdate(UpdateType.Update);
        }
        if (!!this.labels !== this.old.labelsExist) {
            this.old.labelsExist = !!this.labels;
            wantUpdate(UpdateType.Update);
        }
        if (this.labels && this.labels.filter((x, i) => !this.labelsEqual(x, this.old.labels[i])).length) {
            this.old.labels = this.labels.map(x => this.copyLabel(x));
            wantUpdate(UpdateType.Update);
        }
        switch (updateRequired) {
            case UpdateType.Default:
                break;
            case UpdateType.Update:
                this.update();
                break;
            case UpdateType.Refresh:
                this.refresh();
                break;
        }
    }
    copyLabel(a) {
        if (Array.isArray(a)) {
            return [...a];
        }
        return a;
    }
    labelsEqual(a, b) {
        return true
            && Array.isArray(a) === Array.isArray(b)
            && (Array.isArray(a) || a === b)
            && (!Array.isArray(a) || a.length === b.length)
            && (!Array.isArray(a) || a.filter((x, i) => x !== b[i]).length === 0);
    }
    copyColor(a) {
        const rc = {
            backgroundColor: a.backgroundColor,
            borderWidth: a.borderWidth,
            borderColor: a.borderColor,
            borderCapStyle: a.borderCapStyle,
            borderDash: a.borderDash,
            borderDashOffset: a.borderDashOffset,
            borderJoinStyle: a.borderJoinStyle,
            pointBorderColor: a.pointBorderColor,
            pointBackgroundColor: a.pointBackgroundColor,
            pointBorderWidth: a.pointBorderWidth,
            pointRadius: a.pointRadius,
            pointHoverRadius: a.pointHoverRadius,
            pointHitRadius: a.pointHitRadius,
            pointHoverBackgroundColor: a.pointHoverBackgroundColor,
            pointHoverBorderColor: a.pointHoverBorderColor,
            pointHoverBorderWidth: a.pointHoverBorderWidth,
            pointStyle: a.pointStyle,
            hoverBackgroundColor: a.hoverBackgroundColor,
            hoverBorderColor: a.hoverBorderColor,
            hoverBorderWidth: a.hoverBorderWidth,
        };
        return rc;
    }
    colorsEqual(a, b) {
        if (!a !== !b) {
            return false;
        }
        return !a || true
            && (a.backgroundColor === b.backgroundColor)
            && (a.borderWidth === b.borderWidth)
            && (a.borderColor === b.borderColor)
            && (a.borderCapStyle === b.borderCapStyle)
            && (a.borderDash === b.borderDash)
            && (a.borderDashOffset === b.borderDashOffset)
            && (a.borderJoinStyle === b.borderJoinStyle)
            && (a.pointBorderColor === b.pointBorderColor)
            && (a.pointBackgroundColor === b.pointBackgroundColor)
            && (a.pointBorderWidth === b.pointBorderWidth)
            && (a.pointRadius === b.pointRadius)
            && (a.pointHoverRadius === b.pointHoverRadius)
            && (a.pointHitRadius === b.pointHitRadius)
            && (a.pointHoverBackgroundColor === b.pointHoverBackgroundColor)
            && (a.pointHoverBorderColor === b.pointHoverBorderColor)
            && (a.pointHoverBorderWidth === b.pointHoverBorderWidth)
            && (a.pointStyle === b.pointStyle)
            && (a.hoverBackgroundColor === b.hoverBackgroundColor)
            && (a.hoverBorderColor === b.hoverBorderColor)
            && (a.hoverBorderWidth === b.hoverBorderWidth);
    }
    updateColors() {
        this.datasets.forEach((elm, index) => {
            if (this.colors && this.colors[index]) {
                Object.assign(elm, this.colors[index]);
            }
            else {
                Object.assign(elm, getColors(this.chartType, index, elm.data.length), { ...elm });
            }
        });
    }
    ngOnChanges(changes) {
        let updateRequired = UpdateType.Default;
        const wantUpdate = (x) => {
            updateRequired = x > updateRequired ? x : updateRequired;
        };
        // Check if the changes are in the data or datasets or labels or legend
        if (changes.hasOwnProperty('data') && changes.data.currentValue) {
            this.propagateDataToDatasets(changes.data.currentValue);
            wantUpdate(UpdateType.Update);
        }
        if (changes.hasOwnProperty('datasets') && changes.datasets.currentValue) {
            this.propagateDatasetsToData(changes.datasets.currentValue);
            wantUpdate(UpdateType.Update);
        }
        if (changes.hasOwnProperty('labels')) {
            if (this.chart) {
                this.chart.data.labels = changes.labels.currentValue;
            }
            wantUpdate(UpdateType.Update);
        }
        if (changes.hasOwnProperty('legend')) {
            if (this.chart) {
                this.chart.config.options.legend.display = changes.legend.currentValue;
                this.chart.generateLegend();
            }
            wantUpdate(UpdateType.Update);
        }
        if (changes.hasOwnProperty('options')) {
            wantUpdate(UpdateType.Refresh);
        }
        switch (updateRequired) {
            case UpdateType.Update:
                this.update();
                break;
            case UpdateType.Refresh:
            case UpdateType.Default:
                this.refresh();
                break;
        }
    }
    ngOnDestroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = void 0;
        }
        this.subs.forEach(x => x.unsubscribe());
    }
    update(duration, lazy) {
        if (this.chart) {
            return this.chart.update(duration, lazy);
        }
    }
    hideDataset(index, hidden) {
        this.chart.getDatasetMeta(index).hidden = hidden;
        this.chart.update();
    }
    isDatasetHidden(index) {
        return this.chart.getDatasetMeta(index).hidden;
    }
    toBase64Image() {
        return this.chart.toBase64Image();
    }
    getChartConfiguration() {
        const datasets = this.getDatasets();
        const options = Object.assign({}, this.options);
        if (this.legend === false) {
            options.legend = { display: false };
        }
        // hook for onHover and onClick events
        options.hover = options.hover || {};
        if (!options.hover.onHover) {
            options.hover.onHover = (event, active) => {
                if (active && !active.length) {
                    return;
                }
                this.chartHover.emit({ event, active });
            };
        }
        if (!options.onClick) {
            options.onClick = (event, active) => {
                this.chartClick.emit({ event, active });
            };
        }
        const mergedOptions = this.smartMerge(options, this.themeService.getColorschemesOptions());
        const chartConfig = {
            type: this.chartType,
            data: {
                labels: this.labels || [],
                datasets
            },
            plugins: this.plugins,
            options: mergedOptions,
        };
        return chartConfig;
    }
    getChartBuilder(ctx /*, data:any[], options:any*/) {
        const chartConfig = this.getChartConfiguration();
        return new chartJs.Chart(ctx, chartConfig);
    }
    smartMerge(options, overrides, level = 0) {
        if (level === 0) {
            options = _.cloneDeep(options);
        }
        const keysToUpdate = Object.keys(overrides);
        keysToUpdate.forEach(key => {
            if (Array.isArray(overrides[key])) {
                const arrayElements = options[key];
                if (arrayElements) {
                    arrayElements.forEach(r => {
                        this.smartMerge(r, overrides[key][0], level + 1);
                    });
                }
            }
            else if (typeof (overrides[key]) === 'object') {
                if (!(key in options)) {
                    options[key] = {};
                }
                this.smartMerge(options[key], overrides[key], level + 1);
            }
            else {
                options[key] = overrides[key];
            }
        });
        if (level === 0) {
            return options;
        }
    }
    isMultiLineLabel(label) {
        return Array.isArray(label);
    }
    joinLabel(label) {
        if (!label) {
            return null;
        }
        if (this.isMultiLineLabel(label)) {
            return label.join(' ');
        }
        else {
            return label;
        }
    }
    propagateDatasetsToData(datasets) {
        this.data = this.datasets.map(r => r.data);
        if (this.chart) {
            this.chart.data.datasets = datasets;
        }
        this.updateColors();
    }
    propagateDataToDatasets(newDataValues) {
        if (this.isMultiDataSet(newDataValues)) {
            if (this.datasets && newDataValues.length === this.datasets.length) {
                this.datasets.forEach((dataset, i) => {
                    dataset.data = newDataValues[i];
                });
            }
            else {
                this.datasets = newDataValues.map((data, index) => {
                    return { data, label: this.joinLabel(this.labels[index]) || `Label ${index}` };
                });
                if (this.chart) {
                    this.chart.data.datasets = this.datasets;
                }
            }
        }
        else {
            if (!this.datasets) {
                this.datasets = [{ data: newDataValues }];
                if (this.chart) {
                    this.chart.data.datasets = this.datasets;
                }
            }
            else {
                this.datasets[0].data = newDataValues;
                this.datasets.splice(1); // Remove all elements but the first
            }
        }
        this.updateColors();
    }
    isMultiDataSet(data) {
        return Array.isArray(data[0]);
    }
    getDatasets() {
        if (!this.datasets && !this.data) {
            throw new Error(`ng-charts configuration error, data or datasets field are required to render chart ${this.chartType}`);
        }
        // If `datasets` is defined, use it over the `data` property.
        if (this.datasets) {
            this.propagateDatasetsToData(this.datasets);
            return this.datasets;
        }
        if (this.data) {
            this.propagateDataToDatasets(this.data);
            return this.datasets;
        }
    }
    refresh() {
        // if (this.options && this.options.responsive) {
        //   setTimeout(() => this.refresh(), 50);
        // }
        // todo: remove this line, it is producing flickering
        if (this.chart) {
            this.chart.destroy();
            this.chart = void 0;
        }
        if (this.ctx) {
            this.chart = this.getChartBuilder(this.ctx /*, data, this.options*/);
        }
    }
    /** @nocollapse */ static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: BaseChartDirective, deps: [{ token: i0.ElementRef }, { token: i1.ThemeService }], target: i0.ɵɵFactoryTarget.Directive });
    /** @nocollapse */ static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.1", type: BaseChartDirective, selector: "canvas[baseChart]", inputs: { data: "data", datasets: "datasets", labels: "labels", options: "options", chartType: "chartType", colors: "colors", legend: "legend", plugins: "plugins" }, outputs: { chartClick: "chartClick", chartHover: "chartHover" }, exportAs: ["base-chart"], usesOnChanges: true, ngImport: i0 });
}
export { BaseChartDirective };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: BaseChartDirective, decorators: [{
            type: Directive,
            args: [{
                    // tslint:disable-next-line:directive-selector
                    selector: 'canvas[baseChart]',
                    exportAs: 'base-chart'
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i1.ThemeService }]; }, propDecorators: { data: [{
                type: Input
            }], datasets: [{
                type: Input
            }], labels: [{
                type: Input
            }], options: [{
                type: Input
            }], chartType: [{
                type: Input
            }], colors: [{
                type: Input
            }], legend: [{
                type: Input
            }], plugins: [{
                type: Input
            }], chartClick: [{
                type: Output
            }], chartHover: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS1jaGFydC5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZzItY2hhcnRzL3NyYy9saWIvYmFzZS1jaGFydC5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLFNBQVMsRUFJVCxLQUFLLEVBQ0wsTUFBTSxFQUNOLFlBQVksRUFDWixVQUFVLEdBR1gsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxLQUFLLE9BQU8sTUFBTSxVQUFVLENBQUM7QUFDcEMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUV6QyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFL0MsT0FBTyxLQUFLLENBQUMsTUFBTSxRQUFRLENBQUM7OztBQXdCNUIsSUFBSyxVQUlKO0FBSkQsV0FBSyxVQUFVO0lBQ2IsaURBQU8sQ0FBQTtJQUNQLCtDQUFNLENBQUE7SUFDTixpREFBTyxDQUFBO0FBQ1QsQ0FBQyxFQUpJLFVBQVUsS0FBVixVQUFVLFFBSWQ7QUFFRCxNQUthLGtCQUFrQjtJQTJDbkI7SUFDQTtJQTNDTSxJQUFJLENBQXVCO0lBQzNCLFFBQVEsQ0FBMEI7SUFDbEMsTUFBTSxDQUFVO0lBQ2hCLE9BQU8sR0FBeUIsRUFBRSxDQUFDO0lBQ25DLFNBQVMsQ0FBb0I7SUFDN0IsTUFBTSxDQUFVO0lBQ2hCLE1BQU0sQ0FBVTtJQUNoQixPQUFPLENBQThDO0lBRXBELFVBQVUsR0FBd0QsSUFBSSxZQUFZLEVBQUUsQ0FBQztJQUNyRixVQUFVLEdBQXNELElBQUksWUFBWSxFQUFFLENBQUM7SUFFN0YsR0FBRyxDQUFTO0lBQ1osS0FBSyxDQUFRO0lBRVosR0FBRyxHQUFhO1FBQ3RCLFVBQVUsRUFBRSxLQUFLO1FBQ2pCLFVBQVUsRUFBRSxDQUFDO1FBQ2IsY0FBYyxFQUFFLEtBQUs7UUFDckIsY0FBYyxFQUFFLENBQUM7UUFDakIsbUJB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Q0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUM7WUFFckUsVUFBVSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUMvQjtRQUVELElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRTtZQUN0RyxJQUFJLENBQUMsR0FBRyxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRTlELFVBQVUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDL0I7UUFFRCxJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxFQUFFO1lBQzdHLElBQUksQ0FBQyxHQUFHLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRXJFLFVBQVUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDL0I7UUFFRCxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFO1lBQzNDLElBQUksQ0FBQyxHQUFHLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBRXRDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUVwQixVQUFVLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQy9CO1FBRUQsMERBQTBEO1FBQzFELElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRTtZQUNoRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUxRCxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFFcEIsVUFBVSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUMvQjtRQUVELElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUU7WUFDMUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7WUFFckMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUMvQjtRQUVELElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMs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LENBQUEsd0JBQXdCLENBQUMsQ0FBQztTQUNyRTtJQUNILENBQUM7MEhBN2NVLGtCQUFrQjs4R0FBbEIsa0JBQWtCOztTQUFsQixrQkFBa0I7MkZBQWxCLGtCQUFrQjtrQkFMOUIsU0FBUzttQkFBQztvQkFDVCw4Q0FBOEM7b0JBQzlDLFFBQVEsRUFBRSxtQkFBbUI7b0JBQzdCLFFBQVEsRUFBRSxZQUFZO2lCQUN2Qjs0SEFFaUIsSUFBSTtzQkFBbkIsS0FBSztnQkFDVSxRQUFRO3NCQUF2QixLQUFLO2dCQUNVLE1BQU07c0JBQXJCLEtBQUs7Z0JBQ1UsT0FBTztzQkFBdEIsS0FBSztnQkFDVSxTQUFTO3NCQUF4QixLQUFLO2dCQUNVLE1BQU07c0JBQXJCLEtBQUs7Z0JBQ1UsTUFBTTtzQkFBckIsS0FBSztnQkFDVSxPQUFPO3NCQUF0QixLQUFLO2dCQUVXLFVBQVU7c0JBQTFCLE1BQU07Z0JBQ1UsVUFBVTtzQkFBMUIsTUFBTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIERpcmVjdGl2ZSxcbiAgT25EZXN0cm95LFxuICBPbkNoYW5nZXMsXG4gIE9uSW5pdCxcbiAgSW5wdXQsXG4gIE91dHB1dCxcbiAgRXZlbnRFbWl0dGVyLFxuICBFbGVtZW50UmVmLFxuICBTaW1wbGVDaGFuZ2VzLFxuICBEb0NoZWNrLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCAqIGFzIGNoYXJ0SnMgZnJvbSAnY2hhcnQuanMnO1xuaW1wb3J0IHsgZ2V0Q29sb3JzIH0gZnJvbSAnLi9nZXQtY29sb3JzJztcbmltcG9ydCB7IENvbG9yIH0gZnJvbSAnLi9jb2xvcic7XG5pbXBvcnQgeyBUaGVtZVNlcnZpY2UgfSBmcm9tICcuL3RoZW1lLnNlcnZpY2UnO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5cbmV4cG9ydCB0eXBlIFNpbmdsZURhdGFTZXQgPSAobnVtYmVyW10gfCBjaGFydEpzLkNoYXJ0UG9pbnRbXSk7XG5leHBvcnQgdHlwZSBNdWx0aURhdGFTZXQgPSAobnVtYmVyW10gfCBjaGFydEpzLkNoYXJ0UG9pbnRbXSlbXTtcbmV4cG9ydCB0eXBlIFNpbmdsZU9yTXVsdGlEYXRhU2V0ID0gU2luZ2xlRGF0YVNldCB8IE11bHRpRGF0YVNldDtcblxuZXhwb3J0IHR5cGUgUGx1Z2luU2VydmljZUdsb2JhbFJlZ2lzdHJhdGlvbkFuZE9wdGlvbnMgPSBjaGFydEpzLlBsdWdpblNlcnZpY2VHbG9iYWxSZWdpc3RyYXRpb24gJiBjaGFydEpzLlBsdWdpblNlcnZpY2VSZWdpc3RyYXRpb25PcHRpb25zO1xuZXhwb3J0IHR5cGUgU2luZ2xlTGluZUxhYmVsID0gc3RyaW5nO1xuZXhwb3J0IHR5cGUgTXVsdGlMaW5lTGFiZWwgPSBzdHJpbmdbXTtcbmV4cG9ydCB0eXBlIExhYmVsID0gU2luZ2xlTGluZUxhYmVsIHwgTXVsdGlMaW5lTGFiZWw7XG5cbmludGVyZmFjZSBPbGRTdGF0ZSB7XG4gIGRhdGFFeGlzdHM6IGJvb2xlYW47XG4gIGRhdGFMZW5ndGg6IG51bWJlcjtcbiAgZGF0YXNldHNFeGlzdHM6IGJvb2xlYW47XG4gIGRhdGFzZXRzTGVuZ3RoOiBudW1iZXI7XG4gIGRhdGFzZXRzRGF0YU9iamVjdHM6IGFueVtdO1xuICBkYXRhc2V0c0RhdGFMZW5ndGhzOiBudW1iZXJbXTtcbiAgY29sb3JzRXhpc3RzOiBib29sZWFuO1xuICBjb2xvcnM6IENvbG9yW107XG4gIGxhYmVsc0V4aXN0OiBib29sZWFuO1xuICBsYWJlbHM6IExhYmVsW107XG59XG5cbmVudW0gVXBkYXRlVHlwZSB7XG4gIERlZmF1bHQsXG4gIFVwZGF0ZSxcbiAgUmVmcmVzaFxufVxuXG5ARGlyZWN0aXZlKHtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOmRpcmVjdGl2ZS1zZWxlY3RvclxuICBzZWxlY3RvcjogJ2NhbnZhc1tiYXNlQ2hhcnRdJyxcbiAgZXhwb3J0QXM6ICdiYXNlLWNoYXJ0J1xufSlcbmV4cG9ydCBjbGFzcyBCYXNlQ2hhcnREaXJlY3RpdmUgaW1wbGVtZW50cyBPbkRlc3Ryb3ksIE9uQ2hhbmdlcywgT25Jbml0LCBPbkRlc3Ryb3ksIERvQ2hlY2sge1xuICBASW5wdXQoKSBwdWJsaWMgZGF0YTogU2luZ2xlT3JNdWx0aURhdGFTZXQ7XG4gIEBJbnB1dCgpIHB1YmxpYyBkYXRhc2V0czogY2hhcnRKcy5DaGFydERhdGFTZXRzW107XG4gIEBJbnB1dCgpIHB1YmxpYyBsYWJlbHM6IExhYmVsW107XG4gIEBJbnB1dCgpIHB1YmxpYyBvcHRpb25zOiBjaGFydEpzLkNoYXJ0T3B0aW9ucyA9IHt9O1xuICBASW5wdXQoKSBwdWJsaWMgY2hhcnRUeXBlOiBjaGFydEpzLkNoYXJ0VHlwZTtcbiAgQElucHV0KCkgcHVibGljIGNvbG9yczogQ29sb3JbXTtcbiAgQElucHV0KCkgcHVibGljIGxlZ2VuZDogYm9vbGVhbjtcbiAgQElucHV0KCkgcHVibGljIHBsdWdpbnM6IFBsdWdpblNlcnZpY2VHbG9iYWxSZWdpc3RyYXRpb25BbmRPcHRpb25zW107XG5cbiAgQE91dHB1dCgpIHB1YmxpYyBjaGFydENsaWNrOiBFdmVudEVtaXR0ZXI8eyBldmVudD86IE1vdXNlRXZlbnQsIGFjdGl2ZT86IHt9W10gfT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIEBPdXRwdXQoKSBwdWJsaWMgY2hhcnRIb3ZlcjogRXZlbnRFbWl0dGVyPHsgZXZlbnQ6IE1vdXNlRXZlbnQsIGFjdGl2ZToge31bXSB9PiA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICBwdWJsaWMgY3R4OiBzdHJpbmc7XG4gIHB1YmxpYyBjaGFydDogQ2hhcnQ7XG5cbiAgcHJpdmF0ZSBvbGQ6IE9sZFN0YXRlID0ge1xuICAgIGRhdGFFeGlzdHM6IGZhbHNlLFxuICAgIGRhdGFMZW5ndGg6IDAsXG4gICAgZGF0YXNldHNFeGlzdHM6IGZhbHNlLFxuICAgIGRhdGFzZXRzTGVuZ3RoOiAwLFxuICAgIGRhdGFzZXRzRGF0YU9iamVjdHM6IFtdLFxuICAgIGRhdGFzZXRzRGF0YUxlbmd0aHM6IFtdLFxuICAgIGNvbG9yc0V4aXN0czogZmFsc2UsXG4gICAgY29sb3JzOiBbXSxcbiAgICBsYWJlbHNFeGlzdDogZmFsc2UsXG4gICAgbGFiZWxzOiBbXSxcbiAgfTtcblxuICBwcml2YXRlIHN1YnM6IFN1YnNjcmlwdGlvbltdID0gW107XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgcGx1Z2luLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyByZWdpc3RlclBsdWdpbihwbHVnaW46IFBsdWdpblNlcnZpY2VHbG9iYWxSZWdpc3RyYXRpb25BbmRPcHRpb25zKSB7XG4gICAgY2hhcnRKcy5DaGFydC5wbHVnaW5zLnJlZ2lzdGVyKHBsdWdpbik7XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIHVucmVnaXN0ZXJQbHVnaW4ocGx1Z2luOiBQbHVnaW5TZXJ2aWNlR2xvYmFsUmVnaXN0cmF0aW9uQW5kT3B0aW9ucykge1xuICAgIGNoYXJ0SnMuQ2hhcnQucGx1Z2lucy51bnJlZ2lzdGVyKHBsdWdpbik7XG4gIH1cblxuICBwdWJsaWMgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBlbGVtZW50OiBFbGVtZW50UmVmLFxuICAgIHByaXZhdGUgdGhlbWVTZXJ2aWNlOiBUaGVtZVNlcnZpY2UsXG4gICkgeyB9XG5cbiAgcHVibGljIG5nT25Jbml0KCkge1xuICAgIHRoaXMuY3R4ID0gdGhpcy5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB0aGlzLnJlZnJlc2goKTtcbiAgICB0aGlzLnN1YnMucHVzaCh0aGlzLnRoZW1lU2VydmljZS5jb2xvcnNjaGVtZXNPcHRpb25zLnN1YnNjcmliZShyID0+IHRoaXMudGhlbWVDaGFuZ2VkKHIpKSk7XG4gIH1cblxuICBwcml2YXRlIHRoZW1lQ2hhbmdlZChvcHRpb25zOiB7fSkge1xuICAgIHRoaXMucmVmcmVzaCgpO1xuICB9XG5cbiAgbmdEb0NoZWNrKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jaGFydCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgdXBkYXRlUmVxdWlyZWQgPSBVcGRhdGVUeXBlLkRlZmF1bHQ7XG4gICAgY29uc3Qgd2FudFVwZGF0ZSA9ICh4OiBVcGRhdGVUeXBlKSA9PiB7XG4gICAgICB1cGRhdGVSZXF1aXJlZCA9IHggPiB1cGRhdGVSZXF1aXJlZCA/IHggOiB1cGRhdGVSZXF1aXJlZDtcbiAgICB9O1xuXG4gICAgaWYgKCEhdGhpcy5kYXRhICE9PSB0aGlzLm9sZC5kYXRhRXhpc3RzKSB7XG4gICAgICB0aGlzLnByb3BhZ2F0ZURhdGFUb0RhdGFzZXRzKHRoaXMuZGF0YSk7XG5cbiAgICAgIHRoaXMub2xkLmRhdGFFeGlzdHMgPSAhIXRoaXMuZGF0YTtcblxuICAgICAgd2FudFVwZGF0ZShVcGRhdGVUeXBlLlVwZGF0ZSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZGF0YSAmJiB0aGlzLmRhdGEubGVuZ3RoICE9PSB0aGlzLm9sZC5kYXRhTGVuZ3RoKSB7XG4gICAgICB0aGlzLm9sZC5kYXRhTGVuZ3RoID0gdGhpcy5kYXRhICYmIHRoaXMuZGF0YS5sZW5ndGggfHwgMDtcblxuICAgICAgd2FudFVwZGF0ZShVcGRhdGVUeXBlLlVwZGF0ZSk7XG4gICAgfVxuXG4gICAgaWYgKCEhdGhpcy5kYXRhc2V0cyAhPT0gdGhpcy5vbGQuZGF0YXNldHNFeGlzdHMpIHtcbiAgICAgIHRoaXMub2xkLmRhdGFzZXRzRXhpc3RzID0gISF0aGlzLmRhdGFzZXRzO1xuXG4gICAgICB3YW50VXBkYXRlKFVwZGF0ZVR5cGUuVXBkYXRlKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5kYXRhc2V0cyAmJiB0aGlzLmRhdGFzZXRzLmxlbmd0aCAhPT0gdGhpcy5vbGQuZGF0YXNldHNMZW5ndGgpIHtcbiAgICAgIHRoaXMub2xkLmRhdGFzZXRzTGVuZ3RoID0gdGhpcy5kYXRhc2V0cyAmJiB0aGlzLmRhdGFzZXRzLmxlbmd0aCB8fCAwO1xuXG4gICAgICB3YW50VXBkYXRlKFVwZGF0ZVR5cGUuVXBkYXRlKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5kYXRhc2V0cyAmJiB0aGlzLmRhdGFzZXRzLmZpbHRlcigoeCwgaSkgPT4geC5kYXRhICE9PSB0aGlzLm9sZC5kYXRhc2V0c0RhdGFPYmplY3RzW2ldKS5sZW5ndGgpIHtcbiAgICAgIHRoaXMub2xkLmRhdGFzZXRzRGF0YU9iamVjdHMgPSB0aGlzLmRhdGFzZXRzLm1hcCh4ID0+IHguZGF0YSk7XG5cbiAgICAgIHdhbnRVcGRhdGUoVXBkYXRlVHlwZS5VcGRhdGUpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmRhdGFzZXRzICYmIHRoaXMuZGF0YXNldHMuZmlsdGVyKCh4LCBpKSA9PiB4LmRhdGEubGVuZ3RoICE9PSB0aGlzLm9sZC5kYXRhc2V0c0RhdGFMZW5ndGhzW2ldKS5sZW5ndGgpIHtcbiAgICAgIHRoaXMub2xkLmRhdGFzZXRzRGF0YUxlbmd0aHMgPSB0aGlzLmRhdGFzZXRzLm1hcCh4ID0+IHguZGF0YS5sZW5ndGgpO1xuXG4gICAgICB3YW50VXBkYXRlKFVwZGF0ZVR5cGUuVXBkYXRlKTtcbiAgICB9XG5cbiAgICBpZiAoISF0aGlzLmNvbG9ycyAhPT0gdGhpcy5vbGQuY29sb3JzRXhpc3RzKSB7XG4gICAgICB0aGlzLm9sZC5jb2xvcnNFeGlzdHMgPSAhIXRoaXMuY29sb3JzO1xuXG4gICAgICB0aGlzLnVwZGF0ZUNvbG9ycygpO1xuXG4gICAgICB3YW50VXBkYXRlKFVwZGF0ZVR5cGUuVXBkYXRlKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIHNtZWxscyBvZiBpbmVmZmljaWVuY3ksIG1pZ2h0IG5lZWQgdG8gcmV2aXNpdCB0aGlzXG4gICAgaWYgKHRoaXMuY29sb3JzICYmIHRoaXMuY29sb3JzLmZpbHRlcigoeCwgaSkgPT4gIXRoaXMuY29sb3JzRXF1YWwoeCwgdGhpcy5vbGQuY29sb3JzW2ldKSkubGVuZ3RoKSB7XG4gICAgICB0aGlzLm9sZC5jb2xvcnMgPSB0aGlzLmNvbG9ycy5tYXAoeCA9PiB0aGlzLmNvcHlDb2xvcih4KSk7XG5cbiAgICAgIHRoaXMudXBkYXRlQ29sb3JzKCk7XG5cbiAgICAgIHdhbnRVcGRhdGUoVXBkYXRlVHlwZS5VcGRhdGUpO1xuICAgIH1cblxuICAgIGlmICghIXRoaXMubGFiZWxzICE9PSB0aGlzLm9sZC5sYWJlbHNFeGlzdCkge1xuICAgICAgdGhpcy5vbGQubGFiZWxzRXhpc3QgPSAhIXRoaXMubGFiZWxzO1xuXG4gICAgICB3YW50VXBkYXRlKFVwZGF0ZVR5cGUuVXBkYXRlKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5sYWJlbHMgJiYgdGhpcy5sYWJlbHMuZmlsdGVyKCh4LCBpKSA9PiAhdGhpcy5sYWJlbHNFcXVhbCh4LCB0aGlzLm9sZC5sYWJlbHNbaV0pKS5sZW5ndGgpIHtcbiAgICAgIHRoaXMub2xkLmxhYmVscyA9IHRoaXMubGFiZWxzLm1hcCh4ID0+IHRoaXMuY29weUxhYmVsKHgpKTtcblxuICAgICAgd2FudFVwZGF0ZShVcGRhdGVUeXBlLlVwZGF0ZSk7XG4gICAgfVxuXG4gICAgc3dpdGNoICh1cGRhdGVSZXF1aXJlZCBhcyBVcGRhdGVUeXBlKSB7XG4gICAgICBjYXNlIFVwZGF0ZVR5cGUuRGVmYXVsdDpcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFVwZGF0ZVR5cGUuVXBkYXRlOlxuICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVXBkYXRlVHlwZS5SZWZyZXNoOlxuICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgY29weUxhYmVsKGE6IExhYmVsKTogTGFiZWwge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGEpKSB7XG4gICAgICByZXR1cm4gWy4uLmFdO1xuICAgIH1cbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIGxhYmVsc0VxdWFsKGE6IExhYmVsLCBiOiBMYWJlbCkge1xuICAgIHJldHVybiB0cnVlXG4gICAgICAmJiBBcnJheS5pc0FycmF5KGEpID09PSBBcnJheS5pc0FycmF5KGIpXG4gICAgICAmJiAoQXJyYXkuaXNBcnJheShhKSB8fCBhID09PSBiKVxuICAgICAgJiYgKCFBcnJheS5pc0FycmF5KGEpIHx8IGEubGVuZ3RoID09PSBiLmxlbmd0aClcbiAgICAgICYmICghQXJyYXkuaXNBcnJheShhKSB8fCBhLmZpbHRlcigoeCwgaSkgPT4geCAhPT0gYltpXSkubGVuZ3RoID09PSAwKVxuICAgICAgO1xuICB9XG5cbiAgY29weUNvbG9yKGE6IENvbG9yKTogQ29sb3Ige1xuICAgIGNvbnN0IHJjOiBDb2xvciA9IHtcbiAgICAgIGJhY2tncm91bmRDb2xvcjogYS5iYWNrZ3JvdW5kQ29sb3IsXG4gICAgICBib3JkZXJXaWR0aDogYS5ib3JkZXJXaWR0aCxcbiAgICAgIGJvcmRlckNvbG9yOiBhLmJvcmRlckNvbG9yLFxuICAgICAgYm9yZGVyQ2FwU3R5bGU6IGEuYm9yZGVyQ2FwU3R5bGUsXG4gICAgICBib3JkZXJEYXNoOiBhLmJvcmRlckRhc2gsXG4gICAgICBib3JkZXJEYXNoT2Zmc2V0OiBhLmJvcmRlckRhc2hPZmZzZXQsXG4gICAgICBib3JkZXJKb2luU3R5bGU6IGEuYm9yZGVySm9pblN0eWxlLFxuICAgICAgcG9pbnRCb3JkZXJDb2xvcjogYS5wb2ludEJvcmRlckNvbG9yLFxuICAgICAgcG9pbnRCYWNrZ3JvdW5kQ29sb3I6IGEucG9pbnRCYWNrZ3JvdW5kQ29sb3IsXG4gICAgICBwb2ludEJvcmRlcldpZHRoOiBhLnBvaW50Qm9yZGVyV2lkdGgsXG4gICAgICBwb2ludFJhZGl1czogYS5wb2ludFJhZGl1cyxcbiAgICAgIHBvaW50SG92ZXJSYWRpdXM6IGEucG9pbnRIb3ZlclJhZGl1cyxcbiAgICAgIHBvaW50SGl0UmFkaXVzOiBhLnBvaW50SGl0UmFkaXVzLFxuICAgICAgcG9pbnRIb3ZlckJhY2tncm91bmRDb2xvcjogYS5wb2ludEhvdmVyQmFja2dyb3VuZENvbG9yLFxuICAgICAgcG9pbnRIb3ZlckJvcmRlckNvbG9yOiBhLnBvaW50SG92ZXJCb3JkZXJDb2xvcixcbiAgICAgIHBvaW50SG92ZXJCb3JkZXJXaWR0aDogYS5wb2ludEhvdmVyQm9yZGVyV2lkdGgsXG4gICAgICBwb2ludFN0eWxlOiBhLnBvaW50U3R5bGUsXG4gICAgICBob3ZlckJhY2tncm91bmRDb2xvcjogYS5ob3ZlckJhY2tncm91bmRDb2xvcixcbiAgICAgIGhvdmVyQm9yZGVyQ29sb3I6IGEuaG92ZXJCb3JkZXJDb2xvcixcbiAgICAgIGhvdmVyQm9yZGVyV2lkdGg6IGEuaG92ZXJCb3JkZXJXaWR0aCxcbiAgICB9O1xuXG4gICAgcmV0dXJuIHJjO1xuICB9XG5cbiAgY29sb3JzRXF1YWwoYTogQ29sb3IsIGI6IENvbG9yKSB7XG4gICAgaWYgKCFhICE9PSAhYikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gIWEgfHwgdHJ1ZVxuICAgICAgJiYgKGEuYmFja2dyb3VuZENvbG9yID09PSBiLmJhY2tncm91bmRDb2xvcilcbiAgICAgICYmIChhLmJvcmRlcldpZHRoID09PSBiLmJvcmRlcldpZHRoKVxuICAgICAgJiYgKGEuYm9yZGVyQ29sb3IgPT09IGIuYm9yZGVyQ29sb3IpXG4gICAgICAmJiAoYS5ib3JkZXJDYXBTdHlsZSA9PT0gYi5ib3JkZXJDYXBTdHlsZSlcbiAgICAgICYmIChhLmJvcmRlckRhc2ggPT09IGIuYm9yZGVyRGFzaClcbiAgICAgICYmIChhLmJvcmRlckRhc2hPZmZzZXQgPT09IGIuYm9yZGVyRGFzaE9mZnNldClcbiAgICAgICYmIChhLmJvcmRlckpvaW5TdHlsZSA9PT0gYi5ib3JkZXJKb2luU3R5bGUpXG4gICAgICAmJiAoYS5wb2ludEJvcmRlckNvbG9yID09PSBiLnBvaW50Qm9yZGVyQ29sb3IpXG4gICAgICAmJiAoYS5wb2ludEJhY2tncm91bmRDb2xvciA9PT0gYi5wb2ludEJhY2tncm91bmRDb2xvcilcbiAgICAgICYmIChhLnBvaW50Qm9yZGVyV2lkdGggPT09IGIucG9pbnRCb3JkZXJXaWR0aClcbiAgICAgICYmIChhLnBvaW50UmFkaXVzID09PSBiLnBvaW50UmFkaXVzKVxuICAgICAgJiYgKGEucG9pbnRIb3ZlclJhZGl1cyA9PT0gYi5wb2ludEhvdmVyUmFkaXVzKVxuICAgICAgJiYgKGEucG9pbnRIaXRSYWRpdXMgPT09IGIucG9pbnRIaXRSYWRpdXMpXG4gICAgICAmJiAoYS5wb2ludEhvdmVyQmFja2dyb3VuZENvbG9yID09PSBiLnBvaW50SG92ZXJCYWNrZ3JvdW5kQ29sb3IpXG4gICAgICAmJiAoYS5wb2ludEhvdmVyQm9yZGVyQ29sb3IgPT09IGIucG9pbnRIb3ZlckJvcmRlckNvbG9yKVxuICAgICAgJiYgKGEucG9pbnRIb3ZlckJvcmRlcldpZHRoID09PSBiLnBvaW50SG92ZXJCb3JkZXJXaWR0aClcbiAgICAgICYmIChhLnBvaW50U3R5bGUgPT09IGIucG9pbnRTdHlsZSlcbiAgICAgICYmIChhLmhvdmVyQmFja2dyb3VuZENvbG9yID09PSBiLmhvdmVyQmFja2dyb3VuZENvbG9yKVxuICAgICAgJiYgKGEuaG92ZXJCb3JkZXJDb2xvciA9PT0gYi5ob3ZlckJvcmRlckNvbG9yKVxuICAgICAgJiYgKGEuaG92ZXJCb3JkZXJXaWR0aCA9PT0gYi5ob3ZlckJvcmRlcldpZHRoKVxuICAgICAgO1xuICB9XG5cbiAgdXBkYXRlQ29sb3JzKCkge1xuICAgIHRoaXMuZGF0YXNldHMuZm9yRWFjaCgoZWxtLCBpbmRleCkgPT4ge1xuICAgICAgaWYgKHRoaXMuY29sb3JzICYmIHRoaXMuY29sb3JzW2luZGV4XSkge1xuICAgICAgICBPYmplY3QuYXNzaWduKGVsbSwgdGhpcy5jb2xvcnNbaW5kZXhdKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZWxtLCBnZXRDb2xvcnModGhpcy5jaGFydFR5cGUsIGluZGV4LCBlbG0uZGF0YS5sZW5ndGgpLCB7IC4uLmVsbSB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgbGV0IHVwZGF0ZVJlcXVpcmVkID0gVXBkYXRlVHlwZS5EZWZhdWx0O1xuICAgIGNvbnN0IHdhbnRVcGRhdGUgPSAoeDogVXBkYXRlVHlwZSkgPT4ge1xuICAgICAgdXBkYXRlUmVxdWlyZWQgPSB4ID4gdXBkYXRlUmVxdWlyZWQgPyB4IDogdXBkYXRlUmVxdWlyZWQ7XG4gICAgfTtcblxuICAgIC8vIENoZWNrIGlmIHRoZSBjaGFuZ2VzIGFyZSBpbiB0aGUgZGF0YSBvciBkYXRhc2V0cyBvciBsYWJlbHMgb3IgbGVnZW5kXG5cbiAgICBpZiAoY2hhbmdlcy5oYXNPd25Qcm9wZXJ0eSgnZGF0YScpICYmIGNoYW5nZXMuZGF0YS5jdXJyZW50VmFsdWUpIHtcbiAgICAgIHRoaXMucHJvcGFnYXRlRGF0YVRvRGF0YXNldHMoY2hhbmdlcy5kYXRhLmN1cnJlbnRWYWx1ZSk7XG5cbiAgICAgIHdhbnRVcGRhdGUoVXBkYXRlVHlwZS5VcGRhdGUpO1xuICAgIH1cblxuICAgIGlmIChjaGFuZ2VzLmhhc093blByb3BlcnR5KCdkYXRhc2V0cycpICYmIGNoYW5nZXMuZGF0YXNldHMuY3VycmVudFZhbHVlKSB7XG4gICAgICB0aGlzLnByb3BhZ2F0ZURhdGFzZXRzVG9EYXRhKGNoYW5nZXMuZGF0YXNldHMuY3VycmVudFZhbHVlKTtcblxuICAgICAgd2FudFVwZGF0ZShVcGRhdGVUeXBlLlVwZGF0ZSk7XG4gICAgfVxuXG4gICAgaWYgKGNoYW5nZXMuaGFzT3duUHJvcGVydHkoJ2xhYmVscycpKSB7XG4gICAgICBpZiAodGhpcy5jaGFydCkge1xuICAgICAgICB0aGlzLmNoYXJ0LmRhdGEubGFiZWxzID0gY2hhbmdlcy5sYWJlbHMuY3VycmVudFZhbHVlO1xuICAgICAgfVxuXG4gICAgICB3YW50VXBkYXRlKFVwZGF0ZVR5cGUuVXBkYXRlKTtcbiAgICB9XG5cbiAgICBpZiAoY2hhbmdlcy5oYXNPd25Qcm9wZXJ0eSgnbGVnZW5kJykpIHtcbiAgICAgIGlmICh0aGlzLmNoYXJ0KSB7XG4gICAgICAgIHRoaXMuY2hhcnQuY29uZmlnLm9wdGlvbnMubGVnZW5kLmRpc3BsYXkgPSBjaGFuZ2VzLmxlZ2VuZC5jdXJyZW50VmFsdWU7XG4gICAgICAgIHRoaXMuY2hhcnQuZ2VuZXJhdGVMZWdlbmQoKTtcbiAgICAgIH1cblxuICAgICAgd2FudFVwZGF0ZShVcGRhdGVUeXBlLlVwZGF0ZSk7XG4gICAgfVxuXG4gICAgaWYgKGNoYW5nZXMuaGFzT3duUHJvcGVydHkoJ29wdGlvbnMnKSkge1xuICAgICAgd2FudFVwZGF0ZShVcGRhdGVUeXBlLlJlZnJlc2gpO1xuICAgIH1cblxuICAgIHN3aXRjaCAodXBkYXRlUmVxdWlyZWQgYXMgVXBkYXRlVHlwZSkge1xuICAgICAgY2FzZSBVcGRhdGVUeXBlLlVwZGF0ZTpcbiAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFVwZGF0ZVR5cGUuUmVmcmVzaDpcbiAgICAgIGNhc2UgVXBkYXRlVHlwZS5EZWZhdWx0OlxuICAgICAgICB0aGlzLnJlZnJlc2goKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIG5nT25EZXN0cm95KCkge1xuICAgIGlmICh0aGlzLmNoYXJ0KSB7XG4gICAgICB0aGlzLmNoYXJ0LmRlc3Ryb3koKTtcbiAgICAgIHRoaXMuY2hhcnQgPSB2b2lkIDA7XG4gICAgfVxuICAgIHRoaXMuc3Vicy5mb3JFYWNoKHggPT4geC51bnN1YnNjcmliZSgpKTtcbiAgfVxuXG4gIHB1YmxpYyB1cGRhdGUoZHVyYXRpb24/OiBhbnksIGxhenk/OiBhbnkpIHtcbiAgICBpZiAodGhpcy5jaGFydCkge1xuICAgICAgcmV0dXJuIHRoaXMuY2hhcnQudXBkYXRlKGR1cmF0aW9uLCBsYXp5KTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgaGlkZURhdGFzZXQoaW5kZXg6IG51bWJlciwgaGlkZGVuOiBib29sZWFuKSB7XG4gICAgdGhpcy5jaGFydC5nZXREYXRhc2V0TWV0YShpbmRleCkuaGlkZGVuID0gaGlkZGVuO1xuICAgIHRoaXMuY2hhcnQudXBkYXRlKCk7XG4gIH1cblxuICBwdWJsaWMgaXNEYXRhc2V0SGlkZGVuKGluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5jaGFydC5nZXREYXRhc2V0TWV0YShpbmRleCkuaGlkZGVuO1xuICB9XG5cbiAgcHVibGljIHRvQmFzZTY0SW1hZ2UoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5jaGFydC50b0Jhc2U2NEltYWdlKCk7XG4gIH1cblxuICBwdWJsaWMgZ2V0Q2hhcnRDb25maWd1cmF0aW9uKCk6IGNoYXJ0SnMuQ2hhcnRDb25maWd1cmF0aW9uIHtcbiAgICBjb25zdCBkYXRhc2V0cyA9IHRoaXMuZ2V0RGF0YXNldHMoKTtcblxuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLm9wdGlvbnMpO1xuICAgIGlmICh0aGlzLmxlZ2VuZCA9PT0gZmFsc2UpIHtcbiAgICAgIG9wdGlvbnMubGVnZW5kID0geyBkaXNwbGF5OiBmYWxzZSB9O1xuICAgIH1cbiAgICAvLyBob29rIGZvciBvbkhvdmVyIGFuZCBvbkNsaWNrIGV2ZW50c1xuICAgIG9wdGlvbnMuaG92ZXIgPSBvcHRpb25zLmhvdmVyIHx8IHt9O1xuICAgIGlmICghb3B0aW9ucy5ob3Zlci5vbkhvdmVyKSB7XG4gICAgICBvcHRpb25zLmhvdmVyLm9uSG92ZXIgPSAoZXZlbnQ6IE1vdXNlRXZlbnQsIGFjdGl2ZToge31bXSkgPT4ge1xuICAgICAgICBpZiAoYWN0aXZlICYmICFhY3RpdmUubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2hhcnRIb3Zlci5lbWl0KHsgZXZlbnQsIGFjdGl2ZSB9KTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKCFvcHRpb25zLm9uQ2xpY2spIHtcbiAgICAgIG9wdGlvbnMub25DbGljayA9IChldmVudD86IE1vdXNlRXZlbnQsIGFjdGl2ZT86IHt9W10pID0+IHtcbiAgICAgICAgdGhpcy5jaGFydENsaWNrLmVtaXQoeyBldmVudCwgYWN0aXZlIH0pO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCBtZXJnZWRPcHRpb25zID0gdGhpcy5zbWFydE1lcmdlKG9wdGlvbnMsIHRoaXMudGhlbWVTZXJ2aWNlLmdldENvbG9yc2NoZW1lc09wdGlvbnMoKSk7XG5cbiAgICBjb25zdCBjaGFydENvbmZpZzogY2hhcnRKcy5DaGFydENvbmZpZ3VyYXRpb24gPSB7XG4gICAgICB0eXBlOiB0aGlzLmNoYXJ0VHlwZSxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgbGFiZWxzOiB0aGlzLmxhYmVscyB8fCBbXSxcbiAgICAgICAgZGF0YXNldHNcbiAgICAgIH0sXG4gICAgICBwbHVnaW5zOiB0aGlzLnBsdWdpbnMsXG4gICAgICBvcHRpb25zOiBtZXJnZWRPcHRpb25zLFxuICAgIH07XG5cbiAgICByZXR1cm4gY2hhcnRDb25maWc7XG4gIH1cblxuICBwdWJsaWMgZ2V0Q2hhcnRCdWlsZGVyKGN0eDogc3RyaW5nLyosIGRhdGE6YW55W10sIG9wdGlvbnM6YW55Ki8pOiBDaGFydCB7XG4gICAgY29uc3QgY2hhcnRDb25maWcgPSB0aGlzLmdldENoYXJ0Q29uZmlndXJhdGlvbigpO1xuICAgIHJldHVybiBuZXcgY2hhcnRKcy5DaGFydChjdHgsIGNoYXJ0Q29uZmlnKTtcbiAgfVxuXG4gIHNtYXJ0TWVyZ2Uob3B0aW9uczogYW55LCBvdmVycmlkZXM6IGFueSwgbGV2ZWw6IG51bWJlciA9IDApOiBhbnkge1xuICAgIGlmIChsZXZlbCA9PT0gMCkge1xuICAgICAgb3B0aW9ucyA9IF8uY2xvbmVEZWVwKG9wdGlvbnMpO1xuICAgIH1cbiAgICBjb25zdCBrZXlzVG9VcGRhdGUgPSBPYmplY3Qua2V5cyhvdmVycmlkZXMpO1xuICAgIGtleXNUb1VwZGF0ZS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShvdmVycmlkZXNba2V5XSkpIHtcbiAgICAgICAgY29uc3QgYXJyYXlFbGVtZW50cyA9IG9wdGlvbnNba2V5XTtcbiAgICAgICAgaWYgKGFycmF5RWxlbWVudHMpIHtcbiAgICAgICAgICBhcnJheUVsZW1lbnRzLmZvckVhY2gociA9PiB7XG4gICAgICAgICAgICB0aGlzLnNtYXJ0TWVyZ2Uociwgb3ZlcnJpZGVzW2tleV1bMF0sIGxldmVsICsgMSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIChvdmVycmlkZXNba2V5XSkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGlmICghKGtleSBpbiBvcHRpb25zKSkge1xuICAgICAgICAgIG9wdGlvbnNba2V5XSA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc21hcnRNZXJnZShvcHRpb25zW2tleV0sIG92ZXJyaWRlc1trZXldLCBsZXZlbCArIDEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3B0aW9uc1trZXldID0gb3ZlcnJpZGVzW2tleV07XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKGxldmVsID09PSAwKSB7XG4gICAgICByZXR1cm4gb3B0aW9ucztcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGlzTXVsdGlMaW5lTGFiZWwobGFiZWw6IExhYmVsKTogbGFiZWwgaXMgTXVsdGlMaW5lTGFiZWwge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KGxhYmVsKTtcbiAgfVxuXG4gIHByaXZhdGUgam9pbkxhYmVsKGxhYmVsOiBMYWJlbCk6IHN0cmluZyB7XG4gICAgaWYgKCFsYWJlbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICh0aGlzLmlzTXVsdGlMaW5lTGFiZWwobGFiZWwpKSB7XG4gICAgICByZXR1cm4gbGFiZWwuam9pbignICcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbGFiZWw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwcm9wYWdhdGVEYXRhc2V0c1RvRGF0YShkYXRhc2V0czogY2hhcnRKcy5DaGFydERhdGFTZXRzW10pIHtcbiAgICB0aGlzLmRhdGEgPSB0aGlzLmRhdGFzZXRzLm1hcChyID0+IHIuZGF0YSk7XG4gICAgaWYgKHRoaXMuY2hhcnQpIHtcbiAgICAgIHRoaXMuY2hhcnQuZGF0YS5kYXRhc2V0cyA9IGRhdGFzZXRzO1xuICAgIH1cbiAgICB0aGlzLnVwZGF0ZUNvbG9ycygpO1xuICB9XG5cbiAgcHJpdmF0ZSBwcm9wYWdhdGVEYXRhVG9EYXRhc2V0cyhuZXdEYXRhVmFsdWVzOiBTaW5nbGVPck11bHRpRGF0YVNldCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmlzTXVsdGlEYXRhU2V0KG5ld0RhdGFWYWx1ZXMpKSB7XG4gICAgICBpZiAodGhpcy5kYXRhc2V0cyAmJiBuZXdEYXRhVmFsdWVzLmxlbmd0aCA9PT0gdGhpcy5kYXRhc2V0cy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5kYXRhc2V0cy5mb3JFYWNoKChkYXRhc2V0LCBpOiBudW1iZXIpID0+IHtcbiAgICAgICAgICBkYXRhc2V0LmRhdGEgPSBuZXdEYXRhVmFsdWVzW2ldO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZGF0YXNldHMgPSBuZXdEYXRhVmFsdWVzLm1hcCgoZGF0YTogbnVtYmVyW10sIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICByZXR1cm4geyBkYXRhLCBsYWJlbDogdGhpcy5qb2luTGFiZWwodGhpcy5sYWJlbHNbaW5kZXhdKSB8fCBgTGFiZWwgJHtpbmRleH1gIH07XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5jaGFydCkge1xuICAgICAgICAgIHRoaXMuY2hhcnQuZGF0YS5kYXRhc2V0cyA9IHRoaXMuZGF0YXNldHM7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCF0aGlzLmRhdGFzZXRzKSB7XG4gICAgICAgIHRoaXMuZGF0YXNldHMgPSBbeyBkYXRhOiBuZXdEYXRhVmFsdWVzIH1dO1xuICAgICAgICBpZiAodGhpcy5jaGFydCkge1xuICAgICAgICAgIHRoaXMuY2hhcnQuZGF0YS5kYXRhc2V0cyA9IHRoaXMuZGF0YXNldHM7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZGF0YXNldHNbMF0uZGF0YSA9IG5ld0RhdGFWYWx1ZXM7XG4gICAgICAgIHRoaXMuZGF0YXNldHMuc3BsaWNlKDEpOyAvLyBSZW1vdmUgYWxsIGVsZW1lbnRzIGJ1dCB0aGUgZmlyc3RcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy51cGRhdGVDb2xvcnMoKTtcbiAgfVxuXG4gIHByaXZhdGUgaXNNdWx0aURhdGFTZXQoZGF0YTogU2luZ2xlT3JNdWx0aURhdGFTZXQpOiBkYXRhIGlzIE11bHRpRGF0YVNldCB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoZGF0YVswXSk7XG4gIH1cblxuICBwcml2YXRlIGdldERhdGFzZXRzKCkge1xuICAgIGlmICghdGhpcy5kYXRhc2V0cyAmJiAhdGhpcy5kYXRhKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYG5nLWNoYXJ0cyBjb25maWd1cmF0aW9uIGVycm9yLCBkYXRhIG9yIGRhdGFzZXRzIGZpZWxkIGFyZSByZXF1aXJlZCB0byByZW5kZXIgY2hhcnQgJHt0aGlzLmNoYXJ0VHlwZX1gKTtcbiAgICB9XG5cbiAgICAvLyBJZiBgZGF0YXNldHNgIGlzIGRlZmluZWQsIHVzZSBpdCBvdmVyIHRoZSBgZGF0YWAgcHJvcGVydHkuXG4gICAgaWYgKHRoaXMuZGF0YXNldHMpIHtcbiAgICAgIHRoaXMucHJvcGFnYXRlRGF0YXNldHNUb0RhdGEodGhpcy5kYXRhc2V0cyk7XG4gICAgICByZXR1cm4gdGhpcy5kYXRhc2V0cztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5kYXRhKSB7XG4gICAgICB0aGlzLnByb3BhZ2F0ZURhdGFUb0RhdGFzZXRzKHRoaXMuZGF0YSk7XG4gICAgICByZXR1cm4gdGhpcy5kYXRhc2V0cztcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlZnJlc2goKSB7XG4gICAgLy8gaWYgKHRoaXMub3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMucmVzcG9uc2l2ZSkge1xuICAgIC8vICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnJlZnJlc2goKSwgNTApO1xuICAgIC8vIH1cblxuICAgIC8vIHRvZG86IHJlbW92ZSB0aGlzIGxpbmUsIGl0IGlzIHByb2R1Y2luZyBmbGlja2VyaW5nXG4gICAgaWYgKHRoaXMuY2hhcnQpIHtcbiAgICAgIHRoaXMuY2hhcnQuZGVzdHJveSgpO1xuICAgICAgdGhpcy5jaGFydCA9IHZvaWQgMDtcbiAgICB9XG4gICAgaWYgKHRoaXMuY3R4KSB7XG4gICAgICB0aGlzLmNoYXJ0ID0gdGhpcy5nZXRDaGFydEJ1aWxkZXIodGhpcy5jdHgvKiwgZGF0YSwgdGhpcy5vcHRpb25zKi8pO1xuICAgIH1cbiAgfVxufVxuIl19