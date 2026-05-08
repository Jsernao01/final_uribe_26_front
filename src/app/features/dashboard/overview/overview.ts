import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration } from 'chart.js';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { KpiCardComponent } from '../components/kpi-card/kpi-card';
import { SellersChartComponent } from '../components/sellers-chart/sellers-chart';
import { StoresChartComponent } from '../components/stores-chart/stores-chart';
import { SalesDataService } from '../../../core/services/sales-data.service';
import { ThemeService } from '../../../core/services/theme.service';
import {
  IClientInsight,
  IDashboardSnapshot,
  IEmployeeInsight,
  IKpi,
  IProductInsight
} from '../../../models';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    KpiCardComponent,
    SellersChartComponent,
    StoresChartComponent
  ],
  templateUrl: './overview.html',
  styleUrl: './overview.scss'
})
export class OverviewComponent implements OnInit {
  private readonly salesService = inject(SalesDataService);
  private readonly themeService = inject(ThemeService);

  protected readonly isLoading = signal(true);
  protected readonly snapshot = signal<IDashboardSnapshot | null>(null);
  protected readonly sellerFilter = signal<string>('');
  protected readonly showAllProducts = signal<boolean>(false);

  protected readonly analytics = computed(() => this.snapshot()?.analytics ?? null);
  protected readonly statuses = computed(() => this.snapshot()?.statuses ?? []);
  protected readonly users = computed(() => this.snapshot()?.users ?? []);
  protected readonly products = computed(() => this.snapshot()?.products ?? []);
  protected readonly mode = computed(() => this.snapshot()?.mode ?? 'real');
  protected readonly dashboardError = computed(() => this.snapshot()?.error ?? null);

  protected readonly kpis = computed<IKpi[]>(() => {
    const analytics = this.analytics();
    if (!analytics) return [];

    const bestProduct = (analytics.productos_mas_vendidos && analytics.productos_mas_vendidos.length > 0) 
      ? analytics.productos_mas_vendidos[0].producto_nombre 
      : 'Sin productos';

    const topClient = (analytics.clientes_que_mas_compran && analytics.clientes_que_mas_compran.length > 0)
      ? analytics.clientes_que_mas_compran[0].cliente_nombre
      : 'Sin clientes';

    return [
      {
        title: 'Ingresos totales',
        value: this.formatCurrency(analytics.resumen.total_ingresos || 0),
        caption: `${analytics.resumen.total_ventas || 0} ventas registradas`,
        icon: 'payments',
        accent: 'primary'
      },
      {
        title: 'Factura promedio',
        value: this.formatCurrency(analytics.resumen.promedio_por_venta || 0),
        caption: `${analytics.resumen.total_ventas || 0} órdenes`,
        icon: 'receipt_long',
        accent: 'secondary'
      },
      {
        title: 'Producto líder',
        value: bestProduct,
        caption: `Top en ventas`,
        icon: 'inventory_2',
        accent: 'warning'
      },
      {
        title: 'Cliente top',
        value: topClient,
        caption: 'Mayor volumen de compra',
        icon: 'workspace_premium',
        accent: 'success'
      }
    ];
  });

  protected readonly topProducts = computed(() => {
    const products = this.analytics()?.productos_mas_vendidos ?? [];
    return this.showAllProducts() ? products : products.slice(0, 10);
  });
  protected readonly topClients = computed(() => this.analytics()?.clientes_que_mas_compran ?? []);
  protected readonly topEmployees = computed(() => this.analytics()?.empleados_que_mas_venden ?? []);
  protected readonly analyticsMessages = computed(() => {
    const raw = this.analytics()?.mensajes || [];
    return raw.filter(m => 
      !m.includes('Capa de limpieza') && 
      !m.includes('registros simulados') && 
      !m.includes('http://')
    );
  });

  protected readonly productsChartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const items = this.topProducts().slice(0, 5);
    return {
      labels: items.map((item) => item.producto_nombre),
      datasets: [
        {
          label: 'Unidades vendidas',
          data: items.map((item) => item.unidades_vendidas),
          backgroundColor: ['#0f766e', '#18867d', '#2cae9c', '#71cfba', '#e97b4d'],
          borderRadius: 14,
          borderSkipped: false
        }
      ]
    };
  });

  protected readonly clientsChartData = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const items = this.topClients().slice(0, 5);
    return {
      labels: items.map((item: IClientInsight) => item.cliente_nombre),
      datasets: [
        {
          data: items.map((item: IClientInsight) => item.monto_total_comprado),
          backgroundColor: ['#0f766e', '#2cae9c', '#74decb', '#ff9d5c', '#e97b4d'],
          borderWidth: 0
        }
      ]
    };
  });

  protected readonly productsChartOptions = computed<ChartConfiguration<'bar'>['options']>(() => {
    const dark = this.themeService.theme() === 'dark';
    const tick = dark ? '#94aeb8' : '#5d6c73';
    const grid = dark ? 'rgba(255,255,255,0.08)' : 'rgba(19,32,38,0.08)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { ticks: { color: tick }, grid: { display: false } },
        y: { ticks: { color: tick }, grid: { color: grid } }
      }
    };
  });

  protected readonly clientsChartOptions = computed<ChartConfiguration<'doughnut'>['options']>(() => {
    const dark = this.themeService.theme() === 'dark';
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: dark ? '#e6ecef' : '#1d3038',
            padding: 16
          }
        }
      }
    };
  });

  ngOnInit(): void {
    this.reload();
  }

  protected reload(): void {
    this.isLoading.set(true);
    this.salesService.getDashboardSnapshot(false, this.sellerFilter()).subscribe((snapshot) => {
      this.snapshot.set(snapshot);
      this.isLoading.set(false);
    });
  }

  protected applySellerFilter(name: string): void {
    this.sellerFilter.set(name);
    this.reload();
  }

  protected generateDemoData(): void {
    this.isLoading.set(true);
    this.salesService.getDashboardSnapshot(true, '').subscribe((snapshot) => {
      this.snapshot.set(snapshot);
      this.isLoading.set(false);
    });
  }

  protected exportData(): void {
    this.salesService.exportToExcel(this.sellerFilter(), this.mode() === 'demo');
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value ?? 0);
  }

  protected formatCompactNumber(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value ?? 0);
  }

  protected trackProduct(_: number, item: any): string {
    return item.producto_id ?? item.producto_nombre;
  }

  protected trackClient(_: number, item: any): string {
    return item.cliente_id ?? item.cliente_nombre;
  }

  protected trackEmployee(_: number, item: any): string {
    return item.empleado_id ?? item.empleado_nombre;
  }
}

