import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('resumo_anual')
export class ResumoAnual {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int', unique: true })
    ano: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    temperaturaMaximaAno: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    temperaturaMinimaAno: number | null;

    @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
    precipitacaoTotalAno: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    radiacaoSolarTotalAno: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    maiorRajadaVentoAno: number | null;

    @Column({ type: 'varchar', length: 10, nullable: true })
    direcaoMaiorRajadaAno: string | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    mediaAnualDasTempMaximas: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    temperaturaMediaAnual: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    ventoMediaAnual: number | null;

    @Column({ type: 'int', default: 0 })
    mesesComDados: number;

    @Column({ type: 'varchar', length: 10, nullable: true })
    stationCode: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

