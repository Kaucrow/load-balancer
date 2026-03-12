import os

from dotenv import load_dotenv

load_dotenv()

databaseURL: str = os.environ["DATABASE_URL"]
port: int = int(os.environ.get("PORT", 50044))
