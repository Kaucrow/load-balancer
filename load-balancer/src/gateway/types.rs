use crate::prelude::*;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CpuSpecs {
    pub cpu_threads: u16,
    pub cpu_speed: u16
}

#[derive(Debug, Deserialize)]
pub enum DiskType {
    SSD,
    HDD
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskSpecs {
    pub disk_type: DiskType,
    pub disk_size: u64,
    pub disk_speed: Option<u32>
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GatewaySpecs {
    pub cpu: CpuSpecs,
    pub ram: u64,
    pub disk: HashMap<String, DiskSpecs>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GatewayInfo {
    pub avail_cpu: f64,
    pub avail_ram: u64,
    pub disk_free_size: u64,
}