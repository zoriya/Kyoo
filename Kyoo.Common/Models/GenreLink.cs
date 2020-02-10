namespace Kyoo.Models
{
	public class GenreLink
	{
		// TODO Make json serializer ignore this class and only serialize the Genre child.
		// TODO include this class in the EF workflows.
		
		public long ShowID { get; set; }
		public virtual Show Show { get; set; }
		public long GenreID { get; set; }
		public virtual Genre Genre { get; set; }
	}
}