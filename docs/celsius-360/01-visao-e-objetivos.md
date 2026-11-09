# 1. Visão geral e objetivos do produto

O Celsius 360 Lite é uma plataforma SaaS multi-tenant para monitoramento
térmico contínuo e gestão de conforto ambiental em redes de varejo e
agências bancárias. O sistema ingere fluxos contínuos de telemetria IoT via
protocolo MQTT, armazena os pacotes brutos em Object Storage (padrão Data
Lake), higieniza anomalias de sensores, cruza leituras com regras de negócio
(horários de expediente e faixas térmicas de conforto) e exibe diagnósticos
operacionais em tempo real.

## 1.1. Metas de negócio e engenharia

Visibilidade operacional: permitir que gestores identifiquem rapidamente
lojas e ambientes fora da faixa de conforto térmico durante o expediente
comercial.

Alta escalabilidade de ingestão bruta (20 GB/dia): armazenar pacotes JSON
crus de forma econômica, durável e totalmente desacoplada do banco
transacional usando Object Storage (MinIO / Amazon S3) particionado e
comprimido com GZIP.

Baixa latência em consultas de séries temporais: responder consultas de
séries temporais de até 30 dias em menos de 100 ms usando Hypertables,
Continuous Aggregates e Gap Filling nativos do PostgreSQL + TimescaleDB.

Observabilidade completa (stack PLG): monitorar métricas, logs estruturados
e saúde da ingestão usando Prometheus + Grafana Loki + Grafana, aliados a
Pino Logger.
