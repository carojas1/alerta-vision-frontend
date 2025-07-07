import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent {
  activeTab: 'diario' | 'semanal' | 'mensual' = 'diario';

  // Datos de ejemplo
  dailyData = [7, 8, 6, 5, 7, 9, 8];
  weeklyData = [45, 48, 43, 39, 47, 50, 44];
  monthlyData = [180, 210, 230, 220, 195, 205, 198, 200, 210, 190, 205, 220];

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Somnolencia', backgroundColor: '#d3bb97' }]
  };
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#eee' } }
    }
  };
  barChartType: ChartType = 'bar';  // <--- Esto es válido

  ngOnInit() {
    this.setChartData('diario');
  }

  selectTab(tab: 'diario' | 'semanal' | 'mensual') {
    this.activeTab = tab;
    this.setChartData(tab);
  }

  setChartData(tab: 'diario' | 'semanal' | 'mensual') {
    let data, labels;
    if (tab === 'diario') {
      data = this.dailyData;
      labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    } else if (tab === 'semanal') {
      data = this.weeklyData;
      labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5', 'Semana 6', 'Semana 7'];
    } else {
      data = this.monthlyData;
      labels = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ];
    }
    this.barChartData = {
      labels,
      datasets: [{ data, label: 'Somnolencia', backgroundColor: '#d3bb97' }]
    };
  }

  getBarChartAverage(): number {
    const dataArr = this.barChartData.datasets[0]?.data as number[];
    if (!dataArr || !dataArr.length) return 0;
    const sum = dataArr.reduce((a, b) => Number(a) + Number(b), 0);
    return sum / dataArr.length;
  }

  goTo(ruta: string) {
    this.router.navigate([`/${ruta}`]);
  }

  constructor(private router: Router) {}
}
