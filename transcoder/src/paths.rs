use std::path::PathBuf;

use serde::Deserialize;

#[derive(Deserialize)]
struct Item {
	path: String,
}

pub async fn get_movie_path(_slug: String) -> Result<String, reqwest::Error> {
	// TODO: Implement this method to fetch the path from the API.
	reqwest::get("{}/movie/{slug}")
		.await?
		.json::<Item>()
		.await
		.map(|x| x.path)
}
