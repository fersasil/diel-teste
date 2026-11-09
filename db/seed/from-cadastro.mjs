import { readFileSync, writeFileSync } from "node:fs";

const days = {
  seg: "mon",
  ter: "tue",
  qua: "wed",
  qui: "thu",
  sex: "fri",
  sab: "sat",
  dom: "sun",
};

const profiles = {
  admin_diel: "diel_operator",
  gestor_cliente: "network_manager",
  gerente_loja: "store_manager",
};

const source = JSON.parse(readFileSync(new URL("../../data/cadastro.json", import.meta.url), "utf8"));

function hours(input) {
  const mapped = {};
  for (const [from, to] of Object.entries(days)) {
    const window = input?.[from];
    mapped[to] = Array.isArray(window) ? [window] : [];
  }
  return mapped;
}

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function json(value) {
  return `$${""}$${JSON.stringify(value)}$${""}$::jsonb`;
}

const lines = [
  "-- Generated from data/cadastro.json. password_hash is scrypt, not the example password.",
];

lines.push("INSERT INTO clients (id, name, segment) VALUES");
lines.push(source.clientes.map((client) =>
  `    (${quote(client.id)}, ${quote(client.nome)}, ${quote(client.segmento)})`).join(",\n"));
lines.push("ON CONFLICT (id) DO NOTHING;");

lines.push("INSERT INTO stores (id, client_id, name, type, city, uf, latitude, longitude, timezone, operating_hours) VALUES");
lines.push(source.lojas.map((store) => `    (${[
  quote(store.id),
  quote(store.cliente_id),
  quote(store.nome),
  quote(store.tipo),
  quote(store.cidade),
  quote(store.uf),
  store.latitude,
  store.longitude,
  quote(store.fuso_horario),
  json(hours(store.horario_funcionamento)),
].join(", ")})`).join(",\n"));
lines.push("ON CONFLICT (id) DO NOTHING;");

lines.push(`INSERT INTO environments (
    id, store_id, name, comfort_min, comfort_max, operating_hours, dev_id
) VALUES`);
lines.push(source.ambientes.map((environment) => `    (${[
  quote(environment.id),
  quote(environment.loja_id),
  quote(environment.nome),
  environment.faixa_conforto_c.min,
  environment.faixa_conforto_c.max,
  json(hours(environment.horario_funcionamento)),
  quote(environment.dev_id),
].join(", ")})`).join(",\n"));
lines.push("ON CONFLICT (id) DO NOTHING;");

lines.push(`INSERT INTO users (
    id, name, email, password_hash, profile, client_id, allowed_store_ids
) VALUES`);
lines.push(source.usuarios.map((user) => {
  const stores = Array.isArray(user.lojas) ? user.lojas : [];
  const client = user.cliente_id === null ? "NULL" : quote(user.cliente_id);
  const allowed = stores.length === 0
    ? "'{}'"
    : `ARRAY[${stores.map(quote).join(", ")}]`;
  return `    (${[
    quote(user.id),
    quote(user.nome),
    quote(user.email),
    quote("scrypt:6469656c2d666978747572652d7631:120494ae69867f80321c67e6b696ae9076bee044979168fc42dd4391fb88f51c"),
    quote(profiles[user.perfil]),
    client,
    allowed,
  ].join(", ")})`;
}).join(",\n"));
lines.push("ON CONFLICT (id) DO NOTHING;");

writeFileSync(new URL("./fixtures.sql", import.meta.url), `${lines.join("\n")}\n`);
