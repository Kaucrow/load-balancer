import msgpack
import requests
import sys

baseUrl = "http://localhost:50044/teams"
headers = {"Content-Type": "application/msgpack"}


def pack(data: dict) -> bytes:
    return msgpack.packb(data)


def unpack(raw: bytes):
    return msgpack.unpackb(raw, strict_map_key=False)


def formatData(data, indent=0):
    prefix = "  " * indent
    if isinstance(data, dict):
        for field, value in data.items():
            if isinstance(value, (dict, list)):
                print(f"{prefix}{field}:")
                formatData(value, indent + 1)
            else:
                print(f"{prefix}{field}: {value}")

    elif isinstance(data, list):
        for i, item in enumerate(data):
            print(f"{prefix}[{i}]")
            formatData(item, indent + 1)

    else:
        print(f"{prefix}{data}")

def createTeam(team: dict) -> dict | None:
    print("\n━━━ CREATE TEAM ━━━")
    r = requests.post(baseUrl, data=pack(team), headers=headers)

    if r.status_code == 201:
        result = unpack(r.content)
        print(f"Equipo creado (status {r.status_code}):")
        formatData(result)
        return result
    
    else:
        print(f"Error {r.status_code}: {r.text}")
        return None


def getAllTeams():
    print("\n━━━ GET ALL TEAMS ━━━")
    r = requests.get(baseUrl)
    if r.status_code == 200:
        result = unpack(r.content)
        print(f"Total equipos: {len(result) if isinstance(result, list) else '?'}")
        formatData(result)
        return result
    
    else:
        print(f"Error {r.status_code}: {r.text}")
        return None


def getTeam(teamId: str):
    print(f"\n━━━ GET TEAM {teamId} ━━━")
    r = requests.get(f"{baseUrl}/{teamId}")
    if r.status_code == 200:
        result = unpack(r.content)
        formatData(result)
        return result
    
    else:
        print(f"Error {r.status_code}: {r.text}")
        return None


def updateTeam(teamId: str, updates: dict):
    print(f"\n━━━ UPDATE TEAM {teamId} ━━━")
    r = requests.put(f"{baseUrl}/{teamId}", data=pack(updates), headers=headers)
    if r.status_code == 200:
        result = unpack(r.content)
        print("Equipo actualizado:")
        formatData(result)
        return result
    
    else:
        print(f"Error {r.status_code}: {r.text}")
        return None


def deleteTeam(teamId: str):
    print(f"\n━━━ DELETE TEAM {teamId} ━━━")
    r = requests.delete(f"{baseUrl}/{teamId}")
    if r.status_code == 204:
        print("Equipo eliminado correctamente.")
        return True
    
    else:
        print(f"Error {r.status_code}: {r.text}")
        return False

def main():
    print("Cliente - MessagePack Teams API")

    newTeam = {
        "clubName": "Olympique de Marseille",
        "foundedYear": 1899,
        "championsCount": 1,
        "leagueTitlesCount": 9,
        "squadValue": 310.00,
        "stadiumName": "Stade Vélodrome"
    }

    created = createTeam(newTeam)

    if not created:
        print("No se pudo crear el equipo. Abortando demo.")
        sys.exit(1)

    teamId = created.get("id")

    if isinstance(teamId, bytes):
        teamId = teamId.decode()

    print(f"\nID del equipo creado: {teamId}")

    getTeam(teamId)

    getAllTeams()

    updateTeam(teamId, {
        "championsCount": 777,
        "squadValue": 777.777,
    })

    getTeam(teamId)

    deleteTeam(teamId)

    getTeam(teamId)

if __name__ == "__main__":
    main()
