import "graphile-build";
import "./PgTablesPlugin";
import "../interfaces";

import type { PgTypeCodec } from "@dataplan/pg";
import type { Plugin } from "graphile-plugin";
import type { GraphQLType } from "graphql";
import sql from "pg-sql2";

import { version } from "../index";
import type { PgTypeCodecMetaLookup } from "../inputUtils";
import {
  getCodecMetaLookupFromInput,
  makePgTypeCodecMeta,
} from "../inputUtils";

type HasGraphQLTypeForPgCodec = (
  codec: PgTypeCodec<any, any, any>,
  situation?: string,
) => boolean;
type GetGraphQLTypeByPgCodec = (
  codec: PgTypeCodec<any, any, any>,
  situation: string,
) => GraphQLType | null;
type GetGraphQLTypeNameByPgCodec = (
  codec: PgTypeCodec<any, any, any>,
  situation: string,
) => string | null;
type SetGraphQLTypeForPgCodec = (
  codec: PgTypeCodec<any, any, any>,
  situations: string | string[],
  typeName: string,
) => void;

declare global {
  namespace GraphileEngine {
    interface Build {
      pgCodecMetaLookup: PgTypeCodecMetaLookup;
      hasGraphQLTypeForPgCodec: HasGraphQLTypeForPgCodec;
      getGraphQLTypeByPgCodec: GetGraphQLTypeByPgCodec;
      getGraphQLTypeNameByPgCodec: GetGraphQLTypeNameByPgCodec;
      setGraphQLTypeForPgCodec: SetGraphQLTypeForPgCodec;
      sql: typeof sql;
    }
  }
}

export const PgBasicsPlugin: Plugin = {
  name: "PgBasicsPlugin",
  description:
    "Basic utilities required by many other graphile-build-pg plugins.",
  version: version,

  schema: {
    hooks: {
      build(build) {
        const pgCodecMetaLookup = getCodecMetaLookupFromInput(build.input);

        const getGraphQLTypeNameByPgCodec: GetGraphQLTypeNameByPgCodec = (
          codec,
          situation,
        ) => {
          const meta = pgCodecMetaLookup.get(codec);
          if (!meta) {
            throw new Error(
              `Codec '${
                sql.compile(codec.sqlType).text
              }' does not have an entry in pgCodecMetaLookup, someone needs to call setGraphQLTypeForPgCodec passing this codec.`,
            );
          }
          const typeName = meta.typeNameBySituation[situation] ?? null;
          return typeName ?? null;
        };

        const getGraphQLTypeByPgCodec: GetGraphQLTypeByPgCodec = (
          codec,
          situation,
        ) => {
          const typeName = getGraphQLTypeNameByPgCodec(codec, situation);
          return typeName ? build.getTypeByName(typeName) ?? null : null;
        };

        const hasGraphQLTypeForPgCodec: HasGraphQLTypeForPgCodec = (
          codec,
          situation,
        ) => {
          const meta = pgCodecMetaLookup.get(codec);
          if (!meta) {
            return false;
          }
          if (situation != null) {
            const typeName = meta.typeNameBySituation[situation] ?? null;
            return typeName != null;
          } else {
            return Object.keys(meta.typeNameBySituation).length > 0;
          }
        };

        const setGraphQLTypeForPgCodec: SetGraphQLTypeForPgCodec = (
          codec,
          variants,
          typeName,
        ) => {
          build.assertTypeName(typeName);

          let meta = pgCodecMetaLookup.get(codec);
          if (!meta) {
            meta = makePgTypeCodecMeta(codec);
            pgCodecMetaLookup.set(codec, meta);
          }

          const situations_ = Array.isArray(variants) ? variants : [variants];
          for (const situation of situations_) {
            if (meta.typeNameBySituation[situation] != null) {
              // TODO: allow this?
              throw new Error("Type already set");
            }
            meta.typeNameBySituation[situation] = typeName;
          }
        };

        return build.extend(
          build,
          {
            pgCodecMetaLookup,
            getGraphQLTypeNameByPgCodec,
            getGraphQLTypeByPgCodec,
            hasGraphQLTypeForPgCodec,
            setGraphQLTypeForPgCodec,
            sql,
            // For slightly better backwards compatibility with v4.
            pgSql: sql,
          },
          "Adding helpers from PgBasicsPlugin",
        );
      },
    },
  },
};
