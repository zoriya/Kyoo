using Kyoo.Models.Attributes;

namespace Kyoo.Models
{
	public class PeopleRole : IResource
	{
		[SerializeIgnore] public int ID { get; set; }
		[SerializeIgnore] public string Slug => ForPeople ? Show.Slug : People.Slug;
		[SerializeIgnore] public bool ForPeople;
		[SerializeIgnore] public int PeopleID { get; set; }
		[SerializeIgnore] public virtual People People { get; set; }
		[SerializeIgnore] public int ShowID { get; set; }
		[SerializeIgnore] public virtual Show Show { get; set; }
		public string Role { get; set; }
		public string Type { get; set; }
	}
}