using Kyoo.Models;
using Newtonsoft.Json;
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Kyoo.InternalAPI.MetadataProvider.TheTvDB
{
    public class HelperTvDB : ProviderHelper
    {
        public override string Provider => "TvDB";

        private string token;
        private DateTime tokenDate;

        protected async Task<string> Authentificate()
        {
            if (DateTime.Now.Subtract(tokenDate) < TimeSpan.FromDays(1))
                return token;

            WebRequest request = WebRequest.Create("https://api.thetvdb.com/login");
            request.Method = "POST";
            request.Timeout = 12000;
            request.ContentType = "application/json";

            string json = "{ \"apikey\": \"IM2OXA8UHUIU0GH6\" }";
            byte[] bytes = Encoding.ASCII.GetBytes(json);

            request.ContentLength = bytes.Length;

            await using (Stream stream = request.GetRequestStream())
            {
                stream.Write(bytes, 0, bytes.Length);
            }

            try
            {
                HttpWebResponse response = (HttpWebResponse)await request.GetResponseAsync();
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    Stream stream = response.GetResponseStream();
                    if (stream != null)
                    {
                        using StreamReader reader = new StreamReader(stream);

                        string content = await reader.ReadToEndAsync();
                        stream.Close();
                        response.Close();

                        var obj = new {Token = ""};
                        token = JsonConvert.DeserializeAnonymousType(content, obj).Token;
                        tokenDate = DateTime.UtcNow;
                        return token;
                    }
                }
                Debug.WriteLine("&Couldn't authentificate in TheTvDB API.\nError status: " + response.StatusCode + " Message: " + response.StatusDescription);
            }
            catch (WebException ex)
            {
                Debug.WriteLine("&Couldn't authentificate in TheTvDB API.\nError status: " + ex.Status);
                return null;
            }
            return null;
        }


        protected static long? GetYear(string firstAired)
        {
            if (firstAired?.Length >= 4 && long.TryParse(firstAired.Substring(0, 4), out long year))
                return year;

            return null;
        }

        public Status? GetStatus(string status)
        {
            if (status == "Ended")
                return Status.Finished;
            if (status == "Continuing")
                return Status.Airing;
            return null;
        }
    }
}
