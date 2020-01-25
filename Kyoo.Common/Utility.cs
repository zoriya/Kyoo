using System.Text.RegularExpressions;
using Kyoo.Models;

namespace Kyoo
{
    public interface IMergable<T>
    {
        public T Merge(T other);
    }
    
	public static class Utility
	{
        public static string ToSlug(string name)
        {
            if (name == null)
                return null;

            //First to lower case 
            name = name.ToLowerInvariant();

            //Remove all accents
            //var bytes = Encoding.GetEncoding("Cyrillic").GetBytes(showTitle);
            //showTitle = Encoding.ASCII.GetString(bytes);

            //Replace spaces 
            name = Regex.Replace(name, @"\s", "-", RegexOptions.Compiled);

            //Remove invalid chars 
            name = Regex.Replace(name, @"[^\w\s\p{Pd}]", "", RegexOptions.Compiled);

            //Trim dashes from end 
            name = name.Trim('-', '_');

            //Replace double occurences of - or \_ 
            name = Regex.Replace(name, @"([-_]){2,}", "$1", RegexOptions.Compiled);

            return name;
        }
        
        
		public static void SetImage(Show show, string imgUrl, ImageType type)
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
	}
}