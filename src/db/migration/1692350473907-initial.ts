import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1692350473907 implements MigrationInterface {
  name = "Initial1692350473907";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "drip" ("id" SERIAL NOT NULL, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), "assetId" bigInt NOT NULL, "addressSha256" character varying NOT NULL, CONSTRAINT "PK_869cd028514a4d3cd3e359d3844" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_7d20734bce30abacefeed7dd4d" ON "drip" ("addressSha256") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_7d20734bce30abacefeed7dd4d"`);
    await queryRunner.query(`DROP TABLE "drip"`);
  }
}
