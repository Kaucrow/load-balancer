use crate::prelude::*;

#[derive(Deserialize)]
pub struct Settings {
    pub server: ServerSettings,
    pub balancer: BalancerSettings,
    pub gateways: Vec<GatewayConfig>,
    pub debug: bool,
}

#[derive(Deserialize)]
pub struct ServerSettings {
    pub host: String,
    pub port: u16,
    protocol: ServerProtocol,
}

impl ServerSettings {
    pub fn url(&self) -> String {
        format!("{}://{}:{}", self.protocol, self.host, self.port)
    }
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "kebab-case")]
pub struct BalancerSettings {
    pub ram_weight: f64,
    pub cpu_weight: f64,
}

#[derive(Deserialize, Debug)]
pub struct GatewayConfig {
    pub name: String,
    pub host: String,
    pub port: u16,
    pub protocol: ServerProtocol,
}

impl GatewayConfig {
    pub fn url(&self) -> String {
        format!("{}://{}:{}", self.protocol, self.host, self.port)
    }
}

#[derive(Deserialize, Debug, Display)]
#[strum(serialize_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum ServerProtocol {
    Http,
    Https,
}

pub enum Environment {
    Development,
    Production,
}

impl Environment {
    pub fn as_str(&self) -> &'static str {
        match self {
            Environment::Development => "development",
            Environment::Production => "production",
        }
    }
}

impl TryFrom<String> for Environment {
    type Error = String;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        match s.to_lowercase().as_str() {
            "development" => Ok(Self::Development),
            "production" => Ok(Self::Production),
            other => Err(format!(
                "{} is not a supported environment. Use either `development` or `production`.",
                other
            )),
        }
    }
}

pub fn get_settings() -> Result<Settings, config::ConfigError> {
    let base_path = std::env::current_dir().expect("Failed to determine the current directory");
    let settings_directory = base_path.join("settings");

    let environment: Environment = std::env::var("APP_ENVIRONMENT")
        .unwrap_or_else(|_| "development".into())
        .try_into()
        .expect("Failed to parse APP_ENVIRONMENT");

    let environment_filename = format!("{}.toml", environment.as_str());

    let settings = config::Config::builder()
        .add_source(config::File::from(
            settings_directory.join(environment_filename),
        ))
        .add_source(
            config::Environment::with_prefix("APP")
                .prefix_separator("_")
                .separator("__"),
        )
        .build()?;

    settings.try_deserialize::<Settings>()
}