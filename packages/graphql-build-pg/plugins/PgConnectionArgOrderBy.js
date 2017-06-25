const { GraphQLEnumType } = require("graphql");

module.exports = function PgConnectionArgOrderBy(
  builder,
  { pgInflection: inflection }
) {
  builder.hook(
    "schema",
    (
      schema,
      {
        buildObjectWithHooks,
        pgSql: sql,
        pgIntrospectionResultsByKind: introspectionResultsByKind,
        getTypeByName,
        pgGqlTypeByTypeId,
      }
    ) => {
      introspectionResultsByKind.class.map(table => {
        /* const TableOrderByType = */
        buildObjectWithHooks(
          GraphQLEnumType,
          {
            name: inflection.orderByType(
              inflection.tableType(table.name, table.namespace.name)
            ),
            values: {
              NATURAL: {
                value: null,
              },
              // XXX: add the (indexed?) columns
            },
          },
          {
            pgIntrospection: table,
            isPgRowSortEnum: true,
          }
        );
      });
      return schema;
    }
  );
  builder.hook(
    "field:args",
    (
      args,
      { extend, getTypeByName, buildObjectWithHooks },
      {
        scope: { isPgConnectionField, pgIntrospection: table },
        addArgDataGenerator,
      }
    ) => {
      if (!isPgConnectionField || !table || !table.kind === "class") {
        return args;
      }
      const TableOrderByType = getTypeByName(
        inflection.orderByType(
          inflection.tableType(table.name, table.namespace.name)
        )
      );

      addArgDataGenerator(function connectionOrderBy({ orderBy }) {
        return {
          pgQuery: queryBuilder => {
            if (orderBy != null) {
              queryBuilder.orderBy(...orderBy);
            }
          },
        };
      });

      return extend(args, {
        orderBy: {
          type: TableOrderByType,
        },
      });
    }
  );
};
