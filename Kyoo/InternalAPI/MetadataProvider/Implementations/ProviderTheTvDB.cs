using Kyoo.Models;
using Newtonsoft.Json;
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace Kyoo.InternalAPI.MetadataProvider
{
    public class ProviderTheTvDB : ProviderHelper, IMetadataProvider
    {
        public override string Provider => "TvDB";

        private struct DataTvDB
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


        async Task<string> Authentificate()
        {
            WebRequest request = WebRequest.Create("https://api.thetvdb.com/login");
            request.Method = "POST";
            request.Timeout = 12000;
            request.ContentType = "application/json";

            string json = "{ \"apikey\": \"IM2OXA8UHUIU0GH6\" }";
            byte[] bytes = Encoding.ASCII.GetBytes(json);

            request.ContentLength = bytes.Length;

            using (Stream stream = request.GetRequestStream())
            {
                stream.Write(bytes, 0, bytes.Length);
            }

            HttpWebResponse response = (HttpWebResponse)await request.GetResponseAsync();
            if(response.StatusCode == HttpStatusCode.OK)
            {
                Stream stream = response.GetResponseStream();
                using (StreamReader reader = new StreamReader(stream))
                {
                    string content = await reader.ReadToEndAsync();
                    stream.Close();
                    response.Close();

                    var obj = new { Token = "" };
                    return JsonConvert.DeserializeAnonymousType(content, obj).Token;
                }
            }
            else
                Debug.WriteLine("&Couldn't authentificate in TheTvDB API.\nError status: " + response.StatusCode + " Message: " + response.StatusDescription);

            return null;
        }


        public async Task<Show> GetShowFromName(string showName)
        {
            string token = await Authentificate();
            Debug.WriteLine("&Sucess, token = " + token);

            if (token != null)
            {
                WebRequest request = WebRequest.Create("https://api.thetvdb.com/search/series?name=" + HttpUtility.HtmlEncode(showName));
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

                        var model = new { data = new DataTvDB[0] };
                        DataTvDB data = JsonConvert.DeserializeAnonymousType(content, model).data[0];

                        long? startYear = null;
                        if (!long.TryParse(data.firstAired?.Substring(4), out long year))
                            startYear = year;

                        Show show = new Show(-1, ToSlug(showName), data.seriesName, data.aliases?.ToList(), data.overview, null, startYear, null, null, null, null, null, null, string.Format("{0}={1}|", Provider, data.id));
                        return await GetShowFromID(show.ExternalIDs) ?? show;
                    }
                }
                else
                {
                    Debug.WriteLine("&TheTvDB Provider couldn't work for this show: " + showName + ".\nError Code: " + response.StatusCode + " Message: " + response.StatusDescription);
                    response.Close();
                }
            }

            return new Show() { Slug = ToSlug(showName), Title = showName };
        }

        public async Task<Show> GetShowFromID(string externalIDs)
        {
            string id = GetId(externalIDs);

            if (id == null)
                return null;

            string token = await Authentificate();

            if (token == null)
                return null;

            WebRequest request = WebRequest.Create("https://api.thetvdb.com/search/series/" + id);
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

                    var model = new { data = new DataTvDB[0] };
                    DataTvDB data = JsonConvert.DeserializeAnonymousType(content, model).data[0];

                    long? startYear = null;
                    if (!long.TryParse(data.firstAired?.Substring(4), out long year))
                        startYear = year;

                    Show show = new Show(-1, ToSlug(showName), data.seriesName, data.aliases?.ToList(), data.overview, null, startYear, null, null, null, null, null, null, string.Format("TvDB={0}|", data.id));
                    return await GetShowFromID(show.ExternalIDs) ?? show;
                }
            }
            else
            {
                Debug.WriteLine("&TheTvDB Provider couldn't work for the show with the id: " + id + ".\nError Code: " + response.StatusCode + " Message: " + response.StatusDescription);
                response.Close();
                return null;
            }
        }
    }
}
