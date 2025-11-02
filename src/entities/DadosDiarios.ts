import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('dados_diarios')
export class DadosDiarios {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'date' })
    DT_MEDICAO: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    TEMP_MAX: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    TEMP_MIN: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    TEMP_MED: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    UMD_MIN: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    UMD_MED: number | null;

    @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
    CHUVA: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    VEN_VEL: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    maiorUmidade: number | null;

    @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
    radiacaoSolar: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    rajadaDeVento: number | null;

    @Column({ type: 'varchar', length: 10, nullable: true })
    direcaoRajada: string | null;

    @Column({ type: 'varchar', length: 10, nullable: true })
    stationCode: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

