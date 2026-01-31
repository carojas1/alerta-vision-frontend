import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';

/**
 * Servicio de Notificaciones para Alerta Visión
 * 
 * Muestra notificaciones locales cuando se detecta fatiga
 * Funciona en Android (APK) y en web (fallback a alert)
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private isNative = Capacitor.isNativePlatform();
  private notificationId = 0;

  constructor() {
    this.init();
  }

  /**
   * Inicializa el servicio de notificaciones
   */
  async init(): Promise<void> {
    console.log('🔔 NotificationService inicializado');
    console.log('📱 Plataforma nativa:', this.isNative);

    if (this.isNative) {
      try {
        // Solicitar permisos de notificación
        const permission = await LocalNotifications.requestPermissions();
        console.log('🔔 Permiso de notificaciones:', permission.display);

        // Listener para cuando se toca la notificación
        LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
          console.log('🔔 Notificación tocada:', notification);
          // Aquí puedes navegar a la pantalla de alertas
        });

      } catch (error) {
        console.error('❌ Error inicializando notificaciones:', error);
      }
    }
  }

  /**
   * Muestra una notificación de alerta de fatiga
   */
  async showFatigaAlert(mensaje: string, nivel: 'warning' | 'danger' | 'info' = 'warning'): Promise<void> {
    const titulo = this.getTitulo(nivel);
    const icono = this.getIcono(nivel);

    if (this.isNative) {
      await this.showNativeNotification(titulo, mensaje, nivel);
    } else {
      this.showWebNotification(titulo, mensaje);
    }
  }

  /**
   * Notificación nativa (Android)
   */
  private async showNativeNotification(titulo: string, mensaje: string, nivel: string): Promise<void> {
    try {
      this.notificationId++;

      const options: ScheduleOptions = {
        notifications: [
          {
            id: this.notificationId,
            title: titulo,
            body: mensaje,
            smallIcon: 'ic_stat_icon_config_sample',
            largeIcon: 'ic_launcher',
            channelId: nivel === 'danger' ? 'urgente' : 'alertas',
            schedule: { at: new Date(Date.now() + 100) }, // Inmediato
            sound: nivel === 'danger' ? 'alarm.wav' : undefined,
            extra: {
              nivel: nivel,
              tipo: 'fatiga'
            }
          }
        ]
      };

      await LocalNotifications.schedule(options);
      console.log('✅ Notificación enviada:', titulo);

    } catch (error) {
      console.error('❌ Error enviando notificación:', error);
      // Fallback
      this.showWebNotification(titulo, mensaje);
    }
  }

  /**
   * Notificación web (fallback para navegador)
   */
  private showWebNotification(titulo: string, mensaje: string): void {
    // Intentar usar Web Notifications API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(titulo, {
        body: mensaje,
        icon: '/assets/icons/icon-192.png',
        vibrate: [200, 100, 200]
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(titulo, { body: mensaje });
        }
      });
    } else {
      // Fallback final: alert del navegador
      console.log(`🔔 ${titulo}: ${mensaje}`);
    }
  }

  /**
   * Crea un canal de notificación (Android 8+)
   */
  async createNotificationChannels(): Promise<void> {
    if (!this.isNative) return;

    try {
      await LocalNotifications.createChannel({
        id: 'alertas',
        name: 'Alertas de Fatiga',
        description: 'Notificaciones cuando se detecta fatiga',
        importance: 4, // HIGH
        visibility: 1, // PUBLIC
        sound: 'beep.wav',
        vibration: true,
        lights: true,
        lightColor: '#FFA500' // Naranja
      });

      await LocalNotifications.createChannel({
        id: 'urgente',
        name: 'Alertas Urgentes',
        description: 'Alertas críticas de somnolencia',
        importance: 5, // MAX
        visibility: 1,
        sound: 'alarm.wav',
        vibration: true,
        lights: true,
        lightColor: '#FF0000' // Rojo
      });

      console.log('✅ Canales de notificación creados');
    } catch (error) {
      console.error('❌ Error creando canales:', error);
    }
  }

  /**
   * Métodos de conveniencia para diferentes tipos de alerta
   */
  async alertaFatigaAlta(mensaje?: string): Promise<void> {
    await this.showFatigaAlert(
      mensaje || '⚠️ Fatiga alta detectada - Se recomienda descansar',
      'warning'
    );
  }

  async alertaSomnolenciaCritica(mensaje?: string): Promise<void> {
    await this.showFatigaAlert(
      mensaje || '🔴 ¡SOMNOLENCIA CRÍTICA! - Detén el vehículo AHORA',
      'danger'
    );
  }

  async alertaParpadeoLento(mensaje?: string): Promise<void> {
    await this.showFatigaAlert(
      mensaje || '🟡 Parpadeo lento detectado - Mantente alerta',
      'info'
    );
  }

  async alertaDistraccion(mensaje?: string): Promise<void> {
    await this.showFatigaAlert(
      mensaje || '⚠️ Distracción detectada - Mantén la vista en el camino',
      'warning'
    );
  }

  /**
   * Helpers
   */
  private getTitulo(nivel: string): string {
    switch (nivel) {
      case 'danger': return '🚨 ALERTA CRÍTICA';
      case 'warning': return '⚠️ Alerta de Fatiga';
      case 'info': return 'ℹ️ Información';
      default: return '🔔 Alerta Visión';
    }
  }

  private getIcono(nivel: string): string {
    switch (nivel) {
      case 'danger': return '🔴';
      case 'warning': return '🟠';
      case 'info': return '🟡';
      default: return '🔔';
    }
  }
}
