import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-stores-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './stores-chart.html',
  styleUrl: './stores-chart.scss'
})
export class StoresChartComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) subtitle!: string;
  @Input({ required: true }) chartData!: ChartConfiguration<'doughnut'>['data'];
  @Input({ required: true }) chartOptions!: ChartConfiguration<'doughnut'>['options'];
}
