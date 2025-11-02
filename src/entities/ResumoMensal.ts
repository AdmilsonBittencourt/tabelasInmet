import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('resumo_mensal')
export class ResumoMensal {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    ano: number;

    @Column({ type: 'int' })
    mes: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    temperaturaMaximaMes: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    mediaTemperaturasMaximas: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    temperaturaMinimaMes: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    temperaturaMediaMes: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    umidadeMaximaMes: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    umidadeMinimaMes: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    umidadeMediaMes: number | null;

    @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
    precipitacaoTotalMes: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    radiacaoSolarTotalMes: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    ventoMediaMes: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    maiorRajadaVentoMes: number | null;

    @Column({ type: 'varchar', length: 10, nullable: true })
    direcaoMaiorRajada: string | null;

    @Column({ type: 'varchar', length: 10, nullable: true })
    stationCode: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

