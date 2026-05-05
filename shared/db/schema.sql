              List of relations
 Schema |    Name    | Type  |     Owner      
--------+------------+-------+----------------
 public | Atendente  | table | role_664e0c151
 public | Chamado    | table | role_664e0c151
 public | Snapshot   | table | role_664e0c151
 public | SyncLog    | table | role_664e0c151
 public | sync_items | table | role_664e0c151
 public | sync_runs  | table | role_664e0c151
(6 rows)

                                           Table "public.sync_runs"
     Column      |            Type             | Collation | Nullable |                Default                
-----------------+-----------------------------+-----------+----------+---------------------------------------
 id              | integer                     |           | not null | nextval('sync_runs_id_seq'::regclass)
 started_at      | timestamp without time zone |           |          | now()
 finished_at     | timestamp without time zone |           |          | 
 status          | character varying(20)       |           |          | 'RUNNING'::character varying
 total_extracted | integer                     |           |          | 0
 total_posted    | integer                     |           |          | 0
 total_skipped   | integer                     |           |          | 0
 total_errors    | integer                     |           |          | 0
 log_path        | text                        |           |          | 
 notes           | text                        |           |          | 
Indexes:
    "sync_runs_pkey" PRIMARY KEY, btree (id)
    "idx_sync_runs_started" btree (started_at)
Referenced by:
    TABLE "sync_items" CONSTRAINT "sync_items_run_id_fkey" FOREIGN KEY (run_id) REFERENCES sync_runs(id)

                                          Table "public.sync_items"
    Column     |            Type             | Collation | Nullable |                Default                 
---------------+-----------------------------+-----------+----------+----------------------------------------
 id            | integer                     |           | not null | nextval('sync_items_id_seq'::regclass)
 run_id        | integer                     |           |          | 
 sistema       | character varying(20)       |           |          | 
 external_id   | character varying(100)      |           |          | 
 titulo        | text                        |           |          | 
 status        | character varying(50)       |           |          | 
 prioridade    | character varying(50)       |           |          | 
 cliente       | text                        |           |          | 
 atendente     | text                        |           |          | 
 data_abertura | text                        |           |          | 
 action        | character varying(20)       |           |          | 
 http_status   | integer                     |           |          | 
 api_response  | text                        |           |          | 
 synced_at     | timestamp without time zone |           |          | now()
Indexes:
    "sync_items_pkey" PRIMARY KEY, btree (id)
    "idx_sync_items_ext" btree (external_id, sistema)
    "idx_sync_items_run" btree (run_id)
Foreign-key constraints:
    "sync_items_run_id_fkey" FOREIGN KEY (run_id) REFERENCES sync_runs(id)

                                  Table "public.Chamado"
    Column     |              Type              | Collation | Nullable |      Default      
---------------+--------------------------------+-----------+----------+-------------------
 id            | text                           |           | not null | 
 externalId    | text                           |           |          | 
 sistema       | text                           |           | not null | 
 titulo        | text                           |           | not null | 
 descricao     | text                           |           |          | 
 status        | text                           |           | not null | 
 setor         | text                           |           | not null | 'Suporte'::text
 prioridade    | text                           |           |          | 'Normal'::text
 cliente       | text                           |           |          | 
 atendente     | text                           |           |          | 
 criadoEm      | timestamp(3) without time zone |           | not null | CURRENT_TIMESTAMP
 atualizadoEm  | timestamp(3) without time zone |           | not null | 
 fechadoEm     | timestamp(3) without time zone |           |          | 
 tempoResposta | integer                        |           |          | 
Indexes:
    "Chamado_pkey" PRIMARY KEY, btree (id)
    "Chamado_atendente_idx" btree (atendente)
    "Chamado_criadoEm_idx" btree ("criadoEm")
    "Chamado_sistema_idx" btree (sistema)
    "Chamado_sistema_status_criadoEm_idx" btree (sistema, status, "criadoEm")
    "Chamado_status_idx" btree (status)

