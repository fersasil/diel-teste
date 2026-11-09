export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Celsius 360",
    version: "1.0.0",
    description: "API da visão da rede, do detalhe do ambiente e da ingestão consultável.",
  },
  servers: [{ url: "/api/v1" }],
  components: {
    securitySchemes: {
      bearer: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Page: {
        type: "object",
        properties: {
          page: { type: "integer" },
          pageSize: { type: "integer" },
          total: { type: "integer" },
        },
      },
    },
  },
  security: [{ bearer: [] }],
  paths: {
    "/auth/login": {
      post: {
        security: [],
        summary: "Entra com o e-mail do cadastro",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: {
          email: { type: "string" }, password: { type: "string" },
        } } } } },
        responses: { "200": { description: "accessToken e perfil" }, "401": { description: "INVALID_CREDENTIALS" } },
      },
    },
    "/auth/session": {
      get: { summary: "Sessão atual", responses: { "200": { description: "perfil, cliente em foco" } } },
    },
    "/auth/focus-client": {
      post: {
        summary: "Operador Diel escolhe um cliente",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: {
          clientId: { type: "string" },
        } } } } },
        responses: { "200": { description: "foco gravado" }, "403": { description: "FORBIDDEN" } },
      },
    },
    "/clients": {
      get: {
        summary: "Clientes, só para a operadora",
        parameters: pageParams(),
        responses: { "200": { description: "página de clientes" }, "403": { description: "FORBIDDEN" } },
      },
    },
    "/stores": {
      get: {
        summary: "Lojas com conforto do período e ambientes fora da faixa",
        parameters: [...pageParams(), periodParam(), filterParams()],
        responses: { "200": { description: "página de lojas" } },
      },
    },
    "/stores/summary": {
      get: { summary: "Painel do cliente em foco", responses: { "200": { description: "totais e alertas" } } },
    },
    "/environments": {
      get: {
        summary: "Ambientes com status, conforto do período e quantos da loja estão fora da faixa",
        parameters: [...pageParams(), periodParam(), filterParams(), { name: "sort", in: "query", schema: { type: "string", enum: ["store", "environment", "comfort", "device"] } }],
        responses: { "200": { description: "página de ambientes" } },
      },
    },
    "/environments/options": {
      get: { summary: "Opções de filtro de loja e ambiente", responses: { "200": { description: "listas curtas" } } },
    },
    "/environments/{id}/summary": {
      get: {
        summary: "Resumo do ambiente no período, ancorado no relógio da ingestão",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }, periodParam(), dateParam(), ...dayRange()],
        responses: { "200": { description: "conforto, dispositivo, asOf e última leitura" } },
      },
    },
    "/environments/{id}/timeseries": {
      get: {
        summary: "Série agregada do ambiente",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          periodParam(),
          dateParam(),
          ...dayRange(),
          { name: "bucket", in: "query", schema: { type: "string", enum: ["15m", "30m", "1h", "1d", "1w", "1mo"] } },
        ],
        responses: { "200": { description: "pontos, lacunas e temperatura externa" } },
      },
    },
    "/storage/raw-batches": {
      get: {
        summary: "Lotes crus do dia",
        parameters: [{ name: "date", in: "query", schema: { type: "string", format: "date" } }],
        responses: { "200": { description: "lotes do cliente em foco" } },
      },
    },
  },
};

function pageParams() {
  return [
    { name: "page", in: "query", schema: { type: "integer" } },
    { name: "pageSize", in: "query", schema: { type: "integer" } },
  ];
}

function periodParam() {
  return { name: "period", in: "query", schema: { type: "string", enum: ["1d", "7d", "30d"] } };
}

function dateParam() {
  return { name: "date", in: "query", schema: { type: "string", format: "date" } };
}

function dayRange() {
  return [
    { name: "from", in: "query", schema: { type: "string" }, description: "Dia local AAAA-MM-DD ou instante ISO" },
    { name: "to", in: "query", schema: { type: "string" }, description: "Dia local AAAA-MM-DD ou instante ISO" },
  ];
}

function filterParams() {
  return [
    { name: "storeId", in: "query", schema: { type: "string" } },
    { name: "environmentName", in: "query", schema: { type: "string" } },
    { name: "comfortStatus", in: "query", schema: { type: "string", enum: ["IN_RANGE", "ABOVE", "BELOW", "NO_DATA"] } },
    { name: "deviceStatus", in: "query", schema: { type: "string", enum: ["ONLINE", "OFFLINE", "NO_DATA"] } },
    { name: "dir", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
  ];
}
