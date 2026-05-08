// apps/backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Habilitar validaciones automáticas de datos en los endpoints
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Configuración de la documentación interactiva con Swagger
  const config = new DocumentBuilder()
    .setTitle('River Plate App - API')
    .setDescription('Servidor API REST para la gestión de partidos, plantel, noticias y formaciones del Más Grande.')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu token JWT para acceder a las rutas protegidas',
        in: 'header',
      },
      'JWT-auth', // Nombre de la referencia de seguridad
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Configurar CORS para permitir que tu futuro Frontend se conecte
  app.enableCors();

  // El servidor escuchará en el puerto 3000 por defecto
  await app.listen(3000);
  console.log('🏁 Servidor corriendo en: http://localhost:3000');
  console.log('📖 Documentación de Swagger en: http://localhost:3000/api');
}
bootstrap();