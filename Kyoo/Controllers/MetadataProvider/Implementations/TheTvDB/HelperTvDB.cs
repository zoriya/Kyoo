using Kyoo.Models;
using Newtonsoft.Json;
using System;
using System.Diagnostics;
using System.Net;
using System.Net.Http;
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

            HttpClient client = new HttpClient();
            HttpContent content = new StringContent("{ \"apikey\": \"IM2OXA8UHUIU0GH6\" }", Encoding.UTF8, "application/json"); 
            
            try
            {
                HttpResponseMessage response = await client.PostAsync("https://api.thetvdb.com/login", content);
                
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    string resp = await response.Content.ReadAsStringAsync();
                    var obj = new {Token = ""};
                    
                    token = JsonConvert.DeserializeAnonymousType(resp, obj).Token;
                    tokenDate = DateTime.UtcNow;
                    return token;
                }
                Debug.WriteLine("&Couldn't authentificate in TheTvDB API.\nError status: " + response.StatusCode + " Message: " + response.RequestMessage);
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
