import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
  TableUnique,
} from 'typeorm';

export class Init1710943200000 implements MigrationInterface {
  name = 'Init1710943200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'full_name', type: 'varchar', length: '150' },
          { name: 'email', type: 'varchar', length: '160', isUnique: true },
          { name: 'password_hash', type: 'varchar', length: '255' },
          { name: 'role', type: 'varchar', length: '20', default: "'operator'" },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'participants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'registration_code', type: 'varchar', length: '50', isUnique: true },
          { name: 'first_name', type: 'varchar', length: '100' },
          { name: 'last_name', type: 'varchar', length: '100' },
          { name: 'badge_name', type: 'varchar', length: '120', isNullable: true },
          { name: 'document_number', type: 'varchar', length: '50', isNullable: true },
          { name: 'country', type: 'varchar', length: '80' },
          { name: 'district', type: 'varchar', length: '80', isNullable: true },
          { name: 'club', type: 'varchar', length: '120', isNullable: true },
          { name: 'role_title', type: 'varchar', length: '120', isNullable: true },
          { name: 'email', type: 'varchar', length: '160' },
          { name: 'phone', type: 'varchar', length: '30', isNullable: true },
          { name: 'participant_type', type: 'varchar', length: '60' },
          { name: 'special_requirements', type: 'text', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'qr_code', type: 'varchar', length: '120', isUnique: true },
          { name: 'status', type: 'varchar', length: '30', default: "'pre_registered'" },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'participants',
      new TableIndex({
        name: 'IDX_participants_document_number',
        columnNames: ['document_number'],
      }),
    );
    await queryRunner.createIndex(
      'participants',
      new TableIndex({
        name: 'IDX_participants_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'activities',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'name', type: 'varchar', length: '160' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'date', type: 'date' },
          { name: 'start_time', type: 'time' },
          { name: 'end_time', type: 'time', isNullable: true },
          { name: 'location', type: 'varchar', length: '150' },
          { name: 'capacity', type: 'int', isNullable: true },
          { name: 'activity_type', type: 'varchar', length: '60' },
          { name: 'status', type: 'varchar', length: '20', default: "'draft'" },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'participant_id', type: 'uuid' },
          { name: 'concept', type: 'varchar', length: '120' },
          { name: 'expected_amount', type: 'decimal', precision: 10, scale: 2 },
          { name: 'paid_amount', type: 'decimal', precision: 10, scale: 2, default: 0 },
          { name: 'balance', type: 'decimal', precision: 10, scale: 2, default: 0 },
          { name: 'status', type: 'varchar', length: '20', default: "'pending'" },
          { name: 'voucher_file', type: 'varchar', length: '255', isNullable: true },
          { name: 'reviewed_by', type: 'uuid', isNullable: true },
          { name: 'reviewed_at', type: 'timestamp', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'attendance_records',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'participant_id', type: 'uuid' },
          { name: 'activity_id', type: 'uuid', isNullable: true },
          { name: 'attendance_type', type: 'varchar', length: '20' },
          { name: 'scanned_by', type: 'uuid', isNullable: true },
          { name: 'scanned_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createUniqueConstraint(
      'attendance_records',
      new TableUnique({
        name: 'UQ_attendance_once',
        columnNames: ['participant_id', 'attendance_type', 'activity_id'],
      }),
    );
    await queryRunner.createIndex(
      'attendance_records',
      new TableIndex({
        name: 'IDX_attendance_activity_participant',
        columnNames: ['activity_id', 'participant_id'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'delivery_records',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'participant_id', type: 'uuid' },
          { name: 'delivery_type', type: 'varchar', length: '20' },
          { name: 'scanned_by', type: 'uuid', isNullable: true },
          { name: 'delivered_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createUniqueConstraint(
      'delivery_records',
      new TableUnique({
        name: 'UQ_delivery_once',
        columnNames: ['participant_id', 'delivery_type'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'user_id', type: 'uuid', isNullable: true },
          { name: 'action', type: 'varchar', length: '120' },
          { name: 'entity', type: 'varchar', length: '120' },
          { name: 'entity_id', type: 'varchar', length: '120' },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('payments', [
      new TableForeignKey({
        columnNames: ['participant_id'],
        referencedTableName: 'participants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['reviewed_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);

    await queryRunner.createForeignKeys('attendance_records', [
      new TableForeignKey({
        columnNames: ['participant_id'],
        referencedTableName: 'participants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['activity_id'],
        referencedTableName: 'activities',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['scanned_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);

    await queryRunner.createForeignKeys('delivery_records', [
      new TableForeignKey({
        columnNames: ['participant_id'],
        referencedTableName: 'participants',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['scanned_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('audit_logs', true);
    await queryRunner.dropTable('delivery_records', true);
    await queryRunner.dropTable('attendance_records', true);
    await queryRunner.dropTable('payments', true);
    await queryRunner.dropTable('activities', true);
    await queryRunner.dropTable('participants', true);
    await queryRunner.dropTable('users', true);
  }
}
