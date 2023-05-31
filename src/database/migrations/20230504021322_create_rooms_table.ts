import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable('rooms', function (table) {
      table.increments('id').primary();
      table.string('room_code', 4).notNullable();
      table.string('running_on_instance', 8);
      table.timestamps();
    });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('rooms');
}

