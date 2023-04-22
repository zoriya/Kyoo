use serde::Deserialize;

#[derive(Deserialize)]
struct Item {
	path: String,
}

pub async fn get_path(_resource: String, slug: String) -> Result<String, reqwest::Error> {
	let api_url = std::env::var("API_URL").unwrap_or("http://back:5000".to_string());
	let api_key = std::env::var("KYOO_APIKEYS")
		.expect("Missing api keys.")
		.split(',')
		.next()
		.unwrap()
		.to_string();

	// TODO: Store the client somewhere gobal
	let client = reqwest::Client::new();
	// TODO: The api create dummy episodes for movies right now so we hard code the /episode/
	client
		.get(format!("{api_url}/episode/{slug}"))
		.header("X-API-KEY", api_key)
		.send()
		.await?
		.error_for_status()?
		.json::<Item>()
		.await
		.map(|x| x.path)
}
