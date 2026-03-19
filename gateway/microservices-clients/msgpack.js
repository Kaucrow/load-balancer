import { encode, decode } from '@msgpack/msgpack';

const baseUrl = 'http://localhost:50044/teams';
const headers = { 'Content-Type': 'application/msgpack' };

class MsgPackClient {
    constructor() {}

    #pack(data) {
        return encode(data);
    }

    #unpack(raw) {
        return decode(new Uint8Array(raw));
    }

    #formatData(data, indent = 0) {
        const prefix = '  '.repeat(indent);

        if (Array.isArray(data)) {
            data.forEach((item, i) => {
                console.log(`${prefix}[${i}]`);
                this.#formatData(item, indent + 1);
            });
            return;
        }

        if (data && typeof data === 'object') {
            for (const [field, value] of Object.entries(data)) {
                if (value && typeof value === 'object') {
                    console.log(`${prefix}${field}:`);
                    this.#formatData(value, indent + 1);
                } else {
                    console.log(`${prefix}${field}: ${value}`);
                }
            }
            return;
        }
        console.log(`${prefix}${data}`);
    }

    async createTeam(team) {
        const res = await fetch(baseUrl, {
            method: 'POST',
            headers,
            body: this.#pack(team),
        });

        if (res.status === 201) {
            const result = this.#unpack(await res.arrayBuffer());
            //this.#formatData(result);
            return result;
        }

        const text = await res.text();
        console.log(`Error ${res.status}: ${text}`);
        return null;
    }

    async getAllTeams() {
        const res = await fetch(baseUrl);

        if (res.status === 200) {
            const result = this.#unpack(await res.arrayBuffer());
            //this.#formatData(result);
            return result;
        }

        const text = await res.text();
        console.log(`Error ${res.status}: ${text}`);
        return null;
    }

    async getTeam(teamId) {
        const res = await fetch(`${baseUrl}/${teamId}`);

        if (res.status === 200) {
            const result = this.#unpack(await res.arrayBuffer());
            //this.#formatData(result);
            return result;
        }

        const text = await res.text();
        console.log(`Error ${res.status}: ${text}`);
        return null;
    }

    async updateTeam(teamId, updates) {
        const res = await fetch(`${baseUrl}/${teamId}`, {
            method: 'PUT',
            headers,
            body: this.#pack(updates),
        });

        if (res.status === 200) {
            const result = this.#unpack(await res.arrayBuffer());
            //this.#formatData(result);
            return result;
        }

        const text = await res.text();
        console.log(`Error ${res.status}: ${text}`);
        return null;
    }

    async deleteTeam(teamId) {
        const res = await fetch(`${baseUrl}/${teamId}`, { method: 'DELETE' });

        if (res.status === 204) {
            return true;
        }

        const text = await res.text();
        console.log(`Error ${res.status}: ${text}`);
        return false;
    }
}

const msgPackClient = new MsgPackClient();
export default msgPackClient;

/*async function main() {
    console.log('Cliente - MessagePack Teams API');

    const newTeam = {
        clubName: 'Olympique de Marseille',
        foundedYear: 1899,
        championsCount: 1,
        leagueTitlesCount: 9,
        squadValue: 310.0,
        stadiumName: 'Stade Vélodrome',
    };

    const created = await msgPackClient.createTeam(newTeam);
    if (!created) {
        console.log('No se pudo crear el equipo. Abortando demo.');
        process.exit(1);
    }

    let teamId = created.id;
    if (teamId instanceof Uint8Array) {
        teamId = new TextDecoder().decode(teamId);
    }

    console.log(`\nID del equipo creado: ${teamId}`);

    await msgPackClient.getTeam(teamId);
    await msgPackClient.getAllTeams();
    await msgPackClient.updateTeam(teamId, { championsCount: 777, squadValue: 777.777 });
    await msgPackClient.getTeam(teamId);
    await msgPackClient.deleteTeam(teamId);
    await msgPackClient.getTeam(teamId);
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}*/