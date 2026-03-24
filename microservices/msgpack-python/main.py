import psycopg2.pool
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes.teamRoutes import router as teamRouter
from app.core.config import databaseURL, port
from app.db import session


@asynccontextmanager
async def lifespan(app: FastAPI):
    session.pool = psycopg2.pool.ThreadedConnectionPool(minconn=2, maxconn=20, dsn=databaseURL)
    yield
    session.pool.closeall()


app = FastAPI(title="Football Teams API", version="1.0.0", lifespan=lifespan)

app.include_router(teamRouter)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=port)
