import os from 'os';
import si from 'systeminformation';

class SystemMonitor {
    constructor() {
        this.lastMeditionCPU = this.getTimesCPU();
        this._cachedInfo = { availCpu: 1.0, availRam: os.freemem(), diskFreeSize: 0 };
    }

    getTimesCPU() {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        
        cpus.forEach(cpu => {
            for (let i in cpu.times) {
                totalTick += cpu.times[i];
            }
            totalIdle += cpu.times.idle;
        });
        
        return { totalIdle, totalTick };
    }

    async getSpecs() {
        const cpus = os.cpus();

        const disks = await si.diskLayout();
        
        const diskInfo = await disks.reduce((acc, disk) => {
            acc[disk.device] = {
                diskType: disk.type,
                diskSize: (disk.size), /// 1024 / 1024 / 1024),//.toFixed(2) + ' GB',
                diskSpeed: disk.bytesPerSector// + ' RPM'
            };
            return acc;
        }, {});
        
        return {
            cpu: {
                cpuThreads: cpus.length,
                cpuSpeed: cpus[0].speed, // + 'MHz',
            },
            
            ram: os.totalmem(),
            disk: diskInfo,
        };
    }

    getActualCPU() {
        const actualTimes= this.getTimesCPU();

        const diffTick = actualTimes.totalTick - this.lastMeditionCPU.totalTick;
        const diffIdle = actualTimes.totalIdle - this.lastMeditionCPU.totalIdle;
        
        this.lastMeditionCPU = actualTimes;
        
        if (diffTick === 0) return 0;
        
        const usage = ((diffTick - diffIdle) / diffTick);// * 100;
        return usage;
    }

    async getLargestFreeSize() {
        const volumes = await si.fsSize();
        let maxFree = 0;
        
        volumes.forEach(vol => {
            if (vol.available > maxFree) {
                maxFree = vol.available;
            }
        });
        
        return maxFree;
    }

    async getInfo() {
        return this._cachedInfo;
    }

    async _refreshCache() {
        const cpu = this.getActualCPU();
        this._cachedInfo = {
            availCpu: (1 - cpu),
            availRam: os.freemem(),
            diskFreeSize: await this.getLargestFreeSize(),
        };
    }
}

const Monitor = new SystemMonitor();

// Inicializar cache y refrescar cada 2 segundos en background
await Monitor._refreshCache();
setInterval(() => Monitor._refreshCache(), 2000);

export default Monitor;