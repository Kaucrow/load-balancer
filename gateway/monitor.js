import os from 'os';
import si from 'systeminformation';

class SystemMonitor {
    constructor() {
        this.lastMeditionCPU = {
            times: this.getTimesCPU(),
            timestamp: Date.now()
        };
        
        this.init=true;
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
            //hostname: os.hostname(),
            //platform: os.platform(),
            //arch: process.arch,
            
            cpu: {
                //model: cpus[0].model,
                cpuThreads: cpus.length,
                cpuSpeed: cpus[0].speed, // + 'MHz',
                //heoricScore: this.getTheoricScore(cpus[0].speed, cpus.length)
            },
            
            ram: (os.totalmem()), /// 1024 / 1024 / 1024),//.toFixed(2) + ' GB',

            disks: diskInfo,
            
            //initDate: new Date().toISOString()
        };
    }

    getTheoricScore(speed, cores) {
        const archFactor = process.arch.includes('64') ? 1.2 : 1.0;
        return (speed * cores * archFactor).toFixed(0);
    }



    getActualRAM() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        return freeMem;
        // return {
        //     used: (usedMem / 1024 / 1024 / 1024).toFixed(2),
        //     free: (freeMem / 1024 / 1024 / 1024).toFixed(2),
        //     percentage: ((usedMem / totalMem) * 100).toFixed(2)
        // };
    }

    getActualCPU() {
        const now = Date.now();
        const actualTimes= this.getTimesCPU();
        
        const timePassed = now - this.lastMeditionCPU.timestamp;
        const diffTick = actualTimes.totalTick - this.lastMeditionCPU.times.totalTick;
        const diffIdle = actualTimes.totalIdle - this.lastMeditionCPU.times.totalIdle;
        
        this.lastMeditionCPU = {
            times: actualTimes,
            timestamp: now
        };
        
        if (diffTick === 0) return 0;
        
        const usage = ((diffTick - diffIdle) / diffTick);// * 100;
        return usage;
        // return {
        //     use: usage.toFixed(2),
        //     timePassed:timePassed
        // };
    }

    async getInfo() {
        const ram = this.getActualRAM();
        const cpu = this.getActualCPU();
        
        const metrics = {
            //datetime: new Date().toISOString(),
            
            // Mediciones actuales
            availCpu: (1-cpu),
            availRam: ram,
            
            // Carga adicional
            //systemLoad: os.loadavg(),
            //uptime: os.uptime()
        };
        
        return metrics;
    }

}

const Monitor = new SystemMonitor();
export default Monitor;