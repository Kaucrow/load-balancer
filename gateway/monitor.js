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
        
        const diskInfo = await disks.reduce((acc, disk) => {
            acc[disk.device] = {
                type: disk.type,
                size: (disk.size / 1024 / 1024 / 1024).toFixed(2) + ' GB'
            };
            return acc;
        }, {});
        
        return {
            hostname: os.hostname(),
            platform: os.platform(),
            arch: process.arch,
            
            cpu: {
                model: cpus[0].model,
                logicalCores: cpus.length,
                maxSpeed: cpus[0].speed + ' MHz',
                theoricScore: this.getTheoricScore(cpus[0].speed, cpus.length)
            },
            
            totalRam: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',

            disks: diskInfo,
            
            initDate: new Date().toISOString()
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
        
        return {
            used: (usedMem / 1024 / 1024 / 1024).toFixed(2),
            free: (freeMem / 1024 / 1024 / 1024).toFixed(2),
            percentage: ((usedMem / totalMem) * 100).toFixed(2)
        };
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
        
        if (diffTick === 0) {
            return {
                percentage: '0.00',
                timePassed:timePassed
            };
        }
        
        const usage = ((diffTick - diffIdle) / diffTick) * 100;
        
        return {
            use: usage.toFixed(2),
            timePassed:timePassed
        };
    }

    async getInfo() {
        const ram = this.getActualRAM();
        const cpu = this.getActualCPU();
        
        const metrics = {
            datetime: new Date().toISOString(),
            
            // Mediciones actuales
            cpu: cpu,
            ram: ram,
            
            // Carga adicional
            systemLoad: os.loadavg(),
            uptime: os.uptime()
        };
        if(this.init){
            metrics.specs = await this.getSpecs();
            this.init=false;
        }
        
        return metrics;
    }

}

const Monitor = new SystemMonitor();
export default Monitor;