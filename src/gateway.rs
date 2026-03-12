use crate::{
    prelude::*,
    settings::{GatewayConfig, get_settings}
};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GatewaySpecs {
    pub ram: f64,
    pub cpu_cores: u32,
    pub cpu_threads: u32,
    pub cpu_speed: f64,
}

#[derive(Debug)]
pub struct GatewayNode {
    pub name: String,
    pub url: String,
    pub specs: GatewaySpecs,
    pub avail_ram: RwLock<f64>,
    pub avail_cpu: RwLock<f64>,
}

pub async fn initialize_gateways(gateways: Vec<GatewayConfig>, client: &Client) -> Vec<GatewayNode> {
    let mut nodes = Vec::new();

    for gateway in gateways {
        info!("Querying {} at {} for specs...", gateway.name, gateway.url());
        let endpoint = format!("{}/system-specs", gateway.url());

        match client.get(&endpoint).send().await {
            Ok(res) if res.status().is_success() => {
                if let Ok(specs) = res.json::<GatewaySpecs>().await {
                    nodes.push(GatewayNode {
                        name: gateway.name.clone(),
                        url: gateway.url().to_string(),
                        avail_ram: RwLock::new(specs.ram),
                        avail_cpu: RwLock::new(100.0), 
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
    let mut highest_score = -1.0;

    for node in gateways {
        // Read the current available metrics
        let current_ram = *node.avail_ram.read().unwrap();
        let current_cpu_percent = *node.avail_cpu.read().unwrap();

        // Calculate the "Total Compute Capacity" of this specific hardware
        // Example: 16 threads * 2.72 GHz = 43.52 raw compute units
        let total_compute = node.specs.cpu_threads as f64 * node.specs.cpu_speed;

        // Calculate how much of that raw compute is available right now
        // Example: 43.52 units * (50% available / 100) = 21.76 available compute units
        let avail_compute = total_compute * (current_cpu_percent / 100.0);

        // Calculate the final score using absolute available resources.
        let ram_weight = settings.balancer.ram_weight;
        let cpu_weight = settings.balancer.cpu_weight;

        let score = (avail_compute * cpu_weight) + (current_ram * ram_weight);

        // Find the winner
        if score > highest_score {
            highest_score = score;
            best_node = node;
        }
    }

    Ok(best_node)
}