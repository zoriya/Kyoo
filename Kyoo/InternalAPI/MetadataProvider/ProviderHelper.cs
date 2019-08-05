using System.Text;
using System.Text.RegularExpressions;

namespace Kyoo.InternalAPI.MetadataProvider
{
    public abstract class ProviderHelper
    {
        public abstract string Provider { get; }
        
        public string GetId(string externalIDs)
        {
            if (externalIDs.Contains(Provider))
            {
                int startIndex = externalIDs.IndexOf(Provider) + Provider.Length;
                return externalIDs.Substring(startIndex, externalIDs.IndexOf('|', startIndex) - startIndex);
            }
            else
                return null;
        }

        public string ToSlug(string showTitle)
        {
            if (showTitle == null)
                return null;

            //First to lower case 
            showTitle = showTitle.ToLowerInvariant();

            //Remove all accents
            //var bytes = Encoding.GetEncoding("Cyrillic").GetBytes(showTitle);
            //showTitle = Encoding.ASCII.GetString(bytes);

            //Replace spaces 
            showTitle = Regex.Replace(showTitle, @"\s", "-", RegexOptions.Compiled);

            //Remove invalid chars 
            showTitle = Regex.Replace(showTitle, @"[^\w\s\p{Pd}]", "", RegexOptions.Compiled);

            //Trim dashes from end 
            showTitle = showTitle.Trim('-', '_');

            //Replace double occurences of - or \_ 
            showTitle = Regex.Replace(showTitle, @"([-_]){2,}", "$1", RegexOptions.Compiled);

            return showTitle;
        }
    }
}
