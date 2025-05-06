from fastapi import FastAPI

app = FastAPI(
	title="Scanner",
	description="API to control the long running scanner or interacting with external databases (themoviedb, tvdb...)\n\n"
	+ "Most of those APIs are for admins only.",
	root_path="/scanner",
	# lifetime=smth
)


@app.get("/items/{item_id}")
async def read_item(item_id):
	return {"item_id": item_id}
