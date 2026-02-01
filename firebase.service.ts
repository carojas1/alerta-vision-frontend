import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private app: admin.app.App | null = null;

    onModuleInit() {
        this.initializeFirebase();
    }

    private initializeFirebase() {
        // Verificar si ya está inicializado
        if (admin.apps.length > 0) {
            this.app = admin.apps[0];
            console.log('✅ Firebase ya inicializado');
            return;
        }

        // Verificar variables de entorno
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;

        if (!projectId || !clientEmail || !privateKey) {
            console.log('⚠️ Firebase no configurado - Faltan variables de entorno');
            console.log('   Necesitas: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
            return;
        }

        try {
            this.app = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: projectId,
                    clientEmail: clientEmail,
                    // Reemplazar \\n con saltos de línea reales
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                }),
            });
            console.log('✅ Firebase Admin inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando Firebase:', error);
        }
    }

    /**
     * Enviar notificación push a un dispositivo específico
     */
    async sendPushNotification(
        fcmToken: string,
        title: string,
        body: string,
        data?: Record<string, string>,
    ): Promise<boolean> {
        if (!this.app) {
            console.log('⚠️ Firebase no inicializado - Notificación no enviada');
            return false;
        }

        try {
            const message: admin.messaging.Message = {
                token: fcmToken,
                notification: {
                    title,
                    body,
                },
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        channelId: 'alertavision_alerts',
                    },
                },
                data: data || {},
            };

            const response = await admin.messaging().send(message);
            console.log('✅ Notificación enviada:', response);
            return true;
        } catch (error) {
            console.error('❌ Error enviando notificación:', error);
            return false;
        }
    }

    /**
     * Enviar notificación de fatiga detectada
     */
    async sendFatigueAlert(fcmToken: string): Promise<boolean> {
        return this.sendPushNotification(
            fcmToken,
            '🚨 ¡Fatiga Detectada!',
            'Se ha detectado microsueño. Toma un descanso.',
            { type: 'fatigue_alert' },
        );
    }

    /**
     * Enviar notificación de batería baja
     */
    async sendLowBatteryAlert(fcmToken: string, level: number): Promise<boolean> {
        return this.sendPushNotification(
            fcmToken,
            '🔋 Batería Baja',
            `Tus lentes tienen ${level}% de batería. Cárgalos pronto.`,
            { type: 'low_battery', level: String(level) },
        );
    }

    /**
     * Enviar notificación de batería crítica
     */
    async sendCriticalBatteryAlert(fcmToken: string): Promise<boolean> {
        return this.sendPushNotification(
            fcmToken,
            '⚠️ ¡Batería Crítica!',
            'Tus lentes están por apagarse. Deja de conducir y cárgalos.',
            { type: 'critical_battery' },
        );
    }
}
