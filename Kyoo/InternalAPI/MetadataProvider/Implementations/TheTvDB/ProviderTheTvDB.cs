using Kyoo.InternalAPI.MetadataProvider.TheTvDB;
using Kyoo.Models;
using Newtonsoft.Json;
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
        private struct SearchTbDB
        {
            public string seriesName;
            public string overview;
            public string slug;
            public string network;
            public string status;
            public int id;
            public string firstAired;
            public string banner;
            public string[] aliases;
        }

        private struct DataTvDb
        {
            public string seriesName;
            public string overview;
            public string slug;
            public string network;
            public string status;

            public int id;
            public string seriesId;
            public string imdbId;
            public string zap2itId;

            public string firstAired;
            public string banner;
            public string[] aliases;
            public string[] genre;

            public string added;
            public string airsDayOfWeek;
            public string airsTime;
            public string lastUpdated;
            public string runtime;

            public string networkId;
            public string rating;
            public float siteRating;
            public int siteRatingCount;
        }

        private struct RatingInfo
        {
            public float average;
            public int count;
        }
        private struct ImageTvDb
        {
            public string fileName;
            public int id;
            public string keyType;
            public int languageId;
            public RatingInfo ratingsInfo;
            public string resolution;
            public string subKey;
            public string thumbnail;
        }

        private struct ErrorsTvDB
        {
            public string[] invalidFilters;
            public string invalidLanguage;
            public string[] invalidQueryParams;
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

                            var model = new { data = new SearchTbDB[0] };
                            SearchTbDB data = JsonConvert.DeserializeAnonymousType(content, model).data[0];                            

                            Show show = new Show(-1,
                                ToSlug(showName),
                                data.seriesName,
                                data.aliases,
                                showPath,
                                data.overview,
                                null, //trailer
                                null, //genres (no info with this request)
                                GetStatus(data.status),
                                GetYear(data.firstAired),
                                null, //endYear
                                string.Format("{0}={1}|", Provider, data.id));
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

                        var model = new { data = new DataTvDb(), errors = new ErrorsTvDB() };
                        DataTvDb data = JsonConvert.DeserializeAnonymousType(content, model).data;

                        Show show = new Show(-1, 
                            null, //Slug
                            data.seriesName,
                            data.aliases,
                            null, //Path
                            data.overview,
                            null, //Trailer
                            GetGenres(data.genre),
                            GetStatus(data.status),
                            GetYear(data.firstAired),
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

                            var model = new { data = new ImageTvDb[0], error = new ErrorsTvDB() };
                            //Should implement language selection here
                            ImageTvDb data = JsonConvert.DeserializeAnonymousType(content, model).data.OrderByDescending(x => x.ratingsInfo.average).ThenByDescending(x => x.ratingsInfo.count).FirstOrDefault();
                            IEnumerable<ImageTvDb> datas = JsonConvert.DeserializeAnonymousType(content, model).data.OrderByDescending(x => x.ratingsInfo.average).ThenByDescending(x => x.ratingsInfo.count);
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
                            absoluteNumber = episode.absoluteNumber as long? ?? -1;
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
