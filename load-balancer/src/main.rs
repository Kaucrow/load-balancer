use load_balancer::{
    prelude::*,
    settings::get_settings,
    telemetry,
    gateway:: initialize_gateways,
    proxy::proxy_handler,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let settings = get_settings()?;

    // Init the tracing subscriber
    let (subscriber, _guard) = telemetry::get_subscriber(&settings).await?;
    telemetry::init_subscriber(subscriber);

    let client = Client::new();

    // Fetch data and build the cluster state
    let active_nodes = initialize_gateways(settings.gateways, &client).await;

    if active_nodes.is_empty() {
        error!("CRITICAL: No gateways responded. Exiting.");
        return Ok(());
    }

    let state = AppState {
        gateways: Arc::new(active_nodes),
        client,
    };

    // Set up the Axum router
    let app = Router::new()
        .route("/", any(proxy_handler))
        .route("/{*path}", any(proxy_handler))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(
        format!("{}:{}", settings.server.host, settings.server.port)
        )
        .await
        .unwrap();

    info!("Adaptive Load Balancer running on {}", settings.server.url());

    axum::serve(listener, app).await.unwrap();

    Ok(())
}