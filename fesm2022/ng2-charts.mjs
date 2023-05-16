import * as i0 from '@angular/core';
import { Injectable, EventEmitter, Directive, Input, Output, NgModule } from '@angular/core';
import * as chartJs from 'chart.js';
import { BehaviorSubject } from 'rxjs';
import * as _ from 'lodash';

const defaultColors = [
    [255, 99, 132],
    [54, 162, 235],
    [255, 206, 86],
    [231, 233, 237],
    [75, 192, 192],
    [151, 187, 205],
    [220, 220, 220],
    [247, 70, 74],
    [70, 191, 189],
    [253, 180, 92],
    [148, 159, 177],
    [77, 83, 96]
];

/**
 * Generate colors by chart type
 */
function getColors(chartType, index, count) {
    if (chartType === 'pie' || chartType === 'doughnut') {
        return formatPieColors(generateColors(count));
    }
    if (chartType === 'polarArea') {
        return formatPolarAreaColors(generateColors(count));
    }
    if (chartType === 'line' || chartType === 'radar') {
        return formatLineColor(generateColor(index));
    }
    if (chartType === 'bar' || chartType === 'horizontalBar') {
        return formatBarColor(generateColor(index));
    }
    if (chartType === 'bubble') {
        return formatPieColors(generateColors(count));
    }
    if (chartType === 'scatter') {
        return formatPieColors(generateColors(count));
    }
    throw new Error(`getColors - Unsupported chart type ${chartType}`);
}
function rgba(colour, alpha) {
    return 'rgba(' + colour.concat(alpha).join(',') + ')';
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function formatLineColor(colors) {
    return {
        backgroundColor: rgba(colors, 0.4),
        borderColor: rgba(colors, 1),
        pointBackgroundColor: rgba(colors, 1),
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: rgba(colors, 0.8)
    };
}
function formatBarColor(colors) {
    return {
        backgroundColor: rgba(colors, 0.6),
        borderColor: rgba(colors, 1),
        hoverBackgroundColor: rgba(colors, 0.8),
        hoverBorderColor: rgba(colors, 1)
    };
}
function formatPieColors(colors) {
    return {
        backgroundColor: colors.map((color) => rgba(color, 0.6)),
        borderColor: colors.map(() => '#fff'),
        pointBackgroundColor: colors.map((color) => rgba(color, 1)),
        pointBorderColor: colors.map(() => '#fff'),
        pointHoverBackgroundColor: colors.map((color) => rgba(color, 1)),
        pointHoverBorderColor: colors.map((color) => rgba(color, 1))
    };
}
function formatPolarAreaColors(colors) {
    return {
        backgroundColor: colors.map((color) => rgba(color, 0.6)),
        borderColor: colors.map((color) => rgba(color, 1)),
        hoverBackgroundColor: colors.map((color) => rgba(color, 0.8)),
        hoverBorderColor: colors.map((color) => rgba(color, 1))
    };
}
function getRandomColor() {
    return [getRandomInt(0, 255), getRandomInt(0, 255), getRandomInt(0, 255)];
}
/**
 * Generate colors for line|bar charts
 */
function generateColor(index) {
    return defaultColors[index] || getRandomColor();
}
/**
 * Generate colors for pie|doughnut charts
 */
function generateColors(count) {
    const colorsArr = new Array(count);
    for (let i = 0; i < count; i++) {
        colorsArr[i] = defaultColors[i] || getRandomColor();
    }
    return colorsArr;
}

class ThemeService {
    pColorschemesOptions = {};
    colorschemesOptions = new BehaviorSubject({});
    constructor() { }
    setColorschemesOptions(options) {
        this.pColorschemesOptions = options;
        this.colorschemesOptions.next(options);
    }
    getColorschemesOptions() {
        return this.pColorschemesOptions;
    }
    /** @nocollapse */ static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: ThemeService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    /** @nocollapse */ static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: ThemeService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: ThemeService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: function () { return []; } });

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
    /** @nocollapse */ static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: BaseChartDirective, deps: [{ token: i0.ElementRef }, { token: ThemeService }], target: i0.ɵɵFactoryTarget.Directive });
    /** @nocollapse */ static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.1", type: BaseChartDirective, selector: "canvas[baseChart]", inputs: { data: "data", datasets: "datasets", labels: "labels", options: "options", chartType: "chartType", colors: "colors", legend: "legend", plugins: "plugins" }, outputs: { chartClick: "chartClick", chartHover: "chartHover" }, exportAs: ["base-chart"], usesOnChanges: true, ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: BaseChartDirective, decorators: [{
            type: Directive,
            args: [{
                    // tslint:disable-next-line:directive-selector
                    selector: 'canvas[baseChart]',
                    exportAs: 'base-chart'
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: ThemeService }]; }, propDecorators: { data: [{
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

class ChartsModule {
    /** @nocollapse */ static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: ChartsModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
    /** @nocollapse */ static ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "16.0.1", ngImport: i0, type: ChartsModule, declarations: [BaseChartDirective], exports: [BaseChartDirective] });
    /** @nocollapse */ static ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: ChartsModule });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: ChartsModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [
                        BaseChartDirective
                    ],
                    imports: [],
                    exports: [
                        BaseChartDirective
                    ]
                }]
        }] });

/*
 * Public API Surface of ng2-charts
 */

/**
 * Generated bundle index. Do not edit.
 */

export { BaseChartDirective, ChartsModule, ThemeService, defaultColors };
//# sourceMappingURL=ng2-charts.mjs.map
