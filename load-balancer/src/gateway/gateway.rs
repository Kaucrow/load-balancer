use crate::{
    prelude::*,
    settings::{GatewayConfig, get_settings}
};
use super::types::*;

#[derive(Debug)]
pub struct GatewayNode {
    pub name: String,
    pub url: String,
    pub specs: GatewaySpecs,
    pub avail_ram: RwLock<u64>,
    pub avail_cpu: RwLock<f64>,
    pub disk_free_size: RwLock<u64>,
}

pub async fn initialize_gateways(gateways: Vec<GatewayConfig>, client: &Client) -> Vec<GatewayNode> {
    let mut nodes = Vec::new();

    for gateway in gateways {
        info!("Querying {} at {} for specs...", gateway.name, gateway.url());
        let endpoint = format!("{}/specs", gateway.url());

        match client.get(&endpoint).send().await {
            Ok(res) if res.status().is_success() => {
                if let Ok(specs) = res.json::<GatewaySpecs>().await {
                    nodes.push(GatewayNode {
                        name: gateway.name.clone(),
                        url: gateway.url().to_string(),
                        avail_ram: RwLock::new(specs.ram),
                        avail_cpu: RwLock::new(100.0),
                        disk_free_size: RwLock::new(specs.disk.get(specs.disk.keys().next().unwrap()).unwrap().disk_size),
                        specs,
                    });
                    info!("Registered gateway {} at {}", gateway.name, gateway.url());
                } else {
                    error!("Failed to parse specs from {} at {}", gateway.name, gateway.url());
                }
            }
            _ => warn!("Failed to connect to gateway {} at {}", gateway.name, gateway.url()),
        }
    }
    nodes
}

pub fn select_best_gateway(gateways: &[GatewayNode]) -> anyhow::Result<&GatewayNode> {
    if gateways.is_empty() {
        bail!("Gateway list is empty");
    }

    let settings = get_settings()?;

    let mut best_node = &gateways[0];
    let mut highest_score = f64::MIN; // Safer than -1.0 to ensure the first node always gets evaluated

    for node in gateways {
        // Read the current available metrics from the RwLocks
        let current_ram = *node.avail_ram.read().unwrap() as f64;
        let current_cpu_percent_avail = *node.avail_cpu.read().unwrap();
        let current_disk_free = *node.disk_free_size.read().unwrap() as f64;

        let total_ram = node.specs.ram as f64;

        // CPU Calculation
        let total_compute = node.specs.cpu.cpu_threads as f64 * node.specs.cpu.cpu_speed as f64;
        let avail_compute = total_compute * (current_cpu_percent_avail / 100.0);

        let cpu_score = (avail_compute / settings.balancer.reference_max_compute as f64) * 100.0;

        // Sum up the sizes of all disks in the HashMap
        let total_disk: u64 = node.specs.disk.values()
            // We use unwrap_or(1) to avoid division by zero if disk_size is missing
            .map(|d| d.disk_size) 
            .sum();

        // Disk Performance Multiplier
        // Iterate over the HashMap values to see if this node has at least one SSD.
        // If it does, we give its disk score a 20% multiplier bonus.
        let has_ssd = node.specs.disk.values().any(|d| matches!(d.disk_type, DiskType::SSD));
        let disk_multiplier = if has_ssd { 1.2 } else { 1.0 };

        // Normalize to Percentages (0.0 to 100.0)
        let ram_percent_avail = (current_ram / total_ram) * 100.0;
        let disk_percent_avail = if total_disk > 0 {
            (current_disk_free / total_disk as f64) * 100.0
        } else {
            0.0
        };

        let ram_weight = settings.balancer.ram_weight;
        let cpu_weight = settings.balancer.cpu_weight;
        let disk_weight = settings.balancer.disk_weight;

        let cpu_score = cpu_score * cpu_weight;
        let ram_score = ram_percent_avail * ram_weight;

        // Apply the multiplier directly to the weighted disk score
        let disk_score = (disk_percent_avail * disk_weight) * disk_multiplier;

        let score = cpu_score + ram_score + disk_score;

        info!("Got score for gateway {}: {}", node.name, score);

        // Find the winner
        if score > highest_score {
            highest_score = score;
            best_node = node;
        }
    }

    info!("Sending to gateway {} at {}", best_node.name, best_node.url);
    Ok(best_node)
}