use crate::{
    prelude::*,
    gateway::GatewayNode,
};

#[derive(Clone)]
pub struct AppState {
    pub gateways: Arc<Vec<GatewayNode>>,
    pub client: Client,
}