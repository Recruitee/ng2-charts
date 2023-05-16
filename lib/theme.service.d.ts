import { BehaviorSubject } from 'rxjs';
import { ChartOptions } from 'chart.js';
import * as i0 from "@angular/core";
export declare class ThemeService {
    private pColorschemesOptions;
    colorschemesOptions: BehaviorSubject<ChartOptions>;
    constructor();
    setColorschemesOptions(options: ChartOptions): void;
    getColorschemesOptions(): ChartOptions;
    static ɵfac: i0.ɵɵFactoryDeclaration<ThemeService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<ThemeService>;
}
