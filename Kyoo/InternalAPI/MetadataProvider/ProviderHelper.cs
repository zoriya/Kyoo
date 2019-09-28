using Kyoo.Models;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;

namespace Kyoo.InternalAPI.MetadataProvider
{
    public abstract class ProviderHelper
    {
        public abstract string Provider { get; }
        
        public string GetID(string externalIDs)
        {
            if (externalIDs?.Contains(Provider) == true)
            {
                int startIndex = externalIDs.IndexOf(Provider) + Provider.Length + 1; //The + 1 is for the '='
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

        public enum ImageType { Poster, Background, Thumbnail, Logo }

        public void SetImage(Show show, string imgUrl, ImageType type)
        {
            switch(type)
            {
                case ImageType.Poster:
                    show.ImgPrimary = imgUrl;
                    break;
                case ImageType.Thumbnail:
                    show.ImgThumb = imgUrl;
                    break;
                case ImageType.Logo:
                    show.ImgLogo = imgUrl;
                    break;
                case ImageType.Background:
                    show.ImgBackdrop = imgUrl;
                    break;
                default:
                    break;
            }
        }

        public IEnumerable<Genre> GetGenres(string[] input)
        {
            List<Genre> genres = new List<Genre>();

            foreach (string genre in input)
                genres.Add(new Genre(ToSlug(genre), genre));

            return genres;
        }
    }
}
