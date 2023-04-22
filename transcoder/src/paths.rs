use serde::Deserialize;

#[derive(Deserialize)]
struct Item {
	path: String,
}

pub async fn get_path(_resource: String, slug: String) -> Result<String, reqwest::Error> {
	let api_url = std::env::var("API_URL").unwrap_or("http://back:5000".to_string());

	// TODO: The api create dummy episodes for movies right now so we hard code the /episode/
	reqwest::get(format!("{api_url}/episode/{slug}"))
		.await?
		.error_for_status()?
		.json::<Item>()
		.await
		.map(|x| x.path)
}
