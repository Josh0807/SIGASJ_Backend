/**
 * E2e utiliza la conexión del `.env` (LocalDB) para que
 * `TypeOrmModule.forFeature([Comunicado])` resuelva el repositorio.
 * No forzar DB_ENABLED=false: sin DataSource el módulo no compila.
 */
