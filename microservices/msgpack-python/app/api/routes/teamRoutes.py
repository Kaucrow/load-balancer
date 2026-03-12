import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app.db.session import getDb
from app.db import session
from app.schemas.teamSchemas import TeamCreate, TeamResponse, TeamUpdate
from app.utils.messagePack import MessagePackResponse, readMessagePackBody

router = APIRouter(prefix="/teams", tags=["teams"])


def rowToDict(cursor, row):
    columns = [col[0] for col in cursor.description]
    return dict(zip(columns, row))


@router.get("", response_class=MessagePackResponse)
def getTeams(cursor=Depends(getDb)):
    cursor.execute('SELECT * FROM teams ORDER BY "clubName"')
    teams = [TeamResponse.model_validate( rowToDict(cursor, row) ).model_dump() for row in cursor.fetchall()]

    return MessagePackResponse(content=teams)


@router.get("/{teamId}", response_class=MessagePackResponse)
def findTeam(teamId: uuid.UUID, cursor=Depends(getDb)):
    cursor.execute("SELECT * FROM teams WHERE id = %s", (str(teamId),))
    row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Team '{teamId}' not found.")
    
    return MessagePackResponse(content=TeamResponse.model_validate(rowToDict(cursor, row)).model_dump())


@router.post("", response_class=MessagePackResponse, status_code=status.HTTP_201_CREATED)
async def createTeam(cursor=Depends(getDb), body: dict = Depends(readMessagePackBody)):
    data = TeamCreate(**body)
    cursor.execute('SELECT id FROM teams WHERE "clubName" = %s', (data.clubName,))

    if cursor.fetchone():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Team '{data.clubName}' already exists.")
    
    cursor.execute(
        """
        INSERT INTO teams (id, "clubName", "foundedYear", "championsCount",
                           "leagueTitlesCount", "squadValue", "stadiumName")
        VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *
        """,
        (str(uuid.uuid4()), data.clubName, data.foundedYear, data.championsCount,
         data.leagueTitlesCount, float(data.squadValue), data.stadiumName),
    )

    row = cursor.fetchone()
    session.connection.commit()
    return MessagePackResponse(content=TeamResponse.model_validate(rowToDict(cursor, row)).model_dump(), status_code=status.HTTP_201_CREATED)


@router.put("/{teamId}", response_class=MessagePackResponse)
async def updateTeam(teamId: uuid.UUID, cursor=Depends(getDb), body: dict = Depends(readMessagePackBody)):
    updates = TeamUpdate(**body).model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided to update.")
    
    cursor.execute("SELECT id FROM teams WHERE id = %s", (str(teamId),))

    if not cursor.fetchone():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Team '{teamId}' not found.")
    
    columns = ", ".join(f'"{field}" = %s' for field in updates)
    values = [float(value) if field == "squadValue" else value for field, value in updates.items()]
    values.append(str(teamId))

    cursor.execute(f'UPDATE teams SET {columns} WHERE id = %s RETURNING *', values)
    row = cursor.fetchone()
    session.connection.commit()
    return MessagePackResponse(content=TeamResponse.model_validate(rowToDict(cursor, row)).model_dump())


@router.delete("/{teamId}", status_code=status.HTTP_204_NO_CONTENT)
def deleteTeam(teamId: uuid.UUID, cursor=Depends(getDb)):
    cursor.execute("SELECT id FROM teams WHERE id = %s", (str(teamId),))

    if not cursor.fetchone():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Team '{teamId}' not found.")
    
    cursor.execute("DELETE FROM teams WHERE id = %s", (str(teamId),))
    session.connection.commit()
