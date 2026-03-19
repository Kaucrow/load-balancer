use crate::{
    prelude::*,
    gateway::select_best_gateway,
};

pub async fn proxy_handler(
    State(state): State<AppState>,
    method: Method,
    uri: Uri,
    headers: HeaderMap,
    body: Bytes,
) -> axum::response::Response {
    // Select the best gateway based on dynamic metrics
    let chosen_gateway = match select_best_gateway(&state.gateways) {
        Ok(node) => node,
        Err(_) => {
            return axum::response::Response::builder()
                .status(StatusCode::SERVICE_UNAVAILABLE)
                .body(axum::body::Body::from("No upstream servers available"))
                .unwrap();
        }
    };

    // Construct the target URL
    let path_and_query = uri.path_and_query().map(|pq| pq.as_str()).unwrap_or("");
    let target_url = format!("{}{}", chosen_gateway.url, path_and_query);

    // Build and send the forwarded request
    let mut req_builder = state.client.request(method, &target_url);
    for (key, value) in headers.iter() {
        if key != axum::http::header::HOST {
            req_builder = req_builder.header(key, value);
        }
    }

    let backend_response = req_builder.body(body).send().await;

    // Handle the response and extract the new metrics
    match backend_response {
        Ok(res) => {
            let mut response_builder = axum::response::Response::builder()
                .status(res.status());

            // Forward headers back to client
            if let Some(headers_mut) = response_builder.headers_mut() {
                for (k, v) in res.headers().iter() {
                    headers_mut.insert(k.clone(), v.clone());
                }
            }

            // Extract the new metrics from the HTTP headers returned by the gateway.
            // Example: "X-Avail-Ram: 443721695190"
            if let Some(ram_header) = res.headers().get("X-Avail-Ram") {
                if let Ok(ram_str) = ram_header.to_str() {
                    if let Ok(new_ram) = ram_str.parse::<u64>() {
                        let mut node_ram = chosen_gateway.avail_ram.write().unwrap();
                        *node_ram = new_ram;
                    }
                }
            }

            // Example: "X-Avail-Cpu: 45.0"
            if let Some(cpu_header) = res.headers().get("X-Avail-Cpu") {
                if let Ok(cpu_str) = cpu_header.to_str() {
                    if let Ok(new_cpu) = cpu_str.parse::<f64>() {
                        let mut node_cpu = chosen_gateway.avail_cpu.write().unwrap();
                        *node_cpu = new_cpu;
                    }
                }
            }

            // Example: "X-Disk-Free-Size: 9573219641"
            if let Some(free_disk_header) = res.headers().get("X-Disk-Free-Size") {
                if let Ok(free_disk_str) = free_disk_header.to_str() {
                    if let Ok(new_free_disk) = free_disk_str.parse::<u64>() {
                        let mut node_free_disk = chosen_gateway.disk_free_size.write().unwrap();
                        *node_free_disk = new_free_disk;
                    }
                }
            }

            // Return the body to the client
            let bytes = res.bytes().await.unwrap_or_default();
            response_builder.body(axum::body::Body::from(bytes)).unwrap()
        }
        Err(_) => {
            axum::response::Response::builder()
                .status(StatusCode::BAD_GATEWAY)
                .body(axum::body::Body::from("Bad Gateway"))
                .unwrap()
        }
    }
}