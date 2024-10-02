import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Drip {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  timestamp: string;

  @Column()
  @Index()
  assetId: number;

  @Column()
  @Index()
  addressSha256: string;
}
