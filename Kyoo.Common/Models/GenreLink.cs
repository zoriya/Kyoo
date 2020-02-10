namespace Kyoo.Models
{
	public class GenreLink
	{
		public long ShowID { get; set; }
		public virtual Show Show { get; set; }
		public long GenreID { get; set; }
		public virtual Genre Genre { get; set; }

		public GenreLink() {}
		
		public GenreLink(Show show, Genre genre)
		{
			Show = show;
			Genre = genre;
		}
	}
}