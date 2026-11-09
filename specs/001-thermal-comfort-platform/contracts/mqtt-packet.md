# MQTT packet

O simulador publica no broker com QoS 1. Os workers assinam a mesma
subscription compartilhada. A API não assina.

## Payload

JSON em inglês:

- `deviceId`: dispositivo já cadastrado em um ambiente
- `timestamp`: instante UTC da amostra mais nova
- `intervalSeconds`: distância entre amostras, maior que zero
- `readings`: números, do mais antigo ao mais novo, ao menos um
- `savedData`: verdadeiro quando o pacote é atrasado

A amostra `i` ocorre em `timestamp - (N - 1 - i) * intervalSeconds`. A
última coincide com `timestamp`.

## Aceite

Dispositivo desconhecido não gera amostra. A leitura fica registrada como
anomalia com `reason` `UNKNOWN_DEVICE` quando der para guardar o valor, e
o pacote bruto ainda entra no lote. Leitura fora de −10 a 60 vira
`OUT_OF_RANGE` e não entra na série. As demais são enriquecidas e gravadas.

`savedData` verdadeiro marca `isDelayedPacket` e usa o instante histórico.
Não usa o relógio de parede.

## ACK

PUBACK só depois do objeto `.jsonl.gz` no bucket e do commit das amostras
desse lote. Falha de qualquer um dos dois retém o ACK. O retry do mesmo
conjunto de pacotes regrava o mesmo objeto e as mesmas linhas.
