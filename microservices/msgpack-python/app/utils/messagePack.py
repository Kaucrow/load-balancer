from typing import Any
import msgpack
from fastapi import HTTPException, Request, status
from fastapi.responses import Response
import uuid
from decimal import Decimal

class MessagePackResponse(Response):
    media_type = "application/msgpack"

    def render(self, content: Any) -> bytes:
        return pack(content)

def unpack(body: bytes) -> dict:
    try:
        return msgpack.unpackb(body, strict_map_key=True)
    
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payload de MessagePack Invalido: {exc}",
        )


def defaultEncoder(obj: Any) -> Any:
    if isinstance(obj, uuid.UUID):
        return str(obj)
    
    if isinstance(obj, Decimal):
        return float(obj)
    
    raise TypeError(f"El tipo {type(obj)} no se pudo serializar para MessagePack")


def pack(data: Any) -> bytes:
    return msgpack.packb(data, default=defaultEncoder)


async def readMessagePackBody(request: Request) -> dict:
    body = await request.body()
    
    if not body:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El body de la request esta vacio",
        )
    
    return unpack(body)
