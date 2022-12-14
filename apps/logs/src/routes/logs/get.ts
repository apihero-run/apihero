import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import invariant from "tiny-invariant";
import { z } from "zod";
import {
  ErrorObjectSchema,
  GetLogsQuerySchema,
  GetLogsSuccessResponseSchema,
  GetLogsQuery,
} from "internal-logs";
import { databaseToLog } from "../../utilities/log-conversion";
import { namedParameters } from "../../utilities/named-sql";

const logsToken = process.env.API_AUTHENTICATION_TOKEN;
invariant(logsToken, "API_AUTHENTICATION_TOKEN is required");

const pageSize = 40;

const logs: FastifyPluginAsync = async (app, opts): Promise<void> => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/:projectId",
    schema: {
      params: z.object({
        projectId: z.string(),
      }),
      headers: z.object({
        authorization: z.string(),
      }),
      querystring: GetLogsQuerySchema,
      response: {
        200: GetLogsSuccessResponseSchema,
        "4xx": ErrorObjectSchema,
        "5xx": ErrorObjectSchema,
      },
    },
    handler: async (request, reply) => {
      if (request.headers.authorization !== `Bearer ${logsToken}`) {
        reply.status(403).send({
          statusCode: 403,
          error: "Forbidden",
          message: "Incorrect authorization",
        });
        return;
      }

      if (
        request.params.projectId === undefined ||
        request.params.projectId === ""
      ) {
        reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: "projectId is required",
        });
        return;
      }

      //get the correct project id
      let query = `SELECT * FROM "Log" WHERE project_id = :projectId`;
      const queryParams: Record<string, string | number | boolean> = {
        projectId: request.params.projectId,
      };

      //api
      if (request.query.api !== undefined) {
        query += ` AND base_url LIKE '%' || :api || '%'`;
        queryParams.api = request.query.api.replaceAll("*", "%");
      }

      //path
      if (request.query.path !== undefined) {
        query += ` AND path LIKE '%' || :path || '%'`;
        queryParams.path = request.query.path.replaceAll("*", "%");
      }

      //status codes, including wildcards like 2**, 3**
      if (request.query.status !== undefined) {
        let statusCodes: number[] = [];

        request.query.status.forEach((status) => {
          if (status.includes("*")) {
            const startAt = parseInt(status[0]) * 100;
            for (let i = startAt; i < startAt + 100; i++) {
              statusCodes.push(i);
            }
          } else {
            statusCodes.push(parseInt(status));
          }
        });

        query += ` AND status_code IN (${statusCodes
          .map((_, i) => `:status${i}`)
          .join(",")})`;
        statusCodes.forEach((status, i) => {
          queryParams[`status${i}`] = status;
        });
      }

      //caching
      if (request.query.cached !== undefined) {
        query += ` AND is_cache_hit = :cached`;
        queryParams.cached = request.query.cached;
      }

      //date range
      if ("days" in request.query) {
        query += ` AND time >= NOW() - INTERVAL '1 days' * :days`;
        queryParams.days = request.query.days;
      } else {
        query += ` AND time >= :start AND time <= :end`;
        queryParams.start = request.query.start;
        queryParams.end = request.query.end;
      }

      //order and limit
      query += ` ORDER BY time DESC LIMIT :pageSize OFFSET :page`;
      queryParams.pageSize = pageSize + 1;
      queryParams.page = (request.query.page - 1) * pageSize;

      const origin = `${request.protocol}://${request.hostname}`;

      const parameterisedQuery = namedParameters(query, queryParams);

      try {
        const queryResult = await app.pg.pool.query(parameterisedQuery);
        const logs = queryResult.rows
          .map((l) => databaseToLog(l))
          .slice(0, pageSize);

        reply.send({
          logs,
          page: request.query.page,
          next:
            queryResult.rows.length > pageSize
              ? getPageUrl(
                  origin,
                  request.params.projectId,
                  request.query,
                  request.query.page + 1
                )
              : undefined,
          previous:
            request.query.page > 1
              ? getPageUrl(
                  origin,
                  request.params.projectId,
                  request.query,
                  request.query.page - 1
                )
              : undefined,
        });
      } catch (error) {
        reply.status(500).send({
          statusCode: 500,
          error: "Internal error",
          message: JSON.stringify(error),
        });
      }
    },
  });
};

function getPageUrl(
  origin: string,
  projectId: string,
  query: GetLogsQuery,
  page: number
): string {
  //query to URL search params
  const searchParams = new URLSearchParams();
  if ("days" in query) {
    searchParams.set("days", query.days.toString());
  } else {
    searchParams.set("start", query.start);
    searchParams.set("end", query.end);
  }
  searchParams.set("page", page.toString());

  return `${origin}/logs/${projectId}?${searchParams.toString()}`;
}

export default logs;
