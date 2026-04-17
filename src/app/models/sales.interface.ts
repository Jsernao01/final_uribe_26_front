export interface IKpi {
  title: string;
  value: string;
  caption: string;
  icon: string;
  accent: 'primary' | 'secondary' | 'warning' | 'success';
}

export interface IUserPreview {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: string;
  fechaRegistro?: string;
}

export interface IProductStock {
  color: string;
  talla: string;
  cantidad: number;
}

export interface IProductCategory {
  id: string;
  caracteristica: string;
}

export interface IProductPreview {
  id: string;
  nombre: string;
  precio: number;
  activo?: boolean;
  descuento?: number | null;
  stock: IProductStock[];
  categorias: IProductCategory[];
}

export interface IAnalyticsSummary {
  total_usuarios: number;
  total_productos: number;
  total_ventas: number;
  total_ingresos: number;
  total_unidades_vendidas: number;
  promedio_por_venta: number;
  usuarios_por_rol: Record<string, number>;
}

export interface IEmployeeInsight {
  empleado_id?: string | null;
  empleado_nombre: string;
  ventas_realizadas: number;
  unidades_vendidas: number;
  ingresos_generados: number;
}

export interface IProductInsight {
  producto_id?: string | null;
  producto_nombre: string;
  unidades_vendidas: number;
  ingresos_generados: number;
  veces_vendido: number;
}

export interface IClientInsight {
  cliente_id?: string | null;
  cliente_nombre: string;
  compras_realizadas: number;
  monto_total_comprado: number;
}

export interface IAnalyticsResponse {
  fuente_backend: string;
  mensajes: string[];
  resumen: IAnalyticsSummary;
  empleados_que_mas_venden: IEmployeeInsight[];
  empleados_que_menos_venden: IEmployeeInsight[];
  productos_mas_vendidos: IProductInsight[];
  productos_menos_vendidos: IProductInsight[];
  clientes_que_mas_compran: IClientInsight[];
  clientes_que_menos_compran: IClientInsight[];
}

export interface IServiceStatus {
  label: string;
  healthy: boolean;
  detail: string;
}

export interface IDashboardSnapshot {
  analytics: IAnalyticsResponse | null;
  mode: 'real' | 'demo';
  users: IUserPreview[];
  products: IProductPreview[];
  statuses: IServiceStatus[];
  error?: string;
}
