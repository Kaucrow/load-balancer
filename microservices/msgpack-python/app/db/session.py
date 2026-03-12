import psycopg2

connection: psycopg2.extensions.connection = None

def getDb():
    cursor = connection.cursor()
    try:
        yield cursor
    finally:
        cursor.close()
