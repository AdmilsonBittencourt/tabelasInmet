import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';
import { DadosHorarios } from '../entities/DadosHorarios';
import { DadosDiarios } from '../entities/DadosDiarios';
import { ResumoMensal } from '../entities/ResumoMensal';
import { ResumoAnual } from '../entities/ResumoAnual';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'apiinmet',
    synchronize: process.env.NODE_ENV !== 'production', // Cria/atualiza tabelas automaticamente (apenas em dev)
    logging: process.env.NODE_ENV === 'development',
    entities: [DadosHorarios, DadosDiarios, ResumoMensal, ResumoAnual],
    migrations: [path.join(__dirname, '../migrations/*.{ts,js}')],
    subscribers: [path.join(__dirname, '../subscribers/*.{ts,js}')],
});

