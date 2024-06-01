import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactEntity } from './contact.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow('PG_HOST'),
        port: parseInt(configService.getOrThrow('PG_PORT')),
        username: configService.getOrThrow('PG_USERNAME'),
        password: configService.getOrThrow('PG_PASSWORD'),
        database: configService.getOrThrow('PG_DATABASE'),
        entities: [ContactEntity],
        synchronize: true,
      })
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
