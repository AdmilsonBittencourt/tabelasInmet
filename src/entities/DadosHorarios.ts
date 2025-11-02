import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('dados_horarios')
export class DadosHorarios {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'date' })
    DT_MEDICAO: string;

    @Column({ type: 'varchar', length: 5, nullable: true })
    HR_MEDICAO: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    TEM_MIN: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    TEM_MAX: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    UMD_MAX: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    UMD_MIN: number | null;

    @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
    CHUVA: number | null;

    @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
    RAD_GLO: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    VEN_VEL: number | null;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    VEN_RAJ: number | null;

    @Column({ type: 'varchar', length: 10, nullable: true })
    VEN_DIR: string | null;

    @Column({ type: 'varchar', length: 10, nullable: true })
    stationCode: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

