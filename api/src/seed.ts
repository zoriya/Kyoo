import { db } from "./db";
import { videos } from "./db/schema/videos";
import { Video } from "./models/video";

const seed = async () =>{
	db.insert(videos).values(Video.examples)
};
