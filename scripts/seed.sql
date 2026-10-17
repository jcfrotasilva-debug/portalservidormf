-- Dados de demonstração da plataforma SERVIDOR 360.
-- Espelham uma planilha de pré-cadastro real, inclusive com células vazias.

DELETE FROM ats_quinquenios;
DELETE FROM auditoria;
DELETE FROM importacoes;
DELETE FROM servidores;

INSERT INTO servidores
  (nome, nome_busca, cpf, rgcin, di, dtnasc, tel, email, classe, cargo, categoria, jornada, lotacao, situacao, pendencias, campos_vazios, origem, importacao_id)
VALUES
  ('Mariana Alves de Souza', 'mariana alves de souza', '52998224725', '12.345.678-9 SSP/SP', '2013-03-04', '1988-07-18', '11988776655',
   'mariana.souza@orgao.gov.br', 'Classe B', 'Analista de Gestão Pública', 'Efetivo', '40h/semana', 'Secretaria de Administração', 'Ativo',
   '[]'::jsonb, '[]'::jsonb, 'importacao', NULL),

  ('João Pedro Ferreira', 'joao pedro ferreira', '11144477735', 'MG-9988776', '2019-01-10', '1990-02-02', '31988887777',
   'joao.ferreira@orgao.gov.br', 'Classe A', 'Agente Administrativo', 'Efetivo', '30h/semana', 'Secretaria de Saúde', 'Ativo',
   '["Situação não informada — registrado como \"Ativo\" até revisão do RH."]'::jsonb, '["situacao"]'::jsonb, 'importacao', NULL),

  ('Célia Maria Rocha', 'celia maria rocha', '39053344705', NULL, '2008-06-15', '1979-09-30', '1133445566',
   'celia.rocha@orgao.gov.br', 'Classe C', 'Professora', 'Efetivo', NULL, 'Secretaria de Educação', 'Afastado',
   '["RGCIN não informado no pré-cadastro.", "Jornada vazia — informe a carga horária semanal."]'::jsonb,
   '["rgcin","jornada"]'::jsonb, 'importacao', NULL),

  ('Rafael Teixeira Lima', 'rafael teixeira lima', NULL, '1234567-8', '2016-08-22', NULL, NULL, NULL, NULL,
   'Fiscal de Posturas', NULL, '40h/semana', NULL, 'Ativo',
   '["CPF não informado — complemente o cadastro para habilitar o acesso do servidor.", "Data de nascimento vazia — acesso do servidor liberado apenas por CPF.", "Cargo não informado — obrigatório para cálculo de vantagens por classe.", "Categoria/regime não informado.", "Telefone e e-mail não informados no pré-cadastro.", "Lotação vazia — aloque o servidor em uma unidade."]'::jsonb,
   '["cpf","rgcin","dtnasc","tel","email","classe","categoria","lotacao"]'::jsonb, 'importacao', NULL),

  ('Antônia da Silva Barros', 'antonia da silva barros', '15350946056', 'CIN 4455667', '2001-03-01', '1971-11-11', '62991112233',
   'antonia.barros@orgao.gov.br', 'Classe D', 'Técnica em Enfermagem', 'Efetivo', '36h/semana', 'Hospital Municipal', 'Licença',
   '[]'::jsonb, '[]'::jsonb, 'importacao', NULL),

  ('Bruno Carvalho Mendes', 'bruno carvalho mendes', '25634493005', 'GO-1122334', '2011-09-12', '1985-04-27', '62998887766',
   'bruno.mendes@orgao.gov.br', 'Classe B', 'Auditor Fiscal', 'Efetivo', '40h/semana', 'Secretaria da Fazenda', 'Ativo',
   '[]'::jsonb, '[]'::jsonb, 'manual', NULL),

  ('Luciana Prado Antunes', 'luciana prado antunes', '66036911005', 'SP-7788990', '2021-02-01', '1994-12-05', '11991234567',
   'luciana.antunes@orgao.gov.br', 'Classe A', 'Assistente Social', 'Efetivo', '30h/semana', 'Secretaria de Assistência Social', 'Ativo',
   '["Progressão funcional pendente de avaliação de desempenho."]'::jsonb, '[]'::jsonb, 'importacao', NULL),

  ('Sérgio Nunes Batista', 'sergio nunes batista', '05317122037', 'RS-5566778', '2002-08-05', '1974-06-19', '51991234567',
   'sergio.batista@orgao.gov.br', 'Classe C', 'Engenheiro Civil', 'Efetivo', '40h/semana', 'Secretaria de Obras', 'Ativo',
   '[]'::jsonb, '[]'::jsonb, 'importacao', NULL);

-- Mariana: DI 04/03/2013 → 2º quinquênio vigente em 03/03/2023
INSERT INTO ats_quinquenios (servidor_id, tipo, data_vigencia, data_doe, data_proximo_projetada, observacao, criado_por)
SELECT s.id, 1, DATE '2018-03-03', DATE '2018-04-02', (DATE '2018-03-03' + INTERVAL '1825 days')::date,
       'ATO nº 145/2018 publicado no DOE.', 'Gestor RH'
FROM servidores s WHERE s.cpf = '52998224725';

INSERT INTO ats_quinquenios (servidor_id, tipo, data_vigencia, data_doe, data_proximo_projetada, observacao, criado_por)
SELECT s.id, 2, DATE '2023-03-02', DATE '2023-03-20', (DATE '2023-03-02' + INTERVAL '1825 days')::date,
       'ATO nº 302/2023 publicado no DOE.', 'Gestor RH'
FROM servidores s WHERE s.cpf = '52998224725';

-- João Pedro: DI 10/01/2019 → 1º quinquênio em 09/01/2024
INSERT INTO ats_quinquenios (servidor_id, tipo, data_vigencia, data_doe, data_proximo_projetada, observacao, criado_por)
SELECT s.id, 1, DATE '2024-01-09', DATE '2024-01-25', (DATE '2024-01-09' + INTERVAL '1825 days')::date,
       'Portaria 87/2024 — concessão do 1º quinquênio.', 'Gestor RH'
FROM servidores s WHERE s.cpf = '11144477735';

-- Antônia: DI 01/03/2001 → 3 quinquênios completos (DOE ausente no 3º, como acontece na prática)
INSERT INTO ats_quinquenios (servidor_id, tipo, data_vigencia, data_doe, data_proximo_projetada, observacao, criado_por)
SELECT s.id, 1, DATE '2006-02-28', DATE '2006-03-15', (DATE '2006-02-28' + INTERVAL '1825 days')::date, NULL, 'Motor de regras'
FROM servidores s WHERE s.cpf = '15350946056';

INSERT INTO ats_quinquenios (servidor_id, tipo, data_vigencia, data_doe, data_proximo_projetada, observacao, criado_por)
SELECT s.id, 2, DATE '2011-02-27', DATE '2011-03-18', (DATE '2011-02-27' + INTERVAL '1825 days')::date, NULL, 'Motor de regras'
FROM servidores s WHERE s.cpf = '15350946056';

INSERT INTO ats_quinquenios (servidor_id, tipo, data_vigencia, data_doe, data_proximo_projetada, observacao, criado_por)
SELECT s.id, 3, DATE '2016-02-26', NULL, (DATE '2016-02-26' + INTERVAL '1825 days')::date,
       'Data do DOE pendente de publicação — sinalizado pelo RH.', 'Motor de regras'
FROM servidores s WHERE s.cpf = '15350946056';

-- Bruno: DI 12/09/2011 → 2 quinquênios
INSERT INTO ats_quinquenios (servidor_id, tipo, data_vigencia, data_doe, data_proximo_projetada, observacao, criado_por)
SELECT s.id, 1, DATE '2016-09-10', DATE '2016-10-03', (DATE '2016-09-10' + INTERVAL '1825 days')::date, NULL, 'Gestor RH'
FROM servidores s WHERE s.cpf = '25634493005';

INSERT INTO ats_quinquenios (servidor_id, tipo, data_vigencia, data_doe, data_proximo_projetada, observacao, criado_por)
SELECT s.id, 2, DATE '2021-09-09', DATE '2021-09-30', (DATE '2021-09-09' + INTERVAL '1825 days')::date, NULL, 'Gestor RH'
FROM servidores s WHERE s.cpf = '25634493005';

-- Célia: DI 15/06/2008 → 2 quinquênios lançados, projeção já vencida (pendência real de RH)
INSERT INTO ats_quinquenios (servidor_id, tipo, data_vigencia, data_doe, data_proximo_projetada, observacao, criado_por)
SELECT s.id, 1, DATE '2013-06-14', DATE '2013-07-01', (DATE '2013-06-14' + INTERVAL '1825 days')::date, NULL, 'Gestor RH'
FROM servidores s WHERE s.cpf = '39053344705';

INSERT INTO ats_quinquenios (servidor_id, tipo, data_vigencia, data_doe, data_proximo_projetada, observacao, criado_por)
SELECT s.id, 2, DATE '2018-06-13', DATE '2018-06-29', (DATE '2018-06-13' + INTERVAL '1825 days')::date, NULL, 'Gestor RH'
FROM servidores s WHERE s.cpf = '39053344705';

-- Luciana: DI 01/02/2021 → 1º quinquênio com vigência em 01/02/2026
INSERT INTO ats_quinquenios (servidor_id, tipo, data_vigencia, data_doe, data_proximo_projetada, observacao, criado_por)
SELECT s.id, 1, DATE '2026-02-01', DATE '2026-02-20', (DATE '2026-02-01' + INTERVAL '1825 days')::date,
       'Concessão do 1º quinquênio — processo 2026/001189.', 'Gestor RH'
FROM servidores s WHERE s.cpf = '66036911005';

-- Sérgio: DI 05/08/2002 → 4 quinquênios; próximo vence em 31/07/2027 (alerta do painel)
INSERT INTO ats_quinquenios (servidor_id, tipo, data_vigencia, data_doe, data_proximo_projetada, observacao, criado_por)
SELECT s.id, 1, DATE '2007-08-04', DATE '2007-08-21', (DATE '2007-08-04' + INTERVAL '1825 days')::date, NULL, 'Motor de regras'
FROM servidores s WHERE s.cpf = '05317122037';

INSERT INTO ats_quinquenios (servidor_id, tipo, data_vigencia, data_doe, data_proximo_projetada, observacao, criado_por)
SELECT s.id, 2, DATE '2012-08-03', DATE '2012-08-20', (DATE '2012-08-03' + INTERVAL '1825 days')::date, NULL, 'Motor de regras'
FROM servidores s WHERE s.cpf = '05317122037';

INSERT INTO ats_quinquenios (servidor_id, tipo, data_vigencia, data_doe, data_proximo_projetada, observacao, criado_por)
SELECT s.id, 3, DATE '2017-08-02', DATE '2017-08-18', (DATE '2017-08-02' + INTERVAL '1825 days')::date, NULL, 'Motor de regras'
FROM servidores s WHERE s.cpf = '05317122037';

INSERT INTO ats_quinquenios (servidor_id, tipo, data_vigencia, data_doe, data_proximo_projetada, observacao, criado_por)
SELECT s.id, 4, DATE '2022-08-01', DATE '2022-08-17', (DATE '2022-08-01' + INTERVAL '1825 days')::date,
       'Próximo quinquênio com vencimento no ciclo vigente.', 'Motor de regras'
FROM servidores s WHERE s.cpf = '05317122037';

INSERT INTO importacoes (arquivo, formato, total_linhas, novas, atualizadas, ignoradas, com_pendencias, celulas_vazias_tratadas, criado_por, criado_em)
VALUES ('pre-cadastro-servidores-2026.xlsx', 'xlsx', 42, 31, 8, 3, 12, 57, 'Gestor RH', now() - interval '6 days'),
       ('pre-cadastro-servidores-complemento.xlsx', 'xlsx', 12, 5, 6, 1, 4, 18, 'Gestor RH', now() - interval '2 days');

INSERT INTO auditoria (entidade, entidade_id, acao, detalhe, autor, criado_em)
VALUES ('importacao', 1, 'Importação de planilha confirmada',
        'pre-cadastro-servidores-2026.xlsx: 31 novos, 8 atualizados, 3 ignorados, 12 com pendências.', 'Gestor RH', now() - interval '6 days'),
       ('importacao', 2, 'Importação de planilha confirmada',
        'pre-cadastro-servidores-complemento.xlsx: 5 novos, 6 atualizados, 1 ignorado, 4 com pendências.', 'Gestor RH', now() - interval '2 days');
