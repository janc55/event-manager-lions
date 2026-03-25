import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPhotoAndLionNumberToParticipant1711322100000
    implements MigrationInterface {
    name = 'AddPhotoAndLionNumberToParticipant1711322100000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('participants', [
            new TableColumn({
                name: 'lion_number',
                type: 'varchar',
                length: '50',
                isNullable: true,
            }),
            new TableColumn({
                name: 'photo_url',
                type: 'text',
                isNullable: true,
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('participants', 'photo_url');
        await queryRunner.dropColumn('participants', 'lion_number');
    }
}
