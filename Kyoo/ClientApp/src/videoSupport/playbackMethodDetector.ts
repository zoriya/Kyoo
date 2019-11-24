import { WatchItem } from "../models/watch-item";
 
export enum method
{
	direct,
	transmux,
  transcode
};

export function getPlaybackMethod(item: WatchItem): method
{
	return method.direct;
}
