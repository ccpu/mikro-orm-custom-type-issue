import { Entity, MikroORM, PrimaryKey, Property } from "@mikro-orm/sqlite";
import { Type } from "@mikro-orm/core";

export class JsonStringType extends Type<any, string> {
  convertToDatabaseValue(value: any): string {
    if (value === null || value === undefined) {
      return "";
    }

    return JSON.stringify(value);
  }

  convertToJsValue(value: string): any {
    if (value === null || value === undefined) {
      return null;
    }
    return JSON.parse(value);
  }

  getColumnType(): string {
    return "text";
  }
}

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property({
    type: JsonStringType,
  })
  json!: object;
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
  const em = orm.em.fork();

  em.create(User, {
    json: { foo: 1, id: 1 },
  });

  await em.flush();

  await em.clear();

  const result = await em.findAll(User);

  expect(result).toBe([{ foo: 1, id: 1 }]);
});
