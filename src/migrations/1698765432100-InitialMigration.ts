import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';
import { ORDER_STATUS, PAYMENT_TYPE } from '../common/constants';
// database querylarni optimallashtirish

// integration testlar yaratildi
export class InitialMigration1698765432100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'telegramId', type: 'varchar', isUnique: true },
          { name: 'fullName', type: 'varchar' },
          { name: 'phone', type: 'varchar', isNullable: true },
          { name: 'isAdmin', type: 'boolean', default: false },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
    await queryRunner.createTable(
      new Table({
        name: 'category',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'name', type: 'varchar' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // Product jadvali
    await queryRunner.createTable(
      new Table({
        name: 'product',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'name', type: 'varchar' },
          { name: 'description', type: 'text' },
          { name: 'price', type: 'float' },
          { name: 'imageUrl', type: 'varchar' },
          { name: 'stock', type: 'int' },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'categoryId', type: 'int' },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // Cart jadvali
    await queryRunner.createTable(
      new Table({
        name: 'cart',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'userId', type: 'int' },
          { name: 'productId', type: 'int' },
          { name: 'quantity', type: 'int' },
        ],
      }),
      true,
    );

    // Order jadvali
    await queryRunner.createTable(
      new Table({
        name: 'order',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'userId', type: 'int' },
          { name: 'totalAmount', type: 'float' },
          { name: 'status', type: 'enum', enum: Object.values(ORDER_STATUS) },
          { name: 'paymentType', type: 'enum', enum: Object.values(PAYMENT_TYPE), isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // OrderItem jadvali
    await queryRunner.createTable(
      new Table({
        name: 'order_item',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'orderId', type: 'int' },
          { name: 'productId', type: 'int' },
          { name: 'quantity', type: 'int' },
          { name: 'price', type: 'float' },
        ],
      }),
      true,
    );

    // Feedback jadvali
    await queryRunner.createTable(
      new Table({
        name: 'feedback',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'userId', type: 'int' },
          { name: 'productId', type: 'int' },
          { name: 'rating', type: 'int' },
          { name: 'comment', type: 'text' },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // Payment jadvali
    await queryRunner.createTable(
      new Table({
        name: 'payment',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'orderId', type: 'int' },
          { name: 'paymentType', type: 'enum', enum: Object.values(PAYMENT_TYPE) },
          { name: 'amount', type: 'float' },
          { name: 'status', type: 'varchar' },
          { name: 'transactionId', type: 'varchar', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // Promocode jadvali
    await queryRunner.createTable(
      new Table({
        name: 'promocode',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'code', type: 'varchar', isUnique: true },
          { name: 'discountPercent', type: 'int' },
          { name: 'validTill', type: 'timestamp' },
          { name: 'isActive', type: 'boolean', default: true },
        ],
      }),
      true,
    );

    // Foreign Key'lar
    await queryRunner.createForeignKey(
      'product',
      new TableForeignKey({
        columnNames: ['categoryId'],
        referencedTableName: 'category',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'cart',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'cart',
      new TableForeignKey({
        columnNames: ['productId'],
        referencedTableName: 'product',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'order',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'order_item',
      new TableForeignKey({
        columnNames: ['orderId'],
        referencedTableName: 'order',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'order_item',
      new TableForeignKey({
        columnNames: ['productId'],
        referencedTableName: 'product',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'feedback',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'feedback',
      new TableForeignKey({
        columnNames: ['productId'],
        referencedTableName: 'product',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'payment',
      new TableForeignKey({
        columnNames: ['orderId'],
        referencedTableName: 'order',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('payment', 'FK_payment_orderId_order_id');
    await queryRunner.dropForeignKey('feedback', 'FK_feedback_productId_product_id');
    await queryRunner.dropForeignKey('feedback', 'FK_feedback_userId_user_id');
    await queryRunner.dropForeignKey('order_item', 'FK_order_item_productId_product_id');
    await queryRunner.dropForeignKey('order_item', 'FK_order_item_orderId_order_id');
    await queryRunner.dropForeignKey('order', 'FK_order_userId_user_id');
    await queryRunner.dropForeignKey('cart', 'FK_cart_productId_product_id');
    await queryRunner.dropForeignKey('cart', 'FK_cart_userId_user_id');
    await queryRunner.dropForeignKey('product', 'FK_product_categoryId_category_id');

    await queryRunner.dropTable('promocode');
    await queryRunner.dropTable('payment');
    await queryRunner.dropTable('feedback');
    await queryRunner.dropTable('order_item');
    await queryRunner.dropTable('order');
    await queryRunner.dropTable('cart');
    await queryRunner.dropTable('product');
    await queryRunner.dropTable('category');
    await queryRunner.dropTable('user');
  }
}