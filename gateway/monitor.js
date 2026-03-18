import os from 'os';
import si from 'systeminformation';

class SystemMonitor {
    constructor() {
        this.lastMeditionCPU = this.getTimesCPU();
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

        const volumes = await si.fsSize();
        const largestFreeByDisk = {};

        volumes.forEach(vol => {
            const diskDev = disks.find(d => vol.fs.startsWith(d.device));
            if (!diskDev) return;

            const dev = diskDev.device;
            if (!largestFreeByDisk[dev] || vol.available > largestFreeByDisk[dev]) {
                largestFreeByDisk[dev] = vol.available;
            }
        });
        
        const diskInfo = await disks.reduce((acc, disk) => {
            acc[disk.device] = {
                diskType: disk.type,
                diskSize: (disk.size), /// 1024 / 1024 / 1024),//.toFixed(2) + ' GB',
                diskSpeed: disk.bytesPerSector,// + ' RPM'
                diskFreeSize: largestFreeByDisk[disk.device]
            };
            return acc;
        }, {});
        
        return {
            cpu: {
                cpuThreads: cpus.length,
                cpuSpeed: cpus[0].speed, // + 'MHz',
            },
            
            ram: os.totalmem(),
            disks: diskInfo,
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

    async getInfo() {
        const ram = os.freemem();
        const cpu = this.getActualCPU();
        
        const metrics = {
            availCpu: (1-cpu),
            availRam: ram,
        };
        
        return metrics;
    }

}

const Monitor = new SystemMonitor();
export default Monitor;