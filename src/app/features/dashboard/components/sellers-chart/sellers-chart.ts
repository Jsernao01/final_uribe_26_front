import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-sellers-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './sellers-chart.html',
  styleUrl: './sellers-chart.scss'
})
export class SellersChartComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) subtitle!: string;
  @Input({ required: true }) chartData!: ChartConfiguration<'bar'>['data'];
  @Input({ required: true }) chartOptions!: ChartConfiguration<'bar'>['options'];
}
