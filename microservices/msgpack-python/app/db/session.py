import psycopg2.pool

pool: psycopg2.pool.ThreadedConnectionPool = None

def getDb():
    connection = pool.getconn()
    cursor = connection.cursor()
    try:
        yield cursor
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        cursor.close()
        pool.putconn(connection)
