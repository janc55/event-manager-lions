import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPartialRegistrationFields1714400000000 implements MigrationInterface {
  name = 'AddPartialRegistrationFields1714400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create the enum type if it doesn't exist
    await queryRunner.query(`CREATE TYPE "participants_registration_type_enum" AS ENUM('FULL', 'PARTIAL')`);

    // 2. Add columns
    await queryRunner.query(`ALTER TABLE "participants" ADD "registration_type" "participants_registration_type_enum" NOT NULL DEFAULT 'FULL'`);
    await queryRunner.query(`ALTER TABLE "participants" ADD "access_rights" text`);

    // 3. Update existing records to have FULL registration (already handled by DEFAULT 'FULL', 
    // but we ensure access_rights is null/empty for them if needed)
    // No action needed since DEFAULT 'FULL' handles existing records.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "participants" DROP COLUMN "access_rights"`);
    await queryRunner.query(`ALTER TABLE "participants" DROP COLUMN "registration_type"`);
    await queryRunner.query(`DROP TYPE "participants_registration_type_enum"`);
  }
}
