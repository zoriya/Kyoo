using Kyoo.InternalAPI.MetadataProvider.TheTvDB;
using Kyoo.InternalAPI.Utility;
using Kyoo.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Web;

namespace Kyoo.InternalAPI.MetadataProvider
{
    [MetaProvider]
    public class ProviderTheTvDB : HelperTvDB, IMetadataProvider
    {
#pragma warning disable CS1998 // Async method lacks 'await' operators and will run synchronously
        public async Task<Collection> GetCollectionFromName(string name)
#pragma warning restore CS1998 // Async method lacks 'await' operators and will run synchronously
        {
            return new Collection(-1, Slugifier.ToSlug(name), name, null, null);
        }

        public async Task<Show> GetShowFromName(string showName, string showPath)
        {
            string token = await Authentificate();

            if (token != null)
            {
                WebRequest request = WebRequest.Create("https://api.thetvdb.com/search/series?name=" + HttpUtility.UrlEncode(showName));
                request.Method = "GET";
                request.Timeout = 12000;
                request.ContentType = "application/json";
                request.Headers.Add(HttpRequestHeader.Authorization, "Bearer " + token);

                try
                {
                    HttpWebResponse response = (HttpWebResponse)await request.GetResponseAsync();

                    if (response.StatusCode == HttpStatusCode.OK)
                    {
                        Stream stream = response.GetResponseStream();
                        using (StreamReader reader = new StreamReader(stream))
                        {
                            string content = await reader.ReadToEndAsync();
                            stream.Close();
                            response.Close();

                            dynamic obj = JsonConvert.DeserializeObject(content);
                            dynamic data = obj.data[0];

                            Show show = new Show(-1,
                                ToSlug(showName),
                                (string)data.seriesName,
                                ((JArray)data.aliases).ToObject<IEnumerable<string>>(),
                                showPath,
                                (string)data.overview,
                                null, //trailer
                                null, //genres (no info with this request)
                                GetStatus((string)data.status),
                                GetYear((string)data.firstAired),
                                null, //endYear
                                string.Format("{0}={1}|", Provider, (string)data.id));
                            return (await GetShowByID(GetID(show.ExternalIDs))).Set(show.Slug, show.Path) ?? show;
                        }
                    }
                    else
                    {
                        Debug.WriteLine("&TheTvDB Provider couldn't work for this show: " + showName + ".\nError Code: " + response.StatusCode + " Message: " + response.StatusDescription);
                        response.Close();
                    }
                }
                catch (WebException ex)
                {
                    Debug.WriteLine("&TheTvDB Provider couldn't work for this show: " + showName + ".\nError Code: " + ex.Status);
                }
            }

            return new Show() { Slug = ToSlug(showName), Title = showName, Path = showPath };
        }

        public async Task<Show> GetShowByID(string id)
        {
            string token = await Authentificate();

            if (token == null)
                return null;

            WebRequest request = WebRequest.Create("https://api.thetvdb.com/series/" + id);
            request.Method = "GET";
            request.Timeout = 12000;
            request.ContentType = "application/json";
            request.Headers.Add(HttpRequestHeader.Authorization, "Bearer " + token);

            try
            {
                HttpWebResponse response = (HttpWebResponse)await request.GetResponseAsync();

                if (response.StatusCode == HttpStatusCode.OK)
                {
                    Stream stream = response.GetResponseStream();
                    using (StreamReader reader = new StreamReader(stream))
                    {
                        string content = await reader.ReadToEndAsync();
                        stream.Close();
                        response.Close();

                        dynamic model = JsonConvert.DeserializeObject(content);
                        dynamic data = model.data;

                        Show show = new Show(-1, 
                            null, //Slug
                            (string)data.seriesName,
                            ((JArray)data.aliases).ToObject<IEnumerable<string>>(),
                            null, //Path
                            (string)data.overview,
                            null, //Trailer
                            GetGenres(((JArray)data.genre).ToObject<string[]>()),
                            GetStatus((string)data.status),
                            GetYear((string)data.firstAired),
                            null, //endYear
                            string.Format("TvDB={0}|", id));
                        await GetImages(show);
                        return show;
                    }
                }
                else
                {
                    Debug.WriteLine("&TheTvDB Provider couldn't work for the show with the id: " + id + ".\nError Code: " + response.StatusCode + " Message: " + response.StatusDescription);
                    response.Close();
                    return null;
                }
            }
            catch(WebException ex)
            {
                Debug.WriteLine("&TheTvDB Provider couldn't work for the show with the id: " + id + ".\nError Code: " + ex.Status);
                return null;
            }
        }

        public async Task<Show> GetImages(Show show)
        {
            Debug.WriteLine("&Getting images for: " + show.Title);
            string id = GetID(show.ExternalIDs);

            if (id == null)
                return show;

            string token = await Authentificate();

            if (token == null)
                return show;

            Dictionary<ImageType, string> imageTypes = new Dictionary<ImageType, string> { { ImageType.Poster, "poster" }, { ImageType.Background, "fanart" } };

            foreach (KeyValuePair<ImageType, string> type in imageTypes)
            {
                try
                {
                    WebRequest request = WebRequest.Create("https://api.thetvdb.com/series/" + id + "/images/query?keyType=" + type.Value);
                    request.Method = "GET";
                    request.Timeout = 12000;
                    request.ContentType = "application/json";
                    request.Headers.Add(HttpRequestHeader.Authorization, "Bearer " + token);

                    HttpWebResponse response = (HttpWebResponse)await request.GetResponseAsync();

                    if (response.StatusCode == HttpStatusCode.OK)
                    {
                        Stream stream = response.GetResponseStream();
                        using (StreamReader reader = new StreamReader(stream))
                        {
                            string content = await reader.ReadToEndAsync();
                            stream.Close();
                            response.Close();

                            dynamic model = JsonConvert.DeserializeObject(content);
                            //Should implement language selection here
                            dynamic data = ((IEnumerable<dynamic>)model.data).OrderByDescending(x => x.ratingsInfo.average).ThenByDescending(x => x.ratingsInfo.count).FirstOrDefault();
                            SetImage(show, "https://www.thetvdb.com/banners/" + data.fileName, type.Key);
                        }
                    }
                    else
                    {
                        Debug.WriteLine("&TheTvDB Provider couldn't get " + type + " for the show with the id: " + id + ".\nError Code: " + response.StatusCode + " Message: " + response.StatusDescription);
                        response.Close();
                    }
                }
                catch (WebException ex)
                {
                    Debug.WriteLine("&TheTvDB Provider couldn't get " + type + " for the show with the id: " + id + ".\nError Code: " + ex.Status);
                }
            }

            return show;
        }

#pragma warning disable CS1998 // Async method lacks 'await' operators and will run synchronously
        public async Task<Season> GetSeason(string showName, long seasonNumber)
#pragma warning restore CS1998 // Async method lacks 'await' operators and will run synchronously
        {
            return new Season(-1, -1, seasonNumber, "Season " + seasonNumber, null, null, null, null);
        }

        public Task<string> GetSeasonImage(string showName, long seasonNumber)
        {
            return null;
        }

        public async Task<Episode> GetEpisode(string externalIDs, long seasonNumber, long episodeNumber, long absoluteNumber, string episodePath)
        {
            string id = GetID(externalIDs);

            if (id == null)
                return new Episode(seasonNumber, episodeNumber, absoluteNumber, null, null, null, -1, null, externalIDs);

            string token = await Authentificate();

            if (token == null)
                return new Episode(seasonNumber, episodeNumber, absoluteNumber, null, null, null, -1, null, externalIDs);

            WebRequest request;
            if(absoluteNumber != -1)
                request = WebRequest.Create("https://api.thetvdb.com/series/" + id + "/episodes/query?absoluteNumber=" + absoluteNumber);
            else
                request = WebRequest.Create("https://api.thetvdb.com/series/" + id + "/episodes/query?airedSeason=" + seasonNumber + "&airedEpisode=" + episodeNumber);

            request.Method = "GET";
            request.Timeout = 12000;
            request.ContentType = "application/json";
            request.Headers.Add(HttpRequestHeader.Authorization, "Bearer " + token);

            try
            {
                HttpWebResponse response = (HttpWebResponse)await request.GetResponseAsync();

                if (response.StatusCode == HttpStatusCode.OK)
                {
                    Stream stream = response.GetResponseStream();
                    using (StreamReader reader = new StreamReader(stream))
                    {
                        string content = await reader.ReadToEndAsync();
                        stream.Close();
                        response.Close();

                        dynamic data = JsonConvert.DeserializeObject(content);
                        dynamic episode = data.data[0];

                        DateTime dateTime = DateTime.ParseExact((string)episode.firstAired, "yyyy-MM-dd", CultureInfo.InvariantCulture);

                        if (absoluteNumber == -1)
                            absoluteNumber = (long?)episode.absoluteNumber ?? -1;
                        else
                        {
                            seasonNumber = episode.airedSeason;
                            episodeNumber = episode.airedEpisodeNumber;
                        }


                        return new Episode(seasonNumber, episodeNumber, absoluteNumber, (string)episode.episodeName, (string)episode.overview, dateTime, -1, "https://www.thetvdb.com/banners/" + episode.filename, string.Format("TvDB={0}|", episode.id));
                    }
                }
                else
                {
                    Debug.WriteLine("&TheTvDB Provider couldn't work for the episode number: " + episodeNumber + ".\nError Code: " + response.StatusCode + " Message: " + response.StatusDescription);
                    response.Close();
                    return new Episode(seasonNumber, episodeNumber, absoluteNumber, null, null, null, -1, null, externalIDs);
                }
            }
            catch (WebException ex)
            {
                Debug.WriteLine("&TheTvDB Provider couldn't work for the episode number: " + episodeNumber + ".\nError Code: " + ex.Status);
                return new Episode(seasonNumber, episodeNumber, absoluteNumber, null, null, null, -1, null, externalIDs);
            }
        }

        public async Task<List<People>> GetPeople(string externalIDs)
        {
            string id = GetID(externalIDs);

            if (id == null)
                return null;

            string token = await Authentificate();

            if (token == null)
                return null;

            WebRequest request = WebRequest.Create("https://api.thetvdb.com/series/" + id + "/actors");
            request.Method = "GET";
            request.Timeout = 12000;
            request.ContentType = "application/json";
            request.Headers.Add(HttpRequestHeader.Authorization, "Bearer " + token);

            try
            {
                HttpWebResponse response = (HttpWebResponse)await request.GetResponseAsync();

                if (response.StatusCode == HttpStatusCode.OK)
                {
                    Stream stream = response.GetResponseStream();
                    using (StreamReader reader = new StreamReader(stream))
                    {
                        string content = await reader.ReadToEndAsync();
                        stream.Close();
                        response.Close();

                        dynamic data = JsonConvert.DeserializeObject(content);
                        return (((IEnumerable<dynamic>)data.data).OrderBy(x => x.sortOrder)).ToList().ConvertAll(x => { return new People(-1, ToSlug((string)x.name), (string)x.name, (string)x.role, null, "https://www.thetvdb.com/banners/" + (string)x.image, string.Format("TvDB={0}|", x.id)); });
                    }
                }
                else
                {
                    Debug.WriteLine("&TheTvDB Provider couldn't work for the actors of the show: " + id + ".\nError Code: " + response.StatusCode + " Message: " + response.StatusDescription);
                    response.Close();
                    return null;
                }
            }
            catch (WebException ex)
            {
                Debug.WriteLine("&TheTvDB Provider couldn't work for the actors of the show: " + id + ".\nError Code: " + ex.Status);
                return null;
            }
        }
    }
}
