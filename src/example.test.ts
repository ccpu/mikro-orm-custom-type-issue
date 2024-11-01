import { Entity, MikroORM, PrimaryKey, Property } from "@mikro-orm/sqlite";
import { Type } from "@mikro-orm/core";
import { parse as uuidParse, stringify as uuidStringify } from "uuid";

export class UuidBinaryType extends Type<string, Buffer> {
  convertToDatabaseValue(value: string): Buffer {
    // if (typeof value !== "string") return value;
    return Buffer.from(uuidParse(value) as any);
  }

  convertToJSValue(value: Buffer): string {
    return uuidStringify(value as any);
  }

  getColumnType(): string {
    return "binary(16)";
  }
}

@Entity()
class User {
  @PrimaryKey({
    type: UuidBinaryType,
  })
  id!: string;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ":memory:",
    entities: [User],
    debug: ["query", "query-params"],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test("basic CRUD example", async () => {
  const uuid = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

  orm.em.create(User, {
    name: "Foo",
    email: "foo",
    id: uuid,
  });
  await orm.em.flush();
  orm.em.clear();

  await orm.em.nativeUpdate("User", { id: uuid }, { name: "bar" });

  const count = await orm.em.count(User, { name: "bar" });
  expect(count).toBe(1);
});
