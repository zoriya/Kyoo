using System.Text.RegularExpressions;

namespace Kyoo.Controllers.Utility
{
    public class Slugifier
    {
        public static string ToSlug(string showTitle)
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
